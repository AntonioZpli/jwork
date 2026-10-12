<script setup lang="ts">
const src = '/images/brand/isotipo.svg'
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
