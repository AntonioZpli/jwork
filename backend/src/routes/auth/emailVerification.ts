import type { FastifyInstance } from 'fastify'
import { createSessionCookie, hashToken, serializeUser } from '../../lib/auth'
import type { AuthRouteContext } from './context'

export function registerEmailVerificationRoutes(app: FastifyInstance, context: AuthRouteContext) {
  const { db, rateLimited } = context

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
