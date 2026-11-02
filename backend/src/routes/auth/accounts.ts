import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { config } from '../../config'
import { optionalPhone } from '../../lib/validation'
import { createSessionCookie, hashPassword, hashToken, normalizeEmail, serializeUser, verifyPassword } from '../../lib/auth'
import type { AuthRouteContext } from './context'
import type { PasswordPayload } from './types'

export function registerAccountRoutes(app: FastifyInstance, context: AuthRouteContext) {
  const { db, rateLimited, requestVerificationEmail, notifySuccessfulLogin } = context

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
    if (rateLimited(`login:${request.ip}`, 15)) return reply.code(429).send({ message: 'Demasiados intentos. Inténtalo más tarde.' })
    const user = await db.user.findUnique({ where: { email } })
    if (!user || !(await verifyPassword(password, user.passwordHash))) return reply.code(401).send({ message: 'Correo o contraseña incorrectos.' })
    if (user.status !== 'ACTIVE') return reply.code(403).send({ message: 'Esta cuenta no está habilitada para iniciar sesión.' })
    if (!user.emailVerifiedAt) return reply.code(403).send({ code: 'EMAIL_NOT_VERIFIED', message: 'Verifica tu correo antes de iniciar sesión.' })
    const rememberDevice = body.rememberDevice === true
    const deviceCookieName = 'jwork_remembered_device'
    const rememberedToken = request.cookies?.[deviceCookieName]
    const now = new Date()
    const rememberedDevice = rememberedToken
      ? await db.verificationToken.findFirst({ where: { userId: user.id, tokenHash: hashToken(rememberedToken), type: 'TRUSTED_DEVICE', usedAt: null, expiresAt: { gt: now } }, select: { id: true } })
      : null
    const occurredAt = new Date()
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: occurredAt } })
    await createSessionCookie(db, reply, user.id, request, rememberDevice ? 30 * 24 * 60 * 60_000 : undefined)
    if (rememberDevice) {
      if (!rememberedDevice) {
        const token = crypto.randomBytes(32).toString('hex')
        await db.verificationToken.create({ data: { userId: user.id, tokenHash: hashToken(token), type: 'TRUSTED_DEVICE', expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60_000) } })
        reply.setCookie(deviceCookieName, token, { path: '/', httpOnly: true, sameSite: config.isProduction ? 'none' : 'lax', secure: config.isProduction, maxAge: 180 * 24 * 60 * 60 })
      }
    } else {
      if (rememberedDevice) await db.verificationToken.updateMany({ where: { id: rememberedDevice.id, usedAt: null }, data: { usedAt: now } })
      reply.clearCookie(deviceCookieName, { path: '/' })
    }
    if (!rememberedDevice) await notifySuccessfulLogin(user, occurredAt, request)
    return { ok: true, user: serializeUser(user) }
  })
}
