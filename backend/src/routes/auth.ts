import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import { optionalPhone } from '../lib/validation'
import { prisma } from '../lib/prisma'
import { EmailDeliveryError, sendLoginAlertEmail, sendPasswordResetEmail, sendVerificationEmail } from '../lib/email'
import {
  createSessionCookie,
  hashPassword,
  hashToken,
  normalizeEmail,
  resolveSessionUser,
  revokeSessionCookie,
  serializeUser,
  verifyPassword,
} from '../lib/auth'

type PasswordPayload = {
  email?: string
  password?: string
  role?: string
  firstName?: string
  lastName?: string
  companyName?: string
  phone?: string
}

export async function registerAuthRoutes(app: FastifyInstance, dependencies: {
  prisma: typeof prisma
  sendVerificationEmail?: typeof sendVerificationEmail
  sendLoginAlertEmail?: typeof sendLoginAlertEmail
}) {
  const db = dependencies.prisma
  const deliverVerificationEmail = dependencies.sendVerificationEmail ?? sendVerificationEmail
  const deliverLoginAlert = dependencies.sendLoginAlertEmail ?? sendLoginAlertEmail
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

  async function notifySuccessfulLogin(user: { id: string; email: string }, occurredAt: Date, request: any) {
    let tokenRecordId: string | undefined
    try {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenRecord = await db.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          type: 'LOGIN_SECURITY',
          expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
        },
        select: { id: true },
      })
      tokenRecordId = tokenRecord.id

      const securityUrl = new URL('/auth/security-alert', config.frontendUrl)
      securityUrl.hash = new URLSearchParams({ token }).toString()
      await deliverLoginAlert(user.email, occurredAt, request.headers['user-agent'] ?? null, securityUrl.toString())
    } catch (error) {
      if (tokenRecordId) {
        try {
          await db.verificationToken.updateMany({
            where: { id: tokenRecordId, usedAt: null },
            data: { usedAt: new Date() },
          })
        } catch {
          request.log.error({ userId: user.id, tokenRecordId }, 'Could not invalidate an undelivered login security token')
        }
      }
      if (error instanceof EmailDeliveryError) {
        request.log.error({ category: error.category, providerStatus: error.providerStatus, providerCode: error.providerCode }, 'Login security email was not accepted by the provider')
      } else {
        request.log.error({ errorType: error instanceof Error ? error.name : 'UnknownError' }, 'Login security email could not be prepared')
      }
    }
  }

  app.get('/api/auth/me', async (request, reply) => {
    const user = await resolveSessionUser(request, db)

    if (!user) {
      return reply.code(401).send({ message: 'No autenticado.' })
    }

    return { user }
  })

  app.post('/api/auth/logout', async (request, reply) => {
    await revokeSessionCookie(db, reply, request)
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
    const user = await db.user.findUnique({ where: { email } })
    if (!user || !(await verifyPassword(password, user.passwordHash))) return reply.code(401).send({ message: 'Correo o contraseÃ±a incorrectos.' })
    if (user.status !== 'ACTIVE') return reply.code(403).send({ message: 'Esta cuenta no estÃ¡ habilitada para iniciar sesiÃ³n.' })
    if (!user.emailVerifiedAt) return reply.code(403).send({ code: 'EMAIL_NOT_VERIFIED', message: 'Verifica tu correo antes de iniciar sesiÃ³n.' })
    const occurredAt = new Date()
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: occurredAt } })
    await createSessionCookie(db, reply, user.id, request)
    await notifySuccessfulLogin(user, occurredAt, request)
    return { ok: true, user: serializeUser(user) }
  })

  app.post('/api/auth/security/report-unrecognized', async (request, reply) => {
    if (rateLimited(`security-report:${request.ip}`, 5)) {
      return reply.code(429).send({ message: 'Demasiadas solicitudes. Inténtalo más tarde.' })
    }
    const body = request.body as { token?: unknown } | null
    const token = typeof body?.token === 'string' ? body.token : ''
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return reply.code(400).send({ message: 'El enlace no es válido, venció o ya fue utilizado.' })
    }

    const now = new Date()
    const revoked = await db.$transaction(async tx => {
      const tokenRecord = await tx.verificationToken.findUnique({
        where: { tokenHash: hashToken(token) },
        select: { id: true, userId: true, type: true, usedAt: true, expiresAt: true },
      })
      if (!tokenRecord || tokenRecord.type !== 'LOGIN_SECURITY' || tokenRecord.usedAt || tokenRecord.expiresAt <= now) return false

      const claimed = await tx.verificationToken.updateMany({
        where: { id: tokenRecord.id, type: 'LOGIN_SECURITY', usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      })
      if (claimed.count !== 1) return false

      await tx.session.updateMany({
        where: { userId: tokenRecord.userId, revokedAt: null },
        data: { revokedAt: now },
      })
      return true
    })

    if (!revoked) return reply.code(400).send({ message: 'El enlace no es válido, venció o ya fue utilizado.' })
    return {
      ok: true,
      message: 'Se cerraron las sesiones activas. Para proteger tu cuenta, vuelve a Jinowork y usa “¿Olvidaste tu contraseña?” para cambiarla.',
    }
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
    const user = await db.user.findUnique({ where: { email } })
    if (!user || user.status !== 'ACTIVE' || !user.emailVerifiedAt) return generic
    const recent = await db.verificationToken.findFirst({ where: { userId: user.id, type: 'PASSWORD_RESET', createdAt: { gt: new Date(Date.now() - 60_000) } } })
    if (recent) return generic
    const token = crypto.randomBytes(32).toString('hex')
    await db.verificationToken.updateMany({ where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null }, data: { usedAt: new Date() } })
    await db.verificationToken.create({ data: { userId: user.id, tokenHash: hashToken(token), type: 'PASSWORD_RESET', expiresAt: new Date(Date.now() + 30 * 60_000) } })
    const url = new URL('/auth/reset-password', config.frontendUrl); url.searchParams.set('token', token)
    try { await sendPasswordResetEmail(user.email, url.toString()) } catch (error) { request.log.error(error) }
    return generic
  })

  app.post('/api/auth/password/reset', async (request, reply) => {
    const body = (request.body ?? {}) as { token?: string; password?: string }
    if (!body.token || !/^[a-f0-9]{64}$/i.test(body.token) || !body.password || body.password.length < 10 || body.password.length > 128) return reply.code(400).send({ message: 'El enlace o la nueva contraseÃ±a no son vÃ¡lidos.' })
    const updated = await db.$transaction(async tx => {
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

    const tokenRecord = await db.verificationToken.findUnique({
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
      verifiedUser = await db.$transaction(async (tx) => {
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

    await createSessionCookie(db, reply, verifiedUser.id, request)
    return { ok: true, user: serializeUser(verifiedUser) }
  })
}
