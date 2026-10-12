<script setup lang="ts">
import type { Job } from '@/types/job'
import { MapPin, ArrowRight } from '@lucide/vue'

defineProps<{ job: Job }>()

// Avatar variant maps to Orchid token combinations
const AVATAR_CLASSES: Record<Job['avatarVariant'], string> = {
  violet: 'avatar--violet',
  deep: 'avatar--deep',
  soft: 'avatar--soft',
  muted: 'avatar--muted',
}
</script>

<template>
  <article class="job-card" :aria-label="`${job.title} en ${job.company}`">
    <div class="job-card__top">
      <!-- Company avatar -->
      <div :class="['avatar', AVATAR_CLASSES[job.avatarVariant]]" aria-hidden="true">
        {{ job.initials }}
      </div>
      <div class="job-card__company-info">
        <span class="job-card__company-name">{{ job.company }}</span>
        <span class="job-card__category">{{ job.category }}</span>
      </div>
    </div>

    <h3 class="job-card__title">{{ job.title }}</h3>

    <ul class="job-card__meta" aria-label="Detalles del puesto">
      <li class="job-card__meta-item">
        <MapPin :size="12" aria-hidden="true" />
        {{ job.location }}
      </li>
      <li class="job-card__meta-item job-card__meta-item--chip">{{ job.modality }}</li>
      <li class="job-card__meta-item job-card__meta-item--chip">{{ job.contract }}</li>
    </ul>

    <a href="/auth" class="job-card__link" :aria-label="`Ver oferta: ${job.title} en ${job.company}`">
      Ver oferta <ArrowRight :size="13" aria-hidden="true" />
    </a>
  </article>
</template>

<style scoped>
.job-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
  cursor: default;
}

.job-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px oklch(from var(--primary) l c h / 0.1);
}

.job-card:focus-within {
  border-color: var(--primary);
}

/* Company row */
.job-card__top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.job-card__company-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.job-card__company-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.job-card__category {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Avatar */
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.avatar--violet {
  background: var(--secondary);
  color: var(--primary);
}

.avatar--deep {
  background: oklch(from var(--primary) calc(l - 0.18) c h);
  color: oklch(from var(--primary) calc(l + 0.35) calc(c * 0.4) h);
}

.avatar--soft {
  background: oklch(from var(--secondary) calc(l - 0.03) calc(c * 0.5) h);
  color: oklch(from var(--primary) l c h);
}

.avatar--muted {
  background: var(--panel);
  color: var(--muted-foreground);
}

/* Title */
.job-card__title {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--foreground);
  line-height: 1.3;
}

/* Meta */
.job-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.6rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.job-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.88rem;
  color: var(--muted-foreground);
}

.job-card__meta-item--chip {
  padding: 0.2rem 0.55rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 99px;
  color: var(--muted-foreground);
  font-size: 0.8rem;
  font-weight: 600;
}

/* Link */
.job-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: auto;
  padding: 0;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary);
  cursor: pointer;
  transition: gap 0.18s ease;
}

.job-card__link:hover {
  gap: 0.55rem;
}

.job-card__link:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .job-card,
  .job-card__link {
    transition: none;
  }
}
</style>
