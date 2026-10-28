import type { FastifyInstance } from 'fastify'
import { hashToken } from '../../lib/auth'
import type { AuthRouteContext } from './context'

export function registerSecurityRoutes(app: FastifyInstance, context: AuthRouteContext) {
  const { db, rateLimited } = context

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
      await tx.verificationToken.updateMany({ where: { userId: tokenRecord.userId, type: 'TRUSTED_DEVICE', usedAt: null }, data: { usedAt: now } })
      return true
    })

    if (!revoked) return reply.code(400).send({ message: 'El enlace no es válido, venció o ya fue utilizado.' })
    return {
      ok: true,
      message: 'Se cerraron las sesiones activas. Para proteger tu cuenta, vuelve a Jinowork y usa “¿Olvidaste tu contraseña?” para cambiarla.',
    }
  })
}
