<script setup lang="ts">
import { desktopPanelScrollFromPath } from '~/core/desktop'
import { getToolByPath } from '~/core/tools'

const route = useRoute()
const {
  goSearch,
  goHub,
  leaveSettings,
  isSearchScreen,
  isHubScreen,
  isToolScreen,
  isSettingsScreen,
  resizeSearchPanel,
  syncWindowChrome
} = useDesktop()

const searchShellRef = ref<HTMLElement | null>(null)

/** 以整块面板实际占位为准，避免最小窗高在底部留出「空分区」 */
function measureSearchShell(el: HTMLElement): number {
  return Math.ceil(el.offsetHeight)
}

function remeasureSearchShell() {
  const el = searchShellRef.value
  if (!el || !isSearchScreen.value) return
  const report = () => resizeSearchPanel(measureSearchShell(el))
  report()
  requestAnimationFrame(() => {
    report()
  })
}

useElementResize(
  searchShellRef,
  (h) => {
    if (isSearchScreen.value) resizeSearchPanel(h)
  },
  measureSearchShell
)

/** 路由一变就同步主进程窗体尺寸（搜索测高 / 工具面板撑满）；只调一次，避免连闪 */
watch(
  () => route.path,
  () => {
    void syncWindowChrome()
    if (isSearchScreen.value) void nextTick(remeasureSearchShell)
  }
)

onMounted(() => {
  void syncWindowChrome()
  remeasureSearchShell()
})

provide('remeasureDesktopSearch', remeasureSearchShell)

const toolTitle = computed(() => getToolByPath(route.path)?.name ?? '工具')

const barTitle = computed(() => {
  if (isSettingsScreen.value) return '设置'
  if (isHubScreen.value) return '工具集'
  return toolTitle.value
})

/** 表格式工具（Base64 等）：面板内层 __scroll 滚动 */
const panelBodyScroll = computed(
  () => route.meta.desktopPanelScroll === true || desktopPanelScrollFromPath(route.path)
)

const panelBodyIsToolLayout = computed(
  () => (isHubScreen.value || isToolScreen.value) && !panelBodyScroll.value
)

function syncBodyShellClass() {
  document.documentElement.dataset.nexusDesktop = '1'
  document.documentElement.classList.toggle('nexus-desktop-html--panel', !isSearchScreen.value)
  document.body.classList.add('nexus-desktop-body')
  document.body.classList.toggle('nexus-desktop-body--search', isSearchScreen.value)
}

watch(isSearchScreen, syncBodyShellClass)

onMounted(syncBodyShellClass)

onUnmounted(() => {
  delete document.documentElement.dataset.nexusDesktop
  document.documentElement.classList.remove('nexus-desktop-html--panel')
  document.body.classList.remove('nexus-desktop-body', 'nexus-desktop-body--search')
})
</script>

<template>
  <div class="nexus-desktop-root flex h-full min-h-0 w-full flex-col">
    <!-- 搜索：窗体高度随内容；不透明窗口与面板同宽 -->
    <div
      v-if="isSearchScreen"
      ref="searchShellRef"
      class="nexus-desktop-search flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10"
    >
      <div
        class="flex h-9 shrink-0 items-center gap-1.5 border-b border-slate-200/90 bg-slate-50/95 px-2.5"
        style="-webkit-app-region: drag"
      >
        <button
          type="button"
          class="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/80"
          style="-webkit-app-region: no-drag"
          @mousedown.prevent="goHub"
        >
          工具集
        </button>
        <span class="min-w-0 flex-1 truncate text-center text-sm font-semibold text-slate-800">搜索</span>
        <DesktopHeaderSettingsButton />
        <DesktopWindowChrome />
      </div>
      <div class="shrink-0" style="-webkit-app-region: no-drag">
        <slot />
      </div>
    </div>

    <!-- 工具集 / 工具：固定面板高度 -->
    <div
      v-else
      class="nexus-desktop-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10"
    >
      <header
        class="flex h-9 shrink-0 items-center gap-1.5 border-b border-slate-200/90 bg-slate-50/95 px-2.5"
        style="-webkit-app-region: drag"
      >
        <button
          v-if="isSettingsScreen"
          type="button"
          class="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/80"
          style="-webkit-app-region: no-drag"
          @click="leaveSettings"
        >
          返回
        </button>
        <template v-else>
          <button
            type="button"
            class="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/80"
            style="-webkit-app-region: no-drag"
            @click="goSearch()"
          >
            搜索
          </button>
          <button
            v-if="!isHubScreen"
            type="button"
            class="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/80"
            style="-webkit-app-region: no-drag"
            @click="goHub"
          >
            工具集
          </button>
        </template>
        <span class="min-w-0 flex-1 truncate text-center text-sm font-semibold text-slate-800">
          {{ barTitle }}
        </span>
        <DesktopHeaderSettingsButton v-if="!isSettingsScreen" />
        <DesktopWindowChrome />
      </header>
      <main
        class="nexus-desktop-panel__body min-h-0 flex-1"
        :class="
          panelBodyScroll
            ? 'nexus-desktop-panel__body--scroll flex min-h-0 flex-col overflow-hidden'
            : panelBodyIsToolLayout
              ? 'nexus-desktop-panel__body--tool overflow-hidden'
              : 'overflow-auto'
        "
      >
        <div
          :class="
            panelBodyScroll
              ? 'nexus-desktop-panel__scroll min-h-0 flex-1 overflow-y-auto overscroll-contain'
              : 'nexus-desktop-panel__inner min-h-0 flex-1'
          "
        >
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
html[data-nexus-desktop='1']
  .nexus-desktop-panel__body:not(.nexus-desktop-panel__body--tool):not(
    .nexus-desktop-panel__body--scroll
  )
  > div {
  max-width: none !important;
  padding: 12px 14px !important;
}

html[data-nexus-desktop='1'] .nexus-desktop-panel__body {
  background: rgb(248 250 252 / 0.6);
}

html[data-nexus-desktop='1'] .nexus-desktop-panel__body .py-8,
html[data-nexus-desktop='1'] .nexus-desktop-panel__body .md\:py-10 {
  padding-top: 0.75rem !important;
  padding-bottom: 0.75rem !important;
}

/* 工具页：占满面板，编辑区 flex 伸展 */
html[data-nexus-desktop='1'] .nexus-desktop-panel__body--tool {
  display: flex;
  flex-direction: column;
  padding: 8px 10px !important;
}

html[data-nexus-desktop='1'] .nexus-desktop-panel__body--tool .nexus-desktop-panel__inner {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  width: 100%;
  max-width: none !important;
  padding: 0 !important;
}

html[data-nexus-desktop='1'] .nexus-desktop-panel__body--tool .desktop-tool-page,
html[data-nexus-desktop='1'] .nexus-desktop-panel__body--tool .desktop-hub-page {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  width: 100%;
  max-width: none !important;
  padding: 0 !important;
}

html[data-nexus-desktop='1'] .nexus-desktop-panel__body--scroll {
  display: flex;
  flex-direction: column;
  padding: 8px 10px !important;
}

html[data-nexus-desktop='1'] .nexus-desktop-panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

html[data-nexus-desktop='1'] .nexus-desktop-panel__scroll > .desktop-tool-page,
html[data-nexus-desktop='1'] .nexus-desktop-panel__scroll > .desktop-hub-page {
  display: block;
  width: 100%;
  max-width: none !important;
  min-height: min-content;
  padding: 0 !important;
}

html[data-nexus-desktop='1'] .json-tool-page .json-editor-shell {
  flex: 1 1 auto;
  min-height: 28rem;
}

html[data-nexus-desktop='1'] .json-tool-page .json-editor-shell > div,
html[data-nexus-desktop='1'] .json-tool-page .json-cm-wrap {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

html[data-nexus-desktop='1'] .text-tool-page .text-editor-shell {
  flex: 1 1 auto;
  min-height: 28rem;
}

html[data-nexus-desktop='1'] .text-diff-tool-page .text-diff-workspace {
  flex: 1 1 auto;
  min-height: 28rem;
}

html[data-nexus-desktop='1'] .js-playground-page .js-playground-workspace {
  flex: 1 1 auto;
  min-height: 28rem;
}

html[data-nexus-desktop='1'] .text-tool-page .text-editor-shell--md-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

html[data-nexus-desktop='1'] .text-tool-page .text-editor-shell--md-split > div {
  flex: unset;
  min-height: 0;
  height: 100%;
}

html[data-nexus-desktop='1'] .text-tool-page .text-editor-shell > div,
html[data-nexus-desktop='1'] .text-tool-page .text-diff-cm-wrap,
html[data-nexus-desktop='1'] .text-diff-tool-page .text-diff-pane__editor,
html[data-nexus-desktop='1'] .text-diff-tool-page .text-diff-cm-wrap,
html[data-nexus-desktop='1'] .js-playground-page .js-playground-pane__editor,
html[data-nexus-desktop='1'] .js-playground-page .js-playground-pane .text-diff-cm-wrap {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
