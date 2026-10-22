import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { config } from '../config'

export class EmailDeliveryError extends Error {
  constructor(
    readonly category: 'configuration' | 'network' | 'provider',
    readonly providerStatus?: number,
    readonly providerCode?: string,
    readonly providerMessage?: string,
  ) {
    super('Transactional email could not be accepted.')
    this.name = 'EmailDeliveryError'
  }
}

type MailMessage = { to: string; subject: string; text: string; html: string }
type MailTransportFactory = (options: Parameters<typeof nodemailer.createTransport>[0]) => Pick<Transporter, 'sendMail'>

function sanitizeErrorMessage(value: unknown) {
  if (typeof value !== 'string') return undefined
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/\b[a-f0-9]{64}\b/gi, '[token]')
    .slice(0, 240)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

export function createEmailService(createTransport: MailTransportFactory = options => nodemailer.createTransport(options)) {
  async function send(message: MailMessage) {
    if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.emailFrom || !Number.isInteger(config.smtpPort) || config.smtpPort < 1) {
      throw new EmailDeliveryError('configuration')
    }

    let transport: Pick<Transporter, 'sendMail'>
    try {
      transport = createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: { user: config.smtpUser, pass: config.smtpPass },
      })
    } catch {
      throw new EmailDeliveryError('configuration')
    }

    try {
      await transport.sendMail({ from: config.emailFrom, ...message })
    } catch (error) {
      const failure = error as { code?: unknown; responseCode?: unknown; response?: unknown; message?: unknown }
      const code = typeof failure.code === 'string' && /^[a-z0-9_-]{1,80}$/i.test(failure.code) ? failure.code : undefined
      const responseCode = typeof failure.responseCode === 'number' ? failure.responseCode : undefined
      const response = sanitizeErrorMessage(failure.response) ?? sanitizeErrorMessage(failure.message)
      const networkCodes = new Set(['ECONNECTION', 'ECONNREFUSED', 'ETIMEDOUT', 'ESOCKET', 'EDNS'])
      throw new EmailDeliveryError(responseCode ? 'provider' : networkCodes.has(code ?? '') ? 'network' : 'provider', responseCode, code, response)
    }
  }

  return {
    sendVerificationEmail: (email: string, verificationUrl: string) => send({
      to: email,
      subject: 'Verifica tu correo para entrar a Jinowork',
      text: `Crea o confirma tu cuenta de Jinowork con este enlace (válido por 15 minutos): ${verificationUrl}\n\nSi no solicitaste esta cuenta, ignora este mensaje.`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124"><h2>Confirma tu correo</h2><p>Usa este enlace para verificar tu cuenta. Vence en 15 minutos.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Verificar correo</a></p><p>Si no solicitaste esta cuenta, ignora este mensaje.</p></div>`,
    }),
    sendPasswordResetEmail: (email: string, resetUrl: string) => send({
      to: email,
      subject: 'Restablece tu contraseña de Jinowork',
      text: `Solicitaste cambiar tu contraseña. Usa este enlace válido por 30 minutos: ${resetUrl}\n\nSi no hiciste esta solicitud, ignora este correo.`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124"><h2>Restablece tu contraseña</h2><p>Usa este enlace, válido por 30 minutos.</p><p><a href="${resetUrl}">Crear nueva contraseña</a></p><p>Si no hiciste esta solicitud, ignora este correo.</p></div>`,
    }),
    sendAdminInvitationEmail: (email: string, invitationUrl: string) => send({
      to: email,
      subject: 'Invitación para administrar Jinowork',
      text: `Has recibido una invitación para administrar Jinowork. Crea tu contraseña con este enlace, válido por 24 horas y para un solo uso: ${invitationUrl}\n\nSi no esperabas esta invitación, ignora este correo.`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124"><h2>Invitación de administrador</h2><p>Se te invitó a administrar Jinowork. Usa este enlace para crear tu contraseña. Vence en 24 horas y solo puede utilizarse una vez.</p><p><a href="${invitationUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Aceptar invitación</a></p><p>Si no esperabas esta invitación, ignora este correo.</p></div>`,
    }),
    sendAdminCredentialsEmail: (email: string, password: string, loginUrl: string) => send({
      to: email,
      subject: 'Tu acceso de administrador a Jinowork',
      text: `Se creó una cuenta de administrador para este correo.\n\nCorreo: ${email}\nContraseña inicial: ${password}\n\nInicia sesión aquí: ${loginUrl}\n\nSi no esperabas este acceso, contacta al equipo de Jinowork y no compartas este mensaje.`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124"><h2>Tu acceso de administrador</h2><p>Se creó una cuenta de administrador para este correo.</p><p><strong>Correo:</strong> ${escapeHtml(email)}<br><strong>Contraseña inicial:</strong><br><code style="display:inline-block;padding:10px 12px;background:#f2f4f7;border-radius:6px;font-size:16px;word-break:break-all">${escapeHtml(password)}</code></p><p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Iniciar sesión</a></p><p>Si no esperabas este acceso, contacta al equipo de Jinowork y no compartas este mensaje.</p></div>`,
    }),
    sendLoginAlertEmail: async (email: string, occurredAt: Date, userAgent: string | null, securityUrl: string) => {
      const timestamp = occurredAt.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')
      const browser = userAgent?.slice(0, 500) || 'No disponible'
      const safeBrowser = escapeHtml(browser)
      const safeUrl = escapeHtml(securityUrl)
      await send({
        to: email,
        subject: 'Nuevo inicio de sesión en Jinowork',
        text: `Se inició sesión en tu cuenta de Jinowork.\n\nFecha y hora: ${timestamp}\nNavegador o dispositivo reportado: ${browser}\n\nSi no reconoces este acceso, revisa el enlace y confirma que no fuiste tú: ${securityUrl}\n\nAl confirmar, cerraremos todas las sesiones activas de tu cuenta. Luego podrás cambiar tu contraseña desde “¿Olvidaste tu contraseña?” en Jinowork.`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124"><h2>Nuevo inicio de sesión</h2><p>Se inició sesión en tu cuenta de Jinowork.</p><p><strong>Fecha y hora:</strong> ${timestamp}<br><strong>Navegador o dispositivo reportado:</strong> ${safeBrowser}</p><p>Si no reconoces este acceso, puedes proteger tu cuenta:</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 20px;background:#b42318;color:#fff;text-decoration:none;border-radius:6px">No fui yo</a></p><p>Al confirmar, cerraremos todas las sesiones activas. Después podrás cambiar tu contraseña desde “¿Olvidaste tu contraseña?” en Jinowork.</p></div>`,
      })
    },
  }
}

const emailService = createEmailService()
export const { sendVerificationEmail, sendPasswordResetEmail, sendAdminInvitationEmail, sendAdminCredentialsEmail, sendLoginAlertEmail } = emailService
