<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import AuthStoryPanel from '@/components/auth/AuthStoryPanel.vue'
import AuthFormPanel from '@/components/auth/AuthFormPanel.vue'
import { ArrowLeft } from '@lucide/vue'

const authViewRef = ref<HTMLElement | null>(null)
let authMotion: gsap.MatchMedia | undefined
let authContext: gsap.Context | undefined

onMounted(() => {
  const root = authViewRef.value
  if (!root) return
  authContext = gsap.context(() => {
    authMotion = gsap.matchMedia()
    authMotion.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = gsap.timeline({ defaults: { ease: 'power2.out' } })

      intro.fromTo('.story-panel__brand',
        { autoAlpha: 0, y: -10 },
        { autoAlpha: 1, y: 0, duration: 0.55 },
      )
      intro.fromTo('.story-panel__text > *',
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.1 },
        0.22,
      )
      intro.fromTo('.auth-form-panel__content > *',
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.075 },
        0.18,
      )
    }, root)
  }, root)
})

onBeforeUnmount(() => {
  authMotion?.revert()
  authContext?.revert()
})
</script>

<template>
  <div ref="authViewRef" class="auth-view">
    <!-- Mobile-only compact header -->
    <header class="auth-mobile-header">
      <a href="/" class="auth-mobile-brand" aria-label="Jinowork — volver al inicio">
        <ArrowLeft :size="16" aria-hidden="true" />
        <img src="/images/brand/jinowork-icon.svg" alt="" aria-hidden="true" class="auth-mobile-brand__icon">
        <span class="auth-mobile-brand__name">Volver a Jinowork</span>
      </a>
    </header>

    <div class="auth-layout">

      <!-- Story panel (desktop only) -->
      <AuthStoryPanel class="auth-story" />

      <!-- Form panel -->
      <AuthFormPanel />
    </div>
  </div>
</template>

<style scoped>
.auth-view {
  --palette-ink: #14302a;
  --palette-violet: #c8553d;
  --palette-blue: #8fb0a8;
  --palette-ice: #f6eae4;
  --palette-platinum: #5f6f6b;
  --background: #fcf8f5;
  --surface: #fffdfb;
  --foreground: #16302b;
  --primary: #2f5d50;
  --secondary: #f6eae4;
  --muted-foreground: #5f6f6b;
  --border: #e3cfc1;
  --panel: #f6eae4;
  --surface-strong: #f6eae4;
  --accent-strong: #f6eae4;
  --shadow: rgb(20 48 42 / 9%);
  color: var(--foreground);
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

.auth-mobile-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}
.auth-mobile-brand__icon { display:block; width:1.5rem; height:1.5rem; object-fit:contain; }

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
  z-index: 2;
  inset: 0 auto 0 0;
  width: 58%;
  max-width: none;
  overflow: visible;
}

.auth-layout :deep(.auth-form-panel) {
  position: relative;
  z-index: 1;
  flex: 0 0 42%;
  margin-left: auto;
  min-width: 0;
  background:
    url('/assets/jinowork-svgs-mejorados/right/12-ondas-claras.svg') center bottom / 100% auto no-repeat,
    url('/assets/jinowork-svgs-mejorados/right/13-orbitas-claras.svg') center / 100% 100% no-repeat,
    url('/assets/jinowork-svgs-mejorados/right/10-contornos-claros.svg') center / 100% 100% no-repeat,
    url('/assets/jinowork-svgs-mejorados/right/11-brillo-rosado.svg') center / 100% 100% no-repeat,
    var(--background);
}

/* Responsive */
@media (max-width: 760px) {
  .auth-view {
    overflow: auto;
  }

  .auth-story {
    display: none;
  }

  .auth-mobile-header {
    display: flex;
    position: relative;
    z-index: 4;
    padding: 0.5rem 1rem;
    background: var(--background);
  }

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
    border: 0;
    border-radius: 0;
    background: var(--background);
  }
}

@media (max-width: 560px) {
  .auth-layout :deep(.auth-form-panel__content) { gap: 0.75rem; }
}

@media (min-width: 761px) and (max-width: 1100px) {
  .auth-story {
    width: 50%;
  }
  .auth-layout :deep(.auth-form-panel) { flex-basis: 50%; }
}
</style>
