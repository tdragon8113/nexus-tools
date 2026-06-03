<script setup lang="ts">
import DesktopSettingsToggle from '~/components/DesktopSettingsToggle.vue'
import ToolGrid from '~/components/ToolGrid.vue'
import { toolMatchesQuery } from '~/core/search'
import { type SiteTool } from '~/core/tools'

definePageMeta({ layout: 'desktop' })

const { goTool } = useDesktop()
const { orderedTools } = useToolOrder()
const reorderMode = ref(false)
const filter = ref('')
const filterRef = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)

useHead({ title: '工具集 - Nexus Tools' })

const filtered = computed(() => {
  const list = orderedTools.value
  const q = filter.value.trim()
  if (!q) return list
  return list.filter((t) => toolMatchesQuery(t, q))
})

const canReorder = computed(() => !filter.value.trim())

const hintText = computed(() => {
  const count = `${filtered.value.length} 个工具`
  if (reorderMode.value && canReorder.value) {
    return `${count} · 拖动调整顺序 · 点击不会打开工具`
  }
  if (canReorder.value) {
    return `${count} · ↑↓ 选择 · ↵ 打开 · 开启排序后可拖动`
  }
  return `${count} · ↑↓ 选择 · ↵ 打开`
})

watch(filter, () => {
  activeIndex.value = 0
})

watch(filtered, (list) => {
  activeIndex.value = Math.min(activeIndex.value, Math.max(0, list.length - 1))
})

watch(canReorder, (ok) => {
  if (!ok) reorderMode.value = false
})

async function onPick(tool: SiteTool) {
  await goTool(tool)
}

function pickActive() {
  if (reorderMode.value) return
  const tool = filtered.value[activeIndex.value]
  if (tool) void onPick(tool)
}

function onKeydown(e: KeyboardEvent) {
  const list = filtered.value
  if (!list.length) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % list.length
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + list.length) % list.length
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    pickActive()
  }
}

onMounted(() => {
  filterRef.value?.focus()
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="desktop-hub-page desktop-hub flex h-full min-h-0 flex-col">
    <div class="mb-2 flex shrink-0 items-center gap-2">
      <input
        ref="filterRef"
        v-model="filter"
        type="text"
        role="searchbox"
        placeholder="筛选工具…"
        autocomplete="off"
        class="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        @keydown.down.prevent="filtered.length && (activeIndex = (activeIndex + 1) % filtered.length)"
        @keydown.up.prevent="filtered.length && (activeIndex = (activeIndex - 1 + filtered.length) % filtered.length)"
        @keydown.enter.prevent="pickActive"
      />
    </div>
    <div class="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
      <p class="min-w-0 text-xs tabular-nums text-slate-400">
        {{ hintText }}
      </p>
      <div
        class="flex shrink-0 items-center gap-1.5"
        :class="!canReorder ? 'pointer-events-none opacity-50' : ''"
      >
        <span class="text-xs font-medium text-slate-600">排序</span>
        <DesktopSettingsToggle
          v-model="reorderMode"
          compact
          label="拖动排序"
          :disabled="!canReorder"
        />
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <ToolGrid
        :filter="filter"
        variant="icons"
        columns="4"
        :active-index="activeIndex"
        :reorder-mode="reorderMode && canReorder"
        :on-pick="onPick"
      />
    </div>
  </div>
</template>
