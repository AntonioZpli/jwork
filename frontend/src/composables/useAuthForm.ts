import { reactive, computed } from 'vue'
import type { AuthFormState, AuthMode, AuthRole, AuthErrors } from '@/types/auth'

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'El correo electrónico es requerido.'
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(value)) return 'Ingresa un correo electrónico válido.'
  return undefined
}

/**
 * Manages auth form state, validation and submission feedback.
 * Lives locally in AuthView — no global store needed.
 */
export function useAuthForm() {
  const state = reactive<AuthFormState>({
    role: 'candidate',
    mode: 'login',
    name: '',
    email: '',
    password: '',
    acceptTerms: false,
    showPassword: false,
    errors: {},
    submitted: false,
  })

  const isRecovery = computed(() => state.mode === 'recover')
  const isRegister = computed(() => state.mode === 'register')

  const feedbackMessage = computed<string | null>(() => {
    if (!state.submitted) return null
    if (state.mode === 'login') return 'El acceso todavía no está conectado. Esta pantalla es una demostración.'
    if (state.mode === 'register') return 'El registro todavía no está conectado. Esta pantalla es una demostración.'
    return 'La recuperación de contraseña todavía no está disponible. Esta pantalla es una demostración.'
  })

  function validate(): boolean {
    const errors: AuthErrors = {}

    if (!isRecovery.value && isRegister.value) {
      if (!state.name.trim()) errors.name = 'El nombre completo es requerido.'
    }

    errors.email = validateEmail(state.email)

    if (!isRecovery.value) {
      if (!state.password) errors.password = 'La contraseña es requerida.'
    }

    if (isRegister.value && !state.acceptTerms) {
      errors.terms = 'Debes aceptar los términos para continuar.'
    }

    // Remove undefined entries so iteration is clean
    const clean: AuthErrors = {}
    for (const key of Object.keys(errors) as (keyof AuthErrors)[]) {
      if (errors[key]) clean[key] = errors[key]
    }
    state.errors = clean
    return Object.keys(clean).length === 0
  }

  function submit() {
    if (validate()) {
      // All validation passed — show demo notice instead of real action
      state.submitted = true
    }
  }

  function setMode(mode: AuthMode) {
    state.mode = mode
    state.errors = {}
    state.submitted = false
    // Preserve role, name, email and password when switching login ↔ register
  }

  function setRole(role: AuthRole) {
    state.role = role
  }

  function dismissFeedback() {
    state.submitted = false
  }

  return {
    state,
    isRecovery,
    isRegister,
    feedbackMessage,
    validate,
    submit,
    setMode,
    setRole,
    dismissFeedback,
  }
}
