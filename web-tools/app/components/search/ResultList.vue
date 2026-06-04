<script setup lang="ts">
import MacAppIcon from '~/components/MacAppIcon.client.vue'
import type { SearchResultItem } from '~/core/searchResults'

defineProps<{
  items: SearchResultItem[]
  activeIndex: number
}>()

const emit = defineEmits<{
  'update:activeIndex': [index: number]
  pick: [item: SearchResultItem]
}>()

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
          class="nexus-raycast-text-tertiary px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide"
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
          @mousedown.prevent="emit('pick', item)"
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
            <p class="nexus-raycast-text-primary truncate text-sm font-medium">{{ item.title }}</p>
            <p class="nexus-raycast-text-secondary truncate text-xs">{{ item.subtitle }}</p>
          </div>
          <span class="nexus-raycast-text-tertiary shrink-0 text-[11px]">{{ item.badge }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
