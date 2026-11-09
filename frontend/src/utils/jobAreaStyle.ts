/** Shared brand accent for vacancy and profile marks. */
export function jobAreaStyle(_area: string | null | undefined, _vacancyId?: string | null) {
  const accent = '#2f5f52'
  return { '--job-accent': accent, '--oob-accent': accent }
}
