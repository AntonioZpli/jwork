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

function getTotalExperienceYears(experiences: { startDate: Date; endDate: Date | null }[]) {
  const now = Date.now()
  const periods = experiences
    .map(({ startDate, endDate }) => ({ start: startDate.getTime(), end: Math.min(endDate?.getTime() ?? now, now) }))
    .filter(period => period.end > period.start)
    .sort((a, b) => a.start - b.start)
  let totalMilliseconds = 0
  let current: { start: number; end: number } | null = null
  for (const period of periods) {
    if (!current) current = { ...period }
    else if (period.start <= current.end) current.end = Math.max(current.end, period.end)
    else { totalMilliseconds += current.end - current.start; current = { ...period } }
  }
  if (current) totalMilliseconds += current.end - current.start
  return totalMilliseconds / (365.25 * 24 * 60 * 60 * 1000)
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
    const [applications, withdrawnCount] = await Promise.all([
      db.application.findMany({
        where: { candidateProfileId: context.profile.id, candidateHiddenAt: null, status: { not: 'WITHDRAWN' } }, orderBy: { appliedAt: 'desc' },
        select: {
          id: true, status: true, appliedAt: true,
          job: { select: { id: true, title: true, status: true, professionalArea: { select: { name: true } }, municipality: { select: { name: true } }, department: { select: { name: true } }, company: { select: { name: true } } } },
          statusHistory: { orderBy: { createdAt: 'asc' }, select: { previousStatus: true, newStatus: true, comment: true, createdAt: true } },
        },
      }),
      db.application.count({ where: { candidateProfileId: context.profile.id, status: 'WITHDRAWN' } }),
    ])
    return { applications, withdrawnCount }
  })

  app.get('/api/candidate/saved-jobs', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const now = new Date()
    const savedJobs = await db.savedJob.findMany({
      where: { candidateProfileId: context.profile.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, job: { select: {
        id: true, title: true, status: true, expiresAt: true, workMode: true, contractType: true, salaryMin: true, salaryMax: true,
        salaryCurrency: true, salaryPeriod: true, salaryNegotiable: true, publishedAt: true,
        company: { select: { name: true, verificationStatus: true } }, professionalArea: { select: { name: true } },
        municipality: { select: { name: true } }, department: { select: { name: true } },
      } } },
    })
    return { savedJobs: savedJobs.map(saved => ({
      createdAt: saved.createdAt,
      available: saved.job.status === 'PUBLISHED' && (!saved.job.expiresAt || saved.job.expiresAt > now) && saved.job.company.verificationStatus === 'VERIFIED',
      job: saved.job,
    })) }
  })

  app.get('/api/candidate/jobs/:jobId/state', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const { jobId } = request.params as { jobId: string }
    if (!UUID_PATTERN.test(jobId)) return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    const [application, saved, job, profile] = await Promise.all([
      db.application.findUnique({
        where: { jobId_candidateProfileId: { jobId, candidateProfileId: context.profile.id } },
        select: {
          id: true, status: true, appliedAt: true,
          statusHistory: { orderBy: { createdAt: 'asc' }, select: { previousStatus: true, newStatus: true, comment: true, createdAt: true } },
        },
      }),
      db.savedJob.findUnique({ where: { candidateProfileId_jobId: { jobId, candidateProfileId: context.profile.id } }, select: { jobId: true } }),
      db.job.findUnique({ where: { id: jobId }, select: {
        professionalAreaId: true, specializationId: true, departmentId: true, municipalityId: true, experienceYearsMin: true,
        professionalArea: { select: { name: true } }, specialization: { select: { name: true } },
        department: { select: { name: true } }, municipality: { select: { name: true } },
      } }),
      db.candidateProfile.findUnique({ where: { id: context.profile.id }, select: {
        professionalAreaId: true, specializationId: true, departmentId: true, municipalityId: true,
        professionalArea: { select: { name: true } }, specialization: { select: { name: true } },
        department: { select: { name: true } }, municipality: { select: { name: true } },
        experiences: { select: { startDate: true, endDate: true } },
      } }),
    ])
    if (!job || !profile) return reply.code(404).send({ message: 'No se encontró la vacante o el perfil.' })
    const missingProfileFields = [
      !context.profile.firstName.trim() ? 'firstName' : null,
      !context.profile.lastName.trim() ? 'lastName' : null,
      !context.profile.phone ? 'phone' : null,
      !context.profile.departmentId ? 'department' : null,
      !context.profile.municipalityId ? 'municipality' : null,
      !context.profile.professionalAreaId ? 'professionalArea' : null,
    ].filter((field): field is string => field !== null)
    const experienceYears = getTotalExperienceYears(profile.experiences)
    const areaPoints = profile.professionalAreaId === job.professionalAreaId ? 40 : 0
    const specializationPoints = !job.specializationId || profile.specializationId === job.specializationId ? 20 : 0
    const locationPoints = !job.departmentId && !job.municipalityId
      ? 20
      : job.municipalityId && profile.municipalityId === job.municipalityId
        ? 20
        : job.departmentId && profile.departmentId === job.departmentId ? 12 : 0
    const experiencePoints = job.experienceYearsMin === null
      ? 20
      : Math.min(experienceYears / Math.max(job.experienceYearsMin, 1), 1) * 20
    const candidateLocation = [profile.municipality?.name, profile.department?.name].filter(Boolean).join(', ') || 'Sin ubicación en el perfil'
    const jobLocation = [job.municipality?.name, job.department?.name].filter(Boolean).join(', ') || 'Sin restricción de ubicación'
    const compatibility = {
      score: Math.round(areaPoints + specializationPoints + locationPoints + experiencePoints),
      criteria: [
        { key: 'area', label: 'Área', candidateValue: profile.professionalArea?.name ?? 'Sin definir', jobValue: job.professionalArea.name, score: areaPoints, max: 40 },
        { key: 'specialization', label: 'Especialidad', candidateValue: profile.specialization?.name ?? 'Sin especialidad', jobValue: job.specialization?.name ?? 'No requerida', score: specializationPoints, max: 20 },
        { key: 'location', label: 'Ubicación', candidateValue: candidateLocation, jobValue: jobLocation, score: locationPoints, max: 20 },
        { key: 'experience', label: 'Experiencia', candidateValue: `${Number(experienceYears.toFixed(1))} años registrados`, jobValue: job.experienceYearsMin === null ? 'No especificada' : `${job.experienceYearsMin} años mínimo`, score: Math.round(experiencePoints), max: 20 },
      ],
    }
    return { application: application?.status === 'WITHDRAWN' ? null : application, saved: Boolean(saved), canApply: missingProfileFields.length === 0, missingProfileFields, compatibility }
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
      const result = await db.$transaction(async tx => {
        const stillOpen = await tx.job.findFirst({ where: { id: jobId, status: 'PUBLISHED', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }], company: { verificationStatus: 'VERIFIED' } }, select: { id: true } })
        if (!stillOpen) return { kind: 'closed' as const }
        const existing = await tx.application.findUnique({ where: { jobId_candidateProfileId: { jobId, candidateProfileId: context.profile.id } }, select: { id: true, status: true } })
        if (existing && existing.status !== 'WITHDRAWN') return { kind: 'exists' as const }
        const application = existing
          ? await tx.application.update({ where: { id: existing.id }, data: { status: 'RECEIVED', appliedAt: new Date(), candidateHiddenAt: null }, select: { id: true, status: true, appliedAt: true } })
          : await tx.application.create({ data: { jobId, candidateProfileId: context.profile.id, status: 'RECEIVED' }, select: { id: true, status: true, appliedAt: true } })
        await tx.applicationStatusHistory.create({ data: { applicationId: application.id, previousStatus: existing?.status ?? null, newStatus: 'RECEIVED', changedByUserId: context.user.id, comment: existing ? 'El candidato volvió a postularse después de retirar su postulación.' : 'Postulación enviada.' } })
        return { kind: 'ok' as const, application }
      }, { isolationLevel: 'Serializable' })
      if (result.kind === 'closed') return reply.code(404).send({ message: 'La vacante ya no está disponible.' })
      if (result.kind === 'exists') return reply.code(409).send({ message: 'Ya te postulaste a esta vacante.' })
      return reply.code(201).send({ application: result.application })
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

  app.delete('/api/candidate/applications/:id', async (request, reply) => {
    const context = await requireCandidate(request, reply, db)
    if (!context) return
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'El identificador de postulación no es válido.' })
    const result = await db.application.updateMany({
      where: { id, candidateProfileId: context.profile.id, candidateHiddenAt: null, status: { in: ['WITHDRAWN', 'SELECTED', 'REJECTED'] } },
      data: { candidateHiddenAt: new Date() },
    })
    if (!result.count) return reply.code(404).send({ message: 'Solo puedes quitar postulaciones retiradas, aceptadas o rechazadas.' })
    return { removed: true }
  })
}
