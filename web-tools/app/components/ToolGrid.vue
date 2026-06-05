<script setup lang="ts">
import { showToast } from 'vant'
import { toolMatchesQuery } from '~/core/search'
import { type SiteTool } from '~/core/tools'

const props = withDefaults(
  defineProps<{
    filter?: string
    columns?: '2' | '3' | '4'
    /**
     * default — 网站工具集大卡片
     * compact — 横向小卡片网格
     * icons — 桌面工具集图标网格（仅图标+名称）
     */
    variant?: 'default' | 'compact' | 'icons'
    /** icons 模式下键盘高亮项 */
    activeIndex?: number
    /** 开启后仅可拖动排序，点击不会打开工具 */
    reorderMode?: boolean
    onPick?: (tool: SiteTool) => void | Promise<void>
  }>(),
  { filter: '', columns: '3', variant: 'default', activeIndex: -1, reorderMode: false }
)

const emit = defineEmits<{ pick: [tool: SiteTool] }>()

const { orderedTools, setOrder } = useToolOrder()

const filtered = computed(() => {
  const list = orderedTools.value
  if (!props.filter.trim()) return list
  return list.filter((t) => toolMatchesQuery(t, props.filter))
})

const reorderEnabled = computed(
  () => props.reorderMode && !props.filter.trim() && props.variant === 'icons'
)

const dragImmediate = computed(() => reorderEnabled.value)

const iconGridClass = computed(() => {
  if (props.columns === '2') return 'grid-cols-3 sm:grid-cols-4'
  if (props.columns === '4') return 'grid-cols-5'
  return 'grid-cols-4'
})

const gridClass = computed(() => {
  if (props.variant === 'icons') return iconGridClass.value
  if (props.variant === 'compact') {
    if (props.columns === '2') return 'grid-cols-2'
    if (props.columns === '4') return 'grid-cols-4'
    return 'grid-cols-3'
  }
  if (props.columns === '2') return 'grid-cols-2'
  if (props.columns === '4') return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  return 'grid-cols-2 lg:grid-cols-3'
})

const gapClass = computed(() =>
  props.variant === 'compact' ? 'gap-1.5' : 'gap-2.5 sm:gap-3'
)

const listRef = ref<HTMLElement | null>(null)
const dragLayout = ref<'list' | 'grid'>('grid')

const {
  isDragging,
  dragItemId,
  dragItem,
  ghostBox,
  displayItems,
  onItemPointerDown,
  shouldIgnoreClick
} = useDragSortList({
  enabled: reorderEnabled,
  immediate: dragImmediate,
  items: filtered,
  containerRef: listRef,
  layout: dragLayout,
  canDrag: (tool) => Boolean(tool.path),
  onCommitOrder: setOrder
})

const renderItems = computed(() => {
  const items = reorderEnabled.value ? displayItems.value : filtered.value
  return items ?? []
})

watch(
  () => [props.activeIndex, props.variant, filtered.value.length] as const,
  () => {
    if (props.variant !== 'icons' || props.activeIndex == null || props.activeIndex < 0)
      return
    void nextTick(() => {
      const el = listRef.value?.querySelector(`[data-sort-idx="${props.activeIndex}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    })
  }
)

async function pick(tool: SiteTool) {
  if (props.reorderMode || shouldIgnoreClick()) return
  if (!tool.path) {
    showToast('即将上线')
    return
  }
  if (props.onPick) {
    await props.onPick(tool)
    return
  }
  emit('pick', tool)
}

function itemButtonClass(tool: SiteTool, i: number) {
  const draggingSelf = isDragging.value && dragItemId.value === tool.id
  const isActive = props.activeIndex === i
  return [
    'nexus-desktop-tile',
    reorderEnabled ? 'nexus-desktop-tile--sortable' : '',
    isActive && !isDragging.value ? 'nexus-tile--active' : 'nexus-tile--idle',
    !tool.path ? 'opacity-60' : '',
    draggingSelf ? 'pointer-events-none opacity-35 scale-[0.98]' : ''
  ]
}
</script>

<template>
  <!-- 桌面：图标网格（可拖动排序） -->
  <div
    v-if="variant === 'icons'"
    ref="listRef"
    :data-reorder="reorderEnabled ? 'on' : 'off'"
    :class="
      reorderEnabled
        ? 'nexus-tile-reorder-ring rounded-2xl ring-2 ring-[var(--nexus-tool-ring)] ring-offset-2 ring-offset-[var(--nexus-tool-ring-offset)]'
        : ''
    "
  >
    <TransitionGroup
      tag="div"
      name="tool-grid"
      role="listbox"
      class="grid gap-2.5"
      :class="[
        iconGridClass,
        reorderEnabled ? 'tool-grid--sortable' : '',
        isDragging ? 'tool-grid--dragging' : ''
      ]"
    >
    <div
      v-for="(tool, i) in renderItems"
      :key="tool.id"
      role="option"
      :data-sort-id="tool.id"
      :data-sort-idx="i"
      :aria-selected="activeIndex === i"
      :tabindex="tool.path ? 0 : -1"
      :title="reorderEnabled ? `${tool.name} — 长按拖动排序` : tool.desc"
      class="tool-grid-item flex flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-2.5 transition-[transform,opacity,box-shadow,border-color,background-color] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
      :class="itemButtonClass(tool, i)"
      @pointerdown="onItemPointerDown($event, i, tool)"
      @click="pick(tool)"
      @keydown.enter.prevent="pick(tool)"
      @keydown.space.prevent="pick(tool)"
    >
      <div
        class="flex h-11 w-11 items-center justify-center rounded-xl"
        :class="tool.bgColor"
      >
        <van-icon :name="tool.icon" size="24" :class="tool.iconColor" />
      </div>
      <span class="nexus-tile-label w-full truncate text-center leading-tight">
        {{ tool.name }}
      </span>
    </div>
    <p
      v-if="!renderItems.length"
      key="__empty"
      class="nexus-hub-type-caption col-span-full py-10 text-center text-slate-500"
    >
      没有匹配的工具
    </p>
    </TransitionGroup>
  </div>

  <!-- 网站：卡片网格 -->
  <template v-else>
    <div class="grid" :class="[gapClass, gridClass]">
      <button
        v-for="tool in filtered"
        :key="tool.id"
        type="button"
        class="group text-left shadow-sm transition-colors"
        :class="
          variant === 'compact'
            ? [
              'flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-2 py-1.5 hover:border-indigo-200 hover:bg-indigo-50/40',
              !tool.path ? 'cursor-default opacity-75' : ''
            ]
            : [
              'flex flex-col items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:gap-3 sm:p-4',
              !tool.path ? 'cursor-default opacity-75' : ''
            ]
        "
        @click="pick(tool)"
      >
        <div
          class="flex shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
          :class="[
            tool.bgColor,
            variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10 rounded-xl sm:h-11 sm:w-11'
          ]"
        >
          <van-icon
            :name="tool.icon"
            :size="variant === 'compact' ? 16 : 20"
            :class="tool.iconColor"
          />
        </div>
        <div class="min-w-0 flex-1">
          <span
            class="block font-semibold text-slate-900"
            :class="variant === 'compact' ? 'truncate text-xs' : 'text-sm'"
          >{{ tool.name }}</span>
          <span
            class="block text-slate-500"
            :class="
              variant === 'compact'
                ? 'truncate text-[10px] leading-tight'
                : 'mt-1 text-xs leading-relaxed'
            "
          >{{ tool.desc }}</span>
        </div>
      </button>
    </div>
    <p
      v-if="!filtered.length"
      class="text-center text-slate-500"
      :class="variant === 'compact' ? 'py-6 text-xs' : 'py-10 text-sm'"
    >
      没有匹配的工具
    </p>
  </template>

  <Teleport to="body">
    <div
      v-if="ghostBox && dragItem"
      class="tool-grid-ghost nexus-tile--active flex flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-2.5 shadow-lg"
      :style="{
        left: `${ghostBox.left}px`,
        top: `${ghostBox.top}px`,
        width: `${ghostBox.width}px`,
        height: `${ghostBox.height}px`
      }"
    >
      <div
        class="flex h-11 w-11 items-center justify-center rounded-xl"
        :class="dragItem.bgColor"
      >
        <van-icon :name="dragItem.icon" size="24" :class="dragItem.iconColor" />
      </div>
      <span class="nexus-tile-label w-full truncate text-center leading-tight">
        {{ dragItem.name }}
      </span>
    </div>
  </Teleport>
</template>

<style scoped>
.tool-grid-move {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tool-grid--dragging .tool-grid-move {
  transition-duration: 0.18s;
}

.tool-grid--sortable .tool-grid-item {
  touch-action: none;
  user-select: none;
}
</style>

<style>
body.nexus-sort-dragging {
  user-select: none;
}

.tool-grid-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transform: scale(1.04);
}
</style>
