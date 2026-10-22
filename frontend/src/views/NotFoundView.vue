<template>
  <main class="not-found">
    <p class="not-found__code">404</p>
    <h1>No encontramos esa página</h1>
    <p>Puede que el enlace haya cambiado o que la dirección esté escrita incorrectamente.</p>
    <RouterLink to="/" class="not-found__link">Volver al inicio</RouterLink>
  </main>
</template>

<style scoped>
.not-found {
  display: grid;
  min-height: 100dvh;
  align-content: center;
  justify-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--foreground);
  background: var(--background);
  text-align: center;
}
.not-found__code { margin: 0; color: var(--primary); font-size: 0.9rem; font-weight: 700; letter-spacing: 0.16em; }
h1 { margin: 0; font-size: clamp(1.7rem, 5vw, 2.5rem); }
.not-found > p:not(.not-found__code) { max-width: 32rem; margin: 0; color: var(--muted-foreground); }
.not-found__link { margin-top: 0.75rem; padding: 0.7rem 1rem; border-radius: 6px; color: white; background: var(--primary); font-weight: 700; }
.not-found__link:focus-visible { outline: 2px solid var(--foreground); outline-offset: 3px; }
</style>
