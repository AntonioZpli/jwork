<script setup lang="ts">
import type { AuthMode } from '@/types/auth'

defineProps<{
  modelValue: AuthMode
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AuthMode]
}>()

// Recovery mode hides the tab bar entirely
const tabs: { value: Extract<AuthMode, 'login' | 'register'>; label: string }[] = [
  { value: 'login', label: 'Iniciar sesión' },
  { value: 'register', label: 'Crear una cuenta' },
]
</script>

<template>
  <div
    v-if="modelValue !== 'recover'"
    class="auth-tabs"
    role="tablist"
    aria-label="Modo de acceso"
  >
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      role="tab"
      class="auth-tab"
      :class="{ 'auth-tab--active': modelValue === tab.value }"
      :aria-selected="modelValue === tab.value"
      :tabindex="modelValue === tab.value ? 0 : -1"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.auth-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.2rem;
}

.auth-tab {
  flex: 1;
  padding: 0.75rem 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--muted-foreground);
  cursor: pointer;
  transition:
    color 0.18s ease,
    border-color 0.18s ease;
  margin-bottom: -1px;
}

.auth-tab:hover {
  color: var(--foreground);
}

.auth-tab--active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.auth-tab:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .auth-tab {
    transition: none;
  }
}
</style>
