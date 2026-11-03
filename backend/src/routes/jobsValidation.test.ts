import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPublicSalaryWhere, parseJobInput, parsePublicSalaryFilter, validateJobStatusTransition } from './jobsValidation.js'

const validJob = {
  title: 'Analista de datos', description: 'Análisis de información', requirements: 'Experiencia en SQL',
  professionalAreaId: '11111111-1111-4111-8111-111111111111',
  workMode: 'ONSITE', contractType: 'PERMANENT', workday: 'FULL_TIME', scheduleType: 'FIXED',
}

test('parses a valid job draft and supplies database-aligned optional defaults', () => {
  const parsed = parseJobInput(validJob)
  assert.equal(parsed.vacancies, 1)
  assert.equal(parsed.workMode, 'ONSITE')
  assert.equal(parsed.salaryNegotiable, false)
  assert.equal(parsed.specializationId, null)
})

test('rejects inconsistent remote scope, salary ranges, and unsupported fields', () => {
  assert.throws(() => parseJobInput({ ...validJob, remoteScope: 'INTERNATIONAL' }), /solo aplica/)
  assert.throws(() => parseJobInput({ ...validJob, salaryMin: 900, salaryMax: 100 }), /no puede superar/)
  assert.throws(() => parseJobInput({ ...validJob, companyProfileId: 'attacker-controlled' }), /campos no permitidos/)
})

test('requires a remote scope for remote positions', () => {
  assert.throws(() => parseJobInput({ ...validJob, workMode: 'REMOTE' }), /alcance/)
  assert.equal(parseJobInput({ ...validJob, workMode: 'REMOTE', remoteScope: 'NICARAGUA_ONLY' }).remoteScope, 'NICARAGUA_ONLY')
})

test('allows only the supported job lifecycle transitions', () => {
  assert.equal(validateJobStatusTransition('DRAFT', 'PUBLISHED'), 'PUBLISHED')
  assert.equal(validateJobStatusTransition('PUBLISHED', 'PAUSED'), 'PAUSED')
  assert.equal(validateJobStatusTransition('PAUSED', 'CLOSED'), 'CLOSED')
  assert.throws(() => validateJobStatusTransition('CLOSED', 'PUBLISHED'), /transición/)
  assert.throws(() => validateJobStatusTransition('DRAFT', 'REMOVED'), /estado/)
})

test('validates salary filters with matching currency and period and supports unspecified salaries', () => {
  assert.deepEqual(parsePublicSalaryFilter({ salaryMin: '1000', salaryMax: '2000', currency: 'USD', salaryPeriod: 'MONTHLY' }), {
    min: 1000, max: 2000, currency: 'USD', period: 'MONTHLY', includeUnspecified: false,
  })
  assert.throws(() => parsePublicSalaryFilter({ salaryMin: '2000', salaryMax: '1000', currency: 'NIO', salaryPeriod: 'MONTHLY' }), /no puede superar/)
  assert.throws(() => parsePublicSalaryFilter({ salaryMin: '1000' }), /moneda y período/)
  assert.deepEqual(buildPublicSalaryWhere({ includeUnspecified: true }), { salaryMin: null, salaryMax: null })
  assert.deepEqual(buildPublicSalaryWhere({ min: 1000, currency: 'NIO', period: 'MONTHLY', includeUnspecified: true }), {
    OR: [
      { AND: [{ salaryCurrency: 'NIO' }, { salaryPeriod: 'MONTHLY' }, { OR: [{ salaryMax: { gte: 1000 } }, { salaryMax: null, salaryMin: { gte: 1000 } }] }] },
      { salaryMin: null, salaryMax: null },
    ],
  })
})
