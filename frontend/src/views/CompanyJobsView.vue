<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { BriefcaseBusiness, Eye, Pause, Pencil, Search, Send, UsersRound, X } from 'lucide-vue-next'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import { workspaceApi, type CompanyJob } from '@/services/workspace'

const jobs = ref<CompanyJob[]>([])
const verified = ref(false)
const loading = ref(true)
const savingId = ref('')
const error = ref('')
const search = ref('')
const statusFilter = ref('ALL')
const statusLabels: Record<string, string> = { DRAFT: 'Borrador', PUBLISHED: 'Publicada', PAUSED: 'Pausada', CLOSED: 'Cerrada', REMOVED: 'Retirada' }
const statuses = ['ALL', 'PUBLISHED', 'DRAFT', 'PAUSED', 'CLOSED', 'REMOVED']
const visibleJobs = computed(() => jobs.value.filter(job => {
  const matchesStatus = statusFilter.value === 'ALL' || job.status === statusFilter.value
  const matchesSearch = job.title.toLocaleLowerCase('es').includes(search.value.trim().toLocaleLowerCase('es'))
  return matchesStatus && matchesSearch
}))
function countFor(status: string) { return status === 'ALL' ? jobs.value.length : jobs.value.filter(job => job.status === status).length }

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [result, options] = await Promise.all([workspaceApi.companyJobs(), workspaceApi.companyJobOptions()])
    jobs.value = result.jobs
    verified.value = options.companyVerificationStatus === 'VERIFIED'
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudieron cargar tus vacantes.' }
  finally { loading.value = false }
}

async function changeStatus(job: CompanyJob, status: string) {
  if (savingId.value) return
  savingId.value = job.id
  error.value = ''
  try {
    await workspaceApi.updateCompanyJobStatus(job.id, status)
    await load()
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo actualizar el estado.' }
  finally { savingId.value = '' }
}

onMounted(load)
</script>

<template>
  <WorkspaceFrame eyebrow="Gestión de vacantes" title="Mis vacantes" subtitle="Crea y administra las ofertas de tu empresa." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/company/jobs/new">Crear vacante</RouterLink></template>
    <p v-if="!verified" class="workspace__notice">La empresa debe estar verificada para publicar ofertas. Puedes crear borradores mientras tanto.</p>
    <p v-if="error" class="workspace__error" role="alert">{{ error }}</p>
    <p v-if="loading" class="workspace__empty" role="status">Cargando vacantes…</p>
    <section v-else class="workspace__card workspace__section">
      <div v-if="jobs.length" class="company-jobs-tools">
        <label class="company-jobs-search"><Search :size="17" aria-hidden="true" /><span class="sr-only">Buscar vacante por título</span><input v-model="search" type="search" placeholder="Buscar por título…"><button v-if="search" type="button" aria-label="Limpiar búsqueda" @click="search = ''"><X :size="15" /></button></label>
        <div class="company-jobs-filter-heading"><strong>Estado de la vacante</strong><span>{{ visibleJobs.length }} {{ visibleJobs.length === 1 ? 'resultado' : 'resultados' }}</span></div>
        <div class="company-jobs-filters" role="group" aria-label="Filtrar vacantes por estado">
          <button v-for="status in statuses" :key="status" type="button" :class="{ 'company-jobs-filter--active': statusFilter === status }" :aria-pressed="statusFilter === status" @click="statusFilter = status">{{ status === 'ALL' ? 'Todas' : statusLabels[status] }} <span>{{ countFor(status) }}</span></button>
        </div>
      </div>
      <p v-if="!jobs.length" class="workspace__empty">Aún no has creado vacantes.</p>
      <p v-else-if="!visibleJobs.length" class="company-jobs-no-results">No hay vacantes que coincidan con la búsqueda y el estado seleccionados. <button type="button" @click="search = ''; statusFilter = 'ALL'">Limpiar filtros</button></p>
      <div v-else class="workspace__list company-jobs-list">
        <article v-for="job in visibleJobs" :key="job.id" class="company-job-row">
          <div class="company-job-row__top"><span class="company-job-row__icon"><BriefcaseBusiness :size="19" /></span><div class="company-job-row__content"><div class="company-job-row__title"><h2>{{ job.title }}</h2><span class="company-job-row__status" :class="`company-job-row__status--${job.status.toLowerCase()}`">{{ statusLabels[job.status] ?? job.status }}</span></div><span class="company-job-row__date">Creada el {{ new Date(job.createdAt).toLocaleDateString('es-NI') }}</span></div></div>
          <div class="company-job-row__bottom"><div class="company-job-row__metrics"><span><UsersRound :size="15" />{{ job._count.applications }} postulaciones</span><span><Eye :size="15" />{{ job._count.views }} vistas</span></div>
            <div class="company-job-row__actions">
              <RouterLink class="company-job-row__link" :to="{ path: '/company/applications', query: { jobId: job.id } }"><UsersRound :size="15" />Postulantes</RouterLink>
              <RouterLink v-if="!['CLOSED', 'REMOVED'].includes(job.status)" class="company-job-row__link" :to="`/company/jobs/${job.id}/edit`"><Pencil :size="15" />Editar</RouterLink>
              <button v-if="['DRAFT', 'PAUSED'].includes(job.status) && verified" class="company-job-row__publish" type="button" :disabled="Boolean(savingId)" @click="changeStatus(job, 'PUBLISHED')"><Send :size="15" />Publicar</button>
              <button v-if="job.status === 'PUBLISHED'" type="button" :disabled="Boolean(savingId)" @click="changeStatus(job, 'PAUSED')"><Pause :size="15" />Pausar</button>
              <button v-if="['DRAFT', 'PUBLISHED', 'PAUSED'].includes(job.status)" type="button" :disabled="Boolean(savingId)" @click="changeStatus(job, 'CLOSED')">Cerrar vacante</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </WorkspaceFrame>
</template>

<style scoped>
.workspace__notice{margin:0 0 1rem;padding:1rem 1.1rem;border:1px solid color-mix(in srgb,var(--primary) 18%,var(--border));border-radius:.85rem;background:linear-gradient(110deg,var(--secondary),var(--surface));color:var(--foreground);font-size:.85rem}.company-jobs-list{gap:.8rem}.company-job-row{display:grid;gap:1rem;padding:1.1rem 1.2rem;border:1px solid var(--border);border-radius:.9rem;background:var(--surface);transition:border-color .18s,box-shadow .18s}.company-job-row:hover{border-color:color-mix(in srgb,var(--primary) 34%,var(--border));box-shadow:0 8px 22px color-mix(in srgb,var(--palette-ink) 7%,transparent)}.company-job-row__top,.company-job-row__title,.company-job-row__bottom,.company-job-row__metrics,.company-job-row__actions{display:flex;align-items:center}.company-job-row__top{gap:.8rem;min-width:0}.company-job-row__icon{display:grid;width:2.7rem;height:2.7rem;flex:none;place-items:center;border-radius:.75rem;background:var(--secondary);color:var(--primary)}.company-job-row__content{min-width:0}.company-job-row__title{flex-wrap:wrap;gap:.55rem}.company-job-row__title h2{margin:0;color:var(--foreground);font:800 1rem Manrope,sans-serif;letter-spacing:-.02em}.company-job-row__status{padding:.25rem .55rem;border:1px solid var(--border);border-radius:999px;background:var(--panel);color:var(--muted-foreground);font-size:.67rem;font-weight:800}.company-job-row__status--published{border-color:#b7e5d2;background:#eaf8f1;color:#16734d}.company-job-row__status--draft{border-color:#d9e3f0;background:#f2f5f9;color:#52647a}.company-job-row__status--paused{border-color:#f0d8a9;background:#fff7e8;color:#9a6810}.company-job-row__status--closed,.company-job-row__status--removed{background:var(--secondary)}.company-job-row__date{display:block;margin-top:.3rem;color:var(--muted-foreground);font-size:.74rem}.company-job-row__bottom{justify-content:space-between;gap:1rem;padding-top:.85rem;border-top:1px solid var(--border)}.company-job-row__metrics{flex-wrap:wrap;gap:.45rem 1rem;color:var(--muted-foreground);font-size:.74rem}.company-job-row__metrics span,.company-job-row__actions button,.company-job-row__link{display:inline-flex;align-items:center;gap:.4rem}.company-job-row__metrics svg{color:var(--primary)}.company-job-row__actions{justify-content:flex-end;flex-wrap:wrap;gap:.45rem}.company-job-row__actions button,.company-job-row__link{min-height:2.15rem;border:1px solid var(--border);border-radius:.6rem;background:var(--surface);color:var(--foreground);padding:.35rem .65rem;font:inherit;font-size:.74rem;font-weight:750;cursor:pointer;transition:background .16s,border-color .16s,color .16s}.company-job-row__actions button:hover,.company-job-row__link:hover{border-color:var(--primary);background:var(--secondary);color:var(--primary)}.company-job-row__actions .company-job-row__publish{border-color:var(--primary);background:var(--primary);color:#fff}.company-job-row__actions .company-job-row__publish:hover{background:color-mix(in srgb,var(--primary) 88%,#000);color:#fff}.company-job-row__actions button:disabled{opacity:.55;cursor:wait}.company-job-row__link{color:var(--primary);text-decoration:none}
@media(max-width:760px){.company-job-row__bottom{align-items:flex-start;flex-direction:column}.company-job-row__actions{justify-content:flex-start}}
</style>

<style scoped>
.company-jobs-tools{display:grid;gap:.65rem;margin:-.2rem 0 1rem;padding:1rem;border:1px solid var(--border);border-radius:.85rem;background:color-mix(in srgb,var(--panel) 48%,var(--surface))}
.company-jobs-search{display:flex;width:min(100%,34rem);min-height:2.7rem;align-items:center;gap:.6rem;padding:0 .8rem;border:1px solid var(--border);border-radius:.7rem;background:var(--surface);color:var(--muted-foreground);box-shadow:0 2px 5px color-mix(in srgb,var(--palette-ink) 3%,transparent)}
.company-jobs-search input{width:100%;min-width:0;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;color:var(--foreground);font:inherit;font-size:.8rem}
.company-jobs-search button{display:grid;width:1.7rem;height:1.7rem;flex:none;place-items:center;border:0;border-radius:.4rem;background:transparent;color:var(--muted-foreground);cursor:pointer}
.company-jobs-filter-heading{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-top:.1rem;color:var(--foreground)}
.company-jobs-filter-heading strong{font-size:.78rem;font-weight:800}
.company-jobs-filter-heading>span{color:var(--muted-foreground);font-size:.72rem}
.company-jobs-filters{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.45rem}
.company-jobs-filters button{display:flex;min-width:0;min-height:2.5rem;align-items:center;justify-content:space-between;gap:.5rem;padding:.35rem .6rem;border:1px solid var(--border);border-radius:.65rem;background:var(--surface);color:var(--muted-foreground);font:inherit;font-size:.72rem;font-weight:750;cursor:pointer;transition:background .16s,border-color .16s,color .16s,box-shadow .16s}
.company-jobs-filters button:hover{border-color:color-mix(in srgb,var(--primary) 38%,var(--border));color:var(--primary)}
.company-jobs-filters button.company-jobs-filter--active{border-color:var(--primary);background:var(--primary);color:#fff;box-shadow:0 3px 9px color-mix(in srgb,var(--primary) 19%,transparent)}
.company-jobs-filters span{display:grid;min-width:1.35rem;height:1.35rem;place-items:center;border-radius:.45rem;background:color-mix(in srgb,var(--foreground) 7%,transparent);font-size:.65rem;font-variant-numeric:tabular-nums}
.company-jobs-filters button.company-jobs-filter--active span{background:rgb(255 255 255 / 20%);color:#fff}
.company-jobs-no-results{padding:1rem 0;color:var(--muted-foreground);font-size:.82rem;line-height:1.6}
.company-jobs-no-results button{border:0;background:none;color:var(--primary);font:inherit;font-weight:800;cursor:pointer}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;clip-path:inset(50%)}
</style>

<style scoped>
.company-jobs-list{gap:.8rem}
@media(max-width:850px){.company-jobs-filters{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:520px){.company-jobs-tools{padding:.75rem}.company-jobs-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.company-jobs-filters button{font-size:.7rem}}
</style>
