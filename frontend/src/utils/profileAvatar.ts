import { jobAreaStyle } from './jobAreaStyle'

/** A consistent two-letter mark for people and organizations. */
export function profileInitials(name: string | null | undefined) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  return words.slice(0, 2).map(word => Array.from(word)[0]?.toLocaleUpperCase('es') ?? '').join('')
}

/** Stable category color, shared by profile photo fallbacks. */
export function profileAvatarStyle(name: string | null | undefined, category?: string | null) {
  return jobAreaStyle(category?.trim() || name?.trim() || 'perfil')
}
