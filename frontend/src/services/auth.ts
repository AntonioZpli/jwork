export type ApiError = Error & { status?: number; code?: string }

export type AuthRole = 'candidate' | 'company'
export type AuthUser = {
  id: string
  email: string
  role: 'CANDIDATE' | 'COMPANY' | 'ADMIN' | 'SUPERADMIN' | string
  status: string
}

export type OnboardingProfile = {
  firstName?: string
  lastName?: string
  phone?: string | null
  departmentId?: string | null
  municipalityId?: string | null
  professionalAreaId?: string | null
  specializationId?: string | null
  name?: string
  description?: string | null
  website?: string | null
  economicSectorId?: string | null
  address?: string | null
  contactEmail?: string | null
}

export type OnboardingOption = { id: string; name: string; departmentId?: string; professionalAreaId?: string }
export type OnboardingCatalogs = {
  departments: OnboardingOption[]
  municipalities: OnboardingOption[]
  professionalAreas?: OnboardingOption[]
  specializations?: OnboardingOption[]
  economicSectors?: OnboardingOption[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })
  } catch {
    const error = new Error('No se pudo conectar con Jinowork. Revisa tu conexión e inténtalo de nuevo.') as ApiError
    throw error
  }

  const text = await response.text()
  let payload: any = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    // Never surface an unstructured server response or stack trace to the UI.
  }

  if (!response.ok) {
    const safeMessage = typeof payload?.message === 'string' ? payload.message.trim() : ''
    const containsInternals = safeMessage.length > 240 || /prisma|invocation|node_modules|stack trace|\bat\s+.+\.(?:js|ts):\d+/i.test(safeMessage)
    const message = response.status >= 500
      ? 'El servidor no pudo completar la solicitud. Inténtalo de nuevo en unos momentos.'
      : safeMessage && !containsInternals
        ? safeMessage
        : 'No se pudo completar la solicitud. Revisa los datos e inténtalo de nuevo.'
    const error = new Error(message) as ApiError
    error.status = response.status
    error.code = payload?.code
    throw error
  }

  return payload as T
}

export const authApi = {
  getCurrentUser: () => apiRequest<{ user: AuthUser }>('/api/auth/me'),
  logout: () => apiRequest<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  login: (email: string, password: string, rememberMe: boolean) =>
    apiRequest<{ ok: true; user: AuthUser }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password, rememberMe }),
    }),
  register: (data: { email: string; password: string; role: AuthRole; firstName?: string; lastName?: string; companyName?: string; phone?: string }) =>
    apiRequest<{ ok: true; pendingVerification?: boolean; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resendVerification: (email: string) => apiRequest<{ ok: true; message: string }>('/api/auth/email/resend', { method: 'POST', body: JSON.stringify({ email }) }),
  requestPasswordReset: (email: string) => apiRequest<{ ok: true; message: string }>('/api/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => apiRequest<{ ok: true }>('/api/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
  acceptAdminInvitation: (token: string, password: string) => apiRequest<{ ok: true; message: string }>('/api/auth/admin-invitation/accept', { method: 'POST', body: JSON.stringify({ token, password }) }),
  verifyEmailLink: (token: string) =>
    apiRequest<{ ok: true; user: AuthUser }>('/api/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  getOnboarding: () =>
    apiRequest<{
      role: 'CANDIDATE' | 'COMPANY'
      step: number
      complete: boolean
      profile: OnboardingProfile | null
      catalogs: OnboardingCatalogs
    }>('/api/onboarding'),
  saveOnboardingStep: (step: number, data: Record<string, unknown>) =>
    apiRequest<{ ok: true; step: number; profileId: string }>(`/api/onboarding/step`, {
      method: 'POST',
      body: JSON.stringify({ step, ...data }),
    }),
}
