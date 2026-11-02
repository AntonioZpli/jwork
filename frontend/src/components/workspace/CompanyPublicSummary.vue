<script setup lang="ts">
import { ExternalLink, MapPin } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

defineProps<{
  company: {
    id?: string
    name: string
    description?: string | null
    website?: string | null
    economicSector?: { name: string } | null
    department?: { name: string } | null
    municipality?: { name: string } | null
  }
}>()
</script>

<template>
  <section class="company-public-summary workspace__card" aria-labelledby="company-public-summary-title">
    <div class="company-public-summary__identity">
      <span class="company-public-summary__mark" aria-hidden="true">{{ company.name.slice(0, 2).toUpperCase() }}</span>
      <div><span class="company-public-summary__eyebrow">Perfil público</span><h2 id="company-public-summary-title">{{ company.name }}</h2></div>
    </div>
    <p v-if="company.description" class="company-public-summary__description">{{ company.description }}</p>
    <p v-else class="company-public-summary__empty">La empresa aún no ha añadido una presentación.</p>
    <div class="company-public-summary__details">
      <span v-if="company.economicSector">{{ company.economicSector.name }}</span>
      <span v-if="company.department || company.municipality"><MapPin :size="14" aria-hidden="true" />{{ [company.municipality?.name, company.department?.name].filter(Boolean).join(', ') }}</span>
    </div>
    <RouterLink v-if="company.id" class="company-public-summary__profile" :to="`/companies/${company.id}`">Ver perfil de empresa <span aria-hidden="true">→</span></RouterLink>
    <a v-if="company.website" class="company-public-summary__website" :href="company.website" target="_blank" rel="noopener noreferrer">Visitar sitio web <ExternalLink :size="15" aria-hidden="true" /></a>
    <p class="company-public-summary__privacy">Solo se muestra información de presentación de la empresa.</p>
  </section>
</template>

<style scoped>
.company-public-summary{overflow:hidden;padding:1.25rem;background:linear-gradient(145deg,var(--surface),color-mix(in srgb,var(--palette-ice) 38%,var(--surface)))}
.company-public-summary__identity{display:flex;align-items:center;gap:.8rem}
.company-public-summary__mark{display:grid;width:3rem;height:3rem;flex:none;place-items:center;border-radius:.85rem .85rem .85rem .2rem;background:linear-gradient(145deg,var(--palette-ink),#1769c2);color:#fff;font:800 .9rem Manrope,sans-serif}
.company-public-summary__eyebrow{color:var(--muted-foreground);font-size:.63rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
.company-public-summary h2{margin:.16rem 0 0;font:800 1.05rem Manrope,sans-serif;letter-spacing:-.035em}
.company-public-summary__description,.company-public-summary__empty{margin:.9rem 0;color:var(--muted-foreground);font-size:.82rem;line-height:1.65;white-space:pre-line}
.company-public-summary__details{display:flex;flex-wrap:wrap;gap:.5rem}
.company-public-summary__details span{display:inline-flex;align-items:center;gap:.35rem;padding:.35rem .55rem;border-radius:999px;background:var(--secondary);color:var(--primary);font-size:.69rem;font-weight:750}
.company-public-summary__website{display:inline-flex;align-items:center;gap:.4rem;margin-top:1rem;color:var(--primary);font-size:.78rem;font-weight:800}
.company-public-summary__profile{display:inline-flex;align-items:center;gap:.4rem;margin-top:1rem;padding:.55rem .75rem;border:1px solid color-mix(in srgb,var(--primary) 22%,var(--border));border-radius:.6rem;background:var(--surface);color:var(--primary);font-size:.75rem;font-weight:800;transition:background .16s,border-color .16s}
.company-public-summary__profile:hover{border-color:var(--primary);background:var(--secondary)}
.company-public-summary__privacy{margin:.9rem 0 0;padding-top:.65rem;border-top:1px solid var(--border);color:var(--muted-foreground);font-size:.65rem;line-height:1.5}
</style>
