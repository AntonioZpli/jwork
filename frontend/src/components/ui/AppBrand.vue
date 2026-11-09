<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** mark = compact isotipo; full = horizontal wordmark */
  variant?: 'mark' | 'full'
  /** light is for dark backgrounds; dark is for light backgrounds */
  tone?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), { variant: 'mark', tone: 'dark' })
const logoSrc = computed(() => props.tone === 'light' ? '/images/brand/jinowork-logo-claro.svg' : '/images/brand/jinowork-logo.svg')
const iconSrc = computed(() => props.tone === 'light' ? '/images/brand/jinowork-icon-claro.svg' : '/images/brand/jinowork-icon.svg')
</script>

<template>
  <span v-if="props.variant === 'mark'" class="brand-mark" aria-label="Jinowork">
    <img class="brand-mark__image" :src="iconSrc" alt="" aria-hidden="true">
  </span>

  <span v-else class="brand-full" aria-label="Jinowork">
    <img class="brand-full__image" :src="logoSrc" alt="" aria-hidden="true">
  </span>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.brand-mark__image { display:block; width:100%; height:100%; object-fit:contain; }

.brand-full {
  display: inline-flex;
  align-items: center;
  flex: none;
}

.brand-full__image { display:block; width:auto; height:2rem; max-width:min(11rem,100%); object-fit:contain; }
</style>
