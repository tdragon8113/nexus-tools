<script setup lang="ts">
import MacAppIcon from '~/components/MacAppIcon.client.vue'
import type { SearchResultItem } from '~/core/searchResults'

defineProps<{
  item: SearchResultItem
  active: boolean
  dragging: boolean
  sortId?: string
  sortIdx?: number
}>()

const emit = defineEmits<{
  mouseenter: []
  pointerdown: [event: PointerEvent]
  click: []
  contextMenu: [event: MouseEvent]
}>()
</script>

<template>
  <div
    role="option"
    :aria-selected="active"
    :data-sort-id="sortId"
    :data-sort-idx="sortIdx"
    class="nexus-raycast-result-row nexus-raycast-result-row--reorderable flex w-full items-stretch text-left transition-colors"
    :class="[active ? 'is-active' : '', dragging ? 'pointer-events-none opacity-35' : '']"
    @mouseenter="emit('mouseenter')"
    @pointerdown="emit('pointerdown', $event)"
    @contextmenu.prevent="emit('contextMenu', $event)"
  >
    <button
      type="button"
      class="nexus-raycast-result-row__main flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
      @click="emit('click')"
    >
      <MacAppIcon v-if="item.kind === 'mac-app' && item.app" :app-path="item.app.path" />
      <div
        v-else
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        :class="item.bgColor"
      >
        <van-icon :name="item.icon" size="18" :class="item.iconColor" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="nexus-raycast-text-primary nexus-raycast-type-body truncate font-medium">{{ item.title }}</p>
        <p class="nexus-raycast-text-secondary nexus-raycast-type-secondary truncate">{{ item.subtitle }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-1.5">
        <span class="nexus-raycast-text-tertiary nexus-raycast-type-caption">{{ item.badge }}</span>
      </div>
    </button>
    <button
      type="button"
      data-drag-handle
      class="nexus-raycast-drag-handle shrink-0"
      aria-label="拖动排序"
      tabindex="-1"
      @click.stop
    >
      <span class="nexus-raycast-drag-handle__grip" aria-hidden="true">
        <span v-for="dot in 6" :key="dot" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.nexus-raycast-result-row__main {
  background: transparent;
  border: none;
  cursor: pointer;
}

.nexus-raycast-drag-handle {
  display: flex;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: grab;
  touch-action: none;
  user-select: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.nexus-raycast-result-row--reorderable:hover .nexus-raycast-drag-handle,
.nexus-raycast-result-row--reorderable.is-active .nexus-raycast-drag-handle {
  opacity: 1;
}

.nexus-raycast-drag-handle:active {
  cursor: grabbing;
}

.nexus-raycast-drag-handle__grip {
  display: grid;
  grid-template-columns: repeat(2, 3px);
  gap: 3px;
}

.nexus-raycast-drag-handle__grip span {
  width: 3px;
  height: 3px;
  border-radius: 9999px;
  background: var(--nexus-tool-text-faint, rgb(148 163 184));
}
</style>
