<script setup lang="ts">
import { computed } from 'vue'
import { useAuthForm } from '@/composables/useAuthForm'
import AuthModeTabs from './AuthModeTabs.vue'
import AuthRoleSelector from './AuthRoleSelector.vue'
import PasswordField from './PasswordField.vue'
import AuthFeedback from './AuthFeedback.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { Mail, User, ArrowRight, Globe } from '@lucide/vue'

const {
  state,
  isRecovery,
  isRegister,
  feedbackMessage,
  submit,
  setMode,
  setRole,
  dismissFeedback,
} = useAuthForm()

const headings: Record<typeof state.mode, string> = {
  login: 'Inicia sesión en tu cuenta',
  register: 'Crea tu cuenta en Jinowork',
  recover: 'Recupera tu acceso',
}

const descriptions: Record<typeof state.mode, string> = {
  login: 'Accede para continuar con Jinowork.',
  register: 'Únete a la plataforma de empleo en Nicaragua.',
  recover: 'Ingresa tu correo y te guiamos para recuperar tu contraseña.',
}

const submitLabels: Record<typeof state.mode, string> = {
  login: 'Iniciar sesión',
  register: 'Crear cuenta',
  recover: 'Solicitar recuperación',
}

const heading = computed(() => headings[state.mode])
const description = computed(() => descriptions[state.mode])
const submitLabel = computed(() => submitLabels[state.mode])
</script>

<template>
  <section class="auth-form-panel" aria-label="Formulario de acceso">
    <div class="auth-form-panel__content">
      <!-- Kicker -->
      <div class="auth-kicker">
        <span class="auth-kicker__line" aria-hidden="true" />
        <span class="auth-kicker__text">{{ state.mode === 'login' ? 'Bienvenido/a de nuevo' : 'Acceso seguro' }}</span>
      </div>

      <!-- Heading -->
      <Transition name="auth-heading" mode="out-in">
        <div :key="state.mode" class="auth-heading-group">
          <h2 class="auth-heading">{{ heading }}</h2>
          <p class="auth-sub">{{ description }}</p>
        </div>
      </Transition>

      <!-- Tabs (hidden in recovery mode) -->
      <AuthModeTabs :model-value="state.mode" @update:model-value="setMode" />

      <!-- Role selector (hidden in recovery mode) -->
      <div v-if="!isRecovery" class="auth-section">
        <AuthRoleSelector :model-value="state.role" @update:model-value="setRole" />
      </div>

      <!-- Form -->
      <form class="auth-form" novalidate @submit.prevent="submit">
        <!-- Name (register only) -->
        <Transition name="fade-field">
          <AppInput
            v-if="isRegister"
            id="auth-name"
            label="Nombre completo"
            :model-value="state.name"
            type="text"
            placeholder="Tu nombre"
            autocomplete="name"
            :required="isRegister"
            :error="state.errors.name"
            @update:model-value="state.name = $event"
          >
            <template #icon><User :size="15" /></template>
          </AppInput>
        </Transition>

        <!-- Email -->
        <AppInput
          id="auth-email"
          label="Correo electrónico"
          :model-value="state.email"
          type="email"
          placeholder="tu@correo.com"
          autocomplete="email"
          required
          :error="state.errors.email"
          @update:model-value="state.email = $event"
        >
          <template #icon><Mail :size="15" /></template>
        </AppInput>

        <!-- Password (hidden in recovery mode) -->
        <div v-if="!isRecovery" class="auth-form__password-group">
          <PasswordField
            id="auth-password"
            label="Contraseña"
            :model-value="state.password"
            :show-password="state.showPassword"
            :error="state.errors.password"
            @update:model-value="state.password = $event"
            @update:show-password="state.showPassword = $event"
          />
          <!-- Forgot password (login only) -->
          <div v-if="!isRegister" class="auth-form__forgot">
            <button
              type="button"
              class="auth-form__forgot-btn"
              @click="setMode('recover')"
            >
              ¿La olvidaste?
            </button>
          </div>
        </div>

        <!-- Terms (register only) -->
        <Transition name="fade-field">
          <label v-if="isRegister" class="auth-form__terms">
            <input
              type="checkbox"
              :checked="state.acceptTerms"
              class="auth-form__checkbox"
              :aria-describedby="state.errors.terms ? 'terms-error' : undefined"
              @change="state.acceptTerms = ($event.target as HTMLInputElement).checked"
            />
            <span>Acepto los términos de uso de la plataforma.</span>
          </label>
        </Transition>
        <p v-if="state.errors.terms" id="terms-error" class="auth-form__field-error" role="alert">
          {{ state.errors.terms }}
        </p>

        <!-- Feedback notice -->
        <Transition name="fade-field">
          <AuthFeedback
            v-if="feedbackMessage"
            :message="feedbackMessage"
            @dismiss="dismissFeedback"
          />
        </Transition>

        <!-- Submit -->
        <button type="submit" class="auth-submit-btn">
          <span>{{ submitLabel }}</span>
          <ArrowRight :size="16" aria-hidden="true" />
        </button>
      </form>

      <!-- Google button (hidden in recovery) -->
      <div v-if="!isRecovery" class="auth-divider">
        <span class="auth-divider__line" aria-hidden="true" />
        <span class="auth-divider__text">o continuá con</span>
        <span class="auth-divider__line" aria-hidden="true" />
      </div>

      <div v-if="!isRecovery" class="auth-google">
        <button
          type="button"
          class="auth-google__btn"
          disabled
          aria-disabled="true"
          title="La conexión con Google todavía no está disponible"
        >
          <Globe :size="16" aria-hidden="true" />
          <span>Continuar con Google</span>
        </button>
        <p class="auth-google__note">Integración próximamente disponible.</p>
      </div>

      <!-- Back to login (recovery mode) -->
      <div v-if="isRecovery" class="auth-back">
        <button type="button" class="auth-back__btn" @click="setMode('login')">
          ← Volver al inicio de sesión
        </button>
      </div>

      <!-- Footer -->
      <footer class="auth-footer">
        <span>© 2026 Jinowork</span>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.auth-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 1.5rem clamp(2rem, 6vw, 6rem);
  overflow: visible;
  position: relative;
  z-index: 2;
}

.auth-form-panel__content {
  width: 100%;
  max-width: 590px;
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
  /* Entry animation */
  animation: auth-entry 0.55s ease both;
}

@keyframes auth-entry {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Kicker */
.auth-kicker {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.auth-kicker__line {
  display: block;
  width: 23px;
  height: 2px;
  background: var(--primary);
  border-radius: 99px;
  flex-shrink: 0;
}

.auth-kicker__text {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--primary);
}

/* Heading */
.auth-heading {
  margin: 0 0 0.4rem;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2.15rem, 3vw, 3rem);
  font-weight: 800;
  color: var(--foreground);
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.auth-sub {
  margin: 0;
  font-size: 1rem;
  color: var(--muted-foreground);
  line-height: 1.6;
}

/* Sections */
.auth-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.auth-form__password-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.auth-form__forgot {
  display: flex;
  justify-content: flex-end;
}

.auth-form__forgot-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  padding: 0;
}

.auth-form__forgot-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: 2px;
}

.auth-form__terms {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  line-height: 1.5;
  cursor: pointer;
}

.auth-form__checkbox {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  accent-color: var(--primary);
  cursor: pointer;
}

.auth-form__field-error {
  margin: 0;
  font-size: 0.78rem;
  color: #d9534f;
}

/* Submit button */
.auth-submit-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 58px;
  padding: 0 1.25rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    transform 0.18s ease;
}

.auth-submit-btn:hover {
  background: oklch(from var(--primary) calc(l - 0.05) c h);
  transform: translateY(-1px);
}

.auth-submit-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

.auth-submit-btn:active {
  transform: translateY(0);
}

/* Divider */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.auth-divider__line {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.auth-divider__text {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  white-space: nowrap;
}

/* Google */
.auth-google {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.auth-google__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
  height: 54px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--muted-foreground);
  cursor: not-allowed;
  opacity: 0.55;
}

.auth-google__note {
  margin: 0;
  font-size: 0.72rem;
  color: var(--muted-foreground);
  text-align: center;
}

/* Back link */
.auth-back {
  display: flex;
  justify-content: center;
}

.auth-back__btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
}

.auth-back__btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: 2px;
}

/* Footer */
.auth-footer {
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
  font-size: 0.76rem;
  color: var(--muted-foreground);
  text-align: center;
}

/* Heading transition */
.auth-heading-enter-active,
.auth-heading-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.auth-heading-enter-from,
.auth-heading-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Field fade */
.fade-field-enter-active,
.fade-field-leave-active {
  transition: opacity 0.18s ease, max-height 0.25s ease;
  overflow: hidden;
  max-height: 200px;
}

.fade-field-enter-from,
.fade-field-leave-to {
  opacity: 0;
  max-height: 0;
}

@media (prefers-reduced-motion: reduce) {
  .auth-form-panel__content {
    animation: none;
  }

  .auth-heading-enter-active,
  .auth-heading-leave-active,
  .fade-field-enter-active,
  .fade-field-leave-active {
    transition: none;
  }

  .auth-submit-btn {
    transition: none;
  }
}

@media (max-height: 820px) and (min-width: 761px) {
  .auth-form-panel { padding-block: 0.75rem; }
  .auth-form-panel__content { gap: 0.8rem; }
  .auth-heading { font-size: 2.2rem; }
  .auth-form { gap: 0.65rem; }
  .auth-footer { padding-top: 0.25rem; }
}
</style>
