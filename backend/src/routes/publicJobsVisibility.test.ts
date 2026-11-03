import assert from 'node:assert/strict'
import { after, it } from 'node:test'
import Fastify from 'fastify'
import { registerPublicJobRoutes } from './publicJobs'

const companyId = '11111111-1111-4111-8111-111111111111'
const jobId = '22222222-2222-4222-8222-222222222222'
const queries: any[] = []
const db = {
  professionalArea: { findMany: async () => [] },
  specialization: { findMany: async () => [] },
  department: { findMany: async () => [] },
  municipality: { findMany: async () => [] },
  companyProfile: { findFirst: async (query: any) => { queries.push(query); return null } },
  job: {
    count: async ({ where }: any) => { queries.push({ where }); return 0 },
    findMany: async ({ where }: any) => { queries.push({ where }); return [] },
    findFirst: async (query: any) => { queries.push(query); return null },
  },
} as any

const app = Fastify()
registerPublicJobRoutes(app, db)
after(() => app.close())

it('hides a suspended company public profile', async () => {
  const response = await app.inject({ method: 'GET', url: `/api/companies/${companyId}` })
  assert.equal(response.statusCode, 404)
  assert.equal(queries.at(-1).where.owner.status, 'ACTIVE')
})

it('excludes suspended company offers from public search', async () => {
  queries.length = 0
  const response = await app.inject({ method: 'GET', url: '/api/jobs' })
  assert.equal(response.statusCode, 200)
  assert.equal(queries[0].where.company.owner.status, 'ACTIVE')
})

it('hides a suspended company offer detail', async () => {
  const response = await app.inject({ method: 'GET', url: `/api/jobs/${jobId}` })
  assert.equal(response.statusCode, 404)
  assert.equal(queries.at(-1).where.company.owner.status, 'ACTIVE')
})
