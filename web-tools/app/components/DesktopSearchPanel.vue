<script setup lang="ts">
const {
  rootRef,
  query,
  hasQuery,
  hasPayload,
  payloadSize,
  hint,
  displayTools,
  showEmpty,
  activeIndex,
  hasClipboardOffer,
  clipboardOfferLabel,
  acceptClipboardOffer,
  dismissClipboardOffer,
  clearQuery,
  closeDesktop,
  openTool,
  onEnter,
  onSearchPaste,
  onSearchKeydown
} = useDesktopSearchPanel()

function onSearchFocus(event: FocusEvent) {
  if (!hasPayload.value) return
  const el = event.target
  if (!(el instanceof HTMLInputElement)) return
  nextTick(() => el.select())
}
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
        class="desktop-search-input min-w-0 flex-1 border-0 bg-transparent font-mono text-sm outline-none placeholder:text-slate-400 placeholder:font-sans focus:ring-0"
        placeholder="搜索 Nexus 工具…"
        style="-webkit-app-region: no-drag"
        autofocus
        @focus="onSearchFocus"
        @paste="onSearchPaste"
        @keydown="onSearchKeydown"
        @keydown.enter.prevent="onEnter"
      />
      <button
        v-if="hasQuery || hasPayload"
        type="button"
        class="flex shrink-0 items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="清空"
        @click="clearQuery"
      >
        <van-icon name="cross" size="16" />
      </button>
    </div>

    <div
      v-if="hasClipboardOffer"
      class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-2 text-xs text-amber-950"
      style="-webkit-app-region: no-drag"
    >
      <span class="min-w-0 flex-1">
        剪贴板：<span class="font-medium">{{ clipboardOfferLabel }}</span>
        <span class="text-amber-800/80"> · Tab 填入 · Esc 忽略</span>
      </span>
      <button
        type="button"
        class="shrink-0 rounded-md bg-amber-200/80 px-2 py-0.5 font-medium text-amber-950 hover:bg-amber-300/80"
        @click="acceptClipboardOffer"
      >
        填入
      </button>
    </div>

    <p v-if="hint" class="mt-2 text-xs text-blue-600">
      识别为 {{ hint.label }}<template v-if="hasPayload && payloadSize"> · {{ payloadSize }}</template>，回车打开
    </p>
    <p v-else-if="showEmpty" class="mt-2 text-xs text-slate-400">无匹配，可打开工具集</p>

    <SearchToolMatchChips
      class="mt-2.5"
      :tools="displayTools"
      :active-index="activeIndex"
      @update:active-index="activeIndex = $event"
      @pick="openTool"
    />
  </div>
</template>
