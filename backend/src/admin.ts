import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import type { PrismaClient } from './generated/prisma/client'
import { config } from './config'
import { EmailDeliveryError, sendAdminInvitationEmail } from './lib/email'

type AdminUser = { id: string; email: string; role: string; status: string }
type SessionResolver = (request: any) => Promise<AdminUser | null>

const pageSizeLimit = 100
const safePage = (value: unknown) => Math.max(1, Math.min(100_000, Number.parseInt(String(value ?? '1'), 10) || 1))
const safePageSize = (value: unknown) => Math.max(10, Math.min(pageSizeLimit, Number.parseInt(String(value ?? '25'), 10) || 25))
const cleanSearch = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 120) : ''

export async function registerAdminRoutes(
  app: FastifyInstance,
  db: PrismaClient,
  resolveUser: SessionResolver,
  deliverAdminInvitationEmail: typeof sendAdminInvitationEmail = sendAdminInvitationEmail,
) {
  async function requireAdmin(request: any, reply: any, superadmin = false) {
    const user = await resolveUser(request)
    if (!user) {
      reply.code(401).send({ message: 'Inicia sesión para continuar.' })
      return null
    }
    if (user.status !== 'ACTIVE' || (superadmin ? user.role !== 'SUPERADMIN' : !['ADMIN', 'SUPERADMIN'].includes(user.role))) {
      reply.code(403).send({ message: 'No tienes permisos para acceder a la consola.' })
      return null
    }
    return user
  }

  function paging(query: any) {
    const page = safePage(query.page)
    const pageSize = safePageSize(query.pageSize)
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
  }

  app.post('/api/admin/invitations', async (request, reply) => {
    const admin = await requireAdmin(request, reply, true)
    if (!admin) return
    const body = request.body as { email?: unknown } | null
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.code(400).send({ message: 'Ingresa un correo válido.' })
    }

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return reply.code(409).send({ message: 'Ese correo ya pertenece a una cuenta. La invitación requiere una dirección nueva.' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60_000)
    let invited: { id: string; email: string }
    try {
      invited = await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`
        const current = await tx.user.findUnique({ where: { email }, select: { id: true } })
        if (current) throw new Error('INVITATION_CONFLICT')
        const recent = await tx.adminInvitation.findFirst({
          where: { email, createdAt: { gt: new Date(Date.now() - 60_000) } },
          select: { id: true },
        })
        if (recent) throw new Error('INVITATION_RECENT')
        const invitation = await tx.adminInvitation.create({
          data: { email, tokenHash, expiresAt, invitedByUserId: admin.id },
          select: { id: true, email: true },
        })
        await tx.auditLog.create({ data: {
          actorUserId: admin.id,
          actionType: 'ADMIN_INVITATION_CREATED',
          entityType: 'AdminInvitation',
          entityId: invitation.id,
          metadata: { email, expiresAt: expiresAt.toISOString() },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] ?? null,
        } })
        return invitation
      }, { isolationLevel: 'Serializable' })
    } catch (error: any) {
      if (error instanceof Error && error.message === 'INVITATION_CONFLICT') return reply.code(409).send({ message: 'La cuenta ya no está disponible para invitación.' })
      if (error instanceof Error && error.message === 'INVITATION_RECENT') return reply.code(429).send({ message: 'Ya se envió una invitación a este correo. Espera un minuto para solicitar otra.' })
      if (error?.code === 'P2034') return reply.code(409).send({ message: 'No se pudo crear la invitación porque la cuenta cambió. Actualiza e inténtalo de nuevo.' })
      throw error
    }
    let invitationUrl: URL
    try {
      invitationUrl = new URL('/auth/admin-invite', config.frontendUrl)
      invitationUrl.searchParams.set('token', token)
      await deliverAdminInvitationEmail(invited.email, invitationUrl.toString())
    } catch (error) {
      await db.adminInvitation.deleteMany({ where: { id: invited.id, tokenHash, usedAt: null } })
      if (error instanceof EmailDeliveryError) {
        request.log.error({ category: error.category, providerStatus: error.providerStatus, providerCode: error.providerCode }, 'Admin invitation email was not accepted by the provider')
      } else {
        request.log.error({ errorType: error instanceof Error ? error.name : 'UnknownError' }, 'Admin invitation email preparation failed')
      }
      return reply.code(503).send({ code: 'ADMIN_INVITATION_EMAIL_FAILED', message: 'No se pudo enviar la invitación. Revisa la configuración de correo del servidor e inténtalo más tarde.' })
    }
    return reply.code(202).send({ ok: true, message: `Invitación enviada a ${invited.email}.` })
  })
  function orderBy(query: any, allowed: string[], fallback: string) {
    const requested = cleanSearch(query?.sort)
    return { [allowed.includes(requested) ? requested : fallback]: query?.direction === 'asc' ? 'asc' : 'desc' }
  }

  app.get('/api/admin/overview', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const [users, companies, jobs, applications, pendingReports, pendingCompanies, recentAudit, recentReports] = await Promise.all([
      db.user.count(), db.companyProfile.count(), db.job.count(), db.application.count(),
      db.report.count({ where: { status: { in: ['PENDING', 'IN_REVIEW'] } } }),
      db.companyProfile.count({ where: { verificationStatus: 'PENDING' } }),
      db.auditLog.findMany({ take: 8, orderBy: { createdAt: 'desc' }, select: { id: true, actionType: true, entityType: true, entityId: true, createdAt: true, actor: { select: { email: true } } } }),
      db.report.findMany({ where: { status: { in: ['PENDING', 'IN_REVIEW'] } }, take: 5, orderBy: { createdAt: 'asc' }, select: { id: true, targetType: true, reason: true, status: true, createdAt: true, reporter: { select: { email: true } } } }),
    ])
    return { metrics: { users, companies, jobs, applications, pendingReports, pendingCompanies }, recentAudit, attention: recentReports }
  })

  app.get('/api/admin/search', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const q = cleanSearch((request.query as any)?.q)
    if (q.length < 2) return { groups: [] }
    const contains = { contains: q, mode: 'insensitive' as const }
    const [users, companies, jobs, reports] = await Promise.all([
      db.user.findMany({ where: { OR: [{ email: contains }, { id: contains }, { candidateProfile: { is: { OR: [{ firstName: contains }, { lastName: contains }] } } }] }, take: 5, select: { id: true, email: true, role: true, status: true } }),
      db.companyProfile.findMany({ where: { OR: [{ name: contains }, { contactEmail: contains }] }, take: 5, select: { id: true, name: true, verificationStatus: true } }),
      db.job.findMany({ where: { OR: [{ title: contains }, { id: contains }] }, take: 5, select: { id: true, title: true, status: true } }),
      db.report.findMany({ where: { OR: [{ id: contains }, { description: contains }] }, take: 5, select: { id: true, reason: true, status: true } }),
    ])
    return { groups: [
      { type: 'users', label: 'Usuarios', items: users },
      { type: 'companies', label: 'Empresas', items: companies },
      { type: 'jobs', label: 'Ofertas', items: jobs },
      { type: 'reports', label: 'Reportes', items: reports },
    ].filter(group => group.items.length) }
  })

  app.get('/api/admin/users', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const q = cleanSearch((request.query as any)?.q)
    const role = cleanSearch((request.query as any)?.role)
    const status = cleanSearch((request.query as any)?.status)
    const verified = cleanSearch((request.query as any)?.verified)
    const p = paging(request.query)
    const sortOrder = orderBy(request.query, ['email', 'role', 'status', 'createdAt', 'lastLoginAt'], 'createdAt')
    const where: any = {
      ...(q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { id: { contains: q, mode: 'insensitive' } }, { candidateProfile: { is: { OR: [{ firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }] } } }, { companyProfile: { is: { name: { contains: q, mode: 'insensitive' } } } }] } : {}),
      ...(role && ['CANDIDATE', 'COMPANY', 'ADMIN', 'SUPERADMIN'].includes(role) ? { role } : {}),
      ...(status && ['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status) ? { status } : {}),
      ...(verified === 'yes' ? { emailVerifiedAt: { not: null } } : verified === 'no' ? { emailVerifiedAt: null } : {}),
    }
    const [total, data] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({ where, skip: p.skip, take: p.take, orderBy: sortOrder as any, select: {
        id: true, email: true, role: true, status: true, emailVerifiedAt: true, createdAt: true, lastLoginAt: true,
        candidateProfile: { select: { firstName: true, lastName: true, phone: true, department: { select: { name: true } }, professionalArea: { select: { name: true } } } },
        companyProfile: { select: { id: true, name: true, verificationStatus: true } },
        _count: { select: { sessions: true, reportsCreated: true, moderationActionsReceived: true } },
      } }),
    ])
    return { data, page: p.page, pageSize: p.pageSize, total }
  })

  app.get('/api/admin/companies', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const query = request.query as any; const q = cleanSearch(query?.q); const state = cleanSearch(query?.status); const p = paging(query); const sortOrder = orderBy(query, ['name', 'verificationStatus', 'createdAt'], 'createdAt')
    const where: any = { ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { contactEmail: { contains: q, mode: 'insensitive' } }, { owner: { email: { contains: q, mode: 'insensitive' } } }] } : {}), ...(state && ['PENDING', 'VERIFIED', 'REJECTED'].includes(state) ? { verificationStatus: state } : {}) }
    const [total, data] = await Promise.all([db.companyProfile.count({ where }), db.companyProfile.findMany({ where, skip: p.skip, take: p.take, orderBy: sortOrder as any, select: { id: true, name: true, contactEmail: true, website: true, verificationStatus: true, verifiedAt: true, createdAt: true, owner: { select: { id: true, email: true, status: true } }, economicSector: { select: { name: true } }, department: { select: { name: true } }, _count: { select: { jobs: true, members: true } } } })])
    return { data, page: p.page, pageSize: p.pageSize, total }
  })

  app.get('/api/admin/jobs', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const query = request.query as any; const q = cleanSearch(query?.q); const state = cleanSearch(query?.status); const p = paging(query); const sortOrder = orderBy(query, ['title', 'status', 'createdAt', 'publishedAt'], 'createdAt')
    const where: any = { ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { id: { contains: q, mode: 'insensitive' } }, { company: { name: { contains: q, mode: 'insensitive' } } }] } : {}), ...(state && ['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'REMOVED'].includes(state) ? { status: state } : {}) }
    const [total, data] = await Promise.all([db.job.count({ where }), db.job.findMany({ where, skip: p.skip, take: p.take, orderBy: sortOrder as any, select: { id: true, title: true, status: true, workMode: true, contractType: true, publishedAt: true, expiresAt: true, createdAt: true, company: { select: { id: true, name: true, verificationStatus: true } }, professionalArea: { select: { name: true } }, _count: { select: { applications: true, reports: true, views: true } } } })])
    return { data, page: p.page, pageSize: p.pageSize, total }
  })

  app.get('/api/admin/applications', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const query = request.query as any; const q = cleanSearch(query?.q); const state = cleanSearch(query?.status); const p = paging(query); const sortOrder = orderBy(query, ['status', 'appliedAt', 'updatedAt'], 'appliedAt')
    const where: any = { ...(q ? { OR: [{ job: { title: { contains: q, mode: 'insensitive' } } }, { candidateProfile: { user: { email: { contains: q, mode: 'insensitive' } } } }, { candidateProfile: { firstName: { contains: q, mode: 'insensitive' } } }] } : {}), ...(state && ['RECEIVED', 'IN_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'].includes(state) ? { status: state } : {}) }
    const [total, data] = await Promise.all([db.application.count({ where }), db.application.findMany({ where, skip: p.skip, take: p.take, orderBy: sortOrder as any, select: { id: true, status: true, appliedAt: true, updatedAt: true, job: { select: { id: true, title: true, company: { select: { name: true } } } }, candidateProfile: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } }, _count: { select: { statusHistory: true } } } })])
    return { data, page: p.page, pageSize: p.pageSize, total }
  })

  app.get('/api/admin/reports', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const query = request.query as any; const q = cleanSearch(query?.q); const state = cleanSearch(query?.status); const p = paging(query); const sortOrder = orderBy(query, ['status', 'createdAt', 'reason'], 'createdAt')
    const where: any = { ...(q ? { OR: [{ description: { contains: q, mode: 'insensitive' } }, { reporter: { email: { contains: q, mode: 'insensitive' } } }, { targetUser: { email: { contains: q, mode: 'insensitive' } } }, { targetJob: { title: { contains: q, mode: 'insensitive' } } }] } : {}), ...(state && ['PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'].includes(state) ? { status: state } : {}) }
    const [total, data] = await Promise.all([db.report.count({ where }), db.report.findMany({ where, skip: p.skip, take: p.take, orderBy: sortOrder as any, select: { id: true, targetType: true, reason: true, description: true, status: true, resolution: true, createdAt: true, resolvedAt: true, reporter: { select: { id: true, email: true } }, targetUser: { select: { id: true, email: true, status: true, role: true } }, targetJob: { select: { id: true, title: true, status: true } }, assignedAdmin: { select: { email: true } }, evidence: { select: { id: true, fileUrl: true, originalName: true, mimeType: true, sizeBytes: true } }, actions: { select: { id: true, actionType: true, reason: true, createdAt: true, admin: { select: { email: true } } }, orderBy: { createdAt: 'desc' } } } })])
    return { data, page: p.page, pageSize: p.pageSize, total }
  })

  app.get('/api/admin/audit', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const query = request.query as any; const q = cleanSearch(query?.q); const action = cleanSearch(query?.action); const actor = cleanSearch(query?.actor); const p = paging(query); const sortOrder = orderBy(query, ['actionType', 'entityType', 'createdAt'], 'createdAt')
    const where: any = { ...(q ? { OR: [{ entityType: { contains: q, mode: 'insensitive' } }, { entityId: { contains: q, mode: 'insensitive' } }] } : {}), ...(action ? { actionType: action } : {}), ...(actor ? { actor: { email: { contains: actor, mode: 'insensitive' } } } : {}) }
    const [total, data] = await Promise.all([db.auditLog.count({ where }), db.auditLog.findMany({ where, skip: p.skip, take: p.take, orderBy: sortOrder as any, select: { id: true, actionType: true, entityType: true, entityId: true, metadata: true, createdAt: true, actor: { select: { id: true, email: true } } } })])
    return { data, page: p.page, pageSize: p.pageSize, total }
  })

  app.get('/api/admin/stats', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const query = request.query as any
    const day = (value: unknown, fallback: Date) => {
      const parsed = value ? new Date(String(value)) : fallback
      return Number.isFinite(parsed.getTime()) ? new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())) : new Date(Number.NaN)
    }
    const today = day(null, new Date())
    const start = day(query?.from, new Date(today.getTime() - 29 * 86_400_000))
    const end = day(query?.to, today)
    const endExclusive = new Date(end.getTime() + 86_400_000)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end || end.getTime() - start.getTime() >= 366 * 86_400_000) return reply.code(400).send({ message: 'Selecciona un periodo válido de hasta 366 días.' })
    const [jobs, companies, audit, counts] = await Promise.all([
      db.jobDailyStats.groupBy({ by: ['date'], where: { date: { gte: start, lt: endExclusive } }, _sum: { views: true, uniqueViews: true, applications: true, savedCount: true }, orderBy: { date: 'asc' } }),
      db.companyDailyStats.groupBy({ by: ['date'], where: { date: { gte: start, lt: endExclusive } }, _sum: { jobsPublished: true, totalViews: true, totalApplications: true } }),
      db.auditLog.count({ where: { createdAt: { gte: start, lt: endExclusive } } }),
      Promise.all([db.user.count({ where: { createdAt: { gte: start, lt: endExclusive } } }), db.job.count({ where: { createdAt: { gte: start, lt: endExclusive } } }), db.application.count({ where: { appliedAt: { gte: start, lt: endExclusive } } })]),
    ])
    return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10), dailyJobs: jobs, dailyCompanies: companies, auditEvents: audit, created: { users: counts[0], jobs: counts[1], applications: counts[2] } }
  })

  app.get('/api/admin/explorer', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    const query = request.query as any; const model = cleanSearch(query?.model); const q = cleanSearch(query?.q); const p = paging(query)
    // Fixed model/field allowlist; sensitive credentials and token tables are intentionally excluded.
    if (model === 'users') {
      const where = q ? { OR: [{ email: { contains: q, mode: 'insensitive' as const } }, { id: { contains: q, mode: 'insensitive' as const } }] } : {}
      const [total, data] = await Promise.all([db.user.count({ where }), db.user.findMany({ where, skip: p.skip, take: p.take, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, role: true, status: true, emailVerifiedAt: true, createdAt: true } })])
      return { model, data, page: p.page, pageSize: p.pageSize, total, fields: ['id', 'email', 'role', 'status', 'emailVerifiedAt', 'createdAt'] }
    }
    if (model === 'jobs') {
      const where = q ? { OR: [{ title: { contains: q, mode: 'insensitive' as const } }, { id: { contains: q, mode: 'insensitive' as const } }] } : {}
      const [total, data] = await Promise.all([db.job.count({ where }), db.job.findMany({ where, skip: p.skip, take: p.take, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, status: true, workMode: true, contractType: true, createdAt: true, company: { select: { name: true } } } })])
      return { model, data, page: p.page, pageSize: p.pageSize, total, fields: ['id', 'title', 'status', 'workMode', 'contractType', 'createdAt', 'company.name'] }
    }
    if (model === 'applications') {
      const where = q ? { OR: [{ id: { contains: q, mode: 'insensitive' as const } }, { job: { title: { contains: q, mode: 'insensitive' as const } } }, { candidateProfile: { firstName: { contains: q, mode: 'insensitive' as const } } }, { candidateProfile: { lastName: { contains: q, mode: 'insensitive' as const } } }] } : {}
      const [total, data] = await Promise.all([db.application.count({ where }), db.application.findMany({ where, skip: p.skip, take: p.take, orderBy: { appliedAt: 'desc' }, select: { id: true, status: true, appliedAt: true, job: { select: { title: true } }, candidateProfile: { select: { firstName: true, lastName: true } } } })])
      return { model, data, page: p.page, pageSize: p.pageSize, total, fields: ['id', 'status', 'appliedAt', 'job.title', 'candidateProfile.firstName', 'candidateProfile.lastName'] }
    }
    if (model === 'reports') {
      const where = q ? { OR: [{ id: { contains: q, mode: 'insensitive' as const } }, { description: { contains: q, mode: 'insensitive' as const } }] } : {}
      const [total, data] = await Promise.all([db.report.count({ where }), db.report.findMany({ where, skip: p.skip, take: p.take, orderBy: { createdAt: 'desc' }, select: { id: true, targetType: true, reason: true, status: true, createdAt: true, reporter: { select: { email: true } } } })])
      return { model, data, page: p.page, pageSize: p.pageSize, total, fields: ['id', 'targetType', 'reason', 'status', 'createdAt', 'reporter.email'] }
    }
    if (model === 'audit') {
      const where = q ? { OR: [{ entityType: { contains: q, mode: 'insensitive' as const } }, { entityId: { contains: q, mode: 'insensitive' as const } }] } : {}
      const [total, data] = await Promise.all([db.auditLog.count({ where }), db.auditLog.findMany({ where, skip: p.skip, take: p.take, orderBy: { createdAt: 'desc' }, select: { id: true, actionType: true, entityType: true, entityId: true, createdAt: true, actor: { select: { email: true } } } })])
      return { model, data, page: p.page, pageSize: p.pageSize, total, fields: ['id', 'actionType', 'entityType', 'entityId', 'createdAt', 'actor.email'] }
    }
    if (model === 'members') {
      const where = q ? { OR: [{ user: { email: { contains: q, mode: 'insensitive' as const } } }, { company: { name: { contains: q, mode: 'insensitive' as const } } }] } : {}
      const [total, data] = await Promise.all([db.companyMember.count({ where }), db.companyMember.findMany({ where, skip: p.skip, take: p.take, orderBy: { invitedAt: 'desc' }, select: { id: true, role: true, invitedAt: true, acceptedAt: true, company: { select: { id: true, name: true } }, user: { select: { id: true, email: true, status: true } } } })])
      return { model, data, page: p.page, pageSize: p.pageSize, total, fields: ['id', 'role', 'invitedAt', 'acceptedAt', 'company.name', 'user.email', 'user.status'] }
    }
    if (model === 'moderation') {
      const where = q ? { OR: [{ reason: { contains: q, mode: 'insensitive' as const } }, { targetUser: { email: { contains: q, mode: 'insensitive' as const } } }] } : {}
      const [total, data] = await Promise.all([db.moderationAction.count({ where }), db.moderationAction.findMany({ where, skip: p.skip, take: p.take, orderBy: { createdAt: 'desc' }, select: { id: true, actionType: true, reason: true, expiresAt: true, createdAt: true, admin: { select: { email: true } }, targetUser: { select: { email: true } }, targetJob: { select: { title: true } }, report: { select: { id: true, status: true } } } })])
      return { model, data, page: p.page, pageSize: p.pageSize, total, fields: ['id', 'actionType', 'reason', 'expiresAt', 'createdAt', 'admin.email', 'targetUser.email', 'targetJob.title', 'report.status'] }
    }
    if (model === 'companyStats') {
      const [total, data] = await Promise.all([db.companyDailyStats.count(), db.companyDailyStats.findMany({ skip: p.skip, take: p.take, orderBy: { date: 'desc' }, select: { date: true, jobsPublished: true, jobsActive: true, totalViews: true, uniqueViews: true, totalApplications: true, totalSaved: true, company: { select: { id: true, name: true } } } })])
      return { model, data, page: p.page, pageSize: p.pageSize, total, fields: ['date', 'jobsPublished', 'jobsActive', 'totalViews', 'uniqueViews', 'totalApplications', 'totalSaved', 'company.name'] }
    }
    if (model === 'jobStats') {
      const [total, data] = await Promise.all([db.jobDailyStats.count(), db.jobDailyStats.findMany({ skip: p.skip, take: p.take, orderBy: { date: 'desc' }, select: { date: true, views: true, uniqueViews: true, applications: true, savedCount: true, received: true, inReview: true, shortlisted: true, interview: true, selected: true, rejected: true, job: { select: { id: true, title: true } } } })])
      return { model, data, page: p.page, pageSize: p.pageSize, total, fields: ['date', 'views', 'uniqueViews', 'applications', 'savedCount', 'received', 'inReview', 'shortlisted', 'interview', 'selected', 'rejected', 'job.title'] }
    }
    return reply.code(400).send({ message: 'Modelo no incluido en el explorador autorizado.' })
  })

  app.get('/api/admin/explorer/schema', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return
    return { models: [
      { id: 'users', label: 'User · Usuarios', fields: [['id', 'UUID'], ['email', 'String'], ['role', 'UserRole'], ['status', 'UserStatus'], ['emailVerifiedAt', 'DateTime?'], ['createdAt', 'DateTime']], relations: ['CandidateProfile 1:1', 'CompanyProfile 1:1', 'CompanyMember 1:N', 'Session 1:N (valores excluidos)'] },
      { id: 'companies', label: 'CompanyProfile · Empresas', fields: [['id', 'UUID'], ['name', 'String'], ['verificationStatus', 'VerificationStatus'], ['createdAt', 'DateTime']], relations: ['User owner N:1', 'CompanyMember 1:N', 'Job 1:N'] },
      { id: 'members', label: 'CompanyMember · Miembros', fields: [['id', 'UUID'], ['role', 'CompanyMemberRole'], ['invitedAt', 'DateTime'], ['acceptedAt', 'DateTime?']], relations: ['CompanyProfile N:1', 'User N:1'] },
      { id: 'jobs', label: 'Job · Ofertas', fields: [['id', 'UUID'], ['title', 'String'], ['status', 'JobStatus'], ['workMode', 'WorkMode'], ['createdAt', 'DateTime']], relations: ['CompanyProfile N:1', 'Application 1:N', 'Report 1:N'] },
      { id: 'applications', label: 'Application · Postulaciones', fields: [['id', 'UUID'], ['status', 'ApplicationStatus'], ['appliedAt', 'DateTime']], relations: ['Job N:1', 'CandidateProfile N:1', 'ApplicationStatusHistory 1:N'] },
      { id: 'reports', label: 'Report · Reportes', fields: [['id', 'UUID'], ['targetType', 'ReportTargetType'], ['reason', 'ReportReason'], ['status', 'ReportStatus'], ['createdAt', 'DateTime']], relations: ['User reporter N:1', 'Job? target N:1', 'ModerationAction 1:N'] },
      { id: 'moderation', label: 'ModerationAction · Moderación', fields: [['id', 'UUID'], ['actionType', 'ModerationActionType'], ['reason', 'String'], ['createdAt', 'DateTime']], relations: ['User admin N:1', 'User target? N:1', 'Job? N:1', 'Report? N:1'] },
      { id: 'audit', label: 'AuditLog · Auditoría', fields: [['id', 'UUID'], ['actionType', 'AuditActionType'], ['entityType', 'String'], ['entityId', 'String'], ['createdAt', 'DateTime']], relations: ['User actor? N:1'] },
      { id: 'companyStats', label: 'CompanyDailyStats · Estadísticas de empresa', fields: [['date', 'Date'], ['totalViews', 'Int'], ['totalApplications', 'Int'], ['jobsActive', 'Int']], relations: ['CompanyProfile N:1'] },
      { id: 'jobStats', label: 'JobDailyStats · Estadísticas de oferta', fields: [['date', 'Date'], ['views', 'Int'], ['applications', 'Int'], ['savedCount', 'Int']], relations: ['Job N:1'] },
    ] }
  })

  app.patch('/api/admin/reports/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply); if (!admin) return
    const { id } = request.params as { id: string }; const body = request.body as { status?: string; resolution?: string }
    if (!['RESOLVED', 'DISMISSED', 'IN_REVIEW'].includes(body?.status ?? '') || typeof body.resolution !== 'string' || !body.resolution.trim() || body.resolution.trim().length > 2000) return reply.code(400).send({ message: 'Indica una decisión válida y una explicación de hasta 2000 caracteres.' })
    const report = await db.$transaction(async tx => {
      const current = await tx.report.findUnique({ where: { id }, select: { id: true, status: true } })
      if (!current) return null
      const updated = await tx.report.update({ where: { id }, data: { status: body.status as any, resolution: body.resolution!.trim(), assignedAdminId: admin.id, assignedAt: new Date(), resolvedAt: body.status === 'IN_REVIEW' ? null : new Date() }, select: { id: true, status: true, resolution: true } })
      if (body.status !== 'IN_REVIEW') await tx.auditLog.create({ data: { actorUserId: admin.id, actionType: 'REPORT_RESOLVED', entityType: 'Report', entityId: id, metadata: { previousStatus: current.status, status: updated.status, resolution: updated.resolution } } })
      return updated
    })
    if (!report) return reply.code(404).send({ message: 'El reporte ya no existe.' })
    return { report }
  })

  app.patch('/api/admin/users/:id/status', async (request, reply) => {
    const admin = await requireAdmin(request, reply); if (!admin) return
    const { id } = request.params as { id: string }; const body = request.body as { status?: string; reason?: string }
    if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(body?.status ?? '')) return reply.code(400).send({ message: 'Estado de usuario no válido.' })
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (body.status !== 'ACTIVE' && (!reason || reason.length > 2000)) return reply.code(400).send({ message: 'Explica el motivo de la suspensión o bloqueo (hasta 2000 caracteres).' })
    if (id === admin.id) return reply.code(409).send({ message: 'No puedes cambiar el estado de tu propia cuenta desde esta consola.' })
    let updated
    try { updated = await db.$transaction(async tx => {
      const target = await tx.user.findUnique({ where: { id }, select: { id: true, role: true, status: true } })
      if (!target) return null
      if (target.role === 'SUPERADMIN' && admin.role !== 'SUPERADMIN') throw new Error('SUPERADMIN_PROTECTED')
      if (target.role === 'SUPERADMIN' && target.status === 'ACTIVE' && body.status !== 'ACTIVE') {
        const count = await tx.user.count({ where: { role: 'SUPERADMIN', status: 'ACTIVE' } })
        if (count <= 1) throw new Error('LAST_SUPERADMIN')
      }
      const saved = await tx.user.update({ where: { id }, data: { status: body.status as any }, select: { id: true, email: true, role: true, status: true } })
      if (body.status !== 'ACTIVE') await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
      if (target.status !== saved.status) await tx.moderationAction.create({ data: {
        adminUserId: admin.id, targetUserId: id,
        actionType: saved.status === 'BANNED' ? 'PERMANENT_BAN' : saved.status === 'SUSPENDED' ? 'TEMPORARY_SUSPENSION' : 'REACTIVATE_ACCOUNT',
        reason: reason || 'Reactivación solicitada desde la consola administrativa.',
      } })
      await tx.auditLog.create({ data: { actorUserId: admin.id, actionType: 'USER_STATUS_CHANGED', entityType: 'User', entityId: id, metadata: { previousStatus: target.status, status: saved.status, ...(reason ? { reason } : {}) } } })
      return saved
    }, { isolationLevel: 'Serializable' }) } catch (error) {
      if (error instanceof Error && error.message === 'SUPERADMIN_PROTECTED') return reply.code(403).send({ message: 'Solo un SUPERADMIN puede gestionar otra cuenta SUPERADMIN.' })
      if (error instanceof Error && error.message === 'LAST_SUPERADMIN') return reply.code(409).send({ message: 'No se puede desactivar al último SUPERADMIN activo.' })
      throw error
    }
    if (!updated) return reply.code(404).send({ message: 'El usuario no existe.' })
    return { user: updated }
  })

  app.patch('/api/admin/companies/:id/verification', async (request, reply) => {
    const admin = await requireAdmin(request, reply); if (!admin) return
    const { id } = request.params as { id: string }; const body = request.body as { status?: string }
    if (!['VERIFIED', 'REJECTED'].includes(body?.status ?? '')) return reply.code(400).send({ message: 'Decisión de verificación no válida.' })
    let updated
    try { updated = await db.$transaction(async tx => {
      const company = await tx.companyProfile.findUnique({ where: { id }, select: { id: true, verificationStatus: true } }); if (!company) return null
      const saved = await tx.companyProfile.update({ where: { id }, data: { verificationStatus: body.status as any, verifiedAt: body.status === 'VERIFIED' ? new Date() : null, verifiedByUserId: body.status === 'VERIFIED' ? admin.id : null }, select: { id: true, name: true, verificationStatus: true } })
      await tx.auditLog.create({ data: { actorUserId: admin.id, actionType: body.status === 'VERIFIED' ? 'COMPANY_VERIFIED' : 'COMPANY_REJECTED', entityType: 'CompanyProfile', entityId: id, metadata: { previousStatus: company.verificationStatus, status: saved.verificationStatus } } })
      return saved
    }, { isolationLevel: 'Serializable' }) } catch (error) {
      if (error instanceof Error && error.message === 'SUPERADMIN_PROTECTED') return reply.code(403).send({ message: 'No se puede modificar esta empresa desde esta operación.' })
      throw error
    }
    if (!updated) return reply.code(404).send({ message: 'La empresa no existe.' })
    return { company: updated }
  })

  app.patch('/api/admin/jobs/:id/status', async (request, reply) => {
    const admin = await requireAdmin(request, reply); if (!admin) return
    const { id } = request.params as { id: string }; const body = request.body as { status?: string }
    if (!['PUBLISHED', 'PAUSED', 'CLOSED', 'REMOVED'].includes(body?.status ?? '')) return reply.code(400).send({ message: 'Estado de oferta no válido.' })
    let updated
    try { updated = await db.$transaction(async tx => {
      const job = await tx.job.findUnique({ where: { id }, select: { id: true, status: true } }); if (!job) return null
      const saved = await tx.job.update({ where: { id }, data: { status: body.status as any, ...(body.status === 'PUBLISHED' && job.status !== 'PUBLISHED' ? { publishedAt: new Date() } : {}) }, select: { id: true, title: true, status: true } })
      await tx.auditLog.create({ data: { actorUserId: admin.id, actionType: 'JOB_STATUS_CHANGED', entityType: 'Job', entityId: id, metadata: { previousStatus: job.status, status: saved.status } } })
      return saved
    }) } catch (error) {
      if (error instanceof Error && error.message === 'SUPERADMIN_PROTECTED') return reply.code(403).send({ message: 'No se puede modificar esta oferta desde esta operación.' })
      throw error
    }
    if (!updated) return reply.code(404).send({ message: 'La oferta no existe.' })
    return { job: updated }
  })

  app.patch('/api/admin/users/:id/role', async (request, reply) => {
    const admin = await requireAdmin(request, reply, true); if (!admin) return
    const { id } = request.params as { id: string }; const body = request.body as { role?: string }
    if (!['ADMIN', 'CANDIDATE', 'COMPANY'].includes(body?.role ?? '')) return reply.code(400).send({ message: 'Rol asignable no válido.' })
    if (id === admin.id) return reply.code(409).send({ message: 'No puedes cambiar tu propio rol.' })
    let updated
    try { updated = await db.$transaction(async tx => {
      const target = await tx.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } }); if (!target) return null
      if (target.role === 'SUPERADMIN') throw new Error('SUPERADMIN_PROTECTED')
      const saved = await tx.user.update({ where: { id }, data: { role: body.role as any }, select: { id: true, email: true, role: true } })
      await tx.auditLog.create({ data: { actorUserId: admin.id, actionType: 'USER_ROLE_CHANGED', entityType: 'User', entityId: id, metadata: { previousRole: target.role, role: saved.role } } })
      return saved
    }) } catch (error) {
      if (error instanceof Error && error.message === 'SUPERADMIN_PROTECTED') return reply.code(403).send({ message: 'No se pueden cambiar los privilegios de una cuenta SUPERADMIN desde esta acción.' })
      throw error
    }
    if (!updated) return reply.code(404).send({ message: 'El usuario no existe.' })
    return { user: updated }
  })
}

