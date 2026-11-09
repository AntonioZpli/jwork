import { apiRequest } from './auth'

export type PublicJob = {
  id: string; title: string; description: string; requirements: string
  workMode: string; remoteScope: string | null; contractType: string; workday: string
  scheduleType: string; scheduleDescription: string | null
  salaryMin: number | string | null; salaryMax: number | string | null; salaryCurrency: string | null; salaryPeriod: string | null; salaryNegotiable: boolean
  experienceYearsMin: number | null; isUrgent: boolean; vacancies: number; publishedAt: string | null; expiresAt: string | null
  company: {
    id: string; name: string; logoUrl?: string | null; website?: string | null; description?: string | null
    verificationStatus?: string
    economicSector?: { name: string } | null; department?: { name: string } | null; municipality?: { name: string } | null
  }
  professionalArea: { id: string; name: string }
  specialization: { id: string; name: string } | null
  department: { id: string; name: string } | null
  municipality: { id: string; name: string } | null
}

export type PublicCompany = {
  id: string; name: string; logoUrl: string | null; description: string | null; website: string | null; contactEmail: string | null; phone: string | null
  economicSector: { name: string } | null; department: { name: string } | null; municipality: { name: string } | null
  jobs: Pick<PublicJob, 'id' | 'title' | 'workMode' | 'contractType' | 'publishedAt' | 'professionalArea' | 'department' | 'municipality'>[]
}

export type PublicJobOptions = {
  professionalAreas: { id: string; name: string }[]
  specializations: { id: string; name: string; professionalAreaId: string }[]
  departments: { id: string; name: string }[]
  municipalities: { id: string; name: string; departmentId: string }[]
}

export type JobFilters = {
  q?: string; professionalAreaId?: string; specializationId?: string
  departmentId?: string; municipalityId?: string; workMode?: string
  contractType?: string; workday?: string; salaryMin?: string; salaryMax?: string
  currency?: string; salaryPeriod?: string; includeUnspecified?: string; page?: number
}

export type CandidateApplication = {
  id: string; status: string; appliedAt: string
  job: { id: string; title: string; status: string; professionalArea: { name: string }; municipality: { name: string } | null; department: { name: string } | null; company: { name: string } }
  statusHistory: { previousStatus: string | null; newStatus: string; comment: string | null; createdAt: string }[]
}

export type CandidateSavedJob = {
  createdAt: string
  available: boolean
  job: Pick<PublicJob, 'id' | 'title' | 'workMode' | 'contractType' | 'salaryMin' | 'salaryMax' | 'salaryCurrency' | 'salaryPeriod' | 'salaryNegotiable' | 'publishedAt' | 'company' | 'professionalArea' | 'municipality' | 'department'>
}

export const jobsApi = {
  options: () => apiRequest<PublicJobOptions>('/api/jobs/options'),
  list: (filters: JobFilters = {}) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, String(value))
    return apiRequest<{ jobs: PublicJob[]; page: number; pageSize: number; total: number; pages: number }>(`/api/jobs${params.size ? `?${params}` : ''}`)
  },
  get: (id: string) => apiRequest<{ job: PublicJob }>(`/api/jobs/${encodeURIComponent(id)}`),
  company: (id: string) => apiRequest<{ company: PublicCompany }>(`/api/companies/${encodeURIComponent(id)}`),
  candidateApplications: () => apiRequest<{ applications: CandidateApplication[]; withdrawnCount: number }>('/api/candidate/applications'),
  candidateSavedJobs: () => apiRequest<{ savedJobs: CandidateSavedJob[] }>('/api/candidate/saved-jobs'),
  candidateJobState: (id: string) => apiRequest<{
    application: { id: string; status: string; appliedAt: string; statusHistory: CandidateApplication['statusHistory'] } | null
    saved: boolean; canApply: boolean; missingProfileFields: string[]
    compatibility: { score: number; criteria: { key: string; label: string; candidateValue: string; jobValue: string; score: number; max: number }[] }
  }>(`/api/candidate/jobs/${encodeURIComponent(id)}/state`),
  apply: (id: string) => apiRequest<{ application: { id: string; status: string; appliedAt: string } }>(`/api/candidate/jobs/${encodeURIComponent(id)}/applications`, { method: 'POST', body: '{}' }),
  save: (id: string) => apiRequest<{ saved: true }>(`/api/candidate/jobs/${encodeURIComponent(id)}/saved`, { method: 'PUT', body: '{}' }),
  unsave: (id: string) => apiRequest<{ saved: false }>(`/api/candidate/jobs/${encodeURIComponent(id)}/saved`, { method: 'DELETE' }),
  withdraw: (id: string) => apiRequest<{ application: { id: string; status: string } }>(`/api/candidate/applications/${encodeURIComponent(id)}/withdraw`, { method: 'PATCH', body: '{}' }),
  removeApplication: (id: string) => apiRequest<{ removed: true }>(`/api/candidate/applications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export const jobLabels = {
  workMode: { ONSITE: 'Presencial', HYBRID: 'Híbrido', REMOTE: 'Remoto' } as Record<string, string>,
  contract: { PERMANENT: 'Permanente', TEMPORARY: 'Temporal', CONTRACT: 'Por contrato', INTERNSHIP: 'Pasantía' } as Record<string, string>,
  workday: { FULL_TIME: 'Tiempo completo', PART_TIME: 'Tiempo parcial' } as Record<string, string>,
  schedule: { FIXED: 'Horario fijo', FLEXIBLE: 'Horario flexible', SHIFT_BASED: 'Por turnos' } as Record<string, string>,
  salaryPeriod: { HOURLY: 'hora', DAILY: 'día', WEEKLY: 'semana', BIWEEKLY: 'quincena', MONTHLY: 'mes', YEARLY: 'año' } as Record<string, string>,
}

export function formatJobSalary(job: Pick<PublicJob, 'salaryNegotiable' | 'salaryCurrency' | 'salaryPeriod' | 'salaryMin' | 'salaryMax'>): string {
  if (job.salaryNegotiable && job.salaryMin == null && job.salaryMax == null) return 'Salario negociable'
  const currency = job.salaryCurrency === 'USD' ? 'USD' : 'NIO'
  const period = job.salaryPeriod ? ` / ${jobLabels.salaryPeriod[job.salaryPeriod] ?? job.salaryPeriod}` : ''
  const format = (value: number | string) => new Intl.NumberFormat('es-NI', { maximumFractionDigits: 0 }).format(Number(value))
  if (job.salaryMin != null && job.salaryMax != null) return `${currency} ${format(job.salaryMin)} – ${format(job.salaryMax)}${period}`
  if (job.salaryMin != null) return `Desde ${currency} ${format(job.salaryMin)}${period}`
  if (job.salaryMax != null) return `Hasta ${currency} ${format(job.salaryMax)}${period}`
  return job.salaryNegotiable ? 'Salario negociable' : 'Salario no especificado'
}
