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
        <header><div><span class="company-presentation__kicker">Oportunidades</span><h2>Ofertas publicadas</h2></div><span class="company-presentation__count">{{ visibleJobs.length }}</span></header>
        <div v-if="visibleJobs.length" class="company-presentation__oob-list">
          <article v-for="oob in visibleJobs" :key="oob.id" class="company-presentation__oob">
            <span class="company-presentation__oob-mark vacancy-mark" :style="oobAreaStyle(oob.professionalArea.name, oob.id)" aria-hidden="true">{{ vacancyInitials(oob.title) }}</span>
            <div><h3>{{ oob.title }}</h3><p>{{ oob.professionalArea.name }}</p><small>{{ workModes[oob.workMode] ?? oob.workMode }} · {{ contracts[oob.contractType] ?? oob.contractType }}</small></div>
            <RouterLink v-if="editable" :to="`/company/jobs/${oob.id}/edit`" :aria-label="`Editar oferta ${oob.title}`"><ArrowUpRight :size="17" /></RouterLink>
            <RouterLink v-else :to="`/jobs/${oob.id}`" :aria-label="`Ver oferta ${oob.title}`"><ArrowUpRight :size="17" /></RouterLink>
          </article>
        </div>
        <p v-else class="company-presentation__empty">Aún no hay ofertas publicadas.</p>
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
      <RouterLink v-if="editable" class="company-presentation__manage" to="/company/jobs">Gestionar mis ofertas <ArrowUpRight :size="16" /></RouterLink>
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

/* Presentación de empresa: bloques claros separados y un encabezado verde de marca. */
.company-presentation__hero{position:relative;isolation:isolate;overflow:hidden;min-height:11rem;gap:1.35rem;padding:1.65rem 1.8rem;border:0;border-radius:1.15rem;background-color:#1b3a33;background-image:url('/assets/jinowork-svgs-mejorados/left/03-ondas-oscuras.svg'),url('/assets/jinowork-svgs-mejorados/left/01-contornos-oscuros.svg');background-position:center bottom,center;background-size:cover,cover;background-repeat:no-repeat;color:#fffdfb}
.company-presentation__mark{width:5.5rem;height:5.5rem;border:1px solid rgb(255 255 255 / 22%);background:rgb(255 255 255 / 12%);box-shadow:0 8px 22px rgb(10 30 24 / 18%)}
.company-presentation__mark img{object-fit:contain}
.company-presentation__eyebrow{color:#f3a18a}
.company-presentation__identity h2{color:#fffdfb}
.company-presentation__identity p,.company-presentation__location{color:rgb(255 253 251 / 82%)}
.company-presentation__verification{padding:.55rem .8rem;border:1px solid rgb(255 253 251 / 20%);border-radius:999px;background:rgb(255 253 251 / 9%);color:#fffdfb}
.company-presentation__verification i,.company-presentation__fact-status{width:.55rem;height:.55rem;border-radius:50%;background:#efaa76}
.company-presentation__verification.is-verified i,.company-presentation__fact-status.is-verified{background:#71d0a2}
.company-presentation__layout{grid-template-columns:minmax(0,1.8fr) minmax(17rem,.85fr);gap:1rem;padding:1rem 0 0;background:transparent}
.company-presentation__main{display:grid;align-content:start;gap:1rem}
.company-presentation__section{padding:1.25rem 1.35rem;border:0;border-radius:1rem;background:#fffdfb;box-shadow:0 12px 30px rgb(48 42 33 / 5%)}
.company-presentation__section h2,.company-presentation__aside-section h2{margin-bottom:.75rem;color:#1b3a33;font-size:1.05rem}
.company-presentation__section>p{color:#526860;font-size:.88rem;line-height:1.75}
.company-presentation__vacancies{padding-top:1.25rem}
.company-presentation__vacancies>header{justify-content:space-between}
.company-presentation__count{display:grid;min-width:2rem;height:2rem;place-items:center;border-radius:999px;background:#e7efe9;color:#245b4b}
.company-presentation__oob{gap:.9rem;padding:.9rem 0;border-color:#eee2d9}
.company-presentation__oob-mark{width:2.8rem;height:2.8rem;border-radius:.75rem;background:linear-gradient(145deg,#4a806e,#245b4b);box-shadow:0 5px 12px rgb(27 58 51 / 12%)}
.company-presentation__oob h3{color:#1b3a33;font-size:.87rem}
.company-presentation__oob p,.company-presentation__oob small{font-size:.75rem}
.company-presentation__oob>a{width:2.2rem;height:2.2rem;border-radius:50%;background:#eaf1ec;color:#245b4b;transition:background .18s,color .18s,transform .18s}
.company-presentation__oob>a:hover{transform:translate(2px,-2px);background:#245b4b;color:#fff}
.company-presentation__aside{gap:.75rem;padding:0;border:0}
.company-presentation__aside-section{padding:1.2rem 1.25rem;border:0;border-radius:1rem;background:#fffdfb;box-shadow:0 12px 30px rgb(48 42 33 / 5%)}
.company-presentation__contact{gap:.75rem;padding:.7rem 0;color:#245b4b}
.company-presentation__contact>svg,.company-presentation__facts p>svg{flex:none;color:#357462}
.company-presentation__contact small,.company-presentation__facts small{font-size:.7rem}
.company-presentation__contact strong,.company-presentation__facts strong{color:#1b3a33;font-size:.78rem}
.company-presentation__facts p{margin:.85rem 0;color:#357462}
.company-presentation__manage{justify-content:space-between;min-height:2.8rem;padding:.65rem .95rem;border-radius:.8rem;background:#e7efe9;color:#245b4b;transition:background .18s,color .18s}
.company-presentation__manage:hover{background:#245b4b;color:#fff}
@media(max-width:800px){.company-presentation__layout{padding-top:.85rem}.company-presentation__aside{gap:.75rem;padding:0;border:0}}
@media(max-width:560px){.company-presentation__hero{gap:.9rem;padding:1.1rem;background-size:85% auto,cover}.company-presentation__mark{width:4.2rem;height:4.2rem}.company-presentation__verification{margin:0 0 0 5.1rem}.company-presentation__section,.company-presentation__aside-section{padding:1rem}.company-presentation__aside{grid-template-columns:minmax(0,1fr)}}
@media(max-width:900px){.company-presentation__layout{grid-template-columns:minmax(0,1fr)}.company-presentation__aside{grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem}.company-presentation__aside-section{min-width:0}.company-presentation__manage{grid-column:1/-1}}
@media(max-width:700px){.company-presentation__hero{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:.85rem 1rem;padding:1.15rem}.company-presentation__mark{grid-column:1;grid-row:1/3;width:4.25rem;height:4.25rem}.company-presentation__identity{grid-column:2;grid-row:1;min-width:0}.company-presentation__identity h2{font-size:clamp(1.4rem,6vw,1.9rem);overflow-wrap:anywhere}.company-presentation__verification{grid-column:2;grid-row:2;justify-self:start;max-width:100%;margin:0}.company-presentation__layout{gap:.8rem}.company-presentation__section,.company-presentation__aside-section{padding:1.05rem}}
@media(max-width:560px){.company-presentation__aside{grid-template-columns:minmax(0,1fr)}.company-presentation__manage{grid-column:auto}.company-presentation__hero{background-size:cover,cover}.company-presentation__section,.company-presentation__aside-section{padding:1rem}.company-presentation__oob{gap:.65rem}.company-presentation__oob>div{overflow-wrap:anywhere}.company-presentation__contact strong,.company-presentation__facts strong{overflow-wrap:anywhere}}
@media(max-width:380px){.company-presentation__hero{grid-template-columns:3.25rem minmax(0,1fr);gap:.75rem;padding:.95rem}.company-presentation__mark{width:3.25rem;height:3.25rem}.company-presentation__identity h2{font-size:1.35rem}.company-presentation__verification{font-size:.64rem;padding:.45rem .65rem}.company-presentation__section,.company-presentation__aside-section{padding:.9rem}.company-presentation__oob-mark{width:2.45rem;height:2.45rem}.company-presentation__oob h3{font-size:.8rem}}
</style>
