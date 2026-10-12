<script setup lang="ts">
const src = '/images/brand/logo.svg'
</script>

<template>
  <img :src="src" alt="Logo de Jinowork" class="brand-logo" />
</template>

<style scoped>
.brand-logo {
  display: block;
  width: 11rem;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}
</style>
