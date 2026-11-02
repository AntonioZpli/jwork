<script setup lang="ts">
import { computed, ref } from 'vue'
type CandidateCredentialsData = {
  experiences: { position: string; company: string; startDate: string; endDate: string | null; description: string | null }[]
  education: { institution: string; degree: string; startDate: string | null; endDate: string | null }[]
  languages: { level: string; language: { name: string } }[]
}

const props = withDefaults(defineProps<{ candidate: CandidateCredentialsData; showLanguages?: boolean }>(), { showLanguages: true })
const showAllExperiences = ref(false)
const visibleExperiences = computed(() => showAllExperiences.value ? props.candidate.experiences : props.candidate.experiences.slice(0, 3))
const hasMoreExperiences = computed(() => props.candidate.experiences.length > 3 || props.candidate.experiences.slice(0, 3).some(item => (item.description?.length ?? 0) > 180))
const levelLabels: Record<string, string> = { BASIC: 'Básico', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado', NATIVE: 'Nativo' }
function dateLabel(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const yearOnly = date.getUTCDate() === 15 && (month === 1 || month === 12)
  if (yearOnly) return String(year)
  const monthLabel = new Intl.DateTimeFormat('es-NI', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', '')
  return `${monthLabel} ${year}`
}
</script>

<template>
  <div v-if="candidate.experiences.length || candidate.education.length || (props.showLanguages && candidate.languages.length)" class="candidate-credentials">
    <section v-if="candidate.experiences.length" class="candidate-credentials__experience"><h3>Experiencia</h3><article v-for="(item,index) in visibleExperiences" :key="`${item.company}-${item.position}-${index}`"><strong>{{ item.position }}</strong><span>{{ item.company }} · {{ dateLabel(item.startDate) }}–{{ dateLabel(item.endDate) ?? 'Actualidad' }}</span><p v-if="item.description" :class="{ 'is-expanded': showAllExperiences }">{{ item.description }}</p></article><button v-if="hasMoreExperiences" class="candidate-credentials__more" type="button" @click="showAllExperiences = !showAllExperiences">{{ showAllExperiences ? 'Ver menos' : 'Ver más experiencia' }}</button></section>
    <section v-if="candidate.education.length"><h3>Formación</h3><article v-for="(item,index) in candidate.education" :key="`${item.institution}-${item.degree}-${index}`"><strong>{{ item.degree }}</strong><span>{{ item.institution }}<template v-if="dateLabel(item.startDate) || dateLabel(item.endDate)"> · {{ dateLabel(item.startDate) ?? '' }}–{{ dateLabel(item.endDate) ?? 'En curso' }}</template></span></article></section>
    <section v-if="props.showLanguages && candidate.languages.length"><h3>Idiomas</h3><ul><li v-for="item in candidate.languages" :key="item.language.name">{{ item.language.name }} <span>{{ levelLabels[item.level] ?? item.level }}</span></li></ul></section>
  </div>
  <p v-else class="candidate-credentials__empty">{{ props.showLanguages ? 'Aún no se ha añadido experiencia, formación ni idiomas.' : 'Aún no se ha añadido experiencia ni formación.' }}</p>
</template>

<style scoped>
.candidate-credentials{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem;width:100%;margin:.55rem 0}
.candidate-credentials section{min-width:0;padding:.8rem;border:1px solid var(--border);border-radius:.7rem;background:color-mix(in srgb,var(--panel) 45%,var(--surface))}
.candidate-credentials section:first-child:nth-last-child(1){grid-column:1/-1}
.candidate-credentials h3{margin:0 0 .55rem;color:var(--muted-foreground);font-size:.65rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}
.candidate-credentials article{display:grid;gap:.18rem;padding:.48rem 0;border-top:1px solid var(--border)}
.candidate-credentials article:first-of-type{padding-top:0;border-top:0}
.candidate-credentials article strong{font-size:.76rem}
.candidate-credentials article span,.candidate-credentials article p{margin:0;color:var(--muted-foreground);font-size:.7rem;line-height:1.5}
.candidate-credentials article p:not(.is-expanded){display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:3}
.candidate-credentials ul{display:flex;flex-wrap:wrap;gap:.4rem;margin:0;padding:0;list-style:none}
.candidate-credentials li{padding:.35rem .5rem;border-radius:999px;background:var(--surface);font-size:.68rem;font-weight:750}
.candidate-credentials li span{color:var(--muted-foreground);font-weight:500}
.candidate-credentials__empty{margin:.4rem 0;color:var(--muted-foreground);font-size:.72rem}
.candidate-credentials__more{margin-top:.55rem;padding:0;border:0;background:transparent;color:var(--primary);font:inherit;font-size:.72rem;font-weight:800;cursor:pointer}
@media(max-width:650px){.candidate-credentials{grid-template-columns:1fr}}
</style>
