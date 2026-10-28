import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AuthView from '../views/AuthView.vue'
import EmailVerificationView from '../views/EmailVerificationView.vue'
import AuthSuccessView from '../views/AuthSuccessView.vue'
import PasswordResetView from '../views/PasswordResetView.vue'
import OnboardingView from '../views/OnboardingView.vue'
import AdminView from '../views/AdminView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import SecurityAlertView from '../views/SecurityAlertView.vue'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta { workspaceRole?: 'CANDIDATE' | 'COMPANY' }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (!from.matched.length && to.path === '/') return { top: 0, behavior: 'instant' }
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' }
    return { top: 0 }
  },
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
    { path: '/auth/security-alert', name: 'security-alert', component: SecurityAlertView },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
      meta: { requiresAuth: true },
    },
    { path: '/candidate', name: 'candidate-dashboard', component: () => import('../views/CandidateDashboardView.vue'), meta: { requiresAuth: true, workspaceRole: 'CANDIDATE' } },
    { path: '/candidate/applications', name: 'candidate-applications', component: () => import('../views/CandidateApplicationsView.vue'), meta: { requiresAuth: true, workspaceRole: 'CANDIDATE' } },
    { path: '/candidate/saved-jobs', name: 'candidate-saved-jobs', component: () => import('../views/CandidateSavedJobsView.vue'), meta: { requiresAuth: true, workspaceRole: 'CANDIDATE' } },
    { path: '/candidate/profile', name: 'candidate-profile', component: () => import('../views/CandidateProfileView.vue'), meta: { requiresAuth: true, workspaceRole: 'CANDIDATE' } },
    { path: '/candidate/profile/preview', name: 'candidate-profile-preview', component: () => import('../views/CandidateProfilePreviewView.vue'), meta: { requiresAuth: true, workspaceRole: 'CANDIDATE' } },
    { path: '/company', name: 'company-dashboard', component: () => import('../views/CompanyDashboardView.vue'), meta: { requiresAuth: true, workspaceRole: 'COMPANY' } },
    { path: '/company/jobs', name: 'company-jobs', component: () => import('../views/CompanyJobsView.vue'), meta: { requiresAuth: true, workspaceRole: 'COMPANY' } },
    { path: '/company/jobs/new', name: 'company-job-create', component: () => import('../views/CompanyJobFormView.vue'), meta: { requiresAuth: true, workspaceRole: 'COMPANY' } },
    { path: '/company/jobs/:id/edit', name: 'company-job-edit', component: () => import('../views/CompanyJobFormView.vue'), meta: { requiresAuth: true, workspaceRole: 'COMPANY' } },
    { path: '/company/applications', name: 'company-applications', component: () => import('../views/CompanyApplicationsView.vue'), meta: { requiresAuth: true, workspaceRole: 'COMPANY' } },
    { path: '/company/profile', name: 'company-profile', component: () => import('../views/CompanyProfileView.vue'), meta: { requiresAuth: true, workspaceRole: 'COMPANY' } },
    { path: '/company/profile/preview', name: 'company-profile-preview', component: () => import('../views/CompanyProfilePreviewView.vue'), meta: { requiresAuth: true, workspaceRole: 'COMPANY' } },
    { path: '/jobs', name: 'jobs', component: () => import('../views/JobsView.vue') },
    { path: '/jobs/:id', name: 'job-detail', component: () => import('../views/PublicJobDetailView.vue') },
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
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const authStore = useAuthStore()
  if (!authStore.user) await authStore.hydrateSession()
  if (!authStore.user) return { name: 'auth', query: { redirect: to.fullPath } }
  if (to.meta.requiresAdmin && !['ADMIN', 'SUPERADMIN'].includes(authStore.user.role)) return { name: 'home' }
  if (to.meta.workspaceRole && authStore.user.role !== to.meta.workspaceRole) {
    if (authStore.user.role === 'CANDIDATE') return { name: 'candidate-dashboard' }
    if (authStore.user.role === 'COMPANY') return { name: 'company-dashboard' }
    return { name: 'home' }
  }
  return true
})

export default router
