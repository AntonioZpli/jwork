<script setup lang="ts">
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import FeaturedJobs from '@/components/landing/FeaturedJobs.vue'
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue'
import CompaniesSection from '@/components/landing/CompaniesSection.vue'
import FinalCallToAction from '@/components/landing/FinalCallToAction.vue'
import { useTheme } from '@/composables/useTheme'

useTheme()
</script>

<template>
  <div class="landing-view">
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
