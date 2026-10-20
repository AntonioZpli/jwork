import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { config } from './config'
import { prisma } from './lib/prisma'
import { EmailDeliveryError, sendAdminInvitationEmail, sendPasswordResetEmail, sendVerificationEmail } from './lib/email'
import { registerAdminRoutes } from './admin'

const SESSION_COOKIE = 'jwork_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

const scrypt = promisify(crypto.scrypt)

type PasswordPayload = {
  email?: string
  password?: string
  role?: string
  firstName?: string
  lastName?: string
  companyName?: string
  phone?: string
  rememberMe?: boolean
}

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const hash = await scrypt(password, salt, 64) as Buffer
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`
}

async function verifyPassword(password: string, stored: string | null) {
  if (!stored?.startsWith('scrypt:')) return false
  const [, saltHex, hashHex] = stored.split(':')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

type OnboardingPayload = {
  step?: number
  firstName?: string
  lastName?: string
  phone?: string
  departmentId?: string | null
  municipalityId?: string | null
  professionalAreaId?: string | null
  specializationId?: string | null
  companyName?: string
  description?: string
  website?: string
  economicSectorId?: string | null
  address?: string
  contactEmail?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function optionalText(value: unknown, maxLength: number, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw new Error(`${label} no es vÃ¡lido.`)
  }
  const clean = value.trim()
  return clean || undefined
}

function optionalCatalogId(value: unknown, label: string): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new Error(`${label} no es vÃ¡lido.`)
  return value
}

function optionalPhone(value: unknown): string | undefined {
  const phone = optionalText(value, 40, 'El telÃ©fono')
  if (phone && !/^\+?[0-9()\s.-]{7,40}$/.test(phone)) throw new Error('El telÃ©fono no es vÃ¡lido.')
  return phone
}

function hasLegacyCompleteProfile(
  role: string,
  candidateProfile: { firstName: string; lastName: string } | null,
  companyProfile: { name: string } | null,
): boolean {
  if (role === 'CANDIDATE') return Boolean(candidateProfile?.firstName.trim() && candidateProfile.lastName.trim())
  if (role === 'COMPANY') return Boolean(companyProfile?.name.trim())
  return false
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function serializeUser(user: { id: string; email: string; role: string; status: string }) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  }
}

async function createSessionCookie(reply: any, userId: string, request: any, ttlMs = SESSION_TTL_MS) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + ttlMs)

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: request.headers['user-agent'] ?? null,
      ipAddress: request.ip ?? null,
    },
  })

  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: config.isProduction ? 'none' : 'lax',
    secure: config.isProduction,
    maxAge: Math.floor(ttlMs / 1000),
  })

  return expiresAt
}

async function resolveSessionUser(request: any, db: typeof prisma = prisma) {
  const token = request.cookies?.[SESSION_COOKIE]

  if (!token) {
    return null
  }

  const session = await db.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  })

  if (!session) {
    return null
  }

  return serializeUser(session.user)
}

async function revokeSessionCookie(reply: any, request: any) {
  const sessionToken = request.cookies?.[SESSION_COOKIE]

  if (sessionToken) {
    await prisma.session.updateMany({
      where: {
        tokenHash: hashToken(sessionToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  reply.clearCookie(SESSION_COOKIE, { path: '/' })
}

export async function buildServer(dependencies: {
  prisma?: typeof prisma
  sendVerificationEmail?: typeof sendVerificationEmail
  sendAdminInvitationEmail?: typeof sendAdminInvitationEmail
  logger?: boolean
} = {}) {
  const app = Fastify({ logger: dependencies.logger === false ? false : { level: 'info' }, trustProxy: true })
  const db = dependencies.prisma ?? prisma
  const deliverVerificationEmail = dependencies.sendVerificationEmail ?? sendVerificationEmail
  const deliverAdminInvitation = dependencies.sendAdminInvitationEmail ?? sendAdminInvitationEmail
  const resolveUser = (request: any) => resolveSessionUser(request, db)

  await app.register(cors, {
    origin: [config.frontendUrl, 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(cookie)

  await registerAdminRoutes(app, db, resolveUser, deliverAdminInvitation)

  const attempts = new Map<string, { count: number; resetAt: number }>()
  function rateLimited(key: string, limit = 10) {
    const now = Date.now()
    const current = attempts.get(key)
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 })
      return false
    }
    current.count++
    return current.count > limit
  }

  const verificationInFlight = new Map<string, Promise<boolean>>()
  const verificationSentAt = new Map<string, number>()
  async function requestVerificationEmail(user: { id: string; email: string }, request: any): Promise<boolean> {
    const email = normalizeEmail(user.email)
    const currentSend = verificationInFlight.get(email)
    if (currentSend) return currentSend
    const task = (async () => {
      const sentAt = verificationSentAt.get(email)
      if (sentAt && Date.now() - sentAt < 60_000) return true
      const token = crypto.randomBytes(32).toString('hex')
      const tokenRecord = await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id}::uuid FOR UPDATE`
        const currentUser = await tx.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true, status: true } })
        if (!currentUser || currentUser.emailVerifiedAt || currentUser.status !== 'ACTIVE') return null
        const recentlyIssued = await tx.verificationToken.findFirst({
          where: { userId: user.id, type: 'EMAIL_VERIFICATION', usedAt: null, createdAt: { gt: new Date(Date.now() - 60_000) } },
          select: { id: true },
        })
        if (recentlyIssued) return { id: null as string | null }
        const record = await tx.verificationToken.create({ data: {
          userId: user.id, tokenHash: hashToken(token), type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 15 * 60_000),
        }, select: { id: true } })
        return record
      })
      if (!tokenRecord) return false
      // A recent unused token is either already being sent by another instance or was accepted less than a minute ago.
      if (!tokenRecord.id) return true
      try {
        let url: URL
        try { url = new URL('/auth/verify', config.frontendUrl) }
        catch { throw new EmailDeliveryError('configuration') }
        url.searchParams.set('token', token)
        await deliverVerificationEmail(user.email, url.toString())
      } catch (error) {
        try {
          await db.verificationToken.updateMany({ where: { id: tokenRecord.id, usedAt: null }, data: { usedAt: new Date() } })
        } catch {
          request.log.error({ userId: user.id, tokenRecordId: tokenRecord.id }, 'Could not invalidate an unsent verification token')
        }
        if (error instanceof EmailDeliveryError) {
          request.log.error({ category: error.category, providerStatus: error.providerStatus, providerCode: error.providerCode, providerMessage: error.providerMessage }, 'Verification email was not accepted by the provider')
        } else {
          request.log.error({ errorType: error instanceof Error ? error.name : 'UnknownError' }, 'Verification email preparation failed')
        }
        return false
      }
      verificationSentAt.set(email, Date.now())
      try {
        await db.verificationToken.updateMany({
          where: { userId: user.id, type: 'EMAIL_VERIFICATION', usedAt: null, id: { not: tokenRecord.id } },
          data: { usedAt: new Date() },
        })
      } catch {
        request.log.error({ userId: user.id }, 'Could not invalidate older verification tokens after provider acceptance')
      }
      return true
    })()
    verificationInFlight.set(email, task)
    try { return await task }
    finally { if (verificationInFlight.get(email) === task) verificationInFlight.delete(email) }
  }

  app.get('/api/health', async () => ({ ok: true }))

  app.get('/api/auth/me', async (request, reply) => {
    const user = await resolveSessionUser(request)

    if (!user) {
      return reply.code(401).send({ message: 'No autenticado.' })
    }

    return { user }
  })

  app.get('/api/onboarding', async (request, reply) => {
    const sessionUser = await resolveSessionUser(request)
    if (!sessionUser) return reply.code(401).send({ message: 'Inicia sesiÃ³n para continuar.' })

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        role: true,
        onboardingStep: true,
        candidateProfile: {
          select: {
            id: true, firstName: true, lastName: true, phone: true, departmentId: true,
            municipalityId: true, professionalAreaId: true, specializationId: true,
          },
        },
        companyProfile: {
          select: {
            id: true, name: true, description: true, website: true, economicSectorId: true,
            departmentId: true, municipalityId: true, address: true, contactEmail: true, phone: true,
          },
        },
      },
    })
    if (!user || !['CANDIDATE', 'COMPANY'].includes(user.role)) {
      return reply.code(403).send({ message: 'Esta cuenta no puede completar este perfil.' })
    }

    const profile = user.role === 'CANDIDATE' ? user.candidateProfile : user.companyProfile
    const legacyComplete = user.onboardingStep == null && hasLegacyCompleteProfile(
      user.role, user.candidateProfile, user.companyProfile,
    )
    const complete = Boolean(profile) && (user.onboardingStep === 4 || legacyComplete)
    const currentStep = complete ? 4 : user.onboardingStep === 4 ? 1 : user.onboardingStep ?? 1
    const catalogs = user.role === 'CANDIDATE'
      ? await Promise.all([
          prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
          prisma.municipality.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
          prisma.professionalArea.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
          prisma.specialization.findMany({ where: { isActive: true }, select: { id: true, name: true, professionalAreaId: true }, orderBy: { name: 'asc' } }),
        ]).then(([departments, municipalities, professionalAreas, specializations]) => ({
          departments, municipalities, professionalAreas, specializations,
        }))
      : await Promise.all([
          prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
          prisma.municipality.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
          prisma.economicSector.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        ]).then(([departments, municipalities, economicSectors]) => ({ departments, municipalities, economicSectors }))

    return {
      role: user.role,
      step: Math.min(currentStep, 3),
      complete,
      profile,
      catalogs,
    }
  })

  app.post('/api/onboarding/step', async (request, reply) => {
    const sessionUser = await resolveSessionUser(request)
    if (!sessionUser) return reply.code(401).send({ message: 'Inicia sesiÃ³n para continuar.' })

    const body = (request.body ?? {}) as OnboardingPayload
    const step = body.step
    if (step !== 1 && step !== 2 && step !== 3) {
      return reply.code(400).send({ message: 'El paso indicado no es vÃ¡lido.' })
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        role: true, onboardingStep: true,
        candidateProfile: { select: { id: true, firstName: true, lastName: true, departmentId: true, municipalityId: true, professionalAreaId: true } },
        companyProfile: { select: { id: true, name: true, departmentId: true, municipalityId: true } },
      },
    })
    if (!user || !['CANDIDATE', 'COMPANY'].includes(user.role)) {
      return reply.code(403).send({ message: 'Esta cuenta no puede completar este perfil.' })
    }

    const existingProfile = user.role === 'CANDIDATE' ? user.candidateProfile : user.companyProfile
    const legacyComplete = user.onboardingStep == null && hasLegacyCompleteProfile(
      user.role,
      user.candidateProfile ? { firstName: user.candidateProfile.firstName, lastName: user.candidateProfile.lastName } : null,
      user.companyProfile ? { name: user.companyProfile.name } : null,
    )
    const currentStep = legacyComplete ? 4 : user.onboardingStep === 4 && !existingProfile ? 1 : user.onboardingStep ?? 1
    if (currentStep === 4) return reply.code(409).send({ message: 'Este perfil ya estÃ¡ completo.' })
    if (step > currentStep) return reply.code(409).send({ message: 'Completa el paso actual antes de continuar.' })

    try {
      if (user.role === 'CANDIDATE') {
        const old = user.candidateProfile
        let profileId = old?.id

        if (step === 1) {
          const firstName = optionalText(body.firstName, 100, 'El nombre') ?? old?.firstName
          const lastName = optionalText(body.lastName, 100, 'Los apellidos') ?? old?.lastName
          if (!firstName || !lastName) return reply.code(400).send({ message: 'Ingresa tu nombre y apellidos para continuar.' })
          const departmentId = optionalCatalogId(body.departmentId, 'El departamento')
          const municipalityId = optionalCatalogId(body.municipalityId, 'El municipio')
          const mergedDepartmentId = departmentId === undefined ? old?.departmentId : departmentId
          const mergedMunicipalityId = municipalityId === undefined ? old?.municipalityId : municipalityId
          if (mergedDepartmentId && !await prisma.department.findUnique({ where: { id: mergedDepartmentId }, select: { id: true } })) {
            return reply.code(400).send({ message: 'Selecciona un departamento vÃ¡lido.' })
          }
          if (mergedMunicipalityId) {
            const municipality = await prisma.municipality.findUnique({ where: { id: mergedMunicipalityId }, select: { departmentId: true } })
            if (!municipality || !mergedDepartmentId || municipality.departmentId !== mergedDepartmentId) {
              return reply.code(400).send({ message: 'El municipio debe pertenecer al departamento seleccionado.' })
            }
          }
          const phone = optionalPhone(body.phone)
          const profile = await prisma.$transaction(async (tx) => {
            const saved = await tx.candidateProfile.upsert({
              where: { userId: sessionUser.id },
              create: {
                userId: sessionUser.id, firstName, lastName,
                ...(phone ? { phone } : {}),
                ...(mergedDepartmentId ? { departmentId: mergedDepartmentId } : {}),
                ...(mergedMunicipalityId ? { municipalityId: mergedMunicipalityId } : {}),
              },
              update: {
                firstName, lastName,
                ...(phone ? { phone } : {}),
                ...(departmentId !== undefined ? { departmentId: departmentId ?? null } : {}),
                ...(municipalityId !== undefined ? { municipalityId: municipalityId ?? null } : {}),
              },
              select: { id: true },
            })
            await tx.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: Math.max(currentStep, 2) } })
            return saved
          })
          profileId = profile.id
        } else if (step === 2) {
          if (!old) return reply.code(409).send({ message: 'Guarda primero tu informaciÃ³n personal.' })
          const professionalAreaId = optionalCatalogId(body.professionalAreaId, 'El Ã¡rea profesional')
          const specializationId = optionalCatalogId(body.specializationId, 'La especializaciÃ³n')
          const mergedAreaId = professionalAreaId === undefined ? old.professionalAreaId : professionalAreaId
          if (mergedAreaId && !await prisma.professionalArea.findFirst({ where: { id: mergedAreaId, isActive: true }, select: { id: true } })) {
            return reply.code(400).send({ message: 'Selecciona un Ã¡rea profesional vÃ¡lida.' })
          }
          if (specializationId) {
            const specialization = await prisma.specialization.findFirst({ where: { id: specializationId, isActive: true }, select: { professionalAreaId: true } })
            if (!specialization || !mergedAreaId || specialization.professionalAreaId !== mergedAreaId) {
              return reply.code(400).send({ message: 'La especializaciÃ³n debe corresponder al Ã¡rea seleccionada.' })
            }
          }
          await prisma.$transaction(async (tx) => {
            await tx.candidateProfile.update({
              where: { userId: sessionUser.id },
              data: {
                ...(professionalAreaId !== undefined ? { professionalAreaId } : {}),
                ...(specializationId !== undefined ? { specializationId } : {}),
              },
            })
            await tx.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: Math.max(currentStep, 3) } })
          })
          profileId = old.id
        } else {
          if (!old) return reply.code(409).send({ message: 'Guarda primero tu informaciÃ³n personal.' })
          await prisma.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: 4 } })
          profileId = old.id
        }
        return { ok: true, step: step === 3 ? 4 : Math.max(currentStep, step + 1), profileId }
      }

      const old = user.companyProfile
      let profileId = old?.id
      if (step === 1) {
        const name = optionalText(body.companyName, 160, 'El nombre de la empresa') ?? old?.name
        if (!name) return reply.code(400).send({ message: 'Ingresa el nombre de la empresa para continuar.' })
        const economicSectorId = optionalCatalogId(body.economicSectorId, 'El sector econÃ³mico')
        if (economicSectorId && !await prisma.economicSector.findFirst({ where: { id: economicSectorId, isActive: true }, select: { id: true } })) {
          return reply.code(400).send({ message: 'Selecciona un sector vÃ¡lido.' })
        }
        const description = optionalText(body.description, 5000, 'La descripciÃ³n')
        const website = optionalText(body.website, 2000, 'El sitio web')
        if (website) {
          try {
            const parsed = new URL(website)
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
          } catch {
            return reply.code(400).send({ message: 'Ingresa una direcciÃ³n web vÃ¡lida.' })
          }
        }
        const saved = await prisma.$transaction(async (tx) => {
          const profile = await tx.companyProfile.upsert({
            where: { ownerUserId: sessionUser.id },
            create: {
              ownerUserId: sessionUser.id, name,
              ...(description ? { description } : {}),
              ...(website ? { website } : {}),
              ...(economicSectorId ? { economicSectorId } : {}),
            },
            update: {
              name,
              ...(description ? { description } : {}),
              ...(website ? { website } : {}),
              ...(economicSectorId !== undefined ? { economicSectorId } : {}),
            },
            select: { id: true },
          })
          await tx.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: Math.max(currentStep, 2) } })
          return profile
        })
        profileId = saved.id
      } else if (step === 2) {
        if (!old) return reply.code(409).send({ message: 'Guarda primero la informaciÃ³n bÃ¡sica de la empresa.' })
        const departmentId = optionalCatalogId(body.departmentId, 'El departamento')
        const municipalityId = optionalCatalogId(body.municipalityId, 'El municipio')
        const mergedDepartmentId = departmentId === undefined ? old.departmentId : departmentId
        const mergedMunicipalityId = municipalityId === undefined ? old.municipalityId : municipalityId
        if (mergedDepartmentId && !await prisma.department.findUnique({ where: { id: mergedDepartmentId }, select: { id: true } })) {
          return reply.code(400).send({ message: 'Selecciona un departamento vÃ¡lido.' })
        }
        if (mergedMunicipalityId) {
          const municipality = await prisma.municipality.findUnique({ where: { id: mergedMunicipalityId }, select: { departmentId: true } })
          if (!municipality || !mergedDepartmentId || municipality.departmentId !== mergedDepartmentId) {
            return reply.code(400).send({ message: 'El municipio debe pertenecer al departamento seleccionado.' })
          }
        }
        const contactEmail = optionalText(body.contactEmail, 254, 'El correo de contacto')
        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
          return reply.code(400).send({ message: 'Ingresa un correo de contacto vÃ¡lido.' })
        }
        const phone = optionalPhone(body.phone)
        const address = optionalText(body.address, 500, 'La direcciÃ³n')
        await prisma.$transaction(async (tx) => {
          await tx.companyProfile.update({
            where: { ownerUserId: sessionUser.id },
            data: {
              ...(departmentId !== undefined ? { departmentId } : {}),
              ...(municipalityId !== undefined ? { municipalityId } : {}),
              ...(address ? { address } : {}), ...(contactEmail ? { contactEmail } : {}),
              ...(phone ? { phone } : {}),
            },
          })
          await tx.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: Math.max(currentStep, 3) } })
        })
        profileId = old.id
      } else {
        if (!old) return reply.code(409).send({ message: 'Guarda primero la informaciÃ³n bÃ¡sica de la empresa.' })
        await prisma.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: 4 } })
        profileId = old.id
      }
      return { ok: true, step: step === 3 ? 4 : Math.max(currentStep, step + 1), profileId }
    } catch (error) {
      if (error instanceof Error && /no es vÃ¡lido/.test(error.message)) {
        return reply.code(400).send({ message: error.message })
      }
      request.log.error(error)
      return reply.code(500).send({ message: 'No se pudieron guardar los cambios. IntÃ©ntalo de nuevo.' })
    }
  })

  app.post('/api/auth/logout', async (request, reply) => {
    await revokeSessionCookie(reply, request)
    return { ok: true }
  })

  app.post('/api/auth/register', async (request, reply) => {
    const body = (request.body ?? {}) as PasswordPayload
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (rateLimited(`register:${request.ip}`, 8)) return reply.code(429).send({ message: 'Demasiados intentos. Inténtalo más tarde.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128) {
      return reply.code(400).send({ message: 'Ingresa un correo válido y una contraseña de 10 a 128 caracteres.' })
    }

    const existing = await db.user.findUnique({ where: { email }, select: { id: true, email: true, status: true, emailVerifiedAt: true } })
    if (existing) {
      if (existing.emailVerifiedAt || existing.status !== 'ACTIVE') {
        return reply.code(409).send({ message: 'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.' })
      }
      const sent = await requestVerificationEmail(existing, request)
      if (!sent) return reply.code(503).send({ code: 'VERIFICATION_EMAIL_FAILED', message: 'Tu cuenta sigue pendiente. No pudimos solicitar el correo de verificación; vuelve a intentarlo o usa “Reenviar verificación”.' })
      return { ok: true, pendingVerification: true, message: 'Ya existe una cuenta pendiente para este correo. Revisa tu correo o inicia sesión para reenviar la verificación.' }
    }

    if (!['candidate', 'company'].includes(body.role ?? '')) {
      return reply.code(400).send({ message: 'Selecciona un tipo de cuenta válido.' })
    }
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
    let phone: string | undefined
    try { phone = optionalPhone(body.phone) }
    catch (error) { return reply.code(400).send({ message: error instanceof Error ? error.message : 'El teléfono no es válido.' }) }
    if (body.role === 'candidate' && (!firstName || firstName.length > 100 || !lastName || lastName.length > 100)) {
      return reply.code(400).send({ message: 'Ingresa nombre y apellidos, máximo 100 caracteres cada uno.' })
    }
    if (body.role === 'company' && (!companyName || companyName.length > 160)) {
      return reply.code(400).send({ message: 'Ingresa un nombre de empresa válido, máximo 160 caracteres.' })
    }
    const passwordHash = await hashPassword(password)
    let user: { id: string; email: string }
    try {
      user = await db.$transaction(async tx => {
        const created = await tx.user.create({ data: {
          email, passwordHash, role: body.role === 'company' ? 'COMPANY' : 'CANDIDATE', onboardingStep: 1,
        }, select: { id: true, email: true } })
        if (body.role === 'candidate') {
          await tx.candidateProfile.create({ data: { userId: created.id, firstName, lastName, ...(phone ? { phone } : {}) } })
        } else {
          await tx.companyProfile.create({ data: { ownerUserId: created.id, name: companyName, ...(phone ? { phone } : {}) } })
        }
        return created
      })
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error
      // Another request may have created this address after the first lookup.
      const racedUser = await db.user.findUnique({ where: { email }, select: { id: true, email: true, status: true, emailVerifiedAt: true } })
      if (!racedUser) throw error
      if (racedUser.emailVerifiedAt || racedUser.status !== 'ACTIVE') {
        return reply.code(409).send({ message: 'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.' })
      }
      const sent = await requestVerificationEmail(racedUser, request)
      if (!sent) return reply.code(503).send({ code: 'VERIFICATION_EMAIL_FAILED', message: 'Tu cuenta sigue pendiente. No pudimos solicitar el correo de verificación; vuelve a intentarlo o usa “Reenviar verificación”.' })
      return { ok: true, pendingVerification: true, message: 'Ya existe una cuenta pendiente para este correo. Revisa tu correo o inicia sesión para reenviar la verificación.' }
    }

    const sent = await requestVerificationEmail(user, request)
    if (!sent) return reply.code(503).send({ code: 'VERIFICATION_EMAIL_FAILED', message: 'La cuenta quedó creada, pero no pudimos solicitar el correo de verificación. Reinténtalo con este correo o usa “Reenviar verificación”.' })
    return reply.code(201).send({ ok: true, message: 'Revisa tu correo para verificar tu cuenta. La aceptación del envío no garantiza su entrega.' })
  })
  app.post('/api/auth/login', async (request, reply) => {
    const body = (request.body ?? {}) as PasswordPayload
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (rateLimited(`login:${request.ip}`, 15)) return reply.code(429).send({ message: 'Demasiados intentos. IntÃ©ntalo mÃ¡s tarde.' })
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await verifyPassword(password, user.passwordHash))) return reply.code(401).send({ message: 'Correo o contraseÃ±a incorrectos.' })
    if (user.status !== 'ACTIVE') return reply.code(403).send({ message: 'Esta cuenta no estÃ¡ habilitada para iniciar sesiÃ³n.' })
    if (!user.emailVerifiedAt) return reply.code(403).send({ code: 'EMAIL_NOT_VERIFIED', message: 'Verifica tu correo antes de iniciar sesiÃ³n.' })
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await createSessionCookie(reply, user.id, request, body.rememberMe === true ? SESSION_TTL_MS : 24 * 60 * 60 * 1000)
    return { ok: true, user: serializeUser(user) }
  })

  app.post('/api/auth/email/resend', async (request, reply) => {
    const body = (request.body ?? {}) as PasswordPayload
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply.code(400).send({ message: 'Ingresa un correo válido.' })
    if (rateLimited(`resend:${request.ip}`, 5)) return reply.code(429).send({ message: 'Demasiadas solicitudes. Inténtalo más tarde.' })
    const generic = { ok: true, message: 'Si tu cuenta necesita verificación, revisa tu correo y la carpeta de spam; si no llega, vuelve a intentarlo más tarde.' }
    const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true, emailVerifiedAt: true, status: true } })
    if (!user || user.emailVerifiedAt || user.status !== 'ACTIVE') return generic
    const sent = await requestVerificationEmail(user, request)
    if (!sent) return reply.code(503).send({ code: 'VERIFICATION_EMAIL_FAILED', message: 'No pudimos solicitar el correo de verificación. Reinténtalo más tarde; tu cuenta y sus datos siguen guardados.' })
    return generic
  })
  app.post('/api/auth/password/forgot', async (request, reply) => {
    const body = (request.body ?? {}) as PasswordPayload
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    if (rateLimited(`forgot:${request.ip}`, 5)) return reply.code(429).send({ message: 'Demasiadas solicitudes. IntÃ©ntalo mÃ¡s tarde.' })
    const generic = { ok: true, message: 'Si existe una cuenta, enviaremos instrucciones para restablecer la contraseÃ±a.' }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.status !== 'ACTIVE' || !user.emailVerifiedAt) return generic
    const recent = await prisma.verificationToken.findFirst({ where: { userId: user.id, type: 'PASSWORD_RESET', createdAt: { gt: new Date(Date.now() - 60_000) } } })
    if (recent) return generic
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.verificationToken.updateMany({ where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null }, data: { usedAt: new Date() } })
    await prisma.verificationToken.create({ data: { userId: user.id, tokenHash: hashToken(token), type: 'PASSWORD_RESET', expiresAt: new Date(Date.now() + 30 * 60_000) } })
    const url = new URL('/auth/reset-password', config.frontendUrl); url.searchParams.set('token', token)
    try { await sendPasswordResetEmail(user.email, url.toString()) } catch (error) { request.log.error(error) }
    return generic
  })

  app.post('/api/auth/password/reset', async (request, reply) => {
    const body = (request.body ?? {}) as { token?: string; password?: string }
    if (!body.token || !/^[a-f0-9]{64}$/i.test(body.token) || !body.password || body.password.length < 10 || body.password.length > 128) return reply.code(400).send({ message: 'El enlace o la nueva contraseÃ±a no son vÃ¡lidos.' })
    const updated = await prisma.$transaction(async tx => {
      const token = await tx.verificationToken.findUnique({ where: { tokenHash: hashToken(body.token!) } })
      if (!token || token.type !== 'PASSWORD_RESET' || token.usedAt || token.expiresAt <= new Date()) return false
      const claim = await tx.verificationToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } })
      if (claim.count !== 1) return false
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash: await hashPassword(body.password!) } })
      await tx.session.updateMany({ where: { userId: token.userId, revokedAt: null }, data: { revokedAt: new Date() } })
      return true
    })
    if (!updated) return reply.code(400).send({ message: 'El enlace no es vÃ¡lido o ya venciÃ³.' })
    return { ok: true }
  })

  app.post('/api/auth/admin-invitation/accept', async (request, reply) => {
    const body = request.body as { token?: unknown; password?: unknown } | null
    const token = typeof body?.token === 'string' ? body.token : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const meetsPasswordPolicy = password.length >= 14 && password.length <= 128
      && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
    if (!/^[a-f0-9]{64}$/i.test(token)) return reply.code(400).send({ message: 'La invitación no es válida o ya venció.' })
    if (!meetsPasswordPolicy) return reply.code(400).send({ message: 'Usa al menos 14 caracteres e incluye mayúscula, minúscula, número y símbolo.' })

    try {
      await db.$transaction(async tx => {
        const invitation = await tx.adminInvitation.findUnique({ where: { tokenHash: hashToken(token) } })
        if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date()) throw new Error('INVALID_ADMIN_INVITATION')
        const claimedAt = new Date()
        const claimed = await tx.adminInvitation.updateMany({
          where: { id: invitation.id, usedAt: null, expiresAt: { gt: claimedAt } },
          data: { usedAt: claimedAt },
        })
        if (claimed.count !== 1) throw new Error('INVALID_ADMIN_INVITATION')
        const user = await tx.user.create({
          data: {
            email: invitation.email,
            role: 'ADMIN',
            status: 'ACTIVE',
            passwordHash: await hashPassword(password),
            emailVerifiedAt: claimedAt,
          },
          select: { id: true, email: true },
        })
        await tx.adminInvitation.updateMany({
          where: { email: invitation.email, usedAt: null },
          data: { usedAt: claimedAt },
        })
        await tx.auditLog.create({ data: {
          actorUserId: user.id,
          actionType: 'ADMIN_INVITATION_ACCEPTED',
          entityType: 'User',
          entityId: user.id,
          metadata: { email: user.email, invitationId: invitation.id },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] ?? null,
        } })
      }, { isolationLevel: 'Serializable' })
    } catch (error: any) {
      if (error instanceof Error && error.message === 'INVALID_ADMIN_INVITATION') return reply.code(400).send({ message: 'La invitación no es válida, ya se usó o venció.' })
      if (error?.code === 'P2002') return reply.code(409).send({ message: 'Ese correo ya tiene una cuenta. Inicia sesión para continuar.' })
      if (error?.code === 'P2034') return reply.code(409).send({ message: 'La invitación se está procesando. Vuelve a intentarlo.' })
      throw error
    }
    return { ok: true, message: 'Contraseña creada. Ya puedes iniciar sesión.' }
  })
  app.post('/api/auth/email/verify', async (request, reply) => {
    if (rateLimited(`verify:${request.ip}`, 10)) return reply.code(429).send({ message: 'Demasiados intentos. IntÃ©ntalo mÃ¡s tarde.' })
    const body = request.body as { token?: string }
    const token = typeof body.token === 'string' ? body.token : ''
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return reply.code(400).send({ message: 'El enlace no es vÃ¡lido o ya venciÃ³. Solicita uno nuevo.' })
    }

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true, emailVerifiedAt: true },
        },
      },
    })

    if (!tokenRecord || tokenRecord.type !== 'EMAIL_VERIFICATION' || tokenRecord.usedAt || tokenRecord.expiresAt <= new Date()) {
      return reply.code(400).send({ message: 'El enlace no es vÃ¡lido o ya venciÃ³. Solicita uno nuevo.' })
    }
    if (tokenRecord.user.status !== 'ACTIVE') {
      return reply.code(403).send({ message: 'Esta cuenta no estÃ¡ habilitada para iniciar sesiÃ³n.' })
    }

    let verifiedUser
    try {
      verifiedUser = await prisma.$transaction(async (tx) => {
        const consumed = await tx.verificationToken.updateMany({
          where: { id: tokenRecord.id, usedAt: null, expiresAt: { gt: new Date() } },
          data: { usedAt: new Date() },
        })
        if (consumed.count !== 1) throw new Error('VERIFICATION_TOKEN_ALREADY_USED')

        return tx.user.update({
          where: { id: tokenRecord.user.id },
          data: { emailVerifiedAt: tokenRecord.user.emailVerifiedAt ?? new Date() },
          select: { id: true, email: true, role: true, status: true },
        })
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'VERIFICATION_TOKEN_ALREADY_USED') {
        return reply.code(400).send({ message: 'El enlace no es vÃ¡lido o ya venciÃ³. Solicita uno nuevo.' })
      }
      throw error
    }

    if (!verifiedUser) {
      return reply.code(400).send({ message: 'El enlace no es vÃ¡lido o ya venciÃ³. Solicita uno nuevo.' })
    }

    await createSessionCookie(reply, verifiedUser.id, request)
    return { ok: true, user: serializeUser(verifiedUser) }
  })

  return app
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false

if (isDirectRun) {
  void (async () => {
    const app = await buildServer()
    await app.listen({ port: config.port, host: config.host })
    console.log(`Jinowork backend listening on http://${config.host}:${config.port}`)
  })()
}

