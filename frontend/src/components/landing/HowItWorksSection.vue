<script setup lang="ts">
import { ArrowRight, UserRound, Building2, MapPin } from '@lucide/vue'

const candidateSteps = [
  { number: '01', title: 'Crea tu perfil profesional', description: 'Destaca tu experiencia, tus fortalezas y tus intereses.' },
  { number: '02', title: 'Explora oportunidades que van contigo', description: 'Encuentra vacantes alineadas con tu experiencia y objetivos.' },
  { number: '03', title: 'Postúlate a las ofertas que te interesen', description: 'Envía tu perfil en pocos pasos y conecta con empresas.' },
]

const companySteps = [
  { number: '01', title: 'Presenta tu empresa', description: 'Muestra tu identidad, tus valores y tus vacantes.' },
  { number: '02', title: 'Publica oportunidades laborales', description: 'Organiza tus necesidades y atrae perfiles relevantes.' },
  { number: '03', title: 'Encuentra candidatos para tus vacantes', description: 'Conoce perfiles que encajen con tu equipo y tu cultura.' },
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
          <p class="hiw-journey__eyebrow">Tu recorrido profesional</p>
          <h3 id="hiw-candidates" class="hiw-journey__title">
            <span class="hiw-journey__icon"><UserRound :size="19" aria-hidden="true" /></span>
            Para quienes buscan empleo
          </h3>
          <ol class="hiw-steps" role="list">
            <li v-for="step in candidateSteps" :key="step.number" class="hiw-step">
              <span class="hiw-step__number" aria-hidden="true">{{ step.number }}</span>
              <div class="hiw-step__body">
                <strong class="hiw-step__name">{{ step.title }}</strong>
                <p class="hiw-step__desc">{{ step.description }}</p>
              </div>
            </li>
          </ol>
          <a href="/auth" class="hiw-action">
            Quiero encontrar empleo <ArrowRight :size="14" aria-hidden="true" />
          </a>
        </div>

        <!-- Divider -->
        <div class="hiw-divider" aria-hidden="true" />

        <!-- Companies -->
        <div class="hiw-journey hiw-journey--company" aria-labelledby="hiw-companies">
          <p class="hiw-journey__eyebrow">Tu proceso de contratación</p>
          <h3 id="hiw-companies" class="hiw-journey__title">
            <span class="hiw-journey__icon"><Building2 :size="19" aria-hidden="true" /></span>
            Para las empresas
          </h3>
          <ol class="hiw-steps" role="list">
            <li v-for="step in companySteps" :key="step.number" class="hiw-step">
              <span class="hiw-step__number" aria-hidden="true">{{ step.number }}</span>
              <div class="hiw-step__body">
                <strong class="hiw-step__name">{{ step.title }}</strong>
                <p class="hiw-step__desc">{{ step.description }}</p>
              </div>
            </li>
          </ol>
          <a href="/auth" class="hiw-action">
            Busco talento para mi equipo <ArrowRight :size="14" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how-it-works{position:relative;left:50%;width:100vw;margin:0 0 0 -50vw;padding:clamp(3.5rem,7vw,6rem) clamp(20px,4vw,64px);background:linear-gradient(115deg,#e8f0fa 0%,#dfeaf6 52%,#e9f1f9 100%)}
.how-it-works__grid{display:grid;width:min(100%,1500px);grid-template-columns:minmax(16rem,.78fr) minmax(0,1.7fr);align-items:center;gap:clamp(2rem,5vw,5rem);margin-inline:auto}
.how-it-works__intro{max-width:31rem}
.hiw-kicker{display:flex;align-items:center;gap:.55rem;margin:0 0 1rem;color:#1769c2;font-size:.74rem;font-weight:850;letter-spacing:.14em;text-transform:uppercase}
.hiw-kicker::before{width:1.5rem;height:2px;border-radius:2px;background:#1769c2;content:""}
.hiw-title{max-width:11ch;margin:0;color:#10233a;font:850 clamp(2.35rem,4vw,3.55rem)/1.06 Manrope,sans-serif;letter-spacing:-.055em}
.hiw-desc{max-width:36ch;margin:1.1rem 0 1.2rem;color:#52657b;font-size:1.05rem;line-height:1.7}
.hiw-origin{display:inline-flex;align-items:center;gap:.45rem;padding:.5rem .7rem;border:1px solid #d4e4f5;border-radius:999px;background:rgb(255 255 255 / 72%);color:#355472;font-size:.74rem;font-weight:750}
.hiw-origin svg{color:#1769c2}
.how-it-works__journeys{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch;gap:1rem}
.hiw-journey{--journey-accent:#1769c2;position:relative;display:flex;min-width:0;min-height:25rem;flex-direction:column;overflow:hidden;padding:clamp(1.2rem,2vw,1.65rem);border:1px solid #d2e2f4;border-radius:1rem;background:#fff;box-shadow:0 12px 32px rgb(16 35 58 / 6%)}
.hiw-journey::before{position:absolute;top:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,var(--journey-accent),color-mix(in srgb,var(--journey-accent) 25%,white));content:""}
.hiw-journey--candidate{--journey-accent:#1769c2;border-color:#c9dcf3;background:#fff}
.hiw-journey--company{--journey-accent:#315f8a;border-color:#d3e0ed;background:linear-gradient(145deg,#fff 0%,#f2f6fa 100%);box-shadow:0 12px 32px rgb(16 35 58 / 6%)}
.hiw-journey--company::after{position:absolute;right:-4rem;bottom:-6rem;width:13rem;height:13rem;border:1px solid rgb(49 95 138 / 9%);border-radius:50%;box-shadow:0 0 0 1.4rem rgb(49 95 138 / 3%),0 0 0 2.8rem rgb(49 95 138 / 2%);content:"";pointer-events:none}
.hiw-journey__eyebrow{margin:0 0 .55rem;color:#1769c2;font-size:.66rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
.hiw-journey--company .hiw-journey__eyebrow{position:relative;z-index:1;color:#315f8a}
.hiw-journey__title{display:flex;align-items:center;gap:.75rem;margin:0 0 1.45rem;color:#17263a;font:800 1.08rem/1.3 Manrope,sans-serif;letter-spacing:-.02em}
.hiw-journey--company .hiw-journey__title{color:#17263a}
.hiw-journey__icon{display:grid;width:2.7rem;height:2.7rem;flex:none;place-items:center;border-radius:.8rem;background:#1769c2;color:#fff;box-shadow:0 5px 14px rgb(23 105 194 / 20%)}
.hiw-journey--company .hiw-journey__icon{background:#e5edf5;color:#315f8a;box-shadow:0 5px 14px rgb(49 95 138 / 8%)}
.hiw-steps{position:relative;display:grid;gap:1.3rem;margin:0 0 1.5rem;padding:0;list-style:none}
.hiw-steps::before{position:absolute;top:1.15rem;bottom:1.15rem;left:.92rem;width:1px;background:linear-gradient(#9cc7f3,#d9e7f6);content:""}
.hiw-journey--company .hiw-steps::before{background:linear-gradient(#9db8d1,#dbe5ef)}
.hiw-step{position:relative;display:grid;grid-template-columns:2rem minmax(0,1fr);align-items:start;gap:.8rem;min-width:0}
.hiw-step__number{z-index:1;display:grid;width:1.9rem;height:1.9rem;place-items:center;border:2px solid #fff;border-radius:50%;background:#1769c2;color:#fff;font-size:.63rem;font-weight:850;box-shadow:0 0 0 1px #bcd6f2}
.hiw-journey--company .hiw-step__number{border-color:#fff;background:#e5edf5;color:#315f8a;box-shadow:0 0 0 1px #d3e0ed}
.hiw-step__body{min-width:0;padding-top:.12rem}
.hiw-step__name{display:block;margin:0 0 .3rem;color:#17263a;font-size:.9rem;font-weight:800;line-height:1.4}
.hiw-step__desc{margin:0;color:#52657b;font-size:.82rem;line-height:1.6;overflow-wrap:anywhere}
.hiw-journey--company .hiw-step__name{color:#17263a}
.hiw-journey--company .hiw-step__desc{color:#52657b}
.hiw-action{display:inline-flex;min-height:2.65rem;align-items:center;justify-content:space-between;gap:.75rem;margin-top:auto;padding:.35rem .45rem .35rem .8rem;border-radius:.7rem;background:#1769c2;color:#fff;font-size:.78rem;font-weight:800;transition:background .18s,transform .18s,box-shadow .18s}
.hiw-action svg{width:16px;height:16px;padding:0;border-radius:0;background:transparent;transition:transform .18s}
.hiw-action:hover{transform:translateY(-1px);background:#1356a2;box-shadow:0 7px 16px rgb(23 105 194 / 20%)}
.hiw-action:hover svg{transform:translateX(2px)}
.hiw-journey--company .hiw-action{background:#315f8a;color:#fff}
.hiw-journey--company .hiw-action svg{background:transparent;color:#fff}
.hiw-journey--company .hiw-action:hover{background:#244a70;box-shadow:0 7px 16px rgb(49 95 138 / 18%)}
.hiw-action:focus-visible{outline:3px solid #94d8ff;outline-offset:3px}
.hiw-divider{display:none}
@media(max-width:1100px){.how-it-works__grid{grid-template-columns:1fr;gap:2rem}.how-it-works__intro{max-width:48rem}.hiw-title{max-width:16ch}.hiw-desc{margin:.85rem 0 1rem}}
@media(max-width:720px){.how-it-works{padding-block:3.5rem}.how-it-works__journeys{grid-template-columns:1fr}.hiw-journey{min-height:0}.hiw-steps{gap:1rem}}
@media(max-width:560px){.how-it-works{padding-inline:20px}.hiw-title{font-size:clamp(2.2rem,10vw,3rem)}.hiw-journey{padding:1.15rem}.hiw-journey__title{font-size:1rem}}
@media(prefers-reduced-motion:reduce){.hiw-action,.hiw-action svg{transition:none}}
</style>
