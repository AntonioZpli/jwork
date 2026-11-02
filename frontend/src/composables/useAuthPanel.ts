import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthForm } from '@/composables/useAuthForm'
import { authApi, type ApiError } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'

export function useAuthPanel() {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const { state, isRegister, setMode, setRole } = useAuthForm()
  const password = ref('')
  const rememberDevice = ref(false)
  const confirmPassword = ref('')
  const firstName = ref('')
  const lastName = ref('')
  const companyName = ref('')
  const busy = ref(false)
  const feedback = ref('')
  const feedbackVariant = ref<'info' | 'success' | 'error'>('info')
  const canResend = ref(false)
  const verificationEmail = ref('')
  const verificationStep = ref(false)
  const verificationCode = ref('')
  const retryBusy = ref(false)
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)
  const contentRef = ref<HTMLElement | null>(null)
  let contentResizeTimer: number | undefined

  const heading = computed(() =>
    verificationStep.value
      ? 'Verifica tu correo'
      : state.mode === 'register'
      ? 'Crea tu cuenta en Jinowork'
      : state.mode === 'recover'
        ? 'Recupera tu cuenta'
        : 'Inicia sesión en tu cuenta',
  )
  const description = computed(() =>
    verificationStep.value
      ? `Ingresa el código de 6 caracteres que enviamos a ${verificationEmail.value}.`
      : state.mode === 'register'
      ? 'Regístrate con tu correo y una contraseña segura.'
      : state.mode === 'recover'
        ? 'Te enviaremos instrucciones si existe una cuenta con ese correo.'
        : 'Accede con tu correo electrónico y contraseña.',
  )

  function clearProfileFields() {
    firstName.value = ''
    lastName.value = ''
    companyName.value = ''
  }

  function clearFeedback() {
    feedback.value = ''
    feedbackVariant.value = 'info'
  }

  async function animateContentResize(update: () => void) {
    const content = contentRef.value
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!content || reduceMotion) {
      update()
      return
    }

    window.clearTimeout(contentResizeTimer)
    const startHeight = content.getBoundingClientRect().height
    content.style.height = `${startHeight}px`
    content.style.overflow = 'hidden'
    update()
    await nextTick()

    content.style.removeProperty('height')
    const endHeight = content.getBoundingClientRect().height
    content.style.height = `${startHeight}px`
    void content.offsetHeight
    requestAnimationFrame(() => {
      content.style.height = `${endHeight}px`
    })

    contentResizeTimer = window.setTimeout(() => {
      if (contentRef.value !== content) return
      content.style.removeProperty('height')
      content.style.removeProperty('overflow')
    }, 380)
  }

  function changeMode(mode: typeof state.mode) {
    void animateContentResize(() => {
      setMode(mode)
      verificationStep.value = false
      verificationCode.value = ''
      if (mode === 'login') state.email = ''
      else verificationEmail.value = ''
      password.value = ''
      confirmPassword.value = ''
      showPassword.value = false
      showConfirmPassword.value = false
      clearProfileFields()
      clearFeedback()
      if (mode === 'register') canResend.value = false
    })
  }

  function changeRole(role: typeof state.role) {
    void animateContentResize(() => {
      setRole(role)
      clearProfileFields()
      delete state.errors.profile
    })
  }

  onBeforeUnmount(() => window.clearTimeout(contentResizeTimer))

  function onEmailInput() {
    delete state.errors.email
    verificationEmail.value = ''
    canResend.value = false
    clearFeedback()
  }

  function onPasswordInput() {
    delete state.errors.password
  }

  function onConfirmationInput() {
    delete state.errors.passwordConfirmation
  }

  function onProfileInput() {
    delete state.errors.profile
  }

  async function submit() {
    if (busy.value) return
    if (verificationStep.value) return verifyCode()
    state.errors = {}

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
      state.errors.email = 'Ingresa un correo válido.'
    }
    if (isRegister.value && password.value.length < 10) {
      state.errors.password = 'Usa una contraseña de al menos 10 caracteres.'
    }
    if (state.mode !== 'recover' && password.value.length > 128) {
      state.errors.password = 'La contraseña no puede superar los 128 caracteres.'
    }
    if (isRegister.value && password.value !== confirmPassword.value) {
      state.errors.passwordConfirmation = 'Las contraseñas no coinciden.'
    }
    if (
      isRegister.value &&
      state.role === 'candidate' &&
      (!firstName.value.trim() || !lastName.value.trim())
    ) {
      state.errors.profile = 'Completa tu nombre y apellidos.'
    }
    if (isRegister.value && state.role === 'company' && !companyName.value.trim()) {
      state.errors.profile = 'Ingresa el nombre de la empresa.'
    }
    if (Object.keys(state.errors).length) {
      await nextTick()
      const firstInvalid = document.querySelector<HTMLInputElement>(
        '.auth-form [aria-invalid="true"]',
      )
      firstInvalid?.focus()
      return
    }

    busy.value = true
    clearFeedback()
    canResend.value = false

    try {
      if (state.mode === 'register') {
        const result = await authApi.register({
          email: state.email.trim(),
          password: password.value,
          role: state.role,
          ...(state.role === 'candidate'
            ? { firstName: firstName.value.trim(), lastName: lastName.value.trim() }
            : { companyName: companyName.value.trim() }),
        })

        verificationEmail.value = state.email.trim()
        verificationCode.value = ''
        verificationStep.value = true
        feedback.value = result.message
        feedbackVariant.value = 'success'
        password.value = ''
        confirmPassword.value = ''
        showPassword.value = false
        showConfirmPassword.value = false
        clearProfileFields()
      } else if (state.mode === 'recover') {
        const result = await authApi.requestPasswordReset(state.email.trim())
        feedback.value = result.message
        feedbackVariant.value = 'success'
      } else {
        const email = state.email.trim()
        const result = await authApi.login(email, password.value, rememberDevice.value)
        authStore.user = result.user
        password.value = ''
        const requestedRedirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//')
          ? route.query.redirect
          : undefined
        await router.push(
          ['ADMIN', 'SUPERADMIN'].includes(result.user.role) ? '/admin' : { path: '/onboarding', query: requestedRedirect ? { redirect: requestedRedirect } : {} },
        )
      }
    } catch (error) {
      feedback.value = error instanceof Error ? error.message : 'No se pudo completar el acceso.'
      feedbackVariant.value = 'error'
      const apiError = error as ApiError
      canResend.value =
        apiError.code === 'VERIFICATION_EMAIL_FAILED' ||
        (apiError.status === 403 && feedback.value.toLowerCase().includes('verifica'))
      if (state.mode === 'register' && apiError.code === 'VERIFICATION_EMAIL_FAILED') {
        verificationEmail.value = state.email.trim()
        verificationStep.value = true
        password.value = ''
        confirmPassword.value = ''
        showPassword.value = false
        showConfirmPassword.value = false
        clearProfileFields()
      }
      if (state.mode === 'login' && apiError.code === 'EMAIL_NOT_VERIFIED') {
        verificationEmail.value = state.email.trim()
        verificationStep.value = true
        verificationCode.value = ''
      }
    } finally {
      busy.value = false
    }
  }

  async function verifyCode() {
    if (busy.value) return
    const code = verificationCode.value.trim().toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      feedback.value = 'Escribe los 6 caracteres del código.'
      feedbackVariant.value = 'error'
      return
    }
    busy.value = true
    clearFeedback()
    try {
      const result = await authApi.verifyEmailCode(verificationEmail.value, code)
      authStore.user = result.user
      const requestedRedirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//')
        ? route.query.redirect
        : undefined
      await router.replace({ path: '/onboarding', query: requestedRedirect ? { redirect: requestedRedirect } : {} })
    } catch (error) {
      feedback.value = error instanceof Error ? error.message : 'No se pudo verificar el correo.'
      feedbackVariant.value = 'error'
    } finally {
      busy.value = false
    }
  }

  async function resend() {
    if (retryBusy.value) return
    retryBusy.value = true
    clearFeedback()
    try {
      const result = await authApi.resendVerification(verificationEmail.value || state.email.trim())
      feedback.value = result.message
      feedbackVariant.value = 'success'
      canResend.value = false
    } catch (error) {
      feedback.value = error instanceof Error ? error.message : 'No se pudo reenviar el correo.'
      feedbackVariant.value = 'error'
      canResend.value = true
    } finally {
      retryBusy.value = false
    }
  }

  return {
    state,
    verificationStep,
    verificationEmail,
    verificationCode,
    isRegister,
    password,
    rememberDevice,
    confirmPassword,
    firstName,
    lastName,
    companyName,
    busy,
    feedback,
    feedbackVariant,
    canResend,
    retryBusy,
    showPassword,
    showConfirmPassword,
    contentRef,
    heading,
    description,
    changeMode,
    changeRole,
    clearFeedback,
    onEmailInput,
    onPasswordInput,
    onConfirmationInput,
    onProfileInput,
    submit,
    resend,
  }
}
