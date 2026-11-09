<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowRight, BriefcaseBusiness, MapPin } from 'lucide-vue-next'
import { candidateFileUrl } from '@/services/profiles'
import type { AppRow } from './applicationStatus'
import { candidateArea, candidateLocation } from './applicationStatus'

const props = defineProps<{ application: AppRow }>()
const emit = defineEmits<{ open: [] }>()
const photoFailed = ref(false)

watch(() => props.application.candidateProfile.photoUrl, () => { photoFailed.value = false })

const fullName = computed(() => `${props.application.candidateProfile.firstName} ${props.application.candidateProfile.lastName}`.trim())
const experience = computed(() => props.application.candidateProfile.experiences[0])
</script>

<template>
  <article class="company-applicant-card">
    <header class="company-applicant-card__header">
      <span class="company-applicant-card__photo" aria-hidden="true">
        <img
          v-if="application.candidateProfile.photoUrl && !photoFailed"
          :src="candidateFileUrl('photo', application.candidateProfile.photoUrl)"
          alt=""
          crossorigin="use-credentials"
          @error="photoFailed = true"
        >
        <span v-else>{{ application.candidateProfile.firstName.charAt(0) }}{{ application.candidateProfile.lastName.charAt(0) }}</span>
      </span>

      <div class="company-applicant-card__identity">
        <h2>{{ fullName }}</h2>
        <p><BriefcaseBusiness :size="16" aria-hidden="true" />{{ candidateArea(application) }}</p>
        <p><MapPin :size="16" aria-hidden="true" />{{ candidateLocation(application) }}</p>
      </div>

    </header>

    <dl class="company-applicant-card__details">
      <div>
        <dt><BriefcaseBusiness :size="15" aria-hidden="true" />Experiencia reciente</dt>
        <dd>{{ experience ? `${experience.position} · ${experience.company}` : 'Sin experiencia registrada' }}</dd>
      </div>
    </dl>

    <footer class="company-applicant-card__footer">
      <button class="company-applicant-card__open" type="button" @click="emit('open')">Ver perfil <ArrowRight :size="16" aria-hidden="true" /></button>
    </footer>
  </article>
</template>

<style scoped>
.company-applicant-card{display:grid;gap:.8rem;min-width:0;padding:1rem 1.15rem;border:1px solid var(--border);background:var(--surface);transition:border-color .16s,box-shadow .16s}
.company-applicant-card:hover{border-color:color-mix(in srgb,var(--primary) 35%,var(--border));box-shadow:0 6px 18px rgb(26 47 79 / 5%)}
.company-applicant-card__header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:1rem;min-width:0}
.company-applicant-card__photo{display:grid;width:3.8rem;height:3.8rem;place-items:center;overflow:hidden;border:1px solid var(--border);border-radius:50%;background:var(--panel);color:var(--primary);font:800 1rem Manrope,sans-serif}
.company-applicant-card__photo img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 42%}
.company-applicant-card__identity{display:grid;gap:.3rem;min-width:0}
.company-applicant-card__identity h2{margin:0;color:var(--foreground);font:800 1rem/1.3 Manrope,sans-serif;letter-spacing:-.025em}
.company-applicant-card__identity p{display:flex;align-items:flex-start;gap:.5rem;margin:0;color:var(--muted-foreground);font-size:.78rem;line-height:1.4}
.company-applicant-card__identity p svg{flex:none;color:var(--primary)}
.company-applicant-card__open{display:inline-flex;align-items:center;gap:.4rem;min-height:2.4rem;padding:.45rem .9rem;border:1px solid transparent;border-radius:.75rem;background:linear-gradient(120deg,#2f5f52,#3e7f69);color:#fff;font:750 .78rem Manrope,sans-serif;white-space:nowrap;cursor:pointer;transition:background .16s,box-shadow .16s}
.company-applicant-card__open:hover{border-color:transparent;background:#234b40;box-shadow:0 5px 14px rgb(27 58 51 / 16%)}
.company-applicant-card__details{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;margin:0}
.company-applicant-card__details>div{display:grid;align-content:start;gap:.25rem;min-width:0}
.company-applicant-card__details dt{display:flex;align-items:center;gap:.45rem;color:var(--muted-foreground);font-size:.7rem;font-weight:750}
.company-applicant-card__details dt svg{flex:none;color:var(--primary)}
.company-applicant-card__details dd{overflow-wrap:anywhere;margin:0;color:var(--foreground);font-size:.75rem;line-height:1.4}
.company-applicant-card__footer{display:flex;justify-content:flex-end;padding-top:.55rem;border-top:1px solid var(--border)}
@media(max-width:520px){.company-applicant-card{padding:.85rem}.company-applicant-card__header{grid-template-columns:auto minmax(0,1fr);gap:.7rem}.company-applicant-card__photo{width:3.2rem;height:3.2rem}.company-applicant-card__open{justify-self:end}}
</style>
