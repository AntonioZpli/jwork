<script setup lang="ts">
import { useAuthPanel } from '@/composables/useAuthPanel'
import AuthModeTabs from './AuthModeTabs.vue'
import AuthRoleSelector from './AuthRoleSelector.vue'
import AuthFeedback from './AuthFeedback.vue'
import { nextTick, ref } from 'vue'

const {
  state, verificationStep, verificationEmail, verificationCode, isRegister, password, rememberDevice, confirmPassword, firstName, lastName, companyName,
  busy, feedback, feedbackVariant, canResend, retryBusy, showPassword, showConfirmPassword,
  contentRef, heading, description, changeMode, changeRole, clearFeedback, onEmailInput,
  onPasswordInput, onConfirmationInput, onProfileInput, submit, resend,
} = useAuthPanel()

const codeInputs = ref<HTMLInputElement[]>([])
const codeCharacters = 6

function cleanCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, codeCharacters)
}

async function focusCodeInput(index: number) {
  await nextTick()
  codeInputs.value[Math.max(0, Math.min(index, codeCharacters - 1))]?.focus()
}

function updateCodeInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const characters = cleanCode(input.value)
  const code = Array.from({ length: codeCharacters }, (_, position) => verificationCode.value[position] ?? '')
  if (characters.length > 1) {
    characters.split('').forEach((character, offset) => { if (index + offset < codeCharacters) code[index + offset] = character })
  } else if (characters) {
    code[index] = characters
  } else {
    code[index] = ''
  }
  verificationCode.value = code.join('').slice(0, codeCharacters)
  input.value = code[index] ?? ''
  if (characters) void focusCodeInput(Math.min(index + characters.length, codeCharacters - 1))
}

function pasteVerificationCode(event: ClipboardEvent, index: number) {
  const pasted = cleanCode(event.clipboardData?.getData('text') ?? '')
  if (!pasted) return
  event.preventDefault()
  const code = Array.from({ length: codeCharacters }, (_, position) => verificationCode.value[position] ?? '')
  pasted.split('').forEach((character, offset) => { if (index + offset < codeCharacters) code[index + offset] = character })
  verificationCode.value = code.join('').slice(0, codeCharacters)
  void focusCodeInput(Math.min(index + pasted.length, codeCharacters - 1))
}

function navigateCodeInput(event: KeyboardEvent, index: number) {
  if (event.key === 'ArrowLeft') { event.preventDefault(); void focusCodeInput(index - 1) }
  if (event.key === 'ArrowRight') { event.preventDefault(); void focusCodeInput(index + 1) }
  if (event.key === 'Backspace' && !verificationCode.value[index] && index > 0) { event.preventDefault(); void focusCodeInput(index - 1) }
}
</script>

<template>
  <section class="auth-form-panel" aria-label="Formulario de acceso">
    <div ref="contentRef" class="auth-form-panel__content">
      <div class="auth-kicker">
        <span class="auth-kicker__line" aria-hidden="true" />
        <span>{{ verificationStep ? 'Confirma tu identidad' : state.mode === 'login' ? 'Bienvenido/a de nuevo' : 'Acceso seguro' }}</span>
      </div>

      <div class="auth-heading-group">
        <Transition name="auth-copy">
          <div :key="state.mode">
            <h2 class="auth-heading">{{ heading }}</h2>
            <p class="auth-sub">{{ description }}</p>
          </div>
        </Transition>
      </div>

      <AuthModeTabs v-if="!verificationStep" :model-value="state.mode" @update:model-value="changeMode" />
      <AuthRoleSelector v-if="!verificationStep && isRegister" :model-value="state.role" @update:model-value="changeRole" />

      <form v-if="!verificationStep" class="auth-form" novalidate @submit.prevent="submit">
        <template v-if="isRegister && state.role === 'candidate'">
          <div class="auth-profile-fields">
            <label class="auth-field" for="auth-first-name">
              <span>Nombre</span>
              <input id="auth-first-name" v-model="firstName" autocomplete="given-name" maxlength="100" required :aria-invalid="Boolean(state.errors.profile)" :aria-describedby="state.errors.profile ? 'profile-error' : undefined" @input="onProfileInput" />
            </label>
            <label class="auth-field" for="auth-last-name">
              <span>Apellidos</span>
              <input id="auth-last-name" v-model="lastName" autocomplete="family-name" maxlength="100" required :aria-invalid="Boolean(state.errors.profile)" :aria-describedby="state.errors.profile ? 'profile-error' : undefined" @input="onProfileInput" />
            </label>
          </div>
        </template>

        <label v-else-if="isRegister" class="auth-field auth-field--reveal" for="auth-company-name">
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
              :minlength="10"
              maxlength="128"
              required
              :placeholder="isRegister ? '10 caracteres o más' : 'Tu contraseña'"
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

        <label v-if="state.mode === 'login'" class="auth-remember" for="auth-remember-device">
          <input id="auth-remember-device" v-model="rememberDevice" type="checkbox" />
          <span><strong>Recordarme en este dispositivo</strong><small></small></span>
        </label>

        <label v-if="isRegister" class="auth-field auth-field--reveal" for="auth-password-confirmation">
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

        <button v-if="state.mode === 'recover'" type="button" class="auth-link auth-link--back" @click="changeMode('login')">
          Volver a iniciar sesión
        </button>
      </form>

      <form v-else class="auth-form" novalidate @submit.prevent="submit">
        <label class="auth-field">
          <span>Código de verificación</span>
          <div class="auth-code-inputs" role="group" aria-label="Código de verificación" aria-describedby="verification-code-hint">
            <input v-for="(_, index) in codeCharacters" :key="index" ref="codeInputs" :value="verificationCode[index] ?? ''" type="text" inputmode="text" :autocomplete="index === 0 ? 'one-time-code' : 'off'" :aria-label="`Carácter ${index + 1} de ${codeCharacters}`" maxlength="1" autocapitalize="characters" spellcheck="false" @input="updateCodeInput(index, $event)" @paste="pasteVerificationCode($event, index)" @keydown="navigateCodeInput($event, index)" />
          </div>
          <small id="verification-code-hint" class="auth-code-hint">Revisa tu bandeja de entrada y spam. El código vence en 15 minutos.</small>
        </label>
        <button class="auth-submit-btn" type="submit" :disabled="busy" :aria-busy="busy">
          <span>{{ busy ? 'Verificando…' : 'Verificar y continuar' }}</span>
          <span v-if="busy" class="auth-spinner" aria-hidden="true" />
          <span v-else aria-hidden="true">→</span>
        </button>
      </form>

      <AuthFeedback
        v-if="feedback"
        :message="feedback"
        :variant="feedbackVariant"
        @dismiss="clearFeedback"
      />

      <button v-if="verificationStep || (canResend && state.mode === 'login')" type="button" class="auth-resend-btn" :disabled="retryBusy" @click="resend">
        <span>{{ retryBusy ? 'Enviando verificación…' : '¿No recibiste el correo? Reenviar verificación' }}</span>
      </button>
      <button v-if="verificationStep" type="button" class="auth-link auth-link--back" @click="changeMode('login')">Volver al inicio de sesión</button>

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
  align-items: flex-start;
  justify-content: center;
  max-height: 100dvh;
  overflow-y: auto;
  scrollbar-width: none;
  padding: clamp(4rem, 9vh, 6rem) clamp(1.5rem, 5vw, 5rem) 2rem;
}

.auth-form-panel::-webkit-scrollbar { display: none; }

.auth-form-panel__content {
  display: flex;
  width: min(100%, 30rem);
  flex-direction: column;
  gap: 1.2rem;
  margin-inline: auto;
  will-change: height;
  transition: height 0.36s cubic-bezier(0.22, 1, 0.36, 1);
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

.auth-heading-group { position: relative; display: grid; }
.auth-heading-group > * { grid-area: 1 / 1; }
.auth-copy-enter-active,
.auth-copy-leave-active { transition: opacity 0.26s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
.auth-copy-enter-from { opacity: 0; transform: translateY(8px); }
.auth-copy-leave-to { opacity: 0; transform: translateY(-5px); }
.auth-copy-leave-active { position: absolute; inset-inline: 0; }

.auth-heading { margin: 0 0 0.45rem; color: var(--foreground); font-family: Manrope, sans-serif; font-size: clamp(1.9rem, 3vw, 2.65rem); font-weight: 800; letter-spacing: -0.045em; line-height: 1.12; }
.auth-sub { margin: 0; color: var(--muted-foreground); font-size: 0.98rem; line-height: 1.55; }
.auth-form { display: flex; flex-direction: column; gap: 0.9rem; }
.auth-remember { display: flex; align-items: flex-start; gap: 0.65rem; color: var(--foreground); cursor: pointer; font-size: 0.82rem; }
.auth-remember input { width: 1rem; height: 1rem; margin: 0.1rem 0 0; accent-color: var(--primary); }
.auth-remember span { display: grid; gap: 0.2rem; }
.auth-remember strong { font-weight: 650; }
.auth-remember small { color: var(--muted-foreground); font-size: 0.75rem; font-weight: 400; line-height: 1.4; }
.auth-profile-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem; }
.auth-field { display: grid; gap: 0.42rem; color: var(--foreground); font-size: 0.88rem; font-weight: 650; }
.auth-profile-fields,
.auth-field--reveal { animation: auth-field-reveal 0.28s ease both; }

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
.auth-code-hint { color: var(--muted-foreground); font-size: 0.8rem; font-weight: 450; line-height: 1.5; }
.auth-code-inputs { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0.65rem; width: min(100%, 24rem); }
.auth-code-inputs input { box-sizing: border-box; width: 100%; min-width: 0; height: 3.7rem; border: 1px solid var(--border); border-radius: 0.75rem; background: var(--surface); color: var(--foreground); font: 800 1.45rem/1 Manrope, sans-serif; text-align: center; text-transform: uppercase; transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease; }
.auth-code-inputs input:focus { border-color: var(--primary); outline: none; background: color-mix(in srgb, var(--primary) 5%, var(--surface)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent); }
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

@keyframes auth-field-reveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes auth-spin { to { transform: rotate(360deg); } }

@media (max-width: 760px) {
  .auth-form-panel { max-height: none; min-height: calc(100dvh - 3.5rem); padding: 1.25rem clamp(1rem, 5vw, 1.5rem) 2rem; }
  .auth-form-panel__content { gap: 1rem; }
}

@media (max-width: 380px) {
  .auth-form-panel { padding-inline: 0.9rem; }
  .auth-heading { font-size: 1.8rem; }
  .auth-form { gap: 0.75rem; }
  .auth-profile-fields { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .auth-copy-enter-active,
  .auth-copy-leave-active { transition: none; }
  .auth-copy-enter-from,
  .auth-copy-leave-to { transform: none; }
  .auth-form-panel__content { transition: none; }
  .auth-form-panel__content, .auth-profile-fields, .auth-field--reveal, .auth-spinner, .auth-submit-btn, .auth-field > input, .auth-password-wrap { animation: none; transition: none; }
}
</style>
