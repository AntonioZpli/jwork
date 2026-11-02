<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; description?: string }>(), { description: '' })
</script>

<template>
  <section class="app-empty-state" aria-live="polite">
    <span class="app-empty-state__icon" aria-hidden="true"><Inbox :size="20" /></span>
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
    <div v-if="$slots.actions" class="app-empty-state__actions"><slot name="actions" /></div>
  </section>
</template>

<style scoped>
.app-empty-state{display:grid;justify-items:center;gap:.45rem;min-width:0;padding:clamp(1.3rem,4vw,2.25rem) 1rem;border:1px dashed var(--border);border-radius:.9rem;background:color-mix(in srgb,var(--surface) 76%,var(--secondary));text-align:center}.app-empty-state__icon{display:grid;width:2.5rem;height:2.5rem;place-items:center;margin-bottom:.15rem;border-radius:.75rem;background:var(--secondary);color:var(--primary)}.app-empty-state h3{margin:0;color:var(--foreground);font-size:.92rem;font-weight:800}.app-empty-state p{max-width:35rem;margin:0;color:var(--muted-foreground);font-size:.79rem;line-height:1.55}.app-empty-state__actions{display:flex;flex-wrap:wrap;justify-content:center;gap:.6rem;margin-top:.45rem}.app-empty-state__actions :deep(a),.app-empty-state__actions :deep(button){padding:0;border:0;background:transparent;color:var(--primary);font:inherit;font-size:.78rem;font-weight:800;text-decoration:none;cursor:pointer}.app-empty-state__actions :deep(a:hover),.app-empty-state__actions :deep(button:hover){text-decoration:underline;text-underline-offset:3px}
</style>
