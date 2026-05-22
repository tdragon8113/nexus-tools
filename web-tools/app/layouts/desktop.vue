<script setup lang="ts">
import { getToolByPath } from '~/core/tools'

const route = useRoute()
const { goSearch, goHub, closeDesktop, isSearchScreen, isHubScreen, isToolScreen, resizeSearchPanel } =
  useDesktop()

const searchShellRef = ref<HTMLElement | null>(null)

function remeasureSearchShell() {
  const el = searchShellRef.value
  if (el) resizeSearchPanel(Math.ceil(el.offsetHeight))
}

useElementResize(searchShellRef, resizeSearchPanel)
provide('remeasureDesktopSearch', remeasureSearchShell)

const toolTitle = computed(() => getToolByPath(route.path)?.name ?? '工具')

const barTitle = computed(() => {
  if (isHubScreen.value) return '工具集'
  return toolTitle.value
})

function syncBodyShellClass() {
  document.documentElement.dataset.nexusDesktop = '1'
  document.body.classList.add('nexus-desktop-body')
  document.body.classList.toggle('nexus-desktop-body--search', isSearchScreen.value)
}

watch(isSearchScreen, syncBodyShellClass)

onMounted(syncBodyShellClass)

onUnmounted(() => {
  delete document.documentElement.dataset.nexusDesktop
  document.body.classList.remove('nexus-desktop-body', 'nexus-desktop-body--search')
})
</script>

<template>
  <!-- 搜索：无顶栏，纯搜索条（uTools） -->
  <div
    v-if="isSearchScreen"
    ref="searchShellRef"
    class="nexus-desktop-search w-full shrink-0 rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
    style="-webkit-app-region: no-drag"
  >
    <slot />
  </div>

  <!-- 工具集 / 工具：细顶栏，无侧栏 -->
  <div
    v-else
    class="nexus-desktop-panel flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
  >
    <header
      class="flex h-9 shrink-0 items-center gap-1.5 border-b border-slate-200/90 bg-slate-50/95 px-2.5"
      style="-webkit-app-region: drag"
    >
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
      <span class="min-w-0 flex-1 truncate text-center text-sm font-semibold text-slate-800">
        {{ barTitle }}
      </span>
      <button
        type="button"
        class="shrink-0 rounded-md px-2.5 py-1 text-slate-500 hover:bg-slate-200/80"
        style="-webkit-app-region: no-drag"
        aria-label="关闭"
        @click="closeDesktop"
      >
        ✕
      </button>
    </header>
    <main
      class="nexus-desktop-panel__body min-h-0 flex-1"
      :class="
        isHubScreen || isToolScreen
          ? 'nexus-desktop-panel__body--tool overflow-hidden'
          : 'overflow-auto'
      "
    >
      <slot />
    </main>
  </div>
</template>

<style>
html[data-nexus-desktop='1'] .nexus-desktop-panel__body > div {
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

/* 工具页：占满面板，编辑区 flex 伸展，避免底部大块空白 */
html[data-nexus-desktop='1'] .nexus-desktop-panel__body--tool {
  display: flex;
  flex-direction: column;
  padding: 8px 10px !important;
}

html[data-nexus-desktop='1'] .nexus-desktop-panel__body--tool > .desktop-tool-page,
html[data-nexus-desktop='1'] .nexus-desktop-panel__body--tool > .desktop-hub-page {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  max-width: none !important;
  padding: 0 !important;
}
</style>
