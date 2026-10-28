<script setup lang="ts">
import AppIconButton from '@/components/ui/AppIconButton.vue'
import { Moon, Sun } from '@lucide/vue'

defineProps<{
  items: { label: string; href: string }[]
  open: boolean
  theme: 'light' | 'dark'
}>()

const emit = defineEmits<{
  close: []
  toggleTheme: []
}>()
</script>

<template>
  <div
    id="mobile-menu"
    class="mobile-menu"
    :class="{ 'mobile-menu--open': open }"
    :aria-hidden="!open"
  >
    <ul class="mobile-menu__links" role="list">
      <li v-for="item in items" :key="item.href">
        <a :href="item.href" class="mobile-menu__link" @click="emit('close')">{{ item.label }}</a>
      </li>
      <li class="mobile-menu__divider" aria-hidden="true" />
      <li>
        <a href="/auth" class="mobile-menu__link" @click="emit('close')">Iniciar sesión</a>
      </li>
      <li>
        <a href="/auth" class="mobile-menu__link mobile-menu__link--accent" @click="emit('close')">Regístrate ↗</a>
      </li>
    </ul>
    <div class="mobile-menu__footer">
      <AppIconButton
        :label="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        @click="emit('toggleTheme')"
      >
        <Sun v-if="theme === 'dark'" :size="17" />
        <Moon v-else :size="17" />
      </AppIconButton>
    </div>
  </div>
</template>

<style scoped>
.mobile-menu {
  display: none;
  overflow: hidden;
}

.mobile-menu--open {
  display: block;
  border-top: 1px solid var(--border);
  padding: 0.75rem 0 1rem;
}

.mobile-menu__links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.mobile-menu__link {
  display: block;
  padding: 0.65rem 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--foreground);
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.18s ease;
}

.mobile-menu__link:hover {
  background: var(--panel);
}

.mobile-menu__link:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

.mobile-menu__link--accent {
  color: var(--primary);
  font-weight: 700;
}

.mobile-menu__divider {
  height: 1px;
  background: var(--border);
  margin: 0.5rem 0;
}

.mobile-menu__footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu__link {
    transition: none;
  }
}
</style>
