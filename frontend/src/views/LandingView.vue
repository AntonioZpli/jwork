<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import JobSearchBar from '@/components/landing/JobSearchBar.vue'
import FeaturedJobs from '@/components/landing/FeaturedJobs.vue'
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue'
import CompaniesSection from '@/components/landing/CompaniesSection.vue'
import FinalCallToAction from '@/components/landing/FinalCallToAction.vue'
import { useTheme } from '@/composables/useTheme'

useTheme()

gsap.registerPlugin(ScrollTrigger)

let landingContext: gsap.Context | undefined
let landingMedia: gsap.MatchMedia | undefined

onMounted(() => {
  landingContext = gsap.context(() => {
    landingMedia = gsap.matchMedia()
    landingMedia.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = gsap.timeline({ defaults: { ease: 'power2.out' } })

      intro.fromTo(
        '.hero__copy > :not(.hero__title)',
        { autoAlpha: 0, y: 9 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 },
      )
      intro.fromTo(
        '.hero__title',
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' },
        0.12,
      )
      intro.fromTo('.hero__img', { scale: 1.035 }, { scale: 1, duration: 1.25 }, 0)
      intro.fromTo(
        '.hero__float-tag',
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.5 },
        0.45,
      )
      intro.fromTo(
        '.hero__keyword',
        { yPercent: 108, filter: 'blur(3px)' },
        { yPercent: 0, filter: 'blur(0px)', duration: 1.05, stagger: 0.2, ease: 'power3.out' },
        0.24,
      )
      intro.fromTo(
        '.hero__kicker-dot',
        { scale: 0.65, autoAlpha: 0.6 },
        { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)' },
        0.3,
      )

      gsap.to('.hero__img', {
        yPercent: 7,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        },
      })
      gsap.to('.hero__float-tag', {
        y: -5,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1,
      })

      const reveal = (selector: string, stagger = 0) => {
        gsap.fromTo(
          selector,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.78,
            stagger,
            ease: 'power2.out',
            scrollTrigger: { trigger: selector, start: 'top 88%', once: true },
          },
        )
      }

      reveal('.featured-jobs__header')
      reveal('.featured-jobs__disclaimer')
      reveal('.featured-jobs__grid > li', 0.08)
      reveal('.how-it-works__intro')
      reveal('.hiw-journey', 0.12)
      reveal('.companies__visual')
      reveal('.companies__copy')
      reveal('.final-cta__inner')
    })
  })
})

onBeforeUnmount(() => {
  landingMedia?.revert()
  landingContext?.revert()
})
</script>

<template>
  <div class="landing-view">
    <SiteHeader />
    <main>
      <div class="container">
        <HeroSection />
        <JobSearchBar />
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
.container { width: min(1240px, 100%); padding-inline: 48px; margin-inline: auto; }
@media (max-width: 560px) { .container { padding-inline: 22px; } }
@media (min-width: 561px) and (max-width: 1100px) { .container { padding-inline: 32px; } }
</style>
