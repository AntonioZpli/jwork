import { apiRequest } from './auth'

export type CandidateDashboardData = {
  profile: {
    firstName: string; lastName: string; photoUrl: string | null; cvUrl: string | null; description: string | null
    department: { name: string } | null; municipality: { name: string } | null
    professionalArea: { name: string } | null; specialization: { name: string } | null
  }
  stats: { applications: number; savedJobs: number }
  recentApplications: { id: string; status: string; appliedAt: string; job: { title: string; company: { name: string } } }[]
  jobs: { id: string; title: string; workMode: string; contractType: string; publishedAt: string | null; company: { name: string }; professionalArea: { name: string }; municipality: { name: string } | null; department: { name: string } | null }[]
}

export type CompanyDashboardData = {
  company: { id: string; name: string; verificationStatus: string; department: { name: string } | null; municipality: { name: string } | null; economicSector: { name: string } | null }
  stats: { totalJobs: number; publishedJobs: number; totalApplications: number }
  recentJobs: { id: string; title: string; status: string; createdAt: string; publishedAt: string | null; _count: { applications: number; views: number } }[]
}

export type CompanyJob = {
  id: string; title: string; description: string; requirements: string
  professionalAreaId: string; specializationId: string | null; departmentId: string | null; municipalityId: string | null
  workMode: string; remoteScope: string | null; contractType: string; workday: string; scheduleType: string
  scheduleDescription: string | null; salaryMin: number | string | null; salaryMax: number | string | null
  salaryCurrency: string | null; salaryPeriod: string | null; salaryNegotiable: boolean
  experienceYearsMin: number | null; isUrgent: boolean; vacancies: number; status: string
  publishedAt: string | null; expiresAt: string | null; createdAt: string; updatedAt: string
  _count: { applications: number; views: number }
}

export type JobFormOptions = {
  companyVerificationStatus: string
  professionalAreas: { id: string; name: string }[]
  specializations: { id: string; name: string; professionalAreaId: string }[]
  departments: { id: string; name: string }[]
  municipalities: { id: string; name: string; departmentId: string }[]
}

export const workspaceApi = {
  candidateDashboard: () => apiRequest<CandidateDashboardData>('/api/candidate/dashboard'),
  companyDashboard: () => apiRequest<CompanyDashboardData>('/api/company/dashboard'),
  companyJobOptions: () => apiRequest<JobFormOptions>('/api/company/job-options'),
  companyJobs: () => apiRequest<{ jobs: CompanyJob[] }>('/api/company/jobs'),
  createCompanyJob: (data: Record<string, unknown>) => apiRequest<{ job: CompanyJob }>('/api/company/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateCompanyJob: (id: string, data: Record<string, unknown>) => apiRequest<{ job: CompanyJob }>(`/api/company/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateCompanyJobStatus: (id: string, status: string) => apiRequest<{ job: Pick<CompanyJob, 'id' | 'title' | 'status' | 'publishedAt'> }>(`/api/company/jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}
