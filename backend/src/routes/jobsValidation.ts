export class JobValidationError extends Error {}
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const enums = {
  workMode: ['ONSITE', 'HYBRID', 'REMOTE'],
  remoteScope: ['NICARAGUA_ONLY', 'INTERNATIONAL'],
  contractType: ['PERMANENT', 'TEMPORARY', 'CONTRACT', 'INTERNSHIP'],
  workday: ['FULL_TIME', 'PART_TIME'],
  scheduleType: ['FIXED', 'FLEXIBLE', 'SHIFT_BASED'],
  salaryCurrency: ['NIO', 'USD'],
  salaryPeriod: ['HOURLY', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'],
} as const

export type JobInput = {
  title: string
  description: string
  requirements: string
  professionalAreaId: string
  specializationId: string | null
  departmentId: string | null
  municipalityId: string | null
  workMode: (typeof enums.workMode)[number]
  remoteScope: (typeof enums.remoteScope)[number] | null
  contractType: (typeof enums.contractType)[number]
  workday: (typeof enums.workday)[number]
  scheduleType: (typeof enums.scheduleType)[number]
  scheduleDescription: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: (typeof enums.salaryCurrency)[number] | null
  salaryPeriod: (typeof enums.salaryPeriod)[number] | null
  salaryNegotiable: boolean
  experienceYearsMin: number | null
  isUrgent: boolean
  vacancies: number
  expiresAt: Date | null
}

const allowed = new Set(Object.keys(enums).concat([
  'title', 'description', 'requirements', 'professionalAreaId', 'specializationId',
  'departmentId', 'municipalityId', 'scheduleDescription', 'salaryMin', 'salaryMax', 'salaryNegotiable',
  'experienceYearsMin', 'isUrgent', 'vacancies', 'expiresAt',
]))

function text(value: unknown, label: string, max: number, required = false): string | null {
  if (value == null || value === '') {
    if (required) throw new JobValidationError(`${label} es obligatorio.`)
    return null
  }
  if (typeof value !== 'string') throw new JobValidationError(`${label} no es válido.`)
  const clean = value.trim()
  if ((!clean && required) || clean.length > max) throw new JobValidationError(`${label} no es válido.`)
  return clean || null
}

function catalogId(value: unknown, label: string, required = false): string | null {
  if (value == null || value === '') {
    if (required) throw new JobValidationError(`${label} es obligatorio.`)
    return null
  }
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new JobValidationError(`${label} no es válido.`)
  return value
}

function enumValue<K extends keyof typeof enums>(key: K, value: unknown, required = true): (typeof enums)[K][number] | null {
  if ((value == null || value === '') && !required) return null
  if (typeof value !== 'string' || !(enums[key] as readonly string[]).includes(value)) throw new JobValidationError(`El campo ${key} no es válido.`)
  return value as (typeof enums)[K][number]
}

function numberValue(value: unknown, label: string, min: number, max: number, integer = false): number | null {
  if (value == null || value === '') return null
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw new JobValidationError(`${label} no es válido.`)
  }
  return number
}

function booleanValue(value: unknown, label: string, fallback: boolean): boolean {
  if (value === undefined) return fallback
  if (typeof value !== 'boolean') throw new JobValidationError(`${label} no es válido.`)
  return value
}

export function parseJobInput(payload: unknown, current?: Record<string, unknown>): JobInput {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new JobValidationError('Los datos de la vacante no son válidos.')
  const body = payload as Record<string, unknown>
  if (Object.keys(body).some(key => !allowed.has(key))) throw new JobValidationError('La solicitud contiene campos no permitidos.')
  const source = { ...(current ?? {}), ...body }
  const title = text(source.title, 'El título', 160, true)!
  const description = text(source.description, 'La descripción', 12000, true)!
  const requirements = text(source.requirements, 'Los requisitos', 12000, true)!
  const professionalAreaId = catalogId(source.professionalAreaId, 'El área profesional', true)!
  const workMode = enumValue('workMode', source.workMode)! 
  const remoteScope = enumValue('remoteScope', source.remoteScope, false)
  if (workMode === 'REMOTE' && !remoteScope) throw new JobValidationError('Indica el alcance de la vacante remota.')
  if (workMode !== 'REMOTE' && remoteScope) throw new JobValidationError('El alcance remoto solo aplica a vacantes remotas.')
  const salaryMin = numberValue(source.salaryMin, 'El salario mínimo', 0, 999999999)
  const salaryMax = numberValue(source.salaryMax, 'El salario máximo', 0, 999999999)
  if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) throw new JobValidationError('El salario mínimo no puede superar el máximo.')
  const expiresAtText = source.expiresAt == null || source.expiresAt === '' ? null : source.expiresAt
  let expiresAt: Date | null = null
  if (expiresAtText !== null) {
    if (typeof expiresAtText !== 'string' && !(expiresAtText instanceof Date)) throw new JobValidationError('La fecha de vencimiento no es válida.')
    expiresAt = new Date(expiresAtText)
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) throw new JobValidationError('La fecha de vencimiento debe ser futura.')
  }

  return {
    title, description, requirements, professionalAreaId,
    specializationId: catalogId(source.specializationId, 'La especialidad'),
    departmentId: catalogId(source.departmentId, 'El departamento'),
    municipalityId: catalogId(source.municipalityId, 'El municipio'),
    workMode,
    remoteScope,
    contractType: enumValue('contractType', source.contractType)!,
    workday: enumValue('workday', source.workday)!,
    scheduleType: enumValue('scheduleType', source.scheduleType)!,
    scheduleDescription: text(source.scheduleDescription, 'La descripción del horario', 500),
    salaryMin, salaryMax,
    salaryCurrency: enumValue('salaryCurrency', source.salaryCurrency, false) ?? (salaryMin !== null || salaryMax !== null ? 'NIO' : null),
    salaryPeriod: enumValue('salaryPeriod', source.salaryPeriod, false) ?? (salaryMin !== null || salaryMax !== null ? 'MONTHLY' : null),
    salaryNegotiable: booleanValue(source.salaryNegotiable, 'El indicador de salario negociable', false),
    experienceYearsMin: numberValue(source.experienceYearsMin, 'La experiencia mínima', 0, 60, true),
    isUrgent: booleanValue(source.isUrgent, 'El indicador de urgencia', false),
    vacancies: numberValue(source.vacancies, 'El número de vacantes', 1, 1000, true) ?? 1,
    expiresAt,
  }
}

export function validateJobStatusTransition(current: string, next: unknown): 'PUBLISHED' | 'PAUSED' | 'CLOSED' {
  if (next !== 'PUBLISHED' && next !== 'PAUSED' && next !== 'CLOSED') throw new JobValidationError('El estado solicitado no es válido.')
  const allowedNext: Record<string, string[]> = {
    DRAFT: ['PUBLISHED', 'CLOSED'],
    PUBLISHED: ['PAUSED', 'CLOSED'],
    PAUSED: ['PUBLISHED', 'CLOSED'],
  }
  if (!allowedNext[current]?.includes(next)) throw new JobValidationError('La transición solicitada no está permitida para esta vacante.')
  return next
}
