import { ApplicationStatus } from '../generated/prisma/enums'

const transitions: Record<string, ApplicationStatus[]> = {
  RECEIVED: ['IN_REVIEW', 'SHORTLISTED', 'REJECTED'],
  IN_REVIEW: ['SHORTLISTED', 'INTERVIEW', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'SELECTED', 'REJECTED'],
  INTERVIEW: ['SELECTED', 'REJECTED'],
}

export class ApplicationValidationError extends Error {}

export function parseCompanyApplicationStatus(next: unknown): ApplicationStatus {
  if (typeof next !== 'string' || !['IN_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'].includes(next)) {
    throw new ApplicationValidationError('El estado solicitado no es válido.')
  }
  return next as ApplicationStatus
}

export function validateCompanyApplicationTransition(current: string, next: unknown): ApplicationStatus {
  const status = parseCompanyApplicationStatus(next)
  if (!transitions[current]?.includes(status)) {
    throw new ApplicationValidationError('La postulación ya no admite ese cambio de estado.')
  }
  return status
}

export function parseApplicationComment(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || value.trim().length > 1000) throw new ApplicationValidationError('El comentario no es válido.')
  return value.trim() || null
}
