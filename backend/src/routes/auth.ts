import type { FastifyInstance } from 'fastify'
import { createAuthRouteContext } from './auth/context'
import type { AuthRouteDependencies } from './auth/types'
import { registerSessionRoutes } from './auth/sessions'
import { registerAccountRoutes } from './auth/accounts'
import { registerSecurityRoutes } from './auth/security'
import { registerVerificationRoutes } from './auth/verification'
import { registerPasswordRoutes } from './auth/password'
import { registerAdminInvitationRoutes } from './auth/adminInvitation'
import { registerEmailVerificationRoutes } from './auth/emailVerification'

export async function registerAuthRoutes(app: FastifyInstance, dependencies: AuthRouteDependencies) {
  const context = createAuthRouteContext(dependencies)
  registerSessionRoutes(app, context)
  registerAccountRoutes(app, context)
  registerSecurityRoutes(app, context)
  registerVerificationRoutes(app, context)
  registerPasswordRoutes(app, context)
  registerAdminInvitationRoutes(app, context)
  registerEmailVerificationRoutes(app, context)
}