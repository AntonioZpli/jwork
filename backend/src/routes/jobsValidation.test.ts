import assert from 'node:assert/strict'
import test from 'node:test'
import { parseJobInput, validateJobStatusTransition } from './jobsValidation.js'

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
