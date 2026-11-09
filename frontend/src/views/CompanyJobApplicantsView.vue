<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import ApplicationCard from './ApplicationCard.vue'
import ApplicationFilters from './ApplicationFilters.vue'
import ApplicationProfileModal from './ApplicationProfileModal.vue'
import { useApplications } from './useApplications'
import type { AppRow } from './applicationStatus'

const { rows, page, pages, total, loading, refreshing, error, profile, busyId, searchText, update, undo, setPage, clearFilters } = useApplications()
const { confirmation, askConfirmation, finishConfirmation } = useConfirmDialog()
const resultsSummary = computed(() => {
  const count = total.value === 1 ? '1 postulante' : `${total.value} postulantes`
  return pages.value > 0 ? `${count} · ${page.value} de ${pages.value}` : count
})

async function advance(application: AppRow) {
  if (!application._nextStatus) return
  if (!await askConfirmation({ title: application._nextLabel ?? 'Actualizar candidatura', message: `¿Quieres cambiar el estado de la candidatura de ${application.candidateProfile.firstName} ${application.candidateProfile.lastName}?` })) return
  await update(application, application._nextStatus)
}

async function reject(application: AppRow) {
  if (!await askConfirmation({ title: 'Rechazar candidatura', message: `¿Confirmas que no continuarás con la candidatura de ${application.candidateProfile.firstName} ${application.candidateProfile.lastName}?`, confirmLabel: 'Rechazar', danger: true })) return
  await update(application, 'REJECTED')
}

async function undoStatus(application: AppRow) {
  if (!await askConfirmation({ title: 'Restaurar estado anterior', message: `¿Quieres deshacer el último cambio en la candidatura de ${application.candidateProfile.firstName} ${application.candidateProfile.lastName}?` })) return
  await undo(application)
}
</script>

<template>
  <WorkspaceFrame
    eyebrow="Selección de talento"
    title="Postulantes de la oferta"
    subtitle="Revisa cada perfil y gestiona el avance de sus candidaturas."
    initials="JW"
  >
    <template #heading-action>
      <RouterLink class="workspace__cta" to="/company/jobs">Mis ofertas</RouterLink>
    </template>

    <p class="company-job-applicants__back"><RouterLink to="/company/applications">Ver todos los postulantes</RouterLink></p>
    <AppMessage v-if="error" variant="error" title="No se pudieron cargar los postulantes" :message="error" />

    <section class="company-job-applicants">
      <ApplicationFilters :search="searchText" @update:search="searchText = $event" />
      <AppMessage v-if="loading" variant="loading" message="Cargando postulantes…" />
      <p class="company-job-applicants__count" role="status" aria-live="polite">{{ resultsSummary }}</p>

      <AppEmptyState
        v-if="!rows.length && !loading"
        :title="searchText ? 'No hay perfiles que coincidan' : 'Esta oferta aún no tiene postulantes'"
        :description="searchText ? 'Prueba con otro nombre, área o especialidad.' : 'Cuando alguien se postule, aparecerá aquí su perfil y podrás gestionar su candidatura.'"
      >
        <template #actions>
          <button v-if="searchText" type="button" @click="clearFilters">Limpiar búsqueda</button>
          <RouterLink v-else to="/company/jobs">Volver a mis ofertas</RouterLink>
        </template>
      </AppEmptyState>

      <div v-if="rows.length" class="company-job-applicants__list" :class="{ 'is-refreshing': refreshing }" :aria-busy="refreshing">
        <ApplicationCard
          v-for="application in rows"
          :key="application.id"
          :application="application"
          actionable
          :busy="busyId === application.id"
          @open="profile = application"
          @advance="advance(application)"
          @reject="reject(application)"
          @undo="undoStatus(application)"
        />
      </div>

      <nav v-if="pages > 1" class="company-job-applicants__pagination" aria-label="Paginación de postulantes">
        <button type="button" :disabled="page <= 1" @click="setPage(page - 1)">Anterior</button>
        <span>Página {{ page }} de {{ pages }}</span>
        <button type="button" :disabled="page >= pages" @click="setPage(page + 1)">Siguiente</button>
      </nav>
    </section>

    <ApplicationProfileModal v-if="profile" :application="profile" @close="profile = null" />
    <AppConfirmDialog v-if="confirmation" :title="confirmation.title" :message="confirmation.message" :confirm-label="confirmation.confirmLabel" :danger="confirmation.danger" @confirm="finishConfirmation(true)" @cancel="finishConfirmation(false)" />
  </WorkspaceFrame>
</template>

<style scoped>
.company-job-applicants{min-width:0}
.company-job-applicants__back{margin:-.9rem 0 1rem;font-size:.8rem}
.company-job-applicants__back a{color:var(--primary);font-weight:750}
.company-job-applicants__count{display:flex;align-items:center;gap:1rem;margin:.2rem 0 1rem;color:var(--muted-foreground);font-size:.78rem;font-weight:750;letter-spacing:.035em;text-transform:uppercase}
.company-job-applicants__count::after{height:1px;flex:1;background:var(--border);content:""}
.company-job-applicants__list{display:grid;gap:.85rem;transition:opacity .18s ease}
.company-job-applicants__list.is-refreshing{opacity:.58}
.company-job-applicants__pagination{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:1.4rem;color:var(--foreground);font-size:.82rem}
.company-job-applicants__pagination button{min-height:2.4rem;padding:.45rem .85rem;border:1px solid var(--border);border-radius:.55rem;background:var(--surface);color:var(--foreground);font:inherit;font-weight:700;cursor:pointer}
.company-job-applicants__pagination button:hover:not(:disabled){border-color:var(--primary);background:color-mix(in srgb,var(--primary) 5%,var(--surface))}
.company-job-applicants__pagination button:disabled{opacity:.45;cursor:not-allowed}
@media(prefers-reduced-motion:reduce){.company-job-applicants__list{transition:none}}
</style>
