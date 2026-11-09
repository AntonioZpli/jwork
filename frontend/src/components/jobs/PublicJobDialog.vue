<script setup lang="ts">
import { computed, nextTick, ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowRight, ArrowUpRight, Banknote, Bookmark, BriefcaseBusiness, CalendarDays, Clock3, Code2, Grid2X2, MapPin, Send, UsersRound, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppMessage from '@/components/ui/AppMessage.vue'
import ReportDialog from '@/components/ReportDialog.vue'
import { useToast } from '@/composables/useToast'
import { useEscapeKey } from '@/composables/useEscapeKey'
import { formatJobSalary, oobsApi, oobLabels, type PublicJob } from '@/services/oobs'
import { oobAreaStyle } from '@/utils/oobAreaStyle'
import { vacancyInitials } from '@/utils/vacancyInitials'

const props = defineProps<{ oobId: string | null }>()
const emit = defineEmits<{ close: [navigating?: boolean]; applied: [jobId: string] }>()
const route = useRoute()
const auth = useAuthStore()
const { notify } = useToast()
const oob = ref<PublicJob | null>(null)
const loading = ref(false)
const error = ref('')
const stateError = ref('')
const application = ref<{ id: string; status: string; appliedAt: string } | null>(null)
const saved = ref(false)
const compatibility = ref<{ score: number; criteria: { key: string; label: string; candidateValue: string; oobValue: string; score: number; max: number }[] } | null>(null)
const canApply = ref<boolean | null>(null)
const busy = ref(false)
const showReportDialog = ref(false)
const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let previousFocus: HTMLElement | null = null
let previousOverflow = ''
let dialogSessionOpen = false
let oobLoadSequence = 0
let actionSequence = 0
const isCandidate = computed(() => auth.user?.role === 'CANDIDATE')
const canWithdrawApplication = computed(() => Boolean(application.value && ['RECEIVED', 'IN_REVIEW', 'SHORTLISTED', 'INTERVIEW'].includes(application.value.status)))
const loginRedirect = computed(() => oob.value ? `/jobs/${oob.value.id}` : route.fullPath)
const compatibilityTone = computed(() => {
  const score = compatibility.value?.score
  if (score === undefined) return { accent: '#2f5f52', track: '#e9f0ec' }
  if (score >= 80) return { accent: '#19805a', track: '#e5f1eb' }
  if (score >= 60) return { accent: '#3e7f69', track: '#e9f0ec' }
  if (score >= 40) return { accent: '#d29a32', track: '#fbf2df' }
  return { accent: '#b5483a', track: '#fbefeb' }
})
function normalizeCompatibility(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  const value = root.compatibility && typeof root.compatibility === 'object'
    ? root.compatibility as Record<string, unknown>
    : root
  const nestedScore = value.score && typeof value.score === 'object'
    ? value.score as Record<string, unknown>
    : null
  const rawScore = nestedScore?.score ?? nestedScore?.percentage ?? nestedScore?.percent ?? nestedScore?.total ?? nestedScore?.value ?? value.score
  const score = typeof rawScore === 'number' ? rawScore : Number(rawScore)
  const rawCriteria = Array.isArray(value.criteria)
    ? value.criteria
    : Array.isArray(nestedScore?.criteria) ? nestedScore.criteria : Array.isArray(value.breakdown) ? value.breakdown : []
  if (!Number.isFinite(score)) return null
  const criteria = rawCriteria.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const max = Number(row.max ?? row.maximum ?? 0)
    const points = Number(row.score ?? row.points ?? 0)
    if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(points)) return []
    return [{
      key: String(row.key ?? row.id ?? `criterion-${index}`),
      label: String(row.label ?? row.name ?? 'Criterio'),
      candidateValue: String(row.candidateValue ?? row.profileValue ?? row.candidate ?? 'Sin datos'),
      oobValue: String(row.oobValue ?? row.requirement ?? row.offer ?? 'No especificada'),
      score: Math.max(0, Math.min(points, max)),
      max,
    }]
  })
  return { score: Math.max(0, Math.min(100, Math.round(score))), criteria }
}
const compatibilityLabel = computed(() => compatibility.value === null ? (isCandidate.value ? 'Calculando compatibilidad' : 'Inicia sesión para calcularla') : compatibility.value.score >= 80 ? 'Alta compatibilidad' : compatibility.value.score >= 60 ? 'Buena compatibilidad' : compatibility.value.score >= 40 ? 'Compatibilidad parcial' : 'Compatibilidad baja')
const compatibilityDescription = computed(() => compatibility.value === null ? (isCandidate.value ? (stateError.value ? 'No pudimos calcularla en este momento.' : 'Comparando los datos de tu perfil con esta oferta.') : 'Inicia sesión como candidato para calcularla con tu perfil.') : compatibility.value.score >= 60 ? 'Tu perfil coincide con varios de los requisitos de esta oportunidad.' : 'Revisa las coincidencias con los requisitos de este puesto.')
function close() { emit('close', false) }
useEscapeKey(() => { if (props.oobId) close() })

watch(() => props.oobId, async (id) => {
  const sequence = ++oobLoadSequence
  actionSequence += 1
  busy.value = false
  oob.value = null; application.value = null; saved.value = false; compatibility.value = null; error.value = ''; stateError.value = ''
  canApply.value = null
  if (!id) {
    loading.value = false
    if (dialogSessionOpen) document.body.style.overflow = previousOverflow
    dialogSessionOpen = false
    await nextTick()
    previousFocus?.focus()
    previousFocus = null
    return
  }
  if (!dialogSessionOpen) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflow = document.body.style.overflow
    dialogSessionOpen = true
  }
  document.body.style.overflow = 'hidden'
  loading.value = true
  if (!auth.user) await auth.hydrateSession().catch(() => undefined)
  if (sequence !== oobLoadSequence) return
  try {
    oob.value = (await oobsApi.get(id)).oob
  } catch (cause) {
    if (sequence !== oobLoadSequence) return
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar esta oferta.'
  }
  if (sequence === oobLoadSequence && oob.value && auth.user?.role === 'CANDIDATE') {
    try {
      const state = await oobsApi.candidateJobState(id)
      if (sequence !== oobLoadSequence) return
      application.value = state.application
      saved.value = state.saved
      compatibility.value = normalizeCompatibility(state.compatibility)
      canApply.value = state.canApply
    } catch (cause) {
      if (sequence !== oobLoadSequence) return
      stateError.value = cause instanceof Error ? cause.message : 'No se pudo comprobar el estado de tu postulación.'
    }
  }
  if (sequence !== oobLoadSequence) return
  loading.value = false
  await nextTick()
  closeButton.value?.focus()
}, { immediate: true })

function trapFocus(event: KeyboardEvent) {
  if (!props.oobId || event.key !== 'Tab' || !dialog.value) return
  const items = dialog.value.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault() }
  else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault() }
}

function closeForInternalLink(event: MouseEvent) {
  const target = event.target
  if (target instanceof Element && target.closest('a[href^="/"]')) emit('close', true)
}

onMounted(() => document.addEventListener('keydown', trapFocus))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', trapFocus)
  if (dialogSessionOpen) document.body.style.overflow = previousOverflow
})

async function apply() {
  if (busy.value || !oob.value) return
  const targetJobId = oob.value.id
  const sequence = actionSequence
  busy.value = true
  try {
    const result = await oobsApi.apply(targetJobId)
    if (sequence !== actionSequence || props.oobId !== targetJobId) return
    application.value = result.application
    emit('applied', targetJobId)
    notify('Postulación enviada', 'Tu candidatura ya está en manos de la empresa.')
  } catch (cause) {
    if (sequence !== actionSequence || props.oobId !== targetJobId) return
    notify('No se pudo enviar la postulación', cause instanceof Error ? cause.message : 'Inténtalo de nuevo.', 'error')
  } finally { if (sequence === actionSequence) busy.value = false }
}

async function withdrawApplication() {
  if (busy.value || !application.value || !canWithdrawApplication.value) return
  if (!window.confirm('¿Quieres retirar tu postulación a esta oferta?')) return
  const targetJobId = oob.value?.id
  const targetApplicationId = application.value.id
  const sequence = actionSequence
  busy.value = true
  try {
    const result = await oobsApi.withdraw(targetApplicationId)
    if (sequence !== actionSequence || props.oobId !== targetJobId) return
    application.value = { ...application.value!, status: result.application.status }
    notify('Postulación retirada', 'Se quitó tu candidatura de esta oferta.')
  } catch (cause) {
    if (sequence !== actionSequence || props.oobId !== targetJobId) return
    notify('No se pudo retirar la postulación', cause instanceof Error ? cause.message : 'Inténtalo de nuevo.', 'error')
  } finally { if (sequence === actionSequence) busy.value = false }
}

async function toggleSaved() {
  if (busy.value || !oob.value) return
  const targetJobId = oob.value.id
  const sequence = actionSequence
  busy.value = true
  try {
    if (saved.value) { await oobsApi.unsave(targetJobId); if (sequence !== actionSequence || props.oobId !== targetJobId) return; saved.value = false; notify('Oferta quitada', 'Se eliminó de tus ofertas guardadas.') }
    else { await oobsApi.save(targetJobId); if (sequence !== actionSequence || props.oobId !== targetJobId) return; saved.value = true; notify('Oferta guardada', 'Puedes encontrarla en tu lista de guardadas.') }
  } catch (cause) {
    if (sequence !== actionSequence || props.oobId !== targetJobId) return
    notify('No se pudo actualizar la oferta guardada', cause instanceof Error ? cause.message : 'Inténtalo de nuevo.', 'error')
  } finally { if (sequence === actionSequence) busy.value = false }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="public-oob-dialog">
      <div v-if="oobId" class="public-oob-overlay" @click.self="close">
        <section ref="dialog" class="public-oob-dialog" role="dialog" aria-modal="true" :aria-label="oob ? `Oferta ${oob.title}` : 'Detalle de oferta'" @click="closeForInternalLink">
          <header class="public-oob-dialog__top"><span>DETALLE DE OPORTUNIDAD</span><button ref="closeButton" type="button" aria-label="Cerrar detalle" @click="close"><X :size="22" :stroke-width="2.8" /></button></header>
          <AppMessage v-if="loading" variant="loading" message="Cargando oferta…" />
          <AppMessage v-else-if="error" variant="error" title="No se pudo cargar la oferta" :message="error" />
          <template v-else-if="oob">
            <header class="public-oob-hero" :style="oobAreaStyle(oob.professionalArea.name, oob.id)">
              <div class="public-oob-hero__mark vacancy-mark" :style="oobAreaStyle(oob.professionalArea.name, oob.id)" aria-hidden="true">{{ vacancyInitials(oob.title) }}</div>
              <div class="public-oob-hero__copy"><p>{{ oob.professionalArea.name }}<template v-if="oob.specialization"> · {{ oob.specialization.name }}</template></p><h1>{{ oob.title }}</h1><span><RouterLink :to="`/companies/${oob.company.id}`" @click="closeForInternalLink">{{ oob.company.name }}</RouterLink> · {{ [oob.municipality?.name, oob.department?.name].filter(Boolean).join(', ') || 'Ubicación no especificada' }}</span></div>
              <span v-if="oob.isUrgent" class="public-oob-hero__urgent">Urgente</span>
            </header>
            <div class="public-oob-content">
              <main class="public-oob-content__main">
                <section class="public-oob-copy"><h2>Sobre el puesto</h2><p>{{ oob.description }}</p></section>
                <section class="public-oob-copy public-oob-copy--requirements"><h2>Lo que buscamos</h2><p>{{ oob.requirements }}</p></section>
              </main>
              <aside class="public-oob-content__aside" aria-label="Detalles y postulación">
                <section class="public-oob-facts"><h2>Condiciones de la oferta</h2><dl>
                  <div><dt><Banknote :size="16" />Salario</dt><dd>{{ formatJobSalary(oob) }}</dd></div>
                  <div><dt><MapPin :size="16" />Modalidad</dt><dd>{{ oobLabels.workMode[oob.workMode] ?? oob.workMode }}<template v-if="oob.remoteScope"> · {{ oob.remoteScope === 'INTERNATIONAL' ? 'Internacional' : 'Solo Nicaragua' }}</template></dd></div>
                  <div><dt><BriefcaseBusiness :size="16" />Contrato</dt><dd>{{ oobLabels.contract[oob.contractType] ?? oob.contractType }}</dd></div>
                  <div><dt><Clock3 :size="16" />Jornada</dt><dd>{{ oobLabels.workday[oob.workday] ?? oob.workday }} · {{ oobLabels.schedule[oob.scheduleType] ?? oob.scheduleType }}<template v-if="oob.scheduleDescription"> · {{ oob.scheduleDescription }}</template></dd></div>
                  <div v-if="oob.experienceYearsMin !== null"><dt><UsersRound :size="16" />Experiencia</dt><dd>{{ oob.experienceYearsMin }} {{ oob.experienceYearsMin === 1 ? 'año' : 'años' }} mínimo</dd></div>
                  <div><dt><UsersRound :size="16" />Ofertas</dt><dd>{{ oob.vacancies }}</dd></div>
                  <div v-if="oob.expiresAt"><dt><CalendarDays :size="16" />Cierre</dt><dd>{{ new Date(oob.expiresAt).toLocaleDateString('es-NI') }}</dd></div>
                </dl><p v-if="oob.publishedAt">Publicada el {{ new Date(oob.publishedAt).toLocaleDateString('es-NI') }}</p></section>
                                                <section class="public-oob-apply" :style="{ '--compatibility-accent': compatibilityTone.accent, '--compatibility-track': compatibilityTone.track }" aria-label="Compatibilidad y acciones de oferta">
                  <span class="public-oob-apply__eyebrow">COMPATIBILIDAD CON TU PERFIL</span>
                  <div class="public-oob-apply__compatibility">
                    <div class="public-oob-apply__meter" :style="{ '--compatibility': `${compatibility?.score ?? 0}%` }" role="img" :aria-label="compatibility ? `Compatibilidad ${compatibility.score} por ciento` : 'Compatibilidad pendiente de iniciar sesión'"><span><strong>{{ compatibility ? `${compatibility.score}%` : '→' }}</strong><small>compatibilidad</small></span></div>
                    <div class="public-oob-apply__compatibility-copy"><h2>{{ compatibilityLabel }}</h2><p>{{ compatibilityDescription }}</p></div>
                  </div>
                  <div v-if="compatibility" class="public-oob-apply__criteria">
                    <article v-for="criterion in compatibility.criteria" :key="criterion.key" class="public-oob-apply__criterion">
                      <Grid2X2 v-if="criterion.key === 'area'" :size="19" />
                      <Code2 v-else-if="criterion.key === 'specialization'" :size="19" />
                      <MapPin v-else-if="criterion.key === 'location'" :size="19" />
                      <Clock3 v-else :size="19" />
                      <div class="public-oob-apply__criterion-content"><strong>{{ criterion.label }}</strong><span>{{ criterion.candidateValue }} <template v-if="criterion.oobValue !== 'No requerida' && criterion.oobValue !== 'Sin restricción de ubicación' && criterion.oobValue !== 'No especificada'">· Oferta: {{ criterion.oobValue }}</template></span></div>
                    </article>
                  </div>
                  <p v-else class="public-oob-apply__login-hint">Inicia sesión con una cuenta de candidato para ver el desglose de compatibilidad.</p>
                  <AppMessage v-if="stateError" variant="info" title="Compatibilidad no disponible" :message="stateError" />
                  <div class="public-oob-apply__actions">
                    <button v-if="isCandidate && application && canWithdrawApplication" class="public-oob-apply__primary" type="button" :disabled="busy" @click="withdrawApplication">{{ busy ? 'Retirando…' : 'Retirar postulación' }}<ArrowRight :size="16" /></button>
                    <button v-else-if="isCandidate && application" class="public-oob-apply__primary" type="button" disabled>Postulación {{ application.status === 'WITHDRAWN' ? 'retirada' : 'finalizada' }}</button>
                    <RouterLink v-else-if="isCandidate && canApply === false" class="public-oob-apply__primary" to="/candidate/profile" @click="closeForInternalLink">Completa tu perfil para postularte <ArrowRight :size="16" /></RouterLink>
                    <button v-else-if="isCandidate" class="public-oob-apply__primary" type="button" :disabled="busy || canApply === null" @click="apply"><Send :size="16" />{{ busy ? 'Enviando…' : canApply === null ? 'Comprobando perfil…' : 'Postularme a esta oferta' }}<ArrowRight :size="16" /></button>
                    <RouterLink v-else class="public-oob-apply__primary" :to="{ path: '/auth', query: { redirect: loginRedirect } }"><Send :size="16" />Inicia sesión para postularte<ArrowRight :size="16" /></RouterLink>
                    <button v-if="isCandidate" class="public-oob-apply__save" type="button" :disabled="busy" :aria-pressed="saved" @click="toggleSaved"><Bookmark :size="16" />{{ saved ? 'Oferta guardada' : 'Guardar oferta' }}</button>
                    <RouterLink v-else class="public-oob-apply__save" :to="{ path: '/auth', query: { redirect: loginRedirect } }"><Bookmark :size="16" />Inicia sesión para guardar</RouterLink>
                  </div>
                  <p class="public-oob-apply__footnote">Si tu perfil está incompleto, podrás actualizarlo antes de postularte.</p>
                </section>
                <button v-if="auth.user" class="public-oob-apply__report" type="button" @click="showReportDialog = true">Reportar esta oferta</button>
                <RouterLink v-else class="public-oob-apply__report" :to="{ path: '/auth', query: { redirect: loginRedirect } }">Inicia sesión para reportar esta oferta</RouterLink>
              </aside>
            </div>
          </template>
        </section>
      </div>
    </Transition>
  </Teleport>
  <ReportDialog v-if="showReportDialog && oob" target-type="JOB" :target-id="oob.id" @close="showReportDialog = false" @submitted="showReportDialog = false; notify('Reporte enviado', 'El equipo de Jinowork revisará la oferta.')" />
</template>

<style scoped>
.public-oob-overlay{position:fixed;z-index:1200;inset:0;display:grid;place-items:center;padding:clamp(.55rem,3vw,2rem);background:rgb(9 22 39 / 62%);backdrop-filter:blur(5px)}
.public-oob-dialog{display:flex;width:min(100%,1320px);max-height:min(94vh,1000px);flex-direction:column;overflow:auto;border:1px solid #d8e3f0;background:var(--surface);box-shadow:0 28px 90px rgb(4 15 30 / 35%)}
.public-oob-dialog__top{position:sticky;z-index:2;top:0;display:flex;align-items:center;justify-content:space-between;min-height:3.2rem;padding:.55rem 1.2rem;border-bottom:1px solid var(--border);background:var(--surface)}
.public-oob-dialog__top>span{color:var(--muted-foreground);font-size:.62rem;font-weight:850;letter-spacing:.14em}
.public-oob-dialog__top button{display:grid;width:2.25rem;height:2.25rem;flex:none;place-items:center;margin-left:auto;border:1px solid #e3cfc1;background:#fffdfb;color:#2f5f52;cursor:pointer}
.public-oob-dialog__top button:hover{border-color:#8fb0a8;background:#e9f0ec;color:#1b3a33}
.public-oob-dialog__state{display:grid;min-height:16rem;place-items:center;padding:2rem;color:var(--muted-foreground);text-align:center}
.public-oob-dialog__state--error{color:#9a2c36}
.public-oob-hero{display:flex;align-items:center;gap:1rem;padding:1.4rem clamp(1rem,3vw,2rem);border-bottom:1px solid #3e7f69;background:linear-gradient(110deg,#1b3a33,#2f5f52 70%,#3e7f69);color:#fffdfb}
.public-oob-hero__mark{display:grid;width:3.5rem;height:3.5rem;flex:none;place-items:center;border:0;background:linear-gradient(145deg,color-mix(in srgb,var(--oob-accent) 80%,white),var(--oob-accent));color:#fff;font:850 1rem Manrope,sans-serif}
.public-oob-hero__copy{min-width:0;flex:1}
.public-oob-hero__copy>p{margin:0 0 .3rem;color:#f4d9d0;font-size:.67rem;font-weight:850;letter-spacing:.04em}
.public-oob-hero h1{margin:0;color:#fffdfb;font:850 clamp(1.35rem,3vw,2rem)/1.2 Manrope,sans-serif;letter-spacing:-.04em}
.public-oob-hero__copy>span{display:block;margin-top:.45rem;color:#e9f0ec;font-size:.78rem}
.public-oob-hero__copy>span a{color:#f4d9d0;font-weight:800}
.public-oob-hero__urgent{display:inline-flex;flex:none;align-items:center;gap:.4rem;padding:0;background:transparent;color:#ffd18a;font-size:.7rem;font-weight:850;letter-spacing:.02em}
.public-oob-hero__urgent::before{width:.48rem;height:.48rem;border-radius:50%!important;background:#ffb547;box-shadow:0 0 0 .2rem rgb(255 181 71 / 17%),0 0 10px rgb(255 181 71 / 55%);content:""}
.public-oob-content{display:grid;grid-template-columns:minmax(0,1fr);align-items:start;gap:1.1rem;padding:1.2rem clamp(1rem,3vw,2rem) 1.5rem}
.public-oob-content__main,.public-oob-content__aside{display:grid;min-width:0;gap:1rem}
.public-oob-content__aside{grid-template-columns:minmax(0,1.1fr) minmax(18rem,.9fr);align-items:start}
.public-oob-copy{padding:.15rem 0 1rem;border-bottom:1px solid var(--border)}
.public-oob-copy h2,.public-oob-facts h2,.public-oob-apply h2{margin:0 0 .55rem;color:var(--foreground);font:800 .98rem Manrope,sans-serif}
.public-oob-copy p{margin:0;color:var(--muted-foreground);font-size:.84rem;line-height:1.7;white-space:pre-line;overflow-wrap:anywhere}
.public-oob-facts,.public-oob-apply{padding:1rem;border:1px solid var(--border);background:color-mix(in srgb,var(--panel) 45%,var(--surface))}
.public-oob-facts h2{font-size:.86rem}
.public-oob-facts dl{display:grid;margin:0}
.public-oob-facts dl>div{display:grid;gap:.2rem;padding:.58rem 0;border-top:1px solid var(--border)}
.public-oob-facts dt{display:flex;align-items:center;gap:.4rem;color:var(--muted-foreground);font-size:.68rem;font-weight:700}
.public-oob-facts dt svg{color:var(--primary)}
.public-oob-facts dd{margin:0 0 0 1.35rem;color:var(--foreground);font-size:.75rem;font-weight:780;line-height:1.45}
.public-oob-facts>p{margin:.6rem 0 0;padding-top:.55rem;border-top:1px solid var(--border);color:var(--muted-foreground);font-size:.67rem}
.public-oob-apply{--compatibility-accent:#3e7f69;--compatibility-track:#e9f0ec;align-self:start;border:1px solid #e3cfc1;background:linear-gradient(145deg,#fffdfb,#f7ede6)}
.public-oob-apply__eyebrow{display:block;margin-bottom:.9rem;color:#5f6f6b;font-size:.64rem;font-weight:850;letter-spacing:.1em}
.public-oob-apply__compatibility{display:flex;align-items:center;gap:1rem;padding:.1rem 0 1rem;border-bottom:1px solid #e3cfc1}
.public-oob-apply__meter{--compatibility:0%;position:relative;display:grid;width:6.25rem;height:6.25rem;flex:none;place-items:center;border-radius:50%;background:conic-gradient(from -90deg,var(--compatibility-accent) 0 var(--compatibility),var(--compatibility-track) var(--compatibility) 100%);box-shadow:0 4px 14px color-mix(in srgb,var(--compatibility-accent) 16%,transparent)}
.public-oob-apply__meter::before{position:absolute;inset:.5rem;border-radius:50%;background:#fffdfb;content:""}
.public-oob-apply__meter>span{position:relative;display:grid;oustify-items:center;gap:.06rem;color:#16302b;text-align:center}
.public-oob-apply__meter strong{font:850 1.15rem Manrope,sans-serif}.public-oob-apply__meter small{color:#5f6f6b;font-size:.58rem}
.public-oob-apply__compatibility-copy{min-width:0;display:grid;gap:.25rem}
.public-oob-apply__compatibility-copy h2{margin:0;color:#16302b;font:800 .98rem Manrope,sans-serif}
.public-oob-apply__compatibility-copy>p{margin:0;color:#5f6f6b;font-size:.72rem;line-height:1.5}
.public-oob-apply__criteria{display:grid;gap:.05rem;padding:.35rem 0 .55rem;border-bottom:1px solid #e3cfc1}
.public-oob-apply__criterion{display:grid;grid-template-columns:1.25rem minmax(0,1fr);align-items:center;gap:.6rem;padding:.55rem 0;color:#5f6f6b}
.public-oob-apply__criterion>svg{color:#2f5f52}
.public-oob-apply__criterion-content{display:grid;gap:.2rem;min-width:0}
.public-oob-apply__criterion-content strong{color:#16302b;font-size:.7rem}
.public-oob-apply__criterion-content span{overflow:hidden;color:#5f6f6b;font-size:.68rem;text-overflow:ellipsis;white-space:nowrap}
.public-oob-apply__login-hint{margin:.8rem 0;color:#5f6f6b;font-size:.72rem;line-height:1.5}
.public-oob-apply__actions{display:grid;gap:.45rem;padding-top:.8rem}
.public-oob-apply__error{margin:.15rem 0 .6rem;color:#a12626;font-size:.7rem;line-height:1.45}
.public-oob-apply__primary{display:flex;width:100%;min-height:2.8rem;align-items:center;oustify-content:space-between;gap:.55rem;margin-top:0;padding:0 .85rem;border:0;background:var(--primary);color:white;font:800 .77rem Manrope,sans-serif;text-align:center;text-decoration:none;cursor:pointer;transition:background .16s}
.public-oob-apply__primary:hover{background:color-mix(in srgb,var(--primary) 84%,#0b161e)}
.public-oob-apply__primary:disabled{background:#8fb0a8;cursor:not-allowed}
.public-oob-apply__save{display:flex;width:100%;min-height:2.5rem;align-items:center;oustify-content:flex-start;gap:.55rem;margin-top:0;padding:0 .85rem;border:1px solid #e3cfc1;background:#fff;color:#2f5f52;font:750 .75rem Manrope,sans-serif;text-decoration:none;cursor:pointer}
.public-oob-apply__save:hover{border-color:var(--primary);color:var(--primary)}
.public-oob-apply__save:disabled{opacity:.6}
.public-oob-apply__message{margin:.45rem 0;color:#245d42;font-size:.72rem;line-height:1.5}
.public-oob-apply__message--error{color:#a12626}
.public-oob-apply__footnote{margin:.75rem 0 0;color:#5f6f6b;font-size:.65rem;line-height:1.45}
.public-oob-apply__report{justify-self:start;padding:.2rem 0;border:0;background:transparent;color:#5f6f6b;font:inherit;font-size:.68rem;text-decoration:underline;cursor:pointer}.public-oob-apply__report:hover{color:var(--primary)}
.public-oob-apply__profile-warning,.public-oob-apply__role-note{display:grid;gap:.35rem;margin:.65rem 0;padding:.7rem;border-left:3px solid #d29a32;background:#fff8e9;color:#714d14}
.public-oob-apply__profile-warning strong,.public-oob-apply__role-note strong{font-size:.73rem}
.public-oob-apply__profile-warning span,.public-oob-apply__role-note span{font-size:.68rem;line-height:1.45}
.public-oob-apply__profile-warning a,.public-oob-apply__role-note a{display:inline-flex;align-items:center;gap:.25rem;margin-top:.1rem;color:#2f5f52;font-size:.7rem;font-weight:800}
.public-oob-apply__role-note{border-left-color:#3e7f69;background:#e9f0ec;color:#1b3a33}
.public-oob-dialog-enter-active,.public-oob-dialog-leave-active{transition:opacity .18s ease}
.public-oob-dialog-enter-active .public-oob-dialog,.public-oob-dialog-leave-active .public-oob-dialog{transition:transform .18s ease}
.public-oob-dialog-enter-from,.public-oob-dialog-leave-to{opacity:0}
.public-oob-dialog-enter-from .public-oob-dialog,.public-oob-dialog-leave-to .public-oob-dialog{transform:translateY(12px) scale(.99)}
@media(max-width:700px){.public-oob-content{grid-template-columns:1fr}.public-oob-content__aside{grid-template-columns:1fr;grid-row:auto}.public-oob-dialog{max-height:95vh}.public-oob-hero{align-items:flex-start}.public-oob-hero__mark{width:2.8rem;height:2.8rem}.public-oob-hero__urgent{align-self:flex-start}}
@media(prefers-reduced-motion:reduce){.public-oob-dialog-enter-active,.public-oob-dialog-leave-active,.public-oob-dialog-enter-active .public-oob-dialog,.public-oob-dialog-leave-active .public-oob-dialog{transition:none}}
.public-oob-hero{border-bottom-color:#3e7f69;background:linear-gradient(110deg,#1b3a33,#2f5f52 68%,#3e7f69)}
.public-oob-facts dt svg{color:color-mix(in srgb,var(--oob-accent) 82%,#0b161e)}
.public-oob-apply{border:1px solid #e3cfc1;background:linear-gradient(145deg,#fffdfb,#f7ede6)}
.public-oob-apply__primary{background:linear-gradient(100deg,var(--primary),color-mix(in srgb,var(--primary) 78%,#0b161e))}
.public-oob-apply__primary:hover{background:linear-gradient(100deg,color-mix(in srgb,var(--primary) 84%,#0b161e),color-mix(in srgb,var(--primary) 68%,#0b161e))}
.public-oob-dialog{--primary:#2f5f52;--foreground:#16302b;--muted-foreground:#5f6f6b;--border:#e3cfc1;color:var(--foreground);border-color:var(--border)}
.public-oob-dialog__top{border-color:var(--border);background:#fffdfb;color:var(--muted-foreground)}
.public-oob-dialog__top button{border-color:var(--border);background:#f7ede6;color:#2f5f52}
.public-oob-dialog__top button:hover{border-color:#8fb0a8;background:#e9f0ec;color:#1b3a33}
.public-oob-hero{border-bottom:1px solid rgb(255 255 255 / 12%);background-color:#1b3a33;background-image:linear-gradient(110deg,rgb(27 58 51 / 93%),rgb(47 95 82 / 91%)),url('/assets/jinowork-svgs-mejorados/left/03-ondas-oscuras.svg'),url('/assets/jinowork-svgs-mejorados/left/01-contornos-oscuros.svg');background-position:center,center bottom,center;background-size:cover,cover,cover;color:#fcf8f5}
.public-oob-hero__copy>p{color:#f4d9d0}
.public-oob-hero h1{color:#fffdfb}
.public-oob-hero__copy>span{color:rgb(252 248 245 / 82%)}
.public-oob-hero__copy>span a{color:#f4d9d0}
.public-oob-facts,.public-oob-apply{border-color:var(--border);background:linear-gradient(145deg,#fffdfb,#f7ede6)}
.public-oob-facts dt svg,.public-oob-apply__criterion>svg{color:#2f5f52}
.public-oob-apply{--compatibility-accent:#2f5f52;--compatibility-track:#e9f0ec}
.public-oob-apply__eyebrow,.public-oob-apply__footnote{color:#5f6f6b}
.public-oob-apply__meter>span,.public-oob-apply__compatibility-copy h2,.public-oob-apply__criterion-content strong{color:#16302b}
.public-oob-apply__meter small,.public-oob-apply__compatibility-copy>p,.public-oob-apply__criterion,.public-oob-apply__criterion-content span,.public-oob-apply__login-hint,.public-oob-apply__report{color:#5f6f6b}
.public-oob-apply__primary,.public-oob-apply__primary:hover{background:linear-gradient(100deg,#2f5f52,#3e7f69);color:#fff}
.public-oob-apply__primary:disabled{background:#8fb0a8}
.public-oob-apply__save{border-color:var(--border);background:#fffdfb;color:#2f5f52}
.public-oob-apply__profile-warning a,.public-oob-apply__role-note a{color:#2f5f52}
.public-oob-apply__role-note{border-left-color:#3e7f69;background:#e9f0ec;color:#1b3a33}
/* Integrate offer facts and compatibility into the dialog instead of boxed panels. */
.public-oob-dialog{border:0;background:#fffdfb;box-shadow:0 28px 90px rgb(4 15 30 / 35%)}
.public-oob-facts,.public-oob-apply{border:0;background:transparent;box-shadow:none}
.public-oob-copy,.public-oob-facts dl>div,.public-oob-facts>p,.public-oob-apply__compatibility,.public-oob-apply__criteria{border-color:rgb(27 58 51 / 12%)}
</style>
