<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import JobCard from '@/components/landing/JobCard.vue'
import PublicJobDialog from '@/components/jobs/PublicJobDialog.vue'
import { jobsApi, type PublicJob, type PublicJobOptions } from '@/services/jobs'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isCandidateWorkspace = computed(() => auth.user?.role === 'CANDIDATE')
const layoutProps = computed(() => isCandidateWorkspace.value ? {
  eyebrow: 'Oportunidades',
  title: 'Explorar vacantes',
  subtitle: 'Busca ofertas reales y filtra por área, ubicación y modalidad.',
  initials: auth.user?.email?.slice(0, 2).toUpperCase() ?? 'JW',
} : {})
const options = ref<PublicJobOptions | null>(null)
const jobs = ref<PublicJob[]>([])
const total = ref(0)
const pages = ref(0)
const loading = ref(false)
const error = ref('')
const selectedJobId = ref<string | null>(null)
const filters = reactive({ q: '', professionalAreaId: '', specializationId: '', departmentId: '', municipalityId: '', workMode: '', contractType: '', workday: '', salaryMin: '', salaryMax: '', currency: 'NIO', salaryPeriod: 'MONTHLY', includeUnspecified: '' })
let filtersSyncing = false
let filterTimer: ReturnType<typeof setTimeout> | undefined
let loadSequence = 0
const specializations = computed(() => options.value?.specializations.filter(item => item.professionalAreaId === filters.professionalAreaId) ?? [])
const municipalities = computed(() => options.value?.municipalities.filter(item => item.departmentId === filters.departmentId) ?? [])
const activeFilterCount = computed(() => Object.entries(filters).filter(([key, value]) => Boolean(value) && !(['currency', 'salaryPeriod'].includes(key) && !filters.salaryMin && !filters.salaryMax)).length)
const advancedFilterKeys = ['specializationId', 'municipalityId', 'workMode', 'contractType', 'workday', 'salaryMin', 'salaryMax', 'includeUnspecified']
const advancedFilterCount = computed(() => advancedFilterKeys.filter(key => Boolean(filters[key as keyof typeof filters])).length)
const hasAdvancedFilters = computed(() => advancedFilterCount.value > 0)

function queryValue(value: unknown) { return typeof value === 'string' ? value : '' }
function syncFilters() {
  filtersSyncing = true
  for (const key of Object.keys(filters) as (keyof typeof filters)[]) {
    const value = queryValue(route.query[key])
    filters[key] = key === 'currency' && !value ? 'NIO' : key === 'salaryPeriod' && !value ? 'MONTHLY' : value
  }
  filtersSyncing = false
}
async function load() {
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''
  try {
    const result = await jobsApi.list({ ...filters, page: Number(queryValue(route.query.page)) || 1 })
    if (sequence === loadSequence) { jobs.value = result.jobs; total.value = result.total; pages.value = result.pages }
  } catch (e) { if (sequence === loadSequence) error.value = e instanceof Error ? e.message : 'No se pudieron cargar las vacantes.' }
  finally { if (sequence === loadSequence) loading.value = false }
}
function search() {
  const hasSalaryRange = Boolean(filters.salaryMin || filters.salaryMax)
  const query = Object.fromEntries(Object.entries(filters).filter(([key, value]) => value && (!['currency', 'salaryPeriod'].includes(key) || hasSalaryRange)))
  void router.replace({ name: 'jobs', query })
}
function clearFilters() {
  filtersSyncing = true
  Object.assign(filters, { q: '', professionalAreaId: '', specializationId: '', departmentId: '', municipalityId: '', workMode: '', contractType: '', workday: '', salaryMin: '', salaryMax: '', currency: 'NIO', salaryPeriod: 'MONTHLY', includeUnspecified: '' })
  filtersSyncing = false
  if (filterTimer) clearTimeout(filterTimer)
  void router.replace({ name: 'jobs' })
}
function pageUrl(page: number) { return { name: 'jobs', query: { ...route.query, page: String(page) } } }
function closeJobDialog(navigating = false) {
  selectedJobId.value = null
  if (!navigating && typeof route.query.vacante === 'string') {
    const query = { ...route.query }
    delete query.vacante
    void router.replace({ query })
  }
}

onMounted(async () => {
  if (!auth.user) void auth.hydrateSession().catch(() => undefined)
  syncFilters()
  try { options.value = await jobsApi.options() } catch { /* The backend returns a visible request error for listings. */ }
  await load()
})
watch(filters, () => {
  if (filtersSyncing) return
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(search, filters.q ? 280 : 120)
}, { flush: 'sync' })
watch(() => route.query, async () => { syncFilters(); await load() })
watch(() => route.query.vacante, value => { selectedJobId.value = queryValue(value) || null }, { immediate: true })
</script>

<template>
  <component :is="isCandidateWorkspace ? WorkspaceFrame : 'div'" :class="!isCandidateWorkspace ? 'jobs-page' : undefined" v-bind="layoutProps"><SiteHeader v-if="!isCandidateWorkspace" /><component :is="isCandidateWorkspace ? 'div' : 'main'" class="jobs-page__main" :class="{ 'jobs-page__main--workspace': isCandidateWorkspace }">
    <header v-if="!isCandidateWorkspace" class="jobs-page__heading"><p class="workspace__eyebrow">Oportunidades reales</p><h1>Encuentra tu próximo trabajo</h1><p>Vacantes publicadas por empresas verificadas.</p></header>
    <form class="jobs-filters workspace__card" @submit.prevent="search">
      <div class="jobs-filters__primary">
        <label class="jobs-filters__keyword">Palabras clave<input v-model="filters.q" type="search" placeholder="Puesto, empresa o habilidad"></label>
        <label>Área profesional<select v-model="filters.professionalAreaId" @change="filters.specializationId = ''"><option value="">Todas las áreas</option><option v-for="item in options?.professionalAreas ?? []" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label>Departamento<select v-model="filters.departmentId" @change="filters.municipalityId = ''"><option value="">Todo Nicaragua</option><option v-for="item in options?.departments ?? []" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <button class="workspace__cta" type="submit">Buscar ofertas</button>
      </div>
      <details class="jobs-filters__advanced" :open="hasAdvancedFilters">
        <summary><span>Más filtros</span><small>{{ advancedFilterCount ? `${advancedFilterCount} aplicado${advancedFilterCount === 1 ? '' : 's'}` : 'Modalidad, contrato, jornada y salario' }}</small><b aria-hidden="true">⌄</b></summary>
        <div class="jobs-filters__grid">
          <label>Especialidad<select v-model="filters.specializationId" :disabled="!filters.professionalAreaId"><option value="">Todas</option><option v-for="item in specializations" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label>Municipio<select v-model="filters.municipalityId" :disabled="!filters.departmentId"><option value="">Todos</option><option v-for="item in municipalities" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label>Modalidad<select v-model="filters.workMode"><option value="">Cualquiera</option><option value="ONSITE">Presencial</option><option value="HYBRID">Híbrida</option><option value="REMOTE">Remota</option></select></label>
          <label>Contrato<select v-model="filters.contractType"><option value="">Todos</option><option value="PERMANENT">Permanente</option><option value="TEMPORARY">Temporal</option><option value="CONTRACT">Por contrato</option><option value="INTERNSHIP">Pasantía</option></select></label>
          <label>Jornada<select v-model="filters.workday"><option value="">Cualquiera</option><option value="FULL_TIME">Tiempo completo</option><option value="PART_TIME">Tiempo parcial</option></select></label>
          <fieldset class="jobs-filters__salary"><legend>Rango salarial</legend><label><span>Mínimo</span><input v-model="filters.salaryMin" type="number" min="0" step="0.01" placeholder="Sin mínimo"></label><label><span>Máximo</span><input v-model="filters.salaryMax" type="number" min="0" step="0.01" placeholder="Sin máximo"></label><label><span>Moneda</span><select v-model="filters.currency"><option value="NIO">NIO</option><option value="USD">USD</option></select></label><label><span>Período</span><select v-model="filters.salaryPeriod"><option value="HOURLY">Hora</option><option value="DAILY">Día</option><option value="WEEKLY">Semana</option><option value="BIWEEKLY">Quincena</option><option value="MONTHLY">Mes</option><option value="YEARLY">Año</option></select></label><label class="jobs-filters__check"><input v-model="filters.includeUnspecified" true-value="true" false-value="" type="checkbox"><span>Incluir ofertas sin salario</span></label></fieldset>
        </div>
      </details>
    </form>
    <p v-if="activeFilterCount" class="jobs-page__active-filters" aria-live="polite">{{ activeFilterCount }} {{ activeFilterCount === 1 ? 'filtro activo' : 'filtros activos' }}<button type="button" @click="clearFilters">Limpiar filtros</button></p>
    <AppMessage v-if="error" variant="error" title="No se pudieron cargar las vacantes" :message="error" />
    <div class="jobs-page__results-region" :class="{ 'is-loading': loading }" :aria-busy="loading">
      <p v-if="loading && jobs.length" class="jobs-page__refresh" role="status">Actualizando vacantes…</p>
      <p class="jobs-page__count" aria-live="polite">{{ total }} {{ total === 1 ? 'vacante encontrada' : 'vacantes encontradas' }}</p>
      <TransitionGroup name="job-results" tag="ul" class="jobs-page__results" aria-label="Vacantes disponibles">
        <li v-for="job in jobs" :key="job.id"><JobCard :job="job" @select="selectedJobId = $event" /></li>
      </TransitionGroup>
      <p v-if="!jobs.length && loading" class="jobs-page__state" role="status">Buscando vacantes…</p>
      <AppEmptyState v-else-if="!jobs.length" title="No hay vacantes con esos filtros" description="Prueba con otros criterios para encontrar oportunidades."><template #actions><button v-if="activeFilterCount" type="button" @click="clearFilters">Quitar filtros</button></template></AppEmptyState>
      <nav v-if="pages > 1" class="jobs-page__pagination" aria-label="Paginación"><RouterLink v-if="Number(route.query.page) > 1" :to="pageUrl(Number(route.query.page) - 1)">Anterior</RouterLink><span>Página {{ Number(route.query.page) || 1 }} de {{ pages }}</span><RouterLink v-if="(Number(route.query.page) || 1) < pages" :to="pageUrl((Number(route.query.page) || 1) + 1)">Siguiente</RouterLink></nav>
    </div>
  </component><SiteFooter v-if="!isCandidateWorkspace" />
  <PublicJobDialog :oob-id="selectedJobId" @close="closeJobDialog" />
  </component>
</template>

<style scoped>
.jobs-page { min-height: 100vh; background: var(--background); }
.jobs-page__main { width: min(1180px,100%); margin: auto; padding: 3rem clamp(1.25rem,4vw,3rem); }
.jobs-page__main--workspace { width: 100%; margin: 0; padding: 0; }
.jobs-page__heading { margin-bottom: 1.6rem; }.jobs-page__heading h1 { margin: 0; font: 800 clamp(2rem,4vw,2.8rem) Manrope,sans-serif; }.jobs-page__heading p:last-child { color: var(--muted-foreground); }
.jobs-filters { display: grid; gap: .8rem; padding: 1rem; margin-bottom: 1.25rem; }
.jobs-filters__primary { display: grid; grid-template-columns: minmax(15rem,1.5fr) repeat(2,minmax(11rem,1fr)) auto; gap: .75rem; align-items: end; }
.jobs-filters label { display: grid; gap: .4rem; color: var(--muted-foreground); font-size: .8rem; font-weight: 700; }
.jobs-filters .jobs-filters__check{display:flex;align-items:center;gap:.55rem;color:var(--foreground);font-size:.78rem}.jobs-filters .jobs-filters__check input{width:1rem;height:1rem;flex:none}
.jobs-filters input,.jobs-filters select { min-width: 0; height: 2.7rem; border: 1px solid var(--border); border-radius: .55rem; padding: 0 .65rem; color: var(--foreground); background: var(--surface); font: inherit; }
.jobs-filters input:focus,.jobs-filters select:focus-visible,.jobs-filters summary:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.jobs-filters__primary .workspace__cta { min-height: 2.7rem; white-space: nowrap; }
.jobs-filters__advanced { border-top: 1px solid var(--border); }
.jobs-filters__advanced > summary { display:flex;align-items:center;gap:.65rem;min-height:2.75rem;cursor:pointer;list-style:none;color:var(--foreground);font-size:.82rem;font-weight:800; }
.jobs-filters__advanced > summary::-webkit-details-marker { display:none; }
.jobs-filters__advanced > summary span { color:var(--primary); }
.jobs-filters__advanced > summary small { color:var(--muted-foreground);font-size:.75rem;font-weight:500; }
.jobs-filters__advanced > summary b { margin-left:auto;color:var(--muted-foreground);font-size:1.1rem;transition:transform .18s ease; }
.jobs-filters__advanced[open] > summary b { transform:rotate(180deg); }
.jobs-filters__grid { display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.85rem;padding:.35rem 0 .25rem; }
.jobs-filters__salary { grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) auto;align-items:end;gap:.55rem .7rem;min-width:0;margin:0;padding:.7rem .8rem .8rem;border:1px solid var(--border);border-radius:.65rem;background:color-mix(in srgb,var(--surface) 72%,var(--background)); }
.jobs-filters__salary legend { grid-column:1/-1;padding:0 .3rem;color:var(--foreground);font-size:.78rem;font-weight:800; }
.jobs-filters__salary label span { font-size:.7rem;font-weight:600; }
.jobs-filters__salary input,.jobs-filters__salary select { width:100%;height:2.45rem; }
.jobs-filters__salary .jobs-filters__check { display:flex;align-self:center;max-width:12rem;font-size:.72rem;line-height:1.25; }
.jobs-filters [disabled] { opacity:.55;cursor:not-allowed; }
.jobs-page__count { color: var(--muted-foreground); }.jobs-page__results { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 1rem; list-style: none; margin: 0; padding: 0; }.jobs-page__state { min-height: 8rem; display: grid; place-items: center; color: var(--muted-foreground); }.jobs-page__pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin: 2rem 0; }.jobs-page__pagination a { color: var(--primary); font-weight: 700; }
.jobs-page__active-filters{display:flex;align-items:center;gap:.6rem;margin:.1rem 0 .7rem;color:var(--muted-foreground);font-size:.72rem}.jobs-page__active-filters button,.jobs-page__state button{border:0;background:transparent;color:var(--primary);font:inherit;font-weight:800;cursor:pointer}
.jobs-page__results-region{position:relative;min-height:5rem}.jobs-page__results-region.is-loading>.jobs-page__count{opacity:.62}.jobs-page__refresh{margin:.4rem 0;color:var(--primary);font-size:.72rem;font-weight:700;animation:jobs-refresh-in .18s ease-out both}
.job-results-enter-active,.job-results-leave-active{transition:opacity .18s ease}
.job-results-enter-from,.job-results-leave-to{opacity:0}
.job-results-leave-active{pointer-events:none}
.job-results-enter-active{transition-delay:.035s}
@keyframes jobs-refresh-in{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.job-results-enter-active,.job-results-leave-active,.jobs-page__refresh{animation:none!important;transition:none!important}}
@media(max-width:1000px){.jobs-filters__primary{grid-template-columns:repeat(2,minmax(0,1fr))}.jobs-filters__keyword{grid-column:1/-1}.jobs-filters__primary .workspace__cta{width:100%}.jobs-filters__grid{grid-template-columns:repeat(2,minmax(0,1fr))}.jobs-filters__salary{grid-template-columns:repeat(4,minmax(0,1fr))}.jobs-filters__salary .jobs-filters__check{grid-column:1/-1;max-width:none}}
@media(max-width:850px){.jobs-page__results{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.jobs-filters__primary,.jobs-filters__grid,.jobs-page__results{grid-template-columns:1fr}.jobs-filters__keyword{grid-column:auto}.jobs-filters__salary{grid-template-columns:1fr 1fr}.jobs-filters__salary .jobs-filters__check{grid-column:1/-1}.jobs-filters__advanced>summary{flex-wrap:wrap;gap:.4rem}.jobs-page__active-filters{flex-wrap:wrap}}
</style>
