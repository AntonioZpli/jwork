import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import { resolveSessionUser } from '../lib/auth'
import type { Prisma } from '../generated/prisma/client'
import { ApplicationValidationError, parseApplicationComment, parseCompanyApplicationStatus, validateCompanyApplicationTransition } from './applicationValidation'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const labels: Record<string, string> = {
  IN_REVIEW: 'En revisión', SHORTLISTED: 'Preseleccionada', INTERVIEW: 'Entrevista',
  SELECTED: 'Aceptada', REJECTED: 'Rechazada',
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
    const searchRaw = query.q
    const statusRaw = query.status
    if (jobId !== undefined && (typeof jobId !== 'string' || !UUID_PATTERN.test(jobId))) {
      return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    }
    if (searchRaw !== undefined && (typeof searchRaw !== 'string' || searchRaw.length > 100)) {
      return reply.code(400).send({ message: 'El texto de búsqueda no es válido.' })
    }
    const allowedStatuses = new Set(['RECEIVED', 'IN_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'])
    if (statusRaw !== undefined && (typeof statusRaw !== 'string' || !allowedStatuses.has(statusRaw))) {
      return reply.code(400).send({ message: 'El estado de postulación no es válido.' })
    }
    const pageRaw = query.page === undefined ? '1' : String(query.page)
    const page = Number(pageRaw)
    if (!Number.isInteger(page) || page < 1 || page > 10000) return reply.code(400).send({ message: 'La página solicitada no es válida.' })
    const pageSize = 25
    const search = typeof searchRaw === 'string' ? searchRaw.trim() : ''
    const where: Prisma.ApplicationWhereInput = {
      job: { is: { companyProfileId: context.company.id, ...(jobId ? { id: jobId } : {}) } },
      status: statusRaw === 'WITHDRAWN'
        ? { equals: 'WITHDRAWN' }
        : statusRaw === 'IN_REVIEW'
          ? { in: ['IN_REVIEW', 'SHORTLISTED'] }
        : { not: 'WITHDRAWN', ...(typeof statusRaw === 'string' ? { equals: statusRaw as Prisma.EnumApplicationStatusFilter['equals'] } : {}) },
      ...(search ? { OR: [
        { candidateProfile: { is: { firstName: { contains: search, mode: 'insensitive' } } } },
        { candidateProfile: { is: { lastName: { contains: search, mode: 'insensitive' } } } },
        { candidateProfile: { is: { professionalArea: { is: { name: { contains: search, mode: 'insensitive' } } } } } },
        { candidateProfile: { is: { specialization: { is: { name: { contains: search, mode: 'insensitive' } } } } } },
      ] } : {}),
    }
    const [candidateGroups, allCandidateGroups] = await Promise.all([
      db.application.groupBy({
        by: ['candidateProfileId'],
        where,
        _max: { appliedAt: true },
        orderBy: [{ _max: { appliedAt: 'desc' } }, { candidateProfileId: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.application.groupBy({ by: ['candidateProfileId'], where }),
    ])
    const candidateIds = candidateGroups.map(group => group.candidateProfileId)
    const applications = candidateIds.length ? await db.application.findMany({
        where: { ...where, candidateProfileId: { in: candidateIds } },
        orderBy: [{ appliedAt: 'desc' }, { id: 'asc' }],
        distinct: ['candidateProfileId'],
        select: {
          id: true, status: true, appliedAt: true,
          job: { select: { id: true, title: true } },
          // The company receives the applicant profile for its own vacancy; contact fields are filtered by status below.
          candidateProfile: { select: {
            firstName: true, lastName: true, contactEmail: true, phone: true, photoUrl: true, description: true, cvUrl: true,
            user: { select: { email: true } },
            professionalArea: { select: { name: true } }, specialization: { select: { name: true } },
            department: { select: { name: true } }, municipality: { select: { name: true } },
            experiences: { orderBy: { startDate: 'desc' }, select: { position: true, company: true, startDate: true, endDate: true, description: true } },
            education: { orderBy: { endDate: 'desc' }, select: { institution: true, degree: true, startDate: true, endDate: true } },
            languages: { select: { level: true, language: { select: { name: true } } } },
          } },
          statusHistory: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { previousStatus: true, newStatus: true, comment: true, createdAt: true } },
        },
      }) : []
    const total = allCandidateGroups.length
    const visibleApplications = applications.map(application => ({
      ...application,
      candidateProfile: {
        ...application.candidateProfile,
        contactEmail: application.candidateProfile.contactEmail?.trim() || application.candidateProfile.user.email,
        phone: application.candidateProfile.phone?.trim() || null,
      },
    }))
    return { applications: visibleApplications, page, pageSize, total, pages: Math.ceil(total / pageSize) }
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
          title: 'Actualización de tu postulación', body: `${application.job.title}: ${status === 'REJECTED' && application.status === 'INTERVIEW' ? 'No aceptada' : labels[status]}.`,
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

  app.post('/api/company/applications/:id/status/undo', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'El identificador de postulación no es válido.' })
    const result = await db.$transaction(async tx => {
      const application = await tx.application.findFirst({
        where: { id, job: { companyProfileId: context.company.id } },
        select: {
          id: true, status: true,
          candidateProfile: { select: { userId: true } },
          job: { select: { title: true } },
          statusHistory: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { previousStatus: true, newStatus: true, comment: true } },
        },
      })
      if (!application) return { code: 404 as const, message: 'No se encontró la postulación.' }
      const changes: typeof application.statusHistory = []
      for (const event of application.statusHistory) {
        if (!event.previousStatus) continue
        if (event.comment === 'Cambio deshecho por la empresa.') {
          const lastChange = changes.at(-1)
          if (lastChange?.previousStatus === event.newStatus && lastChange.newStatus === event.previousStatus) changes.pop()
          continue
        }
        changes.push(event)
      }
      const lastChange = changes.at(-1)
      const previousStatus = lastChange?.previousStatus
      if (!previousStatus || lastChange?.newStatus !== application.status) {
        return { code: 409 as const, message: 'No hay un cambio reciente que se pueda deshacer.' }
      }
      if (!['RECEIVED', 'IN_REVIEW', 'SHORTLISTED', 'INTERVIEW'].includes(previousStatus)) {
        return { code: 409 as const, message: 'El estado anterior ya no se puede restaurar.' }
      }
      await tx.application.update({ where: { id }, data: { status: previousStatus } })
      await tx.applicationStatusHistory.create({ data: {
        applicationId: id, previousStatus: application.status, newStatus: previousStatus,
        changedByUserId: context.user.id, comment: 'Cambio deshecho por la empresa.',
      } })
      const restoredLabel: Record<string, string> = { RECEIVED: 'Recibida', IN_REVIEW: 'En revisión', SHORTLISTED: 'En revisión', INTERVIEW: 'Entrevista' }
      await tx.notification.create({ data: {
        userId: application.candidateProfile.userId, type: 'APPLICATION_STATUS_CHANGED',
        title: 'Actualización de tu postulación', body: `${application.job.title}: estado restablecido a ${restoredLabel[previousStatus] ?? previousStatus}.`,
        link: '/candidate/applications',
      } })
      await tx.auditLog.create({ data: {
        actorUserId: context.user.id, actionType: 'APPLICATION_STATUS_CHANGED', entityType: 'Application', entityId: id,
        metadata: { previousStatus: application.status, status: previousStatus, jobTitle: application.job.title, undone: true },
      } })
      return { code: 200 as const, status: previousStatus }
    }, { isolationLevel: 'Serializable' })
    if ('message' in result) return reply.code(result.code).send({ message: result.message })
    return { application: { id, status: result.status } }
  })
}
