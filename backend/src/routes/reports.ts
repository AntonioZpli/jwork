import type { FastifyInstance } from 'fastify'
import { resolveSessionUser } from '../lib/auth'
import { prisma } from '../lib/prisma'
import { parseReportInput } from './reportsValidation'

export async function registerReportRoutes(app: FastifyInstance, db: typeof prisma) {
  app.post('/api/reports', async (request, reply) => {
    const user = await resolveSessionUser(request, db)
    if (!user) return reply.code(401).send({ message: 'Inicia sesión para enviar un reporte.' })
    let input
    try { input = parseReportInput(request.body) }
    catch (error) { return reply.code(400).send({ message: error instanceof Error ? error.message : 'El reporte no es válido.' }) }

    try {
      const result = await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id}::uuid FOR UPDATE`
        const targetWhere = input.targetType === 'COMPANY'
          ? { targetCompanyId: input.targetId }
          : { targetJobId: input.targetId }
        const existing = await tx.report.findFirst({ where: { reporterUserId: user.id, status: 'PENDING', ...targetWhere }, select: { id: true } })
        if (existing) return { kind: 'duplicate' as const }
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const recentReports = await tx.report.count({ where: { reporterUserId: user.id, createdAt: { gte: since } } })
        if (recentReports >= 5) return { kind: 'limit' as const }
        const exists = input.targetType === 'COMPANY'
          ? await tx.companyProfile.findUnique({ where: { id: input.targetId }, select: { id: true } })
          : await tx.job.findUnique({ where: { id: input.targetId }, select: { id: true } })
        if (!exists) return { kind: 'missing' as const }
        const report = await tx.report.create({ data: {
          reporterUserId: user.id,
          targetType: input.targetType,
          ...(input.targetType === 'COMPANY' ? { targetCompanyId: input.targetId } : { targetJobId: input.targetId }),
          reason: input.reason,
          description: input.description,
        }, select: { id: true, targetType: true, reason: true, status: true, createdAt: true } })
        return { kind: 'created' as const, report }
      })
      if (result.kind === 'duplicate') return reply.code(409).send({ message: 'Ya tienes un reporte pendiente sobre este elemento.' })
      if (result.kind === 'limit') return reply.code(429).send({ message: 'Alcanzaste el máximo de 5 reportes en 24 horas. Inténtalo de nuevo cuando haya pasado ese período.' })
      if (result.kind === 'missing') return reply.code(404).send({ message: 'No se encontró el elemento reportado.' })
      return reply.code(201).send({ report: result.report })
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') return reply.code(409).send({ message: 'Ya tienes un reporte pendiente sobre este elemento.' })
      throw error
    }
  })
}
