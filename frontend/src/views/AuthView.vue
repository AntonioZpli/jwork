<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import AuthStoryPanel from '@/components/auth/AuthStoryPanel.vue'
import AuthFormPanel from '@/components/auth/AuthFormPanel.vue'
import AppBrand from '@/components/ui/AppBrand.vue'
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
      intro.fromTo('.story-panel__map iframe',
        { autoAlpha: 0, scale: 0.97 },
        { autoAlpha: 1, scale: 1, duration: 1.15 },
        0.12,
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
        <AppBrand variant="mark" />
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
  z-index: 0;
  inset: 0 auto 0 0;
  width: 50%;
  max-width: none;
  overflow: visible;
}

.auth-layout :deep(.auth-form-panel) {
  position: relative;
  z-index: 1;
  flex: 0 0 50%;
  margin-left: auto;
  min-width: 0;
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
    width: 50%;
  }
  .auth-layout :deep(.auth-form-panel) { flex-basis: 50%; }
}
</style>
