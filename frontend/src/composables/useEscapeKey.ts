import { onMounted, onUnmounted } from 'vue'

/**
 * Calls `handler` when Escape is pressed.
 * Automatically removes the listener when the component unmounts.
 */
export function useEscapeKey(handler: () => void) {
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') handler()
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}
