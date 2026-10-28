import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import { resolveSessionUser } from '../lib/auth'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function requireCandidate(request: FastifyRequest, reply: FastifyReply, db: typeof prisma) {
  const user = await resolveSessionUser(request, db)
  if (!user) { reply.code(401).send({ message: 'Inicia sesión para continuar.' }); return null }
  if (user.role !== 'CANDIDATE') { reply.code(403).send({ message: 'Esta operación es exclusiva de cuentas de candidato.' }); return null }
  const profile = await db.candidateProfile.findUnique({ where: { userId: user.id }, select: { id: true, firstName: true, lastName: true, phone: true, departmentId: true, municipalityId: true, professionalAreaId: true } })
  if (!profile) { reply.code(404).send({ message: 'Completa primero tu perfil de candidato.' }); return null }
  return { user, profile }
}

function isUniqueConstraint(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

async function activePublicJob(db: typeof prisma, id: string) {
  const now = new Date()
  return db.job.findFirst({
    where: { id, status: 'PUBLISHED', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }], company: { verificationStatus: 'VERIFIED' } },
    select: { id: true },
  })
}

export async function registerCandidateJobRoutes(app: FastifyInstance, db: typeof prisma) {
  app.get('/api/candidate/applications', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const applications = await db.application.findMany({
      where: { candidateProfileId: context.profile.id }, orderBy: { appliedAt: 'desc' },
      select: {
        id: true, status: true, appliedAt: true,
        job: { select: { id: true, title: true, status: true, company: { select: { name: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' }, select: { previousStatus: true, newStatus: true, comment: true, createdAt: true } },
      },
    })
    return { applications }
  })

  app.get('/api/candidate/saved-jobs', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const now = new Date()
    const savedJobs = await db.savedJob.findMany({
      where: { candidateProfileId: context.profile.id, job: { status: 'PUBLISHED', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }], company: { verificationStatus: 'VERIFIED' } } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, job: { select: {
        id: true, title: true, workMode: true, contractType: true, salaryMin: true, salaryMax: true,
        salaryCurrency: true, salaryPeriod: true, salaryNegotiable: true, publishedAt: true,
        company: { select: { name: true } }, professionalArea: { select: { name: true } },
        municipality: { select: { name: true } }, department: { select: { name: true } },
      } } },
    })
    return { savedJobs }
  })

  app.get('/api/candidate/jobs/:jobId/state', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const { jobId } = request.params as { jobId: string }
    if (!UUID_PATTERN.test(jobId)) return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    const [application, saved] = await Promise.all([
      db.application.findUnique({ where: { jobId_candidateProfileId: { jobId, candidateProfileId: context.profile.id } }, select: { id: true, status: true } }),
      db.savedJob.findUnique({ where: { candidateProfileId_jobId: { jobId, candidateProfileId: context.profile.id } }, select: { jobId: true } }),
    ])
    return { application, saved: Boolean(saved) }
  })

  app.post('/api/candidate/jobs/:jobId/applications', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const { jobId } = request.params as { jobId: string }
    if (!UUID_PATTERN.test(jobId)) return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    if (!context.profile.firstName.trim() || !context.profile.lastName.trim() || !context.profile.phone || !context.profile.departmentId || !context.profile.municipalityId || !context.profile.professionalAreaId) {
      return reply.code(409).send({ message: 'Completa los datos obligatorios de tu perfil antes de postularte.' })
    }
    const job = await activePublicJob(db, jobId)
    if (!job) return reply.code(404).send({ message: 'La vacante ya no está disponible.' })
    try {
      const application = await db.$transaction(async tx => {
        const stillOpen = await tx.job.findFirst({ where: { id: jobId, status: 'PUBLISHED', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }], company: { verificationStatus: 'VERIFIED' } }, select: { id: true } })
        if (!stillOpen) return null
        const created = await tx.application.create({ data: { jobId, candidateProfileId: context.profile.id, status: 'RECEIVED' }, select: { id: true, status: true, appliedAt: true } })
        await tx.applicationStatusHistory.create({ data: { applicationId: created.id, previousStatus: null, newStatus: 'RECEIVED', changedByUserId: context.user.id, comment: 'Postulación enviada.' } })
        return created
      }, { isolationLevel: 'Serializable' })
      if (!application) return reply.code(404).send({ message: 'La vacante ya no está disponible.' })
      return reply.code(201).send({ application })
    } catch (error) {
      if (isUniqueConstraint(error)) return reply.code(409).send({ message: 'Ya te postulaste a esta vacante.' })
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034') {
        const existing = await db.application.findUnique({ where: { jobId_candidateProfileId: { jobId, candidateProfileId: context.profile.id } }, select: { id: true } })
        if (existing) return reply.code(409).send({ message: 'Ya te postulaste a esta vacante.' })
        return reply.code(409).send({ message: 'La vacante cambió mientras enviabas tu postulación. Actualiza la página e inténtalo de nuevo.' })
      }
      throw error
    }
  })

  app.put('/api/candidate/jobs/:jobId/saved', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const { jobId } = request.params as { jobId: string }
    if (!UUID_PATTERN.test(jobId)) return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    if (!await activePublicJob(db, jobId)) return reply.code(404).send({ message: 'La vacante ya no está disponible.' })
    await db.savedJob.upsert({
      where: { candidateProfileId_jobId: { candidateProfileId: context.profile.id, jobId } },
      create: { candidateProfileId: context.profile.id, jobId }, update: {},
    })
    return { saved: true }
  })

  app.delete('/api/candidate/jobs/:jobId/saved', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const { jobId } = request.params as { jobId: string }
    if (!UUID_PATTERN.test(jobId)) return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    await db.savedJob.deleteMany({ where: { candidateProfileId: context.profile.id, jobId } })
    return { saved: false }
  })

  app.patch('/api/candidate/applications/:id/withdraw', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'El identificador de postulación no es válido.' })
    const result = await db.$transaction(async tx => {
        const application = await tx.application.findFirst({ where: { id, candidateProfileId: context.profile.id }, select: { id: true, status: true } })
        if (!application) return { code: 404 as const, message: 'No se encontró la postulación.' }
        if (!['RECEIVED', 'IN_REVIEW', 'SHORTLISTED', 'INTERVIEW'].includes(application.status)) return { code: 409 as const, message: 'Esta postulación ya no se puede retirar.' }
        await tx.application.update({ where: { id }, data: { status: 'WITHDRAWN' } })
        await tx.applicationStatusHistory.create({ data: { applicationId: id, previousStatus: application.status, newStatus: 'WITHDRAWN', changedByUserId: context.user.id, comment: 'Postulación retirada por el candidato.' } })
        return { code: 200 as const, status: 'WITHDRAWN' as const }
    }, { isolationLevel: 'Serializable' })
    if ('message' in result) return reply.code(result.code).send({ message: result.message })
    return { application: { id, status: result.status } }
  })
}
