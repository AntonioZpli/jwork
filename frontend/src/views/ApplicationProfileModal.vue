<script setup lang="ts">
import { Mail, X } from 'lucide-vue-next'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import CandidateCredentials from '@/components/workspace/CandidateCredentials.vue'
import { candidateFileUrl } from '@/services/profiles'
import type { AppRow } from './applicationStatus'
import { candidateArea, candidateLocation } from './applicationStatus'

const props = defineProps<{ application: AppRow }>()
const emit = defineEmits<{ close: [] }>()
const photoFailed = ref(false)

const languageLevels: Record<string, string> = {
  BASIC: 'Básico',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  NATIVE: 'Nativo',
}

let opener: HTMLElement | null = null
let previousOverflow = ''

function focusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(
    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => element.getAttribute('aria-hidden') !== 'true')
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return

  const dialog = document.querySelector<HTMLElement>('[data-application-profile-dialog]')
  if (!dialog) return
  const elements = focusableElements(dialog)
  const first = elements[0]
  const last = elements.at(-1)
  if (!first || !last) {
    event.preventDefault()
    dialog.focus()
  } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(async () => {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onDocumentKeydown)
  await nextTick()
  document.querySelector<HTMLButtonElement>('[data-application-profile-close]')?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
  document.body.style.overflow = previousOverflow
  opener?.focus()
})
</script>

<template>
  <Teleport to="body">
    <div class="profile-modal" role="presentation" @click.self="emit('close')">
      <section class="profile-modal__panel" role="dialog" aria-modal="true" aria-labelledby="application-profile-title" tabindex="-1" data-application-profile-dialog>
        <header class="profile-modal__header">
          <div class="profile-modal__identity">
            <span class="profile-modal__avatar" aria-hidden="true">
              <img v-if="application.candidateProfile.photoUrl && !photoFailed" :src="candidateFileUrl('photo', application.candidateProfile.photoUrl)" alt="" crossorigin="use-credentials" @error="photoFailed = true">
              <span v-else>{{ application.candidateProfile.firstName.charAt(0) }}{{ application.candidateProfile.lastName.charAt(0) }}</span>
            </span>
            <div class="profile-modal__copy">
              <p>Perfil profesional</p>
              <h2 id="application-profile-title">{{ application.candidateProfile.firstName }} {{ application.candidateProfile.lastName }}</h2>
              <strong>{{ candidateArea(application) }}</strong>
              <span>{{ candidateLocation(application) }}</span>
            </div>
          </div>
          <button type="button" aria-label="Cerrar perfil" data-application-profile-close @click="emit('close')"><X :size="18" aria-hidden="true" /></button>
        </header>
        <div class="profile-modal__body">
          <main>
            <section class="profile-modal__about">
              <h3>Sobre mí</h3>
              <p v-if="application.candidateProfile.description">{{ application.candidateProfile.description }}</p>
              <p v-else class="profile-modal__empty">No agregó un resumen profesional.</p>
            </section>
            <CandidateCredentials :candidate="application.candidateProfile" :show-languages="false" />
          </main>
          <aside>
            <a v-if="application.candidateProfile.cvUrl" class="profile-modal__download" :href="candidateFileUrl('cv', application.candidateProfile.cvUrl)" target="_blank" rel="noopener noreferrer">Descargar currículum <span aria-hidden="true">↓</span></a>
            <p v-else class="profile-modal__empty">Sin currículum adjunto</p>
            <section class="profile-modal__contact">
              <h3>Contacto</h3>
              <a v-if="application.candidateProfile.contactEmail" class="profile-modal__contact-link" :href="`mailto:${application.candidateProfile.contactEmail}`">
                <Mail :size="19" aria-hidden="true" />
                <span><small>Correo electrónico</small><strong>{{ application.candidateProfile.contactEmail }}</strong></span>
              </a>
              <a v-if="application.candidateProfile.phone" class="profile-modal__contact-link profile-modal__contact-link--whatsapp" :href="`https://wa.me/${application.candidateProfile.phone.replace(/\D/g, '')}`" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 2.67a13.18 13.18 0 0 0-11.3 20l-1.4 5.13 5.25-1.38a13.2 13.2 0 1 0 7.45-23.75Zm0 23.95c-1.96 0-3.88-.53-5.56-1.53l-.4-.24-3.11.82.83-3.03-.26-.42a10.76 10.76 0 1 1 8.5 4.4Zm5.9-8.06c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.52-.16-.74.16-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.32-.16-1.35-.5-2.57-1.6-.95-.84-1.6-1.88-1.79-2.2-.19-.32-.02-.5.14-.66.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.11-.22.05-.41-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.54-.73-.55h-.62c-.22 0-.57.08-.87.41-.3.32-1.14 1.11-1.14 2.7s1.17 3.13 1.33 3.35c.16.22 2.3 3.52 5.57 4.94.78.34 1.39.55 1.87.7.79.25 1.5.21 2.06.13.63-.09 1.9-.78 2.16-1.54.27-.76.27-1.41.19-1.54-.08-.13-.3-.21-.62-.37Z" /></svg>
                <span><small>WhatsApp</small><strong>{{ application.candidateProfile.phone }}</strong></span>
              </a>
              <p v-if="!application.candidateProfile.contactEmail && !application.candidateProfile.phone" class="profile-modal__empty">No compartió datos de contacto.</p>
            </section>
            <section v-if="application.candidateProfile.languages.length" class="profile-modal__languages">
              <h3>Idiomas</h3>
              <p v-for="item in application.candidateProfile.languages" :key="item.language.name">{{ item.language.name }} <span>{{ languageLevels[item.level] ?? item.level }}</span></p>
            </section>
          </aside>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.profile-modal{position:fixed;z-index:1000;inset:0;display:grid;place-items:center;padding:max(1rem,env(safe-area-inset-top)) max(1rem,env(safe-area-inset-right)) max(1rem,env(safe-area-inset-bottom)) max(1rem,env(safe-area-inset-left));background:rgb(15 27 43 / 55%)}
.profile-modal__panel{display:flex;width:min(68rem,100%);max-height:min(92vh,92dvh,60rem);flex-direction:column;overflow:auto;overscroll-behavior:contain;border:1px solid var(--border);border-radius:1rem;background:var(--surface);color:var(--foreground);box-shadow:0 28px 90px rgb(7 19 35 / 30%)}
.profile-modal__header{position:sticky;z-index:2;top:0;display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;padding:1.35rem 1.6rem;border-bottom:1px solid var(--border);background:var(--surface)}
.profile-modal__identity{display:flex;flex:1;align-items:center;gap:1rem;min-width:0}
.profile-modal__header .profile-modal__avatar{display:grid;width:4.5rem;height:4.5rem;flex:none;place-items:center;overflow:hidden;border-radius:50%;background:color-mix(in srgb,var(--primary) 12%,var(--surface));color:var(--primary);font:800 1.2rem Manrope,sans-serif}
.profile-modal__avatar img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 42%!important}
.profile-modal__copy{display:grid;gap:.35rem;min-width:0}
.profile-modal__header p{margin:0;color:var(--primary);font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.profile-modal__header h2{margin:0;font:800 clamp(1.35rem,3vw,2rem)/1.2 Manrope,sans-serif;overflow-wrap:anywhere}
.profile-modal__header strong{font-size:.85rem}
.profile-modal__header span,.profile-modal__empty{color:var(--muted-foreground);font-size:.8rem}
.profile-modal__header>button{width:2.4rem;height:2.4rem;flex:none;border:1px solid var(--border);border-radius:.55rem;background:var(--surface);color:var(--foreground);font-size:1.4rem;cursor:pointer}
.profile-modal__header>button:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.profile-modal__body{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(14rem,.8fr);min-height:0}
.profile-modal__body main{min-width:0;padding:0 1.6rem}
.profile-modal__body main>section,.profile-modal__body aside>section{padding:1.2rem 0;border-bottom:1px solid var(--border)}
.profile-modal__body h3{margin:0 0 .65rem;font:750 1rem Manrope,sans-serif}
.profile-modal__about>p{margin:0;color:var(--muted-foreground);font-size:.85rem;line-height:1.7;white-space:pre-line}
.profile-modal__body aside{min-width:0;padding:1.2rem 1.3rem;border-left:1px solid var(--border);background:color-mix(in srgb,var(--panel) 60%,var(--surface))}
.profile-modal__download{display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.85rem 1rem;border-radius:.55rem;background:linear-gradient(110deg,var(--palette-violet),var(--primary));color:#fff;font-size:.8rem;font-weight:750;text-decoration:none}
.profile-modal__contact{display:grid;gap:.65rem}
.profile-modal__contact h3{margin-bottom:0}
.profile-modal__contact-link{display:flex;align-items:center;gap:.7rem;min-width:0;padding:.7rem;border:1px solid var(--border);border-radius:.55rem;color:var(--foreground);text-decoration:none}
.profile-modal__contact-link>svg{flex:none;color:var(--primary)}
.profile-modal__contact-link>span{display:grid;gap:.18rem;min-width:0}
.profile-modal__contact-link small{color:var(--muted-foreground);font-size:.68rem}
.profile-modal__contact-link strong{font-size:.76rem;overflow-wrap:anywhere}
.profile-modal__contact-link--whatsapp{border-color:#b7e1ce;background:#f0faf4;color:#075e45}
.profile-modal__contact-link--whatsapp svg{width:1.3rem;height:1.3rem;flex:none;color:#16774b}
.profile-modal__languages>p{display:flex;justify-content:space-between;gap:.6rem;margin:.55rem 0;font-size:.8rem;font-weight:700}
.profile-modal__languages>p span{color:var(--muted-foreground);font-weight:500}
.profile-modal__header .profile-modal__avatar{box-sizing:border-box!important;width:clamp(3.5rem,10vw,5rem)!important;height:clamp(3.5rem,10vw,5rem)!important;aspect-ratio:1;border-radius:50%!important}
.profile-modal__avatar img{object-position:50% 42%!important;border-radius:50%!important}
@supports(backdrop-filter:blur(4px)){.profile-modal{backdrop-filter:blur(5px)}}
@media(max-width:700px){.profile-modal{align-items:end;padding:max(.45rem,env(safe-area-inset-top)) max(.45rem,env(safe-area-inset-right)) max(.45rem,env(safe-area-inset-bottom)) max(.45rem,env(safe-area-inset-left))}.profile-modal__panel{max-height:min(95vh,95dvh);border-radius:.75rem}.profile-modal__header{gap:.75rem;padding:1rem}.profile-modal__body{grid-template-columns:minmax(0,1fr)}.profile-modal__body main{padding-inline:1rem}.profile-modal__body aside{border-top:1px solid var(--border);border-left:0}}
@media(prefers-reduced-motion:reduce){.profile-modal{backdrop-filter:none}}
</style>

<style scoped>
/* Mismo lenguaje visual que la vista previa del perfil profesional. */
.profile-modal{z-index:1300;background:rgb(13 31 27 / 62%);backdrop-filter:blur(7px)}
.profile-modal__panel{display:grid;gap:1rem;width:min(76rem,100%);max-height:min(92vh,92dvh,64rem);box-sizing:border-box;overflow:auto;padding:1rem;border:1px solid #f0dacf;border-radius:1.15rem;background:#fffdfb;color:#16302b;box-shadow:0 28px 90px rgb(7 19 35 / 30%)}
.profile-modal__header{position:relative;isolation:isolate;min-height:10rem;align-items:center;overflow:hidden;padding:1.5rem 4.5rem 1.5rem 1.6rem;border:0;border-radius:1rem;background-color:#1b3a33;background-image:linear-gradient(105deg,rgb(18 55 46 / 95%),rgb(36 83 69 / 91%)),url('/assets/jinowork-svgs-mejorados/left/03-ondas-oscuras.svg'),url('/assets/jinowork-svgs-mejorados/left/01-contornos-oscuros.svg');background-position:center,center bottom,center;background-size:cover,cover,cover;box-shadow:0 14px 32px rgb(27 58 51 / 16%)}
.profile-modal__header:after{position:absolute;z-index:-1;right:-3rem;bottom:-6rem;width:15rem;height:9rem;border-radius:50%;background:#e08c74;content:"";transform:rotate(-18deg)}
.profile-modal__identity{position:relative;z-index:1;gap:1.2rem}
.profile-modal__header .profile-modal__avatar{box-sizing:border-box;width:clamp(5rem,9vw,7rem);height:clamp(5rem,9vw,7rem);border:4px solid rgb(255 253 251 / 88%);background:#e9f0ec;box-shadow:0 8px 20px rgb(0 0 0 / 16%)}
.profile-modal__copy{gap:.38rem}
.profile-modal__header p{justify-self:start;margin:0;padding:.38rem .7rem;border:1px solid rgb(255 255 255 / 14%);border-radius:999px;background:rgb(62 127 105 / 65%);color:#fffdfb;font-size:.65rem;letter-spacing:.08em}
.profile-modal__header h2{color:#fffdfb;font-size:clamp(1.45rem,2.5vw,2.3rem);line-height:1.15}
.profile-modal__header strong,.profile-modal__header .profile-modal__copy>span{color:rgb(255 253 251 / 88%)}
.profile-modal__header strong{font-size:.85rem}
.profile-modal__header .profile-modal__copy>span{font-size:.77rem}
.profile-modal__header>button{position:absolute;z-index:2;top:1rem;right:1rem;display:grid;width:2.5rem;height:2.5rem;place-items:center;border:1px solid rgb(255 253 251 / 40%);border-radius:50%;background:rgb(255 253 251 / 10%);color:#fff;transition:background .16s,color .16s}
.profile-modal__header>button:hover{background:#fffdfb;color:#1b3a33}
.profile-modal__body{grid-template-columns:minmax(0,1.7fr) minmax(17rem,.72fr);align-items:start;gap:1rem}
.profile-modal__body main{display:grid;gap:1rem;padding:0}
.profile-modal__body main>section,.profile-modal__body aside>section{padding:1.2rem 1.25rem;border:1px solid #f0dacf;border-radius:1rem;background:rgb(255 253 251 / 96%);box-shadow:0 12px 28px rgb(85 48 33 / 7%)}
.profile-modal__body h3{margin:0 0 .65rem;color:#1b3a33;font-size:1.05rem}
.profile-modal__about{position:relative;padding-left:2rem!important}
.profile-modal__about:before{position:absolute;top:1.4rem;left:1rem;width:3px;height:1.3rem;border-radius:3px;background:#e08c74;content:""}
.profile-modal__about>p{color:#394b46;font-size:.86rem;line-height:1.7}
.profile-modal__body aside{display:grid;align-content:start;gap:1rem;min-width:0;padding:0;border:0;background:transparent}
.profile-modal__body aside>section{margin:0}
.profile-modal__download{min-height:2.75rem;padding:.55rem .8rem;border-radius:.7rem;background:linear-gradient(120deg,#2f5f52,#3e7f69);font-size:.8rem}
.profile-modal__download:hover{background:#234b40}
.profile-modal__contact{display:grid;gap:.65rem}
.profile-modal__contact-link{padding:.75rem;border-color:#f0dacf;border-radius:.75rem;background:#fffdfb}
.profile-modal__contact-link--whatsapp{border-color:#cce6d8;background:#edf6f0;color:#1b3a33}
.profile-modal__contact-link--whatsapp>svg{color:#2f5f52}
.profile-modal__languages>p{padding:.55rem 0;margin:0;border-top:1px solid #f0dacf}
.profile-modal__languages>p:first-of-type{border-top:0}
.profile-modal :deep(.candidate-credentials){grid-template-columns:minmax(0,1fr);gap:1rem;margin:0}
.profile-modal :deep(.candidate-credentials section){padding:1.2rem 1.25rem;border:1px solid #f0dacf;border-radius:1rem;background:rgb(255 253 251 / 96%);box-shadow:0 12px 28px rgb(85 48 33 / 7%)}
.profile-modal :deep(.candidate-credentials h3){margin-bottom:.7rem;color:#1b3a33;font-size:1.05rem;letter-spacing:0;text-transform:none}
.profile-modal :deep(.candidate-credentials article){gap:.25rem;padding:.7rem 0;border-color:#f0dacf}
.profile-modal :deep(.candidate-credentials article strong){color:#16302b;font-size:.84rem}
.profile-modal :deep(.candidate-credentials article span),.profile-modal :deep(.candidate-credentials article p){color:#5f6f6b;font-size:.76rem;line-height:1.6}
.profile-modal :deep(.candidate-credentials__more){color:#2f5f52}
@media(max-width:900px){.profile-modal__body{grid-template-columns:minmax(0,1fr)}.profile-modal__body aside{grid-template-columns:repeat(2,minmax(0,1fr))}.profile-modal__contact{grid-column:1/-1}}
@media(max-width:700px){.profile-modal{align-items:end;padding:max(.45rem,env(safe-area-inset-top)) max(.45rem,env(safe-area-inset-right)) max(.45rem,env(safe-area-inset-bottom)) max(.45rem,env(safe-area-inset-left))}.profile-modal__panel{gap:.7rem;max-height:95dvh;padding:.65rem;border-radius:1rem}.profile-modal__header{min-height:8rem;padding:1rem 3.7rem 1rem 1rem;border-radius:.9rem}.profile-modal__identity{align-items:center;gap:.8rem}.profile-modal__header .profile-modal__avatar{width:4.5rem;height:4.5rem}.profile-modal__header h2{font-size:1.35rem}.profile-modal__body{gap:.7rem}.profile-modal__body main{gap:.7rem}.profile-modal__body aside{grid-template-columns:minmax(0,1fr);gap:.7rem}.profile-modal__contact{grid-column:auto}.profile-modal__body main>section,.profile-modal__body aside>section,.profile-modal :deep(.candidate-credentials section){padding:1rem}.profile-modal__about{padding-left:1.75rem!important}.profile-modal__about:before{left:.8rem}}
@media(prefers-reduced-motion:reduce){.profile-modal__header>button{transition:none}}
</style>
