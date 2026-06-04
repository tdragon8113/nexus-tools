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
  selectedItem,
  preview,
  showEmpty,
  activeIndex,
  footerPrimaryLabel,
  hasClipboardOffer,
  clipboardOfferLabel,
  acceptClipboardOffer,
  dismissClipboardOffer,
  actionsOpen,
  actionIndex,
  panelActions,
  runPanelAction,
  toggleActionsMenu,
  pickItem,
  onEnter,
  onQueryPaste,
  onSearchKeydown,
  setQueryEditor,
  clearQueryContent
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
  <div ref="rootRef" class="nexus-raycast-search flex min-h-0 flex-col">
    <div class="nexus-raycast-titlebar flex h-7 shrink-0 items-center gap-1 px-2">
      <div class="nexus-shell-drag-region min-w-0 flex-1" />
      <DesktopWindowChrome />
    </div>

    <SearchHeader
      ref="headerRef"
      v-model:command="commandQuery"
      :query="queryEditor"
      :query-focused="queryFocused"
      :show-query="showQueryEditor"
      :has-query="hasQueryEditor"
      :has-payload="hasPayload"
      @update:query="setQueryEditor"
      @clear-query="clearQueryContent"
      @focus-query="focusQueryField"
      @focus-command="focusCommandField"
      @paste="onQueryPaste"
      @keydown="onSearchKeydown"
      @keydown.enter.prevent="onEnter"
    />

    <div
      v-if="hasClipboardOffer"
      class="nexus-raycast-border-b nexus-raycast-surface-muted flex items-center gap-2 px-3 py-2 text-xs"
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

    <div class="nexus-raycast-body flex min-h-[17rem] flex-1">
      <div class="flex min-w-0 flex-[0_0_42%] flex-col overflow-hidden" style="-webkit-app-region: no-drag">
        <p v-if="hint && !commandQuery.trim()" class="nexus-raycast-border-b nexus-raycast-hint px-3 py-2 text-xs">
          内容识别为 {{ hint.label }}<template v-if="hasPayload && payloadSize"> · {{ payloadSize }}</template>
        </p>
        <p v-else-if="showEmpty" class="nexus-raycast-border-b nexus-raycast-text-tertiary px-3 py-2 text-xs">
          {{ commandQuery.trim() ? '无匹配工具或应用' : '未识别到可用工具' }}
        </p>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <SearchResultList
            :items="searchItems"
            :active-index="activeIndex"
            @update:active-index="activeIndex = $event"
            @pick="pickItem"
          />
        </div>
      </div>

      <SearchPreviewPanel :preview="preview" :item="selectedItem" class="min-w-0 flex-1" />
    </div>

    <SearchActionFooter :primary-label="footerPrimaryLabel" @open-actions="toggleActionsMenu" />

    <SearchActionsMenu
      :open="actionsOpen"
      :actions="panelActions"
      :active-index="actionIndex"
      @close="actionsOpen = false"
      @pick="runPanelAction"
      @update:active-index="actionIndex = $event"
    />
  </div>
</template>
