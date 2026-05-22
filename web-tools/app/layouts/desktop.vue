<script setup lang="ts">
import { getToolByPath } from '~/core/tools'

const route = useRoute()
const { goSearch, goHub, closeDesktop, isSearchScreen, isHubScreen } = useDesktop()

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
    ref="searchRoot"
    class="nexus-desktop-search overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
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
      class="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200/90 bg-slate-50/95 px-3"
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
    <main class="nexus-desktop-panel__body min-h-0 flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<style>
html[data-nexus-desktop='1'] .nexus-desktop-panel__body > div {
  max-width: none !important;
  padding: 12px 14px !important;
}

html[data-nexus-desktop='1'] .nexus-desktop-panel__body .py-8,
html[data-nexus-desktop='1'] .nexus-desktop-panel__body .md\:py-10 {
  padding-top: 0.75rem !important;
  padding-bottom: 0.75rem !important;
}
</style>
