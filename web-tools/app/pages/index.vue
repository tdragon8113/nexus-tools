<template>
  <div class="max-w-5xl px-4 sm:px-6 py-6 md:py-8">
    <header class="mb-8 pb-6 border-b border-slate-200/80">
      <h1 class="font-display text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
        小工具工作台
      </h1>
      <p class="mt-2 text-sm text-slate-600 max-w-2xl">
        JSON 等在浏览器内处理，数据不上传服务器。
        <span class="tabular-nums text-slate-500">{{ availableCount }} 个工具已上线</span>
      </p>
    </header>

    <section
      v-if="normalizedQuery"
      role="region"
      aria-labelledby="search-results-heading"
    >
      <div class="flex items-baseline justify-between gap-4 mb-4">
        <h2 id="search-results-heading" class="font-display text-lg font-semibold text-slate-900">
          搜索结果
        </h2>
        <span class="text-xs text-slate-500 tabular-nums">{{ matchedTools.length }} 项</span>
      </div>

      <p
        v-if="matchedTools.length === 0"
        class="doc-surface rounded-xl px-6 py-10 text-center text-slate-600 text-sm"
      >
        没有匹配「{{ normalizedQuery }}」的工具，试试其它关键词或清空搜索框。
      </p>

      <ul v-else class="space-y-2" role="list">
        <li v-for="tool in matchedTools" :key="tool.id">
          <button
            v-if="tool.path"
            type="button"
            class="group w-full text-left doc-card-interactive rounded-xl px-4 py-3 flex gap-3 items-start"
            :class="highlightId === tool.id ? 'ring-2 ring-blue-400/60 border-blue-200' : ''"
            @click="handleToolClick(tool)"
          >
            <div
              class="w-10 h-10 shrink-0 rounded-lg border border-slate-100 bg-white flex items-center justify-center shadow-sm"
            >
              <van-icon :name="tool.icon" size="20" class="text-blue-600" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-slate-900 text-sm">{{ tool.name }}</span>
                <span
                  v-if="contentHint?.toolId === tool.id"
                  class="text-[10px] font-semibold uppercase tracking-wider text-purple-800 bg-purple-100/80 px-1.5 py-0.5 rounded"
                >内容匹配</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">{{ tool.desc }}</p>
            </div>
            <van-icon name="arrow" class="shrink-0 text-slate-400 mt-2" size="14" />
          </button>
          <div
            v-else
            role="note"
            class="w-full text-left doc-surface rounded-xl px-4 py-3 flex gap-3 items-start cursor-default opacity-90"
            @click="showComingSoon"
          >
            <div class="w-10 h-10 shrink-0 rounded-lg border border-slate-100 bg-white flex items-center justify-center">
              <van-icon :name="tool.icon" size="20" class="text-slate-400" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-slate-900 text-sm">{{ tool.name }}</span>
                <span
                  class="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                >即将上线</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">{{ tool.desc }}</p>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <template v-else>
      <section aria-labelledby="dev-tools-heading">
        <h2 id="dev-tools-heading" class="text-sm font-semibold text-slate-800 mb-3">
          开发者工具
        </h2>
        <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <template v-for="tool in developerTools" :key="tool.id">
            <button
              v-if="tool.path"
              type="button"
              class="doc-card-interactive rounded-xl p-4 text-left flex gap-3 items-start"
              @click="handleToolClick(tool)"
            >
              <div
                class="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center"
                :class="tool.bgColor"
              >
                <van-icon :name="tool.icon" size="20" :class="tool.iconColor" />
              </div>
              <div class="min-w-0">
                <span class="font-medium text-slate-900 text-sm">{{ tool.name }}</span>
                <p class="text-xs text-slate-500 mt-1">{{ tool.desc }}</p>
              </div>
            </button>
            <div
              v-else
              role="note"
              class="doc-surface rounded-xl p-4 flex gap-3 items-start cursor-default border border-slate-200"
              @click="showComingSoon"
            >
              <div
                class="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center"
                :class="tool.bgColor"
              >
                <van-icon :name="tool.icon" size="20" :class="tool.iconColor" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-slate-900 text-sm">{{ tool.name }}</span>
                  <span class="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">即将上线</span>
                </div>
                <p class="text-xs text-slate-500 mt-1">{{ tool.desc }}</p>
              </div>
            </div>
          </template>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import { siteTools, type SiteTool } from '~~/data/siteTools'

useHead({
  title: '小工具工作台 - Nexus Tools'
})

const developerTools = computed(() => siteTools)

const availableCount = computed(
  () => siteTools.filter(t => t.path).length
)

const { matchedTools, normalizedQuery, contentHint, jsonDetected, openTool } = useToolSearch()

const highlightId = computed(() => {
  if (jsonDetected.value) return 'json'
  return contentHint.value?.toolId ?? null
})

const showComingSoon = () => {
  showToast('该工具即将上线')
}

const handleToolClick = (tool: SiteTool) => {
  if (!tool.path) {
    showComingSoon()
    return
  }
  void openTool(tool)
}
</script>
