<script setup lang="ts">
import { CheckCircle } from '@lucide/vue'
import { COMPANIES_IMAGE } from '@/config/assets'

const benefits = [
  'Presenta tus oportunidades de forma clara y profesional.',
  'Facilita el encuentro entre tus ofertas y los candidatos adecuados.',
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
        <span class="companies__dots" />
        <span class="companies__bracket companies__bracket--tl" />
        <span class="companies__bracket companies__bracket--br" />
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
  --companies-green-800: #16302b;
  --companies-green-700: #234640;
  --companies-green-600: #35615a;
  --companies-terracotta-600: #b5483a;
  --companies-cream-100: #f7ede6;
  --companies-cream-300: #e3cfc1;
  --companies-text-secondary: #5f6f6b;
  padding-top: 6rem;
  isolation: isolate;
  overflow: hidden;
}

.companies::before {
  position:absolute;z-index:0;inset:0;background:url('/assets/jinowork-assets/04-empresas/empresas-bg-topo.svg') right center/cover no-repeat;content:"";pointer-events:none;opacity:.82;
}

.companies__grid {
  position:relative;z-index:1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5rem;
  align-items: center;
}

/* Visual */
.companies__visual {
  position: relative;
  flex-shrink: 0;
  isolation:isolate;
}

.companies__visual::before {
  position:absolute;z-index:-1;inset:0;transform:translate(18px,18px);border:1.5px solid rgb(200 85 61 / 40%);content:"";
}

.companies__dots {
  position:absolute;z-index:0;right:-24px;bottom:-24px;width:144px;height:144px;background:url('/assets/jinowork-assets/04-empresas/empresas-dots-patch.svg') center/contain no-repeat;pointer-events:none;opacity:.9;
}

.companies__bracket {
  position:absolute;z-index:2;width:44px;height:44px;background:url('/assets/jinowork-assets/04-empresas/empresas-bracket.svg') center/contain no-repeat;pointer-events:none;
}

.companies__bracket--tl {top:-12px;left:-12px}
.companies__bracket--br {right:-12px;bottom:-12px;transform:rotate(180deg)}

.companies__img {
  position:relative;z-index:1;
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
  color: var(--companies-terracotta-600);
}

.companies__title {
  margin: 0 0 1rem;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.75rem, 2.3vw, 2.2rem);
  font-weight: 800;
  color: var(--companies-green-800);
  letter-spacing: -0.04em;
  line-height: 1.15;
}

.companies__desc {
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
  color: var(--companies-text-secondary);
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
  color: var(--companies-green-800);
  line-height: 1.55;
}

.companies__benefit-icon {
  color: var(--companies-green-600);
  flex-shrink: 0;
  margin-top: 2px;
}

.companies__cta {
  display: inline-flex;
  align-items: center;
  padding: 0.82rem 1.5rem;
  background: var(--companies-green-600);
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
  background: var(--companies-green-700);
  transform: translateY(-1px);
}

.companies__cta:focus-visible {
  outline: 2px solid var(--companies-green-600);
  outline-offset: 4px;
}

@media (max-width: 1100px) {
  .companies__grid {
    gap: 3rem;
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
  background: var(--companies-cream-100);
}

.companies__grid { width: min(100%, 1600px); margin-inline: auto; }
.companies__img { border-radius: 6px; }
.companies__title { font-size: clamp(2.2rem, 3.5vw, 3.2rem); }
.companies__desc { font-size: 1.12rem; }
.companies__benefit { font-size: 1rem; }
.companies { padding-block: 4.5rem; background: var(--companies-cream-100); isolation:isolate;overflow:hidden; }
.companies__grid { position:relative;z-index:1;grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: clamp(2rem, 4vw, 3.5rem); }
.companies__img { height: 300px; border: 1px solid var(--companies-cream-300); box-shadow: 0 16px 40px rgb(22 48 43 / 10%); }
.companies__cta { border-radius: 5px; }

@media (max-width: 1100px) {
  .companies { padding-block: 4.5rem; }
}

@media (max-width: 560px) {
  .companies { padding-inline: 20px; }
  .companies { padding-block: 3.5rem; }
}

@media (max-width: 900px) {
  .companies__grid { grid-template-columns: 1fr; gap: 2rem; }
  .companies__img { height: clamp(12rem, 48vw, 18rem); object-position: center 42%; }
}

@media (max-width: 767px) {
  .companies__dots,.companies__bracket { display:none; }
}
</style>
