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

// Keep one document synchronizer for the whole app so direct routes (including
// /admin, verification and password reset) always restore the saved theme.
watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme.value)
    } catch {
      // localStorage may be unavailable in private browsing.
    }
  }
})

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

/**
 * Centralized theme composable.
 * Returns the shared theme state and its toggle action.
 */
export function useTheme() {
  return { theme, toggleTheme }
}
