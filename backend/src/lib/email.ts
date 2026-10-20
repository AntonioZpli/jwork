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

async function sendWithResend(payload: Record<string, unknown>) {
  if (!config.resendApiKey || !config.emailFrom) throw new EmailDeliveryError('configuration')
  let response: Response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new EmailDeliveryError('network')
  }
  if (!response.ok) {
    let providerCode: string | undefined
    let providerMessage: string | undefined
    try {
      const errorBody = await response.json() as { name?: unknown; code?: unknown; message?: unknown }
      const code = typeof errorBody.name === 'string' ? errorBody.name : errorBody.code
      if (typeof code === 'string' && /^[a-z0-9_-]{1,80}$/i.test(code)) providerCode = code
      if (typeof errorBody.message === 'string') {
        providerMessage = errorBody.message
          .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
          .replace(/\bre_[A-Za-z0-9_-]+\b/g, '[api-key]')
          .replace(/\b[a-f0-9]{64}\b/gi, '[token]')
          .slice(0, 240)
      }
    } catch { /* Keep the HTTP status if Resend returned a non-JSON body. */ }
    throw new EmailDeliveryError('provider', response.status, providerCode, providerMessage)
  }
}

export async function sendVerificationEmail(email: string, verificationUrl: string) {
  await sendWithResend({
    from: config.emailFrom,
    to: [email],
    subject: 'Verifica tu correo para entrar a Jinowork',
    text: `Crea o confirma tu cuenta de Jinowork con este enlace (válido por 15 minutos): ${verificationUrl}\n\nSi no solicitaste esta cuenta, ignora este mensaje.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124"><h2>Confirma tu correo</h2><p>Usa este enlace para verificar tu cuenta. Vence en 15 minutos.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Verificar correo</a></p><p>Si no solicitaste esta cuenta, ignora este mensaje.</p></div>`,
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendWithResend({
    from: config.emailFrom,
    to: [email],
    subject: 'Restablece tu contraseña de Jinowork',
    text: `Solicitaste cambiar tu contraseña. Usa este enlace válido por 30 minutos: ${resetUrl}\n\nSi no hiciste esta solicitud, ignora este correo.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124"><h2>Restablece tu contraseña</h2><p>Usa este enlace, válido por 30 minutos.</p><p><a href="${resetUrl}">Crear nueva contraseña</a></p><p>Si no hiciste esta solicitud, ignora este correo.</p></div>`,
  })
}

export async function sendAdminInvitationEmail(email: string, invitationUrl: string) {
  await sendWithResend({
    from: config.emailFrom,
    to: [email],
    subject: 'Invitación para administrar Jinowork',
    text: `Has recibido una invitación para administrar Jinowork. Crea tu contraseña con este enlace, válido por 24 horas y para un solo uso: ${invitationUrl}\n\nSi no esperabas esta invitación, ignora este correo.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124"><h2>Invitación de administrador</h2><p>Se te invitó a administrar Jinowork. Usa este enlace para crear tu contraseña. Vence en 24 horas y solo puede utilizarse una vez.</p><p><a href="${invitationUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Aceptar invitación</a></p><p>Si no esperabas esta invitación, ignora este correo.</p></div>`,
  })
}
