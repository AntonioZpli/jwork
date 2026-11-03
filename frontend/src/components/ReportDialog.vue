<script setup lang="ts">
import { ref } from 'vue'
import { Clock3, Flag, Info, ShieldCheck, X } from 'lucide-vue-next'
import { apiRequest } from '@/services/auth'

const props = defineProps<{ targetType: 'COMPANY' | 'JOB'; targetId: string }>()
const emit = defineEmits<{ close: []; submitted: [] }>()
const reason = ref('')
const description = ref('')
const busy = ref(false)
const error = ref('')
const reasons = [
  ['FRAUD', 'Fraude o estafa'], ['FAKE_JOB', 'Oferta falsa'], ['IMPERSONATION', 'Suplantación de identidad'],
  ['HARASSMENT', 'Acoso'], ['INAPPROPRIATE_CONTENT', 'Contenido inapropiado'], ['OTHER', 'Otro motivo'],
]

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await apiRequest('/api/reports', { method: 'POST', body: JSON.stringify({ targetType: props.targetType, targetId: props.targetId, reason: reason.value, description: description.value }) })
    emit('submitted')
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'No se pudo enviar el reporte.' }
  finally { busy.value = false }
}
</script>

<template>
  <Teleport to="body">
    <div class="report-backdrop" @click.self="emit('close')">
      <form class="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title" @submit.prevent="submit">
        <header class="report-header"><span class="report-icon"><Flag :size="20" /></span><div class="report-heading"><span class="report-eyebrow">SEGURIDAD DE LA COMUNIDAD</span><h2 id="report-title">Reportar {{ targetType === 'COMPANY' ? 'empresa' : 'oferta laboral' }}</h2></div><button class="report-close" type="button" aria-label="Cerrar" @click="emit('close')"><X :size="19" /></button></header>
        <div class="report-target"><span>Estás reportando</span><strong>{{ targetType === 'COMPANY' ? 'Perfil de empresa' : 'Oferta laboral' }}</strong></div>
        <details class="report-help">
          <summary><Info :size="15" /> Reglas para reportar</summary>
          <section class="report-rules" aria-label="Reglas para enviar reportes">
          <article><span><ShieldCheck :size="17" /></span><p><strong>Reporta hechos concretos.</strong> Usa información veraz y explica qué incumple las reglas.</p></article>
          <article><span><Clock3 :size="17" /></span><p><strong>Hasta 5 reportes cada 24 horas</strong> por cuenta. Se cuentan todos los reportes enviados, aunque ya estén resueltos o rechazados.</p></article>
          <article><span><Flag :size="17" /></span><p><strong>Un reporte pendiente por elemento.</strong> Espera la decisión del equipo antes de volver a reportar lo mismo.</p></article>
          </section>
        </details>
        <label class="report-field">Motivo<select v-model="reason" required><option value="" disabled>Selecciona el motivo más cercano</option><option v-for="[value, label] in reasons" :key="value" :value="value">{{ label }}</option></select></label>
        <label class="report-field">¿Qué ocurrió?<textarea v-model="description" required minlength="10" maxlength="2000" rows="4" placeholder="Describe lo que viste, cuándo ocurrió y cualquier detalle útil."></textarea><small>{{ description.length }}/2000 · mínimo 10 caracteres</small></label>
        <p v-if="error" class="report-error" role="alert">{{ error }}</p>
        <footer class="report-actions"><button class="report-cancel" type="button" @click="emit('close')">Cancelar</button><button class="report-submit" type="submit" :disabled="busy || !reason || description.trim().length < 10">{{ busy ? 'Enviando…' : 'Enviar reporte' }}</button></footer>
        <p class="report-privacy">Tu reporte se comparte únicamente con el equipo de moderación.</p>
      </form>
    </div>
  </Teleport>
</template>

<style scoped>
.report-backdrop{position:fixed;inset:0;z-index:1300;display:grid;place-items:center;overflow-y:auto;padding:1rem;background:rgb(12 18 32 / 64%);backdrop-filter:blur(5px)}
.report-dialog{position:relative;display:grid;gap:.9rem;width:min(100%,36rem);max-height:min(94vh,54rem);overflow:auto;padding:1.25rem;border:1px solid color-mix(in srgb,var(--primary) 17%,var(--border));border-radius:1.1rem;background:var(--surface);box-shadow:0 28px 90px rgb(0 0 0 / 32%)}
.report-header{display:flex;align-items:center;gap:.8rem}.report-icon{display:grid;width:2.75rem;height:2.75rem;flex:none;place-items:center;border:1px solid color-mix(in srgb,var(--primary) 20%,var(--border));border-radius:.85rem;background:color-mix(in srgb,var(--primary) 10%,var(--surface));color:var(--primary)}
.report-heading{min-width:0;flex:1}.report-eyebrow{color:var(--primary);font-size:.62rem;font-weight:850;letter-spacing:.09em}.report-heading h2{margin:.22rem 0 0;color:var(--foreground);font:800 1.3rem/1.2 Manrope,sans-serif;letter-spacing:-.025em}
.report-close{display:grid;width:2.35rem;height:2.35rem;flex:none;place-items:center;border:1px solid var(--border);border-radius:.65rem;background:transparent;color:var(--foreground);cursor:pointer}.report-close:hover{background:var(--background)}
.report-target{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.7rem .8rem;border:1px solid var(--border);border-radius:.7rem;background:var(--background)}.report-target span{color:var(--muted-foreground);font-size:.7rem}.report-target strong{color:var(--foreground);font-size:.72rem}
.report-help{display:grid;gap:.5rem}.report-help summary{display:flex;width:max-content;align-items:center;gap:.35rem;color:var(--primary);font-size:.7rem;font-weight:750;cursor:pointer;list-style:none}.report-help summary::-webkit-details-marker{display:none}.report-help summary:hover{text-decoration:underline}.report-help summary:focus-visible{outline:2px solid var(--primary);outline-offset:3px;border-radius:.2rem}
.report-rules{display:grid;gap:.45rem;padding:.7rem;border:1px solid color-mix(in srgb,var(--primary) 17%,var(--border));border-radius:.8rem;background:color-mix(in srgb,var(--primary) 5%,var(--surface))}
.report-rules article{display:grid;grid-template-columns:1.6rem minmax(0,1fr);align-items:start;gap:.5rem}.report-rules article>span{display:grid;width:1.45rem;height:1.45rem;place-items:center;border-radius:.45rem;background:color-mix(in srgb,var(--primary) 11%,var(--surface));color:var(--primary)}.report-rules p{margin:0;color:var(--muted-foreground);font-size:.68rem;line-height:1.45}.report-rules strong{color:var(--foreground)}
.report-field{display:grid;gap:.4rem;color:var(--foreground);font-size:.76rem;font-weight:750}.report-field select,.report-field textarea{width:100%;box-sizing:border-box;padding:.7rem .75rem;border:1px solid var(--border);border-radius:.65rem;background:var(--background);color:var(--foreground);font:inherit;font-size:.8rem;transition:border-color .16s,box-shadow .16s}.report-field select:focus,.report-field textarea:focus{outline:0;border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 14%,transparent)}.report-field textarea{resize:vertical;line-height:1.5}.report-field small{color:var(--muted-foreground);font-size:.64rem;font-weight:500}
.report-error{margin:0;padding:.65rem .75rem;border:1px solid #efc4c4;border-radius:.6rem;background:#fff4f3;color:#a12626;font-size:.75rem}
.report-actions{display:flex;justify-content:flex-end;gap:.55rem;padding-top:.15rem}.report-cancel,.report-submit{min-height:2.65rem;padding:0 1rem;border:1px solid var(--border);border-radius:.65rem;font:inherit;font-size:.75rem;font-weight:750;cursor:pointer}.report-cancel{background:transparent;color:var(--foreground)}.report-cancel:hover{background:var(--background)}.report-submit{border-color:var(--primary);background:var(--primary);color:white;box-shadow:0 5px 14px color-mix(in srgb,var(--primary) 20%,transparent)}.report-submit:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
.report-privacy{margin:0;color:var(--muted-foreground);font-size:.63rem;text-align:center}
@media(max-width:500px){.report-dialog{gap:.72rem;padding:1rem;border-radius:.9rem}.report-heading h2{font-size:1.15rem}.report-target{align-items:flex-start;flex-direction:column;gap:.2rem}}
</style>
