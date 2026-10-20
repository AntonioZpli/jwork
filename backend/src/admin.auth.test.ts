import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { afterEach, describe, it } from 'node:test'
import { buildServer } from './server'

const token = 'admin-console-test-session'
const cookie = `jwork_session=${token}`
const tokenHash = createHash('sha256').update(token).digest('hex')
const apps: Array<Awaited<ReturnType<typeof buildServer>>> = []
afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.close())) })

async function createApp(role: string, status = 'ACTIVE') {
  const db = {
    session: { findFirst: async ({ where }: any) => where.tokenHash === tokenHash ? { user: { id: 'user-id', email: 'admin@example.test', role, status } } : null },
    user: { count: async () => 0, findMany: async () => [] },
  }
  const app = await buildServer({ prisma: db as any, logger: false })
  apps.push(app)
  return app
}

describe('admin API authorization', () => {
  it('rejects requests without a session', async () => {
    const app = await createApp('ADMIN')
    const response = await app.inject({ method: 'GET', url: '/api/admin/overview' })
    assert.equal(response.statusCode, 401)
  })

  it('rejects authenticated non-admin users', async () => {
    const app = await createApp('CANDIDATE')
    const response = await app.inject({ method: 'GET', url: '/api/admin/overview', headers: { cookie } })
    assert.equal(response.statusCode, 403)
  })

  it('rejects an admin session after the account is suspended', async () => {
    const app = await createApp('ADMIN', 'SUSPENDED')
    const response = await app.inject({ method: 'GET', url: '/api/admin/overview', headers: { cookie } })
    assert.equal(response.statusCode, 403)
  })

  it('allows an active administrator to load permitted records', async () => {
    const app = await createApp('ADMIN')
    const response = await app.inject({ method: 'GET', url: '/api/admin/users', headers: { cookie } })
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.json().data, [])
  })

  it('requires SUPERADMIN for administrator role changes', async () => {
    const app = await createApp('ADMIN')
    const response = await app.inject({ method: 'PATCH', url: '/api/admin/users/target-id/role', headers: { cookie }, payload: { role: 'ADMIN' } })
    assert.equal(response.statusCode, 403)
  })
})
