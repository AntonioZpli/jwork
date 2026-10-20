import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AuthView from '../views/AuthView.vue'
import EmailVerificationView from '../views/EmailVerificationView.vue'
import AuthSuccessView from '../views/AuthSuccessView.vue'
import PasswordResetView from '../views/PasswordResetView.vue'
import OnboardingView from '../views/OnboardingView.vue'
import AdminView from '../views/AdminView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
    },
    {
      path: '/auth/verify',
      name: 'email-verification',
      component: EmailVerificationView,
    },
    {
      path: '/auth/success',
      name: 'auth-success',
      component: AuthSuccessView,
    },
    { path: '/auth/reset-password', name: 'password-reset', component: PasswordResetView },
    { path: '/auth/admin-invite', name: 'admin-invitation', component: PasswordResetView },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const authStore = useAuthStore()
  if (!authStore.user) await authStore.hydrateSession()
  if (!authStore.user) return { name: 'auth', query: { redirect: to.fullPath } }
  if (to.meta.requiresAdmin && !['ADMIN', 'SUPERADMIN'].includes(authStore.user.role)) return { name: 'home' }
  return true
})

export default router
