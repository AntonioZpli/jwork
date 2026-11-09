<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { LogOut, Search } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import WorkspaceNavigation from './WorkspaceNavigation.vue'
import { companyLogoUrl, loadCandidatePhoto, profilesApi } from '@/services/profiles'
import { profileAvatarStyle, profileInitials } from '@/utils/profileAvatar'

const props = defineProps<{ eyebrow: string; title: string; subtitle: string; initials: string }>()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isCompany = computed(() => route.path.startsWith('/company'))
const candidateSearch = ref(typeof route.query.q === 'string' ? route.query.q : '')
const companySearch = ref(typeof route.query.q === 'string' ? route.query.q : '')
const candidatePhoto = ref('')
const companyLogoId = ref<string | null>(null)
const companyName = ref('')
const companySector = ref('')
const candidateName = ref('')
const candidateArea = ref('')
const avatarInitials = computed(() => profileInitials(isCompany.value ? companyName.value || props.initials : candidateName.value || props.initials))
const avatarStyle = computed(() => profileAvatarStyle(isCompany.value ? companyName.value : candidateName.value, isCompany.value ? companySector.value : candidateArea.value))
const companyLogo = computed(() => companyLogoId.value ? companyLogoUrl(companyLogoId.value) : '')
const isCompactViewport = ref(false)
let compactViewportQuery: MediaQueryList | undefined
function updateCompactViewport(event: MediaQueryList | MediaQueryListEvent) {
  isCompactViewport.value = event.matches
}
let candidatePhotoRequest = 0
onBeforeUnmount(() => {
  compactViewportQuery?.removeEventListener('change', updateCompactViewport)
  window.removeEventListener('jinowork:candidate-photo-updated', onCandidatePhotoUpdated)
  window.removeEventListener('jinowork:company-logo-updated', onCompanyLogoUpdated)
  candidatePhotoRequest += 1
  if (candidatePhoto.value) URL.revokeObjectURL(candidatePhoto.value)
})
function searchJobs() {
  const query = candidateSearch.value.trim()
  void router.push({ path: '/jobs', query: query ? { q: query } : {} })
}
function searchCompanyJobs() {
  const query = companySearch.value.trim()
  void router.push({ path: '/company/jobs', query: query ? { q: query } : {} })
}
watch(() => route.query.q, value => {
  candidateSearch.value = typeof value === 'string' ? value : ''
  companySearch.value = typeof value === 'string' ? value : ''
})
async function refreshCandidatePhoto(fileId?: string | null) {
  if (isCompany.value || auth.user?.role !== 'CANDIDATE') return
  const requestId = ++candidatePhotoRequest
  try {
    const result = await profilesApi.candidate()
    candidateName.value = `${result.profile.firstName} ${result.profile.lastName}`.trim()
    candidateArea.value = result.catalogs.professionalAreas.find(item => item.id === result.profile.professionalAreaId)?.name ?? ''
    const id = fileId === undefined ? result.profile.photoUrl : fileId
    if (!id) {
      if (requestId === candidatePhotoRequest && candidatePhoto.value) URL.revokeObjectURL(candidatePhoto.value)
      if (requestId === candidatePhotoRequest) candidatePhoto.value = ''
      return
    }
    const nextPhoto = await loadCandidatePhoto(id)
    if (requestId !== candidatePhotoRequest) { URL.revokeObjectURL(nextPhoto); return }
    if (candidatePhoto.value) URL.revokeObjectURL(candidatePhoto.value)
    candidatePhoto.value = nextPhoto
  } catch { /* The navigation keeps a neutral placeholder if the profile has no accessible photo. */ }
}
function onCandidatePhotoUpdated(event: Event) {
  const detail = (event as CustomEvent<{ fileId: string | null }>).detail
  void refreshCandidatePhoto(detail?.fileId ?? null)
}
async function refreshCompanyLogo() {
  if (!isCompany.value) return
  try {
    const result = await profilesApi.company()
    companyName.value = result.profile.name
    companySector.value = result.catalogs.economicSectors.find(item => item.id === result.profile.economicSectorId)?.name ?? ''
    companyLogoId.value = result.profile.logoUrl
  } catch { /* Keep the initials placeholder when the company profile is unavailable. */ }
}
function onCompanyLogoUpdated() { void refreshCompanyLogo() }
onMounted(() => {
  compactViewportQuery = window.matchMedia('(max-width: 1024px)')
  updateCompactViewport(compactViewportQuery)
  compactViewportQuery.addEventListener('change', updateCompactViewport)
  window.addEventListener('jinowork:candidate-photo-updated', onCandidatePhotoUpdated)
  window.addEventListener('jinowork:company-logo-updated', onCompanyLogoUpdated)
  if (isCompany.value) void refreshCompanyLogo()
  else void refreshCandidatePhoto()
})

async function signOut() {
  try { await auth.logout() } finally { await router.replace('/auth') }
}
</script>

<template>
  <div class="workspace" :class="{ 'workspace--company': isCompany, 'workspace--candidate': !isCompany }">
    <div class="workspace__content">
      <header v-if="isCompany" class="company-topbar">
        <RouterLink class="company-topbar__brand" to="/company" aria-label="Jinowork, panel de empresa">jinowork</RouterLink>
        <form class="company-topbar__search" role="search" @submit.prevent="searchCompanyJobs"><Search :size="18" aria-hidden="true" /><input v-model="companySearch" type="search" aria-label="Buscar en mis ofertas" placeholder="Buscar ofertas…"></form>
        <Teleport to="body" :disabled="!isCompactViewport">
          <WorkspaceNavigation role="COMPANY" />
        </Teleport>
        <div class="company-topbar__actions">
          <RouterLink class="company-topbar__avatar" :style="avatarStyle" to="/company/profile" aria-label="Ver perfil completo de la empresa" title="Ver perfil completo"><img v-if="companyLogo" :src="companyLogo" alt=""><span v-else>{{ avatarInitials }}</span></RouterLink>
          
          <button class="company-topbar__logout" type="button" aria-label="Cerrar sesión" title="Cerrar sesión" @click="signOut"><LogOut :size="18" aria-hidden="true" /></button>
        </div>
      </header>
      <header v-else class="candidate-topbar">
        <RouterLink class="candidate-topbar__brand" to="/candidate" aria-label="Jinowork, inicio">jinowork</RouterLink>
        <form class="candidate-topbar__search" role="search" @submit.prevent="searchJobs"><Search :size="18" aria-hidden="true" /><input v-model="candidateSearch" type="search" aria-label="Buscar empleos o empresas" placeholder="Buscar empleos, empresas…"></form>
        <Teleport to="body" :disabled="!isCompactViewport">
          <WorkspaceNavigation role="CANDIDATE" />
        </Teleport>
        <div class="candidate-topbar__actions">
          <RouterLink class="candidate-topbar__avatar" to="/candidate/profile/preview" aria-label="Vista previa de mi perfil" title="Vista previa del perfil">
            <img v-if="candidatePhoto" :src="candidatePhoto" alt="">
            <span v-else :style="avatarStyle">{{ avatarInitials }}</span>
          </RouterLink>
          
          <button class="candidate-topbar__logout" type="button" aria-label="Cerrar sesión" title="Cerrar sesión" @click="signOut"><LogOut :size="18" aria-hidden="true" /></button>
        </div>
      </header>
      <main class="workspace__main">
        <div class="workspace__heading"><div><p v-if="eyebrow" class="workspace__eyebrow">{{ eyebrow }}</p><h1>{{ title }}</h1><p v-if="subtitle" class="workspace__subtitle">{{ subtitle }}</p></div><slot name="heading-action" /></div>
        <slot />
      </main>
      <footer class="workspace__footer">Jinowork · Conectando talento con oportunidades</footer>
    </div>
  </div>
</template>

<style>
.workspace{min-height:100vh;background:radial-gradient(ellipse at 90% 0%,color-mix(in srgb,var(--palette-blue) 23%,transparent),transparent 32%),var(--background);color:var(--foreground)}
.workspace__topbar{position:sticky;z-index:10;top:0;display:flex;height:4.6rem;align-items:center;justify-content:space-between;padding-inline:max(1.25rem,calc((100% - 82rem)/2));border-bottom:1px solid color-mix(in srgb,var(--palette-ink) 10%,var(--border));background:color-mix(in srgb,var(--surface) 90%,transparent);backdrop-filter:blur(16px)}
.workspace__brand{display:inline-flex;align-items:center;gap:.65rem;color:var(--palette-ink);font:800 1.16rem Manrope,sans-serif;letter-spacing:-.045em}.workspace__brand-mark{display:grid;width:2rem;height:2rem;place-items:center;border-radius:.7rem .7rem .7rem .2rem;background:var(--palette-ink);color:#fff;font:800 1.15rem Georgia,serif;box-shadow:0 6px 15px rgb(39 0 93 / 17%)}
.workspace__topbar-right{display:flex;align-items:center;gap:.75rem}.workspace__account-type{margin-right:.35rem;color:var(--muted-foreground);font-size:.8rem;font-weight:700}.workspace__avatar{display:grid;width:2.35rem;height:2.35rem;place-items:center;border-radius:50%;background:var(--secondary);color:var(--primary);font-size:.78rem;font-weight:850;box-shadow:0 0 0 3px var(--surface),0 0 0 4px var(--border)}.workspace__logout{display:inline-flex;align-items:center;gap:.4rem;margin-left:.15rem;padding:.5rem .7rem;border:0;border-radius:.6rem;background:transparent;color:var(--muted-foreground);font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}.workspace__logout:hover{background:var(--panel);color:var(--foreground)}
.workspace__main{width:min(82rem,100%);margin-inline:auto;padding:clamp(2rem,5vw,3.6rem) clamp(1rem,3.5vw,2.5rem) 2.5rem}.workspace__heading{display:flex;align-items:flex-end;justify-content:space-between;gap:1.2rem;margin-bottom:1.8rem}.workspace__eyebrow{margin:0 0 .5rem;color:var(--primary);font-size:.7rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.workspace__heading h1{max-width:48rem;margin:0;font:800 clamp(2rem,4vw,3.35rem)/.99 Manrope,sans-serif;letter-spacing:-.07em}.workspace__subtitle{max-width:49rem;margin:.75rem 0 0;color:var(--muted-foreground);font-size:.94rem;line-height:1.6}.workspace__footer{width:min(82rem,100%);margin-inline:auto;padding:1.2rem 1.25rem 1.5rem;border-top:1px solid var(--border);color:var(--muted-foreground);font-size:.77rem;text-align:center}
.workspace__card{border:1px solid color-mix(in srgb,var(--palette-ink) 10%,var(--border));border-radius:1rem;background:var(--surface);box-shadow:0 16px 42px color-mix(in srgb,var(--palette-ink) 6%,transparent)}.workspace__stat{position:relative;overflow:hidden;padding:1.35rem}.workspace__stat::after{position:absolute;right:-2.1rem;bottom:-3.2rem;width:7.5rem;height:7.5rem;border-radius:50%;background:color-mix(in srgb,var(--primary) 10%,transparent);content:""}.workspace__stat-label{position:relative;z-index:1;color:var(--muted-foreground);font-size:.83rem;font-weight:650}.workspace__stat-value{position:relative;z-index:1;margin-top:.65rem;font:800 clamp(1.7rem,3vw,2.35rem)/1 Manrope,sans-serif;letter-spacing:-.06em}.workspace__section{margin-top:1.35rem;padding:1.4rem}.workspace__section h2{margin:0 0 1rem;font:750 1.16rem Manrope,sans-serif;letter-spacing:-.035em}.workspace__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.workspace__list{display:grid;gap:.25rem}.workspace__row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 0;border-top:1px solid var(--border)}.workspace__row:first-child{padding-top:0;border-top:0}.workspace__row strong{display:block}.workspace__meta,.workspace__empty{color:var(--muted-foreground);font-size:.84rem;line-height:1.55}.workspace__pill{display:inline-flex;align-items:center;border:1px solid color-mix(in srgb,var(--primary) 14%,transparent);border-radius:999px;padding:.35rem .72rem;background:var(--secondary);color:var(--primary);font-size:.74rem;font-weight:750;white-space:nowrap}.workspace__cta{display:inline-flex;min-height:2.75rem;align-items:center;justify-content:center;border:1px solid transparent;border-radius:.75rem;padding:0 1.05rem;background:var(--primary);color:#fff;font-size:.85rem;font-weight:750;box-shadow:0 8px 20px color-mix(in srgb,var(--primary) 20%,transparent);transition:transform .18s,box-shadow .18s}.workspace__cta:hover{transform:translateY(-1px);box-shadow:0 11px 25px color-mix(in srgb,var(--primary) 27%,transparent)}.workspace__error{padding:1rem;border:1px solid #e3a5a5;border-radius:.8rem;background:#fff5f5;color:#8b1c1c}.workspace__notice{margin:0 0 1rem;padding:.9rem 1rem;border:1px solid color-mix(in srgb,var(--primary) 18%,transparent);border-radius:.8rem;background:var(--secondary);color:var(--foreground)}.workspace-loading{display:grid;min-height:70vh;place-items:center;padding:1.5rem}.candidate-dashboard__links{display:flex;flex-wrap:wrap;gap:.65rem;margin:0 0 1.2rem}.candidate-dashboard__links a{border:1px solid var(--border);border-radius:.7rem;padding:.55rem .8rem;background:var(--surface);color:var(--primary);font-size:.82rem;font-weight:700;transition:border-color .18s,background .18s}.candidate-dashboard__links a:hover{border-color:var(--primary);background:var(--secondary)}.candidate-job__title{display:block;font-weight:800}.candidate-job__title:hover{color:var(--primary)}.company-actions{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap}.company-actions__link{color:var(--primary);font-size:.85rem;font-weight:700}
@media(max-width:760px){.workspace__topbar{height:4.1rem;padding-inline:1rem}.workspace-nav{top:4.1rem}.workspace-nav__inner{min-height:3.65rem;gap:.1rem;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;padding-inline:.75rem}.workspace-nav__inner::-webkit-scrollbar{display:none}.workspace-nav__link{gap:.4rem;padding-inline:.72rem;font-size:.75rem}.workspace-nav__link svg{width:16px;height:16px}.workspace-nav__create{min-height:2.1rem;margin-left:.25rem;padding-inline:.65rem;font-size:.7rem}.workspace__account-type{display:none}.workspace__logout{width:2.3rem;height:2.3rem;justify-content:center;padding:0}.workspace__logout span{display:none}.workspace__main{padding:2rem 1rem}.workspace__heading{align-items:flex-start;flex-direction:column}.workspace__heading h1{font-size:2.4rem}.workspace__grid{grid-template-columns:1fr}.workspace__section{padding:1.05rem}.workspace__row{align-items:flex-start}.workspace__footer{padding-inline:1rem}}
@media(max-width:480px){.workspace__heading h1{font-size:2rem}.workspace__topbar-right{gap:.55rem}.workspace-nav__inner{padding-inline:.6rem}.workspace-nav__link{padding-inline:.65rem}.workspace-nav__link span{font-size:.7rem}.workspace__row{flex-direction:column}}
</style>

<style>
.workspace--candidate{display:block;min-height:100vh}
.candidate-topbar{position:sticky;z-index:20;top:0;display:flex;min-height:5.1rem;align-items:center;gap:clamp(1rem,2vw,2rem);padding:0 max(1.25rem,calc((100% - 96rem)/2));border-bottom:1px solid #e2e8f0;background:color-mix(in srgb,var(--surface) 97%,transparent)}
.candidate-topbar__brand{flex:none;color:var(--primary);font:850 1.3rem Manrope,sans-serif;letter-spacing:-.055em;text-decoration:none}
.candidate-topbar__search{display:flex;min-width:12rem;max-width:35rem;height:3rem;flex:1;align-items:center;gap:.65rem;padding:0 .9rem;border:1px solid #dce4ef;border-radius:.75rem;background:#f4f7fb;color:#8b9ab0;transition:border-color .16s,box-shadow .16s}
.candidate-topbar__search:focus-within{border-color:#4c8aff;box-shadow:0 0 0 3px rgb(52 115 245 / 12%)}
.candidate-topbar__search input{width:100%;min-width:0;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;color:var(--foreground);font:500 .86rem Manrope,sans-serif}
.candidate-topbar__search input::placeholder{color:#8b96a8;opacity:1}
.candidate-topbar__actions{display:flex;flex:none;align-items:center;gap:.9rem}
.candidate-topbar__avatar{display:grid;width:2.45rem;height:2.45rem;flex:none;overflow:hidden;place-items:center;border:0;border-radius:50%;background:linear-gradient(145deg,color-mix(in srgb,var(--job-accent,#63758d) 72%,white),var(--job-accent,#63758d));color:#fff;text-decoration:none;transition:filter .16s}
.candidate-topbar__avatar:hover,.candidate-topbar__avatar:focus-visible{border-color:#4c8aff;box-shadow:0 0 0 3px rgb(52 115 245 / 13%);outline:0}
.candidate-topbar__avatar img{width:100%;height:100%;object-fit:cover}
.candidate-topbar__avatar>span{display:grid;width:100%;height:100%;place-items:center;color:#fff;font-size:.72rem;font-weight:850;letter-spacing:.02em}
.candidate-topbar__logout{border:0;background:transparent;color:#7c899d;font:600 .82rem Manrope,sans-serif;cursor:pointer}
.candidate-topbar__logout:hover{color:var(--primary)}
.workspace-nav.workspace-nav--candidate{position:static;z-index:auto;top:auto;flex:none;overflow:visible;border:0;background:transparent;backdrop-filter:none}
.workspace-nav--candidate .workspace-nav__inner{display:flex;width:auto;min-height:0;align-items:center;flex-direction:row;gap:.3rem;margin:0;padding:0}
.workspace-nav--candidate .workspace-nav__label,.workspace-nav--candidate .workspace-nav__link svg{display:none}
.workspace-nav--candidate .workspace-nav__link{min-height:2.5rem;justify-content:center;gap:0;padding:0 .8rem;border:1px solid transparent;border-radius:.65rem;color:#58677e;font-size:.8rem;font-weight:700;white-space:nowrap}
.workspace-nav--candidate .workspace-nav__link:hover{background:#f4f7fb;color:#175ee8}
.workspace-nav--candidate .workspace-nav__link--active{border-color:#d7e9ff;background:#edf7ff;color:var(--primary);box-shadow:none}
.workspace-nav--candidate .workspace-nav__link:after{display:none}






@media(max-width:1100px){.candidate-topbar{gap:1rem}.candidate-topbar__search{max-width:25rem}.workspace-nav--candidate .workspace-nav__link{padding-inline:.55rem;font-size:.75rem}.candidate-topbar__actions{gap:.55rem}}
@media(max-width:1024px){.candidate-topbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.55rem 1rem;padding:.65rem 1rem}.candidate-topbar__brand{grid-column:1;grid-row:1}.candidate-topbar__search{display:none}.candidate-topbar__actions{grid-column:2;grid-row:1}.workspace.workspace--candidate>.workspace__content{padding-bottom:calc(5.15rem + env(safe-area-inset-bottom,0px))}}
@media(max-width:480px){.candidate-topbar{padding-inline:.75rem}.workspace-nav--candidate .workspace-nav__link{min-height:2.35rem;padding-inline:.5rem;font-size:.7rem}.candidate-topbar__actions{gap:.35rem}.candidate-topbar__avatar{width:2.2rem;height:2.2rem}}
</style>

<style>
.workspace{display:grid;grid-template-columns:15.75rem minmax(0,1fr);min-height:100vh;background:var(--background)}
.workspace__sidebar{position:sticky;top:0;display:flex;height:100vh;min-height:35rem;flex-direction:column;overflow:hidden;background:#102747;color:#fff;box-shadow:8px 0 28px rgb(12 36 68 / 9%)}
.workspace__brand{min-height:5.1rem;padding:0 1.45rem;border-bottom:1px solid rgb(255 255 255 / 10%);color:#fff;font-size:1.22rem}

.workspace__brand-mark{background:#d8eaff;color:#102747;box-shadow:none}
.workspace__sidebar-label{padding:1rem 1.5rem .2rem;color:rgb(218 230 248 / 64%);font-size:.7rem;font-weight:700}
.workspace__sidebar-bottom{display:flex;align-items:center;gap:.7rem;margin-top:auto;padding:1rem .9rem;border-top:1px solid rgb(255 255 255 / 11%)}
.workspace__sidebar-avatar{display:grid;width:2.2rem;height:2.2rem;flex:none;place-items:center;border-radius:.7rem;background:rgb(255 255 255 / 13%);color:#fff;font-size:.72rem;font-weight:850}
.workspace__sidebar-account{display:grid;min-width:0;flex:1;gap:.2rem}
.workspace__sidebar-account strong{overflow:hidden;color:#fff;font-size:.69rem;text-overflow:ellipsis;white-space:nowrap}
.workspace__sidebar-account small{color:rgb(218 230 248 / 62%);font-size:.65rem}
.workspace__sidebar-logout{display:grid;width:2rem;height:2rem;flex:none;place-items:center;border:0;border-radius:.55rem;background:transparent;color:rgb(226 236 249 / 75%);cursor:pointer}
.workspace__sidebar-logout:hover{background:rgb(255 255 255 / 10%);color:#fff}
.workspace__content{min-width:0}
.workspace__topbar{height:4.35rem;padding-inline:clamp(1.25rem,3vw,2.6rem)}
.workspace__menu-button{display:grid;width:2.3rem;height:2.3rem;flex:none;place-items:center;border:1px solid var(--border);border-radius:.65rem;background:var(--surface);color:var(--foreground);cursor:pointer}
.workspace__main{width:min(78rem,100%);padding-inline:clamp(1.25rem,3.5vw,3rem)}
.workspace__footer{width:min(78rem,100%)}
@media(max-width:900px){
  .workspace{display:block}
  .workspace__sidebar{position:fixed;z-index:31;inset:0 auto 0 0;width:min(18rem,86vw);height:100dvh;min-height:0;transform:translateX(-105%);transition:transform .24s ease;box-shadow:16px 0 40px rgb(4 18 38 / 30%)}
  .workspace__sidebar--open{transform:translateX(0)}
  .workspace__scrim{position:fixed;z-index:30;inset:0;border:0;background:rgb(5 18 34 / 52%);backdrop-filter:blur(2px)}
  .workspace__menu-button{display:grid;width:2.3rem;height:2.3rem;flex:none;place-items:center;border:1px solid var(--border);border-radius:.65rem;background:var(--surface);color:var(--foreground);cursor:pointer}
  .workspace__topbar{justify-content:space-between;padding-inline:1.1rem}
  .workspace__topbar-right{margin-left:auto}
  .workspace__main{padding-inline:clamp(1rem,4vw,2rem)}
}
@media(max-width:480px){.workspace__topbar{height:4rem;padding-inline:.8rem}.workspace__topbar-right{gap:.45rem}.workspace__main{padding-inline:.9rem}}
</style>

<style>
.workspace__main{padding-top:clamp(1.5rem,3vw,2.5rem)}
.workspace__heading{margin-bottom:1.25rem}
.workspace__subtitle{margin-top:.55rem;font-size:.88rem}
.workspace__section{margin-top:1rem;padding:1.15rem}
.workspace__section h2{margin-bottom:.75rem}
.workspace__stat{padding:1.1rem}
.workspace__row{padding:.8rem 0}
.workspace__empty{padding:.8rem 0}
@media(max-width:760px){.workspace__main{padding-top:1.35rem}.workspace__heading{margin-bottom:1rem}.workspace__section{padding:.9rem}}
</style>

<style>
.workspace :is(input:not([type=checkbox]):not([type=file]),select,textarea){border:1px solid var(--border);border-radius:.7rem;background:var(--surface);color:var(--foreground);transition:border-color .18s,box-shadow .18s,background .18s}.workspace :is(input:not([type=checkbox]):not([type=file]),select,textarea):focus{border-color:var(--palette-violet);outline:0;box-shadow:0 0 0 3px color-mix(in srgb,var(--palette-violet) 15%,transparent)}.workspace :is(input,select,textarea)::placeholder{color:var(--muted-foreground);opacity:.75}.workspace :is(button,a):focus-visible{outline:3px solid color-mix(in srgb,var(--palette-violet) 42%,transparent);outline-offset:2px}.workspace :is(.profile-section,.company-profile,.company-form){border:1px solid color-mix(in srgb,var(--palette-ink) 10%,var(--border));border-radius:1rem;background:var(--surface);box-shadow:0 14px 36px color-mix(in srgb,var(--palette-ink) 6%,transparent)}.workspace :is(.profile-section,.company-profile,.company-form)>h2,.workspace .company-form legend{color:var(--palette-ink);letter-spacing:-.035em}.workspace :is(.profile-actions button,.language-record button,.company-job-row__actions button,.company-application__form button,.saved-job__remove){transition:transform .16s,border-color .16s,background .16s,color .16s}.workspace :is(.profile-actions button,.language-record button,.company-job-row__actions button,.company-application__form button,.saved-job__remove):hover:not(:disabled){transform:translateY(-1px);border-color:var(--primary)}.workspace__empty{padding:1.25rem 0}.workspace__pill{letter-spacing:.005em}
</style>

<style>
.workspace--collapsed{grid-template-columns:5rem minmax(0,1fr)}
.workspace--collapsed .workspace__brand{justify-content:center;padding-inline:0}
.workspace--collapsed .workspace__brand>span:not(.workspace__brand-mark),.workspace--collapsed .workspace__sidebar-label,.workspace--collapsed .workspace-nav__label,.workspace--collapsed .workspace-nav__link span,.workspace--collapsed .workspace__sidebar-account{display:none}
.workspace--collapsed .workspace-nav__inner{padding-inline:.6rem}
.workspace--collapsed .workspace-nav__link{justify-content:center;padding-inline:0}
.workspace--collapsed .workspace__sidebar-bottom{justify-content:center;flex-wrap:wrap}
.workspace--collapsed .workspace__menu-button{margin-left:0}
.workspace-nav__link[title]{cursor:pointer}
@media(max-width:900px){.workspace--collapsed{display:block}.workspace--collapsed .workspace__sidebar{width:min(18rem,86vw)}.workspace--collapsed .workspace__brand{justify-content:flex-start;padding-inline:1.45rem}.workspace--collapsed .workspace__brand>span:not(.workspace__brand-mark),.workspace--collapsed .workspace__sidebar-label,.workspace--collapsed .workspace-nav__label,.workspace--collapsed .workspace-nav__link span,.workspace--collapsed .workspace__sidebar-account{display:initial}.workspace--collapsed .workspace-nav__inner{padding:.75rem .85rem}.workspace--collapsed .workspace-nav__link{justify-content:flex-start;padding-inline:.8rem}.workspace--collapsed .workspace__sidebar-bottom{justify-content:flex-start}}
</style>

<style>
/* Common surface and spacing rules for candidate and company workspaces. */
.workspace{background:#f3f6fb;color:#142542}

.workspace__content{min-width:0}
.workspace__topbar{background:color-mix(in srgb,var(--surface) 96%,transparent);border-color:#e5eaf2}
.workspace__main{width:min(92rem,100%);padding-top:1.65rem}
.workspace__heading{align-items:center;margin-bottom:1.15rem}
.workspace__heading h1{font-size:clamp(1.75rem,3vw,2.45rem);letter-spacing:-.055em}
.workspace__subtitle{max-width:58rem;margin-top:.4rem;font-size:.82rem}
.workspace__eyebrow{margin-bottom:.35rem;font-size:.63rem;letter-spacing:.12em}
.workspace__card{border-color:#e1e8f2;border-radius:.85rem;background:var(--surface);box-shadow:0 5px 18px rgb(26 47 79 / 4%)}
.workspace__section{padding:1.15rem}
.workspace__section h2{font-size:1rem}
.workspace__stat{padding:1rem}
.workspace__cta{min-height:2.55rem;border-radius:.65rem;font-size:.78rem}
.workspace__footer{width:min(92rem,100%);padding-top:.9rem}
.workspace :is(.profile-section,.company-profile,.company-form){border-color:#e1e8f2;border-radius:.85rem;box-shadow:0 5px 18px rgb(26 47 79 / 4%)}
.workspace :is(.candidate-dashboard__actions a,.profile-preview-actions__preview,.company-job-row,.candidate-application,.saved-job){transition:border-color .18s,box-shadow .18s,transform .18s}
.workspace :is(.candidate-dashboard__actions a,.profile-preview-actions__preview):hover{box-shadow:0 5px 14px rgb(31 77 145 / 8%)}
.workspace .company-profile__groups{grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
.workspace .company-profile__group{display:block;padding:1rem;border:1px solid var(--border);border-radius:.8rem;background:var(--surface)}
.workspace .company-profile__group:first-child{border-top:1px solid var(--border)}
.workspace .company-profile__group>header{align-items:center;margin-bottom:.85rem}

.workspace .company-profile__group>header h2{font-size:.9rem}
.workspace .company-profile__group>header p{font-size:.72rem}
.workspace .company-profile__group:nth-child(3){grid-column:1/-1}
.workspace .company-profile__verification{border:1px solid var(--border)}
.workspace .company-profile__verification>span{color:var(--muted-foreground);font-size:.75rem;font-weight:700}
.workspace .company-profile__verification>strong{color:var(--primary);font-size:.76rem}
.workspace :is(.candidate-application,.saved-job,.company-application,.company-job-row,.job-card){border-color:#e1e8f2;border-radius:.85rem;background:var(--surface);box-shadow:0 5px 18px rgb(26 47 79 / 4%)}
.workspace :is(.candidate-application,.saved-job,.company-application,.company-job-row,.job-card):hover{border-color:color-mix(in srgb,var(--primary) 35%,var(--border));box-shadow:0 9px 24px rgb(26 47 79 / 8%);transform:translateY(-1px)}
.workspace :is(a,button){-webkit-tap-highlight-color:transparent}

@media(max-width:900px){.workspace__main{padding-top:1.35rem}}
@media(max-width:760px){.workspace .company-profile__groups{grid-template-columns:1fr}.workspace .company-profile__group:nth-child(3){grid-column:auto}}
.workspace__main :where(p,small,label,li,dt,dd,legend){font-size:max(.82rem,.9em)!important}
.workspace__main :where(input:not([type=checkbox]):not([type=file]),select,textarea){font-size:max(.875rem,.92em)!important}
.workspace__main :where(a,button){font-size:max(.8rem,.9em)!important}
.workspace__heading>:last-child{flex:none}
.workspace button:not(.workspace__scrim),.workspace .workspace__cta{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;line-height:1.25;vertical-align:middle}
.workspace :is(button,a) svg{display:block;flex:none;align-self:center}
.workspace :is(a,button)>span[aria-hidden="true"]{display:inline-flex;align-items:center;line-height:1}
.workspace button:disabled{cursor:not-allowed;opacity:.58}
.workspace button:disabled:hover{transform:none;box-shadow:none}
@media(max-width:760px){.workspace__heading>:last-child{align-self:flex-start}}
</style>

<style>
.workspace.workspace--candidate{display:block!important;width:100%;min-width:0;max-width:100%;min-height:100vh;min-height:100dvh}
.workspace.workspace--candidate>.workspace__content{width:100%;min-width:0;max-width:100%}
.workspace.workspace--candidate .workspace__main,.workspace.workspace--candidate .workspace__footer{box-sizing:border-box;width:100%;max-width:92rem;min-width:0;margin-inline:auto}
.workspace.workspace--candidate .candidate-topbar__brand{font-size:1.3rem!important}
</style>

<style>
.workspace.workspace--company{display:block!important;width:100%;min-width:0;min-height:100vh;min-height:100dvh;grid-template-columns:none!important}
.workspace.workspace--company>.workspace__content{display:block;width:100%;min-width:0;max-width:none}
.workspace.workspace--company>.workspace__content{padding-top:5.1rem}
.workspace.workspace--company .workspace__main{display:block;width:min(92rem,100%);min-width:0;box-sizing:border-box;margin-inline:auto;padding-inline:clamp(1.25rem,3.5vw,3rem)}
.workspace.workspace--company .workspace__footer{width:min(92rem,100%);box-sizing:border-box;margin-inline:auto}
.company-topbar{position:fixed;z-index:100;inset:0 0 auto;display:flex;width:100%;min-height:5.1rem;box-sizing:border-box;align-items:center;gap:clamp(1rem,2vw,2rem);padding:0 max(1.25rem,calc((100% - 96rem)/2));border-bottom:1px solid #e2e8f0;background:color-mix(in srgb,var(--surface) 97%,transparent)}
.company-topbar__brand{flex:none;color:var(--primary);font:850 1.3rem Manrope,sans-serif;letter-spacing:-.055em;text-decoration:none}
.company-topbar__search{display:flex;min-width:12rem;max-width:35rem;height:3rem;flex:1;align-items:center;gap:.65rem;padding:0 .9rem;border:1px solid #dce4ef;border-radius:.75rem;background:#f4f7fb;color:#8b9ab0;transition:border-color .16s,box-shadow .16s}
.company-topbar__search:focus-within{border-color:#4c8aff;box-shadow:0 0 0 3px rgb(52 115 245 / 12%)}
.company-topbar__search input{width:100%;min-width:0;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;color:var(--foreground);font:500 .86rem Manrope,sans-serif}
.company-topbar__search input::placeholder{color:#8b96a8;opacity:1}
.company-topbar__actions{display:flex;flex:none;align-items:center;gap:.9rem}
.company-topbar__logout{border:0;background:transparent;color:#7c899d;font:600 .82rem Manrope,sans-serif;cursor:pointer}
.company-topbar__logout:hover{color:var(--primary)}
.company-topbar .workspace-nav.workspace-nav--company{position:static;z-index:auto;top:auto;flex:none;overflow:visible;border:0;background:transparent;backdrop-filter:none}
.company-topbar .workspace-nav--company .workspace-nav__inner{display:flex;width:auto;min-height:0;align-items:center;flex-direction:row;gap:.3rem;margin:0;padding:0}
.company-topbar .workspace-nav--company .workspace-nav__label,.company-topbar .workspace-nav--company .workspace-nav__link svg{display:none}
.company-topbar .workspace-nav--company .workspace-nav__link{min-height:2.5rem;justify-content:center;gap:0;padding:0 .8rem;border:1px solid transparent;border-radius:.65rem;color:#58677e;font-size:.8rem;font-weight:700;white-space:nowrap}
.company-topbar .workspace-nav--company .workspace-nav__link:hover{background:#f4f7fb;color:#175ee8}
.company-topbar .workspace-nav--company .workspace-nav__link--active{border-color:#d7e9ff;background:#edf7ff;color:var(--primary);box-shadow:none!important}
.company-topbar .workspace-nav--company .workspace-nav__link:after{display:none}
.company-topbar__avatar{display:grid;width:2.75rem;height:2.75rem;flex:none;overflow:hidden;place-items:center;border:0;border-radius:0;background:linear-gradient(145deg,color-mix(in srgb,var(--job-accent,#63758d) 72%,white),var(--job-accent,#63758d));color:#fff;font-size:.78rem;font-weight:850;text-decoration:none;transition:filter .16s}
.company-topbar__avatar img{width:100%;height:100%;object-fit:cover}
.company-topbar__avatar span{display:grid;width:100%;height:100%;place-items:center;color:#fff;font-size:.74rem;font-weight:850;letter-spacing:.02em}
.company-topbar__avatar:hover,.company-topbar__avatar:focus-visible{border-color:#4c8aff;box-shadow:0 0 0 3px rgb(52 115 245 / 13%);outline:0}






@media(max-width:1100px){.company-topbar{gap:1rem}.company-topbar__search{max-width:25rem}.company-topbar .workspace-nav--company .workspace-nav__link{padding-inline:.55rem;font-size:.75rem}.company-topbar__actions{gap:.55rem}}
@media(max-width:1024px){.workspace.workspace--company>.workspace__content{padding-top:4.1rem;padding-bottom:calc(5.15rem + env(safe-area-inset-bottom,0px))}.company-topbar{display:grid;min-height:4.1rem;grid-template-columns:minmax(0,1fr) auto;gap:.55rem 1rem;padding:.55rem 1rem}.company-topbar__brand{grid-column:1;grid-row:1}.company-topbar__search{display:none}.company-topbar__actions{grid-column:2;grid-row:1}}
@media(max-width:480px){.company-topbar{padding-inline:.75rem}.company-topbar .workspace-nav--company .workspace-nav__link{min-height:2.35rem;padding-inline:.5rem;font-size:.7rem}.company-topbar__actions{gap:.35rem}.company-topbar__avatar{width:2.5rem;height:2.5rem}}
.candidate-topbar__avatar,.company-topbar__avatar{aspect-ratio:1;border-radius:50%!important}
</style>

<style>
@media(max-width:1024px){
  .candidate-topbar,.company-topbar{background:#fff!important;backdrop-filter:none!important}
  .candidate-topbar__logout,.company-topbar__logout{display:inline-grid;width:2.75rem;height:2.75rem;place-items:center;padding:0;border:0;border-radius:0;background:transparent;color:#7c899d;cursor:pointer}
  .candidate-topbar__logout:hover,.company-topbar__logout:hover{background:transparent;color:var(--primary)}
  .company-topbar .workspace-nav--company .workspace-nav__link,
  .company-topbar .workspace-nav--company .workspace-nav__link--active,
  .company-topbar .workspace-nav--company .workspace-nav__link:hover{border:0!important;border-radius:0!important;background:transparent!important;color:var(--muted-foreground)!important;box-shadow:none!important}
  .company-topbar .workspace-nav--company .workspace-nav__link--active svg,
  .company-topbar .workspace-nav--company .workspace-nav__link:hover svg{color:var(--primary)!important}
}
</style>
