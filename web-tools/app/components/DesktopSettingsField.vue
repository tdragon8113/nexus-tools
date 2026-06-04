<script setup lang="ts">
defineProps<{
  label: string
  description?: string
  borderTop?: boolean
}>()
</script>

<template>
  <div
    class="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-10"
    :class="borderTop && 'nexus-settings-field-border border-t'"
  >
    <div class="flex min-w-0 items-center gap-2 sm:w-[240px] sm:shrink-0">
      <span class="nexus-settings-field-label text-[13px] font-medium leading-snug">{{ label }}</span>
      <DesktopSettingsHint v-if="description" :text="description" />
    </div>
    <div class="flex min-w-0 flex-1 justify-end">
      <slot />
    </div>
  </div>
</template>
