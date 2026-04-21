<template>
  <div class="doc-page-gradient text-slate-900">
    <AppHeader />

    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <header class="pt-8 pb-10 md:pt-10 md:pb-12 border-b border-slate-200/80">
        <p class="doc-eyebrow mb-4">文档与工具</p>
        <h1 class="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
          开发者工具箱
        </h1>
        <p class="mt-5 doc-prose-muted text-base md:text-lg max-w-2xl">
          面向日常开发的一站式小工具集合：格式化、编解码与校验。请使用页面顶部搜索快速定位，或从索引与列表进入。
        </p>
      </header>

      <div class="py-10 lg:py-12 lg:flex lg:gap-12 lg:items-start">
        <aside
          class="hidden lg:block w-52 shrink-0 sticky top-[7.5rem] self-start border-r border-slate-200 pr-8"
        >
          <p class="doc-eyebrow mb-4">工具索引</p>
          <nav class="space-y-0.5" aria-label="工具索引">
            <button
              v-for="tool in matchedTools"
              :key="tool.id"
              type="button"
              class="w-full text-left px-2 py-1.5 rounded text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-500/5 transition-colors"
              @click="handleToolClick(tool)"
            >
              {{ tool.name }}
            </button>
          </nav>
          <p v-if="matchedTools.length === 0" class="text-sm text-slate-500">无匹配项</p>
        </aside>

        <main class="flex-1 min-w-0">
          <div class="flex items-baseline justify-between gap-4 mb-6">
            <h2 class="font-display text-xl font-semibold text-slate-900">全部工具</h2>
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
                type="button"
                class="group w-full text-left doc-surface rounded-xl px-4 py-4 flex gap-4 items-start transition-all hover:shadow-md hover:border-blue-200/80 hover:-translate-y-0.5"
                :class="highlightId === tool.id ? 'ring-2 ring-blue-400/60 border-blue-200' : ''"
                @click="handleToolClick(tool)"
              >
                <div
                  class="w-11 h-11 shrink-0 rounded-xl border border-slate-100 bg-white flex items-center justify-center group-hover:border-blue-300/60 group-hover:bg-blue-50/80 transition-colors shadow-sm"
                >
                  <van-icon :name="tool.icon" size="22" class="text-blue-600" />
                </div>
                <div class="min-w-0 flex-1 pt-0.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-slate-900">{{ tool.name }}</span>
                    <span
                      v-if="tool.path"
                      class="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-500/10 px-1.5 py-0.5 rounded"
                    >
                      可用
                    </span>
                    <span
                      v-else
                      class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                    >
                      即将上线
                    </span>
                    <span
                      v-if="contentHint?.toolId === tool.id"
                      class="text-[10px] font-semibold uppercase tracking-wider text-purple-800 bg-purple-100/80 px-1.5 py-0.5 rounded"
                    >
                      内容匹配
                    </span>
                  </div>
                  <p class="text-sm text-slate-500 mt-1">{{ tool.desc }}</p>
                </div>
                <van-icon
                  name="arrow"
                  class="shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors mt-2.5"
                  size="16"
                />
              </button>
            </li>
          </ul>
        </main>
      </div>
    </div>

    <footer class="border-t border-slate-200/80 mt-4 py-10 text-center text-sm text-slate-500">
      <p>© 2026 Nexus Tools · 为开发者整理</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import type { SiteTool } from '~~/data/siteTools'

definePageMeta({
  layout: false
})

const { matchedTools, normalizedQuery, contentHint, jsonDetected, query, clearQuery } = useToolSearch()
const { setJsonPrefill } = useJsonPrefill()

const highlightId = computed(() => {
  if (jsonDetected.value) return 'json'
  return contentHint.value?.toolId ?? null
})

const handleToolClick = (tool: SiteTool) => {
  if (tool.path) {
    if (tool.id === 'json' && jsonDetected.value) {
      setJsonPrefill(query.value.trim())
      clearQuery()
    }
    void navigateTo(tool.path)
    return
  }
  showToast('该工具即将上线')
}
</script>
