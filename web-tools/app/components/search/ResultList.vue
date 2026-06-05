<script setup lang="ts">
import MacAppIcon from '~/components/MacAppIcon.client.vue'
import SortableResultRow from '~/components/search/SortableResultRow.vue'
import type { SearchResultItem } from '~/core/searchResults'
import { mergeCatalogToolOrder, useToolOrder } from '~/composables/useToolOrder'
import { useSearchFavorites } from '~/composables/useSearchFavorites'

const props = defineProps<{
  items: SearchResultItem[]
  activeIndex: number
  reorderEnabled?: boolean
}>()

const emit = defineEmits<{
  'update:activeIndex': [index: number]
  pick: [item: SearchResultItem]
  contextMenu: [payload: { item: SearchResultItem; event: MouseEvent }]
  orderCommitted: []
}>()

type SortRow = { id: string; item: SearchResultItem }

const { order, setOrder } = useToolOrder()
const { setFavoriteOrder } = useSearchFavorites()

const listRef = ref<HTMLElement | null>(null)
const favoritesListRef = ref<HTMLElement | null>(null)
const catalogListRef = ref<HTMLElement | null>(null)
const listLayout = ref<'list' | 'grid'>('list')
const dragImmediate = ref(true)

function isFavoriteSectionItem(item: SearchResultItem): boolean {
  return item.section === '收藏'
}

function isCatalogSectionItem(item: SearchResultItem): boolean {
  if (item.kind !== 'tool') return false
  if (!item.section) return true
  return item.section === '所有工具'
}

function isAnyReorderableItem(item: SearchResultItem): boolean {
  if (!props.reorderEnabled) return false
  if (isFavoriteSectionItem(item)) return favoriteSortItems.value.length > 1
  return isCatalogSectionItem(item)
}

const favoriteSortItems = computed<SortRow[]>(() =>
  props.items.filter(isFavoriteSectionItem).map((item) => ({ id: item.id, item }))
)

const catalogSortItems = computed<SortRow[]>(() =>
  props.items.filter(isCatalogSectionItem).map((item) => ({ id: item.id, item }))
)

const favoriteReorderActive = computed(
  () => props.reorderEnabled && favoriteSortItems.value.length > 1
)
const catalogReorderActive = computed(
  () => props.reorderEnabled && catalogSortItems.value.length > 1
)
const splitReorderLayout = computed(
  () => favoriteReorderActive.value || catalogReorderActive.value
)

const recentRenderItems = computed(() =>
  props.items.filter((item) => item.section === '最近使用')
)

function commitFavoriteOrder(itemIds: string[]) {
  setFavoriteOrder(itemIds)
  emit('orderCommitted')
}

function commitCatalogOrder(searchItemIds: string[]) {
  const catalogToolIds = searchItemIds.map(toolIdFromItemId)
  const hasOtherSections = props.items.some(
    (item) => item.section === '最近使用' || item.section === '收藏'
  )

  if (!hasOtherSections) {
    setOrder(catalogToolIds)
    emit('orderCommitted')
    return
  }

  setOrder(mergeCatalogToolOrder(order.value, catalogToolIds))
  emit('orderCommitted')
}

function toolIdFromItemId(id: string): string {
  return id.startsWith('tool:') ? id.slice(5) : id
}

const favoriteDrag = useDragSortList({
  enabled: favoriteReorderActive,
  immediate: dragImmediate,
  items: favoriteSortItems,
  containerRef: favoritesListRef,
  layout: listLayout,
  onCommitOrder: commitFavoriteOrder
})

const catalogDrag = useDragSortList({
  enabled: catalogReorderActive,
  immediate: dragImmediate,
  items: catalogSortItems,
  containerRef: catalogListRef,
  layout: listLayout,
  onCommitOrder: commitCatalogOrder
})

const favoriteRenderItems = computed(() => {
  if (!favoriteReorderActive.value) return favoriteSortItems.value.map((row) => row.item)
  return favoriteDrag.displayItems.value.map((row) => row.item)
})

const catalogRenderItems = computed(() => {
  if (!catalogReorderActive.value) return catalogSortItems.value.map((row) => row.item)
  return catalogDrag.displayItems.value.map((row) => row.item)
})

const isDragging = computed(() => favoriteDrag.isDragging.value || catalogDrag.isDragging.value)

const dragGhostItem = computed<SearchResultItem | null>(() => {
  if (favoriteDrag.isDragging.value) {
    const row = favoriteDrag.dragItem.value as SortRow | null
    return row?.item ?? null
  }
  if (catalogDrag.isDragging.value) {
    const row = catalogDrag.dragItem.value as SortRow | null
    return row?.item ?? null
  }
  return null
})

const ghostBox = computed(() => {
  if (favoriteDrag.isDragging.value) return favoriteDrag.ghostBox.value
  if (catalogDrag.isDragging.value) return catalogDrag.ghostBox.value
  return null
})

const showFavoritesSectionHeader = computed(
  () => favoriteRenderItems.value.length > 0 && recentRenderItems.value.length > 0
)

const showCatalogSectionHeader = computed(
  () =>
    catalogRenderItems.value.length > 0 &&
    (recentRenderItems.value.length > 0 || favoriteRenderItems.value.length > 0)
)

function showSection(items: SearchResultItem[], index: number): string | null {
  const section = items[index]?.section
  if (!section) return null
  if (index === 0) return section
  return items[index - 1]?.section === section ? null : section
}

function globalIndex(item: SearchResultItem): number {
  return props.items.findIndex((row) => row.id === item.id)
}

function sourceSortIndex(rows: SortRow[], item: SearchResultItem): number {
  return rows.findIndex((row) => row.id === item.id)
}

function onSortPointerDown(
  event: PointerEvent,
  item: SearchResultItem,
  rows: SortRow[],
  onItemPointerDown: (e: PointerEvent, index: number, row: SortRow) => void
) {
  if (!(event.target as HTMLElement).closest('[data-drag-handle]')) return
  const sortIndex = sourceSortIndex(rows, item)
  const sortRow = rows[sortIndex]
  if (sortIndex < 0 || !sortRow) return
  event.preventDefault()
  onItemPointerDown(event, sortIndex, sortRow)
}

function onRowClick(item: SearchResultItem) {
  if (favoriteDrag.shouldIgnoreClick() || catalogDrag.shouldIgnoreClick()) return
  emit('pick', item)
}

function rowClass(item: SearchResultItem, index: number): string[] {
  const draggingSelf =
    (favoriteDrag.isDragging.value && favoriteDrag.dragItemId.value === item.id) ||
    (catalogDrag.isDragging.value && catalogDrag.dragItemId.value === item.id)
  return [
    index === props.activeIndex ? 'is-active' : '',
    draggingSelf ? 'pointer-events-none opacity-35' : '',
    isAnyReorderableItem(item) ? 'nexus-raycast-result-row--reorderable' : ''
  ]
}
</script>

<template>
  <div
    v-if="items.length"
    ref="listRef"
    class="nexus-raycast-results py-1"
    :class="isDragging ? 'nexus-raycast-results--dragging' : ''"
    style="-webkit-app-region: no-drag"
  >
    <div role="listbox" aria-label="搜索结果">
      <!-- 分区排序：最近使用固定 + 收藏/所有工具 TransitionGroup -->
      <template v-if="splitReorderLayout">
        <template v-for="(item, i) in recentRenderItems" :key="item.id">
          <p
            v-if="showSection(recentRenderItems, i)"
            class="nexus-raycast-text-tertiary nexus-raycast-type-caption px-3 pb-1 pt-2 font-medium uppercase tracking-wide"
          >
            {{ item.section }}
          </p>
          <button
            type="button"
            role="option"
            :aria-selected="globalIndex(item) === activeIndex"
            class="nexus-raycast-result-row flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
            :class="rowClass(item, globalIndex(item))"
            @mouseenter="emit('update:activeIndex', globalIndex(item))"
            @click="onRowClick(item)"
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
              <span class="nexus-raycast-text-tertiary nexus-raycast-type-caption">{{ item.badge }}</span>
            </div>
          </button>
        </template>

        <template v-if="favoriteRenderItems.length">
          <p
            v-if="showFavoritesSectionHeader || (!recentRenderItems.length && favoriteRenderItems.length)"
            class="nexus-raycast-text-tertiary nexus-raycast-type-caption px-3 pb-1 pt-2 font-medium uppercase tracking-wide"
          >
            收藏
          </p>
          <div
            ref="favoritesListRef"
            class="raycast-result-list-wrap"
            :class="favoriteDrag.isDragging.value ? 'raycast-result-list--dragging' : ''"
          >
            <TransitionGroup
              v-if="favoriteReorderActive"
              name="raycast-result"
              tag="div"
              class="raycast-result-list"
            >
              <SortableResultRow
              v-for="(item, i) in favoriteRenderItems"
              :key="item.id"
              :item="item"
              :active="globalIndex(item) === activeIndex"
              :dragging="favoriteDrag.isDragging.value && favoriteDrag.dragItemId.value === item.id"
              :sort-id="item.id"
              :sort-idx="i"
              @mouseenter="emit('update:activeIndex', globalIndex(item))"
              @pointerdown="onSortPointerDown($event, item, favoriteSortItems, favoriteDrag.onItemPointerDown)"
              @click="onRowClick(item)"
              @context-menu="emit('contextMenu', { item, event: $event })"
            />
          </TransitionGroup>
          <template v-else>
            <button
              v-for="item in favoriteRenderItems"
              :key="item.id"
              type="button"
              role="option"
              :aria-selected="globalIndex(item) === activeIndex"
              class="nexus-raycast-result-row flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
              :class="rowClass(item, globalIndex(item))"
              @mouseenter="emit('update:activeIndex', globalIndex(item))"
              @click="onRowClick(item)"
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
                <span class="nexus-raycast-text-tertiary nexus-raycast-type-caption">{{ item.badge }}</span>
              </div>
            </button>
          </template>
          </div>
        </template>

        <template v-if="catalogRenderItems.length">
          <p
            v-if="showCatalogSectionHeader"
            class="nexus-raycast-text-tertiary nexus-raycast-type-caption px-3 pb-1 pt-2 font-medium uppercase tracking-wide"
          >
            所有工具
          </p>
          <div
            ref="catalogListRef"
            class="raycast-result-list-wrap"
            :class="catalogDrag.isDragging.value ? 'raycast-result-list--dragging' : ''"
          >
            <TransitionGroup
              v-if="catalogReorderActive"
              name="raycast-result"
              tag="div"
              class="raycast-result-list"
            >
              <SortableResultRow
              v-for="(item, i) in catalogRenderItems"
              :key="item.id"
              :item="item"
              :active="globalIndex(item) === activeIndex"
              :dragging="catalogDrag.isDragging.value && catalogDrag.dragItemId.value === item.id"
              :sort-id="item.id"
              :sort-idx="i"
              @mouseenter="emit('update:activeIndex', globalIndex(item))"
              @pointerdown="onSortPointerDown($event, item, catalogSortItems, catalogDrag.onItemPointerDown)"
              @click="onRowClick(item)"
              @context-menu="emit('contextMenu', { item, event: $event })"
            />
            </TransitionGroup>
            <template v-else>
              <button
                v-for="item in catalogRenderItems"
                :key="item.id"
                type="button"
                role="option"
                :aria-selected="globalIndex(item) === activeIndex"
                class="nexus-raycast-result-row flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
                :class="rowClass(item, globalIndex(item))"
                @mouseenter="emit('update:activeIndex', globalIndex(item))"
                @click="onRowClick(item)"
                @contextmenu.prevent="emit('contextMenu', { item, event: $event })"
              >
                <div
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
            </template>
          </div>
        </template>
      </template>

      <!-- 普通模式 -->
      <template v-else>
        <template v-for="(item, i) in items" :key="item.id">
          <p
            v-if="showSection(items, i)"
            class="nexus-raycast-text-tertiary nexus-raycast-type-caption px-3 pb-1 pt-2 font-medium uppercase tracking-wide"
          >
            {{ item.section }}
          </p>

          <SortableResultRow
            v-if="isAnyReorderableItem(item)"
            :item="item"
            :active="i === activeIndex"
            :dragging="false"
            @mouseenter="emit('update:activeIndex', i)"
            @pointerdown="
              isFavoriteSectionItem(item)
                ? onSortPointerDown($event, item, favoriteSortItems, favoriteDrag.onItemPointerDown)
                : onSortPointerDown($event, item, catalogSortItems, catalogDrag.onItemPointerDown)
            "
            @click="onRowClick(item)"
            @context-menu="emit('contextMenu', { item, event: $event })"
          />

          <button
            v-else
            type="button"
            role="option"
            :aria-selected="i === activeIndex"
            class="nexus-raycast-result-row flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
            :class="rowClass(item, i)"
            @mouseenter="emit('update:activeIndex', i)"
            @click="onRowClick(item)"
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
              <span class="nexus-raycast-text-tertiary nexus-raycast-type-caption">{{ item.badge }}</span>
            </div>
          </button>
        </template>
      </template>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="ghostBox && dragGhostItem"
      class="nexus-raycast-result-ghost nexus-raycast-result-row flex items-center gap-3 px-3 py-2 shadow-lg"
      :style="{
        left: `${ghostBox.left}px`,
        top: `${ghostBox.top}px`,
        width: `${ghostBox.width}px`,
        height: `${ghostBox.height}px`
      }"
    >
      <MacAppIcon v-if="dragGhostItem.kind === 'mac-app' && dragGhostItem.app" :app-path="dragGhostItem.app.path" />
      <div
        v-else
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        :class="dragGhostItem.bgColor"
      >
        <van-icon :name="dragGhostItem.icon" size="18" :class="dragGhostItem.iconColor" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="nexus-raycast-text-primary nexus-raycast-type-body truncate font-medium">
          {{ dragGhostItem.title }}
        </p>
        <p class="nexus-raycast-text-secondary nexus-raycast-type-secondary truncate">
          {{ dragGhostItem.subtitle }}
        </p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.raycast-result-move {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.raycast-result-list--dragging .raycast-result-move {
  transition-duration: 0.18s;
}
</style>

<style>
.nexus-raycast-results--dragging .nexus-raycast-drag-handle {
  opacity: 1;
}

.nexus-raycast-result-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transform: scale(1.02);
  background: var(--nexus-panel-body-bg, #fff);
  border: 1px solid var(--nexus-tool-border, rgb(226 232 240 / 0.8));
  border-radius: 0.5rem;
}

body.nexus-sort-dragging .nexus-raycast-drag-handle {
  cursor: grabbing;
}
</style>
