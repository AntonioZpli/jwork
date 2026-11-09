<script setup lang="ts">
import AppBrand from '@/components/ui/AppBrand.vue'
import WaveTransition from '@/components/landing/WaveTransition.vue'
</script>

<template>
  <footer class="site-footer">
    <WaveTransition class="site-footer__wave" fill-color="#0F2420" highlight-color="#35615A" placement="footer" />
    <div class="site-footer__grid container">
      <!-- Brand column -->
      <div class="site-footer__brand">
        <AppBrand variant="full" />
        <p class="site-footer__tagline">
          Conectamos talento y oportunidades en un solo lugar.
        </p>
        <p class="site-footer__sub">
          Plataforma creada en Jinotega para acercar talento y oportunidades
          en toda Nicaragua.
        </p>
      </div>

      <!-- Links column 1 -->
      <div class="site-footer__links">
        <h3 class="site-footer__heading">Explorar</h3>
        <nav aria-label="Explorar">
          <ul role="list">
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#empleos">Buscar empleo</a></li>
            <li><a href="#como-funciona">Cómo funciona</a></li>
            <li><a href="#empresas">Para empresas</a></li>
          </ul>
        </nav>
      </div>

      <!-- Links column 2 -->
      <div class="site-footer__links">
        <h3 class="site-footer__heading">Acceso</h3>
        <nav aria-label="Acceso">
          <ul role="list">
            <li><a href="/auth">Iniciar sesión</a></li>
            <li><a href="/auth">Crear cuenta</a></li>
          </ul>
        </nav>
      </div>

      <div class="site-footer__links site-footer__contact">
        <h3 class="site-footer__heading">Contacto</h3>
        <ul role="list">
          <li>
            <a class="site-footer__contact-link" href="https://github.com/AntonioZpli" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.7-1.49-2.47-.28-5.07-1.24-5.07-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.3-2.6 5.23-5.08 5.5.4.35.75 1.03.75 2.08v3.05c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/></svg>
              <span>GitHub</span>
            </a>
          </li>
          <li>
            <a class="site-footer__contact-link" href="mailto:jinoworkteam@gmail.com">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/></svg>
              <span>jinoworkteam@gmail.com</span>
            </a>
          </li>
          <li>
            <a class="site-footer__contact-link" href="tel:+50558541671">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.56 3.57.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.19 2.45.56 3.57a1 1 0 0 1-.25 1.02l-2.19 2.2Z"/></svg>
              <span>+505 5854 1671</span>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div class="site-footer__ornament" aria-hidden="true" />

    <div class="site-footer__bottom container">
      <span>© 2026 Jinowork</span>
      <span class="site-footer__origin">Desde Jinotega, para toda Nicaragua.</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  --footer-green-900: #0f2420;
  --footer-green-800: #16302b;
  --footer-green-700: #234640;
  --footer-green-600: #35615a;
  --footer-green-300: #8fb0a8;
  --footer-cream-50: #fdf9f6;
  --footer-muted: rgb(243 227 219 / 78%);
  --footer-terracotta-500: #d8695a;
  --footer-terracotta-600: #b5483a;
  --foreground: var(--footer-cream-50);
  --primary: var(--footer-terracotta-500);
  position: relative;
  margin-top: 0;
  background: var(--footer-green-900);
  isolation: isolate;
  padding-top: clamp(64px, 8vw, 110px);
}

.site-footer__grid,
.site-footer__bottom { position: relative; z-index: 1; }
.site-footer::before{position:absolute;z-index:0;inset:0;background:url('/assets/jinowork-svgs-mejorados/left/03-ondas-oscuras.svg') center bottom/cover no-repeat,url('/assets/jinowork-svgs-mejorados/left/04-cerros-jinotega.svg') center bottom/cover no-repeat,url('/assets/jinowork-svgs-mejorados/left/01-contornos-oscuros.svg') center/cover no-repeat,url('/assets/jinowork-svgs-mejorados/left/02-resplandor-oscuro.svg') center/cover no-repeat;content:"";pointer-events:none;opacity:.92}
.site-footer__ornament{position:relative;z-index:1;width:min(600px,calc(100% - 40px));height:24px;margin:0 auto 12px;background:url('/assets/jinowork-assets/06-footer/footer-ornament.svg') center/contain no-repeat}

.site-footer__grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.35fr;
  gap: 2.5rem;
  padding-block: 3rem 2rem;
}

.site-footer__brand {
  max-width: 26rem;
}

.site-footer__tagline {
  margin-top: 1rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--footer-cream-50);
  line-height: 1.5;
}

.site-footer__sub {
  margin-top: 0.65rem;
  font-size: 0.84rem;
  color: var(--footer-muted);
  line-height: 1.7;
}

.site-footer__heading {
  margin: 0 0 0.9rem;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--footer-cream-50);
}

.site-footer__links ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.site-footer__links a {
  font-size: 0.9rem;
  color: var(--footer-cream-50);
  text-decoration: none;
  transition: color 0.18s ease;
}

.site-footer__contact-link {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.site-footer__contact-link svg {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  color: var(--footer-green-300);
}

.site-footer__links a:hover {
  color: var(--footer-terracotta-500);
}

.site-footer__links a:focus-visible {
  outline: 2px solid var(--footer-terracotta-500);
  outline-offset: 4px;
  border-radius: 2px;
}

.site-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1.25rem 2rem;
  border-top: 0;
  font-size: 0.84rem;
  color: var(--footer-green-300);
}

.container {
  width: min(1600px, 100%);
  padding-inline: clamp(24px, 4vw, 64px);
  margin-inline: auto;
}

@media (max-width: 800px) {
  .site-footer__grid {
    grid-template-columns: 1fr 1fr;
  }

  .site-footer__brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 560px) {
  .container {
    padding-inline: 20px;
  }

  .site-footer__grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .site-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
}

@media (min-width: 801px) and (max-width: 1100px) {
  .container {
    padding-inline: 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-footer__links a {
    transition: none;
  }
}
</style>
