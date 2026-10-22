<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, X } from '@lucide/vue'

withDefaults(defineProps<{
  message: string
  variant?: 'info' | 'success' | 'error'
}>(), { variant: 'info' })

defineEmits<{
  dismiss: []
}>()
</script>

<template>
  <div
    class="auth-feedback"
    :class="`auth-feedback--${variant}`"
    :role="variant === 'error' ? 'alert' : 'status'"
    :aria-live="variant === 'error' ? 'assertive' : 'polite'"
  >
    <component :is="variant === 'error' ? CircleAlert : variant === 'success' ? CircleCheck : Info" :size="18" class="auth-feedback__icon" aria-hidden="true" />
    <p class="auth-feedback__text">{{ message }}</p>
    <button
      type="button"
      class="auth-feedback__dismiss"
      aria-label="Cerrar aviso"
      @click="$emit('dismiss')"
    >
      <X :size="16" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.auth-feedback {
  display: flex;
  align-items: flex-start;
  min-width: 0;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  background: var(--secondary);
  border: 1px solid oklch(from var(--primary) l c h / 0.25);
  border-radius: 0.8rem;
}

.auth-feedback__icon {
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.auth-feedback--error {
  background: color-mix(in srgb, #d9534f 8%, var(--background));
  border-color: color-mix(in srgb, #d9534f 35%, transparent);
}

.auth-feedback--error .auth-feedback__icon,
.auth-feedback--error .auth-feedback__text {
  color: #b42318;
}

html.dark .auth-feedback--error .auth-feedback__icon,
html.dark .auth-feedback--error .auth-feedback__text {
  color: #ff9b95;
}

.auth-feedback--success {
  background: color-mix(in srgb, #16803c 8%, var(--background));
  border-color: color-mix(in srgb, #16803c 32%, transparent);
}

.auth-feedback--success .auth-feedback__icon,
.auth-feedback--success .auth-feedback__text {
  color: #147a37;
}

html.dark .auth-feedback--success .auth-feedback__icon,
html.dark .auth-feedback--success .auth-feedback__text {
  color: #9be3ad;
}

.auth-feedback__text {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 0.83rem;
  color: var(--foreground);
  line-height: 1.55;
}

.auth-feedback__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  color: var(--muted-foreground);
  padding: 0;
  margin: -0.4rem -0.65rem 0 0;
}

@media (max-width: 420px) {
  .auth-feedback { gap: 0.5rem; padding: 0.75rem; }
  .auth-feedback__text { font-size: 0.8rem; overflow-wrap: anywhere; }
}

.auth-feedback__dismiss:hover {
  color: var(--foreground);
}

.auth-feedback__dismiss:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
