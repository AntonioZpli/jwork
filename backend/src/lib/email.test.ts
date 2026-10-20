import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { config } from '../config'
import { EmailDeliveryError, sendVerificationEmail } from './email'

const originalFetch = globalThis.fetch
const originalApiKey = config.resendApiKey
const originalFrom = config.emailFrom
afterEach(() => {
  globalThis.fetch = originalFetch
  config.resendApiKey = originalApiKey
  config.emailFrom = originalFrom
})

describe('Resend verification email transport', () => {
  it('treats a successful HTTP response as provider acceptance', async () => {
    let requestedUrl = ''
    globalThis.fetch = async (input) => {
      requestedUrl = String(input)
      return new Response('{}', { status: 200 })
    }
    await sendVerificationEmail('person@example.com', 'https://app.example.com/auth/verify?token=secret')
    assert.equal(requestedUrl, 'https://api.resend.com/emails')
  })

  it('captures a sanitized provider rejection without exposing recipient or token', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      name: 'validation_error', message: 'Sender person@example.com is not verified; token a'.padEnd(64, 'a'),
    }), { status: 422 })
    await assert.rejects(sendVerificationEmail('person@example.com', 'https://app.example.com/?token=secret'), error => {
      assert.ok(error instanceof EmailDeliveryError)
      assert.equal(error.category, 'provider')
      assert.equal(error.providerStatus, 422)
      assert.equal(error.providerCode, 'validation_error')
      assert.ok(!error.providerMessage?.includes('person@example.com'))
      assert.ok(!error.providerMessage?.includes('a'.repeat(64)))
      return true
    })
  })

  it('distinguishes network errors and missing server configuration', async () => {
    globalThis.fetch = async () => { throw new TypeError('network down') }
    await assert.rejects(sendVerificationEmail('person@example.com', 'https://app.example.com'), error => {
      assert.ok(error instanceof EmailDeliveryError)
      assert.equal(error.category, 'network')
      return true
    })
    config.resendApiKey = ''
    await assert.rejects(sendVerificationEmail('person@example.com', 'https://app.example.com'), error => {
      assert.ok(error instanceof EmailDeliveryError)
      assert.equal(error.category, 'configuration')
      return true
    })
  })
})
