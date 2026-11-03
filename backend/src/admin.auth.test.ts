import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { afterEach, describe, it } from 'node:test'
import { buildServer } from './server'

const token = 'admin-console-test-session'
const cookie = `jwork_session=${token}`
const tokenHash = createHash('sha256').update(token).digest('hex')
const apps: Array<Awaited<ReturnType<typeof buildServer>>> = []
afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.close())) })

async function createApp(role: string, status = 'ACTIVE', overrides: Record<string, unknown> = {}) {
  const db = {
    session: { findFirst: async ({ where }: any) => where.tokenHash === tokenHash ? { user: { id: 'user-id', email: 'admin@example.test', role, status } } : null },
    user: { count: async () => 0, findMany: async () => [] },
    ...overrides,
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

  it('does not allow deleting protected record types', async () => {
    const app = await createApp('ADMIN')
    const response = await app.inject({ method: 'DELETE', url: '/api/admin/records/reports/report-id', headers: { cookie } })
    assert.equal(response.statusCode, 400)
  })

  it('requires an active admin session to delete records', async () => {
    const app = await createApp('ADMIN', 'SUSPENDED')
    const response = await app.inject({ method: 'DELETE', url: '/api/admin/records/applications/application-id', headers: { cookie } })
    assert.equal(response.statusCode, 403)
  })

  it('validates company status before changing the owner account', async () => {
    const app = await createApp('ADMIN')
    const response = await app.inject({ method: 'PATCH', url: '/api/admin/companies/company-id/status', headers: { cookie }, payload: { status: 'VERIFIED' } })
    assert.equal(response.statusCode, 400)
  })

  it('records a company suspension and revokes the owner sessions', async () => {
    const writes: string[] = []
    const tx = {
      companyProfile: { findUnique: async () => ({ id: 'company-id', name: 'Test Co', owner: { id: 'company-owner-id', role: 'COMPANY', status: 'ACTIVE' } }) },
      user: { update: async () => ({ id: 'company-owner-id', status: 'SUSPENDED' }) },
      session: { updateMany: async () => { writes.push('sessions') } },
      moderationAction: { create: async () => { writes.push('moderation') } },
      auditLog: { create: async () => { writes.push('audit') } },
    }
    const app = await createApp('ADMIN', 'ACTIVE', { $transaction: async (callback: any) => callback(tx) })
    const response = await app.inject({ method: 'PATCH', url: '/api/admin/companies/company-id/status', headers: { cookie }, payload: { status: 'SUSPENDED', reason: 'Actividad fraudulenta' } })
    assert.equal(response.statusCode, 200)
    assert.deepEqual(writes, ['sessions', 'moderation', 'audit'])
  })
})
