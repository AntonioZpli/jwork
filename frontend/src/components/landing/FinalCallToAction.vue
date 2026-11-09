<script setup lang="ts">
import { FINAL_CTA_IMAGE } from '@/config/assets'
// Final CTA: no statistics or invented content
</script>

<template>
  <section class="final-cta" aria-labelledby="cta-heading">
    <img class="final-cta__image" :src="FINAL_CTA_IMAGE" alt="" loading="lazy" />
    <div class="final-cta__shade" aria-hidden="true" />
    <span class="final-cta__ridges" aria-hidden="true" />
    <span class="final-cta__rings" aria-hidden="true" />
    <span class="final-cta__coffee" aria-hidden="true" />
    <div class="final-cta__inner">
      <div class="final-cta__copy">
        <p class="final-cta__kicker">Siguiente paso</p>
        <h2 id="cta-heading" class="final-cta__title">
          Tu próxima oportunidad puede empezar aquí.
        </h2>
      </div>
      <div class="final-cta__action">
        <a href="/auth" class="final-cta__btn">
          Comenzar ahora →
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.final-cta {
  --cta-green-900: #0f2420;
  --cta-green-700: #234640;
  --cta-green-600: #35615a;
  --cta-cream-50: #fdf9f6;
  --cta-cream-200: #efdfd4;
  --cta-terracotta-200: #f0c9c0;
  position: relative;
  isolation:isolate;
  overflow: hidden;
  margin-top: 6rem;
  background: var(--cta-green-900);
  border: 1px solid var(--cta-green-700);
  border-radius: 10px;
  padding: 3rem 3.5rem;
}

.final-cta__inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.final-cta__image,
.final-cta__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.final-cta__image { z-index:-2;object-fit: cover; object-position: center 54%; }
.final-cta__shade { z-index:-1;background: linear-gradient(90deg, rgb(15 36 32 / 58%), rgb(15 36 32 / 38%) 62%, rgb(15 36 32 / 20%)); }
.final-cta__ridges,.final-cta__rings,.final-cta__coffee{position:absolute;z-index:0;display:block;pointer-events:none;background-repeat:no-repeat}
.final-cta__ridges{right:0;bottom:0;left:0;height:300px;background-image:url('/assets/jinowork-assets/05-cta/cta-ridges.svg');background-position:center bottom;background-size:cover;opacity:.68}
.final-cta__rings{right:-30px;top:50%;width:min(46vw,580px);aspect-ratio:1;transform:translateY(-50%);background-image:url('/assets/jinowork-assets/05-cta/cta-rings.svg');background-position:center;background-size:contain;opacity:.5}
.final-cta__coffee{right:clamp(120px,20vw,320px);bottom:1rem;width:150px;height:180px;background-image:url('/assets/jinowork-assets/shared/motif-coffee-branch-cream.svg');background-position:center bottom;background-size:contain;opacity:.48}

.final-cta__kicker {
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--cta-terracotta-200);
}

.final-cta__title {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.5rem, 2vw, 1.85rem);
  font-weight: 800;
  color: var(--cta-cream-50);
  letter-spacing: -0.04em;
  line-height: 1.15;
  max-width: 34ch;
}

.final-cta__action {
  flex-shrink: 0;
}

.final-cta__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.82rem 1.5rem;
  background: var(--cta-green-600);
  color: #fff;
  font-size: 0.93rem;
  font-weight: 700;
  border-radius: 6px;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    transform 0.18s ease;
}

.final-cta__btn:hover {
  background: var(--cta-green-700);
  transform: translateY(-1px);
}

.final-cta__btn:focus-visible {
  outline: 2px solid var(--cta-cream-200);
  outline-offset: 4px;
}

@media (max-width: 800px) {
  .final-cta {
    padding: 2rem;
  }

  .final-cta__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .final-cta__btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 560px) {
  .final-cta {
    padding: 1.5rem;
    border-radius: 8px;
  }
}

@media (max-width: 767px) {
  .final-cta__rings,.final-cta__coffee { display:none; }
}

@media (prefers-reduced-motion: reduce) {
  .final-cta__btn {
    transition: none;
  }
}

.final-cta {
  position: relative;
  left: 50%;
  width: 100vw;
  margin: 0 0 0 -50vw;
  padding: 3.5rem max(clamp(20px, 4vw, 64px), calc((100vw - 1600px) / 2 + clamp(20px, 4vw, 64px)));
  border: 0;
  border-radius: 0;
}

.final-cta__inner { width: min(100%, 1600px); margin-inline: auto; }
.final-cta__copy { min-width: 0; }
.final-cta__kicker { font-size: 0.88rem; }
.final-cta__title { font-size: clamp(2.2rem, 3.4vw, 3.2rem); max-width: 25ch; }
.final-cta__btn { padding: 1rem 1.8rem; font-size: 1rem; }
.final-cta__action { flex-shrink: 0; }
.final-cta { min-height: clamp(260px, 25vw, 360px); display: flex; align-items: center; }
.final-cta { padding-block: 2.5rem; }
.final-cta__inner { row-gap: 0.65rem; }

@media (max-width: 560px) {
  .final-cta { min-height: 320px; padding-inline: 20px; }
}
</style>
