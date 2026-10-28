import assert from 'node:assert/strict'
import test from 'node:test'
import { parseApplicationComment, validateCompanyApplicationTransition } from './applicationValidation.js'

test('company application statuses follow the review lifecycle', () => {
  assert.equal(validateCompanyApplicationTransition('RECEIVED', 'IN_REVIEW'), 'IN_REVIEW')
  assert.equal(validateCompanyApplicationTransition('IN_REVIEW', 'INTERVIEW'), 'INTERVIEW')
  assert.equal(validateCompanyApplicationTransition('INTERVIEW', 'SELECTED'), 'SELECTED')
  assert.throws(() => validateCompanyApplicationTransition('SELECTED', 'IN_REVIEW'), /ya no admite/)
  assert.throws(() => validateCompanyApplicationTransition('RECEIVED', 'WITHDRAWN'), /no es válido/)
})

test('application comments are optional and length-limited', () => {
  assert.equal(parseApplicationComment('  Seguimos en contacto  '), 'Seguimos en contacto')
  assert.equal(parseApplicationComment('  '), null)
  assert.throws(() => parseApplicationComment('x'.repeat(1001)), /comentario/)
})
