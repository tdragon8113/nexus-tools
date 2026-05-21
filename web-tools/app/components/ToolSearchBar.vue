<template>
  <div ref="rootRef" class="relative w-full min-w-0">
    <label :for="inputId" class="sr-only">搜索工具或粘贴内容</label>
    <div
      class="flex items-center gap-2 rounded-xl border bg-white px-3 py-0.5 shadow-sm transition-colors"
      :class="
        showPanel
          ? 'border-blue-400 ring-2 ring-blue-500/20'
          : 'border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20'
      "
    >
      <span class="flex shrink-0 items-center justify-center text-slate-400" aria-hidden="true">
        <van-icon name="search" size="18" />
      </span>
      <input
        :id="inputId"
        ref="inputRef"
        v-model="query"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        role="combobox"
        :aria-expanded="showPanel"
        aria-controls="tool-search-listbox"
        aria-autocomplete="list"
        :aria-activedescendant="activeDescendantId"
        :placeholder="placeholder"
        class="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
        @focus="openPanel"
        @keydown.down.prevent="onArrowDown"
        @keydown.up.prevent="onArrowUp"
        @keydown.enter.prevent="onSearchEnter"
        @keydown.esc.prevent="onEscape"
      />
      <kbd
        v-if="!query && !isMac"
        class="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline"
      >Ctrl K</kbd>
      <kbd
        v-else-if="!query && isMac"
        class="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline"
      >⌘ K</kbd>
      <button
        v-if="query"
        type="button"
        class="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="清空"
        @click="clearQuery"
      >
        <van-icon name="cross" size="16" />
      </button>
    </div>

    <div
      v-if="showPanel"
      id="tool-search-listbox"
      role="listbox"
      class="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[120] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/10"
    >
      <ul class="max-h-[min(24rem,70vh)] overflow-y-auto overscroll-contain py-1">
        <li
          v-if="contentHint"
          :id="optionId(0)"
          role="option"
          :aria-selected="activeIndex === 0"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors"
            :class="activeIndex === 0 ? 'bg-blue-50 text-blue-900' : 'text-slate-800 hover:bg-slate-50'"
            @mouseenter="activeIndex = 0"
            @click="openHintTool"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm"
            >
              <van-icon name="bulb-o" size="18" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-medium">已识别 {{ contentHint.label }}</span>
              <span class="mt-0.5 block text-xs text-slate-500">
                打开 {{ suggestedToolName }} 并带入内容
              </span>
            </span>
            <span class="shrink-0 text-xs font-medium text-blue-600">打开</span>
          </button>
        </li>

        <li
          v-for="(tool, i) in panelMatches"
          :key="tool.id"
          :id="optionId(contentHint ? i + 1 : i)"
          role="option"
          :aria-selected="activeIndex === (contentHint ? i + 1 : i)"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors"
            :class="
              activeIndex === (contentHint ? i + 1 : i)
                ? 'bg-blue-50 text-blue-900'
                : 'text-slate-800 hover:bg-slate-50'
            "
            @mouseenter="activeIndex = contentHint ? i + 1 : i"
            @click="openTool(tool)"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm"
            >
              <van-icon :name="tool.icon" size="18" :class="tool.iconColor || 'text-blue-600'" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="font-medium text-slate-900">{{ tool.name }}</span>
                <span
                  v-if="!tool.path"
                  class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                >即将上线</span>
              </span>
              <span class="mt-0.5 block truncate text-xs text-slate-500">{{ tool.desc }}</span>
            </span>
          </button>
        </li>

        <li v-if="panelMatches.length === 0 && !contentHint" class="px-4 py-6 text-center text-sm text-slate-500">
          没有匹配的工具，换个关键词试试
        </li>
      </ul>

      <div
        v-if="hasMoreResults || !isHome"
        class="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-500"
      >
        <span v-if="hasMoreResults">还有 {{ extraResultCount }} 个匹配</span>
        <span v-else />
        <NuxtLink
          v-if="!isHome"
          to="/"
          class="font-medium text-blue-600 hover:text-blue-700"
          @click="closePanel"
        >
          在工作台查看全部
        </NuxtLink>
      </div>
    </div>

    <p v-if="showPanel" class="mt-1.5 hidden text-[11px] text-slate-400 sm:block">
      <span class="tabular-nums">↑↓</span> 选择 · <span class="tabular-nums">Enter</span> 打开 ·
      <span class="tabular-nums">Esc</span> 关闭
    </p>
  </div>
</template>

<script setup lang="ts">
import { siteTools } from '~~/data/siteTools'

const inputId = useId()
const route = useRoute()
const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const isHome = computed(() => route.path === '/')
const isMac = computed(() => import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform))

const {
  query,
  contentHint,
  panelMatches,
  hasMoreResults,
  extraResultCount,
  showPanel,
  activeIndex,
  clearQuery,
  openPanel,
  closePanel,
  openTool,
  openHintTool,
  moveActiveIndex,
  onSearchEnter
} = useToolSearch()

const placeholder = '搜索工具，或粘贴 JSON、URL、算式、时间戳…'

const suggestedToolName = computed(() => {
  const id = contentHint.value?.toolId
  if (!id) return ''
  return siteTools.find((t) => t.id === id)?.name ?? ''
})

const activeDescendantId = computed(() => {
  if (!showPanel.value || activeIndex.value < 0) return undefined
  return optionId(activeIndex.value)
})

function optionId(index: number) {
  return `tool-search-option-${inputId}-${index}`
}

function onArrowDown() {
  openPanel()
  moveActiveIndex(1)
}

function onArrowUp() {
  openPanel()
  moveActiveIndex(-1)
}

function onEscape() {
  if (query.value) {
    clearQuery()
  } else {
    closePanel()
    inputRef.value?.blur()
  }
}

function onDocumentPointerDown(e: PointerEvent) {
  if (!showPanel.value) return
  const root = rootRef.value
  if (root && !root.contains(e.target as Node)) {
    closePanel()
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
    openPanel()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>
