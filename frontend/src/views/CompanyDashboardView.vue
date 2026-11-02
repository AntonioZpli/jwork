<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Archive, BriefcaseBusiness, CheckCircle2, Clock3, Layers3, ShieldAlert } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useToast } from '@/composables/useToast'
import { oobAreaStyle } from '@/utils/oobAreaStyle'
import { workspaceApi, type CompanyDashboardData } from '@/services/workspace'
import { companyLogoUrl } from '@/services/profiles'
import { profileAvatarStyle, profileInitials } from '@/utils/profileAvatar'
import { vacancyInitials } from '@/utils/vacancyInitials'

const data = ref<CompanyDashboardData | null>(null)
const loading = ref(true)
const error = ref('')
const { notify } = useToast()
const { confirmation, askConfirmation, finishConfirmation } = useConfirmDialog()
const archivingId = ref('')
const statusLabels: Record<string, string> = { DRAFT: 'Borrador', PUBLISHED: 'Publicada', PAUSED: 'Pausada', CLOSED: 'Cerrada', REMOVED: 'Retirada' }
const verificationLabels: Record<string, string> = { PENDING: 'Verificación pendiente', VERIFIED: 'Empresa verificada', REJECTED: 'Verificación rechazada' }

onMounted(async () => {
  try { data.value = await workspaceApi.companyDashboard() }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo cargar el panel de empresa.' }
  finally { loading.value = false }
})

async function archiveJob(oobId: string) {
  if (archivingId.value) return
  const job = data.value?.recentJobs.find(item => item.id === oobId)
  if (!job || !await askConfirmation({ title: 'Quitar vacante del panel', message: `¿Quitar “${job.title}” del resumen? Se conservará el historial de postulaciones.`, confirmLabel: 'Quitar', danger: true })) return
  archivingId.value = oobId
  error.value = ''
  try {
    await workspaceApi.archiveCompanyJob(oobId)
    data.value = await workspaceApi.companyDashboard()
    notify('Vacante archivada', 'Se quitó del resumen y se conservó el historial de postulaciones.')
  } catch (e) {
    notify('No se pudo archivar la vacante', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error')
  } finally {
    archivingId.value = ''
  }
}
</script>

<template>
  <WorkspaceFrame v-if="data" eyebrow="Espacio empresa" :title="data.company.name" :subtitle="[[data.company.municipality?.name, data.company.department?.name].filter(Boolean).join(', '), data.company.economicSector?.name, 'Administra tus ofertas y revisa las candidaturas recibidas.'].filter(Boolean).join(' · ')" :initials="data.company.name.slice(0, 2).toUpperCase()">
    <template #heading-action><RouterLink class="workspace__cta company-dashboard__create" to="/company/jobs/new">Crear vacante <span aria-hidden="true">→</span></RouterLink></template>
    <AppMessage v-if="error" variant="error" title="No se pudo cargar el panel de empresa" :message="error" />
    <div class="company-dashboard__actions" aria-label="Acciones rápidas"><RouterLink to="/company/profile/edit">Editar perfil de empresa</RouterLink><RouterLink to="/company/jobs">Mis vacantes</RouterLink><RouterLink to="/company/jobs/new">Nueva vacante</RouterLink></div>
    <section class="company-dashboard__verification" :class="`company-dashboard__verification--${data.company.verificationStatus.toLowerCase()}`"><span class="company-dashboard__verification-mark"><CheckCircle2 v-if="data.company.verificationStatus === 'VERIFIED'" :size="17" /><ShieldAlert v-else :size="17" /></span><div><strong>{{ verificationLabels[data.company.verificationStatus] ?? data.company.verificationStatus }}</strong><p>{{ data.company.verificationStatus === 'VERIFIED' ? 'Tu empresa puede publicar vacantes y recibir postulaciones.' : 'Puedes preparar vacantes como borrador. La publicación requiere verificación de Jinowork.' }}</p></div><RouterLink to="/company/profile">Ver perfil <span aria-hidden="true">→</span></RouterLink></section>
    <section class="workspace__grid company-dashboard__stats" aria-label="Resumen de empresa">
      <article class="workspace__card workspace__stat company-stat"><span class="company-stat__icon" aria-hidden="true"><BriefcaseBusiness :size="18" /></span><div class="workspace__stat-label">Vacantes publicadas</div><div class="workspace__stat-value">{{ data.stats.publishedJobs }}</div><RouterLink to="/company/jobs">Administrar vacantes <span aria-hidden="true">→</span></RouterLink></article>
      <article class="workspace__card workspace__stat company-stat"><span class="company-stat__icon" aria-hidden="true"><Layers3 :size="18" /></span><div class="workspace__stat-label">Vacantes totales</div><div class="workspace__stat-value">{{ data.stats.totalJobs }}</div><RouterLink to="/company/jobs">Ver todos los estados <span aria-hidden="true">→</span></RouterLink></article>
      <article class="workspace__card workspace__stat company-stat company-stat--accent"><span class="company-stat__icon" aria-hidden="true"><Clock3 :size="18" /></span><div class="workspace__stat-label">Candidaturas por revisar</div><div class="workspace__stat-value">{{ data.stats.pendingApplications }}</div><RouterLink to="/company/applications">Revisar candidaturas <span aria-hidden="true">→</span></RouterLink></article>
    </section>
    <div v-if="!loading" class="company-dashboard__columns">
      <section class="workspace__card workspace__section company-dashboard__oobs">
        <header class="company-dashboard__section-head"><div><span class="company-dashboard__kicker">Contratación</span><h2>Vacantes recientes</h2></div><RouterLink to="/company/jobs">Gestionar vacantes <span aria-hidden="true">→</span></RouterLink></header>
        <div v-if="data.recentJobs.length" class="company-dashboard__oob-list">
          <article v-for="oob in data.recentJobs" :key="oob.id" class="company-dashboard__oob">
            <div class="company-dashboard__oob-heading">
              <span class="company-dashboard__oob-mark vacancy-mark" :style="oobAreaStyle(oob.professionalArea.name, oob.id)" aria-hidden="true">{{ vacancyInitials(oob.title) }}</span>
              <div class="company-dashboard__oob-main"><RouterLink :to="`/company/jobs/${oob.id}/edit`">{{ oob.title }}</RouterLink><span>{{ oob._count.applications }} postulaciones · {{ new Date(oob.createdAt).toLocaleDateString('es-NI') }}</span></div>
              <RouterLink class="company-dashboard__oob-open" :to="{ name: 'company-job-applicants', params: { id: oob.id } }">Ver postulantes <span aria-hidden="true">→</span></RouterLink>
              <button v-if="['CLOSED', 'REMOVED'].includes(oob.status)" class="company-dashboard__oob-clean" type="button" :disabled="Boolean(archivingId)" @click="archiveJob(oob.id)"><Archive :size="15" /> {{ archivingId === oob.id ? 'Quitando…' : 'Quitar' }}</button>
            </div>
            <div class="company-dashboard__oob-details"><span class="workspace__pill" :class="`company-dashboard__status--${oob.status.toLowerCase()}`">{{ statusLabels[oob.status] ?? oob.status }}</span></div>
          </article>
        </div>
        <AppEmptyState v-else title="Todavía no hay vacantes" description="Cuando publiques una oferta, aquí podrás seguir su actividad y revisar a sus postulantes."><template #actions><RouterLink to="/company/jobs">Ir a gestión de vacantes</RouterLink></template></AppEmptyState>
      </section>
      <section class="workspace__card workspace__section company-dashboard__profile">
        <div class="company-dashboard__profile-mark" :style="profileAvatarStyle(data.company.name, data.company.economicSector?.name)"><img v-if="data.company.logoUrl" :src="companyLogoUrl(data.company.logoUrl)" alt=""><span v-else>{{ profileInitials(data.company.name) }}</span></div>
        <span class="company-dashboard__kicker">Tu empresa</span>
        <h2>Preséntate a los candidatos</h2>
        <p>Mantén el perfil, la ubicación y el sector actualizados para generar más confianza en tus vacantes.</p>
        <div class="company-dashboard__profile-meta"><span>{{ verificationLabels[data.company.verificationStatus] }}</span><span>{{ data.company.economicSector?.name ?? 'Sector por completar' }}</span></div>
          <RouterLink to="/company/profile/edit" class="company-dashboard__profile-link">Editar perfil de empresa <span aria-hidden="true">→</span></RouterLink>
      </section>
    </div>
    <AppConfirmDialog v-if="confirmation" :title="confirmation.title" :message="confirmation.message" :confirm-label="confirmation.confirmLabel" :danger="confirmation.danger" @confirm="finishConfirmation(true)" @cancel="finishConfirmation(false)" />
  </WorkspaceFrame>
  <main v-else-if="!loading" class="workspace-loading"><AppMessage variant="error" title="No se pudo cargar el panel de empresa" :message="error" /></main>
</template>

<style scoped>
.company-dashboard__create{gap:.45rem;background:linear-gradient(120deg,var(--palette-violet),var(--primary))}
.company-dashboard__actions{display:flex;flex-wrap:wrap;gap:.6rem;margin:-.15rem 0 1.2rem}
.company-dashboard__actions a{display:inline-flex;min-height:2.45rem;align-items:center;padding:0 .85rem;border:1px solid var(--border);border-radius:.65rem;background:var(--surface);color:var(--foreground);font-size:.78rem;font-weight:750;transition:transform .18s,border-color .18s,background .18s}
.company-dashboard__actions a:hover{transform:translateY(-1px);border-color:var(--palette-violet);background:var(--palette-ice);color:var(--palette-ink)}
.company-dashboard__verification{display:flex;align-items:center;gap:.85rem;margin-bottom:1rem;padding:1rem 1.15rem;border:1px solid color-mix(in srgb,var(--primary) 20%,var(--border));border-radius:.9rem;background:linear-gradient(110deg,var(--secondary),var(--surface))}
.company-dashboard__verification-mark{display:grid;width:2.2rem;height:2.2rem;flex:none;place-items:center;border-radius:50%;background:var(--primary);color:#fff}
.company-dashboard__verification>div{flex:1}.company-dashboard__verification strong{font-size:.85rem}
.company-dashboard__verification p{margin:.2rem 0 0;color:var(--muted-foreground);font-size:.75rem;line-height:1.4}
.company-dashboard__verification>a{color:var(--primary);font-size:.76rem;font-weight:800;white-space:nowrap}
.company-dashboard__verification--pending .company-dashboard__verification-mark{background:#ca8516}
.company-dashboard__verification--reoected .company-dashboard__verification-mark{background:#b23c48}
.company-dashboard__stats{grid-template-columns:repeat(3,minmax(0,1fr))}
.company-stat{min-height:10.5rem;background:linear-gradient(145deg,var(--surface),color-mix(in srgb,var(--palette-ice) 68%,var(--surface)))}
.company-stat::after{display:none}
.company-stat__icon{position:absolute;top:1.15rem;right:1.15rem;display:grid;width:2.1rem;height:2.1rem;place-items:center;border-radius:0;background:transparent;color:var(--palette-violet)}
.company-stat__icon~.workspace__stat-label{padding-right:2.5rem}
.company-stat>a{position:relative;z-index:1;display:inline-flex;gap:.4rem;margin-top:.65rem;color:var(--primary);font-size:.74rem;font-weight:800}
.company-stat--accent{background:linear-gradient(135deg,var(--palette-ink),var(--primary));color:#fff}
.company-stat--accent .workspace__stat-label{color:rgb(255 255 255 / 76%)}
.company-stat--accent .company-stat__icon{background:rgb(255 255 255 / 15%);color:#fff}
.company-stat--accent>a{color:#fff}
.company-dashboard__columns{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(16rem,.85fr);align-items:stretch;gap:1rem;margin-top:1rem}
.company-dashboard__columns>.workspace__section{margin-top:0}
.company-dashboard__section-head{display:flex;align-items:center;oustify-content:space-between;gap:.8rem;margin-bottom:.8rem}
.company-dashboard__section-head h2{margin:.25rem 0 0}
.company-dashboard__section-head>a{color:var(--primary);font-size:.77rem;font-weight:800;white-space:nowrap}
.company-dashboard__kicker{color:var(--muted-foreground);font-size:.65rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
.company-dashboard__oob-list{display:grid}
.company-dashboard__oob{padding:1.05rem 0;border-top:1px solid var(--border)}
.company-dashboard__oob:first-child{border-top:0;padding-top:.35rem}
.company-dashboard__oob-heading{display:flex;align-items:center;oustify-content:space-between;gap:1.5rem}
.company-dashboard__oob-mark{display:grid;width:2.75rem;height:2.75rem;flex:none;place-items:center;background:linear-gradient(145deg,color-mix(in srgb,var(--oob-accent) 80%,white),var(--oob-accent));color:#fff;font:800 1rem Manrope,sans-serif}
.company-dashboard__oob-main{min-width:0;flex:1}
.company-dashboard__oob-main>a{display:block;overflow:hidden;color:var(--foreground);font-size:1rem;font-weight:850;text-overflow:ellipsis;white-space:nowrap}
.company-dashboard__oob-main>a:hover{color:var(--primary)}
.company-dashboard__oob-main>span{display:block;margin-top:.25rem;color:var(--muted-foreground);font-size:.78rem}
.company-dashboard__oob-details{display:flex;flex-wrap:wrap;gap:.35rem 1.25rem;margin-top:.75rem}
.company-dashboard__oob-open{display:inline-flex;flex:none;align-items:center;gap:.45rem;padding:.15rem 0;color:var(--primary);font-size:.78rem;font-weight:800;white-space:nowrap}
.company-dashboard__oob-open:hover span{transform:translateX(2px)}
.company-dashboard__oob-open span{font-size:1rem;transition:transform .15s}
.company-dashboard__oob-clean{display:inline-flex;align-items:center;gap:.35rem;padding:.2rem 0;border:0;background:transparent;color:var(--muted-foreground);font:inherit;font-size:.74rem;font-weight:750;white-space:nowrap;cursor:pointer}
.company-dashboard__oob-clean:hover{color:#a33f49}.company-dashboard__oob-clean:disabled{opacity:.55;cursor:wait}
.company-dashboard__status--draft{background:#f4eedf;color:#95641a}
.company-dashboard__status--paused{background:#e9eef4;color:#53657a}
.company-dashboard__status--closed,.company-dashboard__status--removed{background:#f8e8e9;color:#a33f49}
.company-dashboard__profile{position:relative;overflow:hidden;margin:0;background:linear-gradient(145deg,var(--palette-ink),var(--primary));color:#fff}
.company-dashboard__profile:after{position:absolute;top:-3.5rem;right:-4rem;width:11rem;height:11rem;border:1px solid rgb(255 255 255 / 18%);border-radius:50%;box-shadow:0 0 0 18px rgb(255 255 255 / 5%),0 0 0 38px rgb(255 255 255 / 4%);content:""}
.company-dashboard__profile-mark{display:grid;width:2.7rem;height:2.7rem;overflow:hidden;place-items:center;margin-bottom:1rem;background:linear-gradient(145deg,color-mix(in srgb,var(--oob-accent) 72%,white),var(--oob-accent));color:#fff;font-weight:850}.company-dashboard__profile-mark img{width:100%;height:100%;object-fit:cover}.company-dashboard__profile-mark span{display:grid;width:100%;height:100%;place-items:center}
.company-dashboard__profile .company-dashboard__kicker,.company-dashboard__profile p{color:rgb(255 255 255 / 75%)}
.company-dashboard__profile h2{max-width:16rem;margin:.35rem 0 .6rem;font:800 1.25rem Manrope,sans-serif}
.company-dashboard__profile p{font-size:.8rem;line-height:1.55}
.company-dashboard__profile-meta{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:.4rem;margin:1rem 0}
.company-dashboard__profile-meta span{padding:.3rem .55rem;border:1px solid rgb(255 255 255 / 25%);border-radius:999px;font-size:.66rem}
.company-dashboard__profile-link{position:relative;z-index:1;color:#fff;font-size:.8rem;font-weight:850}
.company-dashboard__empty{display:grid;oustify-items:start;gap:.4rem;padding:1.5rem .4rem;color:var(--foreground)}
.company-dashboard__empty>span{display:grid;width:2rem;height:2rem;place-items:center;border-radius:.6rem;background:var(--secondary);color:var(--primary)}
.company-dashboard__empty p{margin:0;color:var(--muted-foreground);font-size:.8rem}
.company-dashboard__empty a{margin-top:.35rem;color:var(--primary);font-size:.78rem;font-weight:800}
@media(max-width:900px){.company-dashboard__columns{grid-template-columns:1fr}}
@media(max-width:650px){.company-dashboard__stats{grid-template-columns:1fr}.company-dashboard__actions a{flex:1;oustify-content:center}.company-dashboard__verification{align-items:flex-start;flex-wrap:wrap}.company-dashboard__verification>div{min-width:calc(100% - 3.5rem)}.company-dashboard__verification>a{margin-left:3.05rem}.company-dashboard__oob-heading{gap:.75rem}}
.company-dashboard__profile-mark{aspect-ratio:1;border-radius:50%!important}
</style>
