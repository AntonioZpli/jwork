<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import FeaturedJobs from '@/components/landing/FeaturedJobs.vue'
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue'
import CompaniesSection from '@/components/landing/CompaniesSection.vue'
import FinalCallToAction from '@/components/landing/FinalCallToAction.vue'
gsap.registerPlugin(ScrollTrigger)

const landingRoot = ref<HTMLElement | null>(null)
let landingContext: gsap.Context | undefined
let landingMotion: gsap.MatchMedia | undefined

onMounted(() => {
  if (!landingRoot.value) return

  landingContext = gsap.context(() => {
    landingMotion = gsap.matchMedia()
    landingMotion.add('(prefers-reduced-motion: no-preference)', () => {
      const root = landingRoot.value
      if (!root) return

      const hero = root.querySelector('.hero')
      const heroCopy = hero?.querySelectorAll('.hero__kicker, .hero__title, .hero__lede, .hero__actions, .hero__location')
      const heroImage = hero?.querySelector('.hero__img')
      const heroTag = hero?.querySelector('.hero__float-tag')

      if (heroCopy?.length) {
        gsap.fromTo(heroCopy, { autoAlpha: 0, y: 18 }, {
          autoAlpha: 1, y: 0, duration: .68, stagger: .1, ease: 'power2.out',
        })
      }
      if (heroImage) {
        gsap.fromTo(heroImage, { scale: 1.035 }, { scale: 1, duration: 1.15, ease: 'power2.out' })
        gsap.to(heroImage, {
          yPercent: 4,
          ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .7 },
        })
      }
      if (heroTag) gsap.fromTo(heroTag, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .55, delay: .4, ease: 'power2.out' })

      const revealGroup = (containerSelector: string, itemSelector: string, options: { x?: number; y?: number; stagger?: number } = {}) => {
        root.querySelectorAll<HTMLElement>(containerSelector).forEach((container) => {
          const items = gsap.utils.toArray<HTMLElement>(itemSelector, container)
          if (!items.length) return
          gsap.fromTo(items, { autoAlpha: 0, x: options.x ?? 0, y: options.y ?? 16 }, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: .62,
            stagger: options.stagger ?? .08,
            ease: 'power2.out',
            scrollTrigger: { trigger: container, start: 'top 86%', once: true },
          })
        })
      }

      revealGroup('.featured-jobs', '.featured-jobs__header, .featured-jobs__disclaimer, .featured-jobs__grid > li', { y: 18, stagger: .09 })
      revealGroup('.how-it-works__intro', '.hiw-kicker, .hiw-title, .hiw-desc, .hiw-origin', { x: -14, stagger: .1 })
      revealGroup('.hiw-journey', '.hiw-journey__eyebrow, .hiw-journey__title, .hiw-step, .hiw-action', { y: 13, stagger: .075 })
      revealGroup('.companies__visual', '.companies__img', { x: -18 })
      revealGroup('.companies__copy', '.companies__kicker, .companies__title, .companies__desc, .companies__benefit, .companies__cta', { x: 14, stagger: .085 })
      revealGroup('.final-cta', '.final-cta__kicker, .final-cta__title, .final-cta__action, .final-cta__credit', { y: 14, stagger: .09 })
    })
  }, landingRoot.value)
})

onBeforeUnmount(() => {
  landingMotion?.revert()
  landingContext?.revert()
})
</script>

<template>
  <div ref="landingRoot" class="landing-view">
    <SiteHeader />
    <main>
      <div class="container">
        <HeroSection />
        <FeaturedJobs />
        <HowItWorksSection />
        <CompaniesSection />
        <FinalCallToAction />
      </div>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.landing-view { min-height: 100vh; background: var(--background); }
.container { width: min(1600px, 100%); padding-inline: clamp(24px, 4vw, 64px); margin-inline: auto; }
@media (max-width: 560px) { .container { padding-inline: 20px; } }
</style>
