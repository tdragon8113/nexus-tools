<script setup lang="ts">
import MacAppIcon from '~/components/MacAppIcon.client.vue'
import type { SearchResultItem } from '~/core/searchResults'

defineProps<{
  items: SearchResultItem[]
  activeIndex: number
  isFavorite?: (id: string) => boolean
}>()

const emit = defineEmits<{
  'update:activeIndex': [index: number]
  pick: [item: SearchResultItem]
  contextMenu: [payload: { item: SearchResultItem; event: MouseEvent }]
}>()

/** 仅左键打开；右键留给 contextmenu，避免 mousedown 误触 pick */
function onRowMouseDown(event: MouseEvent, item: SearchResultItem) {
  if (event.button !== 0) return
  event.preventDefault()
  emit('pick', item)
}

function showSection(items: SearchResultItem[], index: number): string | null {
  const section = items[index]?.section
  if (!section) return null
  if (index === 0) return section
  return items[index - 1]?.section === section ? null : section
}
</script>

<template>
  <div v-if="items.length" class="nexus-raycast-results py-1" style="-webkit-app-region: no-drag">
    <div role="listbox" aria-label="搜索结果">
      <template v-for="(item, i) in items" :key="item.id">
        <p
          v-if="showSection(items, i)"
          class="nexus-raycast-text-tertiary nexus-raycast-type-caption px-3 pb-1 pt-2 font-medium uppercase tracking-wide"
        >
          {{ item.section }}
        </p>
        <button
          type="button"
          role="option"
          :aria-selected="i === activeIndex"
          class="nexus-raycast-result-row flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
          :class="i === activeIndex ? 'is-active' : ''"
          @mouseenter="emit('update:activeIndex', i)"
          @mousedown="onRowMouseDown($event, item)"
          @contextmenu.prevent="emit('contextMenu', { item, event: $event })"
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
            <van-icon
              v-if="isFavorite?.(item.id)"
              name="star"
              size="14"
              class="text-amber-500"
              aria-hidden="true"
            />
            <span class="nexus-raycast-text-tertiary nexus-raycast-type-caption">{{ item.badge }}</span>
          </div>
        </button>
      </template>
    </div>
  </div>
</template>
