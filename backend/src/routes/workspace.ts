import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { resolveSessionUser } from '../lib/auth'

export async function registerWorkspaceRoutes(app: FastifyInstance, db: typeof prisma) {
  app.get('/api/candidate/dashboard', async (request, reply) => {
    const user = await resolveSessionUser(request, db)
    if (!user) return reply.code(401).send({ message: 'Inicia sesión para continuar.' })
    if (user.role !== 'CANDIDATE') return reply.code(403).send({ message: 'Esta vista es para cuentas de candidato.' })

    const profile = await db.candidateProfile.findUnique({
      where: { userId: user.id },
      select: {
        firstName: true, lastName: true, photoUrl: true, cvUrl: true, description: true,
        department: { select: { name: true } }, municipality: { select: { name: true } },
        professionalArea: { select: { name: true } }, specialization: { select: { name: true } },
      },
    })
    if (!profile) return reply.code(404).send({ message: 'Completa primero tu perfil de candidato.' })

    const now = new Date()
    const where = { status: 'PUBLISHED' as const, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
    const [applications, savedJobs, recentApplications, jobs] = await Promise.all([
      db.application.count({ where: { candidateProfile: { userId: user.id } } }),
      db.savedJob.count({ where: { candidateProfile: { userId: user.id }, job: { status: 'PUBLISHED', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }], company: { verificationStatus: 'VERIFIED' } } } }),
      db.application.findMany({
        where: { candidateProfile: { userId: user.id } },
        orderBy: { appliedAt: 'desc' }, take: 5,
        select: { id: true, status: true, appliedAt: true, job: { select: { title: true, company: { select: { name: true } } } } },
      }),
      db.job.findMany({
        where: { ...where, company: { verificationStatus: 'VERIFIED' } }, orderBy: [{ isUrgent: 'desc' }, { publishedAt: 'desc' }], take: 6,
        select: {
          id: true, title: true, workMode: true, contractType: true, publishedAt: true,
          company: { select: { name: true } }, professionalArea: { select: { name: true } },
          municipality: { select: { name: true } }, department: { select: { name: true } },
        },
      }),
    ])
    return { profile, stats: { applications, savedJobs }, recentApplications, jobs }
  })

  app.get('/api/company/dashboard', async (request, reply) => {
    const user = await resolveSessionUser(request, db)
    if (!user) return reply.code(401).send({ message: 'Inicia sesión para continuar.' })
    if (user.role !== 'COMPANY') return reply.code(403).send({ message: 'Esta vista es para cuentas de empresa.' })

    const company = await db.companyProfile.findUnique({
      where: { ownerUserId: user.id },
      select: {
        id: true, name: true, verificationStatus: true,
        department: { select: { name: true } }, municipality: { select: { name: true } },
        economicSector: { select: { name: true } },
      },
    })
    if (!company) return reply.code(404).send({ message: 'Completa primero el perfil de tu empresa.' })

    const [totalJobs, publishedJobs, totalApplications, recentJobs] = await Promise.all([
      db.job.count({ where: { companyProfileId: company.id } }),
      db.job.count({ where: { companyProfileId: company.id, status: 'PUBLISHED', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
      db.application.count({ where: { job: { companyProfileId: company.id } } }),
      db.job.findMany({
        where: { companyProfileId: company.id }, orderBy: { createdAt: 'desc' }, take: 6,
        select: {
          id: true, title: true, status: true, createdAt: true, publishedAt: true,
          _count: { select: { applications: true, views: true } },
        },
      }),
    ])
    return { company, stats: { totalJobs, publishedJobs, totalApplications }, recentJobs }
  })
}
