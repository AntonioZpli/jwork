import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { buildServer } from './server'

type User = { id: string; email: string; role: string; status: string; emailVerifiedAt: Date | null }
type Token = { id: string; userId: string; type: string; tokenHash: string; expiresAt: Date; createdAt: Date; usedAt: Date | null }

function makeDatabase(initialUsers: User[] = []) {
  const users = new Map(initialUsers.map(user => [user.email, user]))
  const tokens: Token[] = []
  let nextToken = 0
  const userByWhere = ({ where }: { where: { id?: string; email?: string } }) =>
    [...users.values()].find(user => (where.id ? user.id === where.id : user.email === where.email)) ?? null
  const db = {
    user: { findUnique: async (args: { where: { id?: string; email?: string } }) => userByWhere(args) },
    $transaction: async (callback: (tx: any) => Promise<unknown>) => callback({
      $queryRaw: async () => [],
      user: {
        findUnique: async (args: { where: { id?: string; email?: string } }) => userByWhere(args),
        create: async ({ data }: { data: { email: string; role: string } }) => {
        if (users.has(data.email)) throw Object.assign(new Error('unique'), { code: 'P2002' })
        const user: User = { id: `user-${users.size + 1}`, email: data.email, role: data.role, status: 'ACTIVE', emailVerifiedAt: null }
        users.set(user.email, user)
        return user
        },
      },
      candidateProfile: { create: async () => ({}) },
      companyProfile: { create: async () => ({}) },
      verificationToken: db.verificationToken,
    }),
    verificationToken: {
      findFirst: async ({ where }: { where: { userId: string; type: string; usedAt: null; createdAt: { gt: Date } } }) => {
        return tokens.find(token => token.userId === where.userId && token.type === where.type && token.usedAt === null && token.createdAt > where.createdAt.gt) ?? null
      },
      create: async ({ data }: { data: Omit<Token, 'id' | 'usedAt' | 'createdAt'> }) => {
        const token = { ...data, id: `token-${++nextToken}`, createdAt: new Date(), usedAt: null }
        tokens.push(token)
        return { id: token.id }
      },
      updateMany: async ({ where, data }: { where: { id?: string | { not: string }; userId?: string; type?: string; usedAt?: null }; data: { usedAt: Date } }) => {
        let count = 0
        for (const token of tokens) {
          if (where.id && typeof where.id === 'string' && token.id !== where.id) continue
          if (where.id && typeof where.id === 'object' && token.id === where.id.not) continue
          if (where.userId && token.userId !== where.userId) continue
          if (where.type && token.type !== where.type) continue
          if (where.usedAt === null && token.usedAt !== null) continue
          token.usedAt = data.usedAt
          count++
        }
        return { count }
      },
    },
  }
  return { db, users, tokens }
}

const payload = {
  email: '  new.user@example.com ', password: 'very-secure-password', role: 'candidate',
  firstName: 'New', lastName: 'User',
}
const apps: Array<Awaited<ReturnType<typeof buildServer>>> = []
afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.close())) })

async function makeApp(state = makeDatabase(), deliver: (email: string, url: string) => Promise<void> = async () => {}) {
  const app = await buildServer({ prisma: state.db as any, sendVerificationEmail: deliver, logger: false })
  apps.push(app)
  return { app, ...state }
}

describe('registration email verification recovery', () => {
  it('creates one pending account and sends a one-time token on success', async () => {
    let sentUrl = ''
    const { app, users, tokens } = await makeApp(undefined, async (_email, url) => { sentUrl = url })
    const response = await app.inject({ method: 'POST', url: '/api/auth/register', payload })
    assert.equal(response.statusCode, 201)
    assert.equal(users.size, 1)
    assert.equal(tokens.length, 1)
    assert.equal(tokens[0].usedAt, null)
    assert.match(sentUrl, /\/auth\/verify\?token=/)
  })

  it('keeps the account pending and reports a provider failure without claiming success', async () => {
    const { app, users, tokens } = await makeApp(undefined, async () => { throw new Error('resend unavailable') })
    const response = await app.inject({ method: 'POST', url: '/api/auth/register', payload })
    assert.equal(response.statusCode, 503)
    assert.equal(response.json().code, 'VERIFICATION_EMAIL_FAILED')
    assert.equal(users.size, 1)
    assert.equal([...users.values()][0].emailVerifiedAt, null)
    assert.equal(tokens.length, 1)
    assert.ok(tokens[0].usedAt)
  })

  it('retries the same pending address without creating a duplicate or losing old valid tokens on failure', async () => {
    const state = makeDatabase()
    let calls = 0
    const { app, users, tokens } = await makeApp(state, async () => { calls++; if (calls === 1) throw new Error('temporary') })
    const first = await app.inject({ method: 'POST', url: '/api/auth/register', payload })
    assert.equal(first.statusCode, 503)
    const retry = await app.inject({ method: 'POST', url: '/api/auth/register', payload })
    assert.equal(retry.statusCode, 200)
    assert.equal(users.size, 1)
    assert.equal(calls, 2)
    assert.equal(tokens.length, 2)
    assert.ok(tokens[0].usedAt)
    assert.equal(tokens[1].usedAt, null)
  })

  it('reuses the resend endpoint and reports repeated delivery failures clearly', async () => {
    const { app, tokens } = await makeApp(undefined, async () => { throw new Error('provider unavailable') })
    await app.inject({ method: 'POST', url: '/api/auth/register', payload })
    const response = await app.inject({ method: 'POST', url: '/api/auth/email/resend', payload: { email: payload.email } })
    assert.equal(response.statusCode, 503)
    assert.match(response.json().message, /Reinténtalo más tarde/)
    assert.equal(tokens.length, 2)
    assert.ok(tokens.every(token => token.usedAt))
  })

  it('successfully sends a new verification email after an earlier registration send failed', async () => {
    let calls = 0
    const { app, users, tokens } = await makeApp(undefined, async () => {
      calls++
      if (calls === 1) throw new Error('temporary provider failure')
    })
    await app.inject({ method: 'POST', url: '/api/auth/register', payload })
    const retry = await app.inject({ method: 'POST', url: '/api/auth/email/resend', payload: { email: payload.email } })
    assert.equal(retry.statusCode, 200)
    assert.equal(users.size, 1)
    assert.equal(calls, 2)
    assert.equal(tokens.length, 2)
    assert.ok(tokens[0].usedAt)
    assert.equal(tokens[1].usedAt, null)
  })

  it('does not create or send a verification token for an already verified account', async () => {
    const state = makeDatabase([{ id: 'existing', email: 'new.user@example.com', role: 'CANDIDATE', status: 'ACTIVE', emailVerifiedAt: new Date() }])
    let calls = 0
    const { app, users, tokens } = await makeApp(state, async () => { calls++ })
    const response = await app.inject({ method: 'POST', url: '/api/auth/register', payload })
    assert.equal(response.statusCode, 409)
    assert.equal(users.size, 1)
    assert.equal(tokens.length, 0)
    assert.equal(calls, 0)
  })

  it('handles simultaneous registration attempts with a unique account and one in-flight email', async () => {
    let calls = 0
    const { app, users, tokens } = await makeApp(undefined, async () => { calls++; await new Promise(resolve => setTimeout(resolve, 5)) })
    const responses = await Promise.all([
      app.inject({ method: 'POST', url: '/api/auth/register', payload }),
      app.inject({ method: 'POST', url: '/api/auth/register', payload }),
    ])
    assert.deepEqual(responses.map(response => response.statusCode).sort(), [200, 201])
    assert.equal(users.size, 1)
    assert.equal(calls, 1)
    assert.equal(tokens.length, 1)
    assert.equal(tokens[0].usedAt, null)
  })
})
