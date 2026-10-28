import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import { resolveSessionUser } from '../lib/auth'
import { ApplicationValidationError, parseApplicationComment, parseCompanyApplicationStatus, validateCompanyApplicationTransition } from './applicationValidation'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const labels: Record<string, string> = {
  IN_REVIEW: 'En revisión', SHORTLISTED: 'Preseleccionada', INTERVIEW: 'Entrevista',
  SELECTED: 'Seleccionada', REJECTED: 'No seleccionada',
}

async function requireCompany(request: FastifyRequest, reply: FastifyReply, db: typeof prisma) {
  const user = await resolveSessionUser(request, db)
  if (!user) { reply.code(401).send({ message: 'Inicia sesión para continuar.' }); return null }
  if (user.role !== 'COMPANY') { reply.code(403).send({ message: 'Esta operación es exclusiva de cuentas de empresa.' }); return null }
  const company = await db.companyProfile.findUnique({ where: { ownerUserId: user.id }, select: { id: true } })
  if (!company) { reply.code(404).send({ message: 'Completa primero el perfil de tu empresa.' }); return null }
  return { user, company }
}

export async function registerCompanyApplicationRoutes(app: FastifyInstance, db: typeof prisma) {
  app.get('/api/company/applications', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    const query = request.query as Record<string, unknown>
    const jobId = query.jobId
    if (jobId !== undefined && (typeof jobId !== 'string' || !UUID_PATTERN.test(jobId))) {
      return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    }
    const pageRaw = query.page === undefined ? '1' : String(query.page)
    const page = Number(pageRaw)
    if (!Number.isInteger(page) || page < 1 || page > 10000) return reply.code(400).send({ message: 'La página solicitada no es válida.' })
    const pageSize = 25
    const where = { job: { companyProfileId: context.company.id, ...(jobId ? { id: jobId } : {}) } }
    const [total, applications] = await Promise.all([
      db.application.count({ where }),
      db.application.findMany({
        where, orderBy: { appliedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
        select: {
          id: true, status: true, appliedAt: true,
          job: { select: { id: true, title: true } },
          // Contact details and photo identifiers stay private; the CV identifier is included for applicants only.
          candidateProfile: { select: {
            firstName: true, lastName: true, description: true, cvUrl: true,
            professionalArea: { select: { name: true } }, specialization: { select: { name: true } },
            department: { select: { name: true } }, municipality: { select: { name: true } },
            experiences: { orderBy: { startDate: 'desc' }, select: { position: true, company: true, startDate: true, endDate: true, description: true } },
            education: { orderBy: { endDate: 'desc' }, select: { institution: true, degree: true, startDate: true, endDate: true } },
            languages: { select: { level: true, language: { select: { name: true } } } },
          } },
          statusHistory: { orderBy: { createdAt: 'asc' }, select: { previousStatus: true, newStatus: true, comment: true, createdAt: true } },
        },
      }),
    ])
    return { applications, page, pageSize, total, pages: Math.ceil(total / pageSize) }
  })

  app.patch('/api/company/applications/:id/status', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'El identificador de postulación no es válido.' })
    const body = request.body as { status?: unknown; comment?: unknown } | null
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['status', 'comment'].includes(key))) return reply.code(400).send({ message: 'Los datos de actualización no son válidos.' })
    let comment: string | null
    try { parseCompanyApplicationStatus(body.status); comment = parseApplicationComment(body.comment) }
    catch (error) { if (error instanceof ApplicationValidationError) return reply.code(400).send({ message: error.message }); throw error }
    const result = await db.$transaction(async tx => {
        const application = await tx.application.findFirst({
          where: { id, job: { companyProfileId: context.company.id } },
          select: { id: true, status: true, candidateProfile: { select: { userId: true } }, job: { select: { title: true } } },
        })
        if (!application) return { code: 404 as const, message: 'No se encontró la postulación.' }
        let status
        try { status = validateCompanyApplicationTransition(application.status, body.status) }
        catch (error) { if (error instanceof ApplicationValidationError) return { code: 409 as const, message: error.message }; throw error }
        await tx.application.update({ where: { id }, data: { status } })
        await tx.applicationStatusHistory.create({ data: {
          applicationId: id, previousStatus: application.status, newStatus: status,
          changedByUserId: context.user.id, comment,
        } })
        await tx.notification.create({ data: {
          userId: application.candidateProfile.userId, type: 'APPLICATION_STATUS_CHANGED',
          title: 'Actualización de tu postulación', body: `${application.job.title}: ${labels[status]}.`,
          link: '/candidate/applications',
        } })
        await tx.auditLog.create({ data: {
          actorUserId: context.user.id, actionType: 'APPLICATION_STATUS_CHANGED', entityType: 'Application', entityId: id,
          metadata: { previousStatus: application.status, status, jobTitle: application.job.title },
        } })
        return { code: 200 as const, status: status as string }
    }, { isolationLevel: 'Serializable' })
    if ('message' in result) return reply.code(result.code).send({ message: result.message })
    return { application: { id, status: result.status } }
  })
}
