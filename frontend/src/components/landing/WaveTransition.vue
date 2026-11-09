<script setup lang="ts">
withDefaults(defineProps<{
  fillColor: string
  highlightColor?: string
  placement?: 'hero' | 'footer'
}>(), {
  highlightColor: '#ffffff',
  placement: 'hero',
})
</script>

<template>
  <div
    :class="['wave-transition', `wave-transition--${placement}`]"
    :style="{ '--wave-fill': fillColor, '--wave-highlight': highlightColor }"
    aria-hidden="true"
  >
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
      <path class="wave-transition__fill" d="M0 101C235 112 432 112 670 101C932 88 1148 82 1440 73V120H0Z" />
    </svg>
  </div>
</template>

<style scoped>
.wave-transition {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  z-index: 4;
  height: clamp(64px, 8vw, 110px);
  pointer-events: none;
}

.wave-transition--footer { bottom:calc(100% - 1px);z-index:0; }

.wave-transition svg { display:block;width:100%;height:100%; }
.wave-transition__fill { fill:var(--wave-fill); }
</style>
