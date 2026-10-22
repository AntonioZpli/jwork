<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthForm } from '@/composables/useAuthForm'
import { authApi, type ApiError } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import AuthModeTabs from './AuthModeTabs.vue'
import AuthRoleSelector from './AuthRoleSelector.vue'
import AuthFeedback from './AuthFeedback.vue'

const router = useRouter()
const authStore = useAuthStore()
const { state, isRegister, setMode, setRole } = useAuthForm()
const password = ref('')
const confirmPassword = ref('')
const firstName = ref('')
const lastName = ref('')
const companyName = ref('')
const busy = ref(false)
const feedback = ref('')
const feedbackVariant = ref<'info' | 'success' | 'error'>('info')
const canResend = ref(false)
const retryBusy = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const heading = computed(() => state.mode === 'register'
  ? 'Crea tu cuenta en Jinowork'
  : state.mode === 'recover'
    ? 'Recupera tu cuenta'
    : 'Inicia sesión en tu cuenta')
const description = computed(() => state.mode === 'register'
  ? 'Regístrate con tu correo y una contraseña segura.'
  : state.mode === 'recover'
    ? 'Te enviaremos instrucciones si existe una cuenta con ese correo.'
    : 'Accede con tu correo electrónico y contraseña.')

function clearProfileFields() {
  firstName.value = ''
  lastName.value = ''
  companyName.value = ''
}

function clearFeedback() {
  feedback.value = ''
  feedbackVariant.value = 'info'
}

function changeMode(mode: typeof state.mode) {
  setMode(mode)
  password.value = ''
  confirmPassword.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
  clearProfileFields()
  clearFeedback()
  if (mode === 'register') canResend.value = false
}

function changeRole(role: typeof state.role) {
  setRole(role)
  clearProfileFields()
  delete state.errors.profile
}

function onEmailInput() {
  delete state.errors.email
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
  state.errors = {}

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
    state.errors.email = 'Ingresa un correo válido.'
  }
  if (state.mode !== 'recover' && (password.value.length < 10 || password.value.length > 128)) {
    state.errors.password = 'La contraseña debe tener entre 10 y 128 caracteres.'
  }
  if (isRegister.value && password.value !== confirmPassword.value) {
    state.errors.passwordConfirmation = 'Las contraseñas no coinciden.'
  }
  if (isRegister.value && state.role === 'candidate' && (!firstName.value.trim() || !lastName.value.trim())) {
    state.errors.profile = 'Completa tu nombre y apellidos.'
  }
  if (isRegister.value && state.role === 'company' && !companyName.value.trim()) {
    state.errors.profile = 'Ingresa el nombre de la empresa.'
  }
  if (Object.keys(state.errors).length) {
    await nextTick()
    const firstInvalid = document.querySelector<HTMLInputElement>('.auth-form [aria-invalid="true"]')
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

      feedback.value = result.message
      feedbackVariant.value = 'success'
      canResend.value = true
      setMode('login')
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
      const result = await authApi.login(state.email.trim(), password.value)
      authStore.user = result.user
      password.value = ''
      await router.push(['ADMIN', 'SUPERADMIN'].includes(result.user.role) ? '/admin' : '/onboarding')
    }
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'No se pudo completar el acceso.'
    feedbackVariant.value = 'error'
    const apiError = error as ApiError
    canResend.value = apiError.code === 'VERIFICATION_EMAIL_FAILED'
      || (apiError.status === 403 && feedback.value.toLowerCase().includes('verifica'))
    if (state.mode === 'register' && apiError.code === 'VERIFICATION_EMAIL_FAILED') {
      setMode('login')
      password.value = ''
      confirmPassword.value = ''
      showPassword.value = false
      showConfirmPassword.value = false
      clearProfileFields()
    }
  } finally {
    busy.value = false
  }
}

async function resend() {
  if (retryBusy.value) return
  retryBusy.value = true
  clearFeedback()
  try {
    const result = await authApi.resendVerification(state.email.trim())
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
</script>

<template>
  <section class="auth-form-panel" aria-label="Formulario de acceso">
    <div class="auth-form-panel__content">
      <div class="auth-kicker">
        <span class="auth-kicker__line" aria-hidden="true" />
        <span>{{ state.mode === 'login' ? 'Bienvenido/a de nuevo' : 'Acceso seguro' }}</span>
      </div>

      <div class="auth-heading-group">
        <h2 class="auth-heading">{{ heading }}</h2>
        <p class="auth-sub">{{ description }}</p>
      </div>

      <AuthModeTabs :model-value="state.mode" @update:model-value="changeMode" />
      <AuthRoleSelector v-if="isRegister" :model-value="state.role" @update:model-value="changeRole" />

      <form class="auth-form" novalidate @submit.prevent="submit">
        <template v-if="isRegister && state.role === 'candidate'">
          <label class="auth-field" for="auth-first-name">
            <span>Nombre</span>
            <input id="auth-first-name" v-model="firstName" autocomplete="given-name" maxlength="100" required :aria-invalid="Boolean(state.errors.profile)" :aria-describedby="state.errors.profile ? 'profile-error' : undefined" @input="onProfileInput" />
          </label>
          <label class="auth-field" for="auth-last-name">
            <span>Apellidos</span>
            <input id="auth-last-name" v-model="lastName" autocomplete="family-name" maxlength="100" required :aria-invalid="Boolean(state.errors.profile)" :aria-describedby="state.errors.profile ? 'profile-error' : undefined" @input="onProfileInput" />
          </label>
        </template>

        <label v-else-if="isRegister" class="auth-field" for="auth-company-name">
          <span>Nombre de la empresa</span>
          <input id="auth-company-name" v-model="companyName" autocomplete="organization" maxlength="160" required :aria-invalid="Boolean(state.errors.profile)" :aria-describedby="state.errors.profile ? 'profile-error' : undefined" @input="onProfileInput" />
        </label>

        <label class="auth-field" for="auth-email">
          <span>Correo electrónico</span>
          <input
            id="auth-email"
            v-model="state.email"
            type="email"
            autocomplete="email"
            required
            maxlength="254"
            placeholder="tu@correo.com"
            :aria-invalid="Boolean(state.errors.email)"
            :aria-describedby="state.errors.email ? 'email-error' : undefined"
            @input="onEmailInput"
          />
          <small v-if="state.errors.email" id="email-error" class="auth-field__error" role="alert">{{ state.errors.email }}</small>
        </label>

        <label v-if="state.mode !== 'recover'" class="auth-field" for="auth-password">
          <span>Contraseña</span>
          <span class="auth-password-wrap" :class="{ 'auth-password-wrap--error': state.errors.password }">
            <input
              id="auth-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              minlength="10"
              maxlength="128"
              required
              :placeholder="isRegister ? 'Al menos 10 caracteres' : 'Tu contraseña'"
              :aria-invalid="Boolean(state.errors.password)"
              :aria-describedby="state.errors.password ? 'password-error' : undefined"
              @input="onPasswordInput"
            />
            <button
              class="auth-password-toggle"
              type="button"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Ocultar' : 'Mostrar' }}
            </button>
          </span>
          <small v-if="state.errors.password" id="password-error" class="auth-field__error" role="alert">{{ state.errors.password }}</small>
        </label>

        <label v-if="isRegister" class="auth-field" for="auth-password-confirmation">
          <span>Confirmar contraseña</span>
          <span class="auth-password-wrap" :class="{ 'auth-password-wrap--error': state.errors.passwordConfirmation }">
            <input
              id="auth-password-confirmation"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              minlength="10"
              maxlength="128"
              required
              placeholder="Repite tu contraseña"
              :aria-invalid="Boolean(state.errors.passwordConfirmation)"
              :aria-describedby="state.errors.passwordConfirmation ? 'password-confirmation-error' : undefined"
              @input="onConfirmationInput"
            />
            <button
              class="auth-password-toggle"
              type="button"
              :aria-label="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :aria-pressed="showConfirmPassword"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? 'Ocultar' : 'Mostrar' }}
            </button>
          </span>
          <small v-if="state.errors.passwordConfirmation" id="password-confirmation-error" class="auth-field__error" role="alert">{{ state.errors.passwordConfirmation }}</small>
        </label>

        <small v-if="state.errors.profile" id="profile-error" class="auth-field__error" role="alert">{{ state.errors.profile }}</small>

        <button class="auth-submit-btn" type="submit" :disabled="busy" :aria-busy="busy">
          <span>{{ busy ? (state.mode === 'login' ? 'Validando acceso…' : 'Enviando…') : state.mode === 'register' ? 'Crear cuenta' : state.mode === 'recover' ? 'Enviar instrucciones' : 'Iniciar sesión' }}</span>
          <span v-if="busy" class="auth-spinner" aria-hidden="true" />
          <span v-else aria-hidden="true">→</span>
        </button>

        <button v-if="state.mode === 'login'" type="button" class="auth-link" @click="changeMode('recover')">
          ¿Olvidaste tu contraseña?
        </button>
        <button v-if="state.mode === 'recover'" type="button" class="auth-link auth-link--back" @click="changeMode('login')">
          Volver a iniciar sesión
        </button>
      </form>

      <AuthFeedback
        v-if="feedback"
        :message="feedback"
        :variant="feedbackVariant"
        @dismiss="clearFeedback"
      />

      <button v-if="canResend && state.mode === 'login'" type="button" class="auth-resend-btn" :disabled="retryBusy" @click="resend">
        <span>{{ retryBusy ? 'Enviando verificación…' : '¿No recibiste el correo? Reenviar verificación' }}</span>
      </button>

      <footer class="auth-footer">© 2026 Jinowork</footer>
    </div>
  </section>
</template>

<style scoped>
.auth-form-panel {
  box-sizing: border-box;
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  max-height: 100dvh;
  overflow-y: auto;
  padding: 2rem clamp(1.5rem, 5vw, 5rem);
}

.auth-form-panel__content {
  display: flex;
  width: min(100%, 30rem);
  flex-direction: column;
  gap: 1.2rem;
  animation: auth-entry 0.35s ease both;
}

.auth-kicker {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.auth-kicker__line {
  width: 1.4rem;
  height: 2px;
  border-radius: 99px;
  background: currentColor;
}

.auth-heading { margin: 0 0 0.45rem; color: var(--foreground); font-family: Manrope, sans-serif; font-size: clamp(1.9rem, 3vw, 2.65rem); font-weight: 800; letter-spacing: -0.045em; line-height: 1.12; }
.auth-sub { margin: 0; color: var(--muted-foreground); font-size: 0.98rem; line-height: 1.55; }
.auth-form { display: flex; flex-direction: column; gap: 0.9rem; }
.auth-field { display: grid; gap: 0.42rem; color: var(--foreground); font-size: 0.88rem; font-weight: 650; }

.auth-field > input,
.auth-password-wrap {
  box-sizing: border-box;
  width: 100%;
  min-height: 3.1rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  background: var(--surface);
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.auth-field > input { padding: 0.75rem 0.9rem; color: var(--foreground); font: inherit; }
.auth-field > input::placeholder, .auth-password-wrap input::placeholder { color: var(--muted-foreground); opacity: 0.72; }
.auth-field > input:focus, .auth-password-wrap:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent); outline: none; }
.auth-field > input[aria-invalid='true'], .auth-password-wrap--error { border-color: #b42318; }

.auth-password-wrap { display: flex; align-items: center; overflow: hidden; }
.auth-password-wrap input { box-sizing: border-box; width: 100%; min-width: 0; min-height: 3rem; padding: 0.75rem 0.9rem; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; }
.auth-password-toggle { align-self: stretch; flex: 0 0 auto; padding: 0 0.8rem; border: 0; background: transparent; color: var(--primary); font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
.auth-password-toggle:hover { color: var(--foreground); }
.auth-password-toggle:focus-visible, .auth-submit-btn:focus-visible, .auth-link:focus-visible, .auth-resend-btn:focus-visible { outline: 3px solid color-mix(in srgb, var(--primary) 55%, transparent); outline-offset: 3px; }

.auth-field__error { color: #b42318; font-size: 0.8rem; font-weight: 550; line-height: 1.4; }
.auth-submit-btn { display: flex; min-height: 3.35rem; align-items: center; justify-content: space-between; gap: 1rem; width: 100%; margin-top: 0.25rem; padding: 0 1.1rem; border: 0; border-radius: 0.8rem; background: var(--primary); color: #fff; font: inherit; font-weight: 750; cursor: pointer; transition: transform 0.16s ease, filter 0.16s ease, opacity 0.16s ease; }
.auth-submit-btn:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
.auth-submit-btn:disabled { opacity: 0.75; cursor: wait; }
.auth-spinner { width: 1rem; height: 1rem; border: 2px solid rgb(255 255 255 / 45%); border-top-color: #fff; border-radius: 50%; animation: auth-spin 0.7s linear infinite; }
.auth-link, .auth-resend-btn { border: 0; background: none; color: var(--primary); font: inherit; font-size: 0.86rem; font-weight: 650; cursor: pointer; }
.auth-link { align-self: flex-end; padding: 0.1rem 0; }
.auth-link--back { align-self: center; }
.auth-resend-btn { align-self: center; max-width: 100%; padding: 0.45rem; text-align: center; line-height: 1.45; }
.auth-link:hover, .auth-resend-btn:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 0.2em; }
.auth-resend-btn:disabled { opacity: 0.65; cursor: wait; }
.auth-footer { padding-top: 0.8rem; border-top: 1px solid var(--border); color: var(--muted-foreground); font-size: 0.76rem; text-align: center; }

@keyframes auth-entry { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
@keyframes auth-spin { to { transform: rotate(360deg); } }

@media (max-width: 760px) {
  .auth-form-panel { max-height: none; min-height: calc(100dvh - 3.5rem); padding: 1.25rem clamp(1rem, 5vw, 1.5rem) 2rem; }
  .auth-form-panel__content { gap: 1rem; }
}

@media (max-width: 380px) {
  .auth-form-panel { padding-inline: 0.9rem; }
  .auth-heading { font-size: 1.8rem; }
  .auth-form { gap: 0.75rem; }
}

@media (prefers-reduced-motion: reduce) {
  .auth-form-panel__content, .auth-spinner, .auth-submit-btn, .auth-field > input, .auth-password-wrap { animation: none; transition: none; }
}
</style>
