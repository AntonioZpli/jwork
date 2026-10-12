<script setup lang="ts">
import AppBrand from '@/components/ui/AppBrand.vue'
import { ArrowLeft } from '@lucide/vue'
</script>

<template>
  <aside class="story-panel">
    <div class="story-panel__brand">
      <AppBrand variant="full" />
    </div>

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
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: var(--background);
}

.story-panel__brand {
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

.story-panel__dot { color: var(--primary); }

.story-panel__text {
  max-width: min(50vw, 760px);
  padding: clamp(3rem, 9vh, 7rem) clamp(2rem, 7vw, 7rem) 2rem;
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
  background: var(--primary);
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

.story-panel__title span { color: var(--primary); }

.story-panel__desc {
  max-width: 38ch;
  margin: 0;
  color: var(--muted-foreground);
  font-size: clamp(1rem, 1.2vw, 1.2rem);
  line-height: 1.7;
}

.story-panel__tagline {
  margin: clamp(2.5rem, 7vh, 5.5rem) 0 0;
  color: var(--primary);
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

.story-panel__back:hover { color: var(--primary); }
.story-panel__back:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; }

@media (max-width: 900px) {
  .story-panel__text { max-width: 52vw; }
  .story-panel__title { font-size: clamp(2.3rem, 4vw, 3.4rem); }
}

@media (prefers-reduced-motion: reduce) {
  .story-panel__back { transition: none; }
}
</style>
