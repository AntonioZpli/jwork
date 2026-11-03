<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppMessage from '@/components/ui/AppMessage.vue'
import { useToast } from '@/composables/useToast'
import { authApi } from '@/services/auth'
import { Activity, BarChart3, BriefcaseBusiness, Building2, Check, ClipboardList, Clock3, Columns3, Database, FileText, Flag, LayoutDashboard, LogOut, Moon, Search, Sun, Users } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import { useEscapeKey } from '@/composables/useEscapeKey'
import '@/assets/admin.css'

type Section = 'overview' | 'users' | 'companies' | 'jobs' | 'applications' | 'reports' | 'audit' | 'stats' | 'explorer'
type Row = Record<string, any>
const router = useRouter()
const auth = useAuthStore()
const { theme, toggleTheme } = useTheme()
const { notify } = useToast()
const sections: { id: Section; label: string; group: string; icon: Component }[] = [
  { id: 'overview', label: 'Centro de operaciones', group: 'OPERACIONES', icon: LayoutDashboard },
  { id: 'users', label: 'Usuarios', group: 'GESTIÓN', icon: Users },
  { id: 'companies', label: 'Empresas', group: 'GESTIÓN', icon: Building2 },
  { id: 'jobs', label: 'Ofertas', group: 'GESTIÓN', icon: BriefcaseBusiness },
  { id: 'applications', label: 'Postulaciones', group: 'GESTIÓN', icon: FileText },
  { id: 'reports', label: 'Moderación', group: 'CONFIANZA', icon: Flag },
  { id: 'audit', label: 'Auditoría', group: 'CONFIANZA', icon: ClipboardList },
  { id: 'stats', label: 'Estadísticas', group: 'ANÁLISIS', icon: BarChart3 },
  { id: 'explorer', label: 'Explorador técnico', group: 'ANÁLISIS', icon: Database },
]
const section = ref<Section>('overview')
const overview = ref<any>(null)
const rows = ref<Row[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(25)
const search = ref('')
const status = ref('')
const userRole = ref('')
const verified = ref('')
const selected = ref<Row | null>(null)
const inspector = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
const loading = ref(false)
const error = ref('')
const busyAction = ref(false)
type AdminDialog = { title: string; message: string; confirmLabel: string; inputLabel?: string; placeholder?: string; required?: boolean; danger?: boolean }
const activeDialog = ref<AdminDialog | null>(null)
const dialogInput = ref('')
const dialogInputElement = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const dialogElement = ref<HTMLElement | null>(null)
let previousDialogFocus: HTMLElement | null = null
let resolveDialog: ((value: string | null) => void) | null = null
const invitationEmail = ref('')
const invitationBusy = ref(false)
const profileOpen = ref(false)
const profileDisplayName = ref('')
const profilePhoto = ref<string | null>(null)
const profileFileInput = ref<HTMLInputElement | null>(null)
const retroTheme = ref(false)
const retroStartOpen = ref(false)
const retroClock = ref('')
let retroClockTimer: ReturnType<typeof setInterval> | undefined
const density = ref(localStorage.getItem('jw-admin-density') ?? 'comfortable')
const savedViews = ref<string[]>(JSON.parse(localStorage.getItem('jw-admin-views') ?? '[]'))
const explorerModel = ref('users')
const sortField = ref('')
const sortDirection = ref<'asc' | 'desc'>('desc')
const allColumns = computed(() => visibleRows.value.length ? Object.keys(visibleRows.value[0] ?? {}) : [])
const configuredColumns = ref<Record<string, string[]>>(JSON.parse(localStorage.getItem('jw-admin-columns') ?? '{}'))
const columns = computed(() => {
  const saved = configuredColumns.value[section.value]
  if (saved?.length) return allColumns.value.filter(column => saved.includes(column))
  if (section.value === 'reports') {
    const preferred = ['reporter.email', 'targetType', 'target', 'reason', 'createdAt', 'status']
    const visible = allColumns.value.filter(column => preferred.includes(column))
    if (visible.length) return visible
  }
  return allColumns.value.slice(0, 8)
})
function toggleColumn(column: string) {
  const selected = [...columns.value]
  configuredColumns.value[section.value] = selected.includes(column) ? selected.filter(value => value !== column) : [...selected, column]
  localStorage.setItem('jw-admin-columns', JSON.stringify(configuredColumns.value))
}
function toggleSort(column: string) {
  const fields: Record<string, Record<string, string>> = {
    users: { email: 'email', role: 'role', status: 'status', createdAt: 'createdAt', lastLoginAt: 'lastLoginAt' },
    companies: { name: 'name', verificationStatus: 'verificationStatus', createdAt: 'createdAt' },
    jobs: { title: 'title', status: 'status', createdAt: 'createdAt', publishedAt: 'publishedAt' },
    applications: { status: 'status', appliedAt: 'appliedAt', updatedAt: 'updatedAt' },
    reports: { status: 'status', createdAt: 'createdAt', reason: 'reason' },
    audit: { actionType: 'actionType', entityType: 'entityType', createdAt: 'createdAt' },
  }
  const field = fields[section.value]?.[column]
  if (!field) return
  sortDirection.value = sortField.value === field && sortDirection.value === 'desc' ? 'asc' : 'desc'
  sortField.value = field; page.value = 1; void load()
}
const stats = ref<any>(null)
const explorerModels = ref<any[]>([])
const statsTo = ref(new Date().toISOString().slice(0, 10))
const statsFrom = ref(new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10))
const globalQuery = ref('')
const globalGroups = ref<any[]>([])
const globalOpen = ref(false)
const adminEmail = computed(() => auth.user?.email ?? 'Administración')
const adminRoleLabel = computed(() => auth.user?.role === 'SUPERADMIN' ? 'Superadministrador' : 'Administrador')
const profileName = computed(() => profileDisplayName.value || adminEmail.value.split('@')[0] || 'Administración')
const canUseRetroTheme = computed(() => auth.user?.role === 'SUPERADMIN')
function adminPreferenceKey(kind: 'profile' | 'retro') {
  return `jw-admin-${kind}:${auth.user?.id ?? 'unknown'}`
}
function restoreAdminPreferences() {
  if (!auth.user) return
  try {
    const saved = JSON.parse(localStorage.getItem(adminPreferenceKey('profile')) ?? '{}')
    profileDisplayName.value = typeof saved.displayName === 'string' ? saved.displayName : ''
    profilePhoto.value = auth.user.role === 'SUPERADMIN' && typeof saved.photo === 'string' ? saved.photo : null
    retroTheme.value = auth.user.role === 'SUPERADMIN' && localStorage.getItem(adminPreferenceKey('retro')) === 'true'
  } catch {
    profileDisplayName.value = ''
    profilePhoto.value = null
    retroTheme.value = false
  }
}
function openProfile() {
  restoreAdminPreferences()
  profileOpen.value = true
}
function cancelProfile() {
  restoreAdminPreferences()
  profileOpen.value = false
}
function saveProfile() {
  if (!auth.user) return
  try {
    localStorage.setItem(adminPreferenceKey('profile'), JSON.stringify({
      displayName: profileDisplayName.value.trim().slice(0, 60),
      photo: auth.user.role === 'SUPERADMIN' ? profilePhoto.value : null,
    }))
    profileDisplayName.value = profileDisplayName.value.trim().slice(0, 60)
    notify('Perfil guardado', 'Los cambios se guardaron en este navegador.')
    profileOpen.value = false
  } catch {
    notify('No se pudo guardar', 'El almacenamiento local está lleno o no está disponible.', 'error')
  }
}
function changeProfilePhoto(event: Event) {
  if (auth.user?.role !== 'SUPERADMIN') return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    notify('Imagen no válida', 'Elige una imagen JPG, PNG o WebP de hasta 2 MB.', 'error')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') profilePhoto.value = reader.result
  }
  reader.onerror = () => notify('No se pudo leer la imagen', 'Inténtalo con otro archivo.', 'error')
  reader.readAsDataURL(file)
}
function toggleRetroTheme() {
  if (!canUseRetroTheme.value) return
  retroTheme.value = !retroTheme.value
  localStorage.setItem(adminPreferenceKey('retro'), String(retroTheme.value))
  retroStartOpen.value = false
}
function updateRetroClock() {
  retroClock.value = new Intl.DateTimeFormat('es-NI', { hour: '2-digit', minute: '2-digit' }).format(new Date())
}
watch(selected, async (value, previous) => {
  if (value && !previous) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    inspector.value?.focus()
  } else if (!value && previous) {
    await nextTick()
    previousFocus?.focus()
    previousFocus = null
  }
})
watch(activeDialog, async (value, previous) => {
  if (value && !previous) previousDialogFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  if (value) (dialogInputElement.value ?? dialogElement.value)?.focus()
  else if (previous) {
    previousDialogFocus?.focus()
    previousDialogFocus = null
  }
})
function finishDialog(value: string | null) {
  if (value !== null && activeDialog.value?.required && !dialogInput.value.trim()) return
  const hasInput = Boolean(activeDialog.value?.inputLabel)
  const resolve = resolveDialog
  resolveDialog = null
  activeDialog.value = null
  dialogInput.value = ''
  resolve?.(value === null ? null : hasInput ? value.trim() : 'confirmed')
}
async function requestDialog(options: AdminDialog): Promise<string | null> {
  const result = new Promise<string | null>(resolve => { resolveDialog = resolve })
  dialogInput.value = ''
  activeDialog.value = options
  return result
}
function trapDialogFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !dialogElement.value) return
  const focusable = [...dialogElement.value.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')]
  const first = focusable.at(0)
  const last = focusable.at(-1)
  if (!first || !last) { event.preventDefault(); dialogElement.value.focus(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
useEscapeKey(() => {
  if (activeDialog.value) finishDialog(null)
  else if (profileOpen.value) cancelProfile()
  else if (retroStartOpen.value) retroStartOpen.value = false
  else if (selected.value && !busyAction.value) selected.value = null
})
function trapInspectorFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !inspector.value) return
  const focusable = [...inspector.value.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
  if (!focusable.length) { event.preventDefault(); inspector.value.focus(); return }
  const first = focusable.at(0)
  const last = focusable.at(-1)
  if (!first || !last) { event.preventDefault(); inspector.value.focus(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
const heading = computed(() => sections.find(item => item.id === section.value)?.label ?? '')
const resource: Partial<Record<Section, string>> = { users: 'users', companies: 'companies', jobs: 'jobs', applications: 'applications', reports: 'reports', audit: 'audit', explorer: 'explorer' }
const pretty = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  const text = String(value)
  if (text === 'COMPANY') return 'Empresa'
  if (text === 'JOB') return 'Oferta laboral'
  const reasons: Record<string, string> = { FRAUD: 'Fraude o estafa', FAKE_JOB: 'Oferta falsa', IMPERSONATION: 'Suplantación de identidad', HARASSMENT: 'Acoso', INAPPROPRIATE_CONTENT: 'Contenido inapropiado', OTHER: 'Otro motivo' }
  if (reasons[text]) return reasons[text]
  if (/^\d{4}-\d\d-\d\dT/.test(text)) return new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(text))
  return text
}
function flatten(row: Row): Row {
  const result: Row = {}
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('_')) continue
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [child, item] of Object.entries(value)) result[`${key}.${child}`] = item
    } else result[key] = value
  }
  return result
}
const visibleRows = computed(() => rows.value.map(flatten))
const queryUrl = (path: string) => {
  const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value) })
  if (search.value.trim()) params.set('q', search.value.trim())
  if (status.value) params.set('status', status.value)
  if (section.value === 'users' && userRole.value) params.set('role', userRole.value)
  if (section.value === 'users' && verified.value) params.set('verified', verified.value)
  if (section.value === 'explorer') params.set('model', explorerModel.value)
  if (sortField.value) { params.set('sort', sortField.value); params.set('direction', sortDirection.value) }
  return `${path}?${params}`
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001')
  let response: Response
  try {
    response = await fetch(`${base}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers }, ...init })
  } catch {
    throw new Error('No se pudo conectar con Jinowork. Revisa tu conexión e inténtalo de nuevo.')
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')
    if (response.status === 403) throw new Error('Tu cuenta no tiene permiso para realizar esta acción.')
    if (response.status === 503 && payload.code === 'ADMIN_INVITATION_EMAIL_FAILED' && typeof payload.message === 'string') throw new Error(payload.message)
    if (response.status >= 500) throw new Error('El servidor no pudo completar la solicitud. Inténtalo de nuevo en unos momentos.')
    const message = typeof payload.message === 'string' ? payload.message.trim() : ''
    const containsInternals = message.length > 240 || /prisma|invocation|node_modules|stack trace|\bat\s+.+\.(?:js|ts):\d+/i.test(message)
    throw new Error(message && !containsInternals ? message : 'No se pudo completar la solicitud. Revisa los datos e inténtalo de nuevo.')
  }
  return payload
}
async function load() {
  loading.value = true; error.value = ''
  try {
    if (section.value === 'overview') {
      overview.value = await request('/api/admin/overview')
      rows.value = []; total.value = 0
    } else if (section.value === 'stats') {
      stats.value = await request(`/api/admin/stats?from=${encodeURIComponent(statsFrom.value)}&to=${encodeURIComponent(statsTo.value)}`)
      rows.value = []; total.value = 0
    } else {
      if (section.value === 'explorer' && !explorerModels.value.length) explorerModels.value = (await request<{ models: any[] }>('/api/admin/explorer/schema')).models
      const payload: any = await request(queryUrl(`/api/admin/${resource[section.value]}`))
      rows.value = payload.data; total.value = payload.total
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar la consola.'
  } finally { loading.value = false }
}
function go(id: Section) { section.value = id; page.value = 1; selected.value = null; sortField.value = '' }
const globalSearch = async () => {
  if (globalQuery.value.trim().length < 2) { globalGroups.value = []; return }
  try { globalGroups.value = (await request<{ groups: any[] }>(`/api/admin/search?q=${encodeURIComponent(globalQuery.value.trim())}`)).groups }
  catch { globalGroups.value = [] }
}
function closeGlobalSearch(event: FocusEvent) {
  const wrapper = event.currentTarget as HTMLElement
  if (!wrapper.contains(event.relatedTarget as Node | null)) globalOpen.value = false
}
async function inviteAdmin() {
  if (invitationBusy.value) return
  const email = invitationEmail.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.value = 'Ingresa un correo válido para la invitación.'; return }
  invitationBusy.value = true; error.value = ''
  try {
    const result = await request<{ message: string }>('/api/admin/invitations', { method: 'POST', body: JSON.stringify({ email }) })
    notify('Invitación enviada', result.message)
    invitationEmail.value = ''
  } catch (cause) {
    notify('No se pudo enviar la invitación', cause instanceof Error ? cause.message : 'Inténtalo de nuevo.', 'error')
  } finally { invitationBusy.value = false }
}
function openGlobalResult(group: string, item: Row) {
  section.value = group as Section; search.value = item.email ?? item.name ?? item.title ?? item.id; page.value = 1; selected.value = item; globalOpen.value = false
}
function saveView() {
  void saveViewWithDialog()
}
async function saveViewWithDialog() {
  const title = await requestDialog({ title: 'Guardar vista', message: 'Ponle un nombre para encontrarla fácilmente en esta consola.', confirmLabel: 'Guardar vista', inputLabel: 'Nombre de la vista', placeholder: 'Ej. Usuarios pendientes', required: true })
  if (!title) return
  const view = JSON.stringify({ title, section: section.value, search: search.value, status: status.value, userRole: userRole.value, verified: verified.value, explorerModel: explorerModel.value, sortField: sortField.value, sortDirection: sortDirection.value })
  savedViews.value = [...savedViews.value.filter(item => JSON.parse(item).title !== title), view]
  localStorage.setItem('jw-admin-views', JSON.stringify(savedViews.value))
  notify('Vista guardada', `“${title}” quedó disponible en esta consola.`)
}
function applyView(value: string) {
  const view = JSON.parse(value); section.value = view.section; search.value = view.search; status.value = view.status; userRole.value = view.userRole ?? ''; verified.value = view.verified ?? ''; explorerModel.value = view.explorerModel ?? 'users'; sortField.value = view.sortField ?? ''; sortDirection.value = view.sortDirection ?? 'desc'; page.value = 1
}
function exportCsv() {
  const data = visibleRows.value
  if (!data.length) return
  const keys = columns.value
  const safeCell = (value: unknown) => { const text = String(value ?? ''); return `"${(/^[=+@\-\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"` }
  const csv = [keys, ...data.map(row => keys.map(key => row[key]))].map(line => line.map(safeCell).join(',')).join('\r\n')
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' })); link.download = `jinowork-${section.value}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href)
}
async function act(kind: string, value: string) {
  if (!selected.value) return
  const id = selected.value.id
  const confirmed = await requestDialog({ title: 'Confirmar acción', message: `¿Quieres aplicar “${value}” a este registro?`, confirmLabel: value, danger: ['BANNED', 'REMOVED', 'REJECTED', 'DISMISSED'].includes(value) })
  if (!confirmed) return
  busyAction.value = true; error.value = ''
  try {
    if (kind === 'report') {
      const resolution = await requestDialog({ title: 'Motivo de la decisión', message: 'Esta explicación quedará registrada con el reporte.', confirmLabel: 'Continuar', inputLabel: 'Decisión y motivo', placeholder: 'Describe brevemente la resolución', required: true })
      if (!resolution) return
      await request(`/api/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status: value, resolution }) })
    } else {
      const paths: Record<string, string> = { user: `/api/admin/users/${id}/status`, company: `/api/admin/companies/${id}/${['ACTIVE', 'SUSPENDED', 'BANNED'].includes(value) ? 'status' : 'verification'}`, job: `/api/admin/jobs/${id}/status`, role: `/api/admin/users/${id}/role` }
      const path = paths[kind]
      if (!path) throw new Error('Acción no disponible para este registro.')
      let reason: string | undefined
      if ((kind === 'user' || (kind === 'company' && ['SUSPENDED', 'BANNED'].includes(value))) && value !== 'ACTIVE') {
        const response = await requestDialog({ title: 'Motivo de moderación', message: 'El motivo quedará guardado en el registro de la cuenta empresarial.', confirmLabel: 'Continuar', inputLabel: 'Motivo', placeholder: 'Explica la razón de esta medida', required: true })
        if (!response) return
        reason = response
      }
      await request(path, { method: 'PATCH', body: JSON.stringify({ [kind === 'role' ? 'role' : 'status']: value, ...(reason ? { reason } : {}) }) })
    }
    selected.value = null; await load(); notify('Acción completada', 'Los cambios se guardaron y quedaron registrados.')
  } catch (cause) { notify('La acción no se completó', cause instanceof Error ? cause.message : 'Inténtalo de nuevo.', 'error') }
  finally { busyAction.value = false }
}
const canDeleteSelected = computed(() => ['jobs', 'applications'].includes(section.value) && Boolean(selected.value?.id))
async function deleteSelected() {
  if (!selected.value || !canDeleteSelected.value) return
  const record = selected.value
  const isJob = section.value === 'jobs'
  const confirmed = await requestDialog({ title: isJob ? 'Eliminar oferta' : 'Eliminar postulación', message: isJob ? 'Esta acción es permanente. Solo se eliminarán ofertas sin postulaciones ni historial de moderación.' : 'Esta acción es permanente y también elimina el historial de estados de esta postulación.', confirmLabel: 'Eliminar registro', danger: true })
  if (!confirmed) return
  busyAction.value = true
  try {
    await request(`/api/admin/records/${section.value}/${encodeURIComponent(record.id)}`, { method: 'DELETE' })
    selected.value = null
    await load()
    notify('Registro eliminado', 'La eliminación quedó anotada en la auditoría administrativa.')
  } catch (cause) {
    notify('No se pudo eliminar', cause instanceof Error ? cause.message : 'Inténtalo de nuevo.', 'error')
  } finally {
    busyAction.value = false
  }
}
function actionOptions(row: Row): [string, string, string][] {
  const actions = (...items: [string, string, string][]) => items
  if (section.value === 'users' && row.id === auth.user?.id) return []
  if (section.value === 'users' && auth.user?.role === 'ADMIN' && row.role === 'ADMIN') return []
  if (section.value === 'reports' && ['PENDING', 'IN_REVIEW'].includes(row.status)) return actions(['report', 'IN_REVIEW', 'Tomar revisión'], ['report', 'RESOLVED', 'Resolver reporte'], ['report', 'REJECTED', 'Rechazar reporte'])
  if (section.value === 'companies') {
    const options: [string, string, string][] = row.verificationStatus === 'PENDING' ? [['company', 'VERIFIED', 'Verificar empresa'], ['company', 'REJECTED', 'Rechazar verificación']] : []
    const accountStatus = row.owner?.status ?? 'ACTIVE'
    if (accountStatus === 'ACTIVE') options.push(['company', 'SUSPENDED', 'Suspender empresa'], ['company', 'BANNED', 'Bloquear empresa'])
    else if (accountStatus === 'SUSPENDED') options.push(['company', 'ACTIVE', 'Reactivar empresa'], ['company', 'BANNED', 'Bloquear empresa'])
    else options.push(['company', 'ACTIVE', 'Reactivar empresa'])
    return options
  }
  if (section.value === 'jobs') return actions(['job', 'PAUSED', 'Pausar oferta'], ['job', 'CLOSED', 'Cerrar oferta'], ['job', 'REMOVED', 'Retirar oferta']).filter(([, state]) => row.status !== state)
  if (section.value === 'users') {
    const options: [string, string, string][] = row.status === 'ACTIVE'
      ? [['user', 'SUSPENDED', 'Suspender usuario'], ['user', 'BANNED', 'Bloquear usuario']]
      : row.status === 'SUSPENDED'
        ? [['user', 'ACTIVE', 'Reactivar usuario'], ['user', 'BANNED', 'Bloquear usuario']]
        : [['user', 'ACTIVE', 'Reactivar usuario']]
    if (auth.user?.role === 'SUPERADMIN' && row.role !== 'SUPERADMIN') options.push(['role', row.role === 'ADMIN' ? (row.companyProfile?.id ? 'COMPANY' : 'CANDIDATE') : 'ADMIN', row.role === 'ADMIN' ? 'Revocar rol ADMIN' : 'Designar ADMIN'])
    return options
  }
  return []
}
function signOut() { void authApi.logout().finally(() => { auth.user = null; router.replace('/auth') }) }
watch([section, page, pageSize], () => void load())
watch([status, userRole, verified, explorerModel], () => {
  if (page.value !== 1) page.value = 1
  else void load()
})
let searchDebounce: ReturnType<typeof setTimeout>
let globalSearchDebounce: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    if (page.value !== 1) page.value = 1
    else void load()
  }, 250)
})
watch(density, value => localStorage.setItem('jw-admin-density', value))
watch(globalQuery, () => { clearTimeout(globalSearchDebounce); globalSearchDebounce = setTimeout(() => void globalSearch(), 200) })
onMounted(async () => { if (!auth.user) await auth.hydrateSession(); if (!auth.user || !['ADMIN', 'SUPERADMIN'].includes(auth.user.role)) { router.replace('/'); return } restoreAdminPreferences(); updateRetroClock(); retroClockTimer = setInterval(updateRetroClock, 30_000); await load() })
onUnmounted(() => { if (retroClockTimer) clearInterval(retroClockTimer) })
</script>

<template>
  <div class="control-shell" :class="[`is-${density}`, { 'is-retro': retroTheme && canUseRetroTheme }]">
    <aside class="control-sidebar">
      <a class="control-brand" href="/" aria-label="Jinowork"><img src="/images/brand/isotipo.svg" alt=""><span>Jino<span>work</span><small>CONTROL</small></span></a>
      <nav class="control-nav" aria-label="Navegación de administración">
        <template v-for="group in [...new Set(sections.map(item => item.group))]" :key="group">
          <p class="nav-group">{{ group }}</p>
          <button v-for="item in sections.filter(entry => entry.group === group)" :key="item.id" class="nav-item" :class="{ active: section === item.id }" :aria-label="item.label" :title="item.label" :data-tooltip="`Abrir ${item.label.toLowerCase()}`" @click="go(item.id)"><span class="nav-icon"><component :is="item.icon" :size="18" :stroke-width="1.8" aria-hidden="true" /></span><span class="nav-label">{{ item.label }}</span><b v-if="item.id === 'reports' && overview?.metrics.pendingReports">{{ overview.metrics.pendingReports }}</b></button>
        </template>
      </nav>
      <button class="sidebar-user" @click="openProfile"><span class="avatar"><img v-if="profilePhoto && canUseRetroTheme" :src="profilePhoto" alt=""><span v-else>{{ profileName[0]?.toUpperCase() }}</span></span><span class="user-meta"><b>{{ profileName }}</b><small>{{ adminRoleLabel }} · Mi perfil</small></span><span class="profile-open-mark" aria-hidden="true">›</span></button>
      <button class="sidebar-logout" @click="signOut"><LogOut :size="16" aria-hidden="true" /> Cerrar sesión</button>
    </aside>

    <main class="control-main">
      <header class="control-topbar"><div class="crumb"><span>JINOWORK</span><i>/</i><b>{{ heading }}</b></div><div class="top-actions"><div class="global-search-wrap" @focusout="closeGlobalSearch"><label class="top-search" data-tooltip="Busca usuarios, empresas, ofertas y reportes"><Search :size="18" :stroke-width="1.8" aria-hidden="true" /><input id="global-search" v-model="globalQuery" placeholder="Buscar en Jinowork…" @focus="globalOpen = true"></label><div v-if="globalOpen && globalQuery.length >= 2" class="global-results"><template v-for="group in globalGroups" :key="group.type"><span>{{ group.label }}</span><button v-for="item in group.items" :key="item.id" @click="openGlobalResult(group.type,item)"><b>{{ item.email ?? item.name ?? item.title ?? item.reason }}</b><small>{{ item.id }} · {{ item.status ?? item.role ?? item.verificationStatus }}</small></button></template><p v-if="!globalGroups.length">Sin coincidencias.</p></div></div><button class="icon-action" :aria-label="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" :data-tooltip="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" @click="toggleTheme"><Sun v-if="theme === 'dark'" :size="18" aria-hidden="true" /><Moon v-else :size="18" aria-hidden="true" /></button><button class="icon-action mobile-signout" aria-label="Cerrar sesión" title="Cerrar sesión" @click="signOut"><LogOut :size="18" aria-hidden="true" /></button><button class="top-avatar top-profile-button" type="button" :data-tooltip="`Mi perfil: ${profileName}`" aria-label="Abrir mi perfil" @click="openProfile"><img v-if="profilePhoto && canUseRetroTheme" :src="profilePhoto" alt=""><span v-else>{{ profileName[0]?.toUpperCase() }}</span></button></div></header>
      <section class="control-content">
        <div class="page-heading"><div><div class="eyebrow">CONSOLA DE ADMINISTRACIÓN <span class="live-dot"></span> SISTEMA ACTIVO</div><h1>{{ heading }}</h1><p v-if="section === 'overview'">Prioridades y actividad reciente de la plataforma.</p><p v-else-if="section === 'explorer'">Inspección de registros permitidos; los campos sensibles están excluidos.</p><p v-else-if="section === 'stats'">Tendencias calculadas desde los snapshots guardados.</p><p v-else>Consulta datos reales, revisa relaciones y ejecuta acciones autorizadas.</p></div><div class="heading-tools"><button v-if="section !== 'overview' && section !== 'stats'" class="btn-secondary" data-tooltip="Descarga las filas visibles en formato CSV" @click="exportCsv">↓ Exportar página CSV</button><button v-if="resource[section]" class="btn-secondary" data-tooltip="Guarda los filtros y el orden actuales en este navegador" @click="saveView">＋ Guardar vista</button><button class="btn-primary" data-tooltip="Vuelve a consultar los datos del servidor" @click="load">↻ Actualizar</button></div></div>

        <AppMessage v-if="error" variant="error" title="Se produjo un problema" :message="error"><template #actions><button type="button" @click="load">Reintentar</button></template></AppMessage>

        <template v-if="section === 'overview'">
          <div class="metric-grid" v-if="overview"><button class="metric-card" data-tooltip="Abre la lista completa de cuentas y sus estados" @click="go('users')"><span>USUARIOS</span><b>{{ overview.metrics.users.toLocaleString('es-NI') }}</b><small>Registros de cuenta</small><i><Users :size="18" :stroke-width="1.8" aria-hidden="true" /></i></button><button class="metric-card" data-tooltip="Revisa empresas y sus solicitudes de verificación" @click="go('companies')"><span>EMPRESAS</span><b>{{ overview.metrics.companies.toLocaleString('es-NI') }}</b><small>{{ overview.metrics.pendingCompanies }} pendientes de revisión</small><i><Building2 :size="18" :stroke-width="1.8" aria-hidden="true" /></i></button><button class="metric-card" data-tooltip="Consulta las ofertas y su estado de publicación" @click="go('jobs')"><span>OFERTAS</span><b>{{ overview.metrics.jobs.toLocaleString('es-NI') }}</b><small>Ver todas las ofertas</small><i><BriefcaseBusiness :size="18" :stroke-width="1.8" aria-hidden="true" /></i></button><button class="metric-card" data-tooltip="Revisa postulaciones y sus etapas" @click="go('applications')"><span>POSTULACIONES</span><b>{{ overview.metrics.applications.toLocaleString('es-NI') }}</b><small>Revisar actividad</small><i><FileText :size="18" :stroke-width="1.8" aria-hidden="true" /></i></button></div>
          <section v-if="auth.user?.role === 'SUPERADMIN'" class="surface-block invite-admin-block">
            <div class="block-heading"><div><div class="eyebrow">ACCESO ADMINISTRATIVO</div><h2>Crear cuenta ADMIN</h2></div><span class="invite-admin-badge">Solo superadmin</span></div>
            <p>Crearemos una cuenta ADMIN activa y enviaremos una contraseña aleatoria inicial a ese correo.</p>
            <form class="invite-admin-form" novalidate @submit.prevent="inviteAdmin"><label><span>Correo electrónico</span><input v-model="invitationEmail" type="email" autocomplete="email" maxlength="254" placeholder="admin@ejemplo.com" required /></label><button class="btn-primary" type="submit" :disabled="invitationBusy">{{ invitationBusy ? 'Creando y enviando…' : 'Crear cuenta ADMIN →' }}</button></form>
            <small>Usa una dirección nueva que la persona pueda abrir. No compartas la contraseña por otro canal ni la guardes en el panel.</small>
          </section>
          <div class="overview-grid"><section class="surface-block attention-block"><div class="block-heading"><div><div class="eyebrow">REQUIERE ATENCIÓN</div><h2>Cola de revisión</h2></div><button class="text-link" @click="go('reports')">Abrir moderación →</button></div><div v-if="overview?.attention?.length" class="attention-list"><button v-for="item in overview.attention" :key="item.id" @click="go('reports')"><span class="attention-mark"><Flag :size="18" aria-hidden="true" /></span><span><b>{{ item.reason.replaceAll('_', ' ') }}</b><small>{{ item.reporter.email }} · {{ pretty(item.createdAt) }}</small></span><span class="status-pill" :class="item.status.toLowerCase()">{{ item.status }}</span></button></div><div v-else class="empty-inline"><span><Check :size="18" aria-hidden="true" /></span><b>Sin reportes pendientes</b><small>La cola de moderación está al día.</small></div><div class="attention-foot"><span class="attention-count">{{ overview?.metrics.pendingReports ?? 0 }}</span><span><b>Reportes pendientes</b><small>Incluye casos nuevos y en revisión</small></span><button @click="go('reports')">Revisar →</button></div></section><section class="surface-block activity-block"><div class="block-heading"><div><div class="eyebrow">TRAZABILIDAD</div><h2>Actividad administrativa</h2></div><button class="text-link" @click="go('audit')">Ver auditoría →</button></div><div v-if="overview?.recentAudit?.length" class="activity-list"><div v-for="event in overview.recentAudit" :key="event.id" class="activity-row"><span class="activity-icon"><Activity :size="18" aria-hidden="true" /></span><div><b>{{ event.actionType.replaceAll('_', ' ') }}</b><small>{{ event.actor?.email ?? 'Sistema' }} · {{ event.entityType }} · {{ event.entityId.slice(0, 8) }}</small></div><time>{{ pretty(event.createdAt) }}</time></div></div><div v-else class="empty-inline"><span><Clock3 :size="18" aria-hidden="true" /></span><b>Aún no hay actividad registrada</b><small>Los cambios administrativos aparecerán aquí.</small></div></section></div>
          <section class="quick-strip"><div><div class="eyebrow">ACCESO RÁPIDO</div><b>Ir directamente a una tarea</b></div><button data-tooltip="Abre la gestión de cuentas" @click="go('users')"><Users :size="18" aria-hidden="true" />Gestionar usuarios <span aria-hidden="true">→</span></button><button data-tooltip="Abre la cola de verificaciones de empresa" @click="go('companies')"><Building2 :size="18" aria-hidden="true" />Verificar empresas <span aria-hidden="true">→</span></button><button data-tooltip="Abre la cola de moderación de reportes" @click="go('reports')"><Flag :size="18" aria-hidden="true" />Resolver reportes <span aria-hidden="true">→</span></button></section>
        </template>

        <template v-else-if="section === 'stats'">
          <div class="period-picker"><label>Desde <input v-model="statsFrom" type="date" @change="load"></label><label>Hasta <input v-model="statsTo" type="date" @change="load"></label><span>Máximo 366 días · datos agregados de la base</span></div>
          <div class="stats-summary" v-if="stats"><div><span>DESDE</span><b>{{ pretty(stats.from) }}</b></div><div><span>HASTA</span><b>{{ pretty(stats.to) }}</b></div><div><span>USUARIOS CREADOS</span><b>{{ stats.created.users }}</b></div><div><span>OFERTAS NUEVAS</span><b>{{ stats.created.jobs }}</b></div><div><span>POSTULACIONES</span><b>{{ stats.created.applications }}</b></div><div><span>EVENTOS DE AUDITORÍA</span><b>{{ stats.auditEvents }}</b></div></div>
          <section class="surface-block table-block"><div class="block-heading"><div><div class="eyebrow">SNAPSHOTS DIARIOS</div><h2>Actividad por fecha</h2></div><span class="data-note">Sin datos de snapshot se muestra una tabla vacía.</span></div><div class="table-scroll"><table><thead><tr><th>FECHA</th><th>VISTAS</th><th>VISTAS ÚNICAS</th><th>POSTULACIONES</th><th>GUARDADOS</th></tr></thead><tbody><tr v-for="row in stats?.dailyJobs" :key="row.date"><td>{{ pretty(row.date) }}</td><td>{{ row._sum.views ?? 0 }}</td><td>{{ row._sum.uniqueViews ?? 0 }}</td><td>{{ row._sum.applications ?? 0 }}</td><td>{{ row._sum.savedCount ?? 0 }}</td></tr><tr v-if="!stats?.dailyJobs?.length"><td colspan="5" class="empty-cell">No hay snapshots para este periodo.</td></tr></tbody></table></div></section>
        </template>

        <template v-else>
          <section class="surface-block records-block">
            <div class="records-toolbar"><div class="toolbar-left"><label class="search-box" data-tooltip="Filtra las filas de esta sección"><Search :size="18" :stroke-width="1.8" aria-hidden="true" /><input id="admin-search" v-model="search" :placeholder="`Buscar ${heading.toLowerCase()}…`"></label><select v-if="section !== 'audit'" v-model="status" aria-label="Filtrar por estado"><option value="">Todos los estados</option><option v-for="state in (section === 'users' ? ['ACTIVE','SUSPENDED','BANNED'] : section === 'companies' ? ['PENDING','VERIFIED','REJECTED'] : section === 'jobs' ? ['DRAFT','PUBLISHED','PAUSED','CLOSED','REMOVED'] : section === 'applications' ? ['RECEIVED','IN_REVIEW','SHORTLISTED','INTERVIEW','SELECTED','REJECTED','WITHDRAWN'] : ['PENDING','IN_REVIEW','RESOLVED','REJECTED'])" :key="state" :value="state">{{ state.replaceAll('_', ' ') }}</option></select><select v-if="section === 'explorer'" v-model="explorerModel" aria-label="Modelo"><option value="users">Usuarios</option><option value="jobs">Ofertas</option><option value="applications">Postulaciones</option><option value="reports">Reportes</option><option value="audit">Auditoría</option><option value="members">CompanyMember</option><option value="moderation">ModerationAction</option><option value="companyStats">CompanyDailyStats</option><option value="jobStats">JobDailyStats</option></select></div><div class="toolbar-right"><details class="column-picker" v-if="allColumns.length"><summary data-tooltip="Elige qué columnas se muestran"><Columns3 :size="16" aria-hidden="true" /> Columnas</summary><label v-for="column in allColumns" :key="column"><input type="checkbox" :checked="columns.includes(column)" @change="toggleColumn(column)">{{ column }}</label></details><select v-model="density" aria-label="Densidad de tabla" title="Ajusta el espacio vertical de las filas"><option value="comfortable">Densidad cómoda</option><option value="compact">Densidad compacta</option></select><select v-model.number="pageSize" aria-label="Filas por página" title="Elige cuántas filas cargar por página"><option :value="25">25 filas</option><option :value="50">50 filas</option><option :value="100">100 filas</option></select></div></div>
            <section v-if="section === 'explorer' && explorerModels.find(model => model.id === explorerModel)" class="schema-info"><div><span class="eyebrow">MODEL AND RELATIONS</span><b>{{ explorerModels.find(model => model.id === explorerModel).label }}</b></div><div><small>Fields</small><span v-for="field in explorerModels.find(model => model.id === explorerModel).fields" :key="field[0]" class="schema-chip"><code>{{ field[0] }}</code> {{ field[1] }}</span></div><div><small>Relations</small><span v-for="relation in explorerModels.find(model => model.id === explorerModel).relations" :key="relation" class="schema-chip">{{ relation }}</span></div></section><div v-if="section === 'users'" class="user-extra-filters"><span>FILTROS DE CUENTA</span><select v-model="userRole" aria-label="Filtrar por rol"><option value="">Todos los roles</option><option value="CANDIDATE">Candidato</option><option value="COMPANY">Empresa</option><option value="ADMIN">Administrador</option><option v-if="auth.user?.role === 'SUPERADMIN'" value="SUPERADMIN">Superadministrador</option></select><select v-model="verified" aria-label="Filtrar por verificación de correo"><option value="">Cualquier verificación</option><option value="yes">Correo verificado</option><option value="no">Pendiente de verificación</option></select></div>
            <div v-if="savedViews.length" class="saved-views"><span>VISTAS</span><button v-for="view in savedViews" :key="view" @click="applyView(view)">{{ JSON.parse(view).title }}</button></div>
            <AppMessage v-if="loading" variant="loading" message="Cargando registros…" />
            <div v-else class="table-scroll"><table><thead><tr><th v-for="column in columns" :key="column" class="sortable" @click="toggleSort(column)">{{ column.replaceAll('.', ' / ').replace(/([A-Z])/g, ' $1').toUpperCase() }}</th><th class="action-col">DETALLE</th></tr></thead><tbody><tr v-for="(row, index) in rows" :key="row.id ?? index" :class="{ 'selected-row': selected?.id === row.id }" @click="selected = selected?.id === row.id ? null : row"><td v-for="column in columns" :key="column"><span v-if="column.toLowerCase().includes('status') || column.toLowerCase() === 'role'" class="status-pill" :class="String(row[column]).toLowerCase()">{{ pretty(row[column]) }}</span><span v-else-if="column === 'email'">{{ pretty(row[column]) }}</span><span v-else>{{ pretty(row[column]) }}</span></td><td class="action-col"><button class="row-open" data-tooltip="Abre el detalle y las acciones disponibles" @click.stop="selected = row">Inspeccionar ↗</button></td></tr><tr v-if="!rows.length"><td :colspan="columns.length + 1" class="empty-cell"><span><Search :size="18" aria-hidden="true" /></span><b>No se encontraron registros</b><small>Prueba otra búsqueda o cambia los filtros.</small></td></tr></tbody></table></div>
            <footer class="table-footer"><span>{{ total ? `${((page - 1) * pageSize + 1).toLocaleString('es-NI')}–${Math.min(page * pageSize, total).toLocaleString('es-NI')} de ${total.toLocaleString('es-NI')} registros` : '0 registros' }}</span><div><button :disabled="page <= 1" @click="page--">← Anterior</button><span>Página {{ page }}</span><button :disabled="page * pageSize >= total" @click="page++">Siguiente →</button></div></footer>
          </section>
        </template>
      </section>
    </main>

    <Teleport to="body">
      <div v-if="selected" class="inspector-backdrop" @click.self="selected = null"><aside ref="inspector" class="record-inspector" :class="{ 'is-retro': retroTheme && canUseRetroTheme }" role="dialog" aria-modal="true" aria-labelledby="inspector-title" tabindex="-1" @keydown="trapInspectorFocus"><header><div><span class="eyebrow">INSPECTOR DE REGISTRO</span><h2 id="inspector-title">{{ selected.name ?? selected.title ?? selected.email ?? selected.id }}</h2></div><button class="icon-action" aria-label="Cerrar inspector" @click="selected = null">×</button></header><p class="record-id">{{ selected.id }}</p><div class="inspector-actions" v-if="actionOptions(selected).length || canDeleteSelected"><span>ACCIONES DISPONIBLES</span><button v-for="[kind, value, label] in actionOptions(selected)" :key="value" :class="{ danger: ['BANNED','REMOVED','REJECTED','DISMISSED'].includes(value) }" :disabled="busyAction" @click="act(kind, value)">{{ label }} →</button><button v-if="canDeleteSelected" class="danger" :disabled="busyAction" @click="deleteSelected">Eliminar registro permanentemente →</button></div><div class="record-fields"><div v-for="[key,value] in Object.entries(flatten(selected))" :key="key"><small>{{ key.replaceAll('.', ' / ') }}</small><b>{{ pretty(value) }}</b></div></div><div class="inspector-note">La vista y las acciones disponibles dependen de los permisos validados por el servidor. La auditoría y los reportes se conservan.</div></aside></div>
    </Teleport>

    <Teleport to="body">
      <div v-if="profileOpen" class="admin-profile-backdrop" @click.self="cancelProfile"><section class="admin-profile" :class="{ 'is-retro': retroTheme && canUseRetroTheme }" role="dialog" aria-modal="true" aria-labelledby="admin-profile-title"><header class="admin-profile__header"><div><span class="eyebrow">CUENTA ADMINISTRATIVA</span><h2 id="admin-profile-title">Mi perfil</h2><p>Personaliza la apariencia de tu espacio de trabajo.</p></div><button class="admin-profile__close" type="button" aria-label="Cerrar perfil" @click="cancelProfile">×</button></header><div class="admin-profile__identity"><div class="admin-profile__avatar"><img v-if="profilePhoto && canUseRetroTheme" :src="profilePhoto" alt="Foto de perfil"><span v-else>{{ profileName.slice(0, 1).toUpperCase() }}</span></div><div><span class="admin-profile__role">{{ adminRoleLabel }}</span><strong>{{ profileName }}</strong><small>{{ adminEmail }}</small></div><div v-if="canUseRetroTheme" class="admin-profile__photo-actions"><input ref="profileFileInput" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" @change="changeProfilePhoto"><button class="btn-secondary" type="button" @click="profileFileInput?.click()">Cambiar foto</button><button v-if="profilePhoto" class="admin-profile__remove" type="button" @click="profilePhoto = null">Quitar</button></div><p v-else class="admin-profile__photo-note">Las fotos de perfil están disponibles únicamente para superadministración.</p></div><div class="admin-profile__fields"><label><span>Nombre para mostrar</span><input v-model="profileDisplayName" maxlength="60" placeholder="Tu nombre"></label><div><span>Correo de la cuenta</span><strong>{{ adminEmail }}</strong></div><div><span>Estado de la cuenta</span><strong>{{ pretty(auth.user?.status) }}</strong></div></div><section v-if="canUseRetroTheme" class="admin-profile__theme"><div><span>APARIENCIA EXPERIMENTAL</span><strong>Tema retro de escritorio</strong><small>Ventanas en relieve, barra de tareas y menú de inicio clásicos.</small></div><label class="admin-profile__switch"><input type="checkbox" :checked="retroTheme" @change="toggleRetroTheme"><span>{{ retroTheme ? 'Activado' : 'Desactivado' }}</span></label></section><p class="admin-profile__storage-note">Tu nombre y foto se guardan solo en este navegador.</p><footer><button class="btn-secondary" type="button" @click="cancelProfile">Cancelar</button><button class="btn-primary" type="button" @click="saveProfile">Guardar perfil</button></footer></section></div>
    </Teleport>
    <footer v-if="retroTheme && canUseRetroTheme" class="retro-taskbar"><button class="retro-start" type="button" :aria-expanded="retroStartOpen" @click="retroStartOpen = !retroStartOpen"><span class="retro-start-mark" aria-hidden="true">J</span> Inicio</button><button class="retro-task-app" type="button" @click="go('overview')"><span aria-hidden="true">▣</span> Jinowork Control — {{ heading }}</button><span class="retro-task-clock">{{ retroClock }}</span><nav v-if="retroStartOpen" class="retro-start-menu" aria-label="Menú de inicio"><div class="retro-start-menu__brand">JINOWORK <small>CONTROL</small></div><button v-for="item in [{ id: 'overview', label: 'Centro de operaciones' }, { id: 'reports', label: 'Moderación' }, { id: 'companies', label: 'Empresas' }, { id: 'users', label: 'Usuarios' }]" :key="item.id" type="button" @click="go(item.id as Section); retroStartOpen = false">{{ item.label }}<span>›</span></button><button type="button" @click="openProfile(); retroStartOpen = false">Mi perfil<span>›</span></button><button type="button" @click="signOut">Cerrar sesión<span>›</span></button></nav></footer>
    <div v-if="activeDialog" class="admin-dialog-backdrop" @click.self="finishDialog(null)"><section ref="dialogElement" class="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-dialog-title" aria-describedby="admin-dialog-message" tabindex="-1" @keydown="trapDialogFocus"><span class="eyebrow">CONSOLA DE ADMINISTRACIÓN</span><h2 id="admin-dialog-title">{{ activeDialog.title }}</h2><p id="admin-dialog-message">{{ activeDialog.message }}</p><label v-if="activeDialog.inputLabel" class="admin-dialog-field"><span>{{ activeDialog.inputLabel }}</span><input ref="dialogInputElement" v-model="dialogInput" :placeholder="activeDialog.placeholder" :required="activeDialog.required" maxlength="2000" @keydown.enter.prevent="!activeDialog.required || dialogInput.trim() ? finishDialog(dialogInput) : undefined"></label><div class="admin-dialog-actions"><button class="btn-secondary" @click="finishDialog(null)">Cancelar</button><button :class="activeDialog.danger ? 'btn-danger' : 'btn-primary'" :disabled="activeDialog.required && !dialogInput.trim()" @click="finishDialog(dialogInput)">{{ activeDialog.confirmLabel }}</button></div></section></div>
  </div>
</template>





