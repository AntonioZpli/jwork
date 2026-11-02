<script setup lang="ts">
import { AlertTriangle, Pencil, Trash2 } from 'lucide-vue-next'

withDefaults(defineProps<{
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}>(), { confirmLabel: 'Confirmar', danger: false })

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="app-confirm">
      <div class="app-confirm__backdrop" @click.self="emit('cancel')" @keydown.esc.prevent="emit('cancel')">
        <section class="app-confirm" role="alertdialog" aria-modal="true" aria-labelledby="app-confirm-title" aria-describedby="app-confirm-message" tabindex="-1">
          <span class="app-confirm__icon" :class="{ 'app-confirm__icon--danger': danger }">
            <AlertTriangle v-if="danger" :size="21" />
            <Trash2 v-else-if="confirmLabel === 'Eliminar'" :size="21" />
            <Pencil v-else :size="21" />
          </span>
          <h2 id="app-confirm-title">{{ title }}</h2>
          <p id="app-confirm-message">{{ message }}</p>
          <div class="app-confirm__actions">
            <button type="button" class="app-confirm__cancel" @click="emit('cancel')">Cancelar</button>
            <button type="button" class="app-confirm__accept" :class="{ 'app-confirm__accept--danger': danger }" autofocus @click="emit('confirm')">{{ confirmLabel }}</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.app-confirm__backdrop{position:fixed;z-index:10000;inset:0;display:grid;place-items:center;padding:1rem;background:rgb(10 25 45 / 58%);backdrop-filter:blur(3px)}
.app-confirm{box-sizing:border-box;width:min(100%,27rem);padding:1.45rem;border:1px solid var(--border);background:var(--surface);color:var(--foreground);box-shadow:0 24px 70px rgb(8 22 42 / 28%)}
.app-confirm__icon{display:grid;width:2.75rem;height:2.75rem;place-items:center;background:color-mix(in srgb,var(--primary) 11%,var(--surface));color:var(--primary)}
.app-confirm__icon--danger{background:#fff0f0;color:#c43d49}
.app-confirm h2{margin:1rem 0 .35rem;color:var(--foreground);font:800 1.05rem Manrope,sans-serif}
.app-confirm p{margin:0;color:var(--muted-foreground);font-size:.84rem;line-height:1.55}
.app-confirm__actions{display:flex;justify-content:flex-end;gap:.55rem;margin-top:1.35rem}
.app-confirm__actions button{min-height:2.5rem;padding:0 .9rem;border:1px solid var(--border);background:var(--surface);color:var(--foreground);font:750 .75rem Manrope,sans-serif;cursor:pointer}
.app-confirm__actions button:focus-visible{outline:3px solid color-mix(in srgb,var(--primary) 35%,transparent);outline-offset:2px}
.app-confirm__accept{border-color:var(--primary)!important;background:var(--primary)!important;color:#fff!important}
.app-confirm__accept--danger{border-color:#c43d49!important;background:#c43d49!important}
.app-confirm-enter-active,.app-confirm-leave-active{transition:opacity .16s ease}
.app-confirm-enter-active .app-confirm,.app-confirm-leave-active .app-confirm{transition:transform .16s ease}
.app-confirm-enter-from,.app-confirm-leave-to{opacity:0}
.app-confirm-enter-from .app-confirm,.app-confirm-leave-to .app-confirm{transform:translateY(8px) scale(.98)}
@media(prefers-reduced-motion:reduce){.app-confirm-enter-active,.app-confirm-leave-active,.app-confirm-enter-active .app-confirm,.app-confirm-leave-active .app-confirm{transition:none}}
</style>
