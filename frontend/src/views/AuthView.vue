<script setup lang="ts">
import AuthStoryPanel from '@/components/auth/AuthStoryPanel.vue'
import AuthFormPanel from '@/components/auth/AuthFormPanel.vue'
import AppBrand from '@/components/ui/AppBrand.vue'
import { useTheme } from '@/composables/useTheme'
import { ArrowLeft, Sun, Moon } from '@lucide/vue'

const { theme, toggleTheme } = useTheme()
function chooseTheme(value: 'light' | 'dark') {
  if (theme.value !== value) toggleTheme()
}
</script>

<template>
  <div class="auth-view">
    <!-- Mobile-only compact header -->
    <header class="auth-mobile-header">
      <a href="/" class="auth-mobile-brand" aria-label="Jinowork — volver al inicio">
        <ArrowLeft :size="16" aria-hidden="true" />
        <AppBrand variant="mark" />
        <span class="auth-mobile-brand__name">Volver a Jinowork</span>
      </a>
      <div class="theme-switch" role="group" aria-label="Tema de color">
        <button type="button" :aria-pressed="theme === 'dark'" aria-label="Modo oscuro" @click="chooseTheme('dark')">
          <Moon :size="18" aria-hidden="true" />
        </button>
        <button type="button" :aria-pressed="theme === 'light'" aria-label="Modo claro" @click="chooseTheme('light')">
          <Sun :size="18" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div class="auth-layout">
      <div class="theme-switch auth-theme-toggle" role="group" aria-label="Tema de color">
        <button type="button" :aria-pressed="theme === 'dark'" aria-label="Modo oscuro" @click="chooseTheme('dark')">
          <Moon :size="18" aria-hidden="true" />
        </button>
        <button type="button" :aria-pressed="theme === 'light'" aria-label="Modo claro" @click="chooseTheme('light')">
          <Sun :size="18" aria-hidden="true" />
        </button>
      </div>

      <!-- Story panel (desktop only) -->
      <AuthStoryPanel class="auth-story" />

      <!-- Form panel -->
      <AuthFormPanel />
    </div>
  </div>
</template>

<style scoped>
.auth-view {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--background);
  overflow: hidden;
  position: relative;
}

/* Mobile header: brand + theme toggle */
.auth-mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.theme-switch {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
}

.theme-switch button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 2.7rem;
  padding: 0;
  color: var(--muted-foreground);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease;
}

.theme-switch button + button { border-left: 1px solid var(--border); }
.theme-switch button[aria-pressed='true'] { color: var(--primary); background: var(--secondary); }
.theme-switch button:focus-visible { outline: 2px solid var(--primary); outline-offset: -3px; }

.auth-theme-toggle {
  display: none;
}

.auth-mobile-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}

.auth-mobile-brand__name {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--foreground);
  letter-spacing: -0.03em;
}

.auth-mobile-brand__dot {
  color: var(--primary);
}

/* Two-panel layout */
.auth-layout {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 100vh;
  min-height: 100dvh;
}

.auth-story {
  position: absolute;
  inset: 0 auto 0 0;
  width: 50%;
  max-width: none;
}

.auth-layout :deep(.auth-form-panel) {
  flex: 0 0 50%;
  margin-left: auto;
  min-width: 0;
}

@media (min-width: 761px) {
  .auth-theme-toggle {
    display: inline-flex;
    position: absolute;
    top: 1.25rem;
    right: 1.5rem;
    z-index: 4;
  }
}

/* Responsive */
@media (max-width: 760px) {
  .auth-view {
    overflow: auto;
  }

  .auth-mobile-header {
    display: flex;
    position: relative;
    z-index: 4;
    padding: 0.5rem 1rem;
    background: var(--background);
  }

  .auth-mobile-header .theme-switch button { width: 2.6rem; height: 2.3rem; }

  .auth-theme-toggle { display: none; }

  .auth-story :deep(.story-panel__back),
  .auth-story :deep(.story-panel__brand),
  .auth-story :deep(.story-panel__text) {
    display: none;
  }

  .auth-layout {
    min-height: calc(100dvh - 4.5rem);
  }

  .auth-layout :deep(.auth-form-panel) {
    flex: 1;
    padding: 1rem clamp(1rem, 6vw, 2rem);
    background: color-mix(in srgb, var(--background) 93%, transparent);
  }
}

@media (max-width: 560px) {
  .auth-layout :deep(.auth-form-panel__content) { gap: 0.75rem; }
}

@media (min-width: 761px) and (max-width: 1100px) {
  .auth-story {
    width: 46%;
  }
}
</style>
