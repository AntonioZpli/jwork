<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { LogOut, Menu, Moon, Sun, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import WorkspaceNavigation from './WorkspaceNavigation.vue'

defineProps<{ eyebrow: string; title: string; subtitle: string; initials: string }>()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { theme, toggleTheme } = useTheme()
const isCompany = computed(() => route.path.startsWith('/company'))
const accountType = computed(() => isCompany.value ? 'Espacio de empresa' : 'Espacio del candidato')
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const isMobileViewport = ref(false)
let viewportQuery: MediaQueryList | undefined
function syncViewport() { isMobileViewport.value = viewportQuery?.matches ?? false }
watch(() => route.path, () => { sidebarOpen.value = false })
onMounted(() => {
  viewportQuery = window.matchMedia('(max-width: 900px)')
  syncViewport()
  viewportQuery.addEventListener('change', syncViewport)
})
onBeforeUnmount(() => viewportQuery?.removeEventListener('change', syncViewport))
function toggleSidebar() {
  if (isMobileViewport.value) sidebarOpen.value = !sidebarOpen.value
  else sidebarCollapsed.value = !sidebarCollapsed.value
}

async function signOut() {
  try { await auth.logout() } finally { await router.replace('/auth') }
}
</script>

<template>
  <div class="workspace" :class="{ 'workspace--collapsed': sidebarCollapsed }">
    <button v-if="sidebarOpen" class="workspace__scrim" type="button" aria-label="Cerrar menú" @click="sidebarOpen = false" />
    <aside class="workspace__sidebar" :class="{ 'workspace__sidebar--open': sidebarOpen }">
      <RouterLink class="workspace__brand" to="/" aria-label="Jinowork, inicio"><span class="workspace__brand-mark">J</span><span>jinowork</span></RouterLink>
      <div class="workspace__sidebar-label">{{ accountType }}</div>
      <WorkspaceNavigation :role="isCompany ? 'COMPANY' : 'CANDIDATE'" />
      <div class="workspace__sidebar-bottom"><span class="workspace__sidebar-avatar">{{ initials }}</span><span class="workspace__sidebar-account"><strong>{{ auth.user?.email ?? accountType }}</strong><small>Cuenta activa</small></span><button class="workspace__sidebar-logout" type="button" aria-label="Cerrar sesión" @click="signOut"><LogOut :size="17" /></button></div>
    </aside>
    <div class="workspace__content">
      <header class="workspace__topbar">
        <button class="workspace__menu-button" type="button" :aria-label="sidebarOpen ? 'Cerrar navegación' : isMobileViewport ? 'Abrir navegación' : sidebarCollapsed ? 'Expandir navegación' : 'Contraer navegación'" :aria-expanded="isMobileViewport ? sidebarOpen : !sidebarCollapsed" @click="toggleSidebar"><X v-if="sidebarOpen" :size="20" /><Menu v-else :size="20" /></button>
        <div class="workspace__topbar-right">
          <button class="workspace__icon-button" type="button" :aria-label="theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'" @click="toggleTheme"><Sun v-if="theme === 'dark'" :size="18" /><Moon v-else :size="18" /></button>
        </div>
      </header>
      <main class="workspace__main">
        <div class="workspace__heading"><div><p class="workspace__eyebrow">{{ eyebrow }}</p><h1>{{ title }}</h1><p class="workspace__subtitle">{{ subtitle }}</p></div><slot name="heading-action" /></div>
        <slot />
      </main>
      <footer class="workspace__footer">Jinowork · Conectando talento con oportunidades</footer>
    </div>
  </div>
</template>

<style>
.workspace{min-height:100vh;background:radial-gradient(ellipse at 90% 0%,color-mix(in srgb,var(--palette-blue) 23%,transparent),transparent 32%),var(--background);color:var(--foreground)}
.workspace__topbar{position:sticky;z-index:10;top:0;display:flex;height:4.6rem;align-items:center;justify-content:space-between;padding-inline:max(1.25rem,calc((100% - 82rem)/2));border-bottom:1px solid color-mix(in srgb,var(--palette-ink) 10%,var(--border));background:color-mix(in srgb,var(--surface) 90%,transparent);backdrop-filter:blur(16px)}
.workspace__brand{display:inline-flex;align-items:center;gap:.65rem;color:var(--palette-ink);font:800 1.16rem Manrope,sans-serif;letter-spacing:-.045em}.dark .workspace__brand{color:var(--palette-blue)}.workspace__brand-mark{display:grid;width:2rem;height:2rem;place-items:center;border-radius:.7rem .7rem .7rem .2rem;background:var(--palette-ink);color:#fff;font:800 1.15rem Georgia,serif;box-shadow:0 6px 15px rgb(39 0 93 / 17%)}.dark .workspace__brand-mark{background:var(--palette-blue);color:#071525}
.workspace__topbar-right{display:flex;align-items:center;gap:.75rem}.workspace__account-type{margin-right:.35rem;color:var(--muted-foreground);font-size:.8rem;font-weight:700}.workspace__icon-button{display:grid;width:2.3rem;height:2.3rem;place-items:center;border:1px solid var(--border);border-radius:.75rem;background:var(--surface);color:var(--muted-foreground);cursor:pointer;transition:border-color .18s,color .18s}.workspace__icon-button:hover{border-color:var(--primary);color:var(--primary)}.workspace__avatar{display:grid;width:2.35rem;height:2.35rem;place-items:center;border-radius:50%;background:var(--secondary);color:var(--primary);font-size:.78rem;font-weight:850;box-shadow:0 0 0 3px var(--surface),0 0 0 4px var(--border)}.workspace__logout{display:inline-flex;align-items:center;gap:.4rem;margin-left:.15rem;padding:.5rem .7rem;border:0;border-radius:.6rem;background:transparent;color:var(--muted-foreground);font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}.workspace__logout:hover{background:var(--panel);color:var(--foreground)}
.workspace__main{width:min(82rem,100%);margin-inline:auto;padding:clamp(2rem,5vw,3.6rem) clamp(1rem,3.5vw,2.5rem) 2.5rem}.workspace__heading{display:flex;align-items:flex-end;justify-content:space-between;gap:1.2rem;margin-bottom:1.8rem}.workspace__eyebrow{margin:0 0 .5rem;color:var(--primary);font-size:.7rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.workspace__heading h1{max-width:48rem;margin:0;font:800 clamp(2rem,4vw,3.35rem)/.99 Manrope,sans-serif;letter-spacing:-.07em}.workspace__subtitle{max-width:49rem;margin:.75rem 0 0;color:var(--muted-foreground);font-size:.94rem;line-height:1.6}.workspace__footer{width:min(82rem,100%);margin-inline:auto;padding:1.2rem 1.25rem 1.5rem;border-top:1px solid var(--border);color:var(--muted-foreground);font-size:.77rem;text-align:center}
.workspace__card{border:1px solid color-mix(in srgb,var(--palette-ink) 10%,var(--border));border-radius:1rem;background:var(--surface);box-shadow:0 16px 42px color-mix(in srgb,var(--palette-ink) 6%,transparent)}.workspace__stat{position:relative;overflow:hidden;padding:1.35rem}.workspace__stat::after{position:absolute;right:-2.1rem;bottom:-3.2rem;width:7.5rem;height:7.5rem;border-radius:50%;background:color-mix(in srgb,var(--primary) 10%,transparent);content:""}.workspace__stat-label{position:relative;z-index:1;color:var(--muted-foreground);font-size:.83rem;font-weight:650}.workspace__stat-value{position:relative;z-index:1;margin-top:.65rem;font:800 clamp(1.7rem,3vw,2.35rem)/1 Manrope,sans-serif;letter-spacing:-.06em}.workspace__section{margin-top:1.35rem;padding:1.4rem}.workspace__section h2{margin:0 0 1rem;font:750 1.16rem Manrope,sans-serif;letter-spacing:-.035em}.workspace__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.workspace__list{display:grid;gap:.25rem}.workspace__row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 0;border-top:1px solid var(--border)}.workspace__row:first-child{padding-top:0;border-top:0}.workspace__row strong{display:block}.workspace__meta,.workspace__empty{color:var(--muted-foreground);font-size:.84rem;line-height:1.55}.workspace__pill{display:inline-flex;align-items:center;border:1px solid color-mix(in srgb,var(--primary) 14%,transparent);border-radius:999px;padding:.35rem .72rem;background:var(--secondary);color:var(--primary);font-size:.74rem;font-weight:750;white-space:nowrap}.workspace__cta{display:inline-flex;min-height:2.75rem;align-items:center;justify-content:center;border:1px solid transparent;border-radius:.75rem;padding:0 1.05rem;background:var(--primary);color:#fff;font-size:.85rem;font-weight:750;box-shadow:0 8px 20px color-mix(in srgb,var(--primary) 20%,transparent);transition:transform .18s,box-shadow .18s}.workspace__cta:hover{transform:translateY(-1px);box-shadow:0 11px 25px color-mix(in srgb,var(--primary) 27%,transparent)}.workspace__error{padding:1rem;border:1px solid #e3a5a5;border-radius:.8rem;background:#fff5f5;color:#8b1c1c}.workspace__notice{margin:0 0 1rem;padding:.9rem 1rem;border:1px solid color-mix(in srgb,var(--primary) 18%,transparent);border-radius:.8rem;background:var(--secondary);color:var(--foreground)}.workspace-loading{display:grid;min-height:70vh;place-items:center;padding:1.5rem}.candidate-dashboard__links{display:flex;flex-wrap:wrap;gap:.65rem;margin:0 0 1.2rem}.candidate-dashboard__links a{border:1px solid var(--border);border-radius:.7rem;padding:.55rem .8rem;background:var(--surface);color:var(--primary);font-size:.82rem;font-weight:700;transition:border-color .18s,background .18s}.candidate-dashboard__links a:hover{border-color:var(--primary);background:var(--secondary)}.candidate-job__title{display:block;font-weight:800}.candidate-job__title:hover{color:var(--primary)}.company-actions{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap}.company-actions__link{color:var(--primary);font-size:.85rem;font-weight:700}
@media(max-width:760px){.workspace__topbar{height:4.1rem;padding-inline:1rem}.workspace-nav{top:4.1rem}.workspace-nav__inner{min-height:3.65rem;gap:.1rem;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;padding-inline:.75rem}.workspace-nav__inner::-webkit-scrollbar{display:none}.workspace-nav__link{gap:.4rem;padding-inline:.72rem;font-size:.75rem}.workspace-nav__link svg{width:16px;height:16px}.workspace-nav__create{min-height:2.1rem;margin-left:.25rem;padding-inline:.65rem;font-size:.7rem}.workspace__account-type{display:none}.workspace__logout{width:2.3rem;height:2.3rem;justify-content:center;padding:0}.workspace__logout span{display:none}.workspace__main{padding:2rem 1rem}.workspace__heading{align-items:flex-start;flex-direction:column}.workspace__heading h1{font-size:2.4rem}.workspace__grid{grid-template-columns:1fr}.workspace__section{padding:1.05rem}.workspace__row{align-items:flex-start}.workspace__footer{padding-inline:1rem}}
@media(max-width:480px){.workspace__heading h1{font-size:2rem}.workspace__topbar-right{gap:.55rem}.workspace-nav__inner{padding-inline:.6rem}.workspace-nav__link{padding-inline:.65rem}.workspace-nav__link span{font-size:.7rem}.workspace__row{flex-direction:column}}
</style>

<style>
.workspace{display:grid;grid-template-columns:15.75rem minmax(0,1fr);min-height:100vh;background:var(--background)}
.workspace__sidebar{position:sticky;top:0;display:flex;height:100vh;min-height:35rem;flex-direction:column;overflow:hidden;background:#102747;color:#fff;box-shadow:8px 0 28px rgb(12 36 68 / 9%)}
.workspace__brand{min-height:5.1rem;padding:0 1.45rem;border-bottom:1px solid rgb(255 255 255 / 10%);color:#fff;font-size:1.22rem}
.dark .workspace__brand{color:#fff}
.workspace__brand-mark,.dark .workspace__brand-mark{background:#d8eaff;color:#102747;box-shadow:none}
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
.workspace :is(input:not([type=checkbox]):not([type=file]),select,textarea){border:1px solid var(--border);border-radius:.7rem;background:var(--surface);color:var(--foreground);transition:border-color .18s,box-shadow .18s,background .18s}.workspace :is(input:not([type=checkbox]):not([type=file]),select,textarea):focus{border-color:var(--palette-violet);outline:0;box-shadow:0 0 0 3px color-mix(in srgb,var(--palette-violet) 15%,transparent)}.workspace :is(input,select,textarea)::placeholder{color:var(--muted-foreground);opacity:.75}.workspace :is(button,a):focus-visible{outline:3px solid color-mix(in srgb,var(--palette-violet) 42%,transparent);outline-offset:2px}.workspace :is(.profile-section,.company-profile,.company-form){border:1px solid color-mix(in srgb,var(--palette-ink) 10%,var(--border));border-radius:1rem;background:var(--surface);box-shadow:0 14px 36px color-mix(in srgb,var(--palette-ink) 6%,transparent)}.workspace :is(.profile-section,.company-profile,.company-form)>h2,.workspace .company-form legend{color:var(--palette-ink);letter-spacing:-.035em}.dark .workspace :is(.profile-section,.company-profile,.company-form)>h2,.dark .workspace .company-form legend{color:var(--palette-blue)}.workspace :is(.profile-actions button,.language-record button,.company-job-row__actions button,.company-application__form button,.saved-job__remove){transition:transform .16s,border-color .16s,background .16s,color .16s}.workspace :is(.profile-actions button,.language-record button,.company-job-row__actions button,.company-application__form button,.saved-job__remove):hover:not(:disabled){transform:translateY(-1px);border-color:var(--primary)}.workspace__empty{padding:1.25rem 0}.workspace__pill{letter-spacing:.005em}
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
.dark .workspace{background:var(--background);color:var(--foreground)}
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
.dark .workspace__topbar{border-color:var(--border)}
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
