import crypto from 'node:crypto'
import { config } from '../../config'
import { prisma } from '../../lib/prisma'
import { EmailDeliveryError, sendLoginAlertEmail, sendVerificationEmail } from '../../lib/email'
import { hashToken, normalizeEmail } from '../../lib/auth'
import type { AuthRouteDependencies } from './types'

export function createAuthRouteContext(dependencies: AuthRouteDependencies) {
  const db = dependencies.prisma
  const deliverVerificationEmail = dependencies.sendVerificationEmail ?? sendVerificationEmail
  const deliverLoginAlert = dependencies.sendLoginAlertEmail ?? sendLoginAlertEmail
  const attempts = new Map<string, { count: number; resetAt: number }>()
  function rateLimited(key: string, limit = 10) {
    const now = Date.now()
    const current = attempts.get(key)
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 })
      return false
    }
    current.count++
    return current.count > limit
  }

  const verificationInFlight = new Map<string, Promise<boolean>>()
  const verificationSentAt = new Map<string, number>()
  async function requestVerificationEmail(user: { id: string; email: string }, request: any): Promise<boolean> {
    const email = normalizeEmail(user.email)
    const currentSend = verificationInFlight.get(email)
    if (currentSend) return currentSend
    const task = (async () => {
      const sentAt = verificationSentAt.get(email)
      if (sentAt && Date.now() - sentAt < 60_000) return true
      const codeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const token = Array.from({ length: 6 }, () => codeAlphabet[crypto.randomInt(0, codeAlphabet.length)]).join('')
      const tokenRecord = await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id}::uuid FOR UPDATE`
        const currentUser = await tx.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true, status: true } })
        if (!currentUser || currentUser.emailVerifiedAt || currentUser.status !== 'ACTIVE') return null
        const recentlyIssued = await tx.verificationToken.findFirst({
          where: { userId: user.id, type: 'EMAIL_VERIFICATION', usedAt: null, createdAt: { gt: new Date(Date.now() - 60_000) } },
          select: { id: true },
        })
        if (recentlyIssued) return { id: null as string | null }
        const record = await tx.verificationToken.create({ data: {
          userId: user.id, tokenHash: hashToken(`${email}:${token}`), type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 15 * 60_000),
        }, select: { id: true } })
        return record
      })
      if (!tokenRecord) return false
      // A recent unused token is either already being sent by another instance or was accepted less than a minute ago.
      if (!tokenRecord.id) return true
      try {
        await deliverVerificationEmail(user.email, token)
      } catch (error) {
        try {
          await db.verificationToken.updateMany({ where: { id: tokenRecord.id, usedAt: null }, data: { usedAt: new Date() } })
        } catch {
          request.log.error({ userId: user.id, tokenRecordId: tokenRecord.id }, 'Could not invalidate an unsent verification token')
        }
        if (error instanceof EmailDeliveryError) {
          request.log.error({ category: error.category, providerStatus: error.providerStatus, providerCode: error.providerCode, providerMessage: error.providerMessage }, 'Verification email was not accepted by the provider')
        } else {
          request.log.error({ errorType: error instanceof Error ? error.name : 'UnknownError' }, 'Verification email preparation failed')
        }
        return false
      }
      verificationSentAt.set(email, Date.now())
      try {
        await db.verificationToken.updateMany({
          where: { userId: user.id, type: 'EMAIL_VERIFICATION', usedAt: null, id: { not: tokenRecord.id } },
          data: { usedAt: new Date() },
        })
      } catch {
        request.log.error({ userId: user.id }, 'Could not invalidate older verification tokens after provider acceptance')
      }
      return true
    })()
    verificationInFlight.set(email, task)
    try { return await task }
    finally { if (verificationInFlight.get(email) === task) verificationInFlight.delete(email) }
  }

  async function notifySuccessfulLogin(user: { id: string; email: string }, occurredAt: Date, request: any) {
    let tokenRecordId: string | undefined
    try {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenRecord = await db.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          type: 'LOGIN_SECURITY',
          expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
        },
        select: { id: true },
      })
      tokenRecordId = tokenRecord.id

      const securityUrl = new URL('/auth/security-alert', config.frontendUrl)
      securityUrl.hash = new URLSearchParams({ token }).toString()
      await deliverLoginAlert(user.email, occurredAt, request.headers['user-agent'] ?? null, securityUrl.toString())
    } catch (error) {
      if (tokenRecordId) {
        try {
          await db.verificationToken.updateMany({
            where: { id: tokenRecordId, usedAt: null },
            data: { usedAt: new Date() },
          })
        } catch {
          request.log.error({ userId: user.id, tokenRecordId }, 'Could not invalidate an undelivered login security token')
        }
      }
      if (error instanceof EmailDeliveryError) {
        request.log.error({ category: error.category, providerStatus: error.providerStatus, providerCode: error.providerCode }, 'Login security email was not accepted by the provider')
      } else {
        request.log.error({ errorType: error instanceof Error ? error.name : 'UnknownError' }, 'Login security email could not be prepared')
      }
    }
  }

  return { db, rateLimited, requestVerificationEmail, notifySuccessfulLogin }
}

export type AuthRouteContext = ReturnType<typeof createAuthRouteContext>
