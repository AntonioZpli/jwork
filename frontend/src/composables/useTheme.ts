import { ref, watchEffect } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'jinowork-theme'

/** Reads stored preference or falls back to OS preference */
function getInitialTheme(): Theme {
  // Avoid accessing window during SSR-like evaluation phases
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Continue with the system preference when storage is unavailable.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(getInitialTheme())

/**
 * Centralized theme composable.
 * Applies `.dark` class to `document.documentElement` and persists preference.
 */
export function useTheme() {
  watchEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme.value === 'dark')
      try {
        localStorage.setItem(STORAGE_KEY, theme.value)
      } catch {
        // localStorage may be unavailable (private mode, etc.)
      }
    }
  })

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
