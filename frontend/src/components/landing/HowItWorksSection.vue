<script setup lang="ts">
import { ArrowRight, UserRound, Building2, MapPin, Check } from '@lucide/vue'

const candidateSteps = [
  'Crea tu perfil profesional',
  'Explora oportunidades según tu perfil',
  'Postúlate fácilmente',
]

const companySteps = [
  'Publica tus ofertas',
  'Encuentra el talento ideal',
  'Haz crecer tu equipo',
]
</script>

<template>
  <section id="como-funciona" class="how-it-works" aria-labelledby="hiw-heading">
    <div class="how-it-works__grid">
      <!-- Intro column -->
      <div class="how-it-works__intro">
        <p class="hiw-kicker">Simple, desde el primer encuentro</p>
        <h2 id="hiw-heading" class="hiw-title">Dos caminos. Un lugar para conectar.</h2>
        <p class="hiw-desc">Desde Jinotega, acercamos a las personas y empresas de Nicaragua.</p>
        <span class="hiw-origin"><MapPin :size="15" aria-hidden="true" />Hecho en Jinotega, conectado con Nicaragua</span>
      </div>

      <!-- Journeys column -->
      <div class="how-it-works__journeys">
        <!-- Candidates -->
        <div class="hiw-journey hiw-journey--candidate" aria-labelledby="hiw-candidates">
          <div class="hiw-journey__background" aria-hidden="true" />
          <div class="hiw-journey__content">
            <div class="hiw-journey__heading">
              <span class="hiw-journey__icon"><UserRound :size="28" aria-hidden="true" /></span>
              <h3 id="hiw-candidates" class="hiw-journey__title">Para quienes buscan empleo</h3>
            </div>
            <ol class="hiw-steps" role="list">
              <li v-for="step in candidateSteps" :key="step" class="hiw-step">
                <span class="hiw-step__check" aria-hidden="true"><Check :size="13" :stroke-width="3" /></span>
                <div class="hiw-step__body"><strong class="hiw-step__name">{{ step }}</strong></div>
              </li>
            </ol>
            <a href="/auth" class="hiw-action">
              Quiero encontrar empleo <ArrowRight :size="14" aria-hidden="true" />
            </a>
          </div>
        </div>

        <!-- Divider -->
        <div class="hiw-divider" aria-hidden="true" />

        <!-- Companies -->
        <div class="hiw-journey hiw-journey--company" aria-labelledby="hiw-companies">
          <div class="hiw-journey__background" aria-hidden="true" />
          <div class="hiw-journey__content">
            <div class="hiw-journey__heading">
              <span class="hiw-journey__icon"><Building2 :size="28" aria-hidden="true" /></span>
              <h3 id="hiw-companies" class="hiw-journey__title">Para las empresas</h3>
            </div>
            <ol class="hiw-steps" role="list">
              <li v-for="step in companySteps" :key="step" class="hiw-step">
                <span class="hiw-step__check" aria-hidden="true"><Check :size="13" :stroke-width="3" /></span>
                <div class="hiw-step__body"><strong class="hiw-step__name">{{ step }}</strong></div>
              </li>
            </ol>
            <a href="/auth" class="hiw-action">
              Busco talento para mi equipo <ArrowRight :size="14" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how-it-works{--hiw-green-900:#0f2420;--hiw-green-800:#16302b;--hiw-green-700:#234640;--hiw-green-600:#35615a;--hiw-green-300:#8fb0a8;--hiw-terracotta-600:#b5483a;--hiw-cream-50:#fdf9f6;--hiw-cream-100:#f7ede6;--hiw-cream-200:#efdfd4;--hiw-cream-300:#e3cfc1;--hiw-text-secondary:#5f6f6b;position:relative;left:50%;width:100vw;margin:0 0 0 -50vw;padding:clamp(3.5rem,7vw,6rem) clamp(20px,4vw,64px);background:var(--hiw-cream-50)}
.how-it-works__grid{display:grid;width:min(100%,1500px);grid-template-columns:minmax(16rem,.78fr) minmax(0,1.7fr);align-items:center;gap:clamp(2rem,5vw,5rem);margin-inline:auto}
.how-it-works__intro{position:relative;isolation:isolate;max-width:31rem}
.how-it-works__intro::before{position:absolute;z-index:-1;left:-140px;top:-100px;width:760px;height:600px;background:url('/assets/jinowork-assets/03-dos-caminos/caminos-orbits.svg') center/contain no-repeat;content:"";pointer-events:none;opacity:.82}
.hiw-kicker{display:flex;align-items:center;gap:.55rem;margin:0 0 1rem;color:var(--hiw-terracotta-600);font-size:.74rem;font-weight:850;letter-spacing:.14em;text-transform:uppercase}
.hiw-kicker::before{width:1.5rem;height:2px;border-radius:2px;background:var(--hiw-terracotta-600);content:""}
.hiw-title{max-width:11ch;margin:0;color:var(--hiw-green-800);font:850 clamp(2.35rem,4vw,3.55rem)/1.06 Manrope,sans-serif;letter-spacing:-.055em}
.hiw-desc{max-width:36ch;margin:1.1rem 0 1.2rem;color:var(--hiw-text-secondary);font-size:1.05rem;line-height:1.7}
.hiw-origin{display:inline-flex;align-items:center;gap:.45rem;padding:.5rem .7rem;border:1px solid var(--hiw-cream-300);border-radius:999px;background:var(--hiw-cream-50);color:var(--hiw-green-800);font-size:.74rem;font-weight:750}
.hiw-origin svg{color:var(--hiw-green-600)}
.how-it-works__journeys{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch;gap:1rem}
.hiw-journey{position:relative;display:flex;min-width:0;min-height:29rem;overflow:hidden;border:1px solid var(--hiw-cream-300);border-radius:0;background:var(--hiw-green-900);box-shadow:0 16px 36px rgb(22 48 43 / 18%)}
.hiw-journey__background{position:absolute;z-index:0;inset:0;background-color:#2f5d50;background-image:linear-gradient(90deg,rgb(15 42 34 / 8%),rgb(15 42 34 / 42%)),url('/images/landing/empresas_card.png');background-position:center,center;background-size:cover,cover}
.hiw-journey--candidate .hiw-journey__background{background-color:#b5483a;background-image:linear-gradient(90deg,rgb(128 48 35 / 16%),rgb(95 36 27 / 52%)),url('/images/landing/trabajadores_card.png');background-position:center,center;background-size:cover,cover}
.hiw-journey--company .hiw-journey__background{background-color:#16302b;background-image:linear-gradient(90deg,rgb(15 42 34 / 14%),rgb(15 42 34 / 52%)),url('/images/landing/empresas_card.png');background-position:center,center;background-size:cover,cover}
.hiw-journey__content{position:relative;z-index:1;display:flex;width:min(58%,25rem);flex-direction:column;margin-left:auto;padding:1.4rem 1.35rem 1.3rem}
.hiw-journey__heading{display:flex;min-width:0;min-height:8.5rem;flex-direction:column;align-items:center;justify-content:center;gap:.35rem;text-align:center}
.hiw-journey__title{margin:0;color:var(--hiw-cream-50);font:800 clamp(1.1rem,1.65vw,1.45rem)/1.22 Manrope,sans-serif;letter-spacing:-.02em;text-shadow:0 1px 5px rgb(0 0 0 / 30%)}
.hiw-journey__icon{display:grid;width:2.4rem;height:2.4rem;place-items:center;color:var(--hiw-cream-50)}
.hiw-steps{display:grid;gap:1.15rem;margin:0;padding:1.05rem 0 1.25rem;list-style:none}
.hiw-step{position:relative;display:grid;grid-template-columns:1.45rem minmax(0,1fr);align-items:start;gap:.65rem;min-width:0}
.hiw-step__check{display:grid;width:1.25rem;height:1.25rem;place-items:center;margin-top:.05rem;border-radius:50%;background:var(--hiw-cream-50);color:var(--hiw-green-900)}
.hiw-step__body{min-width:0;padding-top:.02rem}
.hiw-step__name{display:block;margin:0;color:var(--hiw-cream-50);font-size:.84rem;font-weight:800;line-height:1.4;text-shadow:0 1px 4px rgb(0 0 0 / 35%)}
.hiw-action{display:inline-flex;min-height:2.55rem;align-items:center;justify-content:space-between;gap:.75rem;align-self:flex-end;margin-top:auto;padding:.35rem .55rem .35rem .85rem;border-radius:.25rem;background:var(--hiw-cream-50);color:var(--hiw-terracotta-700,#8f3a2e);font-size:.76rem;font-weight:800;transition:background .18s,transform .18s,box-shadow .18s}
.hiw-action svg{width:16px;height:16px;padding:0;border-radius:0;background:transparent;transition:transform .18s}
.hiw-action:hover{transform:translateY(-1px);background:var(--hiw-cream-200);box-shadow:0 7px 16px rgb(15 36 32 / 20%)}
.hiw-action:hover svg{transform:translateX(2px)}
.hiw-journey--company .hiw-action{background:var(--hiw-cream-50);color:var(--hiw-green-900)}
.hiw-journey--company .hiw-action svg{background:transparent;color:var(--hiw-green-900)}
.hiw-journey--company .hiw-action:hover{background:var(--hiw-cream-200);box-shadow:0 7px 16px rgb(15 36 32 / 18%)}
.hiw-action:focus-visible{outline:3px solid var(--hiw-green-300);outline-offset:3px}
.hiw-divider{display:none}
@media(max-width:1100px){.how-it-works__grid{grid-template-columns:1fr;gap:2rem}.how-it-works__intro{max-width:48rem}.hiw-title{max-width:16ch}.hiw-desc{margin:.85rem 0 1rem}}
@media(max-width:720px){.how-it-works{padding-block:3.5rem}.how-it-works__journeys{grid-template-columns:1fr}.hiw-journey{min-height:27rem}.hiw-steps{gap:1rem}}
@media(max-width:767px){.how-it-works__intro::before{display:none}}
@media(max-width:560px){.how-it-works{padding-inline:20px}.hiw-title{font-size:clamp(2.2rem,10vw,3rem)}.hiw-journey{min-height:26rem}.hiw-journey__content{width:72%;padding-inline:1rem}.hiw-journey__title{font-size:1rem}}
@media(prefers-reduced-motion:reduce){.hiw-action,.hiw-action svg{transition:none}}
</style>
