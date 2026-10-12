<script setup lang="ts">
// Final CTA � no statistics or invented content
</script>

<template>
  <section class="final-cta" aria-labelledby="cta-heading">
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
  margin-top: 6rem;
  background: var(--secondary);
  border: 1px solid oklch(from var(--primary) l c h / 0.2);
  border-radius: 10px;
  padding: 3rem 3.5rem;
}

.final-cta__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.final-cta__kicker {
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--primary);
}

.final-cta__title {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.5rem, 2vw, 1.85rem);
  font-weight: 800;
  color: var(--foreground);
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

@media (max-width: 560px) {
  .final-cta { padding-inline: 20px; }
}
</style>
