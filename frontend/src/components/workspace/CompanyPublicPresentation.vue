<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight, Building2, Globe2, Mail, MapPin, Phone } from 'lucide-vue-next'
import { companyLogoUrl } from '@/services/profiles'
import { profileAvatarStyle, profileInitials } from '@/utils/profileAvatar'
import { oobAreaStyle } from '@/utils/oobAreaStyle'
import { vacancyInitials } from '@/utils/vacancyInitials'

type Named = { name: string } | null
type PresentationProfile = {
  id: string
  name: string
  logoUrl: string | null
  description: string | null
  website: string | null
  contactEmail: string | null
  phone: string | null
  verificationStatus: string
  economicSector: Named
  department: Named
  municipality: Named
}
type PresentationJob = {
  id: string
  title: string
  professionalArea: { name: string }
  workMode: string
  contractType: string
}

const props = defineProps<{ profile: PresentationProfile; jobs: PresentationJob[]; editable?: boolean }>()
const visibleJobs = computed(() => props.jobs.slice(0, 3))
const sectorName = computed(() => props.profile.economicSector?.name ?? '')
const location = computed(() => [props.profile.municipality?.name, props.profile.department?.name].filter(Boolean).join(', '))
const phoneDigits = computed(() => props.profile.phone?.replace(/\D/g, '') ?? '')
const verificationLabel = computed(() => props.profile.verificationStatus === 'VERIFIED' ? 'Empresa verificada' : props.profile.verificationStatus === 'REJECTED' ? 'Verificación rechazada' : 'Verificación pendiente')
const workModes: Record<string, string> = { ONSITE: 'Presencial', HYBRID: 'Híbrido', REMOTE: 'Remoto' }
const contracts: Record<string, string> = { PERMANENT: 'Permanente', TEMPORARY: 'Temporal', CONTRACT: 'Por contrato', INTERNSHIP: 'Pasantía' }
</script>

<template>
  <header class="company-presentation__hero">
    <span class="company-presentation__mark" :style="profileAvatarStyle(profile.name, sectorName)" aria-hidden="true"><img v-if="profile.logoUrl" :src="companyLogoUrl(profile.logoUrl)" alt=""><span v-else>{{ profileInitials(profile.name) }}</span></span>
    <div class="company-presentation__identity">
      <span class="company-presentation__eyebrow">{{ sectorName || 'Perfil de empresa' }}</span>
      <h2>{{ profile.name }}</h2>
      <p v-if="sectorName">{{ sectorName }}</p>
      <span v-if="location" class="company-presentation__location"><MapPin :size="16" aria-hidden="true" />{{ location }}</span>
    </div>
    <span class="company-presentation__verification" :class="{ 'is-verified': profile.verificationStatus === 'VERIFIED' }"><i />{{ verificationLabel }}</span>
  </header>

  <div class="company-presentation__layout">
    <main class="company-presentation__main">
      <section class="company-presentation__section">
        <h2>Sobre la empresa</h2>
        <p>{{ profile.description || 'La empresa todavía no ha añadido una presentación.' }}</p>
      </section>
      <section class="company-presentation__section company-presentation__vacancies">
        <header><div><span class="company-presentation__kicker">Oportunidades</span><h2>Vacantes publicadas</h2></div><span class="company-presentation__count">{{ visibleJobs.length }}</span></header>
        <div v-if="visibleJobs.length" class="company-presentation__oob-list">
          <article v-for="oob in visibleJobs" :key="oob.id" class="company-presentation__oob">
            <span class="company-presentation__oob-mark vacancy-mark" :style="oobAreaStyle(oob.professionalArea.name, oob.id)" aria-hidden="true">{{ vacancyInitials(oob.title) }}</span>
            <div><h3>{{ oob.title }}</h3><p>{{ oob.professionalArea.name }}</p><small>{{ workModes[oob.workMode] ?? oob.workMode }} · {{ contracts[oob.contractType] ?? oob.contractType }}</small></div>
            <RouterLink v-if="editable" :to="`/company/jobs/${oob.id}/edit`" :aria-label="`Editar vacante ${oob.title}`"><ArrowUpRight :size="17" /></RouterLink>
            <RouterLink v-else :to="`/jobs/${oob.id}`" :aria-label="`Ver vacante ${oob.title}`"><ArrowUpRight :size="17" /></RouterLink>
          </article>
        </div>
        <p v-else class="company-presentation__empty">Aún no hay vacantes publicadas.</p>
      </section>
    </main>

    <aside class="company-presentation__aside" aria-label="Contacto e información de la empresa">
      <section class="company-presentation__aside-section">
        <h2>Contacto</h2>
        <a v-if="profile.contactEmail" class="company-presentation__contact" :href="`mailto:${profile.contactEmail}`"><Mail :size="18" aria-hidden="true" /><span><small>Correo electrónico</small><strong>{{ profile.contactEmail }}</strong></span></a>
        <a v-if="profile.phone" class="company-presentation__contact" :href="phoneDigits ? `https://wa.me/${phoneDigits}` : undefined" target="_blank" rel="noopener noreferrer"><Phone :size="18" aria-hidden="true" /><span><small>Teléfono y WhatsApp</small><strong>{{ profile.phone }}</strong></span></a>
        <a v-if="profile.website" class="company-presentation__contact" :href="profile.website" target="_blank" rel="noopener noreferrer"><Globe2 :size="18" aria-hidden="true" /><span><small>Sitio web</small><strong>{{ profile.website }}</strong></span><ArrowUpRight :size="15" aria-hidden="true" /></a>
        <p v-if="!profile.contactEmail && !profile.phone && !profile.website" class="company-presentation__empty">No hay datos de contacto disponibles.</p>
      </section>
      <section class="company-presentation__aside-section company-presentation__facts">
        <h2>Información</h2>
        <p v-if="sectorName"><Building2 :size="17" /><span><small>Sector</small><strong>{{ sectorName }}</strong></span></p>
        <p v-if="location"><MapPin :size="17" /><span><small>Ubicación</small><strong>{{ location }}</strong></span></p>
        <p><span class="company-presentation__fact-status" :class="{ 'is-verified': profile.verificationStatus === 'VERIFIED' }" /><span><small>Estado</small><strong>{{ verificationLabel }}</strong></span></p>
      </section>
      <RouterLink v-if="editable" class="company-presentation__manage" to="/company/jobs">Gestionar mis vacantes <ArrowUpRight :size="16" /></RouterLink>
    </aside>
  </div>
</template>

<style scoped>
.company-presentation__hero{display:flex;align-items:center;gap:1.25rem;padding:1.35rem 1.45rem;background:var(--surface);border-bottom:1px solid var(--border)}
.company-presentation__mark{display:grid;width:6rem;height:6rem;flex:none;overflow:hidden;place-items:center;border-radius:50%!important;background:linear-gradient(145deg,var(--palette-violet),var(--primary));color:#fff;font:850 1.5rem Manrope,sans-serif}
.company-presentation__mark img{width:100%;height:100%;border-radius:50%!important;object-fit:contain;background:var(--surface)}.company-presentation__mark>span{display:grid;width:100%;height:100%;place-items:center;border-radius:50%!important;background:linear-gradient(145deg,color-mix(in srgb,var(--oob-accent) 72%,white),var(--oob-accent));color:#fff}
.company-presentation__identity{min-width:0;flex:1}
.company-presentation__eyebrow,.company-presentation__kicker{color:var(--primary);font-size:.68rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
.company-presentation__identity h2{margin:.3rem 0;color:var(--foreground);font:850 clamp(1.55rem,3vw,2.25rem)/1.12 Manrope,sans-serif;letter-spacing:-.05em}
.company-presentation__identity p{margin:.25rem 0;color:var(--muted-foreground);font-size:.86rem;font-weight:700}
.company-presentation__location{display:flex;align-items:center;gap:.35rem;margin-top:.45rem;color:var(--muted-foreground);font-size:.78rem}
.company-presentation__verification{display:inline-flex;align-items:center;gap:.4rem;flex:none;color:var(--muted-foreground);font-size:.7rem;font-weight:750}
.company-presentation__verification i,.company-presentation__fact-status{width:.5rem;height:.5rem;background:#d8a84a}
.company-presentation__verification.is-verified i,.company-presentation__fact-status.is-verified{background:#31ae78}
.company-presentation__layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(16rem,.85fr);gap:1.2rem;padding:1.25rem 1.4rem;background:var(--surface)}
.company-presentation__main{min-width:0}
.company-presentation__section{padding:0 0 1.3rem;border-bottom:1px solid var(--border)}
.company-presentation__section h2,.company-presentation__aside-section h2{margin:0 0 .7rem;color:var(--foreground);font:800 1rem Manrope,sans-serif;letter-spacing:-.02em}
.company-presentation__section>p{margin:0;color:var(--muted-foreground);font-size:.86rem;line-height:1.7;white-space:pre-line}
.company-presentation__vacancies{padding-top:1.2rem}
.company-presentation__vacancies>header{display:flex;align-items:center;oustify-content:space-between;gap:.8rem;margin-bottom:.6rem}
.company-presentation__vacancies>header h2{margin:.2rem 0 0}
.company-presentation__count{color:var(--muted-foreground);font-size:.78rem;font-weight:750}
.company-presentation__oob-list{display:grid}
.company-presentation__oob{display:flex;align-items:center;gap:.8rem;padding:.85rem 0;border-top:1px solid var(--border)}
.company-presentation__oob-mark{display:grid;width:2.6rem;height:2.6rem;flex:none;place-items:center;background:linear-gradient(145deg,color-mix(in srgb,var(--oob-accent) 58%,white),var(--oob-accent));color:#fff;font:850 1rem Manrope,sans-serif}
.company-presentation__oob>div{min-width:0;flex:1}
.company-presentation__oob h3{margin:0;color:var(--foreground);font-size:.84rem;font-weight:800}
.company-presentation__oob p,.company-presentation__oob small{display:block;margin:.2rem 0 0;color:var(--muted-foreground);font-size:.71rem}
.company-presentation__oob>a{display:grid;width:2rem;height:2rem;place-items:center;color:var(--primary)}
.company-presentation__empty{padding:.8rem 0!important;color:var(--muted-foreground);font-size:.78rem}
.company-presentation__aside{display:grid;align-content:start;gap:1rem;padding-left:1.1rem;border-left:1px solid var(--border)}
.company-presentation__aside-section{padding-bottom:1rem;border-bottom:1px solid var(--border)}
.company-presentation__contact{display:flex;align-items:center;gap:.65rem;padding:.65rem 0;color:var(--primary);text-decoration:none;overflow-wrap:anywhere}
.company-presentation__contact>span{display:grid;min-width:0;gap:.15rem;flex:1}
.company-presentation__contact small,.company-presentation__facts small{color:var(--muted-foreground);font-size:.67rem}
.company-presentation__contact strong,.company-presentation__facts strong{color:var(--foreground);font-size:.75rem;font-weight:750}
.company-presentation__facts p{display:flex;align-items:center;gap:.65rem;margin:.8rem 0;color:var(--primary)}
.company-presentation__facts p>span:last-child{display:grid;gap:.1rem}
.company-presentation__fact-status{flex:none}
.company-presentation__manage{display:flex;align-items:center;oustify-content:space-between;gap:.5rem;padding:.7rem 0;color:var(--primary);font-size:.76rem;font-weight:800;text-decoration:none}
@media(max-width:800px){.company-presentation__layout{grid-template-columns:minmax(0,1fr)}.company-presentation__aside{grid-template-columns:repeat(2,minmax(0,1fr));padding:1rem 0 0;border-top:1px solid var(--border);border-left:0}.company-presentation__manage{grid-column:1/-1}}
@media(max-width:560px){.company-presentation__hero{align-items:flex-start;flex-wrap:wrap;padding:1rem}.company-presentation__mark{width:4.2rem;height:4.2rem}.company-presentation__verification{margin-left:5rem}.company-presentation__layout{padding:1rem}.company-presentation__aside{grid-template-columns:minmax(0,1fr)}}
</style>
