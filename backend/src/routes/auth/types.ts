import { prisma } from '../../lib/prisma'
import { sendLoginAlertEmail, sendVerificationEmail } from '../../lib/email'

export type AuthRouteDependencies = {
  prisma: typeof prisma
  sendVerificationEmail?: typeof sendVerificationEmail
  sendLoginAlertEmail?: typeof sendLoginAlertEmail
}

export type PasswordPayload = {
  email?: string
  password?: string
  rememberDevice?: boolean
  role?: string
  firstName?: string
  lastName?: string
  companyName?: string
  phone?: string
}