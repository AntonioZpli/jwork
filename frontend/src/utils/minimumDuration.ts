export async function waitForMinimumDuration(startedAt: number, durationMs: number) {
  const remaining = durationMs - (performance.now() - startedAt)
  if (remaining > 0) await new Promise<void>(resolve => window.setTimeout(resolve, remaining))
}
