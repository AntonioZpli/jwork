<script setup lang="ts">
defineProps<{ search: string }>()
const emit = defineEmits<{ 'update:search': [value: string] }>()

function updateSearch(event: Event) {
  if (event.target instanceof HTMLInputElement) emit('update:search', event.target.value)
}
</script>

<template>
  <div class="application-filters">
    <label class="application-filters__search">
      <span>Buscar perfiles</span>
      <input :value="search" type="search" placeholder="Nombre, área o especialidad" autocomplete="off" @input="updateSearch">
    </label>
  </div>
</template>

<style scoped>
.application-filters{display:grid;grid-template-columns:minmax(15rem,1fr);gap:1rem;margin:1.25rem 0 1.1rem}
.application-filters label{display:grid;gap:.45rem;min-width:0;color:var(--muted-foreground);font-size:.78rem;font-weight:700}
.application-filters input{width:100%;min-height:3rem;padding:.7rem .9rem;border:1px solid var(--border);border-radius:.65rem;outline:none;background:var(--surface);color:var(--foreground);font:inherit;font-size:.875rem}
.application-filters input:focus-visible{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 14%,transparent)}
@media(max-width:700px){.application-filters{grid-template-columns:1fr;gap:.8rem}}
</style>
