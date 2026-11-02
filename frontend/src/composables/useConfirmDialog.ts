import { ref } from 'vue'

export type ConfirmDialogState = {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export function useConfirmDialog() {
  const confirmation = ref<ConfirmDialogState | null>(null)
  let resolveConfirmation: ((confirmed: boolean) => void) | null = null

  function askConfirmation(state: ConfirmDialogState) {
    confirmation.value = state
    return new Promise<boolean>(resolve => { resolveConfirmation = resolve })
  }

  function finishConfirmation(confirmed: boolean) {
    confirmation.value = null
    resolveConfirmation?.(confirmed)
    resolveConfirmation = null
  }

  return { confirmation, askConfirmation, finishConfirmation }
}
