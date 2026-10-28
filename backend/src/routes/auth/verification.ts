import type { FastifyInstance } from 'fastify'
import { normalizeEmail } from '../../lib/auth'
import type { AuthRouteContext } from './context'
import type { PasswordPayload } from './types'

export function registerVerificationRoutes(app: FastifyInstance, context: AuthRouteContext) {
  const { db, rateLimited, requestVerificationEmail } = context

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
}
