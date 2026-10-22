import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { config } from '../config'
import { prisma } from './prisma'

export const SESSION_COOKIE = 'jwork_session'
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24

const scrypt = promisify(crypto.scrypt)

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const hash = await scrypt(password, salt, 64) as Buffer
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string | null) {
  if (!stored?.startsWith('scrypt:')) return false
  const [, saltHex, hashHex] = stored.split(':')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function serializeUser(user: { id: string; email: string; role: string; status: string }) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  }
}

export async function createSessionCookie(db: typeof prisma, reply: any, userId: string, request: any, ttlMs = SESSION_TTL_MS) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + ttlMs)

  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: request.headers['user-agent'] ?? null,
      ipAddress: request.ip ?? null,
    },
  })

  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: config.isProduction ? 'none' : 'lax',
    secure: config.isProduction,
    maxAge: Math.floor(ttlMs / 1000),
  })

  return expiresAt
}

export async function resolveSessionUser(request: any, db: typeof prisma = prisma) {
  const token = request.cookies?.[SESSION_COOKIE]

  if (!token) {
    return null
  }

  const session = await db.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  })

  if (!session) {
    return null
  }

  return serializeUser(session.user)
}

export async function revokeSessionCookie(db: typeof prisma, reply: any, request: any) {
  const sessionToken = request.cookies?.[SESSION_COOKIE]

  if (sessionToken) {
    await db.session.updateMany({
      where: {
        tokenHash: hashToken(sessionToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  reply.clearCookie(SESSION_COOKIE, { path: '/' })
}
