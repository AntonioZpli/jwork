import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi, type AuthUser } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(user.value))

  async function hydrateSession() {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.getCurrentUser()
      user.value = response.user
      return response.user
    } catch {
      user.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function verifyEmailLink(token: string) {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.verifyEmailLink(token)
      user.value = response.user
      return response
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'No se pudo verificar el correo.'
      error.value = message
      throw requestError
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    error.value = null

    try {
      await authApi.logout()
      user.value = null
      return true
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'No se pudo cerrar la sesión.'
      error.value = message
      throw requestError
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    hydrateSession,
    verifyEmailLink,
    logout,
  }
})
