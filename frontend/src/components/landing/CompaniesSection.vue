<script setup lang="ts">
import { CheckCircle } from '@lucide/vue'
import { COMPANIES_IMAGE } from '@/config/assets'

const benefits = [
  'Presenta tus oportunidades de forma clara y profesional.',
  'Facilita el encuentro entre tus vacantes y los candidatos adecuados.',
]
</script>

<template>
  <section id="empresas" class="companies" aria-labelledby="companies-heading">
    <div class="companies__grid">
      <!-- Visual column -->
      <div class="companies__visual" aria-hidden="true">
        <img
          :src="COMPANIES_IMAGE"
          alt="Equipo revisando perfiles profesionales para contratar"
          class="companies__img"
          loading="lazy"
        />
      </div>

      <!-- Copy column -->
      <div class="companies__copy">
        <p class="companies__kicker">Para empresas</p>
        <h2 id="companies-heading" class="companies__title">
          Encuentra a la persona adecuada para tu equipo.
        </h2>
        <p class="companies__desc">
          Encuentra talento en Jinotega y conecta tu empresa con personas de
          toda Nicaragua que buscan crecer profesionalmente.
        </p>

        <ul class="companies__benefits" role="list">
          <li v-for="benefit in benefits" :key="benefit" class="companies__benefit">
            <CheckCircle :size="16" class="companies__benefit-icon" aria-hidden="true" />
            <span>{{ benefit }}</span>
          </li>
        </ul>

        <a href="/auth" class="companies__cta">
          Publicar una oferta
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.companies {
  padding-top: 6rem;
}

.companies__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5rem;
  align-items: center;
}

/* Visual */
.companies__visual {
  position: relative;
  flex-shrink: 0;
}

.companies__img {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

/* Copy */
.companies__kicker {
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--primary);
}

.companies__title {
  margin: 0 0 1rem;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.75rem, 2.3vw, 2.2rem);
  font-weight: 800;
  color: var(--foreground);
  letter-spacing: -0.04em;
  line-height: 1.15;
}

.companies__desc {
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
  color: var(--muted-foreground);
  line-height: 1.7;
}

.companies__benefits {
  list-style: none;
  margin: 0 0 2rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.companies__benefit {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  font-size: 0.9rem;
  color: var(--foreground);
  line-height: 1.55;
}

.companies__benefit-icon {
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.companies__cta {
  display: inline-flex;
  align-items: center;
  padding: 0.82rem 1.5rem;
  background: var(--primary);
  color: #fff;
  font-size: 0.93rem;
  font-weight: 700;
  border-radius: 6px;
  text-decoration: none;
  transition:
    background-color 0.18s ease,
    transform 0.18s ease;
}

.companies__cta:hover {
  background: oklch(from var(--primary) calc(l - 0.05) c h);
  transform: translateY(-1px);
}

.companies__cta:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

@media (max-width: 1100px) {
  .companies__grid {
    gap: 3rem;
  }
}

@media (max-width: 800px) {
  .companies__grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .companies__img {
    height: 280px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .companies__cta {
    transition: none;
  }
}

.companies {
  position: relative;
  left: 50%;
  width: 100vw;
  margin: 0 0 0 -50vw;
  padding: 4.5rem max(clamp(20px, 4vw, 64px), calc((100vw - 1600px) / 2 + clamp(20px, 4vw, 64px)));
  background: var(--background);
}

.companies__grid { width: min(100%, 1600px); margin-inline: auto; }
.companies__img { border-radius: 6px; }
.companies__title { font-size: clamp(2.2rem, 3.5vw, 3.2rem); }
.companies__desc { font-size: 1.12rem; }
.companies__benefit { font-size: 1rem; }

@media (max-width: 1100px) {
  .companies { padding-block: 3.5rem; }
}

@media (max-width: 560px) {
  .companies { padding-inline: 20px; }
}
</style>
