<script setup lang="ts">
import { FEATURED_JOBS } from '@/data/jobs'
import JobCard from './JobCard.vue'
</script>

<template>
  <section id="empleos" class="featured-jobs" aria-labelledby="jobs-heading">
    <div class="featured-jobs__header">
      <div>
        <p class="featured-jobs__kicker">Encuentra tu siguiente paso</p>
        <h2 id="jobs-heading" class="featured-jobs__title">Oportunidades que inspiran.</h2>
        <p class="featured-jobs__intro">Un nuevo reto, un equipo diferente, una oportunidad para crecer.</p>
      </div>
      <a class="featured-jobs__all" href="/auth">Ver todas las ofertas <span aria-hidden="true">&nearr;</span></a>
    </div>
    <p class="featured-jobs__disclaimer" role="note">Ofertas ilustrativas · Empresas ficticias</p>
    <ul class="featured-jobs__grid" role="list" aria-label="Listado de ofertas ilustrativas">
      <li v-for="job in FEATURED_JOBS" :key="job.id">
        <JobCard :job="job" />
      </li>
    </ul>
  </section>
</template>
<style scoped>
.featured-jobs { margin-top: 2rem; padding: 3.5rem; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; }
.featured-jobs__header { display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; margin-bottom: 1.25rem; }
.featured-jobs__kicker { margin: 0 0 0.55rem; color: var(--primary); font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
.featured-jobs__title { margin: 0; color: var(--foreground); font-family: 'Manrope', sans-serif; font-size: clamp(2rem, 3.3vw, 2.65rem); font-weight: 800; line-height: 1.15; }
.featured-jobs__intro { margin: 0.7rem 0 0; color: var(--muted-foreground); font-size: 1.12rem; }
.featured-jobs__all { display: inline-flex; align-items: center; gap: 0.45rem; flex-shrink: 0; color: var(--primary); font-size: 1rem; font-weight: 700; }
.featured-jobs__disclaimer { margin: 1.5rem 0 1rem; color: var(--muted-foreground); font-size: 0.9rem; }
.featured-jobs__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; list-style: none; margin: 0; padding: 0; }
.featured-jobs__grid > li { min-width: 0; }
.featured-jobs a:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; }
@media (max-width: 1100px) { .featured-jobs { padding: 2.5rem; } .featured-jobs__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .featured-jobs { padding: 1.35rem; } .featured-jobs__header { align-items: flex-start; flex-direction: column; gap: 0.8rem; } .featured-jobs__grid { grid-template-columns: 1fr; } }

/* This is a page band, with its content aligned to the same editorial grid. */
.featured-jobs {
  position: relative;
  left: 50%;
  width: 100vw;
  margin: 0 0 0 -50vw;
  padding: 4rem max(clamp(20px, 4vw, 64px), calc((100vw - 1600px) / 2 + clamp(20px, 4vw, 64px)));
  border: 0;
  border-radius: 0;
}

.featured-jobs__header,
.featured-jobs__disclaimer,
.featured-jobs__grid {
  width: min(100%, 1600px);
  margin-inline: auto;
}

.featured-jobs__header { margin-bottom: 1rem; }
.featured-jobs__disclaimer { margin-top: 1.5rem; }
.featured-jobs__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }

@media (max-width: 1100px) {
  .featured-jobs { padding-block: 3rem; }
  .featured-jobs__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 560px) {
  .featured-jobs { padding-inline: 20px; }
  .featured-jobs__grid { grid-template-columns: 1fr; }
}
</style>
