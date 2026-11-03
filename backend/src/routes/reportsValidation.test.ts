import assert from 'node:assert/strict'
import test from 'node:test'
import { parseReportInput } from './reportsValidation.js'

const targetId = '11111111-1111-4111-8111-111111111111'

test('parses reports for companies and jobs and trims the description', () => {
  assert.deepEqual(parseReportInput({ targetType: 'COMPANY', targetId, reason: 'FRAUD', description: '  Empresa sospechosa  ' }), {
    targetType: 'COMPANY', targetId, reason: 'FRAUD', description: 'Empresa sospechosa',
  })
  assert.equal(parseReportInput({ targetType: 'JOB', targetId, reason: 'FAKE_JOB', description: 'La oferta no existe' }).targetType, 'JOB')
})

test('rejects unsupported targets, reasons, and descriptions outside the allowed length', () => {
  assert.throws(() => parseReportInput({ targetType: 'USER', targetId, reason: 'OTHER', description: 'Descripción suficientemente larga' }), /elemento reportado/)
  assert.throws(() => parseReportInput({ targetType: 'JOB', targetId, reason: 'UNKNOWN', description: 'Descripción suficientemente larga' }), /motivo válido/)
  assert.throws(() => parseReportInput({ targetType: 'JOB', targetId, reason: 'OTHER', description: 'corto' }), /entre 10 y 2000/)
})
