<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ tone?: 'light' | 'dark' }>(), { tone: 'dark' })
const src = computed(() => props.tone === 'light' ? '/images/brand/jinowork-logo-claro.svg' : '/images/brand/jinowork-logo.svg')
</script>

<template>
<img :src="src" alt="Logo de Jinowork" class="brand-logo" />
</template>

<style scoped>
.brand-logo {
  display: block;
  width: auto;
  max-width: min(11rem, 100%);
  height: 2rem;
  object-fit: contain;
}
</style>
