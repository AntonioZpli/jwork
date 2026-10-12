<script setup lang="ts">
interface Props {
  label: string
  /** aria-label override; falls back to label */
  ariaLabel?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  disabled: false,
})
</script>

<template>
  <button
    type="button"
    :aria-label="ariaLabel ?? label"
    :disabled="disabled"
    class="app-icon-btn"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.app-icon-btn:hover:not(:disabled) {
  background: var(--panel);
  color: var(--primary);
}

.app-icon-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

.app-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .app-icon-btn {
    transition: none;
  }
}
</style>
