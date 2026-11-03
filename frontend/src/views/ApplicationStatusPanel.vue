<script setup lang="ts">
import { ArrowRight, Undo2 } from 'lucide-vue-next'
import type { AppRow } from './applicationStatus'

defineProps<{ application: AppRow; busy: boolean }>()
const emit = defineEmits<{ advance: []; reject: []; undo: []; open: [] }>()
</script>

<template>
  <section class="application-status" :class="`tone-${application._statusTone}`">
    <div class="application-status__heading">
      <span>Estado actual</span>
      <strong class="application-status__badge"><i aria-hidden="true"></i>{{ application._statusLabel }}</strong>
    </div>
    <p>{{ application._statusDescription }}</p>
    <div class="application-status__actions">
      <button v-if="application._nextStatus" class="application-status__primary" type="button" :disabled="busy" @click="emit('advance')">
        {{ busy ? 'Guardando…' : application._nextLabel }}<ArrowRight :size="17" aria-hidden="true" />
      </button>
      <button v-if="application._effectiveStatus === 'IN_REVIEW' || application._effectiveStatus === 'SHORTLISTED'" class="application-status__reject" type="button" :disabled="busy" @click="emit('reject')">Rechazar candidatura</button>
      <button v-else-if="application._effectiveStatus === 'INTERVIEW'" class="application-status__reject" type="button" :disabled="busy" @click="emit('reject')">No aceptar</button>
      <div class="application-status__links">
        <button type="button" @click="emit('open')">Ver perfil <ArrowRight :size="15" aria-hidden="true" /></button>
        <button v-if="application._canUndo" class="application-status__undo" type="button" :disabled="busy" @click="emit('undo')"><Undo2 :size="15" aria-hidden="true" />{{ busy ? 'Deshaciendo…' : 'Deshacer' }}</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.application-status{--status-ink:var(--status-neutral-ink);--status-soft:var(--status-neutral-soft);display:grid;gap:.65rem;min-width:0;padding:.9rem 1rem;border:0;border-radius:.85rem;background:var(--panel)}
.application-status.tone-progress{--status-ink:var(--status-progress-ink);--status-soft:var(--status-progress-soft)}
.application-status.tone-success{--status-ink:var(--status-success-ink);--status-soft:var(--status-success-soft)}
.application-status.tone-danger{--status-ink:var(--status-danger-ink);--status-soft:var(--status-danger-soft)}
.application-status__heading{display:flex;align-items:center;justify-content:space-between;gap:.75rem}
.application-status__heading>span{color:var(--muted-foreground);font-size:.75rem;font-weight:700}
.application-status__badge{display:inline-flex;align-items:center;gap:.5rem;padding:.25rem 0;border-radius:0;background:transparent;color:var(--status-ink);font-size:.78rem;font-weight:800}
.application-status__badge i{width:.48rem;height:.48rem;flex:none;border-radius:50%;background:currentColor}
.application-status>p{margin:0;color:var(--foreground);font-size:.78rem;line-height:1.5}
.application-status__actions{display:grid;gap:.5rem;padding-top:.4rem}
.application-status__actions button{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;min-height:2.35rem;padding:.35rem .5rem;border:0;border-radius:.45rem;background:transparent;color:var(--primary);font:750 .78rem Manrope,sans-serif;cursor:pointer}
.application-status__actions button:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.application-status__primary{justify-content:space-between!important;width:100%;padding:.65rem .8rem!important;border-radius:.6rem!important;background:var(--primary)!important;color:#fff!important}
.application-status__primary:hover:not(:disabled){background:color-mix(in srgb,var(--primary) 88%,var(--palette-ink))!important}
.application-status__reject{justify-content:flex-start!important;width:100%;min-height:2rem!important;padding:.3rem 0!important;border-radius:0!important;background:transparent!important;color:var(--status-danger-ink)!important;text-align:left}
.application-status__links{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.35rem 1rem}
.application-status__links button{min-height:2rem!important;padding:.25rem 0!important;color:var(--primary)!important}
.application-status__links .application-status__undo{color:var(--muted-foreground)!important}
.application-status__actions button:disabled{opacity:.55;cursor:wait}

</style>
