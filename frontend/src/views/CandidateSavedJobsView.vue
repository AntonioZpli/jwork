<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useToast } from '@/composables/useToast'
import { formatJobSalary, oobsApi, oobLabels, type CandidateSavedJob } from '@/services/oobs'
import { oobAreaStyle } from '@/utils/oobAreaStyle'
import { vacancyInitials } from '@/utils/vacancyInitials'

const savedJobs = ref<CandidateSavedJob[]>([])
const loading = ref(true)
const busyId = ref('')
const error = ref('')
const { notify } = useToast()
const search = ref('')
const availability = ref('all')
const workMode = ref('all')
const workModes = Object.entries(oobLabels.workMode)

const filteredJobs = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('es')
  return savedJobs.value.filter(({ oob, available }) => {
    const matchesSearch = !query || [oob.title, oob.company.name, oob.professionalArea.name, oob.municipality?.name, oob.department?.name]
      .filter(Boolean).join(' ').toLocaleLowerCase('es').includes(query)
    const matchesAvailability = availability.value === 'all'
      || (availability.value === 'available' ? available : !available)
    const matchesMode = workMode.value === 'all' || oob.workMode === workMode.value
    return matchesSearch && matchesAvailability && matchesMode
  })
})

async function load() {
  error.value = ''
  try { savedJobs.value = (await oobsApi.candidateSavedJobs()).savedJobs }
  catch (e) { error.value = e instanceof Error ? e.message : 'No se pudieron cargar tus vacantes guardadas.' }
  finally { loading.value = false }
}

async function remove(id: string) {
  const previous = savedJobs.value
  const removedJob = previous.find(saved => saved.oob.id === id)
  if (!removedJob) return
  busyId.value = id
  error.value = ''
  savedJobs.value = previous.filter(saved => saved.oob.id !== id)
  try { await oobsApi.unsave(id); notify('Vacante quitada', 'Se eliminó de tus vacantes guardadas.') }
  catch (e) {
    savedJobs.value = previous
    notify('No se pudo quitar la vacante', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error')
  }
  finally { busyId.value = '' }
}

onMounted(load)
</script>

<template>
  <WorkspaceFrame eyebrow="Mi actividad" title="Vacantes guardadas" subtitle="Ofertas que conservaste para revisar y comparar después." initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/jobs">Explorar vacantes</RouterLink></template>
    <AppMessage v-if="error" variant="error" title="No se pudieron cargar tus vacantes guardadas" :message="error" />
    <AppMessage v-if="loading" variant="loading" message="Cargando vacantes…" />

    <section v-if="!loading" class="workspace__card workspace__section candidate-saved">
      <AppEmptyState v-if="!savedJobs.length" title="Todavía no tienes vacantes guardadas" description="Guarda las ofertas que te interesen y podrás encontrarlas aquí."><template #actions><RouterLink to="/jobs">Explorar vacantes</RouterLink></template></AppEmptyState>
      <template v-else>
        <div class="candidate-saved__overview">
          <p><strong>{{ savedJobs.length }}</strong> {{ savedJobs.length === 1 ? 'vacante guardada' : 'vacantes guardadas' }}</p>
          <span>{{ filteredJobs.length === savedJobs.length ? 'Tu lista para revisar después' : `${filteredJobs.length} resultados con estos filtros` }}</span>
        </div>

        <div class="candidate-saved__filters" role="search" aria-label="Filtrar vacantes guardadas">
          <label class="candidate-saved__search">
            <span>Buscar</span>
            <input v-model="search" type="search" placeholder="Puesto, empresa o ubicación" />
          </label>
          <label>
            <span>Disponibilidad</span>
            <select v-model="availability">
              <option value="all">Todas</option>
              <option value="available">Disponibles</option>
              <option value="closed">No disponibles</option>
            </select>
          </label>
          <label>
            <span>Modalidad</span>
            <select v-model="workMode">
              <option value="all">Todas</option>
              <option v-for="[value, label] in workModes" :key="value" :value="value">{{ label }}</option>
            </select>
          </label>
        </div>

        <div v-if="filteredJobs.length" class="candidate-saved__list" aria-live="polite">
          <article v-for="saved in filteredJobs" :key="saved.oob.id" class="candidate-saved__row">
            <div class="candidate-saved__content">
              <div class="candidate-saved__heading">
                <span class="candidate-saved__oob-mark vacancy-mark" :style="oobAreaStyle(saved.oob.professionalArea.name, saved.oob.id)" aria-hidden="true">{{ vacancyInitials(saved.oob.title) }}</span>
                <div class="candidate-saved__identity">
                  <RouterLink v-if="saved.available" :to="`/jobs/${saved.oob.id}`" class="saved-oob__title">{{ saved.oob.title }}</RouterLink>
                  <strong v-else class="saved-oob__title saved-oob__title--unavailable">{{ saved.oob.title }}</strong>
                  <span class="candidate-saved__company">{{ saved.oob.company.name }} · {{ saved.oob.professionalArea.name }}</span>
                </div>
                <span class="candidate-saved__availability" :class="{ 'candidate-saved__availability--closed': !saved.available }">
                  {{ saved.available ? 'Disponible' : 'Cerrada' }}
                </span>
              </div>
              <div class="candidate-saved__details">
                <span>{{ [saved.oob.municipality?.name, saved.oob.department?.name].filter(Boolean).join(', ') || 'Ubicación no especificada' }}</span>
                <span>{{ oobLabels.workMode[saved.oob.workMode] ?? saved.oob.workMode }} · {{ oobLabels.contract[saved.oob.contractType] ?? saved.oob.contractType }}</span>
                <span>{{ formatJobSalary(saved.oob) }}</span>
              </div>
              <span class="candidate-saved__date">Guardada el {{ new Date(saved.createdAt).toLocaleDateString('es-NI') }}</span>
            </div>
            <div class="candidate-saved__actions">
              <RouterLink v-if="saved.available" :to="`/jobs/${saved.oob.id}`">Ver oferta <span aria-hidden="true">→</span></RouterLink>
              <button class="saved-oob__remove" type="button" :disabled="Boolean(busyId)" @click="remove(saved.oob.id)">{{ busyId === saved.oob.id ? 'Quitando…' : 'Quitar' }}</button>
            </div>
          </article>
        </div>
        <AppEmptyState v-else title="No hay vacantes que coincidan" description="Prueba con otro término o cambia los filtros."><template #actions><button type="button" @click="search = ''; availability = 'all'; workMode = 'all'">Limpiar filtros</button></template></AppEmptyState>
      </template>
    </section>
  </WorkspaceFrame>
</template>

<style scoped>
.candidate-saved__overview{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:-.2rem 0 1rem;padding:.9rem 1rem;background:linear-gradient(100deg,color-mix(in srgb,var(--primary) 13%,var(--surface)),color-mix(in srgb,var(--palette-ice) 62%,var(--surface)));color:var(--muted-foreground)}
.candidate-saved__overview p{margin:0;font-size:.84rem}.candidate-saved__overview strong{color:var(--primary);font-size:1.05rem}.candidate-saved__overview>span{font-size:.74rem}
.candidate-saved__filters{display:grid;grid-template-columns:minmax(13rem,1fr) minmax(9rem,.38fr) minmax(9rem,.38fr);gap:.8rem 1rem;align-items:end;padding:0 0 1.1rem;border-bottom:1px solid var(--border)}
.candidate-saved__filters label{display:grid;gap:.35rem;min-width:0}.candidate-saved__filters label>span{color:var(--muted-foreground);font-size:.68rem;font-weight:800;letter-spacing:.04em}.candidate-saved__filters input,.candidate-saved__filters select{width:100%;height:2.7rem;padding:0 .8rem;border:0;border-bottom:2px solid transparent;border-radius:0;background:color-mix(in srgb,var(--palette-ice) 52%,var(--surface));color:var(--foreground);font:inherit;font-size:.78rem;transition:background .16s,border-color .16s}.candidate-saved__filters input:focus,.candidate-saved__filters select:focus{border-bottom-color:var(--primary);background:color-mix(in srgb,var(--primary) 8%,var(--surface));outline:0}
.candidate-saved__list{display:grid;grid-template-columns:minmax(0,1fr);min-width:0}.candidate-saved__row{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:1.5rem;padding:1.25rem .7rem;margin:0 -.7rem;transition:background .16s}.candidate-saved__row:hover{background:color-mix(in srgb,var(--palette-ice) 48%,transparent)}.candidate-saved__row+.candidate-saved__row{margin-top:.2rem}.candidate-saved__content{min-width:0;flex:1}.candidate-saved__heading{display:flex;min-width:0;align-items:center;gap:.85rem}.candidate-saved__identity{min-width:0;flex:1}.saved-oob__title{display:block;overflow:hidden;color:var(--foreground);font:800 1rem Manrope,sans-serif;text-overflow:ellipsis;white-space:nowrap}.saved-oob__title:hover{color:var(--primary)}.saved-oob__title--unavailable{color:var(--muted-foreground)}.candidate-saved__company{display:block;margin-top:.23rem;color:var(--muted-foreground);font-size:.78rem}.candidate-saved__availability{display:inline-flex;flex:none;align-items:center;gap:.38rem;color:#13734f;font-size:.7rem;font-weight:800;white-space:nowrap}.candidate-saved__availability:before{width:.48rem;height:.48rem;border-radius:50%;background:#25a36f;content:""}.candidate-saved__availability--closed{color:var(--muted-foreground)}.candidate-saved__availability--closed:before{background:var(--muted-foreground)}.candidate-saved__details{display:flex;flex-wrap:wrap;gap:.35rem 1.25rem;margin-top:.7rem;color:var(--muted-foreground);font-size:.74rem}.candidate-saved__details span+span:before{content:'·';margin-right:1.25rem;color:var(--primary)}.candidate-saved__details span:last-child{color:var(--palette-ink);font-weight:800}.candidate-saved__date{display:block;margin-top:.6rem;color:var(--muted-foreground);font-size:.67rem}.candidate-saved__actions{display:flex;flex:none;align-items:center;gap:1rem}.candidate-saved__actions>a{display:inline-flex;align-items:center;gap:.35rem;color:var(--primary);font-size:.77rem;font-weight:800;white-space:nowrap}.candidate-saved__actions>a span{font-size:1rem;transition:transform .15s}.candidate-saved__actions>a:hover span{transform:translateX(2px)}.saved-oob__remove{min-height:2.15rem;padding:.35rem 0;border:0;border-radius:0;background:transparent;color:var(--muted-foreground);font:inherit;font-size:.74rem;font-weight:750;cursor:pointer;transition:color .16s}.saved-oob__remove:hover{color:#b33d49}.saved-oob__remove:disabled{opacity:.5}.candidate-saved__empty,.candidate-saved__no-results{padding:1.6rem .25rem;color:var(--foreground)}.candidate-saved__empty p,.candidate-saved__no-results p{margin:.4rem 0;color:var(--muted-foreground);font-size:.8rem}.candidate-saved__empty a,.candidate-saved__no-results button{display:inline-block;margin-top:.55rem;padding:0;border:0;background:none;color:var(--primary);font:inherit;font-size:.78rem;font-weight:800;cursor:pointer}
@media(max-width:700px){.candidate-saved__filters{grid-template-columns:repeat(2,minmax(0,1fr))}.candidate-saved__search{grid-column:1/-1}.candidate-saved__row{display:grid;grid-template-columns:minmax(0,1fr);gap:.75rem;padding:1rem .7rem}.candidate-saved__content{width:100%;min-width:0}.candidate-saved__heading{display:grid;grid-template-columns:3rem minmax(0,1fr);align-items:start;gap:.55rem .75rem}.candidate-saved__oob-mark{grid-row:span 2}.candidate-saved__identity{grid-column:2}.candidate-saved__availability{grid-column:2;justify-self:start}.candidate-saved__company,.candidate-saved__details span{overflow-wrap:anywhere}.candidate-saved__actions{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:.5rem}.candidate-saved__actions>a{min-height:2.75rem;justify-content:center;padding:.45rem .7rem;border:1px solid var(--primary);text-align:center;white-space:normal}.saved-oob__remove{min-height:2.75rem;padding:.45rem .65rem}.candidate-saved__details{gap:.35rem .75rem}.candidate-saved__details span+span:before{margin-right:.75rem}}
@media(max-width:440px){.candidate-saved__overview{align-items:flex-start;flex-direction:column;gap:.25rem}.candidate-saved__filters{grid-template-columns:1fr}.candidate-saved__search{grid-column:auto}.candidate-saved__heading{gap:.45rem .65rem}.candidate-saved__row{gap:.65rem}.candidate-saved__actions{font-size:.7rem}}
</style>

<style scoped>
.candidate-saved__oob-mark{display:grid;width:3rem;height:3rem;flex:none;place-items:center;background:linear-gradient(145deg,color-mix(in srgb,var(--oob-accent) 80%,white),var(--oob-accent));color:white;font:800 1rem Manrope,sans-serif}
</style>
