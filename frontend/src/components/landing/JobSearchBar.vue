<script setup lang="ts">
import { Search, MapPin, Briefcase, FileText } from '@lucide/vue'

// Search is purely visual — no functional filtering
</script>

<template>
  <section class="job-search" aria-label="Búsqueda de empleos (demostración)">
    <div class="job-search__header">
      <h2 class="job-search__title">Encuentra tu próxima oportunidad</h2>
      <span class="job-search__badge" aria-label="Búsqueda de demostración">
        Búsqueda de demostración
      </span>
    </div>

    <div class="job-search__fields" role="group" aria-label="Filtros de búsqueda (no funcionales)">
      <div class="job-search__field">
        <label for="search-keyword" class="job-search__label">
          <Search :size="14" aria-hidden="true" />
          Puesto o habilidad
        </label>
        <input
          id="search-keyword"
          type="text"
          class="job-search__input"
          placeholder="Ej. Diseñador/a"
          value="Desarrollador/a"
          aria-label="Buscar por puesto o habilidad"
          disabled
        />
      </div>

      <div class="job-search__field">
        <label for="search-location" class="job-search__label">
          <MapPin :size="14" aria-hidden="true" />
          Ubicación
        </label>
        <select id="search-location" class="job-search__input" disabled aria-label="Filtrar por ubicación">
          <option>Todo Nicaragua</option>
          <option>Managua</option>
          <option>León</option>
          <option>Estelí</option>
          <option>Remoto</option>
        </select>
      </div>

      <div class="job-search__field">
        <label for="search-modality" class="job-search__label">
          <Briefcase :size="14" aria-hidden="true" />
          Modalidad
        </label>
        <select id="search-modality" class="job-search__input" disabled aria-label="Filtrar por modalidad">
          <option>Cualquier modalidad</option>
          <option>Presencial</option>
          <option>Híbrido</option>
          <option>Remoto</option>
        </select>
      </div>

      <div class="job-search__field">
        <label for="search-contract" class="job-search__label">
          <FileText :size="14" aria-hidden="true" />
          Contrato
        </label>
        <select id="search-contract" class="job-search__input" disabled aria-label="Filtrar por tipo de contrato">
          <option>Todos los tipos</option>
          <option>Tiempo completo</option>
          <option>Tiempo parcial</option>
          <option>Freelance</option>
        </select>
      </div>

      <button
        type="button"
        class="job-search__btn"
        disabled
        aria-disabled="true"
        title="La búsqueda todavía no está conectada"
      >
        <Search :size="16" aria-hidden="true" />
        <span>Buscar empleos</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.job-search {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.75rem 2rem;
  box-shadow: 0 4px 18px oklch(0 0 0 / 0.06);
}

.job-search__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.job-search__title {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--foreground);
}

.job-search__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  background: var(--secondary);
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.job-search__fields {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.job-search__field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.job-search__label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--muted-foreground);
}

.job-search__input {
  width: 100%;
  height: 42px;
  padding: 0 0.75rem;
  border: none;
  border-bottom: 2px solid var(--border);
  border-radius: 0;
  background: transparent;
  color: var(--foreground);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  cursor: not-allowed;
  opacity: 0.65;
  appearance: none;
  -webkit-appearance: none;
}

.job-search__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 42px;
  padding: 0 1.25rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: not-allowed;
  opacity: 0.5;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .job-search__fields {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .job-search__btn {
    grid-column: 1 / -1;
    justify-content: center;
    width: 100%;
  }
}

@media (max-width: 560px) {
  .job-search {
    padding: 1.25rem;
  }

  .job-search__fields {
    grid-template-columns: 1fr;
  }

  .job-search__btn {
    grid-column: 1;
  }
}
</style>
