<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Bookmark, BriefcaseBusiness, Building2, ClipboardList, LayoutDashboard, Search, UserRound, UsersRound } from 'lucide-vue-next'

const props = defineProps<{ role: 'CANDIDATE' | 'COMPANY' }>()
const route = useRoute()
const isCompany = computed(() => props.role === 'COMPANY')
const items = computed(() => isCompany.value ? [
  { label: 'Resumen', mobileLabel: 'Inicio', to: '/company', icon: LayoutDashboard, exact: true },
  { label: 'Mis vacantes', mobileLabel: 'Vacantes', to: '/company/jobs', icon: BriefcaseBusiness },
  { label: 'Postulantes', mobileLabel: 'Talento', to: '/company/applications', icon: UsersRound },
  { label: 'Mi perfil', mobileLabel: 'Perfil', to: '/company/profile/edit', icon: Building2 },
] : [
  { label: 'Inicio', to: '/candidate', icon: LayoutDashboard, exact: true },
  { label: 'Ofertas', to: '/jobs', icon: Search },
  { label: 'Mis postulaciones', mobileLabel: 'Postul.', to: '/candidate/applications', icon: ClipboardList },
  { label: 'Guardados', mobileLabel: 'Guardados', to: '/candidate/saved-jobs', icon: Bookmark },
  { label: 'Mi perfil', mobileLabel: 'Perfil', to: '/candidate/profile', icon: UserRound },
])
function active(to: string, exact = false) {
  if (isCompany.value && route.name === 'company-job-applicants') {
    if (to === '/company/jobs') return true
    if (to === '/company/applications') return false
  }
  if (isCompany.value && to === '/company/profile/edit' && route.path.startsWith('/company/profile')) return true
  return exact ? route.path === to : route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <nav class="workspace-nav" :class="{ 'workspace-nav--candidate': !isCompany, 'workspace-nav--company': isCompany }" :aria-label="`Navegación de ${isCompany ? 'empresa' : 'candidato'}`">
    <div class="workspace-nav__inner">
      <p class="workspace-nav__label">Menú principal</p>
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="workspace-nav__link" :title="item.label" :aria-label="item.label" :class="{ 'workspace-nav__link--active': active(item.to, item.exact) }" :aria-current="active(item.to, item.exact) ? 'page' : undefined">
        <component :is="item.icon" :size="17" :stroke-width="1.9" /><span :data-mobile-label="item.mobileLabel ?? item.label">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style>
.workspace-nav{position:sticky;z-index:9;top:4.6rem;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--surface) 94%,transparent);backdrop-filter:blur(14px)}.workspace-nav__inner{display:flex;width:min(82rem,100%);min-height:4.05rem;align-items:stretch;gap:.3rem;margin-inline:auto;padding-inline:clamp(1rem,3.5vw,2.5rem)}.workspace-nav__link{position:relative;display:inline-flex;flex:none;align-items:center;justify-content:center;gap:.55rem;padding:0 .9rem;color:var(--muted-foreground);font-size:.8rem;font-weight:720;transition:color .2s,background .2s}.workspace-nav__link:after{position:absolute;right:.75rem;bottom:-1px;left:.75rem;height:2px;border-radius:3px 3px 0 0;background:linear-gradient(90deg,var(--palette-violet),var(--primary));content:"";transform:scaleX(0);transform-origin:center;transition:transform .2s ease}.workspace-nav__link:hover{border-radius:.65rem .65rem 0 0;background:color-mix(in srgb,var(--secondary) 55%,transparent);color:var(--palette-ink)}.workspace-nav__link--active{color:var(--palette-ink)}.workspace-nav__link--active:after{transform:scaleX(1)}.workspace-nav__create{display:inline-flex;flex:none;align-items:center;justify-content:center;gap:.35rem;align-self:center;min-height:2.35rem;margin-left:auto;padding:0 .85rem;border:1px solid color-mix(in srgb,var(--palette-violet) 18%,transparent);border-radius:.7rem;background:linear-gradient(120deg,var(--palette-violet),var(--primary));color:white;font-size:.77rem;font-weight:800;box-shadow:0 6px 16px color-mix(in srgb,var(--palette-violet) 18%,transparent);transition:transform .18s,box-shadow .18s}.workspace-nav__create:hover{transform:translateY(-1px);box-shadow:0 9px 22px color-mix(in srgb,var(--palette-violet) 28%,transparent)}.workspace-nav :is(a):focus-visible{outline:3px solid color-mix(in srgb,var(--palette-violet) 42%,transparent);outline-offset:2px}
@media(max-width:760px){.workspace-nav{top:4.1rem}.workspace-nav__inner{min-height:3.65rem;gap:.1rem;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;padding-inline:.75rem}.workspace-nav__inner::-webkit-scrollbar{display:none}.workspace-nav__link{gap:.4rem;padding-inline:.72rem;font-size:.75rem}.workspace-nav__link svg{width:16px;height:16px}.workspace-nav__create{min-height:2.1rem;margin-left:.25rem;padding-inline:.65rem;font-size:.7rem}}@media(max-width:480px){.workspace-nav__inner{padding-inline:.6rem}.workspace-nav__link{padding-inline:.65rem}.workspace-nav__link span{font-size:.7rem}}</style>

<style>
.workspace-nav{position:static;z-index:auto;top:auto;flex:1;overflow-y:auto;border:0;background:transparent;backdrop-filter:none}
.workspace-nav__inner{display:flex;width:auto;min-height:0;align-items:stretch;flex-direction:column;gap:.25rem;margin:0;padding:.75rem .85rem}
.workspace-nav__label{margin:.3rem .7rem .55rem;color:rgb(218 230 248 / 56%);font-size:.64rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.workspace-nav__link{position:relative;min-height:2.85rem;justify-content:flex-start;gap:.75rem;padding:0 .8rem;border-radius:.65rem;color:rgb(226 236 249 / 75%);font-size:.81rem}
.workspace-nav__link:after{display:none}
.workspace-nav__link:hover{border-radius:.65rem;background:rgb(255 255 255 / 8%);color:#fff}
.workspace-nav__link--active{background:linear-gradient(100deg,rgb(93 153 255 / 25%),rgb(93 153 255 / 10%));color:#fff;box-shadow:inset 3px 0 #79b4ff}
.workspace-nav__link--active svg{color:#a8d0ff}
.workspace-nav :is(a):focus-visible{outline:2px solid #a8d0ff;outline-offset:2px}
@media(max-width:760px){.workspace-nav{top:auto}.workspace-nav__inner{min-height:0;gap:.25rem;overflow:visible;padding:.75rem .85rem}.workspace-nav__link{min-height:2.85rem;gap:.75rem;padding-inline:.8rem;font-size:.81rem}.workspace-nav__link svg{width:17px;height:17px}}

@media(max-width:1024px){
  .workspace-nav.workspace-nav--candidate,
  .workspace-nav.workspace-nav--company{
    position:fixed!important;z-index:1000;inset:auto 0 0;width:100%;height:calc(4.15rem + env(safe-area-inset-bottom,0px));
    overflow:visible;border-top:1px solid var(--border);border-bottom:0;
    background-color:#fff!important;background-image:none!important;backdrop-filter:none!important;box-shadow:0 -8px 24px rgb(20 37 66 / 10%);
    padding-bottom:env(safe-area-inset-bottom,0px)
  }
  .workspace-nav.workspace-nav--candidate .workspace-nav__inner,
  .workspace-nav.workspace-nav--company .workspace-nav__inner{
    display:grid;width:100%;height:4.15rem;min-height:0;grid-template-columns:repeat(5,minmax(0,1fr));
    align-items:stretch;justify-content:stretch;gap:0;overflow:visible;padding:0 .2rem
  }
  .workspace-nav.workspace-nav--company .workspace-nav__inner{grid-template-columns:repeat(4,minmax(0,1fr))}
  .workspace-nav.workspace-nav--candidate .workspace-nav__label,
  .workspace-nav.workspace-nav--company .workspace-nav__label{display:none}
  .workspace-nav.workspace-nav--candidate .workspace-nav__link,
  .workspace-nav.workspace-nav--company .workspace-nav__link{
    display:flex;min-width:0;min-height:3.6rem;width:100%;flex-direction:column;flex:initial;align-items:center;justify-content:center;gap:.18rem;
    padding:.35rem .08rem;border:0;border-radius:0!important;background:transparent!important;color:var(--muted-foreground);font-size:.58rem;font-weight:750;white-space:nowrap
  }
  .workspace-nav.workspace-nav--candidate .workspace-nav__link svg,
  .workspace-nav.workspace-nav--company .workspace-nav__link svg{display:block!important;width:19px;height:19px}
  .workspace-nav.workspace-nav--candidate .workspace-nav__link span,
  .workspace-nav.workspace-nav--company .workspace-nav__link span{max-width:100%;overflow:hidden;font-size:0;text-overflow:clip}
  .workspace-nav.workspace-nav--candidate .workspace-nav__link svg,
  .workspace-nav.workspace-nav--company .workspace-nav__link svg,
  .workspace-nav.workspace-nav--candidate .workspace-nav__link span,
  .workspace-nav.workspace-nav--company .workspace-nav__link span{position:relative;z-index:1}
  .workspace-nav.workspace-nav--candidate .workspace-nav__link span:after,
  .workspace-nav.workspace-nav--company .workspace-nav__link span:after{content:attr(data-mobile-label);font-size:.58rem;line-height:1.15}
  .workspace-nav.workspace-nav--candidate .workspace-nav__link--active,
  .workspace-nav.workspace-nav--company .workspace-nav__link--active{border:0;background:transparent!important;color:var(--muted-foreground);box-shadow:none}
  .workspace-nav.workspace-nav--candidate .workspace-nav__link:hover,
  .workspace-nav.workspace-nav--company .workspace-nav__link:hover{border-radius:0!important;background:transparent!important;color:var(--muted-foreground)}
  .workspace-nav.workspace-nav--candidate .workspace-nav__link--active svg,
  .workspace-nav.workspace-nav--company .workspace-nav__link--active svg,
  .workspace-nav.workspace-nav--candidate .workspace-nav__link:hover svg,
  .workspace-nav.workspace-nav--company .workspace-nav__link:hover svg{color:var(--primary)}
  .workspace-nav.workspace-nav--candidate .workspace-nav__link:after,
  .workspace-nav.workspace-nav--company .workspace-nav__link:after{display:none}
}
</style>
