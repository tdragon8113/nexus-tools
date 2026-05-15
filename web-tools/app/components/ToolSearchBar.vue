<template>
  <div class="w-full min-w-0">
    <label :for="inputId" class="sr-only">搜索工具或粘贴内容</label>
    <div
      class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-0.5 shadow-sm transition-colors focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20"
    >
      <span class="flex shrink-0 items-center justify-center text-slate-400" aria-hidden="true">
        <van-icon name="search" size="18" />
      </span>
      <input
        :id="inputId"
        v-model="query"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        :placeholder="placeholder"
        class="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
        @keydown.enter.prevent="onSearchEnter"
      />
      <button
        v-if="query"
        type="button"
        class="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="清空"
        @click="clearQuery"
      >
        <van-icon name="cross" size="16" />
      </button>
    </div>

    <div
      v-if="contentHint"
      class="mt-3 flex flex-col gap-3 rounded-xl border border-blue-200/80 bg-blue-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-sm text-blue-900">
        <span class="font-medium">已识别：</span>
        {{ contentHint.label }}，推荐
        <span class="font-semibold">{{ suggestedToolName }}</span>
      </p>
      <div class="flex shrink-0 gap-2">
        <button
          type="button"
          class="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          @click="openHintTool"
        >
          打开工具
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { siteTools } from '~~/data/siteTools'

const inputId = useId()

const {
  query,
  contentHint,
  clearQuery,
  openHintTool,
  onSearchEnter
} = useToolSearch()

const placeholder =
  '搜索工具名称，或粘贴 JSON、URL、时间戳、UUID…'

const suggestedToolName = computed(() => {
  const id = contentHint.value?.toolId
  if (!id) return ''
  return siteTools.find((t) => t.id === id)?.name ?? ''
})
</script>
