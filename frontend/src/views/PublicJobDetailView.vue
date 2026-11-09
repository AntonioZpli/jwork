<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import { useToast } from '@/composables/useToast'
import CompanyPublicSummary from '@/components/workspace/CompanyPublicSummary.vue'
import ReportDialog from '@/components/ReportDialog.vue'
import { ArrowLeft, Banknote, Bookmark, BriefcaseBusiness, CalendarDays, Clock3, MapPin, UsersRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { formatJobSalary, oobsApi, oobLabels, type PublicJob } from '@/services/oobs'
import { oobAreaStyle } from '@/utils/oobAreaStyle'
import { vacancyInitials } from '@/utils/vacancyInitials'

const route = useRoute()
const auth = useAuthStore()
const { notify } = useToast()
const isCandidateWorkspace = computed(() => auth.user?.role === 'CANDIDATE')
const layoutProps = computed(() => isCandidateWorkspace.value ? {
  eyebrow: 'Oportunidad',
  title: 'Detalle de oferta',
  subtitle: 'Revisa la oportunidad y sus condiciones antes de postularte.',
  initials: auth.user?.email?.slice(0, 2).toUpperCase() ?? 'JW',
} : {})
const oob = ref<PublicJob | null>(null)
const loading = ref(true)
const error = ref('')
const application = ref<{ id: string; status: string } | null>(null)
const saved = ref(false)
const actionBusy = ref(false)
const showReportDialog = ref(false)

onMounted(async () => {
  if (!auth.user) await auth.hydrateSession()
  try { oob.value = (await oobsApi.get(String(route.params.id))).oob }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo cargar esta oferta.' }
  finally { loading.value = false }
  if (auth.user?.role === 'CANDIDATE') {
    try { const state = await oobsApi.candidateJobState(String(route.params.id)); application.value = state.application; saved.value = state.saved }
    catch { /* Job details remain available if candidate actions cannot be queried. */ }
  }
})

async function apply() {
  if (actionBusy.value || !oob.value) return
  actionBusy.value = true
  try { const result = await oobsApi.apply(oob.value.id); application.value = result.application; notify('Postulación enviada', 'Tu candidatura ya está en manos de la empresa.') }
  catch (e) { notify('No se pudo enviar la postulación', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error') }
  finally { actionBusy.value = false }
}

async function toggleSaved() {
  if (actionBusy.value || !oob.value) return
  actionBusy.value = true
  try {
    if (saved.value) { await oobsApi.unsave(oob.value.id); saved.value = false; notify('Oferta quitada', 'Se eliminó de tus ofertas guardadas.') }
    else { await oobsApi.save(oob.value.id); saved.value = true; notify('Oferta guardada', 'Puedes encontrarla en tu lista de guardadas.') }
  } catch (e) { notify('No se pudo actualizar la oferta guardada', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error') }
  finally { actionBusy.value = false }
}
</script>

<template>
  <component :is="isCandidateWorkspace ? WorkspaceFrame : 'div'" :class="!isCandidateWorkspace ? 'oob-detail-page' : undefined" v-bind="layoutProps"><SiteHeader v-if="!isCandidateWorkspace" /><component :is="isCandidateWorkspace ? 'div' : 'main'" class="oob-detail-page__main" :class="{ 'oob-detail-page__main--workspace': isCandidateWorkspace }"><RouterLink class="oob-detail-page__back" to="/jobs"><ArrowLeft :size="16" />Volver a las ofertas</RouterLink>
    <AppMessage v-if="loading" variant="loading" message="Cargando oferta…" /><AppMessage v-else-if="error" variant="error" title="No se pudo cargar la oferta" :message="error"><template #actions><RouterLink to="/jobs">Ver otras ofertas</RouterLink></template></AppMessage>
    <article v-else-if="oob" class="oob-detail">
      <header class="oob-detail__hero">
        <div class="oob-detail__identity"><span class="oob-detail__company-mark vacancy-mark" :style="oobAreaStyle(oob.professionalArea.name, oob.id)" aria-hidden="true">{{ vacancyInitials(oob.title) }}</span><div><p class="oob-detail__eyebrow">{{ oob.professionalArea.name }}<template v-if="oob.specialization"> · {{ oob.specialization.name }}</template></p><h1>{{ oob.title }}</h1><p class="oob-detail__company">{{ oob.company.name }} <span>·</span> {{ [oob.municipality?.name, oob.department?.name].filter(Boolean).join(', ') || 'Ubicación no especificada' }}</p></div></div>
        <span v-if="oob.isUrgent" class="oob-detail__urgent">Urgente</span>
      </header>
      <div class="oob-detail__layout">
        <div class="oob-detail__main-column">
          <section class="oob-detail__section"><h2>Sobre el puesto</h2><p>{{ oob.description }}</p></section>
          <section class="oob-detail__section oob-detail__requirements"><h2>Lo que buscamos</h2><p>{{ oob.requirements }}</p></section>
          <CompanyPublicSummary :company="oob.company" />
        </div>
        <aside class="oob-detail__aside" aria-label="Resumen de la oferta">
          <section class="oob-detail__summary"><h2>Detalles de la oferta</h2>
            <dl class="oob-detail__facts">
              <div><dt><Banknote :size="16" />Salario</dt><dd>{{ formatJobSalary(oob) }}</dd></div>
              <div><dt><MapPin :size="16" />Modalidad</dt><dd>{{ oobLabels.workMode[oob.workMode] ?? oob.workMode }}<template v-if="oob.remoteScope"> · {{ oob.remoteScope === 'INTERNATIONAL' ? 'Internacional' : 'Solo Nicaragua' }}</template></dd></div>
              <div><dt><BriefcaseBusiness :size="16" />Contrato</dt><dd>{{ oobLabels.contract[oob.contractType] ?? oob.contractType }}</dd></div>
              <div><dt><Clock3 :size="16" />Jornada y horario</dt><dd>{{ oobLabels.workday[oob.workday] ?? oob.workday }} · {{ oobLabels.schedule[oob.scheduleType] ?? oob.scheduleType }}<template v-if="oob.scheduleDescription"> · {{ oob.scheduleDescription }}</template></dd></div>
              <div v-if="oob.experienceYearsMin !== null"><dt><UsersRound :size="16" />Experiencia</dt><dd>{{ oob.experienceYearsMin }} {{ oob.experienceYearsMin === 1 ? 'año' : 'años' }} mínimo</dd></div>
              <div><dt><UsersRound :size="16" />Ofertas</dt><dd>{{ oob.vacancies }}</dd></div>
              <div v-if="oob.expiresAt"><dt><CalendarDays :size="16" />Cierre de convocatoria</dt><dd>{{ new Date(oob.expiresAt).toLocaleDateString('es-NI') }}</dd></div>
            </dl>
            <p v-if="oob.publishedAt" class="oob-detail__published">Publicada el {{ new Date(oob.publishedAt).toLocaleDateString('es-NI') }}</p>
          </section>
          <section v-if="auth.user?.role === 'CANDIDATE' || !auth.user" class="oob-detail__apply-card">
            <span class="oob-detail__apply-kicker">SIGUIENTE PASO</span>
            <h2>{{ application ? 'Tu candidatura está en marcha' : '¿Te interesa esta oportunidad?' }}</h2>
            <p class="oob-detail__apply-copy">{{ application ? 'Consulta el avance de tu proceso de selección cuando quieras.' : 'Postúlate con tu perfil profesional y sigue las actualizaciones desde tu cuenta.' }}</p>
            <div v-if="auth.user?.role === 'CANDIDATE'" class="oob-detail__actions"><button class="workspace__cta" type="button" :disabled="actionBusy || Boolean(application)" @click="apply">{{ actionBusy && !application ? 'Procesando…' : application ? 'Ya te postulaste' : 'Postularme' }}</button><button class="oob-detail__save" type="button" :disabled="actionBusy" :aria-pressed="saved" @click="toggleSaved"><Bookmark :size="16" />{{ saved ? 'Quitar de guardados' : 'Guardar oferta' }}</button><RouterLink v-if="application" class="oob-detail__tracking" to="/candidate/applications">Ver seguimiento de mi postulación <span aria-hidden="true">→</span></RouterLink></div>
            <RouterLink v-else-if="!auth.user" class="workspace__cta oob-detail__login" :to="{ path: '/auth', query: { redirect: route.fullPath } }">Inicia sesión para postularte</RouterLink>
            <div class="oob-detail__apply-note"><span aria-hidden="true">✓</span><p>Tu perfil se comparte con la empresa cuando envías tu postulación.</p></div>
          </section>
        </aside>
      </div>
      <div class="oob-detail__report"><button v-if="auth.user" type="button" @click="showReportDialog = true">Reportar esta oferta</button><RouterLink v-else :to="{ path: '/auth', query: { redirect: route.fullPath } }">Inicia sesión para reportar esta oferta</RouterLink></div>
    </article>
  </component><SiteFooter v-if="!isCandidateWorkspace" />
  <ReportDialog v-if="showReportDialog && oob" target-type="JOB" :target-id="oob.id" @close="showReportDialog = false" @submitted="showReportDialog = false; notify('Reporte enviado', 'El equipo de Jinowork revisará la oferta.')" />
  </component>
</template>

<style scoped>
.oob-detail-page{min-height:100vh;background:var(--background)}
.oob-detail-page__main{width:min(1120px,100%);margin:auto;padding:2.25rem 1.25rem 4rem}
.oob-detail-page__main--workspace{width:100%;margin:0;padding:0}
.oob-detail-page__back{display:inline-flex;align-items:center;gap:.45rem;margin:0 0 1rem;color:var(--muted-foreground);font-size:.82rem;font-weight:700;transition:color .16s}
.oob-detail-page__back:hover{color:var(--primary)}
.oob-detail{overflow:hidden;border:1px solid var(--border);border-radius:1rem;background:var(--surface);box-shadow:0 14px 36px color-mix(in srgb,var(--palette-ink) 6%,transparent)}
.oob-detail__hero{display:flex;align-items:flex-start;oustify-content:space-between;gap:1rem;padding:clamp(1.25rem,3vw,2rem);border-bottom:1px solid var(--border);background:linear-gradient(115deg,color-mix(in srgb,var(--secondary) 75%,var(--surface)),var(--surface) 70%)}
.oob-detail__identity{display:flex;min-width:0;align-items:center;gap:1rem}
.oob-detail__company-mark{display:grid;width:3.4rem;height:3.4rem;flex:none;place-items:center;border:1px solid color-mix(in srgb,var(--primary) 15%,var(--border));border-radius:.9rem;background:var(--surface);color:var(--primary)}
.oob-detail__identity>div{min-width:0}
.oob-detail__eyebrow{margin:0 0 .4rem;color:var(--primary);font-size:.72rem;font-weight:800;letter-spacing:.025em}
.oob-detail__hero h1{margin:0;color:var(--foreground);font:800 clamp(1.65rem,3.5vw,2.35rem)/1.15 Manrope,sans-serif;letter-spacing:-.045em}
.oob-detail__company{display:flex;flex-wrap:wrap;gap:.35rem;margin:.5rem 0 0;color:var(--muted-foreground);font-size:.88rem}
.oob-detail__urgent{flex:none;padding:.35rem .65rem;border:1px solid #f0d9ab;border-radius:999px;background:#fff7e8;color:#8a5d12;font-size:.72rem;font-weight:800}
.oob-detail__layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(17rem,21rem);align-items:start;gap:clamp(1.25rem,3vw,2.25rem);padding:clamp(1.25rem,3vw,2rem)}
.oob-detail__main-column{min-width:0}
.oob-detail__section{margin:0 0 1.65rem}
.oob-detail__section h2,.oob-detail__summary h2{margin:0 0 .7rem;color:var(--foreground);font:800 1.05rem Manrope,sans-serif;letter-spacing:-.025em}
.oob-detail__section p{margin:0;color:var(--muted-foreground);font-size:.9rem;line-height:1.75;white-space:pre-line;overflow-wrap:anywhere}
.oob-detail__requirements{padding-top:1.35rem;border-top:1px solid var(--border)}
.oob-detail__aside{display:grid;align-content:start;gap:.8rem;min-width:0}
.oob-detail__summary,.oob-detail__apply-card{padding:1.1rem;border:1px solid var(--border);border-radius:.85rem;background:color-mix(in srgb,var(--panel) 44%,var(--surface))}
.oob-detail__summary h2{font-size:.95rem}
.oob-detail__facts{display:grid;gap:0;margin:0}
.oob-detail__facts>div{display:grid;gap:.25rem;padding:.7rem 0;border-top:1px solid var(--border)}
.oob-detail__facts>div:first-child{padding-top:.15rem;border-top:0}
.oob-detail__facts dt{display:flex;align-items:center;gap:.45rem;color:var(--muted-foreground);font-size:.73rem;font-weight:650}
.oob-detail__facts dt svg{flex:none;color:var(--primary)}
.oob-detail__facts dd{margin:0 0 0 1.35rem;color:var(--foreground);font-size:.82rem;font-weight:750;line-height:1.5;overflow-wrap:anywhere}
.oob-detail__published{margin:.75rem 0 0;padding-top:.7rem;border-top:1px solid var(--border);color:var(--muted-foreground);font-size:.72rem}
.oob-detail__apply-card{align-self:start;background:linear-gradient(145deg,color-mix(in srgb,var(--secondary) 72%,var(--surface)),var(--surface) 88%)}
.oob-detail__apply-kicker{display:block;margin-bottom:.45rem;color:var(--primary);font-size:.66rem;font-weight:850;letter-spacing:.12em}
.oob-detail__apply-card h2{margin:0;color:var(--foreground);font:800 1.1rem/1.35 Manrope,sans-serif;letter-spacing:-.02em}
.oob-detail__apply-copy{margin:.55rem 0 1rem;color:var(--muted-foreground);font-size:.8rem;line-height:1.6}
.oob-detail__actions{display:grid;gap:.55rem;margin:0}
.oob-detail__actions>.workspace__cta,.oob-detail__login{width:100%;min-height:2.85rem}
.oob-detail__actions button:disabled{opacity:.65;cursor:not-allowed}
.oob-detail__save{display:inline-flex;min-height:2.55rem;align-items:center;oustify-content:center;gap:.45rem;padding:0 .8rem;border:1px solid var(--border);border-radius:.7rem;background:var(--surface);color:var(--foreground);font:inherit;font-size:.8rem;font-weight:750;cursor:pointer;transition:border-color .16s,background .16s,color .16s}
.oob-detail__save:hover{border-color:var(--primary);background:var(--secondary);color:var(--primary)}
.oob-detail__message{margin:0 0 .65rem;color:var(--primary);font-size:.8rem;line-height:1.5}
.oob-detail__apply-note{display:flex;align-items:flex-start;gap:.55rem;margin-top:.9rem;padding-top:.8rem;border-top:1px solid color-mix(in srgb,var(--primary) 18%,var(--border));color:var(--muted-foreground)}
.oob-detail__apply-note>span{display:grid;width:1.15rem;height:1.15rem;flex:none;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--primary) 13%,var(--surface));color:var(--primary);font-size:.7rem;font-weight:900}
.oob-detail__apply-note p{margin:0;font-size:.7rem;line-height:1.45}
.oob-detail__tracking{display:inline-flex;min-height:2.4rem;align-items:center;oustify-content:center;gap:.35rem;color:var(--primary);font-size:.76rem;font-weight:800;text-align:center}
.oob-detail__tracking:hover{text-decoration:underline}
.oob-detail__report{display:flex;justify-content:flex-end;padding:0 clamp(1rem,3vw,2rem) 1.25rem}.oob-detail__report button,.oob-detail__report a{border:0;background:transparent;color:var(--muted-foreground);font:inherit;font-size:.76rem;text-decoration:underline;cursor:pointer}.oob-detail__report button:hover,.oob-detail__report a:hover{color:var(--primary)}
@media(min-width:1100px){.oob-detail__aside{position:sticky;top:6.5rem}}
@media(max-width:760px){.oob-detail__layout{grid-template-columns:minmax(0,1fr)}.oob-detail__aside{grid-row:1}.oob-detail-page__main{padding:1.25rem .9rem 2.5rem}}
@media(max-width:520px){.oob-detail__hero{padding:1rem;flex-direction:column}.oob-detail__identity{align-items:flex-start;gap:.7rem}.oob-detail__company-mark{width:2.7rem;height:2.7rem}.oob-detail__company-mark svg{width:19px}.oob-detail__layout{gap:1.2rem;padding:1rem}.oob-detail__summary,.oob-detail__apply-card{padding:.9rem}}
</style>

<style scoped>
.oob-detail__company-mark{border:0;background:linear-gradient(145deg,color-mix(in srgb,var(--oob-accent) 80%,white),var(--oob-accent));color:white}
</style>
