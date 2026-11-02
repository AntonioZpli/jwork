import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { companyApplicationsApi } from '@/services/companyApplications'
import type { AppRow, AppStatus } from './applicationStatus'
import { messageOf, STATUS, toAppRow } from './applicationStatus'
import { useToast } from '@/composables/useToast'

function queryValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function pageValue(value: unknown): number {
  const parsed = Number(queryValue(value))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export function useApplications() {
  const { notify } = useToast()
  const route = useRoute()
  const router = useRouter()
  const rows = ref<AppRow[]>([])
  const page = ref(1)
  const pages = ref(0)
  const total = ref(0)
  const loading = ref(true)
  const refreshing = ref(false)
  const error = ref('')
  const profile = ref<AppRow | null>(null)
  const busyId = ref<string | null>(null)
  const searchText = ref(queryValue(route.query.q))
  const jobId = computed(() => queryValue(route.params.id) || queryValue(route.query.jobId))
  let requestVersion = 0
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let lastFilterKey: string | null = null

  async function fetchRows(query: typeof route.query) {
    const version = ++requestVersion
    const nextPage = pageValue(query.page)
    const nextJobId = queryValue(route.params.id) || queryValue(query.jobId)
    const nextSearch = queryValue(query.q).trim()
    const hasRows = rows.value.length > 0
    const filterKey = `${nextJobId}\u0000${nextSearch}`
    const filtersChanged = lastFilterKey !== null && lastFilterKey !== filterKey
    lastFilterKey = filterKey

    page.value = nextPage
    searchText.value = nextSearch
    error.value = ''
    if (!hasRows || filtersChanged) {
      loading.value = true
      refreshing.value = false
    } else {
      loading.value = false
      refreshing.value = true
    }

    try {
      const result = await companyApplicationsApi.list(nextJobId || undefined, nextPage, nextSearch)
      if (version !== requestVersion) return
      rows.value = result.applications.map(toAppRow)
      pages.value = result.pages
      total.value = result.total
    } catch (cause) {
      if (version === requestVersion) error.value = messageOf(cause, 'No se pudieron cargar las postulaciones.')
    } finally {
      if (version === requestVersion) {
        loading.value = false
        refreshing.value = false
      }
    }
  }

  // La query es la única fuente de verdad para cargar la lista.
  watch([() => route.query, () => route.params.id], ([query]) => {
    void fetchRows(query)
  }, { immediate: true })

  // Los filtros solo actualizan la URL; el watcher anterior realiza el fetch.
  watch(searchText, search => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const query = {
        ...route.query,
        q: search.trim() || undefined,
        status: undefined,
        page: undefined,
      }
      const currentSearch = queryValue(route.query.q)
      if (query.q !== currentSearch || route.query.status || route.query.page) {
        void router.replace({ query })
      }
    }, 220)
  })

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    requestVersion++
  })

  async function update(application: AppRow, status: AppStatus) {
    if (busyId.value) return
    busyId.value = application.id
    error.value = ''
    try {
      await companyApplicationsApi.updateStatus(application.id, status, '')
      await fetchRows(route.query)
      notify('Estado actualizado', `La candidatura quedó como ${STATUS[status].label.toLocaleLowerCase('es')}.`)
    } catch (cause) {
      notify('No se pudo cambiar el estado', messageOf(cause, 'Inténtalo de nuevo.'), 'error')
    } finally {
      busyId.value = null
    }
  }

  async function undo(application: AppRow) {
    if (busyId.value) return
    busyId.value = application.id
    error.value = ''
    try {
      await companyApplicationsApi.undoStatus(application.id)
      await fetchRows(route.query)
      notify('Estado restaurado', 'La postulación volvió a su etapa anterior.')
    } catch (cause) {
      notify('No se pudo restaurar el estado', messageOf(cause, 'Inténtalo de nuevo.'), 'error')
    } finally {
      busyId.value = null
    }
  }

  function setPage(nextPage: number) {
    void router.push({ query: { ...route.query, page: nextPage > 1 ? String(nextPage) : undefined } })
  }

  function clearFilters() {
    searchText.value = ''
  }

  return { rows, page, pages, total, loading, refreshing, error, profile, busyId, searchText, jobId, update, undo, setPage, clearFilters }
}
