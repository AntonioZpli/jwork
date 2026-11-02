<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import PublicJobDialog from '@/components/jobs/PublicJobDialog.vue'
import ToastViewport from '@/components/ui/ToastViewport.vue'

useTheme()
const selectedJobId = ref<string | null>(null)
function openJobDialog(event: Event) {
  const id = (event as CustomEvent<string>).detail
  if (id) selectedJobId.value = id
}
onMounted(() => window.addEventListener('jinowork:open-job', openJobDialog))
onBeforeUnmount(() => window.removeEventListener('jinowork:open-job', openJobDialog))
</script>

<template>
  <div class="app-shell">
    <RouterView />
    <PublicJobDialog :oob-id="selectedJobId" @close="selectedJobId = null" />
    <ToastViewport />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}
</style>
