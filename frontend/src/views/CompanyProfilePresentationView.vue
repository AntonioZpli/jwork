<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Pencil } from 'lucide-vue-next'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import CompanyPublicPresentation from '@/components/workspace/CompanyPublicPresentation.vue'
import { profilesApi, type CompanyProfileData, type ProfileOption } from '@/services/profiles'
import { workspaceApi, type CompanyJob } from '@/services/workspace'

const profile = ref<CompanyProfileData | null>(null)
const departments = ref<ProfileOption[]>([])
const municipalities = ref<ProfileOption[]>([])
const sectors = ref<ProfileOption[]>([])
const jobs = ref<CompanyJob[]>([])
const loading = ref(true)
const error = ref('')
const presentationProfile = computed(() => {
  if (!profile.value) return null
  return {
    ...profile.value,
    economicSector: sectors.value.find(item => item.id === profile.value?.economicSectorId) ?? null,
    department: departments.value.find(item => item.id === profile.value?.departmentId) ?? null,
    municipality: municipalities.value.find(item => item.id === profile.value?.municipalityId) ?? null,
  }
})
const publishedJobs = computed(() => jobs.value.filter(job => job.status === 'PUBLISHED'))

onMounted(async () => {
  try {
    const [result, jobResult] = await Promise.all([profilesApi.company(), workspaceApi.companyJobs()])
    profile.value = result.profile
    departments.value = result.catalogs.departments
    municipalities.value = result.catalogs.municipalities
    sectors.value = result.catalogs.economicSectors
    jobs.value = jobResult.jobs
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el perfil de empresa.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <WorkspaceFrame eyebrow="Perfil de empresa" title="Mi empresa" subtitle="Información de la empresa y oportunidades publicadas." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/company/profile/edit"><Pencil :size="15" />Editar perfil</RouterLink></template>
    <AppMessage v-if="loading" variant="loading" message="Cargando perfil de empresa…" />
    <AppMessage v-else-if="error" variant="error" title="No se pudo cargar el perfil" :message="error" />
    <CompanyPublicPresentation v-else-if="presentationProfile" :profile="presentationProfile" :jobs="publishedJobs" editable />
  </WorkspaceFrame>
</template>
