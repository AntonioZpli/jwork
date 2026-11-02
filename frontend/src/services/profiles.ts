import { apiRequest } from './auth'

export type ProfileOption = { id: string; name: string; departmentId?: string; professionalAreaId?: string }
export type CandidateProfileData = {
  firstName: string; lastName: string; contactEmail: string | null; phone: string | null
  photoUrl: string | null; cvUrl: string | null; cvFileName: string | null; description: string | null
  departmentId: string | null; municipalityId: string | null; professionalAreaId: string | null; specializationId: string | null
  department: { name: string } | null; municipality: { name: string } | null
  experiences: { id: string; position: string; company: string; startDate: string; endDate: string | null; description: string | null }[]
  education: { id: string; institution: string; degree: string; startDate: string | null; endDate: string | null }[]
  languages: { level: string; language: { id: string; name: string } }[]
}
export type CandidateProfileOptions = { departments: ProfileOption[]; municipalities: ProfileOption[]; professionalAreas: ProfileOption[]; specializations: ProfileOption[]; languages: ProfileOption[] }
export type CompanyProfileData = { id: string; name: string; logoUrl: string | null; description: string | null; website: string | null; economicSectorId: string | null; departmentId: string | null; municipalityId: string | null; address: string | null; contactEmail: string | null; phone: string | null; taxId: string | null; verificationStatus: string }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export const profilesApi = {
  candidate: () => apiRequest<{ profile: CandidateProfileData; catalogs: CandidateProfileOptions }>('/api/candidate/profile'),
  updateCandidate: (data: Record<string, unknown>) => apiRequest<{ profile: Partial<CandidateProfileData> }>('/api/candidate/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  addExperience: (data: Record<string, unknown>) => apiRequest<{ experience: CandidateProfileData['experiences'][number] }>('/api/candidate/profile/experiences', { method: 'POST', body: JSON.stringify(data) }),
  updateExperience: (id: string, data: Record<string, unknown>) => apiRequest<{ experience: CandidateProfileData['experiences'][number] }>(`/api/candidate/profile/experiences/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteExperience: (id: string) => apiRequest<{ ok: true }>(`/api/candidate/profile/experiences/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  addEducation: (data: Record<string, unknown>) => apiRequest<{ education: CandidateProfileData['education'][number] }>('/api/candidate/profile/education', { method: 'POST', body: JSON.stringify(data) }),
  updateEducation: (id: string, data: Record<string, unknown>) => apiRequest<{ education: CandidateProfileData['education'][number] }>(`/api/candidate/profile/education/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEducation: (id: string) => apiRequest<{ ok: true }>(`/api/candidate/profile/education/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  saveLanguage: (languageId: string, level: string) => apiRequest('/api/candidate/profile/languages', { method: 'POST', body: JSON.stringify({ languageId, level }) }),
  deleteLanguage: (languageId: string) => apiRequest<{ ok: true }>(`/api/candidate/profile/languages/${encodeURIComponent(languageId)}`, { method: 'DELETE' }),
  company: () => apiRequest<{ profile: CompanyProfileData; catalogs: { departments: ProfileOption[]; municipalities: ProfileOption[]; economicSectors: ProfileOption[] } }>('/api/company/profile'),
  updateCompany: (data: Record<string, unknown>) => apiRequest<{ profile: CompanyProfileData }>('/api/company/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  uploadCandidateFile: async (kind: 'cv' | 'photo', file: File) => {
    const response = await fetch(`${API_BASE_URL}/api/candidate/profile/files/${kind}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/octet-stream', 'X-Upload-Type': file.type, ...(kind === 'cv' ? { 'X-Upload-Name': encodeURIComponent(file.name) } : {}) }, body: file })
    const payload = await response.json().catch(() => null) as { fileId?: string; message?: string } | null
    if (!response.ok) throw new Error(payload?.message ?? 'No se pudo subir el archivo.')
    return payload as { fileId: string; kind: 'cv' | 'photo' }
  },
  uploadCompanyLogo: async (file: File) => {
    const response = await fetch(`${API_BASE_URL}/api/company/profile/logo`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/octet-stream', 'X-Upload-Type': file.type }, body: file })
    const payload = await response.json().catch(() => null) as { fileId?: string; message?: string } | null
    if (!response.ok) throw new Error(payload?.message ?? 'No se pudo subir el logo.')
    return payload as { fileId: string }
  },
  deleteCompanyLogo: () => apiRequest<{ ok: true }>('/api/company/profile/logo', { method: 'DELETE' }),
}

export function candidateFileUrl(kind: 'cv' | 'photo', fileId: string) {
  return `${API_BASE_URL}/api/candidate/files/${kind}/${encodeURIComponent(fileId)}`
}

export function companyLogoUrl(fileId: string) {
  return `${API_BASE_URL}/api/company/files/logo/${encodeURIComponent(fileId)}`
}

export async function loadCandidatePhoto(fileId: string) {
  const response = await fetch(candidateFileUrl('photo', fileId), { credentials: 'include' })
  if (!response.ok) throw new Error('No se pudo cargar la foto de perfil.')
  return URL.createObjectURL(await response.blob())
}
