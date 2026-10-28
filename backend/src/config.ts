import 'dotenv/config'
import { resolve } from 'node:path'

const isProduction = process.env.NODE_ENV === 'production'
const trustedProxies = process.env.TRUSTED_PROXIES
  ?.split(',')
  .map((address) => address.trim())
  .filter(Boolean) ?? []

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  frontendUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  // Trust forwarded client IP headers only from configured reverse proxies.
  trustedProxies,
  databaseUrl: process.env.DATABASE_URL ?? '',
  privateUploadDir: resolve(process.env.PRIVATE_UPLOAD_DIR ?? 'private-uploads'),
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  emailFrom: process.env.EMAIL_FROM ?? '',
  isProduction,
}
