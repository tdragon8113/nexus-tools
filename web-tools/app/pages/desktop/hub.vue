<script setup lang="ts">
import ToolGrid from '~/components/ToolGrid.vue'
import { toolMatchesQuery } from '~/core/search'
import { useLastSearchTransferText } from '~/core/prefill'
import { siteTools, type SiteTool } from '~/core/tools'

definePageMeta({ layout: 'desktop' })

const { goTool } = useDesktop()
const { viewMode } = useDesktopHubView()
const filter = ref('')
const filterRef = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)

useHead({ title: '工具集 - Nexus Tools' })

const gridVariant = computed(() => (viewMode.value === 'icons' ? 'icons' : 'list'))

const filtered = computed(() => {
  const list = siteTools.filter((t) => t.id !== 'more')
  const q = filter.value.trim()
  if (!q) return list
  return list.filter((t) => toolMatchesQuery(t, q))
})

const hintText = computed(
  () => `${filtered.value.length} 个工具 · ↑↓ 选择 · ↵ 打开`
)

watch(filter, () => {
  activeIndex.value = 0
})

watch(viewMode, () => {
  activeIndex.value = 0
})

watch(filtered, (list) => {
  activeIndex.value = Math.min(activeIndex.value, Math.max(0, list.length - 1))
})

async function onPick(tool: SiteTool) {
  const prefill = useLastSearchTransferText().value
  await goTool(
    tool,
    prefill.trim() ? { toolId: tool.id, prefill } : undefined
  )
}

function pickActive() {
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
        class="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
        @keydown.down.prevent="filtered.length && (activeIndex = (activeIndex + 1) % filtered.length)"
        @keydown.up.prevent="filtered.length && (activeIndex = (activeIndex - 1 + filtered.length) % filtered.length)"
        @keydown.enter.prevent="pickActive"
      />
      <div
        class="flex shrink-0 rounded-lg border border-slate-200 bg-white p-0.5"
        role="group"
        aria-label="显示方式"
      >
        <button
          type="button"
          class="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
          :class="
            viewMode === 'list'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-500 hover:bg-slate-50'
          "
          aria-pressed="viewMode === 'list'"
          @click="viewMode = 'list'"
        >
          列表
        </button>
        <button
          type="button"
          class="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
          :class="
            viewMode === 'icons'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-500 hover:bg-slate-50'
          "
          aria-pressed="viewMode === 'icons'"
          @click="viewMode = 'icons'"
        >
          图标
        </button>
      </div>
    </div>
    <p class="mb-2 shrink-0 px-0.5 text-xs tabular-nums text-slate-400">
      {{ hintText }}
    </p>
    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <ToolGrid
        :filter="filter"
        :variant="gridVariant"
        columns="4"
        :active-index="activeIndex"
        :on-pick="onPick"
      />
    </div>
  </div>
</template>
