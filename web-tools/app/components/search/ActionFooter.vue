<script setup lang="ts">
defineProps<{
  primaryLabel: string
}>()

const emit = defineEmits<{
  openActions: []
}>()
</script>

<template>
  <div class="nexus-raycast-footer flex items-center justify-between gap-3 px-3 py-2.5 text-[11px]" style="-webkit-app-region: no-drag">
    <button
      type="button"
      class="nexus-raycast-text-muted nexus-raycast-btn-ghost inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors"
      @mousedown.prevent
      @click="emit('openActions')"
    >
      Actions
      <kbd class="nexus-raycast-kbd">⌘K</kbd>
    </button>
    <span class="nexus-raycast-text-secondary inline-flex items-center gap-1.5">
      {{ primaryLabel }}
      <kbd class="nexus-raycast-kbd">↵</kbd>
    </span>
  </div>
</template>
