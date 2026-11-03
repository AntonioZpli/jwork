import assert from 'node:assert/strict'
import test from 'node:test'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { registerReportRoutes } from './reports'

const reporterId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const targetId = '11111111-1111-4111-8111-111111111111'

async function createTestApp(overrides: Record<string, any> = {}) {
  const calls = { create: 0 }
  const reportModel = {
    findFirst: async () => null,
    count: async () => overrides.recentCount ?? 0,
    create: async ({ data }: { data: any }) => { calls.create++; return { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', status: 'PENDING', ...data, createdAt: new Date() } },
    ...overrides.report,
  }
  const db = {
    session: { findFirst: async () => ({ user: { id: reporterId, email: 'person@example.com', role: 'CANDIDATE', status: 'ACTIVE' } }) },
    report: reportModel,
    companyProfile: { findUnique: async () => ({ id: targetId }) },
    job: { findUnique: async () => ({ id: targetId }) },
  } as any
  db.$queryRaw = async () => []
  db.$transaction = async (run: (tx: any) => Promise<unknown>) => run(db)
  const app = Fastify({ logger: false })
  await app.register(cookie)
  await registerReportRoutes(app, db)
  return { app, calls }
}

test('creates reports tied to the selected company or job and requires an authenticated session', async () => {
  const { app, calls } = await createTestApp()
  const payload = { targetType: 'COMPANY', targetId, reason: 'FRAUD', description: 'La empresa solicita pagos por adelantado.' }
  const unauthenticated = await app.inject({ method: 'POST', url: '/api/reports', payload })
  assert.equal(unauthenticated.statusCode, 401)
  const company = await app.inject({ method: 'POST', url: '/api/reports', headers: { cookie: 'jwork_session=token' }, payload })
  assert.equal(company.statusCode, 201)
  assert.equal(company.json().report.targetCompanyId, targetId)
  const job = await app.inject({ method: 'POST', url: '/api/reports', headers: { cookie: 'jwork_session=token' }, payload: { ...payload, targetType: 'JOB', reason: 'FAKE_JOB' } })
  assert.equal(job.statusCode, 201)
  assert.equal(job.json().report.targetJobId, targetId)
  assert.equal(calls.create, 2)
  await app.close()
})

test('rejects a duplicate pending report from the same reporter on the same target', async () => {
  const { app, calls } = await createTestApp({ report: {
    findFirst: async () => ({ id: 'existing-report' }),
    create: async () => { calls.create++; throw new Error('A duplicate report must not be created') },
  } })
  const response = await app.inject({ method: 'POST', url: '/api/reports', headers: { cookie: 'jwork_session=token' }, payload: {
    targetType: 'JOB', targetId, reason: 'FAKE_JOB', description: 'La vacante parece ser fraudulenta.',
  } })
  assert.equal(response.statusCode, 409)
  assert.equal(calls.create, 0)
  await app.close()
})

test('limits each account to five reports in a rolling 24-hour window', async () => {
  const { app, calls } = await createTestApp({ recentCount: 5 })
  const response = await app.inject({ method: 'POST', url: '/api/reports', headers: { cookie: 'jwork_session=token' }, payload: {
    targetType: 'JOB', targetId, reason: 'FAKE_JOB', description: 'La vacante parece ser fraudulenta.',
  } })
  assert.equal(response.statusCode, 429)
  assert.match(response.json().message, /5 reportes en 24 horas/)
  assert.equal(calls.create, 0)
  await app.close()
})
