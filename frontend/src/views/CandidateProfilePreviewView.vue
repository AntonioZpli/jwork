<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowDownToLine, BriefcaseBusiness, GraduationCap, Languages, Mail, MapPin, UserRound } from 'lucide-vue-next'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import { candidateFileUrl, loadCandidatePhoto, profilesApi, type CandidateProfileData, type CandidateProfileOptions } from '@/services/profiles'

const profile = ref<CandidateProfileData | null>(null)
const options = ref<CandidateProfileOptions | null>(null)
const loading = ref(true)
const error = ref('')
const photo = ref('')
const professionalSummary = computed(() => {
  if (!profile.value || !options.value) return ''
  return [
    options.value.professionalAreas.find(item => item.id === profile.value?.professionalAreaId)?.name,
    options.value.specializations.find(item => item.id === profile.value?.specializationId)?.name,
  ].filter(Boolean).join(' · ')
})
const location = computed(() => [profile.value?.municipality?.name, profile.value?.department?.name].filter(Boolean).join(', '))
const languageLevels: Record<string, string> = { BASIC: 'Básico', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado', NATIVE: 'Nativo' }
function dateLabel(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  const month = new Intl.DateTimeFormat('es-NI', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', '')
  const isYearOnly = date.getUTCDate() === 15 && [0, 11].includes(date.getUTCMonth())
  return isYearOnly ? String(date.getUTCFullYear()) : `${month} ${date.getUTCFullYear()}`
}

onMounted(async () => {
  try {
    const result = await profilesApi.candidate()
    profile.value = result.profile
    options.value = result.catalogs
    if (result.profile.photoUrl) photo.value = await loadCandidatePhoto(result.profile.photoUrl).catch(() => '')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar la vista previa.'
  } finally {
    loading.value = false
  }
})
onBeforeUnmount(() => { if (photo.value) URL.revokeObjectURL(photo.value) })
</script>

<template>
  <WorkspaceFrame eyebrow="" title="Tu perfil" subtitle="" initials="JW">
    <template #heading-action><RouterLink class="workspace__cta" to="/candidate/profile">Editar perfil</RouterLink></template>
    <AppMessage v-if="loading" variant="loading" message="Cargando vista previa…" />
    <AppMessage v-else-if="error" variant="error" title="No se pudo cargar la vista previa" :message="error" />
    <template v-else-if="profile">
      <div class="candidate-preview">
        <div class="candidate-preview__layout">
          <main class="candidate-preview__main">
            <header class="candidate-preview__identity">
              <img v-if="photo" class="candidate-preview__photo" :src="photo" alt="Foto de perfil">
              <span v-else class="candidate-preview__photo candidate-preview__photo--empty"><UserRound :size="34" /></span>
              <div class="candidate-preview__identity-copy"><p>Perfil profesional</p><h2>{{ profile.firstName }} {{ profile.lastName }}</h2><strong>{{ professionalSummary || 'Área profesional no indicada' }}</strong><span class="candidate-preview__location"><MapPin :size="16" />{{ location || 'Ubicación no indicada' }}</span></div>
              <div v-if="profile.languages.length" class="candidate-preview__language-summary"><span v-for="item in profile.languages" :key="item.language.id">{{ item.language.name }}<small v-if="item.level !== 'NATIVE'"> · {{ languageLevels[item.level] ?? item.level }}</small></span></div>
            </header>
            <section class="candidate-preview__section"><h2>Sobre mí</h2><p v-if="profile.description" class="candidate-preview__description">{{ profile.description }}</p><p v-else class="workspace__empty">Aún no has añadido un resumen profesional.</p></section>
            <section class="candidate-preview__section"><h2>Experiencia</h2><div v-if="profile.experiences.length" class="candidate-preview__entries"><article v-for="item in profile.experiences" :key="item.id" class="candidate-preview__entry"><div><strong>{{ item.position }}</strong><span>{{ item.company }}</span><p v-if="item.description">{{ item.description }}</p></div><time>{{ dateLabel(item.startDate) }} – {{ dateLabel(item.endDate) ?? 'Actualidad' }}</time></article></div><p v-else class="workspace__empty">Aún no has añadido experiencia.</p></section>
            <section class="candidate-preview__section"><h2>Formación</h2><div v-if="profile.education.length" class="candidate-preview__entries"><article v-for="item in profile.education" :key="item.id" class="candidate-preview__entry"><div><strong>{{ item.degree }}</strong><span>{{ item.institution }}</span></div><time>{{ dateLabel(item.startDate) ?? '—' }} – {{ dateLabel(item.endDate) ?? 'En curso' }}</time></article></div><p v-else class="workspace__empty">Aún no has añadido formación.</p></section>
          </main>
          <aside class="candidate-preview__aside">
            <section class="candidate-preview__side-section"><a v-if="profile.cvUrl" class="candidate-preview__download" :href="candidateFileUrl('cv', profile.cvUrl)" target="_blank" rel="noopener noreferrer"><ArrowDownToLine :size="18" />Descargar currículum</a><p v-else class="candidate-preview__cv-missing">Sin currículum adjunto</p><p class="candidate-preview__side-note">El currículum se comparte con la empresa cuando recibe tu postulación.</p></section>
            <section v-if="profile.languages.length" class="candidate-preview__side-section candidate-preview__language-section"><h2><Languages :size="20" />Idiomas</h2><ul class="candidate-preview__languages"><li v-for="item in profile.languages" :key="item.language.id"><strong>{{ item.language.name }}</strong><span>{{ languageLevels[item.level] ?? item.level }}</span></li></ul></section>
            <section class="candidate-preview__side-section candidate-preview__contact"><h2>Contacto</h2><a v-if="profile.contactEmail" class="candidate-preview__contact-link" :href="`mailto:${profile.contactEmail}`"><Mail :size="19" aria-hidden="true" /><span><small>Correo electrónico</small><strong>{{ profile.contactEmail }}</strong></span></a><a v-if="profile.phone" class="candidate-preview__contact-link candidate-preview__contact-link--whatsapp" :href="`https://wa.me/${profile.phone.replace(/\D/g, '')}`" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 2.67a13.18 13.18 0 0 0-11.3 20l-1.4 5.13 5.25-1.38a13.2 13.2 0 1 0 7.45-23.75Zm0 23.95c-1.96 0-3.88-.53-5.56-1.53l-.4-.24-3.11.82.83-3.03-.26-.42a10.76 10.76 0 1 1 8.5 4.4Zm5.9-8.06c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.52-.16-.74.16-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.32-.16-1.35-.5-2.57-1.6-.95-.84-1.6-1.88-1.79-2.2-.19-.32-.02-.5.14-.66.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.11-.22.05-.41-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.54-.73-.55h-.62c-.22 0-.57.08-.87.41-.3.32-1.14 1.11-1.14 2.7s1.17 3.13 1.33 3.35c.16.22 2.3 3.52 5.57 4.94.78.34 1.39.55 1.87.7.79.25 1.5.21 2.06.13.63-.09 1.9-.78 2.16-1.54.27-.76.27-1.41.19-1.54-.08-.13-.3-.21-.62-.37Z"/></svg><span><small>WhatsApp</small><strong>{{ profile.phone }}</strong></span></a><p v-if="!profile.contactEmail && !profile.phone" class="candidate-preview__contact-empty">No has añadido datos de contacto.</p></section>
          </aside>
        </div>
      </div>
    </template>
  </WorkspaceFrame>
</template>

<style scoped>
:deep(.workspace__heading){display:none}
.candidate-preview{--preview-rule:#e3cfc1;overflow:hidden;border:1px solid var(--preview-rule);border-radius:.55rem;background:#fff;color:#16302b;box-shadow:0 3px 12px rgb(31 55 82 / 5%)}
.candidate-preview__masthead{position:relative;display:grid;grid-template-columns:8rem minmax(0,1fr) auto;align-items:center;gap:1.5rem;min-height:10rem;padding:1.2rem 1.5rem;border-bottom:1px solid var(--preview-rule);background:#f3f6f9}
.candidate-preview__portrait-wrap{position:relative;width:8rem;aspect-ratio:1/1;overflow:hidden;background:#e1e7ed;border-radius:.3rem}
.candidate-preview__portrait-wrap:after{position:absolute;inset:.35rem;border:1px solid rgb(255 255 255 / 42%);content:"";pointer-events:none}
.candidate-preview__photo{display:grid;width:100%;height:100%;place-items:center;color:var(--muted-foreground);object-fit:cover;filter:saturate(.8)}
.candidate-preview__photo--empty{background:#e1e7ed}
.candidate-preview__identity{min-width:0}
.candidate-preview__eyebrow,.candidate-preview__side-index{margin:0 0 .55rem;color:#5f6f6b;font-size:.65rem;font-weight:750;letter-spacing:.08em;text-transform:uppercase}
.candidate-preview__identity h2{max-width:28ch;margin:0;color:#16302b;font:750 clamp(1.45rem,2.8vw,2rem)/1.15 Manrope,sans-serif;letter-spacing:-.04em}
.candidate-preview__specialty{max-width:38rem;margin:.45rem 0 .35rem;color:#35544c;font-size:.87rem;font-weight:600;line-height:1.4}
.candidate-preview__location{display:inline-flex;align-items:center;gap:.35rem;color:#5f6f6b;font-size:.75rem}
.candidate-preview__masthead-tools{align-self:start;padding-top:.15rem}
.candidate-preview__edit{color:#2f5f52;font-size:.75rem;font-weight:700;text-decoration:none;white-space:nowrap}
.candidate-preview__edit:hover{text-decoration:underline;text-underline-offset:.2rem}
.candidate-preview__body{display:grid;grid-template-columns:minmax(0,1fr) 15rem;gap:2rem;padding:0 1.5rem}
.candidate-preview__main{min-width:0}
.candidate-preview__section{display:grid;grid-template-columns:7.25rem minmax(0,1fr);gap:1.25rem;padding:1.35rem 0;border-bottom:1px solid var(--preview-rule)}
.candidate-preview__section-index{margin:.2rem 0;color:#5f6f6b;font-size:.65rem;font-weight:750;letter-spacing:.06em}
.candidate-preview__section h3,.candidate-preview__history-section h3{margin:0 0 .65rem;color:#16302b;font:750 1rem Manrope,sans-serif;letter-spacing:-.02em}
.candidate-preview__description,.candidate-preview__empty{max-width:70ch;margin:0;color:#5f6f6b;font-size:.82rem;line-height:1.65;white-space:pre-line}
.candidate-preview__empty{font-size:.8rem}
.candidate-preview__history-content{display:grid;gap:1.7rem}
.candidate-preview__history-section+.candidate-preview__history-section{padding-top:1.6rem;border-top:1px solid var(--preview-rule)}
.candidate-preview__history-section h3{margin-bottom:.6rem}
.candidate-preview__entry{display:grid;grid-template-columns:4.5rem minmax(0,1fr);gap:1rem;padding:.85rem 0;border-top:1px solid color-mix(in srgb,var(--preview-rule) 65%,transparent)}
.candidate-preview__entry-date{margin:.1rem 0 0;color:#5f6f6b;font-size:.65rem;line-height:1.55}
.candidate-preview__entry h4{margin:0;color:#16302b;font-size:.84rem;font-weight:750}
.candidate-preview__entry-meta{margin:.25rem 0 0;color:#5f6f6b;font-size:.73rem}
.candidate-preview__entry-description{max-width:65ch;margin:.5rem 0 0;color:#5f6f6b;font-size:.76rem;line-height:1.55;white-space:pre-line}
.candidate-preview__aside{min-width:0;align-self:stretch;padding:1.35rem 0 0 1.15rem;border-left:1px solid var(--preview-rule);background:#f8fafb}
.candidate-preview__side-section{padding:0 0 1rem;margin-bottom:1rem;border-bottom:1px solid var(--preview-rule)}
.candidate-preview__side-index{margin-bottom:.8rem;font-size:.57rem}
.candidate-preview__download{display:flex;min-height:2.4rem;align-items:center;gap:.5rem;padding:.45rem .6rem;border:1px solid #e3cfc1;border-radius:.3rem;background:#e9f0ec;color:#234c70;font-size:.73rem;font-weight:700;text-decoration:none;transition:background .18s}
.candidate-preview__download:hover{background:#e2ebf3}
.candidate-preview__side-note,.candidate-preview__privacy>p:last-child{margin:.55rem 0 0;color:var(--muted-foreground);font-size:.69rem;line-height:1.6}
.candidate-preview__languages{margin:0;padding:0;list-style:none}
.candidate-preview__languages li{display:flex;justify-content:space-between;gap:.6rem;padding:.55rem 0;border-top:1px solid color-mix(in srgb,#526a80 17%,transparent);font-size:.73rem}
.candidate-preview__languages li strong{color:#35544c}
.candidate-preview__languages li span{color:var(--muted-foreground);font-size:.68rem}
@media(max-width:760px){.candidate-preview__masthead{grid-template-columns:6.5rem minmax(0,1fr);gap:1.1rem;padding:1.15rem}.candidate-preview__portrait-wrap{width:6.5rem}.candidate-preview__identity h2{font-size:clamp(1.45rem,5vw,2rem)}.candidate-preview__masthead-tools{position:absolute;right:1.15rem;bottom:.85rem}.candidate-preview__body{grid-template-columns:minmax(0,1fr);gap:0;padding-inline:1.15rem}.candidate-preview__aside{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;padding:1rem 0 0;border-left:0;border-top:1px solid var(--preview-rule);background:transparent}.candidate-preview__side-section{margin:0}.candidate-preview__privacy{grid-column:1/-1}}
@media(max-width:480px){.candidate-preview__masthead{grid-template-columns:4.5rem minmax(0,1fr);align-items:center;padding:1rem .8rem 2.2rem}.candidate-preview__portrait-wrap{width:4.5rem}.candidate-preview__portrait-wrap:after{inset:.2rem}.candidate-preview__eyebrow{margin-bottom:.45rem;font-size:.53rem}.candidate-preview__identity h2{font-size:1.35rem;letter-spacing:-.035em}.candidate-preview__specialty{margin:.45rem 0 .3rem;font-size:.71rem}.candidate-preview__location{align-items:flex-start;font-size:.64rem}.candidate-preview__body{padding-inline:.8rem}.candidate-preview__section{grid-template-columns:1fr;gap:.4rem;padding:1.05rem 0}.candidate-preview__entry{grid-template-columns:3rem minmax(0,1fr);gap:.65rem}.candidate-preview__aside{grid-template-columns:1fr}.candidate-preview__privacy{grid-column:auto}}

/* Align this preview with the platform's standard workspace cards and spacing. */
:deep(.workspace__heading){display:flex}
.candidate-preview{display:grid;gap:0;overflow:visible;border:0;border-radius:0;background:transparent;color:var(--foreground);box-shadow:none}
.candidate-preview__identity{display:flex;align-items:center;gap:1rem;margin:0;padding:1.1rem 0 1.35rem;border:0;border-bottom:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none}
.candidate-preview__photo{display:grid;width:5rem;height:5rem;flex:none;place-items:center;overflow:hidden;border:1px solid var(--border);border-radius:.8rem;background:var(--secondary);color:var(--primary);object-fit:cover;filter:none}
.candidate-preview__photo--empty{background:var(--secondary)}
.candidate-preview__identity-copy{min-width:0;flex:1}
.candidate-preview__identity-copy h2{margin:0;color:var(--foreground);font:800 1.25rem/1.2 Manrope,sans-serif;letter-spacing:-.035em}
.candidate-preview__specialty{margin:.35rem 0;color:var(--muted-foreground);font-size:.82rem;font-weight:650}
.candidate-preview__location{color:var(--muted-foreground);font-size:.74rem}
.candidate-preview__download{display:inline-flex;min-height:2.5rem;align-items:center;gap:.45rem;padding:0 .85rem;border:1px solid var(--border);border-radius:.65rem;background:var(--surface);color:var(--primary);font-size:.76rem;font-weight:750;text-decoration:none;white-space:nowrap}
.candidate-preview__download:hover{border-color:var(--primary);background:var(--secondary)}
.candidate-preview__cv-missing{color:var(--muted-foreground);font-size:.73rem}
.candidate-preview__section{margin:0;padding:1.3rem 0;border:0;border-bottom:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none}
.candidate-preview__section h2{display:flex;align-items:center;gap:.55rem;margin:0 0 .85rem;color:var(--foreground);font:750 1rem Manrope,sans-serif;letter-spacing:-.02em}
.candidate-preview__section h2 svg{color:var(--primary)}
.candidate-preview__description{max-width:75ch;margin:0;color:var(--muted-foreground);font-size:.83rem;line-height:1.65;white-space:pre-line}
.candidate-preview__entries{display:grid}
.candidate-preview__entry{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.3rem 1rem;padding:.8rem 0;border-top:1px solid var(--border)}
.candidate-preview__entry:first-child{padding-top:0;border-top:0}
.candidate-preview__entry div{display:grid;gap:.2rem}
.candidate-preview__entry strong{color:var(--foreground);font-size:.82rem}
.candidate-preview__entry span,.candidate-preview__entry time{color:var(--muted-foreground);font-size:.74rem}
.candidate-preview__entry p{grid-column:1/-1;margin:.3rem 0 0;color:var(--muted-foreground);font-size:.78rem;line-height:1.55;white-space:pre-line}
.candidate-preview__languages{display:flex;flex-wrap:wrap;gap:.55rem;margin:0;padding:0;list-style:none}
.candidate-preview__languages li{display:flex;align-items:baseline;gap:.4rem;padding:.45rem .65rem;border:1px solid var(--border);border-radius:.6rem;background:var(--panel);font-size:.73rem}
.candidate-preview__languages li strong{color:var(--foreground)}
.candidate-preview__privacy{margin:0;padding:1rem 0 0;color:var(--muted-foreground);font-size:.72rem;text-align:left}
@media(max-width:600px){.candidate-preview__identity{align-items:flex-start;flex-wrap:wrap}.candidate-preview__identity-copy{min-width:calc(100% - 6.5rem)}.candidate-preview__download,.candidate-preview__cv-missing{margin-left:6rem}.candidate-preview__entry{grid-template-columns:1fr}.candidate-preview__entry time{grid-row:2}}

.candidate-preview{display:block;border:0;border-radius:0;background:transparent;box-shadow:none;color:var(--foreground)}
.candidate-preview__identity{display:flex;align-items:center;gap:1.35rem;margin:0;padding:1.25rem 1.4rem;border:0;border-bottom:1px solid var(--border);border-radius:0;background:var(--surface);box-shadow:none}
.candidate-preview__photo{width:7rem;height:7rem;border:0;border-radius:.55rem;background:var(--panel);object-fit:cover}
.candidate-preview__identity-copy{display:grid;gap:.3rem}
.candidate-preview__identity-copy>p{margin:0;color:var(--primary);font-size:.67rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.candidate-preview__identity-copy h2{margin:0;color:var(--foreground);font:800 clamp(1.35rem,2.4vw,2rem)/1.15 Manrope,sans-serif;letter-spacing:-.04em}
.candidate-preview__identity-copy>strong{color:var(--foreground);font-size:.83rem;font-weight:650}
.candidate-preview__location{margin-top:.15rem}
.candidate-preview__layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(15rem,.48fr);align-items:stretch}
.candidate-preview__main{min-width:0;padding:0 1.4rem}
.candidate-preview__section{position:relative;display:block;padding:1.4rem 0 1.5rem 1.25rem;border:0;border-bottom:1px solid var(--border);background:transparent}
.candidate-preview__section:before{position:absolute;top:1.55rem;bottom:auto;left:0;width:3px;height:1.25rem;border-radius:2px;background:var(--primary);content:""}
.candidate-preview__section h2,.candidate-preview__side-section h2{display:flex;align-items:center;gap:.55rem;margin:0 0 .8rem;color:var(--foreground);font:750 1.05rem Manrope,sans-serif;letter-spacing:-.025em}
.candidate-preview__section h2 svg,.candidate-preview__side-section h2 svg{color:var(--primary)}
.candidate-preview__description{max-width:70ch;color:var(--muted-foreground);font-size:.84rem;line-height:1.7}
.candidate-preview__entries{display:grid}
.candidate-preview__entry{position:relative;grid-template-columns:7rem minmax(0,1fr);gap:.85rem;padding:.8rem 0;border-top:0}
.candidate-preview__entry time{grid-column:1;color:var(--muted-foreground);font-size:.72rem;line-height:1.5}
.candidate-preview__entry>div{position:relative;grid-column:2;display:grid;gap:.2rem}
.candidate-preview__entry>div:before{position:absolute;top:.24rem;left:-1.27rem;width:.55rem;height:.55rem;border:2px solid var(--primary);border-radius:50%;background:var(--surface);content:""}
.candidate-preview__entry:not(:last-child)>div:after{position:absolute;top:.85rem;bottom:-1rem;left:-1.03rem;width:1px;background:var(--border);content:""}
.candidate-preview__entry strong{font-size:.83rem}
.candidate-preview__entry span{font-size:.75rem}
.candidate-preview__entry p{margin:.35rem 0 0;color:var(--muted-foreground);font-size:.77rem;line-height:1.55}
.candidate-preview__aside{min-width:0;padding:1.25rem 1.25rem 1rem;border-left:1px solid var(--border);background:color-mix(in srgb,var(--panel) 65%,var(--surface))}
.candidate-preview__side-section{padding:0 0 1rem;margin:0 0 1rem;border-bottom:1px solid var(--border)}
.candidate-preview__side-section:last-child{border-bottom:0}
.candidate-preview__download{display:flex;min-height:2.75rem;align-items:center;justify-content:center;gap:.55rem;padding:.5rem .75rem;border:0;border-radius:.55rem;background:var(--primary);color:#fff;font-size:.8rem;font-weight:750;text-decoration:none}
.candidate-preview__download:hover{background:color-mix(in srgb,var(--primary) 85%,#1b3a33)}
.candidate-preview__side-note,.candidate-preview__privacy p{margin:.65rem 0 0;color:var(--muted-foreground);font-size:.74rem;line-height:1.6}
.candidate-preview__side-section h2{margin-bottom:.65rem}
.candidate-preview__languages{display:grid;gap:.45rem}
.candidate-preview__languages li{padding:.55rem .65rem;border:0;border-radius:.4rem;background:var(--surface);font-size:.75rem}
.candidate-preview__languages li strong{color:var(--foreground)}
.candidate-preview__privacy h2{font-size:.9rem}
@media(max-width:760px){.candidate-preview__layout{grid-template-columns:minmax(0,1fr)}.candidate-preview__main{padding-inline:1.1rem}.candidate-preview__aside{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;padding:1rem 1.1rem;border-top:1px solid var(--border);border-left:0}.candidate-preview__side-section{margin:0}.candidate-preview__privacy{grid-column:1/-1}}
@media(max-width:480px){.candidate-preview__identity{gap:.85rem;padding:1rem}.candidate-preview__photo{width:4.5rem;height:4.5rem}.candidate-preview__identity-copy h2{font-size:1.2rem}.candidate-preview__identity-copy>strong{font-size:.74rem}.candidate-preview__main{padding-inline:.85rem}.candidate-preview__section{padding:1.15rem 0 1.2rem 1rem}.candidate-preview__entry{grid-template-columns:1fr;gap:.25rem}.candidate-preview__entry time{grid-column:1}.candidate-preview__entry>div{grid-column:1;padding-left:1.25rem}.candidate-preview__entry>div:before{left:0}.candidate-preview__entry:not(:last-child)>div:after{left:.24rem}.candidate-preview__aside{grid-template-columns:1fr;padding-inline:.85rem}.candidate-preview__privacy{grid-column:auto}}
.candidate-preview__language-section h2{padding-bottom:.7rem;border-bottom:1px solid var(--border)}
.candidate-preview__languages{gap:.55rem}
.candidate-preview__languages li{display:grid;grid-template-columns:2.2rem minmax(0,1fr) auto;align-items:center;gap:.65rem;min-height:3.2rem;padding:.45rem .55rem;border:1px solid color-mix(in srgb,var(--palette-blue) 14%,var(--border));border-left:3px solid color-mix(in srgb,var(--palette-blue) 62%,var(--primary));border-radius:.45rem;background:var(--surface)}
.candidate-preview__language-mark{display:grid;width:2rem;height:2rem;place-items:center;background:color-mix(in srgb,var(--palette-blue) 15%,var(--secondary));color:var(--primary);font-size:.62rem;font-weight:850;letter-spacing:.03em}
.candidate-preview__language-copy{min-width:0}
.candidate-preview__languages li .candidate-preview__language-copy strong{display:block;overflow:hidden;font-size:.76rem;text-overflow:ellipsis;white-space:nowrap}
.candidate-preview__languages li .candidate-preview__language-level{padding:.25rem .4rem;border-radius:.3rem;background:color-mix(in srgb,var(--palette-blue) 13%,var(--secondary));color:var(--primary);font-size:.63rem;font-weight:750;white-space:nowrap}

.candidate-preview__identity{display:grid;grid-template-columns:12rem minmax(0,1fr) auto;gap:1.5rem;align-items:center;padding:1.5rem 1.25rem;border-bottom:1px solid var(--border)}
.candidate-preview__photo{width:12rem;height:10rem;border-radius:.45rem}
.candidate-preview__identity-copy{display:grid;gap:.4rem}
.candidate-preview__identity-copy>p{margin:0;color:var(--primary);font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.candidate-preview__identity-copy h2{font-size:clamp(1.45rem,2.6vw,2.25rem)}
.candidate-preview__identity-copy>strong{color:var(--muted-foreground);font-size:.95rem;font-weight:650}
.candidate-preview__location{margin-top:.15rem;font-size:.83rem}
.candidate-preview__language-summary{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.75rem;color:var(--primary);font-size:.72rem;font-weight:700}
.candidate-preview__language-summary>span+span{padding-left:.75rem;border-left:1px solid var(--border)}
.candidate-preview__language-summary small{color:var(--muted-foreground);font-size:inherit;font-weight:500}
.candidate-preview__layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(16rem,1fr);align-items:stretch}
.candidate-preview__main{padding:0 1.25rem}
.candidate-preview__section{padding:1.45rem 0 1.5rem 2rem}
.candidate-preview__section:before{top:1.55rem;width:4px;height:1.45rem;background:var(--primary)}
.candidate-preview__section h2{margin-bottom:1rem;font-size:1.18rem}
.candidate-preview__description{font-size:.88rem;line-height:1.8}
.candidate-preview__entry{grid-template-columns:minmax(0,1fr) auto;gap:.35rem 1rem;padding:.4rem 0 .85rem}
.candidate-preview__entry>div{grid-column:1;grid-row:1 / span 2;padding-left:1rem;border-left:1px solid var(--border)}
.candidate-preview__entry>div:before{top:.1rem;left:-.42rem;width:.62rem;height:.62rem;border:0;background:var(--primary)}
.candidate-preview__entry:not(:last-child)>div:after{display:none}
.candidate-preview__entry strong{font-size:.91rem}
.candidate-preview__entry span{font-size:.8rem}
.candidate-preview__entry time{grid-column:2;grid-row:1;color:var(--muted-foreground);font-size:.76rem;white-space:nowrap}
.candidate-preview__entry p{margin-top:.5rem;font-size:.82rem;line-height:1.65}
.candidate-preview__aside{padding:1.4rem 1.25rem;border-left:1px solid var(--border);background:color-mix(in srgb,var(--panel) 65%,var(--surface))}
.candidate-preview__side-section{padding:0 0 1.25rem;margin:0 0 1.25rem;border-bottom:1px solid var(--border)}
.candidate-preview__side-section h2{margin-bottom:.8rem;font-size:1.05rem}
.candidate-preview__download{min-height:3rem;border:0;border-radius:.5rem;background:var(--palette-ink);color:#fff;font-size:.82rem}
.candidate-preview__download:hover{background:var(--primary)}
.candidate-preview__side-note,.candidate-preview__privacy p{font-size:.78rem;line-height:1.65}
.candidate-preview__languages{gap:0}
.candidate-preview__languages li{padding:.7rem 0;border-top:1px solid var(--border);border-radius:0;background:transparent;font-size:.83rem}
.candidate-preview__languages li strong{font-weight:700}
.candidate-preview__languages li span{font-size:.78rem}
.candidate-preview__privacy>div{display:flex;align-items:flex-start;gap:.7rem;color:var(--muted-foreground)}
.candidate-preview__privacy>div svg{flex:none;margin-top:.15rem;color:var(--primary)}
.candidate-preview__privacy>div p{margin:0}
@media(max-width:900px){.candidate-preview__identity{grid-template-columns:9rem minmax(0,1fr);gap:1.2rem}.candidate-preview__photo{width:9rem;height:8rem}.candidate-preview__language-summary{grid-column:2;justify-content:flex-start}.candidate-preview__layout{grid-template-columns:minmax(0,1.5fr) minmax(14rem,1fr)}}
@media(max-width:700px){.candidate-preview__identity{grid-template-columns:6rem minmax(0,1fr);gap:1rem;padding:1rem .85rem}.candidate-preview__photo{width:6rem;height:6rem}.candidate-preview__identity-copy h2{font-size:1.35rem}.candidate-preview__identity-copy>strong{font-size:.78rem}.candidate-preview__language-summary{grid-column:1/-1}.candidate-preview__layout{grid-template-columns:1fr}.candidate-preview__main{padding-inline:.85rem}.candidate-preview__aside{border-top:1px solid var(--border);border-left:0;padding:1.1rem .85rem}.candidate-preview__entry{grid-template-columns:1fr;gap:.3rem}.candidate-preview__entry>div{grid-column:1;grid-row:2}.candidate-preview__entry time{grid-column:1;grid-row:1}.candidate-preview__section{padding-left:1.5rem}}
.candidate-preview__aside{background:#f7ede6}
.candidate-preview__download{background:#2f5f52;color:#fff}
.candidate-preview__download:hover{background:#234b40}
.candidate-preview__language-section h2{padding-bottom:.8rem;border-bottom:0}
.candidate-preview__languages{gap:0}
.candidate-preview__languages li{display:flex;min-height:3.1rem;grid-template-columns:none;align-items:center;justify-content:space-between;gap:.8rem;padding:.65rem 0;border:0;border-top:1px solid #e3cfc1;border-left:0;border-radius:0;background:transparent}
.candidate-preview__languages li:first-child{border-top:0}
.candidate-preview__languages li strong{font-size:.82rem;font-weight:700}
.candidate-preview__languages li .candidate-preview__language-level{padding:0;border-radius:0;background:transparent;color:#5f6f6b;font-size:.75rem;font-weight:500}
.candidate-preview__language-mark,.candidate-preview__language-copy{display:none}
.candidate-preview__side-section{border-bottom:1px solid #e3cfc1}
.candidate-preview__contact{display:grid;gap:.35rem}
.candidate-preview__contact h2{margin-bottom:.3rem}
.candidate-preview__contact-link{display:flex;align-items:center;gap:.7rem;min-width:0;padding:.65rem 0;color:var(--foreground);text-decoration:none}
.candidate-preview__contact-link>svg{flex:none;color:var(--primary)}
.candidate-preview__contact-link>span{display:grid;gap:.18rem;min-width:0}
.candidate-preview__contact-link small{color:var(--muted-foreground);font-size:.68rem}
.candidate-preview__contact-link strong{overflow-wrap:anywhere;font-size:.78rem}
.candidate-preview__contact-link--whatsapp>svg{width:1.25rem;height:1.25rem;flex:none;color:#1fa968}
.candidate-preview__contact-link--whatsapp:hover strong{color:#12825a}
.candidate-preview__contact-link:hover strong{text-decoration:underline;text-underline-offset:.15rem}
.candidate-preview__contact-empty{margin:.2rem 0 0;color:var(--muted-foreground);font-size:.78rem}
.candidate-preview__photo{box-sizing:border-box!important;width:clamp(5rem,12vw,8rem)!important;height:clamp(5rem,12vw,8rem)!important;aspect-ratio:1;flex:none;border-radius:50%!important;object-fit:cover;object-position:center}
.candidate-preview__identity{grid-template-columns:clamp(5rem,12vw,8rem) minmax(0,1fr) auto}
@media(max-width:700px){.candidate-preview__photo{width:clamp(5rem,18vw,6rem)!important;height:clamp(5rem,18vw,6rem)!important}.candidate-preview__identity{grid-template-columns:clamp(5rem,18vw,6rem) minmax(0,1fr)}}

/* Reference treatment: a deep green profile banner over warm, lifted cards. */
.candidate-preview{display:grid;gap:1rem;overflow:visible}
.candidate-preview__identity{position:relative;isolation:isolate;overflow:hidden;display:grid;grid-template-columns:clamp(6rem,10vw,9rem) minmax(0,1fr) auto;gap:1.4rem;min-height:12rem;margin:0;padding:1.35rem 1.5rem;border:0;border-radius:1rem;background-color:#1b3a33;background-image:linear-gradient(105deg,rgb(18 55 46 / 94%),rgb(36 83 69 / 90%)),url('/assets/jinowork-svgs-mejorados/left/03-ondas-oscuras.svg'),url('/assets/jinowork-svgs-mejorados/left/01-contornos-oscuros.svg');background-position:center,center bottom,center;background-size:cover,cover,cover;box-shadow:0 14px 32px rgb(27 58 51 / 16%)}
.candidate-preview__identity:after{position:absolute;z-index:-1;right:-3rem;bottom:-6rem;width:15rem;height:9rem;border-radius:50%;background:#e08c74;content:"";transform:rotate(-18deg)}
.candidate-preview__photo{width:clamp(6rem,10vw,9rem)!important;height:clamp(6rem,10vw,9rem)!important;border:4px solid rgb(255 253 251 / 88%);border-radius:50%!important;background:#e9f0ec;box-shadow:0 8px 20px rgb(0 0 0 / 16%)}
.candidate-preview__identity-copy{align-content:center;gap:.42rem}
.candidate-preview__identity-copy>p{justify-self:start;margin:0;padding:.38rem .7rem;border:1px solid rgb(255 255 255 / 14%);border-radius:999px;background:rgb(62 127 105 / 65%);color:#fffdfb;font-size:.65rem;letter-spacing:.08em}
.candidate-preview__identity-copy h2{color:#fffdfb;font-size:clamp(1.45rem,2.5vw,2.3rem)}
.candidate-preview__identity-copy>strong,.candidate-preview__location{color:rgb(255 253 251 / 86%)}
.candidate-preview__location svg{color:#f4d9d0}
.candidate-preview__language-summary{align-self:center;position:relative;z-index:1;max-width:14rem;color:#fffdfb}
.candidate-preview__language-summary>span+span{border-color:rgb(255 253 251 / 28%)}
.candidate-preview__language-summary small{color:rgb(255 253 251 / 75%)}
.candidate-preview__layout{grid-template-columns:minmax(0,1.7fr) minmax(17rem,.72fr);gap:1rem;align-items:start}
.candidate-preview__main{display:grid;gap:1rem;padding:0}
.candidate-preview__section{min-width:0;margin:0;padding:1.2rem 1.25rem 1.25rem 2rem;border:1px solid #f0dacf;border-radius:1rem;background:rgb(255 253 251 / 95%);box-shadow:0 12px 28px rgb(85 48 33 / 7%)}
.candidate-preview__section:before{top:1.45rem;left:1rem;height:1.35rem;background:#e08c74}
.candidate-preview__section h2{margin-bottom:.65rem;color:#1b3a33;font-size:1.15rem}
.candidate-preview__description{color:#25312f;font-size:.9rem;line-height:1.68}
.candidate-preview__entry>div:before{border-color:#fffdfb;background:#2f5f52;box-shadow:0 0 0 3px #dce8e4}
.candidate-preview__aside{display:grid;gap:1rem;align-content:start;padding:0;border:0;background:transparent}
.candidate-preview__side-section{margin:0;padding:1.15rem 1.2rem;border:1px solid #f0dacf;border-radius:1rem;background:rgb(255 253 251 / 95%);box-shadow:0 12px 28px rgb(85 48 33 / 7%)}
.candidate-preview__side-section h2{color:#1b3a33}
.candidate-preview__download{border:0;border-radius:.7rem;background:linear-gradient(120deg,#2f5f52,#3e7f69);color:#fff}
.candidate-preview__download:hover{background:#234b40}
.candidate-preview__languages li{border-color:#f0dacf}
.candidate-preview__languages li .candidate-preview__language-level{padding:.28rem .6rem;border-radius:999px;background:#dceee3;color:#1b3a33;font-weight:700}
.candidate-preview__contact-link+.candidate-preview__contact-link{border-top:1px solid #f0dacf}
@media(max-width:900px){.candidate-preview__layout{grid-template-columns:minmax(0,1fr)}.candidate-preview__aside{grid-template-columns:repeat(2,minmax(0,1fr))}.candidate-preview__contact{grid-column:1/-1}}
@media(max-width:700px){.candidate-preview__identity{grid-template-columns:5.5rem minmax(0,1fr);gap:.9rem;padding:1rem}.candidate-preview__photo{width:5.5rem!important;height:5.5rem!important}.candidate-preview__language-summary{grid-column:2;justify-content:flex-start;align-self:start}.candidate-preview__layout{grid-template-columns:minmax(0,1fr)}.candidate-preview__main{padding:0}.candidate-preview__aside{grid-template-columns:1fr}.candidate-preview__contact{grid-column:auto}.candidate-preview__section{padding:1rem 1rem 1rem 1.8rem}.candidate-preview__section:before{left:.8rem}.candidate-preview__side-section{padding:1rem}}
</style>
