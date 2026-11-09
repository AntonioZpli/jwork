<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { PublicJob } from '@/services/jobs'
import type { Job } from '@/types/job'
import { MapPin, ArrowRight, Briefcase, FileText, CheckCircle2 } from '@lucide/vue'
import { formatJobSalary } from '@/services/oobs'
import { oobAreaStyle } from '@/utils/oobAreaStyle'
import { vacancyInitials } from '@/utils/vacancyInitials'

const props = defineProps<{ job: Job | PublicJob; example?: boolean; applied?: boolean }>()
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
const isVerifiedCompany = computed(() => isPublicJob.value && (props.job as PublicJob).company.verificationStatus === 'VERIFIED')
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
        <div :class="['avatar', 'oob-card__vacancy-mark', 'vacancy-mark', avatarClass]" aria-hidden="true"><span>{{ vacancyInitial }}</span></div>
        <div class="oob-card__company-info">
          <span class="oob-card__company-line"><span class="oob-card__company-name">{{ companyName }}</span><span v-if="isVerifiedCompany" class="oob-card__verified"><CheckCircle2 :size="13" aria-hidden="true" />Empresa verificada</span></span>
          <span class="oob-card__category">{{ category }}</span>
        </div>
      </div>
      <span class="oob-card__accent" aria-hidden="true"></span>
      <div class="oob-card__title-line"><h3 class="oob-card__title">{{ oob.title }}</h3><span v-if="applied" class="oob-card__applied">Ya postulaste</span></div>
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
.oob-card{--job-green-900:#0f2420;--job-green-800:#16302b;--job-green-700:#234640;--job-green-600:#35615a;--job-green-300:#8fb0a8;--job-green-100:#dce8e4;--job-terracotta-700:#8f3a2e;--job-terracotta-600:#b5483a;--job-terracotta-500:#d8695a;--job-cream-50:#fdf9f6;--job-cream-100:#f7ede6;--job-cream-200:#efdfd4;--job-cream-300:#e3cfc1;--job-text-secondary:#5f6f6b;--card-accent:var(--job-terracotta-600);position:relative;display:flex;min-width:0;min-height:19rem;flex-direction:column;overflow:hidden;border:1px solid var(--job-cream-300);border-radius:0;background:var(--job-cream-50);box-shadow:0 8px 24px rgb(22 48 43 / 8%);transition:transform .22s ease,box-shadow .22s ease}
.oob-card::after{position:absolute;z-index:0;top:0;right:0;width:7.5rem;height:7.5rem;background:url('/assets/jinowork-assets/02-oportunidades/card-corner-arcs.svg') top right/contain no-repeat;content:"";pointer-events:none}
.oob-card__banner,.oob-card__details{position:relative;z-index:1}
.oob-card--violet,.oob-card--deep,.oob-card--soft,.oob-card--muted,.oob-card--public{--card-accent:var(--job-terracotta-600)}
.oob-card:hover{box-shadow:0 12px 30px rgb(22 48 43 / 12%)}
.oob-card--linked:hover{transform:translateY(-3px);border-color:var(--job-green-300);box-shadow:0 16px 32px rgb(22 48 43 / 12%)}
.oob-card:focus-within{outline:0;box-shadow:0 12px 28px rgb(22 48 43 / 10%)}
.oob-card__banner{position:relative;isolation:isolate;overflow:hidden;min-height:0;padding:1.2rem 1.2rem .5rem;background:var(--job-cream-50);color:var(--job-green-800)}
.oob-card__banner::before{display:none}
.oob-card__banner::after{display:none}
.oob-card__connection{display:none}
.oob-card__connection path{stroke:color-mix(in srgb,var(--job-green-300) 70%,transparent);stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:150;stroke-dashoffset:0;transition:stroke-dashoffset .45s ease,stroke .25s ease}
.oob-card__connection circle{fill:var(--job-green-300);stroke:var(--job-green-800);stroke-width:2;transform-box:fill-box;transform-origin:center;transition:transform .22s ease,fill .22s ease}
.oob-card:hover .oob-card__connection path,.oob-card:focus-within .oob-card__connection path{stroke:var(--job-green-100);stroke-dashoffset:-18}
.oob-card:hover .oob-card__connection circle,.oob-card:focus-within .oob-card__connection circle{fill:#fff;transform:scale(1.16)}
.oob-card__top{position:relative;display:flex;align-items:center;gap:.7rem;min-width:0}
.oob-card__company-info{display:flex;min-width:0;flex-direction:column;gap:.15rem}
.oob-card__company-line{display:flex;min-width:0;align-items:center;flex-wrap:wrap;gap:.35rem .5rem}
.oob-card__company-name{min-width:0;overflow:hidden;color:var(--job-green-800);font-size:.88rem;font-weight:800;text-overflow:ellipsis;white-space:nowrap}
.oob-card__verified,.oob-card__applied{display:inline-flex;flex:none;align-items:center;gap:.24rem;padding:.22rem .45rem;border-radius:999px;background:#e8f2ed;color:#245d4d;font-size:.58rem;font-weight:800;line-height:1.2;white-space:nowrap}
.oob-card__verified svg{color:#19805a}
.oob-card__category{color:var(--job-text-secondary);font-size:.68rem;font-weight:650}
.avatar{display:grid;width:3.2rem;height:3.2rem;flex:none;place-items:center;border:0;border-radius:0;background:linear-gradient(135deg,var(--job-green-600),var(--job-green-800));color:#fff;font-size:1.05rem;font-weight:850;letter-spacing:.02em}
.oob-card .vacancy-mark{border:1px solid var(--job-terracotta-200,#f0c9c0)!important;background:linear-gradient(145deg,var(--job-terracotta-500),var(--job-terracotta-600))!important;box-shadow:0 4px 10px rgb(181 72 58 / 15%)!important;color:#fff!important}
.oob-card--public .avatar{background:linear-gradient(135deg,var(--job-terracotta-500),var(--job-terracotta-600))!important}
.oob-card--deep .avatar,.oob-card--soft .avatar,.oob-card--muted .avatar{background:linear-gradient(135deg,var(--job-green-600),var(--job-green-800));color:#fff}
.oob-card__accent{display:none}
.oob-card__title{position:relative;max-width:32rem;margin:.9rem 0 0;color:var(--job-green-800);font:800 1.2rem/1.28 Manrope,sans-serif;letter-spacing:-.025em}
.oob-card__title-line{display:flex;align-items:flex-start;flex-wrap:wrap;gap:.5rem .65rem}
.oob-card__title-line .oob-card__title{flex:1 1 12rem}
.oob-card__applied{margin-top:1rem;background:#f7e8e3;color:#8f3a2e}
.oob-card__details{display:flex;flex:1;flex-direction:column;gap:.55rem;padding:.4rem 1.2rem 1.15rem}
.oob-card__location{display:flex;align-items:center;gap:.65rem;min-width:0}
.oob-card__detail-icon{display:grid;width:1.4rem;height:1.4rem;flex:none;place-items:center;border:0;background:transparent;color:var(--job-green-600)}
.oob-card__location>span:last-child{display:grid;min-width:0;gap:.08rem}
.oob-card__location small{color:var(--job-text-secondary);font-size:.65rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.oob-card__location strong{overflow:hidden;color:var(--job-green-800);font-size:.82rem;font-weight:750;text-overflow:ellipsis;white-space:nowrap}
.oob-card__meta{display:flex;flex-wrap:wrap;gap:.4rem;margin:0;padding:0;list-style:none}
.oob-card__meta-item{display:inline-flex;min-height:1.85rem;align-items:center;gap:.35rem;padding:.3rem .55rem;border:0;border-radius:0;background:transparent;color:var(--job-green-800);font-size:.76rem;font-weight:700}
.oob-card__meta-item svg{flex:none;color:var(--job-terracotta-600)}
.oob-card__footer{display:flex;align-items:center;justify-content:space-between;gap:.55rem;margin-top:auto;padding-top:.85rem;border-top:1px solid var(--job-cream-200)}
.oob-card__salary{color:var(--job-green-800);font-size:.88rem;font-weight:850}
.oob-card__link{display:inline-flex;min-height:2.15rem;align-items:center;justify-content:center;gap:.45rem;margin-left:auto;padding:.3rem .65rem .3rem .8rem;border:0;border-radius:.62rem;background:var(--job-green-600);color:#fff;font-size:.73rem;font-weight:800;white-space:nowrap;transition:background .2s ease,transform .2s ease,box-shadow .2s ease}
.oob-card__link svg{width:16px;height:16px;padding:0;border-radius:0;background:transparent;transition:transform .18s}
.oob-card__link:hover{transform:translateY(-1px);background:var(--job-green-700);box-shadow:0 6px 14px rgb(35 70 64 / 24%)}
.oob-card__link:hover svg{transform:translateX(3px)}
.oob-card__link:focus-visible{outline:2px solid var(--job-green-600);outline-offset:3px}
@media(max-width:560px){.oob-card{min-height:0}.oob-card__banner{min-height:8.8rem}.oob-card__details{padding:1rem}}
@media(prefers-reduced-motion:reduce){.oob-card,.oob-card__link,.oob-card__connection path,.oob-card__connection circle{transition:none}.oob-card--linked:hover{transform:none}.oob-card__link:hover svg{transform:none}}
</style>
