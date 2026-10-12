<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  /** Submit-style button: text left, arrow right, full width */
  submit?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
  submit: false,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'app-btn',
      `app-btn--${variant}`,
      `app-btn--${size}`,
      { 'app-btn--submit': submit, 'app-btn--disabled': disabled },
    ]"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    opacity 0.18s ease;
  white-space: nowrap;
}

/* Size variants */
.app-btn--sm {
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
  border-radius: 6px;
}

.app-btn--md {
  padding: 0.72rem 1.25rem;
  font-size: 0.93rem;
}

.app-btn--lg {
  padding: 0.88rem 1.5rem;
  font-size: 1rem;
}

/* Color variants */
.app-btn--primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 6px 18px oklch(from var(--primary) l c h / 0.22);
}

.app-btn--primary:hover:not(:disabled),
.app-btn--primary:focus-visible:not(:disabled) {
  background: oklch(from var(--primary) calc(l - 0.05) c h);
  transform: translateY(-1px);
}

.app-btn--secondary {
  background: transparent;
  color: var(--foreground);
  border-color: var(--border);
}

.app-btn--secondary:hover:not(:disabled),
.app-btn--secondary:focus-visible:not(:disabled) {
  background: var(--panel);
  transform: translateY(-1px);
}

.app-btn--ghost {
  background: transparent;
  color: var(--primary);
  border-color: transparent;
  padding-left: 0;
  padding-right: 0;
}

.app-btn--ghost:hover:not(:disabled) {
  opacity: 0.8;
}

/* Submit variant: full width, text left / arrow right */
.app-btn--submit {
  width: 100%;
  justify-content: space-between;
  height: 47px;
  padding: 0 1.25rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

/* Disabled state */
.app-btn--disabled,
.app-btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
  transform: none !important;
  pointer-events: none;
}

/* Focus ring */
.app-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .app-btn {
    transition: none;
  }
}
</style>
