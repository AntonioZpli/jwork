<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, LoaderCircle, X } from 'lucide-vue-next'

withDefaults(defineProps<{
  variant?: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title?: string
  message?: string
  dismissible?: boolean
}>(), { variant: 'info', dismissible: false })

defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div
    class="app-message"
    :class="`app-message--${variant}`"
    :role="variant === 'error' || variant === 'warning' ? 'alert' : 'status'"
    :aria-live="variant === 'error' || variant === 'warning' ? 'assertive' : 'polite'"
  >
    <span class="app-message__icon" aria-hidden="true">
      <LoaderCircle v-if="variant === 'loading'" class="app-message__spinner" :size="19" />
      <CheckCircle2 v-else-if="variant === 'success'" :size="19" />
      <AlertCircle v-else-if="variant === 'error' || variant === 'warning'" :size="19" />
      <Info v-else :size="19" />
    </span>
    <div class="app-message__content">
      <strong v-if="title" class="app-message__title">{{ title }}</strong>
      <p v-if="message" class="app-message__text">{{ message }}</p>
      <div v-if="$slots.default" class="app-message__text"><slot /></div>
      <div v-if="$slots.actions" class="app-message__actions"><slot name="actions" /></div>
    </div>
    <button v-if="dismissible" class="app-message__dismiss" type="button" aria-label="Cerrar mensaje" @click="$emit('dismiss')">
      <X :size="16" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.app-message{--message-accent:#315fc4;--message-bg:color-mix(in srgb,#315fc4 7%,var(--surface));--message-border:color-mix(in srgb,#315fc4 22%,var(--border));display:flex;align-items:flex-start;gap:.72rem;min-width:0;padding:.82rem .95rem;border:1px solid var(--message-border);border-radius:.8rem;background:var(--message-bg);color:var(--foreground)}
.app-message--success{--message-accent:#168052;--message-bg:color-mix(in srgb,#168052 7%,var(--surface));--message-border:color-mix(in srgb,#168052 24%,var(--border))}
.app-message--error{--message-accent:#b42318;--message-bg:color-mix(in srgb,#b42318 7%,var(--surface));--message-border:color-mix(in srgb,#b42318 26%,var(--border))}
.app-message--warning{--message-accent:#946200;--message-bg:color-mix(in srgb,#c18400 9%,var(--surface));--message-border:color-mix(in srgb,#c18400 28%,var(--border))}
.app-message+.app-message{margin-top:.65rem}
.app-message__icon{display:grid;flex:none;place-items:center;margin-top:.08rem;color:var(--message-accent)}.app-message__content{min-width:0;flex:1}.app-message__title{display:block;color:var(--foreground);font-size:.82rem;font-weight:800;line-height:1.4}.app-message__text{margin:.1rem 0 0;color:var(--muted-foreground);font-size:.79rem;line-height:1.5;overflow-wrap:anywhere}.app-message__actions{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:.55rem}.app-message__actions :deep(a),.app-message__actions :deep(button){min-height:2rem;color:var(--message-accent);font:inherit;font-size:.76rem;font-weight:800}.app-message__dismiss{display:grid;flex:none;width:2rem;height:2rem;place-items:center;margin:-.35rem -.4rem 0 0;border:0;border-radius:.5rem;background:transparent;color:var(--muted-foreground);cursor:pointer}.app-message__dismiss:hover{background:color-mix(in srgb,var(--foreground) 6%,transparent);color:var(--foreground)}.app-message__dismiss:focus-visible{outline:2px solid var(--message-accent);outline-offset:2px}.app-message__spinner{animation:app-message-spin .9s linear infinite}@keyframes app-message-spin{to{transform:rotate(360deg)}}
@media(max-width:480px){.app-message{gap:.55rem;padding:.72rem}.app-message__text{font-size:.76rem}}
@media(prefers-reduced-motion:reduce){.app-message__spinner{animation-duration:2s}}
</style>
