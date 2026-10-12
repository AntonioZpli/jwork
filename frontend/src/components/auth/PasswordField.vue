<script setup lang="ts">
import { Eye, EyeOff, Lock } from '@lucide/vue'

defineProps<{
  id: string
  label: string
  modelValue: string
  showPassword: boolean
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:showPassword': [value: boolean]
}>()
</script>

<template>
  <div class="password-field">
    <label :for="id" class="password-field__label">{{ label }}</label>
    <div
      class="password-field__wrap"
      :class="{ 'password-field__wrap--error': !!error }"
    >
      <span class="password-field__icon" aria-hidden="true">
        <Lock :size="15" />
      </span>
      <input
        :id="id"
        :type="showPassword ? 'text' : 'password'"
        :value="modelValue"
        autocomplete="current-password"
        required
        :aria-describedby="error ? `${id}-error` : undefined"
        :aria-invalid="!!error"
        class="password-field__input"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        class="password-field__toggle"
        :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="showPassword"
        @click="emit('update:showPassword', !showPassword)"
      >
        <EyeOff v-if="showPassword" :size="15" />
        <Eye v-else :size="15" />
      </button>
    </div>
    <p v-if="error" :id="`${id}-error`" class="password-field__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.password-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.password-field__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.password-field__wrap {
  display: flex;
  align-items: center;
  height: 46px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
  overflow: hidden;
}

.password-field__wrap:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px oklch(from var(--primary) l c h / 0.15);
}

.password-field__wrap--error {
  border-color: #d9534f;
}

.password-field__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  flex-shrink: 0;
  color: var(--muted-foreground);
}

.password-field__input {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--foreground);
  font-family: inherit;
  font-size: 0.92rem;
  padding: 0;
  outline: none;
  min-width: 0;
}

.password-field__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 100%;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted-foreground);
  transition: color 0.18s ease;
}

.password-field__toggle:hover {
  color: var(--foreground);
}

.password-field__toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

.password-field__error {
  margin: 0;
  font-size: 0.78rem;
  color: #d9534f;
}

@media (prefers-reduced-motion: reduce) {
  .password-field__wrap,
  .password-field__toggle {
    transition: none;
  }
}
</style>
