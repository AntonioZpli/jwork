<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'

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
        <p class="hiw-desc">
          Desde Jinotega, acercamos a las personas y empresas de Nicaragua.
        </p>
      </div>

      <!-- Journeys column -->
      <div class="how-it-works__journeys">
        <!-- Candidates -->
        <div class="hiw-journey" aria-labelledby="hiw-candidates">
          <h3 id="hiw-candidates" class="hiw-journey__title">Para quienes buscan empleo</h3>
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
        <div class="hiw-journey" aria-labelledby="hiw-companies">
          <h3 id="hiw-companies" class="hiw-journey__title">Para las empresas</h3>
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
.how-it-works {
  padding-top: 6rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 3.5rem;
  margin-top: 6rem;
}

.how-it-works__grid {
  display: grid;
  grid-template-columns: 0.95fr 1.65fr;
  gap: 4rem;
  align-items: flex-start;
}

/* Intro */
.hiw-kicker {
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--primary);
}

.hiw-title {
  margin: 0 0 1rem;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: 800;
  color: var(--foreground);
  letter-spacing: -0.04em;
  line-height: 1.15;
}

.hiw-desc {
  margin: 0;
  font-size: 1.08rem;
  color: var(--muted-foreground);
  line-height: 1.7;
}

/* Journeys */
.how-it-works__journeys {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hiw-divider {
  height: 1px;
  background: var(--border);
}

.hiw-journey__title {
  margin: 0 0 1.25rem;
  font-family: 'Manrope', sans-serif;
  font-size: 1.18rem;
  font-weight: 800;
  color: var(--foreground);
}

/* Steps */
.hiw-steps {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  list-style: none;
  margin: 0 0 1.25rem;
  padding: 0;
}

.hiw-step {
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: 0.8rem;
  align-items: flex-start;
}

.hiw-step__number {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: auto;
  height: auto;
  background: transparent;
  color: var(--primary);
  border-radius: 0;
  font-size: 1.05rem;
  font-weight: 800;
  flex-shrink: 0;
}

.hiw-step__name {
  display: block;
  font-size: 1.08rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 0.25rem;
}

.hiw-step__desc {
  margin: 0;
  font-size: 0.98rem;
  color: var(--muted-foreground);
  line-height: 1.6;
}

.hiw-action {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
  transition: gap 0.18s ease;
}

.hiw-action:hover {
  gap: 0.6rem;
}

.hiw-action:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: 2px;
}

@media (max-width: 1100px) {
  .how-it-works {
    padding: 2.5rem;
  }

  .how-it-works__grid {
    gap: 2.5rem;
  }
}

@media (max-width: 800px) {
  .how-it-works__grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

@media (max-width: 560px) {
  .how-it-works {
    padding: 1.5rem;
    border-radius: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hiw-action {
    transition: none;
  }
}

.how-it-works {
  position: relative;
  left: 50%;
  width: 100vw;
  margin: 0 0 0 -50vw;
  padding: 4.5rem max(clamp(20px, 4vw, 64px), calc((100vw - 1600px) / 2 + clamp(20px, 4vw, 64px)));
  background: var(--surface);
  border: 0;
  border-radius: 0;
}

.how-it-works__grid {
  width: min(100%, 1600px);
  margin-inline: auto;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.65fr);
  gap: clamp(2rem, 4vw, 4rem);
}
.how-it-works__intro,
.how-it-works__journeys,
.hiw-journey,
.hiw-step__body { min-width: 0; }
.how-it-works__journeys { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(1.25rem, 2.5vw, 2rem); }
.hiw-journey { display: flex; flex-direction: column; align-items: flex-start; }
.hiw-steps { width: 100%; flex: 1; }
.hiw-step__body { text-align: left; }
.hiw-action { margin-top: auto; }
.hiw-step { grid-template-columns: 2.5rem minmax(0, 1fr); min-width: 0; }
.hiw-step__name,
.hiw-step__desc { overflow-wrap: anywhere; }
.hiw-divider { display: none; }

@media (max-width: 1100px) {
  .how-it-works { padding-block: 3.5rem; }
}

@media (max-width: 560px) {
  .how-it-works { padding-inline: 20px; }
  .how-it-works__journeys { grid-template-columns: 1fr; }
}
</style>
