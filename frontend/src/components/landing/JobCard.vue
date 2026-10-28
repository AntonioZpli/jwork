<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { PublicJob } from '@/services/jobs'
import type { Job } from '@/types/job'
import { MapPin, ArrowRight, Briefcase, FileText } from '@lucide/vue'
import { formatJobSalary } from '@/services/jobs'

const props = defineProps<{ job: Job | PublicJob }>()
const isPublicJob = computed(() => 'professionalArea' in props.job)
const companyName = computed(() => isPublicJob.value ? (props.job as PublicJob).company.name : (props.job as Job).company)
const companyInitial = computed(() => isPublicJob.value ? companyName.value.slice(0, 1).toUpperCase() : (props.job as Job).initials)
const category = computed(() => isPublicJob.value ? (props.job as PublicJob).professionalArea.name : (props.job as Job).category)
const location = computed(() => isPublicJob.value ? ([((props.job as PublicJob).municipality?.name), ((props.job as PublicJob).department?.name)].filter(Boolean).join(', ') || 'Ubicación no especificada') : (props.job as Job).location)
const modality = computed(() => isPublicJob.value ? ({ ONSITE: 'Presencial', HYBRID: 'Híbrido', REMOTE: 'Remoto' } as Record<string, string>)[(props.job as PublicJob).workMode] ?? (props.job as PublicJob).workMode : (props.job as Job).modality)
const contract = computed(() => isPublicJob.value ? ({ PERMANENT: 'Permanente', TEMPORARY: 'Temporal', CONTRACT: 'Por contrato', INTERNSHIP: 'Pasantía' } as Record<string, string>)[(props.job as PublicJob).contractType] ?? (props.job as PublicJob).contractType : (props.job as Job).contract)
const avatarClass = computed(() => isPublicJob.value ? '' : `avatar--${(props.job as Job).avatarVariant}`)
const cardVariant = computed(() => isPublicJob.value ? 'public' : (props.job as Job).avatarVariant)
const jobHref = computed(() => isPublicJob.value ? `/jobs/${(props.job as PublicJob).id}` : '')
const salary = computed(() => isPublicJob.value ? formatJobSalary(props.job as PublicJob) : '')
</script>

<template>
  <article class="job-card" :class="[`job-card--${cardVariant}`, { 'job-card--linked': isPublicJob }]" :aria-label="`${job.title} en ${companyName}`">
    <div class="job-card__banner">
      <svg class="job-card__connection" viewBox="0 0 180 116" fill="none" aria-hidden="true">
        <path d="M18 91h35l18-19h28l20-22h42" />
        <circle cx="18" cy="91" r="4" />
        <circle cx="71" cy="72" r="4" />
        <circle cx="119" cy="50" r="4" />
        <circle cx="161" cy="50" r="5" />
      </svg>
      <div class="job-card__top">
        <div :class="['avatar', avatarClass]" aria-hidden="true">{{ companyInitial }}</div>
        <div class="job-card__company-info">
          <span class="job-card__company-name">{{ companyName }}</span>
          <span class="job-card__category">{{ category }}</span>
        </div>
      </div>
      <span class="job-card__accent" aria-hidden="true"></span>
      <h3 class="job-card__title">{{ job.title }}</h3>
    </div>
    <div class="job-card__details">
      <div class="job-card__location"><span class="job-card__detail-icon"><MapPin :size="16" aria-hidden="true" /></span><span><small>Ubicación</small><strong>{{ location }}</strong></span></div>
      <ul class="job-card__meta" aria-label="Condiciones del puesto">
        <li class="job-card__meta-item"><Briefcase :size="14" aria-hidden="true" />{{ modality }}</li>
        <li class="job-card__meta-item"><FileText :size="14" aria-hidden="true" />{{ contract }}</li>
      </ul>
      <div class="job-card__footer">
        <strong v-if="salary" class="job-card__salary">{{ salary }}</strong>
        <RouterLink v-if="isPublicJob" :to="jobHref" class="job-card__link" :aria-label="`Ver oferta: ${job.title} en ${companyName}`">Ver oferta <ArrowRight :size="15" aria-hidden="true" /></RouterLink>
        <RouterLink v-else to="/auth" class="job-card__link" :aria-label="`Ver más sobre ${job.title}; inicia sesión`">Ver más <ArrowRight :size="15" aria-hidden="true" /></RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.job-card{--card-accent:#8dc5ff;display:flex;min-width:0;min-height:19rem;flex-direction:column;overflow:hidden;border:1px solid #d7e4f4;border-radius:1rem;background:var(--surface);box-shadow:0 8px 22px rgb(16 35 58 / 5%);transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}
.job-card--violet,.job-card--deep,.job-card--soft,.job-card--muted,.job-card--public{--card-accent:#8dc5ff}
.job-card:hover{border-color:#a9c9ed;box-shadow:0 14px 30px rgb(16 35 58 / 9%)}
.job-card--linked:hover{transform:translateY(-3px);border-color:#8db8e8;box-shadow:0 16px 32px rgb(16 35 58 / 12%)}
.job-card:focus-within{outline:2px solid var(--primary);outline-offset:3px;box-shadow:0 12px 28px rgb(16 35 58 / 10%)}
.job-card__banner{position:relative;isolation:isolate;overflow:hidden;min-height:9.3rem;padding:1.15rem 1.2rem 1rem;background:linear-gradient(118deg,#102b4a 0%,#174675 58%,#1769a7 100%);color:#fff}
.job-card__banner::before{position:absolute;z-index:-1;top:0;left:0;width:100%;height:3px;background:var(--card-accent);content:""}
.job-card__banner::after{position:absolute;z-index:-1;inset:0;background-image:linear-gradient(rgb(255 255 255 / 3%) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255 / 3%) 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(110deg,transparent 28%,#000 100%);content:"";pointer-events:none}
.job-card__connection{position:absolute;z-index:-1;top:.1rem;right:.2rem;width:10rem;height:6.5rem;overflow:visible;opacity:.66}
.job-card__connection path{stroke:rgb(178 220 255 / 52%);stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:150;stroke-dashoffset:0;transition:stroke-dashoffset .45s ease,stroke .25s ease}
.job-card__connection circle{fill:#b9e3ff;stroke:#2d75ad;stroke-width:2;transform-box:fill-box;transform-origin:center;transition:transform .22s ease,fill .22s ease}
.job-card:hover .job-card__connection path,.job-card:focus-within .job-card__connection path{stroke:#c7e8ff;stroke-dashoffset:-18}
.job-card:hover .job-card__connection circle,.job-card:focus-within .job-card__connection circle{fill:#fff;transform:scale(1.16)}
.job-card__top{position:relative;display:flex;align-items:center;gap:.7rem;min-width:0}
.job-card__company-info{display:flex;min-width:0;flex-direction:column;gap:.15rem}
.job-card__company-name{overflow:hidden;color:#fff;font-size:.88rem;font-weight:750;text-overflow:ellipsis;white-space:nowrap}
.job-card__category{color:var(--card-accent);font-size:.64rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}
.avatar{display:grid;width:2.65rem;height:2.65rem;flex:none;place-items:center;border:1px solid rgb(255 255 255 / 23%);border-radius:.8rem;background:rgb(255 255 255 / 12%);color:#fff;font-size:.9rem;font-weight:850;letter-spacing:.02em;backdrop-filter:blur(8px)}
.job-card--deep .avatar,.job-card--soft .avatar,.job-card--muted .avatar{background:rgb(255 255 255 / 12%);color:#fff}
.job-card__accent{position:absolute;top:1.05rem;right:1.1rem;width:.55rem;height:.55rem;border-radius:50%;background:var(--card-accent);box-shadow:0 0 0 .3rem color-mix(in srgb,var(--card-accent) 16%,transparent)}
.job-card__title{position:relative;max-width:22rem;margin:1rem 0 0;color:#fff;font:800 1.12rem/1.28 Manrope,sans-serif;letter-spacing:-.025em}
.job-card__details{display:flex;flex:1;flex-direction:column;gap:.95rem;padding:1.05rem 1.2rem 1.15rem}
.job-card__location{display:flex;align-items:center;gap:.65rem;min-width:0}
.job-card__detail-icon{display:grid;width:2.15rem;height:2.15rem;flex:none;place-items:center;border:1px solid #dce9f8;border-radius:.65rem;background:#f0f6ff;color:#1769c2}
.job-card__location>span:last-child{display:grid;min-width:0;gap:.08rem}
.job-card__location small{color:#71839b;font-size:.65rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.job-card__location strong{overflow:hidden;color:#19334f;font-size:.82rem;font-weight:750;text-overflow:ellipsis;white-space:nowrap}
.job-card__meta{display:flex;flex-wrap:wrap;gap:.4rem;margin:0;padding:0;list-style:none}
.job-card__meta-item{display:inline-flex;min-height:1.85rem;align-items:center;gap:.35rem;padding:.3rem .55rem;border:1px solid #dce8f6;border-radius:.55rem;background:#f3f7fc;color:#38516e;font-size:.69rem;font-weight:750}
.job-card__meta-item svg{flex:none;color:#1769c2}
.job-card__footer{display:flex;align-items:center;justify-content:space-between;gap:.55rem;margin-top:auto;padding-top:.85rem;border-top:1px solid #e8eef6}
.job-card__salary{color:#19334f;font-size:.8rem;font-weight:850}
.job-card__link{display:inline-flex;min-height:2.15rem;align-items:center;justify-content:center;gap:.45rem;margin-left:auto;padding:.3rem .65rem .3rem .8rem;border:0;border-radius:.62rem;background:linear-gradient(100deg,#1769c2,#1356a2);color:#fff;font-size:.73rem;font-weight:800;white-space:nowrap;transition:background .2s ease,transform .2s ease,box-shadow .2s ease}
.job-card__link svg{width:16px;height:16px;padding:0;border-radius:0;background:transparent;transition:transform .18s}
.job-card__link:hover{transform:translateY(-1px);background:linear-gradient(100deg,#1356a2,#0e477f);box-shadow:0 6px 14px rgb(23 105 194 / 24%)}
.job-card__link:hover svg{transform:translateX(3px)}
.job-card__link:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
@media(max-width:560px){.job-card{min-height:0}.job-card__banner{min-height:8.8rem}.job-card__details{padding:1rem}}
@media(prefers-reduced-motion:reduce){.job-card,.job-card__link,.job-card__connection path,.job-card__connection circle{transition:none}.job-card--linked:hover{transform:none}.job-card__link:hover svg{transform:none}}
</style>
