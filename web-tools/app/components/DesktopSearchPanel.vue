<script setup lang="ts">
const {
  rootRef,
  query,
  hint,
  displayTools,
  showEmpty,
  activeIndex,
  goHub,
  closeDesktop,
  openTool,
  onEnter
} = useDesktopSearchPanel()
</script>

<template>
  <div ref="rootRef" class="px-3.5 pb-2.5 pt-3.5">
    <div
      class="desktop-search-bar flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20"
      style="-webkit-app-region: no-drag"
    >
      <van-icon name="search" class="pointer-events-none shrink-0 text-slate-400" size="18" />
      <input
        v-model="query"
        type="text"
        role="searchbox"
        autocomplete="off"
        spellcheck="false"
        class="desktop-search-input min-w-0 flex-1 border-0 bg-transparent text-base outline-none placeholder:text-slate-400"
        placeholder="搜索 Nexus 工具…"
        style="-webkit-app-region: no-drag"
        autofocus
        @keydown.enter.prevent="onEnter"
        @keydown.esc.prevent="closeDesktop"
      />
      <button
        v-if="query"
        type="button"
        class="text-slate-400 hover:text-slate-600"
        aria-label="清空"
        @click="query = ''"
      >
        <van-icon name="cross" size="16" />
      </button>
    </div>

    <p v-if="hint" class="mt-2 text-xs text-blue-600">识别为 {{ hint.label }}，回车打开</p>
    <p v-else-if="showEmpty" class="mt-2 text-xs text-slate-400">无匹配，可打开工具集</p>

    <SearchToolMatchChips
      class="mt-2.5"
      :tools="displayTools"
      :active-index="activeIndex"
      @update:active-index="activeIndex = $event"
      @pick="openTool"
    />

    <footer
      class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400"
    >
      <span>↵ 打开 · Esc 关闭</span>
      <button
        type="button"
        class="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700 hover:bg-blue-100"
        @mousedown.prevent="goHub"
      >
        工具集
      </button>
    </footer>
  </div>
</template>
