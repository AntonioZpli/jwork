<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ tone?: 'light' | 'dark' }>(), { tone: 'dark' })
const src = computed(() => props.tone === 'light' ? '/images/brand/jinowork-icon-claro.svg' : '/images/brand/jinowork-icon.svg')
</script>

<template>
  <img :src="src" alt="Isotipo de Jinowork" class="brand-mark" />
</template>

<style scoped>
.brand-mark {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
}
</style>
