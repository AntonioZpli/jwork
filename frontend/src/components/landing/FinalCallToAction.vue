<script setup lang="ts">
import { JINOTEGA_IMAGE } from '@/config/assets'
// Final CTA: no statistics or invented content
</script>

<template>
  <section class="final-cta" aria-labelledby="cta-heading">
    <img class="final-cta__image" :src="JINOTEGA_IMAGE" alt="" loading="lazy" />
    <div class="final-cta__shade" aria-hidden="true" />
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
      <p class="final-cta__credit">
        Foto:
        <a href="https://commons.wikimedia.org/wiki/File:Jinotega_desde_La_Pe%C3%B1a_de_La_Cruz.jpg" target="_blank" rel="noreferrer">HeraldFrancisco NI / Wikimedia Commons</a>
        ·
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.final-cta {
  position: relative;
  overflow: hidden;
  margin-top: 6rem;
  background: #123250;
  border: 1px solid oklch(from var(--primary) l c h / 0.2);
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

.final-cta__image { object-fit: cover; object-position: center 54%; }
.final-cta__shade { background: linear-gradient(90deg, rgb(7 21 37 / 88%), rgb(7 21 37 / 48%) 62%, rgb(7 21 37 / 30%)); }

.final-cta__kicker {
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #aed2ff;
}

.final-cta__title {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.5rem, 2vw, 1.85rem);
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.04em;
  line-height: 1.15;
  max-width: 34ch;
}

.final-cta__action {
  flex-shrink: 0;
}

.final-cta__credit {
  flex-basis: 100%;
  margin-bottom: 0;
  margin-top: 0;
  color: rgb(255 255 255 / 76%);
  font-size: 0.68rem;
}

.final-cta__credit a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }

.final-cta__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.82rem 1.5rem;
  background: var(--primary);
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
  background: oklch(from var(--primary) calc(l - 0.05) c h);
  transform: translateY(-1px);
}

.final-cta__btn:focus-visible {
  outline: 2px solid var(--primary);
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
