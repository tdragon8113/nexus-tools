<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8">
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
                  class="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-500/10 px-1.5 py-0.5 rounded"
                >可用</span>
                <span
                  v-if="contentHint?.toolId === tool.id"
                  class="text-[10px] font-semibold uppercase tracking-wider text-purple-800 bg-purple-100/80 px-1.5 py-0.5 rounded"
                >内容匹配</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">{{ tool.desc }}</p>
            </div>
            <van-icon name="arrow" class="shrink-0 text-slate-400 mt-2" size="14" />
          </button>
          <button
            v-else-if="tool.id === 'timehub'"
            type="button"
            class="group w-full text-left doc-card-interactive rounded-xl px-4 py-3 flex gap-3 items-start border-indigo-100"
            @click="goTimeApp"
          >
            <div
              class="w-10 h-10 shrink-0 rounded-lg border border-indigo-100 bg-indigo-50 flex items-center justify-center"
            >
              <van-icon :name="tool.icon" size="20" class="text-indigo-600" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-slate-900 text-sm">{{ tool.name }}</span>
                <span
                  class="text-[10px] font-semibold text-indigo-700 bg-indigo-500/10 px-1.5 py-0.5 rounded"
                >独立站点</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">{{ tool.desc }}</p>
            </div>
            <van-icon name="arrow" class="shrink-0 text-indigo-400 mt-2" size="14" />
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
      <section class="mb-8" aria-labelledby="time-promo-heading">
        <h2 id="time-promo-heading" class="sr-only">
          时间管理
        </h2>
        <a
          :href="timeAppUrl"
          class="doc-card-interactive rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white"
        >
          <div
            class="w-12 h-12 shrink-0 rounded-xl bg-indigo-100 border border-indigo-100 flex items-center justify-center"
          >
            <van-icon name="notes-o" size="26" class="text-indigo-600" />
          </div>
          <div class="min-w-0 flex-1">
            <span class="font-medium text-slate-900">时间管理</span>
            <p class="text-sm text-slate-600 mt-1">
              番茄钟、日程、习惯与统计在独立站点使用，支持登录与云端同步。
            </p>
          </div>
          <span class="text-sm font-medium text-indigo-600 shrink-0">前往 →</span>
        </a>
      </section>

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
                <div class="flex items-center gap-2">
                  <span class="font-medium text-slate-900 text-sm">{{ tool.name }}</span>
                  <span class="text-[10px] font-semibold text-blue-700 bg-blue-500/10 px-1.5 py-0.5 rounded">可用</span>
                </div>
                <p class="text-xs text-slate-500 mt-1">{{ tool.desc }}</p>
              </div>
            </button>
            <button
              v-else-if="tool.id === 'timehub'"
              type="button"
              class="doc-card-interactive rounded-xl p-4 text-left flex gap-3 items-start cursor-pointer border-indigo-100 w-full"
              @click="goTimeApp"
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
                  <span class="text-[10px] font-semibold text-indigo-700 bg-indigo-500/10 px-1.5 py-0.5 rounded">独立站点</span>
                </div>
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

const config = useRuntimeConfig()
const timeAppUrl = computed(() => String(config.public.timeAppUrl || '/'))

const developerTools = computed(() => siteTools)

const availableCount = computed(
  () => siteTools.filter(t => t.path).length
)

const { matchedTools, normalizedQuery, contentHint, jsonDetected, query, clearQuery } = useToolSearch()
const { setJsonPrefill } = useJsonPrefill()

const highlightId = computed(() => {
  if (jsonDetected.value) return 'json'
  return contentHint.value?.toolId ?? null
})

const showComingSoon = () => {
  showToast('该工具即将上线')
}

const goTimeApp = () => {
  if (import.meta.client) {
    window.location.href = timeAppUrl.value
  }
}

const handleToolClick = (tool: SiteTool) => {
  if (tool.id === 'timehub') {
    goTimeApp()
    return
  }
  if (!tool.path) {
    showComingSoon()
    return
  }
  if (tool.id === 'json' && jsonDetected.value) {
    setJsonPrefill(query.value.trim())
    clearQuery()
  }
  void navigateTo(tool.path)
}
</script>
