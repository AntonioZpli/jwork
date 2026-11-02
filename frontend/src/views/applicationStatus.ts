import type { CompanyApplication } from '@/services/companyApplications'

export type AppStatus = 'RECEIVED' | 'IN_REVIEW' | 'SHORTLISTED' | 'INTERVIEW' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN'
export type StatusTone = 'neutral' | 'progress' | 'success' | 'danger'

export type StatusAction = { status: AppStatus; label: string }
export type StatusDefinition = { label: string; description: string; tone: StatusTone; next?: StatusAction }

export const STATUS: Record<AppStatus, StatusDefinition> = {
  RECEIVED: { label: 'Recibida', description: 'La postulación está lista para revisar.', tone: 'neutral', next: { status: 'IN_REVIEW', label: 'Marcar en revisión' } },
  IN_REVIEW: { label: 'En revisión', description: 'La candidatura está en evaluación.', tone: 'progress', next: { status: 'INTERVIEW', label: 'Pasar a entrevista' } },
  SHORTLISTED: { label: 'En revisión', description: 'La candidatura está en evaluación.', tone: 'progress', next: { status: 'INTERVIEW', label: 'Pasar a entrevista' } },
  INTERVIEW: { label: 'Entrevista', description: 'La candidatura está en etapa de entrevista.', tone: 'progress', next: { status: 'SELECTED', label: 'Aceptar candidatura' } },
  SELECTED: { label: 'Aceptada', description: 'La candidatura fue aceptada.', tone: 'success' },
  REJECTED: { label: 'Rechazada', description: 'La candidatura fue rechazada.', tone: 'danger' },
  WITHDRAWN: { label: 'Retirada', description: 'El candidato retiró esta postulación.', tone: 'neutral' },
}

export const FILTER_STATUSES: AppStatus[] = ['RECEIVED', 'IN_REVIEW', 'INTERVIEW', 'SELECTED', 'REJECTED']
const UNDO_COMMENT = 'Cambio deshecho por la empresa.'
const DATE_FORMATTER = new Intl.DateTimeFormat('es-NI', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export type AppRow = CompanyApplication & {
  _effectiveStatus: AppStatus
  _statusLabel: string
  _statusDescription: string
  _statusTone: StatusTone
  _canUndo: boolean
  _nextStatus: AppStatus | null
  _nextLabel: string | null
}

type HistoryChange = CompanyApplication['statusHistory'][number]

function isAppStatus(value: string): value is AppStatus {
  return Object.prototype.hasOwnProperty.call(STATUS, value)
}

function normalizeStatus(value: string): AppStatus {
  return isAppStatus(value) ? value : 'RECEIVED'
}

function activeHistory(application: CompanyApplication): HistoryChange[] {
  const changes: HistoryChange[] = []
  for (const event of application.statusHistory) {
    if (!event.previousStatus) continue
    if (event.comment === UNDO_COMMENT) {
      const last = changes.at(-1)
      if (last?.previousStatus === event.newStatus && last.newStatus === event.previousStatus) changes.pop()
      continue
    }
    changes.push(event)
  }
  return changes
}

export function effectiveStatus(application: CompanyApplication): AppStatus {
  const current = activeHistory(application).at(-1)?.newStatus
  if (current) return normalizeStatus(current)
  const original = application.statusHistory.find((event) => !event.previousStatus)?.newStatus
  return normalizeStatus(original ?? application.status)
}

export function canUndo(application: CompanyApplication): boolean {
  const last = activeHistory(application).at(-1)
  return Boolean(last?.previousStatus && normalizeStatus(last.newStatus) === effectiveStatus(application))
}

export function nextAction(status: AppStatus): StatusAction | null {
  return STATUS[status].next ?? null
}

export function statusLabel(application: CompanyApplication): string {
  const status = effectiveStatus(application)
  const last = activeHistory(application).at(-1)
  if (status === 'REJECTED' && last?.previousStatus === 'INTERVIEW') return 'No aceptada'
  return STATUS[status].label
}

export function statusDescription(application: CompanyApplication): string {
  const status = effectiveStatus(application)
  if (status === 'REJECTED' && activeHistory(application).at(-1)?.previousStatus === 'INTERVIEW') return 'La candidatura no fue aceptada.'
  return STATUS[status].description
}

export function toAppRow(application: CompanyApplication): AppRow {
  const history = activeHistory(application)
  const last = history.at(-1)
  const originalStatus = application.statusHistory.find((event) => !event.previousStatus)?.newStatus
  const _effectiveStatus = normalizeStatus(last?.newStatus ?? originalStatus ?? application.status)
  const _canUndo = Boolean(last?.previousStatus && normalizeStatus(last.newStatus) === _effectiveStatus)
  const action = STATUS[_effectiveStatus].next
  const notAccepted = _effectiveStatus === 'REJECTED' && last?.previousStatus === 'INTERVIEW'
  return {
    ...application,
    _effectiveStatus,
    _statusLabel: notAccepted ? 'No aceptada' : STATUS[_effectiveStatus].label,
    _statusDescription: notAccepted ? 'La candidatura no fue aceptada.' : STATUS[_effectiveStatus].description,
    _statusTone: STATUS[_effectiveStatus].tone,
    _canUndo,
    _nextStatus: action?.status ?? null,
    _nextLabel: action?.label ?? null,
  }
}

export function candidateArea(application: CompanyApplication): string {
  return [application.candidateProfile.professionalArea?.name, application.candidateProfile.specialization?.name].filter(Boolean).join(' · ') || 'Área profesional no indicada'
}

export function candidateLocation(application: CompanyApplication): string {
  return [application.candidateProfile.municipality?.name, application.candidateProfile.department?.name].filter(Boolean).join(', ') || 'Ubicación no indicada'
}

export function candidateExperience(application: CompanyApplication): string {
  const count = application.candidateProfile.experiences.length
  return count === 1 ? '1 experiencia registrada' : `${count} experiencias registradas`
}

export function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : DATE_FORMATTER.format(date)
}

export function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
