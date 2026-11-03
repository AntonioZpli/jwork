<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <section class="toast-viewport" aria-label="Notificaciones">
      <TransitionGroup name="toast">
        <article v-for="toast in toasts" :key="toast.id" class="toast-card" :class="`toast-card--${toast.variant}`" :role="toast.variant === 'error' ? 'alert' : 'status'">
          <span class="toast-card__icon" aria-hidden="true">
            <CheckCircle2 v-if="toast.variant === 'success'" :size="20" />
            <AlertCircle v-else-if="toast.variant === 'error'" :size="20" />
            <TriangleAlert v-else-if="toast.variant === 'warning'" :size="20" />
            <Info v-else :size="20" />
          </span>
          <div class="toast-card__content">
            <strong>{{ toast.title }}</strong>
            <p v-if="toast.message">{{ toast.message }}</p>
          </div>
          <button type="button" class="toast-card__dismiss" :aria-label="`Cerrar: ${toast.title}`" @click="dismiss(toast.id)">
            <X :size="17" aria-hidden="true" />
          </button>
        </article>
      </TransitionGroup>
    </section>
  </Teleport>
</template>

<style scoped>
.toast-viewport{position:fixed;z-index:3000;top:max(1.25rem,env(safe-area-inset-top));right:max(1.25rem,env(safe-area-inset-right));display:grid;width:min(24rem,calc(100vw - 2.5rem));gap:.75rem;pointer-events:none}
.toast-card{--toast-accent:#168052;display:flex;align-items:flex-start;gap:.85rem;min-width:0;padding:1rem 1rem 1rem 1.05rem;border:1px solid color-mix(in srgb,var(--toast-accent) 18%,#e5eaf1);border-radius:1rem;background:#fff;color:#132b4b;box-shadow:0 18px 48px rgb(18 39 67 / 18%),0 3px 10px rgb(18 39 67 / 7%);pointer-events:auto;backdrop-filter:blur(12px)}
.toast-card--error{--toast-accent:#c23934}.toast-card--warning{--toast-accent:#a66b00}.toast-card--info{--toast-accent:#2865bc}
.toast-card__icon{display:grid;flex:none;width:2.35rem;height:2.35rem;place-items:center;margin-top:.02rem;border-radius:.75rem;background:color-mix(in srgb,var(--toast-accent) 10%,white);color:var(--toast-accent)}.toast-card__content{min-width:0;flex:1;padding-top:.12rem}.toast-card__content strong{display:block;color:#132b4b;font-size:.88rem;font-weight:750;line-height:1.4;letter-spacing:-.01em}.toast-card__content p{margin:.22rem 0 0;color:#5d6d81;font-size:.82rem;line-height:1.5;overflow-wrap:anywhere}.toast-card__dismiss{display:grid;flex:none;width:2rem;height:2rem;place-items:center;margin:-.35rem -.35rem 0 0;border:0;border-radius:.6rem;background:transparent;color:#7c8999;cursor:pointer;transition:background .16s ease,color .16s ease}.toast-card__dismiss:hover{background:#f1f4f8;color:#263d59}.toast-card__dismiss:focus-visible{outline:2px solid var(--toast-accent);outline-offset:2px}
.toast-enter-active,.toast-leave-active,.toast-move{transition:opacity .2s ease,transform .2s ease}.toast-enter-from,.toast-leave-to{transform:translateX(1rem);opacity:0}.toast-leave-active{position:absolute;right:0;left:0}

@media(max-width:600px){.toast-viewport{top:max(.65rem,env(safe-area-inset-top));right:max(.65rem,env(safe-area-inset-right));left:max(.65rem,env(safe-area-inset-left));width:auto}.toast-card{padding:.8rem .85rem}}
@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active,.toast-move{transition-duration:.01ms}}
</style>
