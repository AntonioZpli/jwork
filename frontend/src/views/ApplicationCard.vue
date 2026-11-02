<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowRight, BriefcaseBusiness, FileText, GraduationCap, Languages, MapPin } from 'lucide-vue-next'
import { candidateFileUrl } from '@/services/profiles'
import type { AppRow } from './applicationStatus'
import { candidateArea, candidateLocation } from './applicationStatus'
import ApplicationStatusPanel from './ApplicationStatusPanel.vue'

const props = withDefaults(defineProps<{
  application: AppRow
  actionable?: boolean
  busy?: boolean
}>(), {
  actionable: false,
  busy: false,
})

const emit = defineEmits<{
  open: []
  advance: [status: AppRow['_nextStatus']]
  reject: []
  undo: []
}>()

const photoFailed = ref(false)
watch(() => props.application.candidateProfile.photoUrl, () => { photoFailed.value = false })

const fullName = computed(() => `${props.application.candidateProfile.firstName} ${props.application.candidateProfile.lastName}`.trim())
const experience = computed(() => props.application.candidateProfile.experiences[0])
const education = computed(() => props.application.candidateProfile.education[0])
const languages = computed(() => props.application.candidateProfile.languages.slice(0, 3).map(item => item.language.name).join(' · '))

function advance() {
  if (props.application._nextStatus) emit('advance', props.application._nextStatus)
}
</script>

<template>
  <article class="applicant-card" :class="{ 'applicant-card--actionable': actionable }">
    <header class="applicant-card__header">
      <span class="applicant-card__avatar" aria-hidden="true">
        <img
          v-if="application.candidateProfile.photoUrl && !photoFailed"
          :src="candidateFileUrl('photo', application.candidateProfile.photoUrl)"
          alt=""
          crossorigin="use-credentials"
          @error="photoFailed = true"
        >
        <span v-else>{{ application.candidateProfile.firstName.charAt(0) }}{{ application.candidateProfile.lastName.charAt(0) }}</span>
      </span>

      <div class="applicant-card__identity">
        <h2>{{ fullName }}</h2>
        <p class="applicant-card__area"><BriefcaseBusiness :size="16" aria-hidden="true" />{{ candidateArea(application) }}</p>
        <p class="applicant-card__location"><MapPin :size="16" aria-hidden="true" />{{ candidateLocation(application) }}</p>
        <p v-if="actionable" class="applicant-card__job"><BriefcaseBusiness :size="16" aria-hidden="true" />{{ application.job.title }}</p>
      </div>

      <button v-if="!actionable" class="workspace__cta applicant-card__open" type="button" @click="emit('open')">
        Ver perfil <ArrowRight :size="17" aria-hidden="true" />
      </button>
    </header>

    <dl class="applicant-card__details">
      <div>
        <dt><BriefcaseBusiness :size="16" aria-hidden="true" />Experiencia reciente</dt>
        <dd>{{ experience ? `${experience.position} · ${experience.company}` : 'Sin experiencia registrada' }}</dd>
      </div>
      <div>
        <dt><GraduationCap :size="16" aria-hidden="true" />Formación</dt>
        <dd>{{ education ? `${education.degree} · ${education.institution}` : 'Sin formación registrada' }}</dd>
      </div>
      <div>
        <dt><Languages :size="16" aria-hidden="true" />Idiomas</dt>
        <dd>{{ languages || 'Sin idiomas registrados' }}</dd>
      </div>
      <div>
        <dt><FileText :size="16" aria-hidden="true" />Currículum</dt>
        <dd>{{ application.candidateProfile.cvUrl ? 'Disponible en el perfil' : 'No adjuntado' }}</dd>
      </div>
    </dl>

    <ApplicationStatusPanel
      v-if="actionable"
      :application="application"
      :busy="busy"
      @advance="advance"
      @reject="emit('reject')"
      @undo="emit('undo')"
      @open="emit('open')"
    />
  </article>
</template>

<style scoped>
.applicant-card{min-width:0;padding:1.2rem;border:1px solid color-mix(in srgb,var(--border) 82%,#9aaec5);border-radius:1rem;background:var(--surface);box-shadow:0 3px 10px rgb(22 40 66 / 3%),0 12px 30px rgb(22 40 66 / 4%);transition:border-color .18s,box-shadow .18s}
.applicant-card:hover{border-color:color-mix(in srgb,var(--primary) 30%,var(--border));box-shadow:0 8px 25px rgb(22 40 66 / 7%)}
.applicant-card__header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:1rem;min-width:0;padding-bottom:1.1rem;border-bottom:1px solid var(--border)}
.applicant-card__avatar{display:grid;width:clamp(4.5rem,8vw,6.5rem);height:clamp(4.5rem,8vw,6.5rem);aspect-ratio:1;flex:none;place-items:center;overflow:hidden;border:1px solid var(--border);border-radius:50%;background:color-mix(in srgb,var(--primary) 10%,var(--surface));color:var(--primary);font:800 1.1rem Manrope,sans-serif}
.applicant-card__avatar img{display:block;width:100%;height:100%;aspect-ratio:1;border-radius:50%;object-fit:cover;object-position:50% 42%}
.applicant-card__avatar,.applicant-card__avatar img{border-radius:50%!important}
.applicant-card__identity{display:grid;align-content:center;gap:.32rem;min-width:0;min-height:5rem;padding-left:1.35rem;border-left:1px solid var(--border)}
.applicant-card__identity h2{overflow-wrap:anywhere;margin:0;color:var(--foreground);font:800 clamp(1rem,1.6vw,1.25rem)/1.3 Manrope,sans-serif;letter-spacing:-.025em}
.applicant-card__identity p{display:flex;align-items:flex-start;gap:.55rem;margin:.1rem 0 0;color:var(--muted-foreground);font-size:.84rem;line-height:1.45}
.applicant-card__identity p svg{flex:none;color:var(--primary);stroke-width:2.5}
.applicant-card__area{font-weight:700}
.applicant-card__job{font-weight:700}
.applicant-card__open{display:inline-flex;align-items:center;gap:.5rem;min-height:2.75rem;padding-inline:1rem;border-radius:.7rem;background:linear-gradient(110deg,var(--palette-ink),var(--primary));white-space:nowrap}
.applicant-card__open:hover{filter:brightness(1.08)}
.applicant-card__details{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:1rem 0 0}
.applicant-card__details>div{display:grid;align-content:start;gap:.35rem;min-width:0;padding:.1rem 1rem}
.applicant-card__details>div:first-child{padding-left:.2rem}
.applicant-card__details>div+div{border-left:1px solid var(--border)}
.applicant-card__details dt{display:flex;align-items:center;gap:.65rem;color:var(--primary);font-size:.78rem;font-weight:750}
.applicant-card__details dt svg{flex:none;color:var(--palette-ink);stroke-width:2.7}
.applicant-card__details dd{overflow-wrap:anywhere;margin:0 0 0 1.9rem;color:var(--muted-foreground);font-size:.78rem;line-height:1.45}
.applicant-card--actionable{display:grid;grid-template-columns:minmax(0,1fr) minmax(14rem,.34fr);align-items:stretch;column-gap:1.25rem}
.applicant-card--actionable .applicant-card__header,.applicant-card--actionable .applicant-card__details{grid-column:1;min-width:0}
.applicant-card--actionable :deep(.application-status){grid-area:1/2/span 2;align-content:center;align-self:stretch;margin:0;padding:0 0 0 1.1rem;border-left:1px solid var(--border);border-radius:0;background:transparent}
@media(max-width:980px){.applicant-card--actionable{grid-template-columns:minmax(0,1fr)}.applicant-card--actionable :deep(.application-status){grid-area:auto/1;margin-top:1rem;padding:1rem 0 0;border-top:1px solid var(--border);border-left:0}}
@media(max-width:850px){.applicant-card__details{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:.9rem}.applicant-card__details>div:nth-child(3){padding-left:.2rem;border-left:0}.applicant-card__details>div:nth-child(2n){border-left:1px solid var(--border)}}
@media(max-width:560px){.applicant-card{padding:1rem}.applicant-card__header{grid-template-columns:auto minmax(0,1fr);gap:.75rem}.applicant-card__avatar{width:4rem;height:4rem}.applicant-card__identity{min-height:4rem;padding-left:.8rem}.applicant-card__identity p{font-size:.74rem}.applicant-card__open{grid-column:1/-1;width:100%;justify-content:center}.applicant-card__details{grid-template-columns:1fr;gap:.7rem}.applicant-card__details>div,.applicant-card__details>div:first-child,.applicant-card__details>div:nth-child(3){padding:.55rem 0;border-bottom:1px solid var(--border);border-left:0}.applicant-card__details>div:last-child{border-bottom:0}}
@media(prefers-reduced-motion:reduce){.applicant-card{transition:none}}
</style>
