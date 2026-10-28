<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Inbox } from 'lucide-vue-next'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import CandidateCredentials from '@/components/workspace/CandidateCredentials.vue'
import { companyApplicationsApi, type CompanyApplication } from '@/services/companyApplications'
import { candidateFileUrl } from '@/services/profiles'

const route = useRoute()
const router = useRouter()
const applications = ref<CompanyApplication[]>([])
const page = ref(1)
const pages = ref(0)
const total = ref(0)
const loading = ref(true)
const error = ref('')
const busyId = ref('')
const selected = reactive<Record<string, string>>({})
const expanded = reactive<Record<string, boolean>>({})
const comments = reactive<Record<string, string>>({})
const jobId = computed(() => typeof route.query.jobId === 'string' ? route.query.jobId : '')
const statusLabels: Record<string, string> = { RECEIVED: 'Recibida', IN_REVIEW: 'En revisión', SHORTLISTED: 'Preseleccionada', INTERVIEW: 'Entrevista', SELECTED: 'Seleccionada', REJECTED: 'No seleccionada', WITHDRAWN: 'Retirada' }
const nextOptions: Record<string, string[]> = { RECEIVED: ['IN_REVIEW', 'SHORTLISTED', 'REJECTED'], IN_REVIEW: ['SHORTLISTED', 'INTERVIEW', 'REJECTED'], SHORTLISTED: ['INTERVIEW', 'SELECTED', 'REJECTED'], INTERVIEW: ['SELECTED', 'REJECTED'] }

async function load(nextPage = page.value) {
  loading.value = true; error.value = ''; page.value = nextPage
  try {
    const result = await companyApplicationsApi.list(jobId.value || undefined, nextPage)
    applications.value = result.applications; pages.value = result.pages; total.value = result.total
    for (const application of result.applications) if (!selected[application.id]) selected[application.id] = nextOptions[application.status]?.[0] ?? ''
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudieron cargar las postulaciones.' }
  finally { loading.value = false }
}

async function update(application: CompanyApplication) {
  const status = selected[application.id]
  if (!status || busyId.value) return
  busyId.value = application.id; error.value = ''
  try { await companyApplicationsApi.updateStatus(application.id, status, comments[application.id] ?? ''); expanded[application.id] = false; await load() }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo cambiar el estado.' }
  finally { busyId.value = '' }
}

function setPage(nextPage: number) { void router.push({ query: { ...route.query, page: String(nextPage) } }) }
onMounted(() => load(Number(route.query.page) || 1))
watch(() => route.query, () => { void load(Number(route.query.page) || 1) })
</script>

<template>
  <WorkspaceFrame eyebrow="Selección de talento" :title="jobId ? 'Postulantes de la vacante' : 'Postulaciones recibidas'" subtitle="Consulta los perfiles que se postularon a vacantes de tu empresa." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/company/jobs">Mis vacantes</RouterLink></template>
    <p v-if="jobId" class="company-applications__filter"><RouterLink to="/company/applications">Ver todas las postulaciones</RouterLink></p>
    <p v-if="error" class="workspace__error" role="alert">{{ error }}</p><p v-if="loading" class="workspace__empty" role="status">Cargando postulaciones…</p>
    <section v-else class="workspace__card workspace__section"><p class="workspace__meta">{{ total }} {{ total === 1 ? 'postulación' : 'postulaciones' }}</p><div v-if="!applications.length" class="company-applications__empty"><span class="company-applications__empty-mark" aria-hidden="true"><Inbox :size="19" /></span><strong>{{ jobId ? 'Esta vacante aún no tiene postulaciones' : 'Aún no has recibido postulaciones' }}</strong><p>Cuando un candidato se postule, podrás revisar aquí su perfil y actualizar el estado de su candidatura.</p><RouterLink to="/company/jobs">Revisar mis vacantes</RouterLink></div><div v-else class="workspace__list">
      <article v-for="application in applications" :key="application.id" class="workspace__row company-application"><div class="company-application__profile"><span class="workspace__pill">{{ statusLabels[application.status] ?? application.status }}</span><strong>{{ application.candidateProfile.firstName }} {{ application.candidateProfile.lastName }}</strong><span class="workspace__meta">{{ application.job.title }} · {{ new Date(application.appliedAt).toLocaleDateString('es-NI') }}</span><span class="workspace__meta">{{ [application.candidateProfile.professionalArea?.name, application.candidateProfile.specialization?.name].filter(Boolean).join(' · ') || 'Área profesional no indicada' }} · {{ [application.candidateProfile.municipality?.name, application.candidateProfile.department?.name].filter(Boolean).join(', ') || 'Ubicación no indicada' }}</span><p v-if="application.candidateProfile.description" class="company-application__description">{{ application.candidateProfile.description }}</p><CandidateCredentials :candidate="application.candidateProfile" /><a v-if="application.candidateProfile.cvUrl" class="company-application__cv" :href="candidateFileUrl('cv', application.candidateProfile.cvUrl)" target="_blank" rel="noopener noreferrer">Abrir currículum PDF</a><span v-else class="workspace__meta">El candidato no agregó currículum.</span><button v-if="nextOptions[application.status]?.length" class="company-application__toggle" type="button" :aria-expanded="Boolean(expanded[application.id])" @click="expanded[application.id] = !expanded[application.id]">{{ expanded[application.id] ? 'Cerrar actualización' : 'Actualizar candidatura' }} <span aria-hidden="true">{{ expanded[application.id] ? '−' : '＋' }}</span></button><ol class="company-application__history"><li v-for="(event,index) in application.statusHistory" :key="`${event.createdAt}-${index}`">{{ statusLabels[event.newStatus] ?? event.newStatus }} <time :datetime="event.createdAt">{{ new Date(event.createdAt).toLocaleDateString('es-NI') }}</time><small v-if="event.comment">{{ event.comment }}</small></li></ol></div>
        <form v-if="expanded[application.id] && nextOptions[application.status]?.length" class="company-application__form" @submit.prevent="update(application)"><label>Actualizar estado<select v-model="selected[application.id]"><option v-for="status in nextOptions[application.status]" :key="status" :value="status">{{ statusLabels[status] }}</option></select></label><label>Comentario para el candidato (opcional)<textarea v-model="comments[application.id]" maxlength="1000" rows="2" placeholder="Escribe una actualización breve" /></label><button class="workspace__cta" type="submit" :disabled="busyId === application.id || !selected[application.id]">{{ busyId === application.id ? 'Actualizando…' : 'Guardar estado' }}</button></form>
      </article>
    </div><nav v-if="pages > 1" class="company-applications__pagination" aria-label="Paginación"><button type="button" :disabled="page <= 1" @click="setPage(page - 1)">Anterior</button><span>Página {{ page }} de {{ pages }}</span><button type="button" :disabled="page >= pages" @click="setPage(page + 1)">Siguiente</button></nav></section>
  </WorkspaceFrame>
</template>

<style scoped>
.company-applications__filter a { color: var(--primary); font-weight: 700; }.company-application { align-items: start; flex-direction: column; }.company-application__profile { display: grid; gap: .4rem; width: 100%; }.company-application__profile strong { font: 800 1.05rem Manrope,sans-serif; }.company-application__profile .workspace__pill { justify-self: start; }.company-application__cv { color: var(--primary); font-weight: 700; }.company-application__description { margin: .4rem 0; color: var(--muted-foreground); white-space: pre-line; line-height: 1.5; }.company-application__history { display: flex; flex-wrap: wrap; gap: .45rem; margin: .4rem 0; padding: 0; list-style: none; }.company-application__history li { display: grid; gap: .2rem; padding: .4rem .55rem; background: var(--panel); border-radius: .5rem; font-size: .75rem; }.company-application__history time,.company-application__history small { color: var(--muted-foreground); }.company-application__form { display: grid; grid-template-columns: minmax(10rem,.8fr) minmax(15rem,2fr) auto; align-items: end; gap: .75rem; width: 100%; padding-top: .8rem; border-top: 1px solid var(--border); }.company-application__form label { display: grid; gap: .35rem; color: var(--muted-foreground); font-size: .78rem; font-weight: 700; }.company-application__form select,.company-application__form textarea { min-height: 2.6rem; padding: .55rem; border: 1px solid var(--border); border-radius: .55rem; background: var(--surface); color: var(--foreground); font: inherit; }.company-application__form textarea { resize: vertical; }.company-application__form button:disabled { opacity: .55; }.company-applications__pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; }.company-applications__pagination button { padding: .45rem .75rem; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--primary); font: inherit; font-weight: 700; cursor: pointer; }.company-applications__pagination button:disabled { opacity: .45; cursor: not-allowed; }
@media(max-width:800px){.company-application__form{grid-template-columns:1fr}}
</style>

<style scoped>
.company-application__toggle{display:inline-flex;width:fit-content;min-height:2rem;align-items:center;gap:.45rem;padding:.35rem .6rem;border:1px solid var(--border);border-radius:.55rem;background:var(--surface);color:var(--primary);font:inherit;font-size:.74rem;font-weight:800;cursor:pointer;transition:background .16s,border-color .16s}
.company-application__toggle:hover{border-color:var(--primary);background:var(--secondary)}
</style>

<style scoped>
.workspace__section{border-color:color-mix(in srgb,var(--palette-ink) 10%,var(--border))}.company-application{margin-top:.7rem;padding:1.2rem;border:1px solid var(--border);border-radius:.9rem;background:linear-gradient(125deg,var(--surface),color-mix(in srgb,var(--palette-ice) 28%,var(--surface)));box-shadow:0 8px 25px color-mix(in srgb,var(--palette-ink) 4%,transparent)}.company-application:first-child{margin-top:0}.company-application__profile{gap:.55rem}.company-application__profile strong{font-size:1.15rem}.company-application__form{margin-top:.35rem}.company-application__form label{color:var(--foreground);font-size:.75rem}.company-application__history li{border:1px solid var(--border);border-radius:.65rem;background:var(--surface)}.company-applications__pagination button:hover:not(:disabled){border-color:var(--primary);background:var(--secondary)}
</style>

<style scoped>
.workspace__section>.workspace__list{gap:0}.company-application{margin:0;padding:1rem .4rem;border:0;border-top:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none}.company-application:first-child{border-top:0}.company-application:hover{background:color-mix(in srgb,var(--secondary) 24%,transparent)}.company-application__profile strong{font-size:1rem}.company-application__form{gap:.6rem;padding-top:.7rem}.company-application__history li{padding:.35rem .5rem;border:0;border-radius:.45rem;background:var(--panel);font-size:.7rem}.company-application__form label{font-size:.7rem}.company-application__form select,.company-application__form textarea{min-height:2.35rem;border-radius:.5rem}.company-application__form button.workspace__cta{min-height:2.35rem;white-space:nowrap}

.company-applications__empty{display:grid;justify-items:center;gap:.5rem;padding:2rem 1rem;text-align:center}
.company-applications__empty-mark{display:grid;width:2.7rem;height:2.7rem;place-items:center;border:1px solid var(--border);border-radius:.85rem;background:var(--secondary);color:var(--primary);font:800 .8rem Manrope,sans-serif}
.company-applications__empty strong{font-size:.84rem}
.company-applications__empty p{max-width:30rem;margin:0;color:var(--muted-foreground);font-size:.74rem;line-height:1.55}
.company-applications__empty>a{margin-top:.25rem;color:var(--primary);font-size:.76rem;font-weight:800}</style>
