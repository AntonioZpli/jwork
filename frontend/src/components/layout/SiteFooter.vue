<script setup lang="ts">
import AppBrand from '@/components/ui/AppBrand.vue'
</script>

<template>
  <footer class="site-footer">
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
    </div>

    <div class="site-footer__bottom container">
      <span>© 2026 Jinowork</span>
      <span class="site-footer__origin">Desde Jinotega, para toda Nicaragua.</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 7rem;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.site-footer__grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 2.5rem;
  padding-block: 3.5rem 2rem;
}

.site-footer__brand {
  max-width: 26rem;
}

.site-footer__tagline {
  margin-top: 1rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--foreground);
  line-height: 1.5;
}

.site-footer__sub {
  margin-top: 0.65rem;
  font-size: 0.84rem;
  color: var(--muted-foreground);
  line-height: 1.7;
}

.site-footer__heading {
  margin: 0 0 0.9rem;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted-foreground);
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
  color: var(--muted-foreground);
  text-decoration: none;
  transition: color 0.18s ease;
}

.site-footer__links a:hover {
  color: var(--primary);
}

.site-footer__links a:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: 2px;
}

.site-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1.25rem 2rem;
  border-top: 1px solid var(--border);
  font-size: 0.84rem;
  color: var(--muted-foreground);
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
