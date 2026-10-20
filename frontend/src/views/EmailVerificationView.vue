<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CircleAlert, CircleCheck, LoaderCircle } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('Verificando tu correo...')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) {
    status.value = 'error'
    message.value = 'Este enlace no es válido. Solicita uno nuevo desde Jinowork.'
    return
  }

  try {
    await authStore.verifyEmailLink(token)
    status.value = 'success'
    message.value = 'Tu correo fue verificado. Ya iniciaste sesión en Jinowork.'
    await router.replace({ path: '/onboarding' })
  } catch (error) {
    status.value = 'error'
    message.value = error instanceof Error ? error.message : 'No se pudo verificar el correo. Solicita un enlace nuevo.'
  }
})
</script>

<template>
  <main class="email-verification">
    <section class="email-verification__card" :aria-busy="status === 'loading'">
      <div class="email-verification__mark" :class="`email-verification__mark--${status}`" aria-hidden="true">
        <component :is="status === 'success' ? CircleCheck : status === 'error' ? CircleAlert : LoaderCircle" :size="26" :class="{ 'email-verification__spinner': status === 'loading' }" />
      </div>
      <h1>{{ status === 'success' ? 'Correo verificado' : status === 'error' ? 'No se pudo verificar' : 'Verificando correo' }}</h1>
      <p :role="status === 'error' ? 'alert' : 'status'">{{ message }}</p>
      <button v-if="status === 'success'" type="button" @click="router.replace('/')">
        Continuar a Jinowork
      </button>
      <button v-else-if="status === 'error'" type="button" @click="router.replace('/auth')">
        Volver al acceso
      </button>
    </section>
  </main>
</template>

<style scoped>
.email-verification {
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  padding: 1.5rem;
  background: var(--background);
  color: var(--foreground);
}

.email-verification__card {
  width: min(100%, 28rem);
  padding: 2.5rem;
  border: 1px solid var(--border);
  border-radius: 1rem;
  background: var(--surface);
  text-align: center;
  box-shadow: 0 20px 60px color-mix(in srgb, var(--foreground) 9%, transparent);
}

.email-verification__mark {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1.25rem;
  place-items: center;
  border-radius: 50%;
  background: var(--secondary);
  color: var(--primary);
  font-size: 1.6rem;
  font-weight: 800;
}

.email-verification__mark--error { color: #b42318; }
.email-verification__spinner { animation: email-verification-spin 1s linear infinite; }
@keyframes email-verification-spin { to { transform: rotate(360deg); } }
.email-verification h1 { margin: 0 0 0.75rem; font-size: 1.5rem; }
.email-verification p { margin: 0; color: var(--muted-foreground); line-height: 1.6; }

.email-verification button {
  margin-top: 1.5rem;
  padding: 0.8rem 1.2rem;
  border: 0;
  border-radius: 999px;
  background: var(--primary);
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
</style>
