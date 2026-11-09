<script setup lang="ts">
import { MapPin } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { HERO_IMAGE } from '@/config/assets'
import WaveTransition from './WaveTransition.vue'
</script>

<template>
  <section id="inicio" class="hero" aria-label="Portada principal">
    <div class="hero__copy">
      <p class="hero__kicker">
        <span class="hero__kicker-dot" aria-hidden="true">·</span>
        Desde Jinotega, para Nicaragua
      </p>

      <h1 class="hero__title">
        Conectamos<br />
        <span class="hero__word"><span class="hero__keyword">talento</span></span> con<br />
        <span class="hero__title-accent"><span class="hero__word"><span class="hero__keyword">oportunidades</span></span></span>
      </h1>

      <p class="hero__lede">
        Conectamos el talento de Jinotega con oportunidades para crecer en
        toda Nicaragua.
      </p>

      <div class="hero__actions">
        <RouterLink to="/auth" class="hero__btn hero__btn--primary">
          Explorar empleos <span aria-hidden="true">&rarr;</span>
        </RouterLink>
        <RouterLink to="/auth" class="hero__btn hero__btn--secondary">
          Publicar una oferta <span aria-hidden="true">&nearr;</span>
        </RouterLink>
      </div>

      <p class="hero__location">
        <MapPin :size="13" aria-hidden="true" />
        Hecho en Jinotega, para toda Nicaragua
      </p>
    </div>

    <div class="hero__visual" aria-hidden="true">
      <!-- Tonal gradient fade from background into the image -->
      <div class="hero__visual-fade" />
      <div class="hero__image-wrap">
        <img
          :src="HERO_IMAGE"
          alt="Personas conectadas con oportunidades profesionales en un entorno de trabajo moderno"
          class="hero__img"
          loading="eager"
        />
        <!-- Floating label over image -->
        <div class="hero__float-tag">
          <span class="hero__float-line" aria-hidden="true" />
          <span class="hero__float-text">Talento y empresas, en un solo lugar</span>
        </div>
      </div>
    </div>

    <div class="hero__decoration" aria-hidden="true">
      <span class="hero__topography" />
      <span class="hero__rings" />
      <span class="hero__connection" />
      <span class="hero__dots" />
    </div>

    <WaveTransition class="hero__bottom-transition" fill-color="#F7EDE6" highlight-color="#16302B" />
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  align-items: stretch;
  gap: 3rem;
  min-height: 560px;
  padding: 5rem 0 3rem;
  position: relative;
  overflow: hidden;
}

/* Copy */
.hero__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero__kicker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.25rem;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.17em;
  color: var(--primary);
}

.hero__kicker-dot {
  font-size: 1.1rem;
  line-height: 1;
  margin-top: -2px;
}

.hero__title {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: clamp(2.8rem, 4.4vw, 3.6rem);
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: var(--foreground);
  max-width: 13ch;
}

.hero__title-accent {
  color: var(--primary);
}

.hero__word {
  position: relative;
  display: inline-block;
  overflow: clip;
  vertical-align: bottom;
}

.hero__keyword {
  display: inline-block;
  white-space: nowrap;
}

.hero__lede {
  margin: 1.25rem 0 0;
  max-width: 380px;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--muted-foreground);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.78rem 1.35rem;
  font-size: 0.93rem;
  font-weight: 700;
  border-radius: 6px;
  text-decoration: none;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.hero__btn--primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 6px 18px oklch(from var(--primary) l c h / 0.22);
}

.hero__btn--primary:hover {
  background: oklch(from var(--primary) calc(l - 0.05) c h);
  transform: translateY(-1px);
}

.hero__btn--secondary {
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
}

.hero__btn--secondary:hover {
  background: var(--panel);
  transform: translateY(-1px);
}

.hero__btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

.hero__location {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 1.25rem 0 0;
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

/* Visual */
.hero__visual {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 100%;
}

/* Ola inferior */
.hero__visual-fade {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: linear-gradient(to right, var(--background), transparent);
  z-index: 2;
  pointer-events: none;
}

.hero__image-wrap {
  position: relative;
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  min-height: 100%;
}

.hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Floating tag */
.hero__float-tag {
  position: absolute;
  z-index: 6; /* por encima de la ola (z-index 4) */
  bottom: 1.5rem;
  left: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.85rem;
  box-shadow: 0 4px 16px oklch(0 0 0 / 0.08);
}

.hero__float-line {
  display: block;
  width: 3px;
  height: 22px;
  background: var(--primary);
  border-radius: 99px;
  flex-shrink: 0;
}

.hero__float-text {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--foreground);
  max-width: 18ch;
  line-height: 1.35;
}

/* Responsive */
@media (max-width: 1100px) {
  .hero {
    grid-template-columns: 1fr 1.3fr;
    gap: 2rem;
  }
}

@media (max-width: 800px) {
  .hero__rings,
  .hero__connection { display:none; }

  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 3rem 0 2rem;
    gap: 2rem;
  }

  .hero__visual {
    order: -1;
    max-height: 280px;
  }

  .hero__visual-fade {
    display: none;
  }

  .hero__image-wrap {
    min-height: 240px;
  }

  .hero__title {
    font-size: clamp(2rem, 7vw, 2.6rem);
    max-width: none;
  }
}

@media (max-width: 560px) {
  .hero__actions {
    flex-direction: column;
    width: 100%;
  }

  .hero__btn {
    justify-content: center;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__btn {
    transition: none;
  }
}

/* Full-bleed editorial hero from the landing reference. */
.hero {
  width: 100vw;
  left: 50%;
  margin-left: -50vw;
  display: flex;
  align-items: center;
  min-height: clamp(620px, 100svh, 900px);
  padding: calc(clamp(3rem, 6vw, 4.5rem) + 68px) 0 6rem;
}

.hero__copy {
  position: relative;
  z-index: 3;
  width: min(1600px, 100%);
  margin-inline: auto;
  padding-inline: clamp(24px, 4vw, 64px);
}

.hero__decoration { position:absolute;inset:0;z-index:2;overflow:hidden;pointer-events:none; }
.hero__topography { position:absolute;inset:0;background:url('/assets/jinowork-assets/01-hero/hero-topo-dark.svg') left center/cover no-repeat;opacity:.72; }
.hero__rings { position:absolute;left:-5rem;bottom:-15rem;width:min(42vw,560px);aspect-ratio:1;background:url('/assets/jinowork-assets/01-hero/hero-rings-accent.svg') center/contain no-repeat;opacity:.72; }
.hero__connection { position:absolute;left:clamp(24px,6vw,96px);bottom:clamp(95px,11vw,150px);width:min(32vw,420px);height:180px;background:url('/assets/jinowork-assets/01-hero/hero-path-connection.svg') center/contain no-repeat;opacity:.76; }
.hero__dots { position:absolute;top:0;right:0;width:min(28vw,360px);height:260px;background:url('/assets/jinowork-assets/shared/dots-dark.svg') right top/contain no-repeat;opacity:.68;mask-image:linear-gradient(to bottom left,#000,transparent 74%); }

.hero__visual {
  position: absolute;
  inset: 0 0 0 auto;
  z-index: 1;
  width: 100%;
}

.hero__visual-fade {
  inset: 0;
  width: auto;
  /* verde oscuro #16302B = rgb(22 48 43) */
  background: linear-gradient(90deg, rgb(22 48 43 / 76%) 0%, rgb(22 48 43 / 62%) 24%, rgb(22 48 43 / 34%) 43%, rgb(22 48 43 / 8%) 68%, transparent 100%);
}

.hero__image-wrap { height: 100%; min-height: 0; border-radius: 0; }
.hero__img { position: absolute; inset: 0; }
.hero__float-tag {
  right: max(24px, calc((100vw - 1240px) / 2 + 24px));
  left: auto;
  bottom: calc(clamp(64px, 8vw, 110px) + 1rem); /* sube la etiqueta para que no la tape la ola */
}
.hero__title { max-width: 13ch; font-size: clamp(3.25rem, 5vw, 4.5rem); }
.hero__lede { max-width: 440px; font-size: 1.2rem; }
.hero__kicker { font-size: 0.86rem; }
.hero__btn { padding: 0.95rem 1.55rem; font-size: 1rem; }
.hero__location { font-size: 0.92rem; }

/* Paleta Jinowork: verde oscuro + terracota */
.hero { --primary: #b5483a; background: #16302b; }
.hero__kicker { color: #d8695a; }
.hero__title { color: #fff; }
.hero__title-accent { color: #d8695a; }
.hero__lede,
.hero__location { color: rgb(247 237 230 / 82%); }
.hero__btn--secondary { color: #fff; border-color: rgb(247 237 230 / 38%); }
.hero__btn--secondary:hover { background: rgb(255 255 255 / 10%); }
.hero__float-tag { background: rgb(22 48 43 / 92%); border-color: #35615a; }
.hero__float-text { color: #fff; }
.hero__float-line { background: #d8695a; }

@media (max-width: 800px) {
  .hero { min-height: clamp(620px, 100svh, 850px); padding: 5.5rem 0 4rem; }
  .hero__copy { align-self: flex-end; padding-inline: 20px; }
  .hero__title { font-size: clamp(2.3rem, 7vw, 3rem); }
  .hero__visual { display: flex; order: initial; width: 100%; max-height: none; opacity: 1; }
  .hero__visual-fade { display: block; background: linear-gradient(180deg, rgb(22 48 43 / 8%) 0%, rgb(22 48 43 / 36%) 35%, #16302b 78%); }
  .hero__image-wrap { min-height: 100%; }
  .hero__img { object-position: 80% center; }
  .hero__float-tag { display: none; }
}
</style>
