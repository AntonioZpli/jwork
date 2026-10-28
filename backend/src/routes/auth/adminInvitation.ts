import type { FastifyInstance } from 'fastify'
import { hashPassword, hashToken } from '../../lib/auth'
import type { AuthRouteContext } from './context'

export function registerAdminInvitationRoutes(app: FastifyInstance, context: AuthRouteContext) {
  const { db } = context

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
}
