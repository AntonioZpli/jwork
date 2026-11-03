<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useToast } from '@/composables/useToast'
import { workspaceApi, type CompanyJob } from '@/services/workspace'
import { oobAreaStyle } from '@/utils/oobAreaStyle'
import { vacancyInitials } from '@/utils/vacancyInitials'

const oobs = ref<CompanyJob[]>([])
const route = useRoute()
const router = useRouter()
const verified = ref(false)
const loading = ref(true)
const savingId = ref('')
const error = ref('')
const { notify } = useToast()
const { confirmation, askConfirmation, finishConfirmation } = useConfirmDialog()
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const statusFilter = ref('ALL')
const statusLabels: Record<string, string> = { DRAFT: 'Borrador', PUBLISHED: 'Publicada', PAUSED: 'Pausada', CLOSED: 'Cerrada', REMOVED: 'Retirada' }
const statuses = ['ALL', 'PUBLISHED', 'DRAFT', 'PAUSED', 'CLOSED', 'REMOVED']
const visibleJobs = computed(() => oobs.value.filter(oob => {
  const matchesStatus = statusFilter.value === 'ALL' ? oob.status !== 'REMOVED' : oob.status === statusFilter.value
  const matchesSearch = oob.title.toLocaleLowerCase('es').includes(search.value.trim().toLocaleLowerCase('es'))
  return matchesStatus && matchesSearch
}))
function countFor(status: string) { return status === 'ALL' ? oobs.value.filter(oob => oob.status !== 'REMOVED').length : oobs.value.filter(oob => oob.status === status).length }

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [result, options] = await Promise.all([workspaceApi.companyJobs(), workspaceApi.companyJobOptions()])
    oobs.value = result.jobs
    verified.value = options.companyVerificationStatus === 'VERIFIED'
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudieron cargar tus vacantes.' }
  finally { loading.value = false }
}

async function changeStatus(oob: CompanyJob, status: string) {
  if (savingId.value) return
  const actionLabel = status === 'PUBLISHED' ? 'publicar' : status === 'PAUSED' ? 'pausar' : 'cerrar'
  const confirmLabel = status === 'PUBLISHED' ? 'Publicar' : status === 'PAUSED' ? 'Pausar' : 'Cerrar vacante'
  if (!await askConfirmation({ title: `${confirmLabel} vacante`, message: `¿Confirmas que quieres ${actionLabel} “${oob.title}”?`, confirmLabel, danger: status === 'CLOSED' })) return
  savingId.value = oob.id
  error.value = ''
  try {
    await workspaceApi.updateCompanyJobStatus(oob.id, status)
    await load()
    const title = status === 'PUBLISHED' ? 'Vacante publicada' : status === 'PAUSED' ? 'Vacante pausada' : 'Vacante cerrada'
    const message = status === 'PUBLISHED' ? 'Ya está visible para los candidatos.' : status === 'PAUSED' ? 'Deoó de aparecer entre las ofertas disponibles.' : 'Ya no recibirá postulaciones.'
    notify(title, message)
  } catch (e) { notify('No se pudo actualizar la vacante', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error') }
  finally { savingId.value = '' }
}

async function removeJob(oob: CompanyJob) {
  if (savingId.value || !await askConfirmation({ title: 'Eliminar vacante', message: `¿Eliminar “${oob.title}” de tus vacantes? Dejará de aparecer para los candidatos.`, confirmLabel: 'Eliminar', danger: true })) return
  savingId.value = oob.id
  error.value = ''
  try {
    await workspaceApi.removeCompanyJob(oob.id)
    statusFilter.value = 'ALL'
    await load()
    notify('Vacante eliminada', 'Se quitó de tus vacantes.')
  } catch (e) { notify('No se pudo eliminar la vacante', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error') }
  finally { savingId.value = '' }
}

async function archiveRemovedJob(oob: CompanyJob) {
  if (savingId.value || oob.status !== 'REMOVED' || !await askConfirmation({ title: 'Archivar vacante retirada', message: `¿Quitar “${oob.title}” de tu lista? Las postulaciones y su historial se conservarán.`, confirmLabel: 'Archivar', danger: true })) return
  savingId.value = oob.id
  error.value = ''
  try {
    await workspaceApi.archiveCompanyJob(oob.id)
    oobs.value = oobs.value.filter(item => item.id !== oob.id)
    notify('Vacante archivada', 'Se quitó de la lista; el historial de postulaciones se conserva.')
  } catch (e) { notify('No se pudo archivar la vacante', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error') }
  finally { savingId.value = '' }
}

onMounted(load)
onMounted(() => {
  const saved = route.query.saved
  if (saved === 'created' || saved === 'updated') {
    notify(saved === 'created' ? 'Borrador de vacante creado' : 'Vacante actualizada', saved === 'created' ? 'Puedes editarla y publicarla cuando esté lista.' : 'Los cambios se guardaron correctamente.')
    void router.replace({ query: { ...route.query, saved: undefined } })
  }
})
watch(() => route.query.q, value => { search.value = typeof value === 'string' ? value : '' })
</script>

<template>
  <WorkspaceFrame eyebrow="Gestión de vacantes" title="Mis vacantes" subtitle="Crea y administra las ofertas de tu empresa." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta company-oobs__create" to="/company/jobs/new">Crear vacante <span aria-hidden="true">→</span></RouterLink></template>
    <AppMessage v-if="!loading && !verified" variant="warning" title="Verifica tu empresa para publicar" message="Puedes preparar vacantes como borrador mientras se completa la verificación." />
    <AppMessage v-if="error" variant="error" title="No se pudieron cargar tus vacantes" :message="error" />
    <AppMessage v-if="loading" variant="loading" message="Cargando vacantes…" />
    <section v-else class="workspace__card workspace__section company-oobs">
      <AppEmptyState v-if="!oobs.length" title="Todavía no has creado vacantes" description="Publica una oferta y aquí podrás administrarla y ver a sus postulantes."><template #actions><RouterLink to="/company/jobs/new">Crear vacante</RouterLink></template></AppEmptyState>
      <template v-else>
        <div class="company-oobs__overview">
          <p><strong>{{ oobs.filter(oob => oob.status !== 'REMOVED').length }}</strong> {{ oobs.filter(oob => oob.status !== 'REMOVED').length === 1 ? 'vacante' : 'vacantes' }}</p>
          <span>{{ visibleJobs.length === oobs.filter(oob => oob.status !== 'REMOVED').length ? 'Tu listado de ofertas' : `${visibleJobs.length} resultados con estos filtros` }}</span>
        </div>
        <div class="company-oobs__filters" role="search" aria-label="Filtrar vacantes">
          <label class="company-oobs__search">
            <span>Buscar</span>
            <input v-model="search" type="search" placeholder="Buscar por título">
          </label>
          <label>
            <span>Estado</span>
            <select v-model="statusFilter">
              <option v-for="status in statuses" :key="status" :value="status">{{ status === 'ALL' ? 'Todas' : statusLabels[status] }} ({{ countFor(status) }})</option>
            </select>
          </label>
        </div>
        <div v-if="visibleJobs.length" class="company-oobs__list" aria-live="polite">
          <article v-for="oob in visibleJobs" :key="oob.id" class="company-oobs__row">
            <div class="company-oobs__content">
              <div class="company-oobs__heading">
                <span class="company-oobs__oob-mark vacancy-mark" :style="oobAreaStyle(oob.professionalArea.name, oob.id)" aria-hidden="true">{{ vacancyInitials(oob.title) }}</span>
                <div class="company-oobs__identity">
                  <RouterLink v-if="!['CLOSED', 'REMOVED'].includes(oob.status)" class="company-oobs__title" :to="`/company/jobs/${oob.id}/edit`">{{ oob.title }}</RouterLink>
                  <strong v-else class="company-oobs__title">{{ oob.title }}</strong>
                  <span class="company-oobs__meta">{{ oob.professionalArea.name }} · Creada el {{ new Date(oob.createdAt).toLocaleDateString('es-NI') }}</span>
                </div>
                <span class="company-oobs__availability" :class="`company-oobs__availability--${oob.status.toLowerCase()}`">{{ statusLabels[oob.status] ?? oob.status }}</span>
              </div>
              <div class="company-oobs__details">
                <span>{{ oob._count.applications }} {{ oob._count.applications === 1 ? 'postulación' : 'postulaciones' }}</span>
              </div>
            </div>
            <div class="company-oobs__actions">
              <RouterLink :to="{ name: 'company-job-applicants', params: { id: oob.id } }">Postulantes <span aria-hidden="true">→</span></RouterLink>
              <RouterLink v-if="!['CLOSED', 'REMOVED'].includes(oob.status)" :to="`/company/jobs/${oob.id}/edit`">Editar</RouterLink>
              <button v-if="['DRAFT', 'PAUSED'].includes(oob.status) && verified" type="button" :disabled="Boolean(savingId)" @click="changeStatus(oob, 'PUBLISHED')">{{ savingId === oob.id ? 'Publicando…' : 'Publicar' }}</button>
              <button v-if="oob.status === 'PUBLISHED'" type="button" :disabled="Boolean(savingId)" @click="changeStatus(oob, 'PAUSED')">Pausar</button>
              <button v-if="['DRAFT', 'PUBLISHED', 'PAUSED'].includes(oob.status)" type="button" :disabled="Boolean(savingId)" @click="changeStatus(oob, 'CLOSED')">Cerrar</button>
              <button v-if="oob.status === 'CLOSED'" class="company-oobs__remove" type="button" :disabled="Boolean(savingId)" @click="removeJob(oob)">{{ savingId === oob.id ? 'Eliminando…' : 'Eliminar vacante' }}</button>
              <button v-if="oob.status === 'REMOVED'" class="company-oobs__remove" type="button" :disabled="Boolean(savingId)" @click="archiveRemovedJob(oob)">{{ savingId === oob.id ? 'Quitando…' : 'Quitar de mis vacantes' }}</button>
            </div>
          </article>
        </div>
        <AppEmptyState v-else title="No hay vacantes que coincidan" description="Prueba con otro título o cambia el estado."><template #actions><button type="button" @click="search = ''; statusFilter = 'ALL'">Limpiar filtros</button></template></AppEmptyState>
      </template>
    </section>
    <AppConfirmDialog v-if="confirmation" :title="confirmation.title" :message="confirmation.message" :confirm-label="confirmation.confirmLabel" :danger="confirmation.danger" @confirm="finishConfirmation(true)" @cancel="finishConfirmation(false)" />
  </WorkspaceFrame>
</template>

<style scoped>
.company-oobs__create{background:linear-gradient(120deg,var(--palette-violet),var(--primary))}
.company-oobs__overview{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:-.2rem 0 1rem;padding:.9rem 1rem;background:linear-gradient(100deg,color-mix(in srgb,var(--primary) 13%,var(--surface)),color-mix(in srgb,var(--palette-ice) 62%,var(--surface)));color:var(--muted-foreground)}
.company-oobs__overview p{margin:0;font-size:.84rem}.company-oobs__overview strong{color:var(--primary);font-size:1.05rem}.company-oobs__overview>span{font-size:.74rem}
.company-oobs__filters{display:grid;grid-template-columns:minmax(13rem,1fr) minmax(11rem,.42fr);gap:.8rem 1rem;align-items:end;padding:0 0 1.1rem;border-bottom:1px solid var(--border)}
.company-oobs__filters label{display:grid;gap:.35rem;min-width:0}.company-oobs__filters label>span{color:var(--muted-foreground);font-size:.68rem;font-weight:800;letter-spacing:.04em}
.company-oobs__filters input,.company-oobs__filters select{width:100%;height:2.7rem;padding:0 .8rem;border:0;border-bottom:2px solid transparent;border-radius:0;background:color-mix(in srgb,var(--palette-ice) 52%,var(--surface));color:var(--foreground);font:inherit;font-size:.78rem;transition:background .16s,border-color .16s}
.company-oobs__filters input:focus,.company-oobs__filters select:focus{border-bottom-color:var(--primary);background:color-mix(in srgb,var(--primary) 8%,var(--surface));outline:0}
.company-oobs__list{display:grid}
.company-oobs__row{display:flex;min-width:0;box-sizing:border-box;align-items:center;justify-content:space-between;gap:1.5rem;padding:1.25rem .7rem;margin:0 -.7rem;transition:background .16s}
.company-oobs__row:hover{background:color-mix(in srgb,var(--palette-ice) 48%,transparent)}
.company-oobs__row+.company-oobs__row{margin-top:.2rem}
.company-oobs__content{min-width:0;flex:1}
.company-oobs__heading{display:flex;align-items:center;gap:.85rem}
.company-oobs__oob-mark{display:grid;width:3rem;height:3rem;flex:none;place-items:center;background:linear-gradient(145deg,color-mix(in srgb,var(--oob-accent) 80%,white),var(--oob-accent));color:#fff;font:800 1rem Manrope,sans-serif}
.company-oobs__identity{min-width:0;flex:1}
.company-oobs__title{display:block;overflow:hidden;color:var(--foreground);font:800 1rem Manrope,sans-serif;text-overflow:ellipsis;white-space:nowrap}
.company-oobs__title:hover{color:var(--primary)}
.company-oobs__meta{display:block;margin-top:.23rem;color:var(--muted-foreground);font-size:.78rem}
.company-oobs__availability{display:inline-flex;flex:none;align-items:center;gap:.38rem;color:#13734f;font-size:.7rem;font-weight:800;white-space:nowrap}
.company-oobs__availability:before{width:.48rem;height:.48rem;border-radius:50%;background:#25a36f;content:""}
.company-oobs__availability--draft,.company-oobs__availability--paused{color:#9a6810}.company-oobs__availability--draft:before,.company-oobs__availability--paused:before{background:#d4a12b}
.company-oobs__availability--closed,.company-oobs__availability--removed{color:var(--muted-foreground)}.company-oobs__availability--closed:before,.company-oobs__availability--removed:before{background:var(--muted-foreground)}
.company-oobs__details{display:flex;flex-wrap:wrap;gap:.35rem 1.25rem;margin-top:.7rem;color:var(--muted-foreground);font-size:.74rem}
.company-oobs__details span+span:before{content:'·';margin-right:1.25rem;color:var(--primary)}
.company-oobs__actions{display:flex;min-width:0;flex:none;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:.85rem}
.company-oobs__actions>a,.company-oobs__actions>button{display:inline-flex;align-items:center;gap:.35rem;padding:0;border:0;background:transparent;color:var(--primary);font:inherit;font-size:.77rem;font-weight:800;white-space:nowrap;cursor:pointer}
.company-oobs__actions>a span{font-size:1rem;transition:transform .15s}.company-oobs__actions>a:hover span{transform:translateX(2px)}
.company-oobs__remove{color:var(--muted-foreground)!important;font-weight:750!important}.company-oobs__remove:hover{color:#b33d49!important}
.company-oobs__empty,.company-oobs__no-results{padding:1.6rem .25rem;color:var(--foreground)}
.company-oobs__empty p,.company-oobs__no-results p{margin:.4rem 0;color:var(--muted-foreground);font-size:.8rem}
.company-oobs__empty a,.company-oobs__no-results button{display:inline-block;margin-top:.55rem;padding:0;border:0;background:none;color:var(--primary);font:inherit;font-size:.78rem;font-weight:800;cursor:pointer}
@media(max-width:700px){
  .company-oobs__overview{align-items:flex-start;flex-direction:column;gap:.2rem;padding:.8rem}
  .company-oobs__filters{grid-template-columns:minmax(0,1fr);gap:.7rem}
  .company-oobs__row{align-items:stretch;flex-direction:column;gap:.8rem;padding:.9rem .65rem;margin-inline:-.65rem}
  .company-oobs__content{width:100%}
  .company-oobs__heading{align-items:flex-start;gap:.65rem}
  .company-oobs__oob-mark{width:2.6rem;height:2.6rem}
  .company-oobs__identity{min-width:0}
  .company-oobs__title{white-space:normal;overflow-wrap:anywhere;line-height:1.3}
  .company-oobs__availability{max-width:40%;white-space:normal;text-align:right}
  .company-oobs__meta{line-height:1.45}
  .company-oobs__actions{width:100%;justify-content:flex-start;gap:.45rem .85rem}
  .company-oobs__actions>a,.company-oobs__actions>button{min-height:2.25rem}
}
</style>
