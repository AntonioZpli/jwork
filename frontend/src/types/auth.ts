/** User role in the auth flow */
export type AuthRole = 'candidate' | 'company'

/** Auth screen mode — discriminated union prevents invalid combinations */
export type AuthMode = 'login' | 'register' | 'recover'

/** Field-level validation error map */
export type AuthErrors = Partial<{
  name: string
  email: string
  password: string
  terms: string
}>

/** State managed by the useAuthForm composable */
export interface AuthFormState {
  role: AuthRole
  mode: AuthMode
  name: string
  email: string
  password: string
  acceptTerms: boolean
  showPassword: boolean
  errors: AuthErrors
  /** Whether the form has been submitted (triggers demo feedback) */
  submitted: boolean
}
