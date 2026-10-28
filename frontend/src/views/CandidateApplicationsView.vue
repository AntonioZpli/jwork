<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import { jobsApi, type CandidateApplication } from '@/services/jobs'

const applications = ref<CandidateApplication[]>([])
const loading = ref(true)
const busyId = ref('')
const error = ref('')
const statusLabels: Record<string, string> = { RECEIVED: 'Recibida', IN_REVIEW: 'En revisión', SHORTLISTED: 'Preseleccionada', INTERVIEW: 'Entrevista', SELECTED: 'Seleccionada', REJECTED: 'No seleccionada', WITHDRAWN: 'Retirada' }
const statusFilter = ref('ALL')
const statusFilters = [
  { id: 'ALL', label: 'Todas' },
  { id: 'ACTIVE', label: 'En proceso' },
  { id: 'INTERVIEW', label: 'Entrevista' },
  { id: 'FINISHED', label: 'Finalizadas' },
]
const activeStatuses = ['RECEIVED', 'IN_REVIEW', 'SHORTLISTED']
const finishedStatuses = ['SELECTED', 'REJECTED', 'WITHDRAWN']
const visibleApplications = computed(() => applications.value.filter(application => {
  if (statusFilter.value === 'ACTIVE') return activeStatuses.includes(application.status)
  if (statusFilter.value === 'INTERVIEW') return application.status === 'INTERVIEW'
  if (statusFilter.value === 'FINISHED') return finishedStatuses.includes(application.status)
  return true
}))
function countFor(filter: string) {
  if (filter === 'ACTIVE') return applications.value.filter(application => activeStatuses.includes(application.status)).length
  if (filter === 'INTERVIEW') return applications.value.filter(application => application.status === 'INTERVIEW').length
  if (filter === 'FINISHED') return applications.value.filter(application => finishedStatuses.includes(application.status)).length
  return applications.value.length
}
async function load() {
  try { applications.value = (await jobsApi.candidateApplications()).applications }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudieron cargar tus postulaciones.' }
  finally { loading.value = false }
}
async function withdraw(application: CandidateApplication) {
  if (busyId.value) return
  busyId.value = application.id
  error.value = ''
  try { await jobsApi.withdraw(application.id); await load() }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo retirar la postulación.' }
  finally { busyId.value = '' }
}
onMounted(load)
</script>

<template>
  <WorkspaceFrame eyebrow="Mi actividad" title="Mis postulaciones" subtitle="Consulta el estado y el historial de cada candidatura." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/jobs">Explorar vacantes</RouterLink></template>
    <p v-if="error" class="workspace__error" role="alert">{{ error }}</p><p v-if="loading" class="workspace__empty" role="status">Cargando postulaciones…</p>
    <section v-else class="workspace__card workspace__section">
      <p v-if="!applications.length" class="candidate-applications__empty workspace__empty">Aún no te has postulado a ninguna vacante. <RouterLink to="/jobs">Encuentra una oportunidad para empezar</RouterLink></p>
      <template v-else>
        <nav class="candidate-applications__filters" aria-label="Filtrar postulaciones por estado"><button v-for="filter in statusFilters" :key="filter.id" type="button" :aria-pressed="statusFilter === filter.id" :class="{ 'is-active': statusFilter === filter.id }" @click="statusFilter = filter.id">{{ filter.label }}<span>{{ countFor(filter.id) }}</span></button></nav>
        <p class="candidate-applications__context" aria-live="polite">{{ visibleApplications.length }} {{ visibleApplications.length === 1 ? 'postulación' : 'postulaciones' }} en esta vista</p>
        <div v-if="visibleApplications.length" class="workspace__list">
          <article v-for="application in visibleApplications" :key="application.id" class="workspace__row candidate-application"><div><RouterLink v-if="application.job.status === 'PUBLISHED'" :to="`/jobs/${application.job.id}`" class="candidate-application__title">{{ application.job.title }}</RouterLink><strong v-else>{{ application.job.title }}</strong><span class="workspace__meta">{{ application.job.company.name }} · Enviada {{ new Date(application.appliedAt).toLocaleDateString('es-NI') }}</span><ol class="candidate-application__history"><li v-for="(event, index) in application.statusHistory" :key="`${event.createdAt}-${index}`"><span>{{ statusLabels[event.newStatus] ?? event.newStatus }}</span><time :datetime="event.createdAt">{{ new Date(event.createdAt).toLocaleDateString('es-NI') }}</time><small v-if="event.comment">{{ event.comment }}</small></li></ol></div><div class="candidate-application__actions"><span class="workspace__pill">{{ statusLabels[application.status] ?? application.status }}</span><RouterLink v-if="application.job.status === 'PUBLISHED'" :to="`/jobs/${application.job.id}`">Ver oferta</RouterLink><button v-if="['RECEIVED','IN_REVIEW','SHORTLISTED','INTERVIEW'].includes(application.status)" type="button" :disabled="Boolean(busyId)" @click="withdraw(application)">{{ busyId === application.id ? 'Procesando…' : 'Retirar' }}</button></div></article>
        </div>
        <p v-else class="candidate-applications__no-results">No hay postulaciones en este grupo. <button type="button" @click="statusFilter = 'ALL'">Ver todas</button></p>
      </template>
    </section>
  </WorkspaceFrame>
</template>

<style scoped>
.candidate-application{align-items:flex-start;gap:1rem;padding:1.15rem;border:1px solid var(--border);border-radius:.85rem;background:linear-gradient(120deg,var(--surface),color-mix(in srgb,var(--palette-ice) 24%,var(--surface)));transition:border-color .18s,box-shadow .18s}.candidate-application+.candidate-application{margin-top:.65rem}.candidate-application:hover{border-color:color-mix(in srgb,var(--primary) 32%,var(--border));box-shadow:0 9px 24px color-mix(in srgb,var(--palette-ink) 6%,transparent)}.candidate-application__title{display:block;color:var(--foreground);font:800 1rem Manrope,sans-serif}.candidate-application__title:hover{color:var(--primary)}.candidate-application__history{display:flex;flex-wrap:wrap;gap:.45rem;margin:.8rem 0 0;padding:0;list-style:none}.candidate-application__history li{display:grid;gap:.2rem;padding:.5rem .65rem;border:1px solid var(--border);border-radius:.65rem;background:var(--surface);font-size:.72rem}.candidate-application__history li span{font-weight:750}.candidate-application__history time,.candidate-application__history small{color:var(--muted-foreground)}.candidate-application__actions{display:flex;align-items:flex-end;flex-direction:column;gap:.55rem}.candidate-application__actions button{min-height:2.2rem;border:1px solid color-mix(in srgb,#b23c48 30%,var(--border));border-radius:.65rem;padding:.4rem .75rem;color:#a33f49;background:var(--surface);font:inherit;font-size:.75rem;font-weight:750;cursor:pointer}.candidate-application__actions button:hover{background:#fff2f2}.candidate-application__actions button:disabled{opacity:.5}
@media(max-width:650px){.candidate-application__actions{align-items:flex-start;flex-direction:row}.candidate-application{padding:.9rem}}
</style>

<style scoped>
.workspace__section>.workspace__list{gap:0}.candidate-application{margin:0;padding:.9rem .35rem;border:0;border-top:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none}.candidate-application:first-child{border-top:0}.candidate-application:hover{border-color:var(--border);background:color-mix(in srgb,var(--secondary) 28%,transparent);box-shadow:none}.candidate-application__history{gap:.35rem;margin-top:.55rem}.candidate-application__history li{padding:.35rem .5rem;border:0;border-radius:.45rem;background:var(--panel);font-size:.68rem}.candidate-application__actions button{min-height:1.95rem;border-radius:.55rem;font-size:.71rem}

.candidate-applications__filters{display:flex;gap:.4rem;overflow-x:auto;margin:0 -.2rem;padding:.15rem .2rem .7rem;border-bottom:1px solid var(--border);scrollbar-width:thin}
.candidate-applications__filters button{display:inline-flex;min-height:2.2rem;align-items:center;gap:.45rem;padding:0 .7rem;border:1px solid transparent;border-radius:999px;background:transparent;color:var(--muted-foreground);font:inherit;font-size:.72rem;font-weight:750;white-space:nowrap;cursor:pointer}
.candidate-applications__filters button:hover,.candidate-applications__filters button.is-active{border-color:color-mix(in srgb,var(--primary) 22%,var(--border));background:var(--secondary);color:var(--primary)}
.candidate-applications__filters button span{display:grid;min-width:1.2rem;height:1.2rem;place-items:center;border-radius:999px;background:color-mix(in srgb,var(--foreground) 7%,transparent);font-size:.63rem}
.candidate-applications__context{margin:.7rem 0;color:var(--muted-foreground);font-size:.7rem}
.candidate-application__actions>a{color:var(--primary);font-size:.72rem;font-weight:750}
.candidate-applications__empty a,.candidate-applications__no-results button{color:var(--primary);font-weight:800}
.candidate-applications__no-results{padding:1.5rem .5rem;color:var(--muted-foreground);font-size:.8rem;text-align:center}
.candidate-applications__no-results button{border:0;background:transparent;font:inherit;cursor:pointer}
</style>
