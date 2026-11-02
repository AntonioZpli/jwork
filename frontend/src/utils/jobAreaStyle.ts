/** Shared brand accent for vacancy and profile marks. */
export function jobAreaStyle(_area: string | null | undefined, _vacancyId?: string | null) {
  const accent = '#1769c2'
  return { '--job-accent': accent, '--oob-accent': accent }
}
