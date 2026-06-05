<script setup lang="ts">
const {
  rootRef,
  headerRef,
  commandQuery,
  queryEditor,
  queryFocused,
  showQueryEditor,
  hasQueryEditor,
  hasPayload,
  payloadSize,
  hint,
  searchItems,
  showEmpty,
  reorderEnabled,
  scheduleRemeasure,
  activeIndex,
  hasClipboardOffer,
  clipboardOfferLabel,
  acceptClipboardOffer,
  dismissClipboardOffer,
  pickItem,
  onEnter,
  onQueryPaste,
  onSearchKeydown,
  setQueryEditor,
  clearQueryContent,
  clearCommandContent,
  isFavorite,
  resultContextMenu,
  openResultContextMenu,
  closeResultContextMenu,
  confirmResultContextMenuFavorite
} = useDesktopSearchPanel()

function focusQueryField() {
  queryFocused.value = true
  headerRef.value?.focusQuery()
}

function focusCommandField() {
  queryFocused.value = false
  headerRef.value?.focusCommand()
}
</script>

<template>
  <div ref="rootRef" class="nexus-raycast-search flex flex-col">
    <SearchHeader
      ref="headerRef"
      v-model:command="commandQuery"
      :query="queryEditor"
      :query-focused="queryFocused"
      :show-query="showQueryEditor"
      :has-query="hasQueryEditor"
      :has-payload="hasPayload"
      @update:query="setQueryEditor"
      @clear-command="clearCommandContent"
      @clear-query="clearQueryContent"
      @focus-query="focusQueryField"
      @focus-command="focusCommandField"
      @paste="onQueryPaste"
      @keydown="onSearchKeydown"
      @keydown.enter.prevent="onEnter"
    />

    <div
      v-if="hasClipboardOffer"
      class="nexus-raycast-border-b nexus-raycast-surface-muted nexus-raycast-type-secondary flex items-center gap-2 px-3 py-2"
      style="-webkit-app-region: no-drag"
    >
      <span class="nexus-raycast-text-secondary min-w-0 flex-1 truncate">
        剪贴板 · {{ clipboardOfferLabel }}
        <span class="nexus-raycast-text-tertiary">· Tab 填入</span>
      </span>
      <button
        type="button"
        class="nexus-raycast-btn-muted nexus-raycast-text-primary shrink-0 rounded-md px-2 py-0.5 transition-colors"
        @click="acceptClipboardOffer"
      >
        填入
      </button>
      <button
        type="button"
        class="nexus-raycast-text-muted nexus-raycast-btn-ghost shrink-0 rounded-md px-2 py-0.5 transition-colors"
        @click="dismissClipboardOffer"
      >
        忽略
      </button>
    </div>

    <div class="nexus-raycast-body flex flex-col overflow-hidden" style="-webkit-app-region: no-drag">
      <p v-if="hint && !commandQuery.trim()" class="nexus-raycast-border-b nexus-raycast-hint nexus-raycast-type-secondary px-3 py-2">
        内容识别为 {{ hint.label }}<template v-if="hasPayload && payloadSize"> · {{ payloadSize }}</template>
      </p>
      <p v-else-if="showEmpty" class="nexus-raycast-border-b nexus-raycast-text-tertiary nexus-raycast-type-secondary px-3 py-2">
        {{ commandQuery.trim() ? '无匹配工具或应用' : '未识别到可用工具' }}
      </p>

      <div class="nexus-raycast-list-scroll">
        <SearchResultList
          :items="searchItems"
          :active-index="activeIndex"
          :reorder-enabled="reorderEnabled"
          @update:active-index="activeIndex = $event"
          @pick="pickItem"
          @context-menu="openResultContextMenu($event.item, $event.event)"
          @order-committed="scheduleRemeasure"
        />
      </div>
    </div>

    <SearchResultContextMenu
      :open="Boolean(resultContextMenu)"
      :x="resultContextMenu?.x ?? 0"
      :y="resultContextMenu?.y ?? 0"
      :item="resultContextMenu?.item ?? null"
      :favorited="resultContextMenu ? isFavorite(resultContextMenu.item.id) : false"
      @close="closeResultContextMenu"
      @toggle-favorite="confirmResultContextMenuFavorite"
    />
  </div>
</template>
