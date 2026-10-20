<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CircleCheck } from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()
const checkingSession = ref(true)

onMounted(async () => {
  if (!authStore.user) await authStore.hydrateSession()
  checkingSession.value = false
  if (!authStore.user) await router.replace('/auth')
})

async function signOut() {
  await authStore.logout()
  await router.replace('/auth')
}
</script>

<template>
  <main class="auth-success">
    <section class="auth-success__card" :aria-busy="checkingSession">
      <div class="auth-success__mark" aria-hidden="true"><CircleCheck :size="30" /></div>
      <p class="auth-success__eyebrow">Jinowork</p>
      <h1>{{ checkingSession ? 'Verificando tu sesión' : '¡Iniciaste sesión!' }}</h1>
      <p v-if="checkingSession" role="status">Un momento, estamos confirmando tu acceso.</p>
      <template v-else-if="authStore.user">
        <p>Tu cuenta está lista para continuar.</p>
        <p class="auth-success__email">{{ authStore.user.email }}</p>
        <div class="auth-success__actions">
          <button type="button" class="auth-success__primary" @click="router.push('/')">Ir al inicio</button>
          <button type="button" class="auth-success__secondary" @click="signOut">Cerrar sesión</button>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.auth-success {
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  padding: 1.5rem;
  background: var(--background);
  color: var(--foreground);
}

.auth-success__card {
  width: min(100%, 30rem);
  padding: clamp(2rem, 7vw, 3.5rem);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  background: var(--surface);
  text-align: center;
  box-shadow: 0 20px 60px var(--shadow);
}

.auth-success__mark {
  display: grid;
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  place-items: center;
  border-radius: 50%;
  background: var(--secondary);
  color: var(--primary);
  font-size: 1.8rem;
  font-weight: 800;
}

.auth-success__eyebrow { margin: 0 0 0.5rem; color: var(--primary); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
.auth-success h1 { margin: 0 0 0.75rem; font-family: Manrope, sans-serif; font-size: clamp(1.7rem, 5vw, 2.25rem); }
.auth-success p { color: var(--muted-foreground); line-height: 1.6; }
.auth-success__email { font-weight: 700; color: var(--foreground) !important; }
.auth-success__actions { display: grid; gap: 0.75rem; margin-top: 1.5rem; }
.auth-success button { min-height: 3rem; padding: 0.7rem 1.2rem; border-radius: 999px; font: inherit; font-weight: 700; cursor: pointer; }
.auth-success__primary { border: 0; background: var(--primary); color: white; }
.auth-success__secondary { border: 1px solid var(--border); background: var(--surface); color: var(--foreground); }
</style>
