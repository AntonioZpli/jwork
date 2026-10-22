<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/services/auth'

const route = useRoute()
const router = useRouter()
const token = ref('')
const status = ref<'ready' | 'submitting' | 'success' | 'error'>('error')
const message = ref('Este enlace no es válido, venció o ya fue utilizado.')

onMounted(() => {
  const fragment = route.hash.startsWith('#') ? route.hash.slice(1) : route.hash
  token.value = new URLSearchParams(fragment).get('token') ?? ''
  if (token.value) {
    status.value = 'ready'
    message.value = ''
  }
  void router.replace({ path: route.path, query: route.query, hash: '' })
})

async function reportUnrecognizedAccess() {
  if (!token.value || status.value !== 'ready') return
  status.value = 'submitting'
  message.value = ''
  try {
    const result = await authApi.reportUnrecognizedLogin(token.value)
    token.value = ''
    status.value = 'success'
    message.value = result.message
  } catch (error) {
    token.value = ''
    status.value = 'error'
    message.value = error instanceof Error ? error.message : 'No se pudo proteger la cuenta. Solicita un aviso nuevo si el enlace venció.'
  }
}
</script>

<template>
  <main class="security-alert-page">
    <section class="security-alert-card" :aria-busy="status === 'submitting'">
      <h1>{{ status === 'success' ? 'Sesiones cerradas' : status === 'error' ? 'No se pudo validar el enlace' : '¿No reconoces este acceso?' }}</h1>
      <p v-if="status === 'ready'">
        Al confirmar, Jinowork cerrará todas las sesiones activas de tu cuenta. Luego podrás cambiar tu contraseña desde «¿Olvidaste tu contraseña?» en la pantalla de acceso.
      </p>
      <p v-else :role="status === 'error' ? 'alert' : 'status'">{{ status === 'submitting' ? 'Protegiendo tu cuenta…' : message }}</p>
      <button v-if="status === 'ready' || status === 'submitting'" :disabled="status === 'submitting'" @click="reportUnrecognizedAccess">
        {{ status === 'submitting' ? 'Cerrando sesiones…' : 'No fui yo: cerrar todas las sesiones' }}
      </button>
      <button v-else type="button" @click="router.replace('/auth')">Ir al acceso</button>
    </section>
  </main>
</template>

<style scoped>
.security-alert-page{display:grid;min-height:100dvh;place-items:center;padding:1.5rem;background:var(--background);color:var(--foreground)}
.security-alert-card{display:grid;gap:1rem;width:min(100%,30rem);padding:2rem;border:1px solid var(--border);border-radius:1rem;background:var(--surface)}
h1,p{margin:0}p{color:var(--muted-foreground)}button{min-height:48px;padding:.7rem 1rem;border:0;border-radius:999px;background:var(--primary);color:#fff;font:inherit;font-weight:700;cursor:pointer}button:disabled{opacity:.65;cursor:wait}
</style>
