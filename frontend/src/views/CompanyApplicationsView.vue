<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import CompanyApplicantSummaryCard from './CompanyApplicantSummaryCard.vue'
import ApplicationFilters from './ApplicationFilters.vue'
import ApplicationProfileModal from './ApplicationProfileModal.vue'
import { useApplications } from './useApplications'

const { rows, page, pages, total, loading, refreshing, error, profile, searchText, jobId, setPage, clearFilters } = useApplications()
const resultsSummary = computed(() => {
  const count = total.value === 1 ? '1 postulante' : `${total.value} postulantes`
  return pages.value > 0 ? `${count} · ${page.value} de ${pages.value}` : count
})

</script>

<template>
  <WorkspaceFrame
    eyebrow="Talento"
    :title="jobId ? 'Postulantes de la oferta' : 'Postulantes'"
    :subtitle="jobId ? 'Perfiles que se postularon a esta oferta.' : 'Explora los perfiles que se han postulado a tus ofertas, su experiencia y formación.'"
    initials="JW"
  >
    <template #heading-action>
      <RouterLink class="workspace__cta" to="/company/jobs">Mis ofertas</RouterLink>
    </template>

    <p v-if="jobId" class="company-applicants__back"><RouterLink to="/company/applications">Ver todos los postulantes</RouterLink></p>

    <AppMessage v-if="error" variant="error" title="No se pudieron cargar los perfiles" :message="error" />

    <section class="company-applicants">
      <ApplicationFilters :search="searchText" @update:search="searchText = $event" />
      <AppMessage v-if="loading" variant="loading" message="Cargando perfiles…" />
      <p class="company-applicants__count" role="status" aria-live="polite">{{ resultsSummary }}</p>

      <AppEmptyState
        v-if="!rows.length && !loading"
        :title="searchText ? 'No hay perfiles que coincidan' : (jobId ? 'Esta oferta aún no tiene postulantes' : 'Aún no tienes postulantes')"
        :description="searchText ? 'Prueba con otro nombre, área o especialidad.' : (jobId ? 'Cuando alguien se postule a esta oferta, aparecerá aquí su perfil profesional.' : 'Cuando alguien se postule a una de tus ofertas, podrás consultar aquí su perfil profesional.')"
      >
        <template #actions>
          <button v-if="searchText" type="button" @click="clearFilters">Limpiar búsqueda</button>
          <RouterLink v-else to="/company/jobs">Revisar mis ofertas</RouterLink>
        </template>
      </AppEmptyState>

      <div v-if="rows.length" class="company-applicants__list" :class="{ 'is-refreshing': refreshing }" :aria-busy="refreshing">
        <CompanyApplicantSummaryCard v-for="application in rows" :key="application.id" :application="application" @open="profile = application" />
      </div>

      <nav v-if="pages > 1" class="company-applicants__pagination" aria-label="Paginación de perfiles">
        <button type="button" :disabled="page <= 1" @click="setPage(page - 1)">Anterior</button>
        <span>Página {{ page }} de {{ pages }}</span>
        <button type="button" :disabled="page >= pages" @click="setPage(page + 1)">Siguiente</button>
      </nav>
    </section>

    <ApplicationProfileModal v-if="profile" :application="profile" @close="profile = null" />
  </WorkspaceFrame>
</template>

<style scoped>
.company-applicants{min-width:0}
.company-applicants__back{margin:-.7rem 0 1rem;font-size:.8rem}
.company-applicants__back a{color:var(--primary);font-weight:750}
.company-applicants__count{display:flex;align-items:center;gap:1rem;margin:.2rem 0 1rem;color:var(--muted-foreground);font-size:.78rem;font-weight:750;letter-spacing:.035em;text-transform:uppercase}
.company-applicants__count::after{height:1px;flex:1;background:var(--border);content:""}
.company-applicants__list{display:grid;gap:.85rem;transition:opacity .18s ease}
.company-applicants__list.is-refreshing{opacity:.58}
.company-applicants__pagination{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:1.4rem;color:var(--foreground);font-size:.82rem}
.company-applicants__pagination button{min-height:2.4rem;padding:.45rem .85rem;border:1px solid var(--border);border-radius:.55rem;background:var(--surface);color:var(--foreground);font:inherit;font-weight:700;cursor:pointer}
.company-applicants__pagination button:hover:not(:disabled){border-color:var(--primary);background:color-mix(in srgb,var(--primary) 5%,var(--surface))}
.company-applicants__pagination button:disabled{opacity:.45;cursor:not-allowed}
@media(prefers-reduced-motion:reduce){.company-applicants__list{transition:none}}
</style>
