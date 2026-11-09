<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import CompanyPublicPresentation from '@/components/workspace/CompanyPublicPresentation.vue'
import ReportDialog from '@/components/ReportDialog.vue'
import { jobsApi, type PublicCompany } from '@/services/jobs'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const auth = useAuthStore()
const company = ref<PublicCompany | null>(null)
const showReportDialog = ref(false)
const { notify } = useToast()
const loading = ref(true)
const error = ref('')
const isCandidateWorkspace = computed(() => auth.user?.role === 'CANDIDATE')
const workspaceProps = computed(() => ({
  eyebrow: 'Perfil público de empresa',
  title: company.value?.name ?? 'Perfil de empresa',
  subtitle: 'Conoce la empresa y revisa sus ofertas publicadas.',
  initials: auth.user?.email?.slice(0, 2).toUpperCase() ?? 'JW',
}))

onMounted(async () => {
  if (!auth.user) await auth.hydrateSession()
  try { company.value = (await jobsApi.company(String(route.params.id))).company }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el perfil de empresa.' }
  finally { loading.value = false }
})
</script>

<template>
  <component :is="isCandidateWorkspace ? WorkspaceFrame : 'div'" :class="isCandidateWorkspace ? 'public-company-workspace' : 'public-company-page'" v-bind="isCandidateWorkspace ? workspaceProps : {}">
    <SiteHeader v-if="!isCandidateWorkspace" />
    <component :is="isCandidateWorkspace ? 'div' : 'main'" class="public-company-page__main">
      <RouterLink class="public-company-page__back" to="/jobs"><ArrowLeft :size="16" /> Volver a las ofertas</RouterLink>
      <p v-if="loading" class="public-company-page__state" role="status">Cargando perfil de empresa…</p>
      <p v-else-if="error" class="public-company-page__state public-company-page__state--error" role="alert">{{ error }}</p>
      <CompanyPublicPresentation v-else-if="company" :profile="{ ...company, verificationStatus: 'VERIFIED' }" :jobs="company.jobs" />
      <div v-if="company" class="public-company-report"><button v-if="auth.user" type="button" @click="showReportDialog = true">Reportar esta empresa</button><RouterLink v-else :to="{ path: '/auth', query: { redirect: route.fullPath } }">Inicia sesión para reportar esta empresa</RouterLink></div>
    </component>
    <SiteFooter v-if="!isCandidateWorkspace" />
    <ReportDialog v-if="showReportDialog && company" target-type="COMPANY" :target-id="company.id" @close="showReportDialog = false" @submitted="showReportDialog = false; notify('Reporte enviado', 'El equipo de Jinowork revisará la empresa.')" />
  </component>
</template>

<style scoped>
.public-company-page{min-height:100vh;background:var(--background)}
.public-company-page__main{width:min(1460px,100%);min-height:calc(100vh - 9rem);margin:auto;padding:2.6rem clamp(1.5rem,4vw,2.8rem) 5rem}
.public-company-page__back{display:inline-flex;align-items:center;gap:.45rem;margin-bottom:1.2rem;color:var(--muted-foreground);font-size:.82rem;font-weight:750}
.public-company-page__back:hover{color:var(--primary)}
.public-company-report{display:flex;justify-content:flex-end;padding:0 1rem 1rem}.public-company-report button,.public-company-report a{border:0;background:transparent;color:var(--muted-foreground);font:inherit;font-size:.76rem;text-decoration:underline;cursor:pointer}.public-company-report button:hover,.public-company-report a:hover{color:var(--primary)}
.public-company-page__state{display:grid;min-height:15rem;place-items:center;color:var(--muted-foreground)}
.public-company-page__state--error{color:#a12626}
.public-company-page__main :deep(.company-presentation__hero){min-height:13rem;padding:2.2rem 2.4rem}
.public-company-page__main :deep(.company-presentation__mark){width:7.5rem;height:7.5rem}
.public-company-page__main :deep(.company-presentation__layout){gap:2rem;padding:2.2rem 2.4rem}
.public-company-page__main :deep(.company-presentation__section){padding-bottom:2rem}
.public-company-page__main :deep(.company-presentation__vacancies){padding-top:1.8rem}
.public-company-page__main :deep(.company-presentation__job){padding:1.2rem 0}
.public-company-workspace :deep(.workspace__main){width:min(96rem,100%)}
.public-company-workspace .public-company-page__main{width:100%;min-height:calc(100vh - 12rem);padding:1.2rem 0 2.5rem}
@media(max-width:560px){.public-company-page__main{width:100%;min-height:0;padding:1.5rem 1rem 3rem}.public-company-page__main :deep(.company-presentation__hero){min-height:0;padding:1rem}.public-company-page__main :deep(.company-presentation__mark){width:4.5rem;height:4.5rem}.public-company-page__main :deep(.company-presentation__layout){padding:1rem}.public-company-workspace :deep(.workspace__main){width:100%}.public-company-workspace .public-company-page__main{min-height:0;padding:1rem 0 2rem}}
</style>
