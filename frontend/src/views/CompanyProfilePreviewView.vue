<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import CompanyPublicSummary from '@/components/workspace/CompanyPublicSummary.vue'
import { profilesApi, type CompanyProfileData, type ProfileOption } from '@/services/profiles'

const profile = ref<CompanyProfileData | null>(null)
const departments = ref<ProfileOption[]>([])
const municipalities = ref<ProfileOption[]>([])
const sectors = ref<ProfileOption[]>([])
const loading = ref(true)
const error = ref('')
const publicCompany = computed(() => {
  if (!profile.value) return null
  return {
    name: profile.value.name,
    description: profile.value.description,
    website: profile.value.website,
    economicSector: sectors.value.find(item => item.id === profile.value?.economicSectorId) ?? null,
    department: departments.value.find(item => item.id === profile.value?.departmentId) ?? null,
    municipality: municipalities.value.find(item => item.id === profile.value?.municipalityId) ?? null,
  }
})

onMounted(async () => {
  try {
    const result = await profilesApi.company()
    profile.value = result.profile
    departments.value = result.catalogs.departments
    municipalities.value = result.catalogs.municipalities
    sectors.value = result.catalogs.economicSectors
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar la vista previa.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <WorkspaceFrame eyebrow="Vista previa" title="Tu empresa para un candidato" subtitle="Esta presentación acompaña las vacantes publicadas por tu empresa." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/company/profile">Editar perfil</RouterLink></template>
    <p v-if="loading" class="workspace__empty" role="status">Cargando vista previa…</p>
    <p v-else-if="error" class="workspace__error" role="alert">{{ error }}</p>
    <template v-else-if="profile && publicCompany">
      <div class="company-preview-layout">
        <CompanyPublicSummary :company="publicCompany" />
        <aside class="company-preview-note workspace__card">
          <span class="company-preview-note__icon" aria-hidden="true">i</span>
          <div><h2>Información pública</h2><p>El candidato ve el nombre, la descripción, el sector, la ubicación general y el sitio web.</p><p>El correo, teléfono, dirección exacta e identificación fiscal permanecen privados.</p></div>
        </aside>
      </div>
      <p v-if="profile.verificationStatus !== 'VERIFIED'" class="workspace__notice company-preview__verification">El perfil público aparece junto a vacantes de empresas verificadas. Tu estado actual es {{ profile.verificationStatus === 'REJECTED' ? 'rechazado' : 'pendiente de verificación' }}.</p>
    </template>
  </WorkspaceFrame>
</template>

<style scoped>
.company-preview-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(15rem,.75fr);gap:1rem;align-items:start}
.company-preview-note{display:flex;gap:.75rem;padding:1rem}
.company-preview-note__icon{display:grid;width:1.8rem;height:1.8rem;flex:none;place-items:center;border-radius:50%;background:var(--secondary);color:var(--primary);font:800 .85rem Manrope,sans-serif}
.company-preview-note h2{margin:.1rem 0 .45rem;font:800 .85rem Manrope,sans-serif}
.company-preview-note p{margin:.35rem 0;color:var(--muted-foreground);font-size:.73rem;line-height:1.55}
.company-preview__verification{margin-top:1rem}
@media(max-width:700px){.company-preview-layout{grid-template-columns:1fr}}
</style>
