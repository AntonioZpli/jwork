<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBrand from '@/components/ui/AppBrand.vue'
import SiteMobileMenu from './SiteMobileMenu.vue'
import { useEscapeKey } from '@/composables/useEscapeKey'
import { Menu, X } from '@lucide/vue'

const router = useRouter()

const menuOpen = ref(false)

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Buscar empleo', href: '#empleos' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Empresas', href: '#empresas' },
]

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

useEscapeKey(() => {
  if (menuOpen.value) closeMenu()
})

// Close menu on route change
router.afterEach(() => {
  closeMenu()
})
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner container">
      <nav class="site-nav" aria-label="Navegación principal">
        <!-- Brand -->
        <a href="#inicio" class="site-nav__brand" aria-label="Jinowork — ir al inicio" @click="closeMenu">
          <AppBrand variant="full" />
        </a>

        <!-- Desktop links -->
        <ul class="site-nav__links" role="list">
          <li v-for="item in navItems" :key="item.href">
            <a :href="item.href" class="site-nav__link">{{ item.label }}</a>
          </li>
        </ul>

        <!-- Desktop actions -->
        <div class="site-nav__actions">
          <a href="/auth" class="site-nav__account-link">Iniciar sesión</a>
          <a href="/auth" class="site-nav__register-btn">Regístrate ↗</a>
        </div>

        <!-- Mobile toggle -->
        <button
          type="button"
          class="site-nav__toggle"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="menuOpen ? 'Cerrar menú' : 'Abrir menú'"
          @click="toggleMenu"
        >
          <X v-if="menuOpen" :size="20" />
          <Menu v-else :size="20" />
        </button>
      </nav>

      <SiteMobileMenu
        :items="navItems"
        :open="menuOpen"
        @close="closeMenu"
      />
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 68px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.site-header__inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

/* Brand */
.site-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  flex-shrink: 0;
}

.site-nav__brand-name {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.28rem;
  color: var(--foreground);
  letter-spacing: -0.03em;
}

.site-nav__brand-dot {
  color: var(--primary);
}

/* Desktop nav links */
.site-nav__links {
  display: flex;
  align-items: center;
  gap: clamp(1rem, 2vw, 1.75rem);
  flex: 1;
  justify-content: center;
  list-style: none;
  margin: 0;
  padding: 0;
}

.site-nav__link {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--muted-foreground);
  text-decoration: none;
  transition: color 0.18s ease;
}

.site-nav__link:hover {
  color: var(--foreground);
}

.site-nav__link:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: 2px;
}

/* Desktop actions */
.site-nav__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.site-nav__account-link {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-decoration: none;
  transition: color 0.18s ease;
}

.site-nav__account-link:hover {
  color: var(--foreground);
}

.site-nav__account-link:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: 2px;
}

.site-nav__register-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 1.1rem;
  background: var(--primary);
  color: #fff;
  font-size: 0.96rem;
  font-weight: 700;
  border-radius: 6px;
  text-decoration: none;
  transition:
    background-color 0.18s ease,
    transform 0.18s ease;
}

.site-nav__register-btn:hover {
  background: oklch(from var(--primary) calc(l - 0.05) c h);
  transform: translateY(-1px);
}

.site-nav__register-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

/* Mobile toggle */
.site-nav__toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  color: var(--foreground);
  transition: background-color 0.18s ease;
}

.site-nav__toggle:hover {
  background: var(--panel);
}

.site-nav__toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

/* Container */
.container {
  width: min(1600px, 100%);
  padding-inline: clamp(24px, 4vw, 64px);
  margin-inline: auto;
}

/* Responsive */
@media (max-width: 800px) {
  .site-nav__links,
  .site-nav__actions {
    display: none;
  }

  .site-nav__toggle {
    display: inline-flex;
  }

  .site-header {
    height: auto;
    min-height: 64px;
  }

  .site-header__inner {
    height: auto;
    padding-block: 0.75rem;
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
  .site-nav__link,
  .site-nav__register-btn,
  .site-nav__toggle {
    transition: none;
  }
}
</style>
