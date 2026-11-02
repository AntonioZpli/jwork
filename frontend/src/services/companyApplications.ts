import { apiRequest } from './auth'

export type CompanyApplication = {
  id: string; status: string; appliedAt: string
  job: { id: string; title: string }
  candidateProfile: {
    firstName: string; lastName: string; contactEmail: string | null; phone: string | null
    photoUrl: string | null; description: string | null; cvUrl: string | null
    professionalArea: { name: string } | null; specialization: { name: string } | null
    department: { name: string } | null; municipality: { name: string } | null
    experiences: { position: string; company: string; startDate: string; endDate: string | null; description: string | null }[]
    education: { institution: string; degree: string; startDate: string | null; endDate: string | null }[]
    languages: { level: string; language: { name: string } }[]
  }
  statusHistory: { previousStatus: string | null; newStatus: string; comment: string | null; createdAt: string }[]
}

export const companyApplicationsApi = {
  list: (jobId?: string, page = 1, search = '') => {
    const query = new URLSearchParams({ page: String(page), ...(search ? { q: search } : {}) })
    if (jobId) query.set('jobId', jobId)
    return apiRequest<{ applications: CompanyApplication[]; page: number; pageSize: number; total: number; pages: number }>(`/api/company/applications?${query}`)
  },
  updateStatus: (id: string, status: string, comment: string) => apiRequest<{ application: { id: string; status: string } }>(`/api/company/applications/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status, comment }) }),
  undoStatus: (id: string) => apiRequest<{ application: { id: string; status: string } }>(`/api/company/applications/${encodeURIComponent(id)}/status/undo`, { method: 'POST' }),
}
