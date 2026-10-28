<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import CompanyPublicSummary from '@/components/workspace/CompanyPublicSummary.vue'
import { ArrowLeft, Banknote, Bookmark, BriefcaseBusiness, Building2, CalendarDays, Clock3, MapPin, UsersRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { formatJobSalary, jobsApi, jobLabels, type PublicJob } from '@/services/jobs'

const route = useRoute()
const auth = useAuthStore()
const isCandidateWorkspace = computed(() => auth.user?.role === 'CANDIDATE')
const layoutProps = computed(() => isCandidateWorkspace.value ? {
  eyebrow: 'Oportunidad',
  title: 'Detalle de vacante',
  subtitle: 'Revisa la oportunidad y sus condiciones antes de postularte.',
  initials: auth.user?.email?.slice(0, 2).toUpperCase() ?? 'JW',
} : {})
const job = ref<PublicJob | null>(null)
const loading = ref(true)
const error = ref('')
const application = ref<{ id: string; status: string } | null>(null)
const saved = ref(false)
const actionBusy = ref(false)
const actionMessage = ref('')

onMounted(async () => {
  if (!auth.user) await auth.hydrateSession()
  try { job.value = (await jobsApi.get(String(route.params.id))).job }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo cargar esta vacante.' }
  finally { loading.value = false }
  if (auth.user?.role === 'CANDIDATE') {
    try { const state = await jobsApi.candidateJobState(String(route.params.id)); application.value = state.application; saved.value = state.saved }
    catch { /* Job details remain available if candidate actions cannot be queried. */ }
  }
})

async function apply() {
  if (actionBusy.value || !job.value) return
  actionBusy.value = true; actionMessage.value = ''
  try { const result = await jobsApi.apply(job.value.id); application.value = result.application; actionMessage.value = 'Tu postulación fue enviada.' }
  catch (e) { actionMessage.value = e instanceof Error ? e.message : 'No se pudo enviar tu postulación.' }
  finally { actionBusy.value = false }
}

async function toggleSaved() {
  if (actionBusy.value || !job.value) return
  actionBusy.value = true; actionMessage.value = ''
  try {
    if (saved.value) { await jobsApi.unsave(job.value.id); saved.value = false }
    else { await jobsApi.save(job.value.id); saved.value = true }
  } catch (e) { actionMessage.value = e instanceof Error ? e.message : 'No se pudo actualizar la vacante guardada.' }
  finally { actionBusy.value = false }
}
</script>

<template>
  <component :is="isCandidateWorkspace ? WorkspaceFrame : 'div'" :class="!isCandidateWorkspace ? 'job-detail-page' : undefined" v-bind="layoutProps"><SiteHeader v-if="!isCandidateWorkspace" /><component :is="isCandidateWorkspace ? 'div' : 'main'" class="job-detail-page__main" :class="{ 'job-detail-page__main--workspace': isCandidateWorkspace }"><RouterLink class="job-detail-page__back" to="/jobs"><ArrowLeft :size="16" />Volver a las vacantes</RouterLink>
    <p v-if="loading" class="workspace__empty" role="status">Cargando oferta…</p><p v-else-if="error" class="workspace__error" role="alert">{{ error }} <RouterLink to="/jobs">Ver otras ofertas</RouterLink></p>
    <article v-else-if="job" class="job-detail">
      <header class="job-detail__hero">
        <div class="job-detail__identity"><span class="job-detail__company-mark"><Building2 :size="24" /></span><div><p class="job-detail__eyebrow">{{ job.professionalArea.name }}<template v-if="job.specialization"> · {{ job.specialization.name }}</template></p><h1>{{ job.title }}</h1><p class="job-detail__company">{{ job.company.name }} <span>·</span> {{ [job.municipality?.name, job.department?.name].filter(Boolean).join(', ') || 'Ubicación no especificada' }}</p></div></div>
        <span v-if="job.isUrgent" class="job-detail__urgent">Urgente</span>
      </header>
      <div class="job-detail__layout">
        <div class="job-detail__main-column">
          <section class="job-detail__section"><h2>Sobre el puesto</h2><p>{{ job.description }}</p></section>
          <section class="job-detail__section job-detail__requirements"><h2>Lo que buscamos</h2><p>{{ job.requirements }}</p></section>
          <CompanyPublicSummary :company="job.company" />
        </div>
        <aside class="job-detail__aside" aria-label="Resumen de la vacante">
          <section class="job-detail__summary"><h2>Detalles de la oferta</h2>
            <dl class="job-detail__facts">
              <div><dt><Banknote :size="16" />Salario</dt><dd>{{ formatJobSalary(job) }}</dd></div>
              <div><dt><MapPin :size="16" />Modalidad</dt><dd>{{ jobLabels.workMode[job.workMode] ?? job.workMode }}<template v-if="job.remoteScope"> · {{ job.remoteScope === 'INTERNATIONAL' ? 'Internacional' : 'Solo Nicaragua' }}</template></dd></div>
              <div><dt><BriefcaseBusiness :size="16" />Contrato</dt><dd>{{ jobLabels.contract[job.contractType] ?? job.contractType }}</dd></div>
              <div><dt><Clock3 :size="16" />Jornada y horario</dt><dd>{{ jobLabels.workday[job.workday] ?? job.workday }} · {{ jobLabels.schedule[job.scheduleType] ?? job.scheduleType }}<template v-if="job.scheduleDescription"> · {{ job.scheduleDescription }}</template></dd></div>
              <div v-if="job.experienceYearsMin !== null"><dt><UsersRound :size="16" />Experiencia</dt><dd>{{ job.experienceYearsMin }} {{ job.experienceYearsMin === 1 ? 'año' : 'años' }} mínimo</dd></div>
              <div><dt><UsersRound :size="16" />Vacantes</dt><dd>{{ job.vacancies }}</dd></div>
              <div v-if="job.expiresAt"><dt><CalendarDays :size="16" />Cierre de convocatoria</dt><dd>{{ new Date(job.expiresAt).toLocaleDateString('es-NI') }}</dd></div>
            </dl>
            <p v-if="job.publishedAt" class="job-detail__published">Publicada el {{ new Date(job.publishedAt).toLocaleDateString('es-NI') }}</p>
          </section>
          <section v-if="auth.user?.role === 'CANDIDATE' || !auth.user" class="job-detail__apply-card">
            <p v-if="actionMessage" class="job-detail__message" role="status">{{ actionMessage }}</p>
            <div v-if="auth.user?.role === 'CANDIDATE'" class="job-detail__actions"><button class="workspace__cta" type="button" :disabled="actionBusy || Boolean(application)" @click="apply">{{ actionBusy && !application ? 'Procesando…' : application ? 'Ya te postulaste' : 'Postularme' }}</button><button class="job-detail__save" type="button" :disabled="actionBusy" :aria-pressed="saved" @click="toggleSaved"><Bookmark :size="16" />{{ saved ? 'Quitar de guardados' : 'Guardar vacante' }}</button><RouterLink v-if="application" class="job-detail__tracking" to="/candidate/applications">Ver seguimiento de mi postulación <span aria-hidden="true">→</span></RouterLink></div>
            <RouterLink v-else-if="!auth.user" class="workspace__cta job-detail__login" :to="{ path: '/auth', query: { redirect: route.fullPath } }">Inicia sesión para postularte</RouterLink>
          </section>
        </aside>
      </div>
    </article>
  </component><SiteFooter v-if="!isCandidateWorkspace" />
  </component>
</template>

<style scoped>
.job-detail-page{min-height:100vh;background:var(--background)}
.job-detail-page__main{width:min(1120px,100%);margin:auto;padding:2.25rem 1.25rem 4rem}
.job-detail-page__main--workspace{width:100%;margin:0;padding:0}
.job-detail-page__back{display:inline-flex;align-items:center;gap:.45rem;margin:0 0 1rem;color:var(--muted-foreground);font-size:.82rem;font-weight:700;transition:color .16s}
.job-detail-page__back:hover{color:var(--primary)}
.job-detail{overflow:hidden;border:1px solid var(--border);border-radius:1rem;background:var(--surface);box-shadow:0 14px 36px color-mix(in srgb,var(--palette-ink) 6%,transparent)}
.job-detail__hero{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:clamp(1.25rem,3vw,2rem);border-bottom:1px solid var(--border);background:linear-gradient(115deg,color-mix(in srgb,var(--secondary) 75%,var(--surface)),var(--surface) 70%)}
.job-detail__identity{display:flex;min-width:0;align-items:center;gap:1rem}
.job-detail__company-mark{display:grid;width:3.4rem;height:3.4rem;flex:none;place-items:center;border:1px solid color-mix(in srgb,var(--primary) 15%,var(--border));border-radius:.9rem;background:var(--surface);color:var(--primary)}
.job-detail__identity>div{min-width:0}
.job-detail__eyebrow{margin:0 0 .4rem;color:var(--primary);font-size:.72rem;font-weight:800;letter-spacing:.025em}
.job-detail__hero h1{margin:0;color:var(--foreground);font:800 clamp(1.65rem,3.5vw,2.35rem)/1.15 Manrope,sans-serif;letter-spacing:-.045em}
.job-detail__company{display:flex;flex-wrap:wrap;gap:.35rem;margin:.5rem 0 0;color:var(--muted-foreground);font-size:.88rem}
.job-detail__urgent{flex:none;padding:.35rem .65rem;border:1px solid #f0d9ab;border-radius:999px;background:#fff7e8;color:#8a5d12;font-size:.72rem;font-weight:800}
.job-detail__layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(17rem,21rem);align-items:start;gap:clamp(1.25rem,3vw,2.25rem);padding:clamp(1.25rem,3vw,2rem)}
.job-detail__main-column{min-width:0}
.job-detail__section{margin:0 0 1.65rem}
.job-detail__section h2,.job-detail__summary h2{margin:0 0 .7rem;color:var(--foreground);font:800 1.05rem Manrope,sans-serif;letter-spacing:-.025em}
.job-detail__section p{margin:0;color:var(--muted-foreground);font-size:.9rem;line-height:1.75;white-space:pre-line;overflow-wrap:anywhere}
.job-detail__requirements{padding-top:1.35rem;border-top:1px solid var(--border)}
.job-detail__aside{display:grid;gap:.8rem;min-width:0}
.job-detail__summary,.job-detail__apply-card{padding:1.1rem;border:1px solid var(--border);border-radius:.85rem;background:color-mix(in srgb,var(--panel) 44%,var(--surface))}
.job-detail__summary h2{font-size:.95rem}
.job-detail__facts{display:grid;gap:0;margin:0}
.job-detail__facts>div{display:grid;gap:.25rem;padding:.7rem 0;border-top:1px solid var(--border)}
.job-detail__facts>div:first-child{padding-top:.15rem;border-top:0}
.job-detail__facts dt{display:flex;align-items:center;gap:.45rem;color:var(--muted-foreground);font-size:.73rem;font-weight:650}
.job-detail__facts dt svg{flex:none;color:var(--primary)}
.job-detail__facts dd{margin:0 0 0 1.35rem;color:var(--foreground);font-size:.82rem;font-weight:750;line-height:1.5;overflow-wrap:anywhere}
.job-detail__published{margin:.75rem 0 0;padding-top:.7rem;border-top:1px solid var(--border);color:var(--muted-foreground);font-size:.72rem}
.job-detail__actions{display:grid;gap:.55rem;margin:0}
.job-detail__actions>.workspace__cta,.job-detail__login{width:100%;min-height:2.7rem}
.job-detail__actions button:disabled{opacity:.65;cursor:not-allowed}
.job-detail__save{display:inline-flex;min-height:2.55rem;align-items:center;justify-content:center;gap:.45rem;padding:0 .8rem;border:1px solid var(--border);border-radius:.7rem;background:var(--surface);color:var(--foreground);font:inherit;font-size:.8rem;font-weight:750;cursor:pointer;transition:border-color .16s,background .16s,color .16s}
.job-detail__save:hover{border-color:var(--primary);background:var(--secondary);color:var(--primary)}
.job-detail__message{margin:0 0 .65rem;color:var(--primary);font-size:.8rem;line-height:1.5}
.job-detail__tracking{display:inline-flex;min-height:2.4rem;align-items:center;justify-content:center;gap:.35rem;color:var(--primary);font-size:.76rem;font-weight:800;text-align:center}
.job-detail__tracking:hover{text-decoration:underline}
@media(min-width:1100px){.job-detail__aside{position:sticky;top:6.5rem}}
@media(max-width:760px){.job-detail__layout{grid-template-columns:minmax(0,1fr)}.job-detail__aside{grid-row:1}.job-detail-page__main{padding:1.25rem .9rem 2.5rem}}
@media(max-width:520px){.job-detail__hero{padding:1rem;flex-direction:column}.job-detail__identity{align-items:flex-start;gap:.7rem}.job-detail__company-mark{width:2.7rem;height:2.7rem}.job-detail__company-mark svg{width:19px}.job-detail__layout{gap:1.2rem;padding:1rem}.job-detail__summary,.job-detail__apply-card{padding:.9rem}}
</style>
