<script setup lang="ts">
import AppBrand from '@/components/ui/AppBrand.vue'
import { ArrowLeft } from '@lucide/vue'
</script>

<template>
  <aside class="story-panel">
    <div class="story-panel__brand">
      <AppBrand variant="full" />
    </div>

    <span class="story-panel__base" aria-hidden="true" />
    <span class="story-panel__glow" aria-hidden="true" />
    <span class="story-panel__topography" aria-hidden="true" />
    <span class="story-panel__rings" aria-hidden="true" />
    <span class="story-panel__hills" aria-hidden="true" />
    <span class="story-panel__waves" aria-hidden="true" />
    <span class="story-panel__coffee" aria-hidden="true" />

    <div class="story-panel__text">
      <p class="story-panel__kicker">
        <span class="story-panel__kicker-line" aria-hidden="true" />
        Desde Jinotega, para Nicaragua
      </p>
      <h1 class="story-panel__title">
        Conectamos talento<br />
        <span>con oportunidades.</span>
      </h1>
      <p class="story-panel__desc">
        Conectamos el talento de Jinotega con oportunidades para crecer en toda Nicaragua.
      </p>
      <p class="story-panel__tagline">Talento y empresas, en un solo lugar.</p>

      <a href="/" class="story-panel__back">
        <ArrowLeft :size="16" aria-hidden="true" />
        Volver a Jinowork
      </a>
    </div>
  </aside>
</template>

<style scoped>
.story-panel {
  --foreground: #fcf8f5;
  --muted-foreground: #e0e8e3;
  --primary: #2f5d50;
  --story-terracotta: #d8695a;
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  align-items: center;
  overflow: hidden;
  position: relative;
  isolation: isolate;
  clip-path: polygon(
    0 0, 100% 0,
    99.9% 8%, 99.5% 16%, 98.5% 24%, 97% 32%,
    95.5% 40%, 94.5% 48%, 94.5% 52%, 95% 60%,
    96% 68%, 97.5% 76%, 99% 84%, 99.8% 92%,
    100% 100%, 0 100%
  );
  background: #1b3a33;
}

.story-panel__brand,
.story-panel__text {
  width: min(100%, 100%);
}

.story-panel__brand {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: clamp(2rem, 5vh, 3.5rem) clamp(2rem, 7vw, 7rem) 0;
  flex-shrink: 0;
}

.story-panel__brand-name {
  color: var(--foreground);
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.45rem, 2vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.story-panel__dot { color: var(--story-terracotta); }

.story-panel__text {
  position: relative;
  z-index: 10;
  grid-row: 2;
  align-self: start;
  max-width: min(50vw, 760px);
  padding: clamp(1rem, 5vh, 3rem) clamp(2rem, 7vw, 7rem) 0;
}

.story-panel__kicker {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0 0 clamp(2rem, 5vh, 3.5rem);
  color: var(--muted-foreground);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.19em;
  text-transform: uppercase;
}

.story-panel__kicker-line {
  width: 2rem;
  height: 2px;
  flex-shrink: 0;
  background: var(--story-terracotta);
}

.story-panel__title {
  margin: 0 0 1.25rem;
  color: var(--foreground);
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2.8rem, 4.3vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 1.07;
}

.story-panel__title span { color: #e68a78; }

.story-panel__desc {
  max-width: 38ch;
  margin: 0;
  color: var(--muted-foreground);
  font-size: clamp(1rem, 1.2vw, 1.2rem);
  line-height: 1.7;
}

.story-panel__tagline {
  margin: clamp(1.75rem, 4vh, 3.5rem) 0 0;
  color: #f3e3db;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.17em;
  line-height: 1.6;
  text-transform: uppercase;
}

.story-panel__back {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 1.5rem;
  padding: 0.65rem 0;
  color: var(--muted-foreground);
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.18s ease;
}

.story-panel__back:hover { color: var(--story-terracotta); }
.story-panel__back:focus-visible { outline: 2px solid var(--story-terracotta); outline-offset: 4px; }

.story-panel__base,
.story-panel__glow,
.story-panel__topography,
.story-panel__rings,
.story-panel__hills,
.story-panel__waves,
.story-panel__coffee,
.story-panel__edge {
  position: absolute;
  display: block;
  pointer-events: none;
  background-repeat: no-repeat;
}

.story-panel__base,
.story-panel__glow,
.story-panel__topography,
.story-panel__rings,
.story-panel__hills,
.story-panel__waves {
  inset: 0;
  background-position: center;
  background-size: cover;
}

.story-panel__base {
  z-index: 0;
  background: #1b3a33;
}

.story-panel__glow {
  z-index: 1;
  background-image: url('/assets/jinowork-svgs-mejorados/left/02-resplandor-oscuro.svg');
}

.story-panel__topography {
  z-index: 2;
  background-image: url('/assets/jinowork-svgs-mejorados/left/01-contornos-oscuros.svg');
}

.story-panel__rings {
  z-index: 3;
  background-image: url('/assets/jinowork-svgs-mejorados/left/05-orbitas-oscuras.svg');
}

.story-panel__hills {
  z-index: 4;
  background-image: url('/assets/jinowork-svgs-mejorados/left/04-cerros-jinotega.svg');
}

.story-panel__waves {
  z-index: 5;
  background-image: url('/assets/jinowork-svgs-mejorados/left/03-ondas-oscuras.svg');
}

.story-panel__coffee {
  z-index: 6;
  right: 18%;
  bottom: 7%;
  width: 5rem;
  height: 7rem;
  background-image: url('/assets/jinowork-svgs-mejorados/extras/32-rama-de-cafe.svg');
  background-position: center;
  background-size: contain;
  opacity: .5;
}

@media (max-width: 900px) {
  .story-panel__text { max-width: 52vw; }
  .story-panel__title { font-size: clamp(2.3rem, 4vw, 3.4rem); }
  .story-panel__coffee { opacity: .32; }
}

@media (max-width: 760px) {
  .story-panel__coffee { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .story-panel__back { transition: none; }
}
</style>
