<script setup lang="ts">
import { watch } from 'vue'
import { useToast } from '@/composables/useToast'

const props = withDefaults(defineProps<{ message: string; variant?: 'info' | 'success' | 'error' }>(), { variant: 'info' })
const emit = defineEmits<{ dismiss: [] }>()
const { notify } = useToast()

watch(() => props.message, (message) => {
  if (!message) return
  const title = props.variant === 'error' ? 'No se pudo completar' : props.variant === 'success' ? 'Listo' : 'Información'
  notify(title, message, props.variant)
  emit('dismiss')
}, { immediate: true })
</script>

<template><span class="auth-feedback-sr" aria-hidden="true" /></template>

<style scoped>
.auth-feedback-sr{display:none}
</style>
