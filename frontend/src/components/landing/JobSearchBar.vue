<script setup lang="ts">
import { Search, MapPin, Briefcase, FileText } from '@lucide/vue'
</script>

<template>
  <section class="job-search" aria-label="Ejemplo de búsqueda de empleos">
    <div class="job-search__header">
      <h2 class="job-search__title">Encuentra tu próxima oportunidad</h2>
      <span class="job-search__badge">Ejemplo visual</span>
    </div>
    <div class="job-search__fields" role="group" aria-label="Filtros de ejemplo, todavía no funcionales">
      <div class="job-search__field">
        <label for="search-keyword" class="job-search__label"><Search :size="14" aria-hidden="true" />Puesto o habilidad</label>
        <input id="search-keyword" type="search" class="job-search__input" placeholder="Ej. Diseñador/a" value="Desarrollador/a" disabled />
      </div>
      <div class="job-search__field">
        <label for="search-location" class="job-search__label"><MapPin :size="14" aria-hidden="true" />Departamento</label>
        <select id="search-location" class="job-search__input" disabled><option>Todo Nicaragua</option><option>Managua</option><option>León</option></select>
      </div>
      <div class="job-search__field">
        <label for="search-modality" class="job-search__label"><Briefcase :size="14" aria-hidden="true" />Modalidad</label>
        <select id="search-modality" class="job-search__input" disabled><option>Cualquier modalidad</option><option>Presencial</option><option>Híbrido</option><option>Remoto</option></select>
      </div>
      <div class="job-search__field">
        <label for="search-contract" class="job-search__label"><FileText :size="14" aria-hidden="true" />Contrato</label>
        <select id="search-contract" class="job-search__input" disabled><option>Todos los tipos</option><option>Permanente</option><option>Temporal</option><option>Por contrato</option></select>
      </div>
      <button type="button" class="job-search__btn" disabled aria-disabled="true" title="Ejemplo visual; búsqueda no conectada"><Search :size="16" aria-hidden="true" /><span>Buscar empleos</span></button>
    </div>
  </section>
</template>

<style scoped>
.job-search { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.75rem 2rem; box-shadow: 0 4px 18px oklch(0 0 0 / 0.06); }
.job-search__header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.job-search__title { margin: 0; font-family: Manrope, sans-serif; font-size: 1rem; font-weight: 700; color: var(--foreground); }
.job-search__badge { display: inline-flex; align-items: center; padding: .25rem .65rem; background: var(--secondary); border: 1px solid var(--border); border-radius: 99px; font-size: .72rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: .08em; }
.job-search__fields { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr auto; gap: 1rem; align-items: end; }
.job-search__field { display: flex; min-width: 0; flex-direction: column; gap: .45rem; }
.job-search__label { display: flex; align-items: center; gap: .35rem; font-size: .76rem; font-weight: 700; color: var(--muted-foreground); }
.job-search__input { width: 100%; height: 42px; padding: 0 .75rem; border: 0; border-bottom: 2px solid var(--border); border-radius: 0; background: transparent; color: var(--foreground); font: inherit; font-size: .9rem; }
.job-search__input:disabled { cursor: not-allowed; opacity: .8; }
.job-search__btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 42px; padding: 0 1.25rem; background: var(--primary); color: white; border: 0; border-radius: 6px; font: inherit; font-size: .88rem; font-weight: 700; white-space: nowrap; }
.job-search__btn:disabled { cursor: not-allowed; opacity: .5; }
@media (max-width: 1100px) { .job-search__fields { grid-template-columns: repeat(3, minmax(0, 1fr)); } .job-search__btn { grid-column: 1 / -1; width: 100%; } }
@media (max-width: 560px) { .job-search { padding: 1.25rem; } .job-search__fields { grid-template-columns: 1fr; } .job-search__btn { grid-column: 1; } }
</style>