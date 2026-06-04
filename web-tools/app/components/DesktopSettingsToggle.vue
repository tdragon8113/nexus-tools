<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label
    class="inline-flex cursor-pointer select-none items-center active:opacity-90"
    :class="[
      compact ? 'min-h-0 py-0' : 'min-h-[44px] gap-3 px-3.5 py-1.5 active:bg-slate-100/80',
      disabled && 'pointer-events-none opacity-50'
    ]"
  >
    <span
      v-if="label && !compact"
      class="nexus-settings-field-label min-w-0 flex-1 text-[13px] leading-snug"
    >
      {{ label }}
    </span>
    <span class="relative inline-flex h-[31px] w-[51px] shrink-0 items-center">
      <input
        type="checkbox"
        class="nexus-switch-input peer sr-only"
        :checked="modelValue"
        :disabled="disabled"
        :aria-label="label || '开关'"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <span
        class="nexus-switch-track absolute inset-0 rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/25"
        aria-hidden="true"
      />
      <span
        class="nexus-switch-thumb absolute left-[2px] h-[27px] w-[27px] rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] transition-transform duration-200 ease-out peer-checked:translate-x-[20px]"
        aria-hidden="true"
      />
    </span>
  </label>
</template>
