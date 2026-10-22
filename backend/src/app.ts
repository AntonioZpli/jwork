import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { config } from './config'
import { prisma } from './lib/prisma'
import { sendAdminCredentialsEmail, sendLoginAlertEmail, sendVerificationEmail } from './lib/email'
import { resolveSessionUser } from './lib/auth'
import { registerAdminRoutes } from './admin'
import { registerAuthRoutes } from './routes/auth'
import { registerOnboardingRoutes } from './routes/onboarding'

export async function buildServer(dependencies: {
  prisma?: typeof prisma
  sendVerificationEmail?: typeof sendVerificationEmail
  sendLoginAlertEmail?: typeof sendLoginAlertEmail
  sendAdminCredentialsEmail?: typeof sendAdminCredentialsEmail
  logger?: boolean
} = {}) {
  const app = Fastify({ logger: dependencies.logger === false ? false : { level: 'info' }, trustProxy: true })
  const db = dependencies.prisma ?? prisma
  const deliverAdminCredentials = dependencies.sendAdminCredentialsEmail ?? sendAdminCredentialsEmail
  const resolveUser = (request: any) => resolveSessionUser(request, db)

  await app.register(cors, {
    origin: [config.frontendUrl, 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
  await app.register(cookie)

  app.get('/api/health', async () => ({ ok: true }))
  await registerAdminRoutes(app, db, resolveUser, deliverAdminCredentials)
  await registerAuthRoutes(app, {
    prisma: db,
    sendVerificationEmail: dependencies.sendVerificationEmail,
    sendLoginAlertEmail: dependencies.sendLoginAlertEmail,
  })
  await registerOnboardingRoutes(app, db)
  return app
}
