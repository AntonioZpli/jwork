<script setup lang="ts">
interface Props {
  id: string
  label: string
  modelValue: string
  type?: string
  placeholder?: string
  autocomplete?: string
  error?: string
  required?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="app-input">
    <label :for="id" class="app-input__label">{{ label }}</label>
    <div class="app-input__wrap" :class="{ 'app-input__wrap--error': !!error }">
      <span v-if="$slots.icon" class="app-input__icon">
        <slot name="icon" />
      </span>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :aria-describedby="error ? `${id}-error` : undefined"
        :aria-invalid="!!error"
        class="app-input__field"
        :class="{ 'app-input__field--with-icon': $slots.icon }"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="$slots.suffix" class="app-input__suffix">
        <slot name="suffix" />
      </span>
    </div>
    <p v-if="error" :id="`${id}-error`" class="app-input__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.app-input__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.app-input__wrap {
  display: flex;
  align-items: center;
  height: 46px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
  overflow: hidden;
}

.app-input__wrap:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px oklch(from var(--primary) l c h / 0.15);
  outline: none;
}

.app-input__wrap--error {
  border-color: #d9534f;
}

.app-input__wrap--error:focus-within {
  box-shadow: 0 0 0 2px rgba(217, 83, 79, 0.15);
}

.app-input__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.5rem;
  color: var(--muted-foreground);
}

.app-input__suffix {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-right: 0.5rem;
}

.app-input__field {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--foreground);
  font-family: inherit;
  font-size: 0.92rem;
  padding: 0 0.85rem;
  outline: none;
  min-width: 0;
}

.app-input__field--with-icon {
  padding-left: 0;
}

.app-input__field::placeholder {
  color: var(--muted-foreground);
  opacity: 0.6;
}

.app-input__error {
  margin: 0;
  font-size: 0.78rem;
  color: #d9534f;
}
</style>
