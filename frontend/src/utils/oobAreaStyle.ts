import { jobAreaStyle } from './jobAreaStyle'

/** Stable, varied palette for a vacancy, keyed by its persisted ID. */
export function oobAreaStyle(area: string | null | undefined, vacancyId?: string | null) {
  return jobAreaStyle(area, vacancyId)
}
