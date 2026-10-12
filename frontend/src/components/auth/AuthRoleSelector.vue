<script setup lang="ts">
import type { AuthRole } from '@/types/auth'
import { User, Building2 } from '@lucide/vue'

defineProps<{
  modelValue: AuthRole
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AuthRole]
}>()

interface RoleOption {
  value: AuthRole
  label: string
  subtitle: string
  icon: typeof User
}

const options: RoleOption[] = [
  { value: 'candidate', label: 'Soy postulante', subtitle: 'Busco nuevas oportunidades.', icon: User },
  { value: 'company', label: 'Soy empresa', subtitle: 'Quiero encontrar talento.', icon: Building2 },
]
</script>

<template>
  <div class="role-selector" role="group" aria-label="Selecciona tu rol">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="role-card"
      :class="{ 'role-card--selected': modelValue === option.value }"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      <span class="role-card__icon">
        <component :is="option.icon" :size="18" aria-hidden="true" />
      </span>
      <span class="role-card__body">
        <span class="role-card__label">{{ option.label }}</span>
        <span class="role-card__subtitle">{{ option.subtitle }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.role-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.2rem;
  background: transparent;
  border: 0;
  border-bottom: 2px solid var(--border);
  border-radius: 0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.role-card:hover:not(.role-card--selected) {
  border-bottom-color: oklch(from var(--primary) l c h / 0.4);
}

.role-card--selected {
  border-bottom-color: var(--primary);
  background: transparent;
  box-shadow: none;
}

.role-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

.role-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: transparent;
  color: var(--primary);
  border-radius: 6px;
  flex-shrink: 0;
  transition: background-color 0.18s ease;
}

.role-card--selected .role-card__icon { color: var(--primary); }

.role-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.role-card__label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--foreground);
  line-height: 1.2;
}

.role-card__subtitle {
  font-size: 0.76rem;
  color: var(--muted-foreground);
  line-height: 1.4;
}

@media (max-width: 420px) {
  .role-selector {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .role-card {
    transition: none;
  }
}
</style>
