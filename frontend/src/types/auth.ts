/** User role in the auth flow */
export type AuthRole = 'candidate' | 'company'

/** Auth screen mode — discriminated union prevents invalid combinations */
export type AuthMode = 'login' | 'register' | 'recover'

/** Field-level validation error map */
export type AuthErrors = Partial<{
  email: string
  password: string
  passwordConfirmation: string
  profile: string
}>

/** State managed by the useAuthForm composable */
export interface AuthFormState {
  role: AuthRole
  mode: AuthMode
  email: string
  errors: AuthErrors
}
