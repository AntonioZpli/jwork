<script setup lang="ts">
import { RouterLink } from 'vue-router'
import JobCard from './JobCard.vue'
import { FEATURED_JOBS } from '@/data/jobs'
</script>

<template>
  <section id="empleos" class="featured-jobs" aria-labelledby="jobs-heading">
    <div class="featured-jobs__header">
      <div>
        <p class="featured-jobs__kicker">Encuentra tu siguiente paso</p>
        <h2 id="jobs-heading" class="featured-jobs__title">Oportunidades que inspiran.</h2>
        <p class="featured-jobs__intro">Ejemplos de cómo se mostrarán las vacantes.</p>
      </div>
      <RouterLink class="featured-jobs__all" to="/auth">Ver todas las ofertas <span aria-hidden="true">&nearr;</span></RouterLink>
    </div>
    <ul class="featured-jobs__grid" role="list" aria-label="Ejemplos de vacantes">
      <li v-for="job in FEATURED_JOBS.slice(0, 3)" :key="job.id"><JobCard :job="job" example /></li>
    </ul>
  </section>
</template>

<style scoped>
.featured-jobs { position:relative; left:50%; width:100vw; margin:0 0 0 -50vw; padding:5rem max(clamp(20px,4vw,64px),calc((100vw - 1600px)/2 + clamp(20px,4vw,64px))); background:var(--panel); }
.featured-jobs__header,.featured-jobs__grid { width:min(100%,1600px); margin-inline:auto; }
.featured-jobs__header { display:flex; align-items:flex-end; justify-content:space-between; gap:2rem; margin-bottom:1.35rem; }
.featured-jobs__header>div { min-width:0; }
.featured-jobs__kicker { margin:0 0 .55rem; color:var(--primary); font-size:.78rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em; }
.featured-jobs__title { margin:0; color:var(--foreground); font-family:Manrope,sans-serif; font-size:clamp(2rem,3.3vw,2.65rem); font-weight:800; line-height:1.15; }
.featured-jobs__intro { margin:.7rem 0 0; color:var(--muted-foreground); font-size:1.05rem; }
.featured-jobs__all { display:inline-flex; flex-shrink:0; align-items:center; gap:.45rem; color:var(--primary); font-size:.95rem; font-weight:750; }
.featured-jobs__grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1.15rem; list-style:none; margin-top:1.75rem; padding:0; }
.featured-jobs__grid>li { min-width:0; }
.featured-jobs__state { width:min(100%,1600px); min-height:7rem; display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:.35rem .5rem; margin:0 auto; color:var(--muted-foreground); text-align:center; }
.featured-jobs__state a { color:var(--primary); font-weight:750; }
.featured-jobs a:focus-visible { outline:2px solid var(--primary); outline-offset:4px; }
@media(max-width:1100px){.featured-jobs{padding-block:4rem}.featured-jobs__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.featured-jobs{padding:3rem 20px}.featured-jobs__header{align-items:flex-start;flex-direction:column;gap:.8rem}.featured-jobs__grid{grid-template-columns:1fr}}
</style>
