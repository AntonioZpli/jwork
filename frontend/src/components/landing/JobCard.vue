<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { PublicJob } from '@/services/jobs'
import type { Job } from '@/types/job'
import { MapPin, ArrowRight, Briefcase, FileText } from '@lucide/vue'
import { formatJobSalary } from '@/services/oobs'
import { oobAreaStyle } from '@/utils/oobAreaStyle'
import { profileAvatarStyle } from '@/utils/profileAvatar'
import { vacancyInitials } from '@/utils/vacancyInitials'

const props = defineProps<{ job: Job | PublicJob; example?: boolean }>()
const emit = defineEmits<{ select: [id: string] }>()
const oob = computed(() => props.job)
const isPublicJob = computed(() => 'professionalArea' in props.job)
const companyName = computed(() => isPublicJob.value ? (props.job as PublicJob).company.name : (props.job as Job).company)
const vacancyInitial = computed(() => vacancyInitials(props.job.title))
const category = computed(() => isPublicJob.value ? (props.job as PublicJob).professionalArea.name : (props.job as Job).category)
const location = computed(() => isPublicJob.value ? ([((props.job as PublicJob).municipality?.name), ((props.job as PublicJob).department?.name)].filter(Boolean).join(', ') || 'Ubicación no especificada') : (props.job as Job).location)
const modality = computed(() => isPublicJob.value ? ({ ONSITE: 'Presencial', HYBRID: 'Híbrido', REMOTE: 'Remoto' } as Record<string, string>)[(props.job as PublicJob).workMode] ?? (props.job as PublicJob).workMode : (props.job as Job).modality)
const contract = computed(() => isPublicJob.value ? ({ PERMANENT: 'Permanente', TEMPORARY: 'Temporal', CONTRACT: 'Por contrato', INTERNSHIP: 'Pasantía' } as Record<string, string>)[(props.job as PublicJob).contractType] ?? (props.job as PublicJob).contractType : (props.job as Job).contract)
const avatarClass = computed(() => isPublicJob.value ? '' : `avatar--${(props.job as Job).avatarVariant}`)
const cardVariant = computed(() => isPublicJob.value ? 'public' : (props.job as Job).avatarVariant)
const salary = computed(() => isPublicJob.value ? formatJobSalary(props.job as PublicJob) : (props.job as Job).salaryLabel ?? '')
const companyMarkStyle = computed(() => profileAvatarStyle(companyName.value, category.value))
</script>

<template>
  <article class="oob-card" :class="[`oob-card--${cardVariant}`, { 'oob-card--linked': isPublicJob }]" :style="oobAreaStyle(category, oob.id)" :aria-label="`${oob.title} en ${companyName}`">
    <div class="oob-card__banner">
      <svg class="oob-card__connection" viewBox="0 0 180 116" fill="none" aria-hidden="true">
        <path d="M18 91h35l18-19h28l20-22h42" />
        <circle cx="18" cy="91" r="4" />
        <circle cx="71" cy="72" r="4" />
        <circle cx="119" cy="50" r="4" />
        <circle cx="161" cy="50" r="5" />
      </svg>
      <div class="oob-card__top">
        <div :class="['avatar', 'oob-card__vacancy-mark', 'vacancy-mark', avatarClass]" :style="isPublicJob ? companyMarkStyle : undefined" aria-hidden="true"><span>{{ vacancyInitial }}</span></div>
        <div class="oob-card__company-info">
          <span class="oob-card__company-name">{{ companyName }}</span>
          <span class="oob-card__category">{{ category }}</span>
        </div>
      </div>
      <span class="oob-card__accent" aria-hidden="true"></span>
      <h3 class="oob-card__title">{{ oob.title }}</h3>
    </div>
    <div class="oob-card__details">
      <ul class="oob-card__meta" aria-label="Condiciones del puesto">
        <li class="oob-card__meta-item"><Briefcase :size="14" aria-hidden="true" />{{ modality }}</li>
        <li class="oob-card__meta-item"><FileText :size="14" aria-hidden="true" />{{ contract }}</li>
      </ul>
      <div class="oob-card__location"><span class="oob-card__detail-icon"><MapPin :size="16" aria-hidden="true" /></span><span><small>Ubicación</small><strong>{{ location }}</strong></span></div>
      <div class="oob-card__footer">
        <strong v-if="salary" class="oob-card__salary">{{ salary }}</strong>
        <button v-if="isPublicJob" class="oob-card__link" type="button" :aria-label="`Ver oferta: ${oob.title} en ${companyName}`" @click="emit('select', (oob as PublicJob).id)">Ver oferta <ArrowRight :size="15" aria-hidden="true" /></button>
        <RouterLink v-else-if="example" to="/auth" class="oob-card__link" :aria-label="`Inicia sesión para ver la oferta ${oob.title}`">Ver oferta <ArrowRight :size="15" aria-hidden="true" /></RouterLink>
        <RouterLink v-else to="/auth" class="oob-card__link" :aria-label="`Ver más sobre ${oob.title}; inicia sesión`">Ver más <ArrowRight :size="15" aria-hidden="true" /></RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.oob-card{--card-accent:#8dc5ff;display:flex;min-width:0;min-height:19rem;flex-direction:column;overflow:hidden;border:0;border-radius:0;background:#fff;box-shadow:0 8px 24px rgb(16 35 68 / 8%);transition:transform .22s ease,box-shadow .22s ease}
.oob-card--violet,.oob-card--deep,.oob-card--soft,.oob-card--muted,.oob-card--public{--card-accent:#8dc5ff}
.oob-card:hover{box-shadow:0 12px 30px rgb(13 52 95 / 12%)}
.oob-card--linked:hover{transform:translateY(-3px);border-color:#8db8e8;box-shadow:0 16px 32px rgb(16 35 58 / 12%)}
.oob-card:focus-within{outline:0;box-shadow:0 12px 28px rgb(16 35 58 / 10%)}
.oob-card__banner{position:relative;isolation:isolate;overflow:hidden;min-height:0;padding:1.2rem 1.2rem .5rem;background:#fff;color:var(--foreground)}
.oob-card__banner::before{display:none}
.oob-card__banner::after{display:none}
.oob-card__connection{display:none}
.oob-card__connection path{stroke:rgb(178 220 255 / 52%);stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:150;stroke-dashoffset:0;transition:stroke-dashoffset .45s ease,stroke .25s ease}
.oob-card__connection circle{fill:#b9e3ff;stroke:#2d75ad;stroke-width:2;transform-box:fill-box;transform-origin:center;transition:transform .22s ease,fill .22s ease}
.oob-card:hover .oob-card__connection path,.oob-card:focus-within .oob-card__connection path{stroke:#c7e8ff;stroke-dashoffset:-18}
.oob-card:hover .oob-card__connection circle,.oob-card:focus-within .oob-card__connection circle{fill:#fff;transform:scale(1.16)}
.oob-card__top{position:relative;display:flex;align-items:center;gap:.7rem;min-width:0}
.oob-card__company-info{display:flex;min-width:0;flex-direction:column;gap:.15rem}
.oob-card__company-name{overflow:hidden;color:#19334f;font-size:.88rem;font-weight:800;text-overflow:ellipsis;white-space:nowrap}
.oob-card__category{color:#6d819c;font-size:.68rem;font-weight:650}
.avatar{display:grid;width:3.2rem;height:3.2rem;flex:none;place-items:center;border:0;border-radius:0;background:linear-gradient(135deg,#0f74e6,#0a5fc0);color:#fff;font-size:1.05rem;font-weight:850;letter-spacing:.02em}
.oob-card--deep .avatar,.oob-card--soft .avatar,.oob-card--muted .avatar{background:linear-gradient(135deg,#0f74e6,#0a5fc0);color:#fff}
.oob-card__accent{display:none}
.oob-card__title{position:relative;max-width:32rem;margin:.9rem 0 0;color:#10243d;font:800 1.2rem/1.28 Manrope,sans-serif;letter-spacing:-.025em}
.oob-card__details{display:flex;flex:1;flex-direction:column;gap:.55rem;padding:.4rem 1.2rem 1.15rem}
.oob-card__location{display:flex;align-items:center;gap:.65rem;min-width:0}
.oob-card__detail-icon{display:grid;width:1.4rem;height:1.4rem;flex:none;place-items:center;border:0;background:transparent;color:#1769c2}
.oob-card__location>span:last-child{display:grid;min-width:0;gap:.08rem}
.oob-card__location small{color:#71839b;font-size:.65rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.oob-card__location strong{overflow:hidden;color:#19334f;font-size:.82rem;font-weight:750;text-overflow:ellipsis;white-space:nowrap}
.oob-card__meta{display:flex;flex-wrap:wrap;gap:.4rem;margin:0;padding:0;list-style:none}
.oob-card__meta-item{display:inline-flex;min-height:1.85rem;align-items:center;gap:.35rem;padding:.3rem .55rem;border:0;border-radius:0;background:transparent;color:#183c6d;font-size:.76rem;font-weight:700}
.oob-card__meta-item svg{flex:none;color:#1769c2}
.oob-card__footer{display:flex;align-items:center;justify-content:space-between;gap:.55rem;margin-top:auto;padding-top:.85rem;border-top:1px solid #e8eef6}
.oob-card__salary{color:#0d5fc4;font-size:.88rem;font-weight:850}
.oob-card__link{display:inline-flex;min-height:2.15rem;align-items:center;justify-content:center;gap:.45rem;margin-left:auto;padding:.3rem .65rem .3rem .8rem;border:0;border-radius:.62rem;background:linear-gradient(100deg,#1769c2,#1356a2);color:#fff;font-size:.73rem;font-weight:800;white-space:nowrap;transition:background .2s ease,transform .2s ease,box-shadow .2s ease}
.oob-card__link svg{width:16px;height:16px;padding:0;border-radius:0;background:transparent;transition:transform .18s}
.oob-card__link:hover{transform:translateY(-1px);background:linear-gradient(100deg,#1356a2,#0e477f);box-shadow:0 6px 14px rgb(23 105 194 / 24%)}
.oob-card__link:hover svg{transform:translateX(3px)}
.oob-card__link:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
@media(max-width:560px){.oob-card{min-height:0}.oob-card__banner{min-height:8.8rem}.oob-card__details{padding:1rem}}
@media(prefers-reduced-motion:reduce){.oob-card,.oob-card__link,.oob-card__connection path,.oob-card__connection circle{transition:none}.oob-card--linked:hover{transform:none}.oob-card__link:hover svg{transform:none}}
</style>
