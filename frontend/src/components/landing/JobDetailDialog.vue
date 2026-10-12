<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { Job } from '@/types/job'
import { X, MapPin, Briefcase, FileText, Tag } from '@lucide/vue'
import { useEscapeKey } from '@/composables/useEscapeKey'

const props = defineProps<{
  job: Job | null
  /** Element to restore focus to on close */
  triggerElement: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogEl = ref<HTMLElement | null>(null)
const closeBtnEl = ref<HTMLElement | null>(null)

function close() {
  emit('close')
}

useEscapeKey(() => {
  if (props.job) close()
})

// Trap focus within the dialog and prevent body scroll
watch(
  () => props.job,
  async (newJob) => {
    if (newJob) {
      document.body.style.overflow = 'hidden'
      await nextTick()
      closeBtnEl.value?.focus()
    } else {
      document.body.style.overflow = ''
      // Restore focus to trigger element
      await nextTick()
      props.triggerElement?.focus()
    }
  },
)

// Focus trap
function trapFocus(e: KeyboardEvent) {
  if (!props.job || !dialogEl.value || e.key !== 'Tab') return

  const focusable = dialogEl.value.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey) {
    if (document.activeElement === first) {
      last?.focus()
      e.preventDefault()
    }
  } else {
    if (document.activeElement === last) {
      first?.focus()
      e.preventDefault()
    }
  }
}

onMounted(() => document.addEventListener('keydown', trapFocus))
onUnmounted(() => {
  document.removeEventListener('keydown', trapFocus)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="job" class="dialog-overlay" @click.self="close">
        <div
          ref="dialogEl"
          role="dialog"
          aria-modal="true"
          :aria-label="`Detalle de oferta: ${job.title}`"
          class="dialog"
        >
          <!-- Header -->
          <div class="dialog__header">
            <div class="dialog__title-group">
              <span class="dialog__label">Detalle de oferta</span>
              <h2 class="dialog__title">{{ job.title }}</h2>
            </div>
            <button
              ref="closeBtnEl"
              type="button"
              class="dialog__close"
              aria-label="Cerrar diálogo"
              @click="close"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Body -->
          <div class="dialog__body">
            <div class="dialog__notice" role="note">
              Oferta ilustrativa. Esta oportunidad no está publicada realmente.
            </div>

            <dl class="dialog__details">
              <div class="dialog__detail-row">
                <dt class="dialog__dt">
                  <Briefcase :size="14" aria-hidden="true" />
                  Empresa
                </dt>
                <dd class="dialog__dd">{{ job.company }}</dd>
              </div>

              <div class="dialog__detail-row">
                <dt class="dialog__dt">
                  <MapPin :size="14" aria-hidden="true" />
                  Ubicación
                </dt>
                <dd class="dialog__dd">{{ job.location }}</dd>
              </div>

              <div class="dialog__detail-row">
                <dt class="dialog__dt">
                  <Briefcase :size="14" aria-hidden="true" />
                  Modalidad
                </dt>
                <dd class="dialog__dd">{{ job.modality }}</dd>
              </div>

              <div class="dialog__detail-row">
                <dt class="dialog__dt">
                  <FileText :size="14" aria-hidden="true" />
                  Contrato
                </dt>
                <dd class="dialog__dd">{{ job.contract }}</dd>
              </div>

              <div class="dialog__detail-row">
                <dt class="dialog__dt">
                  <Tag :size="14" aria-hidden="true" />
                  Categoría
                </dt>
                <dd class="dialog__dd">{{ job.category }}</dd>
              </div>
            </dl>
          </div>

          <!-- Footer -->
          <div class="dialog__footer">
            <button type="button" class="dialog__close-btn" @click="close">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: oklch(0 0 0 / 0.45);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px oklch(0 0 0 / 0.22);
}

.dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border);
}

.dialog__title-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.dialog__label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--primary);
}

.dialog__title {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1.2;
}

.dialog__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  color: var(--muted-foreground);
  transition: background-color 0.18s ease;
}

.dialog__close:hover {
  background: var(--panel);
  color: var(--foreground);
}

.dialog__close:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

.dialog__body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.dialog__notice {
  padding: 0.75rem 1rem;
  background: var(--secondary);
  border: 1px solid oklch(from var(--primary) l c h / 0.2);
  border-radius: 6px;
  font-size: 0.82rem;
  color: var(--foreground);
  line-height: 1.5;
}

.dialog__details {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin: 0;
}

.dialog__detail-row {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: 0.75rem;
  align-items: center;
}

.dialog__dt {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.dialog__dd {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--foreground);
}

.dialog__footer {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.dialog__close-btn {
  padding: 0.6rem 1.25rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.dialog__close-btn:hover {
  background: oklch(from var(--primary) calc(l - 0.05) c h);
}

.dialog__close-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

/* Transition */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.18s ease;
}

.dialog-enter-active .dialog,
.dialog-leave-active .dialog {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog,
.dialog-leave-to .dialog {
  transform: translateY(10px);
  opacity: 0;
}

@media (max-width: 560px) {
  .dialog {
    max-height: 95vh;
    border-radius: 8px;
  }

  .dialog__detail-row {
    grid-template-columns: 7rem 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialog-enter-active,
  .dialog-leave-active,
  .dialog-enter-active .dialog,
  .dialog-leave-active .dialog {
    transition: none;
  }
}
</style>
