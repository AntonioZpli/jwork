import type { FastifyInstance } from 'fastify'
import { resolveSessionUser, revokeSessionCookie } from '../../lib/auth'
import type { AuthRouteContext } from './context'

export function registerSessionRoutes(app: FastifyInstance, context: AuthRouteContext) {
  const { db } = context
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
}
