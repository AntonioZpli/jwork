<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/services/auth'

const route = useRoute()
const router = useRouter()
const isAdminInvitation = computed(() => route.name === 'admin-invitation')
const password = ref('')
const confirmPassword = ref('')
const busy = ref(false)
const done = ref(false)
const error = ref('')
async function submit() {
  error.value = ''
  if (isAdminInvitation.value && password.value !== confirmPassword.value) { error.value = 'Las contraseñas no coinciden.'; return }
  if (isAdminInvitation.value && password.value.length < 14) { error.value = 'Usa una contraseña de al menos 14 caracteres.'; return }
  if (isAdminInvitation.value && (!/[a-z]/.test(password.value) || !/[A-Z]/.test(password.value) || !/\d/.test(password.value) || !/[^A-Za-z0-9]/.test(password.value))) { error.value = 'Incluye al menos una mayúscula, una minúscula, un número y un símbolo.'; return }
  if (password.value.length < 10 || password.value.length > 128) { error.value = 'Usa una contraseña de 10 a 128 caracteres.'; return }
  busy.value = true
  try {
    const token = typeof route.query.token === 'string' ? route.query.token : ''
    if (isAdminInvitation.value) await authApi.acceptAdminInvitation(token, password.value)
    else await authApi.resetPassword(token, password.value)
    done.value = true
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.' }
  finally { busy.value = false }
}
</script>

<template>
  <main class="reset-page"><form class="reset-card" @submit.prevent="submit">
    <h1>{{ done ? (isAdminInvitation ? 'Cuenta de administrador activada' : 'Contraseña actualizada') : (isAdminInvitation ? 'Acepta tu invitación' : 'Crea una nueva contraseña') }}</h1>
    <p v-if="done">{{ isAdminInvitation ? 'Tu contraseña quedó creada. Ya puedes iniciar sesión.' : 'Tu contraseña se cambió y las sesiones anteriores se cerraron.' }}</p>
    <template v-else>
      <label>Nueva contraseña<input v-model="password" type="password" autocomplete="new-password" :minlength="isAdminInvitation ? 14 : 10" maxlength="128" required /></label>
      <label v-if="isAdminInvitation">Confirma la contraseña<input v-model="confirmPassword" type="password" autocomplete="new-password" minlength="14" maxlength="128" required /></label>
      <p v-if="isAdminInvitation" class="password-policy">Al menos 14 caracteres, con mayúscula, minúscula, número y símbolo.</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <button :disabled="busy">{{ busy ? 'Guardando…' : (isAdminInvitation ? 'Crear contraseña' : 'Cambiar contraseña') }}</button>
    </template>
    <button v-if="done" type="button" @click="router.replace('/auth')">Ir al inicio de sesión</button>
  </form></main>
</template>

<style scoped>
.reset-page{display:grid;min-height:100dvh;place-items:center;padding:1.5rem;background:var(--background);color:var(--foreground)}.reset-card{display:grid;gap:1rem;width:min(100%,28rem);padding:2rem;border:1px solid var(--border);border-radius:1rem;background:var(--surface)}h1{margin:0}label{display:grid;gap:.5rem}input{box-sizing:border-box;min-height:48px;padding:.7rem;border:1px solid var(--border);border-radius:.6rem;background:var(--background);color:var(--foreground)}button{min-height:48px;border:0;border-radius:999px;background:var(--primary);color:white;font:inherit;font-weight:700;cursor:pointer}button:disabled{opacity:.65;cursor:wait}.password-policy{margin:0;color:var(--muted-foreground);font-size:.9rem}p[role=alert]{color:#b42318}
</style>
