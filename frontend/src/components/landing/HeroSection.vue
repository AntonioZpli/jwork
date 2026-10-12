<script setup lang="ts">
import { MapPin } from '@lucide/vue'
import { HERO_IMAGE } from '@/config/assets'
</script>

<template>
  <section id="inicio" class="hero" aria-label="Portada principal">
    <div class="hero__copy">
      <p class="hero__kicker">
        <span class="hero__kicker-dot" aria-hidden="true">·</span>
        Desde Jinotega, para Nicaragua
      </p>

      <h1 class="hero__title">
        Conectamos talento<br />
        <span class="hero__title-accent">con oportunidades</span>
      </h1>

      <p class="hero__lede">
        Conectamos el talento de Jinotega con oportunidades para crecer en
        toda Nicaragua.
      </p>

      <div class="hero__actions">
        <a href="/auth" class="hero__btn hero__btn--primary">
          Explorar empleos <span aria-hidden="true">&rarr;</span>
        </a>
        <a href="/auth" class="hero__btn hero__btn--secondary">
          Publicar una oferta <span aria-hidden="true">&nearr;</span>
        </a>
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
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  align-items: center;
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
}

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
  min-height: 400px;
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
  z-index: 3;
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
  min-height: 560px;
  padding: 4.5rem 0;
}

.hero__copy {
  position: relative;
  z-index: 3;
  width: min(1600px, 100%);
  margin-inline: auto;
  padding-inline: clamp(24px, 4vw, 64px);
}

.hero__visual {
  position: absolute;
  inset: 0 0 0 auto;
  z-index: 1;
  width: 72%;
}

.hero__visual-fade {
  inset: 0;
  width: auto;
  background: linear-gradient(90deg, var(--background) 0%, color-mix(in oklab, var(--background) 92%, transparent) 23%, transparent 80%);
}

.hero__image-wrap { height: 100%; min-height: 0; border-radius: 0; }
.hero__img { position: absolute; inset: 0; }
.hero__float-tag { right: max(24px, calc((100vw - 1240px) / 2 + 24px)); left: auto; bottom: 2rem; }
.hero__title { max-width: 13ch; font-size: clamp(3.25rem, 5vw, 4.5rem); }
.hero__lede { max-width: 440px; font-size: 1.2rem; }
.hero__kicker { font-size: 0.86rem; }
.hero__btn { padding: 0.95rem 1.55rem; font-size: 1rem; }
.hero__location { font-size: 0.92rem; }

@media (max-width: 800px) {
  .hero { min-height: 640px; padding: 3rem 0 2.5rem; }
  .hero__copy { align-self: flex-end; padding-inline: 20px; }
  .hero__title { font-size: clamp(2.3rem, 7vw, 3rem); }
  .hero__visual { display: flex; order: initial; width: 100%; max-height: none; opacity: 0.42; }
  .hero__visual-fade { display: block; background: linear-gradient(180deg, color-mix(in oklab, var(--background) 12%, transparent) 0%, var(--background) 88%); }
  .hero__image-wrap { min-height: 100%; }
  .hero__float-tag { display: none; }
}
</style>
