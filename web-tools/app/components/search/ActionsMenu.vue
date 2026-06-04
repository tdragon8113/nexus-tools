<script setup lang="ts">
import type { SearchPanelAction } from '~/composables/useDesktopSearchPanel'

defineProps<{
  open: boolean
  actions: SearchPanelAction[]
  activeIndex: number
}>()

const emit = defineEmits<{
  close: []
  pick: [action: SearchPanelAction]
  'update:activeIndex': [index: number]
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="nexus-raycast-actions-backdrop fixed inset-0 z-[100] flex items-end justify-center pb-16"
      style="-webkit-app-region: no-drag"
      @mousedown.self="emit('close')"
    >
      <div
        class="nexus-raycast-actions-menu w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-2xl"
        role="menu"
        aria-label="Actions"
      >
        <p class="nexus-raycast-text-tertiary nexus-raycast-border-b px-3 py-2 text-[11px] font-medium uppercase tracking-wide">
          Actions
        </p>
        <button
          v-for="(action, index) in actions"
          :key="action.id"
          type="button"
          role="menuitem"
          class="nexus-raycast-actions-item nexus-raycast-text-primary flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors"
          :class="index === activeIndex ? 'is-active' : ''"
          @mouseenter="emit('update:activeIndex', index)"
          @mousedown.prevent="emit('pick', action)"
        >
          <span>{{ action.label }}</span>
          <kbd v-if="action.shortcut" class="nexus-raycast-kbd">{{ action.shortcut }}</kbd>
        </button>
      </div>
    </div>
  </Teleport>
</template>
