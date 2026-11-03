import assert from 'node:assert/strict'
import test from 'node:test'
import { canManageUserRole } from './adminPolicy.js'

test('ADMIN cannot manage other administrator accounts', () => {
  assert.equal(canManageUserRole('ADMIN', 'ADMIN'), false)
  assert.equal(canManageUserRole('ADMIN', 'SUPERADMIN'), false)
  assert.equal(canManageUserRole('ADMIN', 'CANDIDATE'), true)
})

test('SUPERADMIN can manage accounts allowed by the role policy', () => {
  assert.equal(canManageUserRole('SUPERADMIN', 'ADMIN'), true)
  assert.equal(canManageUserRole('SUPERADMIN', 'SUPERADMIN'), true)
})
