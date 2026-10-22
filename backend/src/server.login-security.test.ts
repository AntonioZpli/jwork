import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { buildServer } from './server'
import { hashPassword, hashToken } from './lib/auth'

type User = {
  id: string
  email: string
  passwordHash: string
  role: string
  status: string
  emailVerifiedAt: Date | null
  lastLoginAt: Date | null
}

type SecurityToken = {
  id: string
  userId: string
  tokenHash: string
  type: string
  expiresAt: Date
  usedAt: Date | null
}

type Session = {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
  userAgent: string | null
  ipAddress: string | null
}

const apps: Array<Awaited<ReturnType<typeof buildServer>>> = []
afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.close())) })

async function createContext(options: {
  status?: string
  emailVerified?: boolean
  sendLoginAlertEmail?: (email: string, occurredAt: Date, userAgent: string | null, securityUrl: string) => Promise<void>
} = {}) {
  const user: User = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'person@example.test',
    passwordHash: await hashPassword('Correct-Password-123'),
    role: 'CANDIDATE',
    status: options.status ?? 'ACTIVE',
    emailVerifiedAt: options.emailVerified === false ? null : new Date(),
    lastLoginAt: null,
  }
  const sessions: Session[] = []
  const tokens: SecurityToken[] = []
  let nextId = 0

  const db: any = {
    user: {
      findUnique: async ({ where }: any) => where.id === user.id || where.email === user.email ? user : null,
      update: async ({ data }: any) => Object.assign(user, data),
    },
    session: {
      create: async ({ data }: any) => {
        const session = { id: `session-${++nextId}`, ...data, revokedAt: null }
        sessions.push(session)
        return session
      },
      findFirst: async ({ where }: any) => sessions.find(session =>
        session.tokenHash === where.tokenHash && session.revokedAt === null && session.expiresAt > where.expiresAt.gt,
      ) ? { ...sessions.find(session => session.tokenHash === where.tokenHash)!, user } : null,
      updateMany: async ({ where, data }: any) => {
        let count = 0
        for (const session of sessions) {
          if (where.userId && session.userId !== where.userId) continue
          if (where.tokenHash && session.tokenHash !== where.tokenHash) continue
          if (where.revokedAt === null && session.revokedAt !== null) continue
          session.revokedAt = data.revokedAt
          count++
        }
        return { count }
      },
    },
    verificationToken: {
      create: async ({ data }: any) => {
        const token = { id: `token-${++nextId}`, ...data, usedAt: null }
        tokens.push(token)
        return { id: token.id }
      },
      findUnique: async ({ where }: any) => tokens.find(token => token.tokenHash === where.tokenHash) ?? null,
      updateMany: async ({ where, data }: any) => {
        let count = 0
        for (const token of tokens) {
          if (where.id && token.id !== where.id) continue
          if (where.tokenHash && token.tokenHash !== where.tokenHash) continue
          if (where.type && token.type !== where.type) continue
          if (where.usedAt === null && token.usedAt !== null) continue
          if (where.expiresAt?.gt && token.expiresAt <= where.expiresAt.gt) continue
          token.usedAt = data.usedAt
          count++
        }
        return { count }
      },
    },
    $transaction: async (callback: (tx: any) => Promise<unknown>) => callback(db),
  }

  const sent: Array<{ email: string; occurredAt: Date; userAgent: string | null; url: string }> = []
  const app = await buildServer({
    prisma: db,
    logger: false,
    sendLoginAlertEmail: options.sendLoginAlertEmail ?? (async (email, occurredAt, userAgent, url) => {
      sent.push({ email, occurredAt, userAgent, url })
    }),
  })
  apps.push(app)
  return { app, user, sessions, tokens, sent }
}

const loginPayload = { email: 'person@example.test', password: 'Correct-Password-123' }

async function loginAndGetCookie(app: Awaited<ReturnType<typeof buildServer>>) {
  const response = await app.inject({ method: 'POST', url: '/api/auth/login', payload: loginPayload })
  const header = response.headers['set-cookie']
  const cookie = (Array.isArray(header) ? header[0] : header)?.split(';', 1)[0]
  return { response, cookie }
}

function rawTokenFromUrl(url: string) {
  return new URLSearchParams(new URL(url).hash.slice(1)).get('token') ?? ''
}

describe('login security email and unrecognized access report', () => {
  it('creates a 24-hour session and emails a hashed, expiring one-time report token', async () => {
    const { app, sessions, tokens, sent } = await createContext()
    const before = Date.now()
    const { response } = await loginAndGetCookie(app)

    assert.equal(response.statusCode, 200)
    assert.equal(sessions.length, 1)
    assert.ok(sessions[0].expiresAt.getTime() - before >= 24 * 60 * 60_000)
    assert.ok(sessions[0].expiresAt.getTime() - before <= 24 * 60 * 60_000 + 1_000)
    assert.match(String(response.headers['set-cookie']), /Max-Age=86400/)
    assert.equal(sent.length, 1)
    assert.equal(sent[0].email, 'person@example.test')
    assert.equal(sent[0].url.includes('?token='), false)
    assert.equal(tokens.length, 1)
    assert.equal(tokens[0].type, 'LOGIN_SECURITY')
    assert.equal(tokens[0].tokenHash, hashToken(rawTokenFromUrl(sent[0].url)))
    assert.notEqual(tokens[0].tokenHash, rawTokenFromUrl(sent[0].url))
    assert.ok(tokens[0].expiresAt.getTime() - Date.now() <= 24 * 60 * 60_000)
  })

  it('does not create a session or send an alert for invalid credentials or unauthorized accounts', async () => {
    const invalid = await createContext()
    const wrongPassword = await invalid.app.inject({ method: 'POST', url: '/api/auth/login', payload: { ...loginPayload, password: 'wrong' } })
    assert.equal(wrongPassword.statusCode, 401)
    assert.equal(invalid.sessions.length, 0)
    assert.equal(invalid.sent.length, 0)

    const inactive = await createContext({ status: 'SUSPENDED' })
    const inactiveResponse = await inactive.app.inject({ method: 'POST', url: '/api/auth/login', payload: loginPayload })
    assert.equal(inactiveResponse.statusCode, 403)
    assert.equal(inactive.sessions.length, 0)
    assert.equal(inactive.sent.length, 0)

    const unverified = await createContext({ emailVerified: false })
    const unverifiedResponse = await unverified.app.inject({ method: 'POST', url: '/api/auth/login', payload: loginPayload })
    assert.equal(unverifiedResponse.statusCode, 403)
    assert.equal(unverified.sessions.length, 0)
    assert.equal(unverified.sent.length, 0)
  })

  it('keeps login successful and invalidates the unused report token if SMTP delivery fails', async () => {
    const { app, sessions, tokens } = await createContext({
      sendLoginAlertEmail: async () => { throw new Error('provider unavailable') },
    })
    const { response } = await loginAndGetCookie(app)
    assert.equal(response.statusCode, 200)
    assert.equal(sessions.length, 1)
    assert.equal(tokens.length, 1)
    assert.ok(tokens[0].usedAt)
  })

  it('does not revoke sessions when the report link is opened with GET', async () => {
    const { app, sessions, sent, tokens } = await createContext()
    await loginAndGetCookie(app)
    const token = rawTokenFromUrl(sent[0].url)
    const response = await app.inject({ method: 'GET', url: `/api/auth/security/report-unrecognized?token=${token}` })
    assert.equal(response.statusCode, 404)
    assert.equal(sessions[0].revokedAt, null)
    assert.equal(tokens[0].usedAt, null)
  })

  it('rejects invalid, expired, and reused report tokens without extra revocation', async () => {
    const { app, sessions, sent, tokens } = await createContext()
    await loginAndGetCookie(app)
    const token = rawTokenFromUrl(sent[0].url)

    const invalid = await app.inject({ method: 'POST', url: '/api/auth/security/report-unrecognized', payload: { token: 'a'.repeat(64) } })
    assert.equal(invalid.statusCode, 400)
    assert.equal(sessions[0].revokedAt, null)

    tokens[0].type = 'PASSWORD_RESET'
    const wrongPurpose = await app.inject({ method: 'POST', url: '/api/auth/security/report-unrecognized', payload: { token } })
    assert.equal(wrongPurpose.statusCode, 400)
    assert.equal(sessions[0].revokedAt, null)
    tokens[0].type = 'LOGIN_SECURITY'

    tokens[0].expiresAt = new Date(Date.now() - 1)
    const expired = await app.inject({ method: 'POST', url: '/api/auth/security/report-unrecognized', payload: { token } })
    assert.equal(expired.statusCode, 400)
    assert.equal(sessions[0].revokedAt, null)

    tokens[0].expiresAt = new Date(Date.now() + 60_000)
    const used = await app.inject({ method: 'POST', url: '/api/auth/security/report-unrecognized', payload: { token }, })
    assert.equal(used.statusCode, 200)
    const repeated = await app.inject({ method: 'POST', url: '/api/auth/security/report-unrecognized', payload: { token } })
    assert.equal(repeated.statusCode, 400)
    assert.ok(sessions[0].revokedAt)
  })

  it('requires explicit POST confirmation and revokes every active session', async () => {
    const { app, sessions, sent } = await createContext()
    const { response: loginResponse } = await loginAndGetCookie(app)
    sessions.push({
      id: 'another-session', userId: '11111111-1111-4111-8111-111111111111', tokenHash: 'another-hash',
      expiresAt: new Date(Date.now() + 60_000), revokedAt: null, userAgent: null, ipAddress: null,
    })
    const token = rawTokenFromUrl(sent[0].url)
    const report = await app.inject({ method: 'POST', url: '/api/auth/security/report-unrecognized', payload: { token } })
    assert.equal(report.statusCode, 200)
    assert.match(report.json().message, /cerraron las sesiones activas/)
    assert.ok(sessions.every(session => session.revokedAt))

    const cookieHeader = loginResponse.headers['set-cookie']
    const cookie = (Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader)?.split(';', 1)[0]
    const currentUser = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })
    assert.equal(currentUser.statusCode, 401)
  })

  it('allows only one concurrent confirmation to consume a report token', async () => {
    const { app, sessions, sent } = await createContext()
    await loginAndGetCookie(app)
    const token = rawTokenFromUrl(sent[0].url)
    const responses = await Promise.all([
      app.inject({ method: 'POST', url: '/api/auth/security/report-unrecognized', payload: { token } }),
      app.inject({ method: 'POST', url: '/api/auth/security/report-unrecognized', payload: { token } }),
    ])
    assert.deepEqual(responses.map(response => response.statusCode).sort(), [200, 400])
    assert.ok(sessions[0].revokedAt)
  })

  it('invalidates the server session on logout and clears the browser cookie', async () => {
    const { app, sessions } = await createContext()
    const { response, cookie } = await loginAndGetCookie(app)
    assert.equal(response.statusCode, 200)
    assert.ok(cookie)

    const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } })
    assert.equal(logout.statusCode, 200)
    assert.ok(sessions[0].revokedAt)
    assert.match(String(logout.headers['set-cookie']), /Max-Age=0/)

    const currentUser = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })
    assert.equal(currentUser.statusCode, 401)
  })
})
