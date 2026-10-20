<script setup lang="ts">
import { computed, ref } from 'vue'
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
const feedbackError = ref(false)
const canResend = ref(false)
const retryBusy = ref(false)
const heading = computed(() => state.mode === 'register' ? 'Crea tu cuenta en Jinowork' : state.mode === 'recover' ? 'Recupera tu cuenta' : 'Inicia sesión en tu cuenta')
const description = computed(() => state.mode === 'register' ? 'Regístrate con tu correo y una contraseña segura.' : state.mode === 'recover' ? 'Te enviaremos instrucciones si existe una cuenta con ese correo.' : 'Accede con tu correo electrónico y contraseña.')

async function submit() {
  if (busy.value) return
  state.errors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) state.errors.email = 'Ingresa un correo válido.'
  if (state.mode !== 'recover' && (password.value.length < 10 || password.value.length > 128)) state.errors.password = 'La contraseña debe tener entre 10 y 128 caracteres.'
  if (isRegister.value && password.value !== confirmPassword.value) state.errors.passwordConfirmation = 'Las contraseñas no coinciden.'
  if (isRegister.value && state.role === 'candidate' && (!firstName.value.trim() || !lastName.value.trim())) state.errors.profile = 'Completa tu nombre y apellidos.'
  if (isRegister.value && state.role === 'company' && !companyName.value.trim()) state.errors.profile = 'Ingresa el nombre de la empresa.'
  if (Object.keys(state.errors).length) return
  busy.value = true; feedback.value = ''; canResend.value = false
  try {
    if (state.mode === 'register') {
      const result = await authApi.register({
        email: state.email.trim(), password: password.value, role: state.role,
        ...(state.role === 'candidate' ? { firstName: firstName.value.trim(), lastName: lastName.value.trim() } : { companyName: companyName.value.trim() }),
      })
      feedback.value = result.message; feedbackError.value = false; canResend.value = Boolean(result.pendingVerification); setMode('login'); password.value = ''; confirmPassword.value = ''
    } else if (state.mode === 'recover') {
      const result = await authApi.requestPasswordReset(state.email.trim())
      feedback.value = result.message; feedbackError.value = false
    } else {
      const result = await authApi.login(state.email.trim(), password.value, false)
      authStore.user = result.user
      await router.push(['ADMIN', 'SUPERADMIN'].includes(result.user.role) ? '/admin' : '/onboarding')
    }
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'No se pudo completar el acceso.'
    feedbackError.value = true
    const apiError = error as ApiError
    canResend.value = apiError.code === 'VERIFICATION_EMAIL_FAILED' || (apiError.status === 403 && feedback.value.toLowerCase().includes('verifica'))
  } finally { busy.value = false }
}
async function resend() {
  retryBusy.value = true
  try { const result = await authApi.resendVerification(state.email.trim()); feedback.value = result.message; feedbackError.value = false; canResend.value = false }
  catch (error) { feedback.value = error instanceof Error ? error.message : 'No se pudo reenviar el correo.'; feedbackError.value = true; canResend.value = true }
  finally { retryBusy.value = false }
}
function changeMode(mode: typeof state.mode) { feedback.value = ''; canResend.value = false; setMode(mode) }
</script>

<template>
  <section class="auth-form-panel" aria-label="Formulario de acceso">
    <div class="auth-form-panel__content">
      <div class="auth-kicker"><span class="auth-kicker__line" aria-hidden="true" /><span>{{ state.mode === 'login' ? 'Bienvenido/a de nuevo' : 'Acceso seguro' }}</span></div>
      <div class="auth-heading-group"><h2 class="auth-heading">{{ heading }}</h2><p class="auth-sub">{{ description }}</p></div>
      <AuthModeTabs :model-value="state.mode" @update:model-value="changeMode" />
      <AuthRoleSelector v-if="isRegister" :model-value="state.role" @update:model-value="setRole" />
      <form class="auth-form" @submit.prevent="submit">
        <template v-if="isRegister && state.role === 'candidate'">
          <label class="auth-field"><span>Nombre</span><input v-model="firstName" autocomplete="given-name" maxlength="100" required :aria-invalid="Boolean(state.errors.profile)" :aria-describedby="state.errors.profile ? 'profile-error' : undefined" /></label>
          <label class="auth-field"><span>Apellidos</span><input v-model="lastName" autocomplete="family-name" maxlength="100" required :aria-invalid="Boolean(state.errors.profile)" :aria-describedby="state.errors.profile ? 'profile-error' : undefined" /></label>
        </template>
        <label v-else-if="isRegister" class="auth-field"><span>Nombre de la empresa</span><input v-model="companyName" autocomplete="organization" maxlength="160" required :aria-invalid="Boolean(state.errors.profile)" :aria-describedby="state.errors.profile ? 'profile-error' : undefined" /></label>
        <label class="auth-field"><span>Correo electrónico</span><input v-model="state.email" type="email" autocomplete="email" required maxlength="254" placeholder="tu@correo.com" :aria-invalid="Boolean(state.errors.email)" :aria-describedby="state.errors.email ? 'email-error' : undefined" /><small v-if="state.errors.email" id="email-error" role="alert">{{ state.errors.email }}</small></label>
        <label v-if="state.mode !== 'recover'" class="auth-field"><span>Contraseña</span><input v-model="password" type="password" :autocomplete="isRegister ? 'new-password' : 'current-password'" minlength="10" maxlength="128" required placeholder="Al menos 10 caracteres" :aria-invalid="Boolean(state.errors.password)" :aria-describedby="state.errors.password ? 'password-error' : undefined" /><small v-if="state.errors.password" id="password-error" role="alert">{{ state.errors.password }}</small></label>
        <label v-if="isRegister" class="auth-field"><span>Confirmar contraseña</span><input v-model="confirmPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128" required :aria-invalid="Boolean(state.errors.passwordConfirmation)" :aria-describedby="state.errors.passwordConfirmation ? 'password-confirmation-error' : undefined" /><small v-if="state.errors.passwordConfirmation" id="password-confirmation-error" role="alert">{{ state.errors.passwordConfirmation }}</small></label>
        <small v-if="state.errors.profile" id="profile-error" class="auth-error" role="alert">{{ state.errors.profile }}</small>
        <button class="auth-submit-btn" type="submit" :disabled="busy" :aria-busy="busy">{{ busy ? 'Procesando…' : state.mode === 'register' ? 'Crear cuenta' : state.mode === 'recover' ? 'Enviar instrucciones' : 'Iniciar sesión' }} <span aria-hidden="true">→</span></button>
        <button v-if="state.mode === 'recover'" type="button" class="auth-link" @click="changeMode('login')">Volver a iniciar sesión</button>
      </form>
      <AuthFeedback v-if="feedback" :message="feedback" :variant="feedbackError ? 'error' : 'info'" @dismiss="feedback = ''" />
      <button v-if="canResend" type="button" class="auth-link" :disabled="retryBusy" @click="resend">{{ retryBusy ? 'Solicitando…' : 'Reenviar verificación' }}</button>
      <footer class="auth-footer">© 2026 Jinowork</footer>
    </div>
  </section>
</template>

<style scoped>
.auth-form-panel{display:flex;align-items:center;justify-content:center;flex:1;padding:1.5rem clamp(2rem,6vw,6rem);position:relative;z-index:2;max-height:100vh;overflow-y:auto;box-sizing:border-box}.auth-form-panel__content{width:100%;max-width:590px;display:flex;flex-direction:column;gap:1rem;animation:entry .4s ease both}.auth-kicker{display:flex;align-items:center;gap:.6rem;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:var(--primary)}.auth-kicker__line{width:23px;height:2px;background:var(--primary);border-radius:99px}.auth-heading{margin:0 0 .4rem;font-family:Manrope,sans-serif;font-size:clamp(2rem,3vw,3rem);font-weight:800;color:var(--foreground);letter-spacing:-.04em;line-height:1.1}.auth-sub{margin:0;font-size:1rem;color:var(--muted-foreground);line-height:1.6}.auth-form{display:flex;flex-direction:column;gap:.8rem}.auth-field{display:grid;gap:.4rem;color:var(--foreground);font-size:.88rem;font-weight:650}.auth-field input{box-sizing:border-box;width:100%;min-height:48px;padding:.7rem .85rem;border:1px solid var(--border);border-radius:.7rem;background:var(--surface);color:var(--foreground);font:inherit}.auth-field input:focus-visible,.auth-submit-btn:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.auth-field small,.auth-form small,.auth-error{color:#d9534f}.auth-link{align-self:flex-end;background:none;border:0;color:var(--primary);font:inherit;font-size:.85rem;cursor:pointer}.auth-remember{display:flex;gap:.55rem;align-items:center;color:var(--muted-foreground);font-size:.82rem}.auth-remember input,.auth-form__terms input{accent-color:var(--primary)}.auth-form__terms{display:flex;gap:.6rem;align-items:flex-start;color:var(--muted-foreground);font-size:.8rem}.auth-submit-btn{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:56px;padding:0 1.25rem;background:var(--primary);color:white;border:0;border-radius:999px;font:inherit;font-weight:700;cursor:pointer}.auth-submit-btn:disabled{opacity:.65;cursor:wait}.auth-footer{padding-top:.5rem;border-top:1px solid var(--border);font-size:.76rem;color:var(--muted-foreground);text-align:center}@keyframes entry{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@media(max-width:760px){.auth-form-panel{padding:1rem clamp(1rem,6vw,2rem);max-height:none}.auth-form-panel__content{gap:.8rem}}
</style>
