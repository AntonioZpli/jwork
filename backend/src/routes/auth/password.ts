import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { config } from '../../config'
import { sendPasswordResetEmail } from '../../lib/email'
import { hashPassword, hashToken, normalizeEmail } from '../../lib/auth'
import type { AuthRouteContext } from './context'
import type { PasswordPayload } from './types'

export function registerPasswordRoutes(app: FastifyInstance, context: AuthRouteContext) {
  const { db, rateLimited } = context

  app.post('/api/auth/password/forgot', async (request, reply) => {
    const body = (request.body ?? {}) as PasswordPayload
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    if (rateLimited(`forgot:${request.ip}`, 5)) return reply.code(429).send({ message: 'Demasiadas solicitudes. Inténtalo más tarde.' })
    const generic = { ok: true, message: 'Si existe una cuenta, enviaremos instrucciones para restablecer la contraseña.' }
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
    if (!body.token || !/^[a-f0-9]{64}$/i.test(body.token) || !body.password || body.password.length < 10 || body.password.length > 128) return reply.code(400).send({ message: 'El enlace o la nueva contraseña no son válidos.' })
    const updated = await db.$transaction(async tx => {
      const token = await tx.verificationToken.findUnique({ where: { tokenHash: hashToken(body.token!) } })
      if (!token || token.type !== 'PASSWORD_RESET' || token.usedAt || token.expiresAt <= new Date()) return false
      const claim = await tx.verificationToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } })
      if (claim.count !== 1) return false
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash: await hashPassword(body.password!) } })
      await tx.session.updateMany({ where: { userId: token.userId, revokedAt: null }, data: { revokedAt: new Date() } })
      await tx.verificationToken.updateMany({ where: { userId: token.userId, type: 'TRUSTED_DEVICE', usedAt: null }, data: { usedAt: new Date() } })
      return true
    })
    if (!updated) return reply.code(400).send({ message: 'El enlace no es válido o ya venció.' })
    return { ok: true }
  })
}
