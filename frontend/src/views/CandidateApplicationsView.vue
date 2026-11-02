<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Building2, CalendarDays, Check, MapPin, Trash2 } from 'lucide-vue-next'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useToast } from '@/composables/useToast'
import { oobsApi, type CandidateApplication } from '@/services/oobs'
import { oobAreaStyle } from '@/utils/oobAreaStyle'
import { vacancyInitials } from '@/utils/vacancyInitials'

const applications = ref<CandidateApplication[]>([])
const loading = ref(true)
const error = ref('')
const { notify } = useToast()
const busyId = ref('')
const activeApplications = computed(() => applications.value.filter(application => application.status !== 'WITHDRAWN'))
const withdrawnCount = ref(0)
const processSteps = ['Recibida', 'En revisión', 'Entrevista', 'Decisión']
const statusRanks: Record<string, number> = { RECEIVED: 0, IN_REVIEW: 1, SHORTLISTED: 1, INTERVIEW: 2, SELECTED: 3, REJECTED: 3 }
function statusLabel(application: CandidateApplication) {
  if (application.status === 'REJECTED' && application.statusHistory.at(-1)?.previousStatus === 'INTERVIEW') return 'No aceptada'
  if (application.status === 'SELECTED') return 'Aceptada'
  if (application.status === 'REJECTED') return 'Rechazada'
  if (application.status === 'INTERVIEW') return 'Entrevista'
  if (application.status === 'IN_REVIEW' || application.status === 'SHORTLISTED') return 'En revisión'
  return 'Recibida'
}
function applicationRank(application: CandidateApplication) {
  return statusRanks[application.status] ?? 0
}
function processState(application: CandidateApplication, index: number) {
  const rank = applicationRank(application)
  if (index < rank) return 'done'
  if (index === rank) return 'current'
  return 'pending'
}
function stepLabel(application: CandidateApplication, index: number) {
  if (index < 3) return processSteps[index]
  if (application.status === 'SELECTED') return 'Aceptada'
  if (application.status === 'REJECTED') return statusLabel(application)
  return processSteps[index]
}
function stepDescription(application: CandidateApplication, index: number) {
  if (index === 0) return 'Tu postulación fue recibida correctamente.'
  if (index === 1) return applicationRank(application) > 1 ? 'La empresa revisó tu perfil.' : 'Estamos revisando tu perfil.'
  if (index === 2) return applicationRank(application) > 2 ? 'La entrevista se completó.' : 'Te contactaremos pronto.'
  if (application.status === 'SELECTED') return 'La empresa aceptó tu candidatura.'
  if (application.status === 'REJECTED') return statusLabel(application)
  return 'Decisión de la empresa.'
}
async function load() {
  try {
    const result = await oobsApi.candidateApplications()
    applications.value = result.applications
    withdrawnCount.value = result.withdrawnCount
  }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudieron cargar tus postulaciones.' }
  finally { loading.value = false }
}
async function removeApplication(application: CandidateApplication) {
  if (!['SELECTED', 'REJECTED'].includes(application.status) || busyId.value) return
  busyId.value = application.id
  error.value = ''
  try {
    await oobsApi.removeApplication(application.id)
    applications.value = applications.value.filter(item => item.id !== application.id)
    notify('Postulación retirada', 'Se quitó de tu lista.')
  } catch (e) {
    notify('No se pudo quitar la postulación', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error')
  } finally {
    busyId.value = ''
  }
}
onMounted(load)
</script>

<template>
  <WorkspaceFrame eyebrow="Mi actividad" title="Mis postulaciones" subtitle="Gestiona y da seguimiento a tus postulaciones." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/jobs">Explorar vacantes</RouterLink></template>
    <AppMessage v-if="error" variant="error" title="No se pudieron cargar tus postulaciones" :message="error" />
    <AppMessage v-if="loading" variant="loading" message="Cargando postulaciones…" />
    <section v-else class="candidate-applications">
      <AppEmptyState v-if="!activeApplications.length" :title="withdrawnCount ? 'No tienes postulaciones activas' : 'Todavía no tienes postulaciones'" :description="withdrawnCount ? 'Las postulaciones que retiraste ya no aparecen aquí.' : 'Cuando te postules, podrás seguir aquí cada etapa del proceso.'">
        <template #actions><RouterLink to="/jobs">Explorar vacantes</RouterLink></template>
      </AppEmptyState>
      <template v-else>
        <div class="candidate-applications__list">
          <article v-for="application in activeApplications" :key="application.id" class="candidate-application" :class="`candidate-application--${application.status.toLowerCase()}`">
            <header class="candidate-application__header">
              <span class="candidate-application__company-mark vacancy-mark" :style="oobAreaStyle(application.oob.professionalArea.name, application.oob.id)" aria-hidden="true">{{ vacancyInitials(application.oob.title) }}</span>
              <div class="candidate-application__identity">
                <RouterLink v-if="application.oob.status === 'PUBLISHED'" :to="`/jobs/${application.oob.id}`" class="candidate-application__title">{{ application.oob.title }}</RouterLink>
                <strong v-else class="candidate-application__title">{{ application.oob.title }}</strong>
                <span class="candidate-application__company"><span class="candidate-application__company-name"><Building2 :size="17" aria-hidden="true" />{{ application.oob.company.name }}</span><span v-if="application.oob.municipality || application.oob.department" class="candidate-application__location"><MapPin :size="17" aria-hidden="true" />{{ [application.oob.municipality?.name, application.oob.department?.name].filter(Boolean).join(', ') }}</span></span>
              </div>
            </header>
            <ol class="candidate-application__process" :aria-label="`Proceso de selección: ${statusLabel(application)}`">
              <li v-for="(step, index) in processSteps" :key="step" :class="`is-${processState(application, index)}`">
                <span class="candidate-application__step-icon"><span class="candidate-application__step-circle"><Check v-if="processState(application, index) === 'done' || (index === applicationRank(application) && applicationRank(application) > 0)" :size="19" :stroke-width="3" aria-hidden="true" /><b v-else>{{ index + 1 }}</b></span></span>
                <small>
                  <span class="candidate-application__step-name">{{ stepLabel(application, index) }}</span>
                  <em>{{ stepDescription(application, index) }}</em>
                </small>
              </li>
            </ol>
            <p v-if="application.status === 'REJECTED'" class="candidate-application__note">{{ application.statusHistory.at(-1)?.previousStatus === 'INTERVIEW' ? 'La empresa decidió no continuar después de la entrevista.' : 'La empresa rechazó tu candidatura después de revisarla.' }}</p>
            <p v-else-if="application.status === 'SELECTED'" class="candidate-application__note">La empresa aceptó tu candidatura para esta vacante.</p>
            <footer class="candidate-application__footer">
              <span class="candidate-application__applied"><CalendarDays :size="20" aria-hidden="true" /><span>Postulado el<strong>{{ new Date(application.appliedAt).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' }) }}</strong></span></span>
              <div class="candidate-application__actions">
                <button v-if="['SELECTED', 'REJECTED'].includes(application.status)" type="button" :disabled="busyId === application.id" @click="removeApplication(application)"><Trash2 :size="19" aria-hidden="true" />{{ busyId === application.id ? 'Quitando…' : 'Quitar de mis postulaciones' }}</button>
                <RouterLink v-if="application.oob.status === 'PUBLISHED'" :to="`/jobs/${application.oob.id}`">Ver oferta <ArrowRight :size="18" aria-hidden="true" /></RouterLink>
              </div>
            </footer>
          </article>
        </div>
      </template>
    </section>
  </WorkspaceFrame>
</template>

<style scoped>
.candidate-applications{display:block}
.candidate-applications__list{display:grid;gap:1.3rem}
.candidate-application{position:relative;display:grid;gap:1.05rem;padding:1.05rem 1.1rem 1rem;border:1px solid #dfeaf6;border-radius:1rem;background:#f8fbff;box-shadow:0 8px 18px rgb(16 35 68 / 4%)}
.candidate-application:hover{border-color:rgba(32,108,227,.25);box-shadow:0 12px 26px rgb(13 52 95 / 7%)}
.candidate-application__header{display:flex;align-items:center;gap:1rem;min-width:0}
.candidate-application__company-mark{display:grid;width:4rem;height:4rem;flex:none;place-items:center;border-radius:.9rem;background:linear-gradient(135deg,#0f74e6,#0a5fc0);color:#fff;font:800 1.2rem Manrope,sans-serif;letter-spacing:-.04em}
.candidate-application__identity{display:grid;gap:.35rem;min-width:0;flex:1}
.candidate-application__title{display:block;overflow:hidden;color:var(--foreground);font:800 clamp(1.25rem,2vw,1.9rem)/1.15 Manrope,sans-serif;letter-spacing:-.05em;text-overflow:ellipsis;white-space:nowrap}
.candidate-application__title:hover{color:var(--primary)}
.candidate-application__company{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem;color:var(--muted-foreground);font-size:.9rem}
.candidate-application__company-name,.candidate-application__location{display:inline-flex;align-items:center;gap:.35rem}
.candidate-application__location{color:#7a8ca3}
.candidate-application__location:before{content:'·';margin-right:.15rem;color:#a4b4c6}
.candidate-application__process{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;margin:0;padding:1rem .5rem .45rem;border:0;border-radius:1rem;background:transparent;list-style:none}
.candidate-application__process::before{position:absolute;left:12.5%;right:12.5%;top:2.35rem;height:4px;border-radius:999px;background:#1675d1;content:'';z-index:0}
.candidate-application__process li{position:relative;z-index:1;display:grid;justify-items:center;gap:.55rem;padding:0 .35rem;color:#6d819c;text-align:center}
.candidate-application__process li:before{display:none}
.candidate-application__step-icon{position:relative;z-index:3;display:grid;place-items:center;width:2.7rem;height:2.7rem;background:transparent;color:#fff;font-size:.76rem;font-weight:800}
.candidate-application__step-circle{position:relative;display:grid!important;place-items:center;width:2.35rem!important;height:2.35rem!important;min-width:2.35rem;border:3px solid #075bb8!important;border-radius:50%!important;background:#075bb8!important;color:#fff!important;box-shadow:0 0 0 4px #f8fbff!important;line-height:1}
.candidate-application__step-circle b,.candidate-application__step-circle svg{display:block;line-height:1}
.candidate-application__step-circle b{transform:translateY(-1px)}
.candidate-application__step-circle svg{display:block;width:1.3rem;height:1.3rem;stroke:#fff!important;fill:none;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 1px rgb(0 0 0 / 35%))}
.candidate-application__process li.is-done,.candidate-application__process li.is-current{color:#0d6fd8}
.candidate-application__process li.is-done .candidate-application__step-circle{border-color:#075bb8!important;background:#075bb8!important}
.candidate-application__process li.is-current .candidate-application__step-circle{border-color:#1675d1!important;background:#1675d1!important}
.candidate-application__process small{display:grid;gap:.22rem;color:inherit;font-size:.74rem;line-height:1.25}
.candidate-application__process small .candidate-application__step-name{font-weight:700}
.candidate-application__process small em{font-style:normal;color:#697d9a}
.candidate-application--selected .candidate-application__process::before{background:linear-gradient(90deg,#1675d1 0%,#1675d1 74%,#16804f 76%,#16804f 100%)}
.candidate-application--selected .candidate-application__process li.is-done{color:#0d6fd8}
.candidate-application--selected .candidate-application__process li.is-done .candidate-application__step-circle{border-color:#075bb8!important;background:#075bb8!important}
.candidate-application--selected .candidate-application__process li.is-current{color:#16804f}
.candidate-application--selected .candidate-application__process li.is-current .candidate-application__step-circle{border-color:#16804f!important;background:#16804f!important}
.candidate-application--rejected .candidate-application__process::before{background:linear-gradient(90deg,#1675d1 0%,#1675d1 74%,#cf3345 76%,#cf3345 100%)}
.candidate-application--rejected .candidate-application__process li.is-done{color:#0d6fd8}
.candidate-application--rejected .candidate-application__process li.is-done .candidate-application__step-circle{border-color:#075bb8!important;background:#075bb8!important}
.candidate-application--rejected .candidate-application__process li.is-current{color:#b42335}
.candidate-application--rejected .candidate-application__process li.is-current .candidate-application__step-circle{border-color:#cf3345!important;background:#cf3345!important}
.candidate-application__note{margin:-.1rem 0 0;color:#647995;font-size:.8rem;line-height:1.5}
.candidate-application__footer{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-top:.7rem;border-top:1px solid #e3ecf8}
.candidate-application__applied{display:inline-flex;align-items:center;gap:.45rem;color:#5f7186;font-size:.88rem}
.candidate-application__applied strong{margin-left:.25rem;color:var(--foreground);font-weight:800}
.candidate-application__actions{display:flex;align-items:center;gap:1rem}
.candidate-application__actions button{display:inline-flex;align-items:center;gap:.45rem;padding:0;border:0;background:transparent;color:#d93f4c;font:inherit;font-size:.85rem;font-weight:700;cursor:pointer}
.candidate-application__actions button:disabled{opacity:.6;cursor:wait}
.candidate-application__actions a{display:inline-flex;align-items:center;gap:.35rem;padding:.72rem 1.2rem;border:1px solid #1b7ae8;border-radius:.75rem;background:#fff;color:#0c6fd8;font-size:.9rem;font-weight:800;text-decoration:none;box-shadow:0 0 0 1px rgba(27,122,232,.12)}
.candidate-application__actions a:hover{background:#f1f8ff}
@media(max-width:760px){.candidate-application__process{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:1rem}.candidate-application__footer{flex-direction:column;align-items:flex-start}.candidate-application__actions{width:100%;justify-content:space-between}.candidate-application__actions a{flex:1;justify-content:center}}
@media(max-width:520px){.candidate-application__header{align-items:flex-start}.candidate-application__company-mark{width:3.4rem;height:3.4rem;border-radius:.75rem}.candidate-application__company{font-size:.78rem}.candidate-application__company-name,.candidate-application__location{display:flex}.candidate-application__process{grid-template-columns:1fr}.candidate-application__actions{flex-direction:column;align-items:flex-start}.candidate-application__actions a{width:100%}}
</style>
