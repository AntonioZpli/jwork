import { reactive, computed } from 'vue'
import type { AuthFormState, AuthMode, AuthRole, AuthErrors } from '@/types/auth'

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'El correo electrónico es requerido.'
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(value)) return 'Ingresa un correo electrónico válido.'
  return undefined
}

/**
 * Manages email verification form state and validation.
 * Lives locally in AuthView — no global store needed.
 */
export function useAuthForm() {
  const state = reactive<AuthFormState>({
    role: 'candidate',
    mode: 'login',
    email: '',
    errors: {},
  })

  const isRecovery = computed(() => state.mode === 'recover')
  const isRegister = computed(() => state.mode === 'register')

  function validate(): boolean {
    const errors: AuthErrors = {}

    errors.email = validateEmail(state.email)

    // Remove undefined entries so iteration is clean
    const clean: AuthErrors = {}
    for (const key of Object.keys(errors) as (keyof AuthErrors)[]) {
      if (errors[key]) clean[key] = errors[key]
    }
    state.errors = clean
    return Object.keys(clean).length === 0
  }

  function setMode(mode: AuthMode) {
    state.mode = mode
    state.errors = {}
    // Preserve role, name, email and password when switching login ↔ register
  }

  function setRole(role: AuthRole) {
    state.role = role
  }

  return {
    state,
    isRecovery,
    isRegister,
    validate,
    setMode,
    setRole,
  }
}
