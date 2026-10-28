<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import CandidateCredentials from '@/components/workspace/CandidateCredentials.vue'
import { profilesApi, type CandidateProfileData, type CandidateProfileOptions } from '@/services/profiles'

const profile = ref<CandidateProfileData | null>(null)
const options = ref<CandidateProfileOptions | null>(null)
const loading = ref(true)
const error = ref('')
const professionalSummary = computed(() => {
  if (!profile.value || !options.value) return ''
  return [
    options.value.professionalAreas.find(item => item.id === profile.value?.professionalAreaId)?.name,
    options.value.specializations.find(item => item.id === profile.value?.specializationId)?.name,
  ].filter(Boolean).join(' · ')
})
const location = computed(() => [profile.value?.municipality?.name, profile.value?.department?.name].filter(Boolean).join(', '))

onMounted(async () => {
  try {
    const result = await profilesApi.candidate()
    profile.value = result.profile
    options.value = result.catalogs
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar la vista previa.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <WorkspaceFrame eyebrow="Vista previa" title="Tu perfil para una empresa" subtitle="Así se presenta tu información profesional cuando postulas a una vacante." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/candidate/profile">Editar perfil</RouterLink></template>
    <p v-if="loading" class="workspace__empty" role="status">Cargando vista previa…</p>
    <p v-else-if="error" class="workspace__error" role="alert">{{ error }}</p>
    <template v-else-if="profile">
      <article class="candidate-preview workspace__card">
        <header class="candidate-preview__header"><span class="candidate-preview__avatar">{{ profile.firstName.slice(0, 1) }}{{ profile.lastName.slice(0, 1) }}</span><div><span class="candidate-preview__kicker">Perfil profesional</span><h2>{{ profile.firstName }} {{ profile.lastName }}</h2><p>{{ professionalSummary || 'Área profesional no indicada' }}</p><span class="candidate-preview__location">{{ location || 'Ubicación no indicada' }}</span></div><span class="candidate-preview__cv" :class="{ 'candidate-preview__cv--ready': profile.cvUrl }">{{ profile.cvUrl ? 'CV adjunto' : 'Sin CV adjunto' }}</span></header>
        <section v-if="profile.description" class="candidate-preview__bio"><h3>Resumen profesional</h3><p>{{ profile.description }}</p></section>
        <section v-else class="candidate-preview__missing"><strong>Añade un resumen profesional</strong><p>Un resumen ayuda a la empresa a entender tu experiencia y objetivos.</p></section>
        <CandidateCredentials :candidate="profile" />
        <p class="candidate-preview__privacy">Por privacidad, el correo y teléfono de contacto no aparecen en esta vista. El currículum solo se puede abrir desde una postulación recibida por la empresa.</p>
      </article>
    </template>
  </WorkspaceFrame>
</template>

<style scoped>
.candidate-preview{padding:clamp(1rem,3vw,1.6rem)}
.candidate-preview__header{display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:.9rem;background:linear-gradient(115deg,var(--palette-ink),#1769c2);color:#fff}
.candidate-preview__avatar{display:grid;width:4rem;height:4rem;flex:none;place-items:center;border:1px solid rgb(255 255 255 / 35%);border-radius:50%;background:rgb(255 255 255 / 14%);font:800 1rem Manrope,sans-serif}
.candidate-preview__header>div{min-width:0;flex:1}
.candidate-preview__kicker{color:rgb(255 255 255 / 67%);font-size:.63rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
.candidate-preview__header h2{margin:.2rem 0;font:800 1.25rem Manrope,sans-serif}
.candidate-preview__header p,.candidate-preview__location{display:block;margin:0;color:rgb(255 255 255 / 82%);font-size:.76rem}
.candidate-preview__location{margin-top:.25rem;color:rgb(255 255 255 / 66%)}
.candidate-preview__cv{padding:.4rem .6rem;border:1px solid rgb(255 255 255 / 32%);border-radius:999px;font-size:.68rem;font-weight:800;white-space:nowrap}
.candidate-preview__cv--ready{background:rgb(33 150 97 / 25%)}
.candidate-preview__bio,.candidate-preview__missing{margin-top:1rem;padding:1rem;border:1px solid var(--border);border-radius:.75rem}
.candidate-preview__bio h3{margin:0 0 .4rem;font-size:.78rem}
.candidate-preview__bio p,.candidate-preview__missing p{margin:0;color:var(--muted-foreground);font-size:.8rem;line-height:1.65;white-space:pre-line}
.candidate-preview__missing strong{font-size:.8rem}
.candidate-preview__privacy{margin:.9rem 0 0;padding-top:.7rem;border-top:1px solid var(--border);color:var(--muted-foreground);font-size:.68rem;line-height:1.55}
@media(max-width:650px){.candidate-preview__header{align-items:flex-start;flex-wrap:wrap}.candidate-preview__header>div{min-width:calc(100% - 5rem)}.candidate-preview__cv{margin-left:5rem}}
</style>
