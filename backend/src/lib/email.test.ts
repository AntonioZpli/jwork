import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { config } from '../config'
import { createEmailService, EmailDeliveryError } from './email'

const originalConfig = {
  smtpHost: config.smtpHost,
  smtpPort: config.smtpPort,
  smtpSecure: config.smtpSecure,
  smtpUser: config.smtpUser,
  smtpPass: config.smtpPass,
  emailFrom: config.emailFrom,
}

function setSmtpConfig() {
  config.smtpHost = 'smtp.gmail.com'
  config.smtpPort = 587
  config.smtpSecure = false
  config.smtpUser = 'sender@gmail.com'
  config.smtpPass = 'app-password'
  config.emailFrom = 'Jinowork <sender@gmail.com>'
}

afterEach(() => Object.assign(config, originalConfig))

describe('Gmail SMTP email transport', () => {
  it('sends verification mail using Gmail SMTP settings', async () => {
    setSmtpConfig()
    let transportOptions: any
    let sentMessage: any
    const service = createEmailService(options => {
      transportOptions = options
      return { sendMail: async (message: any) => { sentMessage = message; return {} } } as any
    })

    await service.sendVerificationEmail('person@example.com', 'https://app.example.com/auth/verify?token=secret')
    assert.deepEqual(transportOptions, {
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: 'sender@gmail.com', pass: 'app-password' },
    })
    assert.equal(sentMessage.from, 'Jinowork <sender@gmail.com>')
    assert.equal(sentMessage.to, 'person@example.com')
    assert.match(sentMessage.text, /token=secret/)
    assert.match(sentMessage.subject, /Verifica tu correo/)
  })

  it('sends login alerts with escaped user-agent data and without a session secret', async () => {
    setSmtpConfig()
    let sentMessage: any
    const service = createEmailService(() => ({ sendMail: async (message: any) => { sentMessage = message; return {} } }) as any)
    await service.sendLoginAlertEmail('person@example.com', new Date('2026-10-21T12:30:00.000Z'), '<img src=x onerror=alert(1)>', 'https://app.example.com/auth/security-alert#token=one-time-token')
    assert.equal(sentMessage.subject, 'Nuevo inicio de sesión en Jinowork')
    assert.match(sentMessage.text, /2026-10-21 12:30:00 UTC/)
    assert.match(sentMessage.text, /one-time-token/)
    assert.ok(sentMessage.html.includes('&lt;img'))
    assert.ok(!sentMessage.html.includes('<img'))
    assert.ok(!sentMessage.text.includes('jwork_session'))
  })

  it('classifies SMTP rejection and sanitizes recipient and token from errors', async () => {
    setSmtpConfig()
    const service = createEmailService(() => ({ sendMail: async () => {
      throw Object.assign(new Error('Rejected person@example.com token ' + 'a'.repeat(64)), { responseCode: 535, code: 'EAUTH' })
    } }) as any)
    await assert.rejects(service.sendVerificationEmail('person@example.com', 'https://app.example.com'), error => {
      assert.ok(error instanceof EmailDeliveryError)
      assert.equal(error.category, 'provider')
      assert.equal(error.providerStatus, 535)
      assert.equal(error.providerCode, 'EAUTH')
      assert.ok(!error.providerMessage?.includes('person@example.com'))
      assert.ok(!error.providerMessage?.includes('a'.repeat(64)))
      return true
    })
  })

  it('classifies connection failures and rejects incomplete configuration', async () => {
    setSmtpConfig()
    const service = createEmailService(() => ({ sendMail: async () => { throw Object.assign(new Error('offline'), { code: 'ECONNECTION' }) } }) as any)
    await assert.rejects(service.sendVerificationEmail('person@example.com', 'https://app.example.com'), error => {
      assert.ok(error instanceof EmailDeliveryError)
      assert.equal(error.category, 'network')
      return true
    })
    config.smtpPass = ''
    await assert.rejects(service.sendVerificationEmail('person@example.com', 'https://app.example.com'), error => {
      assert.ok(error instanceof EmailDeliveryError)
      assert.equal(error.category, 'configuration')
      return true
    })
  })
})
