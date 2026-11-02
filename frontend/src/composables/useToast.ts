import { readonly, ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'
export interface ToastItem {
  id: number
  title: string
  message?: string
  variant: ToastVariant
}

const items = ref<ToastItem[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 1

function dismiss(id: number) {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  items.value = items.value.filter(item => item.id !== id)
}

function notify(title: string, message?: string, variant: ToastVariant = 'success', duration = 4500) {
  while (items.value.length >= 4) dismiss(items.value[0]?.id ?? -1)
  const id = nextId++
  items.value.push({ id, title, message, variant })
  const timeout = variant === 'error' ? Math.max(duration, 6500) : duration
  timers.set(id, setTimeout(() => dismiss(id), timeout))
  return id
}

export function useToast() {
  return { toasts: readonly(items), notify, dismiss }
}
