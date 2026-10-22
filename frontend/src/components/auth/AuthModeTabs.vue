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
    role="group"
    aria-label="Modo de acceso"
  >
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="auth-tab"
      :class="{ 'auth-tab--active': modelValue === tab.value }"
      :aria-pressed="modelValue === tab.value"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.auth-tabs {
  display: flex;
  gap: 0.3rem;
  padding: 0.3rem;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  background: var(--panel);
}

.auth-tab {
  flex: 1;
  min-height: 2.7rem;
  padding: 0.55rem 0.7rem;
  background: none;
  border: none;
  border-radius: 0.65rem;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.auth-tab:hover {
  color: var(--foreground);
}

.auth-tab--active {
  color: var(--foreground);
  background: var(--surface);
  box-shadow: 0 1px 3px var(--shadow);
}

.auth-tab:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: 2px;
}

@media (max-width: 360px) {
  .auth-tab { padding-inline: 0.35rem; font-size: 0.84rem; }
}

@media (prefers-reduced-motion: reduce) {
  .auth-tab {
    transition: none;
  }
}
</style>
