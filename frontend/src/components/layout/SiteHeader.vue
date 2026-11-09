<script setup lang="ts">
import AppBrand from '@/components/ui/AppBrand.vue'
import { BriefcaseBusiness, Building2, CircleHelp, House, LogIn, UserPlus } from '@lucide/vue'

const navItems = [
  { label: 'Inicio', href: '#inicio', icon: House },
  { label: 'Buscar empleo', href: '#empleos', icon: BriefcaseBusiness },
  { label: 'Cómo funciona', href: '#como-funciona', icon: CircleHelp },
  { label: 'Empresas', href: '#empresas', icon: Building2 },
]
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner container">
      <nav class="site-nav" aria-label="Navegación principal">
        <!-- Brand -->
        <a href="#inicio" class="site-nav__brand" aria-label="Jinowork — ir al inicio">
          <AppBrand variant="full" />
        </a>

        <!-- Desktop links -->
        <ul class="site-nav__links" role="list">
          <li v-for="item in navItems" :key="item.href">
            <a :href="item.href" class="site-nav__link">
              <component :is="item.icon" :size="17" :stroke-width="2" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </a>
          </li>
        </ul>

        <!-- Desktop actions -->
        <div class="site-nav__actions">
          <span class="site-nav__divider" aria-hidden="true" />
          <a href="/auth" class="site-nav__account-link" aria-label="Iniciar sesión">
            <LogIn :size="17" :stroke-width="2" aria-hidden="true" />
            <span>Iniciar sesión</span>
          </a>
          <a href="/auth" class="site-nav__register-btn" aria-label="Regístrate">
            <UserPlus :size="17" :stroke-width="2.2" aria-hidden="true" />
            <span>Regístrate</span>
          </a>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* Colores y forma de la barra: ajustalos aquí */
.site-header {
  --nav-bg: rgb(247 237 230 / 92%);
  --nav-border: rgb(227 207 193 / 85%);
  --nav-text: #16302b;
  --nav-muted: #5f6f6b;
  --nav-accent: #b5483a;
  --nav-accent-dark: #9a3a2d;
  --nav-radius: 999px; /* poné 0 si querés la barra recta */

  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 40;
  height: auto;
  padding: 14px 0 0;
  background: transparent;
  border-bottom: 0;
  pointer-events: none;
}

.site-header__inner {
  pointer-events: none;
}

/* Barra flotante */
.site-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  min-height: 60px;
  padding: 0.5rem 0.5rem 0.5rem 1.35rem;
  border: 1px solid var(--nav-border);
  border-radius: var(--nav-radius);
  background: var(--nav-bg);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 70%) inset,
    0 14px 34px rgb(15 36 32 / 18%);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  pointer-events: auto;
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
}

.site-nav:hover {
  border-color: rgb(181 72 58 / 28%);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 70%) inset,
    0 18px 40px rgb(15 36 32 / 24%);
}

/* Brand */
.site-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  flex-shrink: 0;
}

/* Desktop nav links */
.site-nav__links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  justify-content: center;
  list-style: none;
  margin: 0;
  padding: 0;
}

.site-nav__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0 1rem;
  border-radius: var(--nav-radius);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: var(--nav-muted);
  text-decoration: none;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.site-nav__link svg,
.site-nav__account-link svg {
  flex-shrink: 0;
  transition: color 0.2s ease, transform 0.25s ease;
}

.site-nav__link:hover {
  color: var(--nav-text);
  background: rgb(22 48 43 / 7%);
}

.site-nav__link:hover svg {
  color: var(--nav-accent);
  transform: translateY(-1px) scale(1.08);
}

.site-nav__link:focus-visible {
  outline: 2px solid var(--nav-accent);
  outline-offset: 2px;
}

/* Desktop actions */
.site-nav__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.site-nav__divider {
  width: 1px;
  height: 22px;
  margin-right: 0.35rem;
  background: var(--nav-border);
}

.site-nav__account-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0 1rem;
  border-radius: var(--nav-radius);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--nav-text);
  text-decoration: none;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.site-nav__account-link:hover {
  color: var(--nav-accent);
  background: rgb(181 72 58 / 9%);
}

.site-nav__account-link:hover svg {
  transform: translateX(2px);
}

.site-nav__account-link:focus-visible {
  outline: 2px solid var(--nav-accent);
  outline-offset: 2px;
}

/* Botón principal */
.site-nav__register-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 42px;
  padding: 0 1.3rem;
  background: linear-gradient(135deg, #c4503f, var(--nav-accent));
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
  border-radius: var(--nav-radius);
  text-decoration: none;
  box-shadow:
    0 1px 0 rgb(255 255 255 / 22%) inset,
    0 8px 18px rgb(181 72 58 / 32%);
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.site-nav__register-btn:hover {
  background: linear-gradient(135deg, #b84636, var(--nav-accent-dark));
  box-shadow:
    0 1px 0 rgb(255 255 255 / 22%) inset,
    0 12px 24px rgb(181 72 58 / 40%);
  transform: translateY(-1px);
}

.site-nav__register-btn:active {
  transform: translateY(0);
}

.site-nav__register-btn:focus-visible {
  outline: 2px solid var(--nav-text);
  outline-offset: 3px;
}

/* Container */
.container {
  width: min(1600px, 100%);
  padding-inline: clamp(24px, 4vw, 64px);
  margin-inline: auto;
}

/* Responsive */
@media (max-width: 1000px) {
  .site-nav {
    gap: 1rem;
  }

  .site-nav__link {
    padding: 0 0.75rem;
  }

  .site-nav__divider {
    display: none;
  }
}

/* Móvil: solo iconos, en círculos */
@media (max-width: 800px) {
  .site-header {
    padding: 10px 0 0;
  }

  .site-header__inner {
    padding-inline: 20px;
  }

  .site-nav {
    min-height: 56px;
    gap: 0.25rem;
    padding: 0.35rem 0.4rem 0.35rem 0.9rem;
  }

  .site-nav__brand {
    margin-right: auto;
  }

  .site-nav__links,
  .site-nav__actions {
    gap: 0.15rem;
  }

  .site-nav__divider {
    display: none;
  }

  .site-nav__link,
  .site-nav__account-link,
  .site-nav__register-btn {
    justify-content: center;
    width: 2.5rem;
    min-height: 2.5rem;
    padding: 0;
    border-radius: 50%;
  }

  .site-nav__register-btn {
    margin-left: 0.2rem;
  }

  .site-nav__link span,
  .site-nav__account-link span,
  .site-nav__register-btn span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
}

@media (max-width: 560px) {
  .container {
    padding-inline: 20px;
  }
}

@media (min-width: 801px) and (max-width: 1100px) {
  .container {
    padding-inline: 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-nav,
  .site-nav__link,
  .site-nav__link svg,
  .site-nav__account-link,
  .site-nav__account-link svg,
  .site-nav__register-btn {
    transition: none;
  }
}
</style>