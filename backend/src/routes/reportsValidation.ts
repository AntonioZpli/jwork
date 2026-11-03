export const reportReasons = ['FRAUD', 'FAKE_JOB', 'IMPERSONATION', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'OTHER'] as const
export type ReportReasonValue = typeof reportReasons[number]

export function parseReportInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Completa los datos del reporte.')
  const body = value as Record<string, unknown>
  if (!['COMPANY', 'JOB'].includes(String(body.targetType))) throw new Error('El elemento reportado no es válido.')
  if (typeof body.targetId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.targetId)) throw new Error('El elemento reportado no es válido.')
  if (!reportReasons.includes(body.reason as ReportReasonValue)) throw new Error('Selecciona un motivo válido.')
  if (typeof body.description !== 'string' || body.description.trim().length < 10 || body.description.trim().length > 2000) throw new Error('Describe el problema (entre 10 y 2000 caracteres).')
  return { targetType: body.targetType as 'COMPANY' | 'JOB', targetId: body.targetId, reason: body.reason as ReportReasonValue, description: body.description.trim() }
}
