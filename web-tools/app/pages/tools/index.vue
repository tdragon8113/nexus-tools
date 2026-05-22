<script setup lang="ts">
import ToolGrid from '~/components/ToolGrid.vue'
import { prefillToolFromSearch } from '~/composables/useConsumeToolPrefill'
import type { SiteTool } from '~/core/tools'
import { siteTools } from '~/core/tools'

const filterQuery = ref('')
const searchQuery = useState('tool-search-query', () => '')

const availableCount = computed(
  () => siteTools.filter((t) => t.id !== 'more' && t.path).length
)

useHead({ title: '工具集 - Nexus Tools' })

async function onPick(tool: SiteTool) {
  if (!tool.path) return
  const q = String(searchQuery.value ?? '').trim()
  if (q) prefillToolFromSearch(tool.id, q)
  await navigateTo(tool.path)
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-8">
    <header class="mb-6 border-b border-slate-200/80 pb-5">
      <h1 class="font-display text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        工具集
      </h1>
      <p class="mt-2 text-sm text-slate-600">
        全部开发者小工具，本地处理不上传。
        <span class="tabular-nums text-slate-500">{{ availableCount }} 个已上线</span>
      </p>
    </header>

    <input
      v-model="filterQuery"
      type="search"
      placeholder="筛选工具…"
      class="mb-4 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
    />

    <ToolGrid :filter="filterQuery" columns="4" :on-pick="onPick" />
  </div>
</template>
