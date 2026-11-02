import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import { resolveSessionUser } from '../lib/auth'
import { JobValidationError, parseJobInput, validateJobStatusTransition } from './jobsValidation'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function requireCompany(request: FastifyRequest, reply: FastifyReply, db: typeof prisma) {
  const user = await resolveSessionUser(request, db)
  if (!user) {
    reply.code(401).send({ message: 'Inicia sesión para continuar.' })
    return null
  }
  if (user.role !== 'COMPANY') {
    reply.code(403).send({ message: 'Esta operación es exclusiva de cuentas de empresa.' })
    return null
  }
  const company = await db.companyProfile.findUnique({
    where: { ownerUserId: user.id },
    select: { id: true, verificationStatus: true },
  })
  if (!company) {
    reply.code(404).send({ message: 'Completa primero el perfil de tu empresa.' })
    return null
  }
  return { user, company }
}

async function validateCatalogRelations(db: typeof prisma, input: ReturnType<typeof parseJobInput>) {
  const area = await db.professionalArea.findFirst({ where: { id: input.professionalAreaId, isActive: true }, select: { id: true } })
  if (!area) throw new JobValidationError('Selecciona un área profesional activa.')
  if (input.specializationId) {
    const specialization = await db.specialization.findFirst({ where: { id: input.specializationId, professionalAreaId: input.professionalAreaId, isActive: true }, select: { id: true } })
    if (!specialization) throw new JobValidationError('La especialidad debe pertenecer al área seleccionada.')
  }
  if (input.departmentId && !await db.department.findUnique({ where: { id: input.departmentId }, select: { id: true } })) {
    throw new JobValidationError('Selecciona un departamento válido.')
  }
  if (input.municipalityId) {
    const municipality = await db.municipality.findUnique({ where: { id: input.municipalityId }, select: { departmentId: true } })
    if (!municipality || !input.departmentId || municipality.departmentId !== input.departmentId) {
      throw new JobValidationError('El municipio debe pertenecer al departamento seleccionado.')
    }
  }
}

function jobSelect() {
  return {
    id: true, title: true, description: true, requirements: true,
    professionalAreaId: true, specializationId: true, departmentId: true, municipalityId: true,
    professionalArea: { select: { name: true } },
    workMode: true, remoteScope: true, contractType: true, workday: true,
    scheduleType: true, scheduleDescription: true, salaryMin: true, salaryMax: true,
    salaryCurrency: true, salaryPeriod: true, salaryNegotiable: true,
    experienceYearsMin: true, isUrgent: true, vacancies: true, status: true,
    publishedAt: true, expiresAt: true, archivedAt: true, createdAt: true, updatedAt: true,
    _count: { select: { applications: true, views: true } },
  }
}

export async function registerJobManagementRoutes(app: FastifyInstance, db: typeof prisma) {
  app.get('/api/company/job-options', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    const [professionalAreas, specializations, departments, municipalities] = await Promise.all([
      db.professionalArea.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.specialization.findMany({ where: { isActive: true }, select: { id: true, name: true, professionalAreaId: true }, orderBy: [{ name: 'asc' }] }),
      db.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.municipality.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
    ])
    return {
      companyVerificationStatus: context.company.verificationStatus,
      professionalAreas, specializations, departments, municipalities,
    }
  })

  app.get('/api/company/jobs', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    const jobs = await db.job.findMany({
      where: { companyProfileId: context.company.id, archivedAt: null }, orderBy: { createdAt: 'desc' },
      select: jobSelect(),
    })
    return { jobs }
  })

  app.post('/api/company/jobs', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    let input
    try { input = parseJobInput(request.body) }
    catch (error) { if (error instanceof JobValidationError) return reply.code(400).send({ message: error.message }); throw error }
    try { await validateCatalogRelations(db, input) }
    catch (error) { if (error instanceof JobValidationError) return reply.code(400).send({ message: error.message }); throw error }
    const job = await db.job.create({
      data: { ...input, companyProfileId: context.company.id, createdByUserId: context.user.id, status: 'DRAFT' },
      select: jobSelect(),
    })
    return reply.code(201).send({ job })
  })

  app.patch('/api/company/jobs/:id', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    const existing = await db.job.findFirst({ where: { id, companyProfileId: context.company.id } })
    if (!existing) return reply.code(404).send({ message: 'No se encontró la vacante.' })
    if (existing.status === 'CLOSED' || existing.status === 'REMOVED') return reply.code(409).send({ message: 'Una vacante cerrada o retirada no se puede editar.' })
    let input
    try { input = parseJobInput(request.body, existing as unknown as Record<string, unknown>) }
    catch (error) { if (error instanceof JobValidationError) return reply.code(400).send({ message: error.message }); throw error }
    try { await validateCatalogRelations(db, input) }
    catch (error) { if (error instanceof JobValidationError) return reply.code(400).send({ message: error.message }); throw error }
    const job = await db.job.update({ where: { id }, data: input, select: jobSelect() })
    return { job }
  })

  app.patch('/api/company/jobs/:id/status', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    const body = request.body as { status?: unknown }
    try {
      const result = await db.$transaction(async tx => {
        const existing = await tx.job.findFirst({ where: { id, companyProfileId: context.company.id } })
        if (!existing) return { code: 404 as const, message: 'No se encontró la vacante.' }
        const status = validateJobStatusTransition(existing.status, body?.status)
        if (status === 'PUBLISHED' && context.company.verificationStatus !== 'VERIFIED') {
          return { code: 403 as const, message: 'La empresa debe estar verificada para publicar vacantes.' }
        }
        if (status === 'PUBLISHED' && existing.expiresAt && existing.expiresAt <= new Date()) {
          return { code: 400 as const, message: 'Actualiza la fecha de vencimiento antes de publicar esta vacante.' }
        }
        const job = await tx.job.update({
          where: { id },
          data: { status, ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {}) },
          select: { id: true, title: true, status: true, publishedAt: true },
        })
        await tx.auditLog.create({
          data: {
            actorUserId: context.user.id, actionType: status === 'PUBLISHED' ? 'JOB_PUBLISHED' : 'JOB_STATUS_CHANGED',
            entityType: 'Job', entityId: id, metadata: { previousStatus: existing.status, status },
          },
        })
        return { code: 200 as const, job }
      }, { isolationLevel: 'Serializable' })
      if ('message' in result) return reply.code(result.code).send({ message: result.message })
      return { job: result.job }
    } catch (error) {
      if (error instanceof JobValidationError && /transici.n solicitada/.test(error.message)) return reply.code(409).send({ message: error.message })
      if (error instanceof JobValidationError) return reply.code(400).send({ message: error.message })
      throw error
    }
  })

  app.patch('/api/company/jobs/:id/archive', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'Identificador de vacante no válido.' })
    const job = await db.job.findFirst({ where: { id, companyProfileId: context.company.id }, select: { id: true, status: true, archivedAt: true } })
    if (!job) return reply.code(404).send({ message: 'No se encontró la vacante.' })
    if (!['CLOSED', 'REMOVED'].includes(job.status)) return reply.code(409).send({ message: 'Solo puedes quitar vacantes cerradas o retiradas del resumen.' })
    if (!job.archivedAt) await db.job.update({ where: { id }, data: { archivedAt: new Date() } })
    return { archived: true }
  })

  app.delete('/api/company/jobs/:id', async (request, reply) => {
    const context = await requireCompany(request, reply, db)
    if (!context) return
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    const result = await db.$transaction(async tx => {
      const existing = await tx.job.findFirst({ where: { id, companyProfileId: context.company.id }, select: { id: true, status: true } })
      if (!existing) return { code: 404 as const, message: 'No se encontró la vacante.' }
      if (existing.status !== 'CLOSED') return { code: 409 as const, message: 'Solo puedes eliminar vacantes cerradas.' }
      await tx.job.update({ where: { id }, data: { status: 'REMOVED' } })
      await tx.auditLog.create({
        data: {
          actorUserId: context.user.id, actionType: 'JOB_STATUS_CHANGED', entityType: 'Job', entityId: id,
          metadata: { previousStatus: existing.status, status: 'REMOVED' },
        },
      })
      return { code: 200 as const }
    }, { isolationLevel: 'Serializable' })
    if ('message' in result) return reply.code(result.code).send({ message: result.message })
    return { removed: true }
  })
}
