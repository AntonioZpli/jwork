<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import { formatJobSalary, jobsApi, jobLabels, type CandidateSavedJob } from '@/services/jobs'

const savedJobs = ref<CandidateSavedJob[]>([])
const loading = ref(true)
const busyId = ref('')
const error = ref('')
async function load() {
  try { savedJobs.value = (await jobsApi.candidateSavedJobs()).savedJobs }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudieron cargar tus vacantes guardadas.' }
  finally { loading.value = false }
}
async function remove(id: string) {
  busyId.value = id
  error.value = ''
  try { await jobsApi.unsave(id); await load() }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo quitar la vacante.' }
  finally { busyId.value = '' }
}
onMounted(load)
</script>

<template>
  <WorkspaceFrame eyebrow="Mi actividad" title="Vacantes guardadas" subtitle="Ofertas activas que guardaste para revisar después." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/jobs">Explorar vacantes</RouterLink></template>
    <p v-if="error" class="workspace__error" role="alert">{{ error }}</p><p v-if="loading" class="workspace__empty" role="status">Cargando vacantes…</p>
    <section v-if="!loading" class="workspace__card workspace__section">
      <p v-if="!savedJobs.length" class="candidate-saved__empty workspace__empty">Todavía no has guardado vacantes. Puedes conservar las que te interesen y volver a ellas aquí. <RouterLink to="/jobs">Explorar vacantes</RouterLink></p>
      <template v-else>
        <p class="candidate-saved__summary">Tienes <strong>{{ savedJobs.length }}</strong> {{ savedJobs.length === 1 ? 'vacante activa guardada' : 'vacantes activas guardadas' }} para revisar cuando quieras.</p>
        <div class="workspace__list"><article v-for="saved in savedJobs" :key="saved.job.id" class="workspace__row"><div><RouterLink :to="`/jobs/${saved.job.id}`" class="saved-job__title">{{ saved.job.title }}</RouterLink><span class="workspace__meta">{{ saved.job.company.name }} · {{ saved.job.professionalArea.name }} · {{ [saved.job.municipality?.name, saved.job.department?.name].filter(Boolean).join(', ') || 'Remoto' }}</span><span class="workspace__meta">{{ jobLabels.workMode[saved.job.workMode] ?? saved.job.workMode }} · {{ jobLabels.contract[saved.job.contractType] ?? saved.job.contractType }} · {{ formatJobSalary(saved.job) }}</span><span class="candidate-saved__date">Guardada el {{ new Date(saved.createdAt).toLocaleDateString('es-NI') }}</span></div><div class="candidate-saved__actions"><RouterLink :to="`/jobs/${saved.job.id}`">Ver oferta <span aria-hidden="true">→</span></RouterLink><button class="saved-job__remove" type="button" :disabled="Boolean(busyId)" @click="remove(saved.job.id)">{{ busyId === saved.job.id ? 'Quitando…' : 'Quitar' }}</button></div></article></div>
      </template>
    </section>
  </WorkspaceFrame>
</template>

<style scoped>
.workspace__section>.workspace__list{gap:.65rem}.workspace__row:has(.saved-job__title){padding:1.1rem;border:1px solid var(--border);border-radius:.85rem;background:linear-gradient(120deg,var(--surface),color-mix(in srgb,var(--palette-ice) 24%,var(--surface)));transition:border-color .18s,box-shadow .18s}.workspace__row:has(.saved-job__title):hover{border-color:color-mix(in srgb,var(--primary) 32%,var(--border));box-shadow:0 9px 24px color-mix(in srgb,var(--palette-ink) 6%,transparent)}.saved-job__title{display:block;color:var(--foreground);font:800 1rem Manrope,sans-serif}.saved-job__title:hover{color:var(--primary)}.saved-job__remove{min-height:2.2rem;border:1px solid var(--border);border-radius:.65rem;padding:.4rem .75rem;background:var(--surface);color:var(--foreground);font:inherit;font-size:.76rem;font-weight:750;cursor:pointer;transition:.18s}.saved-job__remove:hover{border-color:var(--primary);color:var(--primary)}.saved-job__remove:disabled{opacity:.5}@media(max-width:650px){.workspace__row:has(.saved-job__title){padding:.9rem}}
</style>

<style scoped>
.workspace__section>.workspace__list{gap:0}.workspace__row:has(.saved-job__title){margin:0;padding:.85rem .35rem;border:0;border-top:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none}.workspace__row:has(.saved-job__title):first-child{border-top:0}.workspace__row:has(.saved-job__title):hover{border-color:var(--border);background:color-mix(in srgb,var(--secondary) 28%,transparent);box-shadow:none}.saved-job__title{font-size:.92rem}.saved-job__remove{min-height:1.95rem;border-radius:.55rem;font-size:.71rem}

.candidate-saved__summary{margin:0 0 .7rem;padding:.7rem .8rem;border:1px solid var(--border);border-radius:.7rem;background:var(--panel);color:var(--muted-foreground);font-size:.74rem}
.candidate-saved__summary strong{color:var(--foreground)}
.candidate-saved__date{display:block;margin-top:.25rem;color:var(--muted-foreground);font-size:.65rem}
.candidate-saved__actions{display:flex;align-items:center;gap:.65rem}
.candidate-saved__actions>a{color:var(--primary);font-size:.72rem;font-weight:750;white-space:nowrap}
.candidate-saved__empty a{display:block;margin-top:.35rem;color:var(--primary);font-weight:800}
@media(max-width:650px){.candidate-saved__actions{align-self:flex-start}}
</style>
