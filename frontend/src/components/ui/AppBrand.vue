<script setup lang="ts">
interface Props {
  /** mark = compact isotipo; full = horizontal wordmark */
  variant?: 'mark' | 'full'
}

const props = withDefaults(defineProps<Props>(), { variant: 'mark' })
</script>

<template>
  <span v-if="props.variant === 'mark'" class="brand-mark" aria-label="Jinowork">
    <span class="brand-mark__letter" aria-hidden="true">J</span>
  </span>

  <span v-else class="brand-full" aria-label="Jinowork">
    <span class="brand-full__word">Jinowork</span>
    <span class="brand-full__dot" aria-hidden="true">.</span>
  </span>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  flex-shrink: 0;
}

.brand-mark__letter {
  color: var(--foreground);
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1;
}

.brand-full {
  display: inline-flex;
  align-items: center;
  font-family: 'Manrope', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1;
}

.brand-full__word { color: var(--foreground); letter-spacing: -0.03em; }
.brand-full__dot { color: var(--primary); }
</style>
