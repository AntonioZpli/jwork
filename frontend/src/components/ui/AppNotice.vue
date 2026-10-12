<script setup lang="ts">
interface Props {
  /** Visual emphasis level */
  variant?: 'info' | 'demo'
}

withDefaults(defineProps<Props>(), {
  variant: 'info',
})

defineEmits<{
  dismiss: []
}>()
</script>

<template>
  <div
    :class="['app-notice', `app-notice--${variant}`]"
    role="status"
    aria-live="polite"
  >
    <p class="app-notice__text">
      <slot />
    </p>
    <button
      v-if="$slots.default"
      type="button"
      class="app-notice__dismiss"
      aria-label="Cerrar aviso"
      @click="$emit('dismiss')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.app-notice {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 6px;
  padding: 0.85rem 1rem;
}

.app-notice--info {
  background: var(--secondary);
  border: 1px solid var(--border);
}

.app-notice--demo {
  background: var(--secondary);
  border: 1px solid oklch(from var(--primary) l c h / 0.25);
}

.app-notice__text {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--foreground);
}

.app-notice__dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  color: var(--muted-foreground);
  padding: 0;
  margin-top: -2px;
}

.app-notice__dismiss:hover {
  color: var(--foreground);
}

.app-notice__dismiss:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
