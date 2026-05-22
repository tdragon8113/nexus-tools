<script setup lang="ts">
import ToolGrid from '~/components/ToolGrid.vue'

definePageMeta({ layout: 'desktop' })

import type { SiteTool } from '~/core/tools'

const { goTool } = useDesktop()
const filter = ref('')

useHead({ title: '工具集 - Nexus Tools' })

async function onPick(tool: SiteTool) {
  await goTool(tool)
}
</script>

<template>
  <div class="p-1">
    <input
      v-model="filter"
      type="search"
      placeholder="筛选…"
      class="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
    />
    <ToolGrid :filter="filter" columns="2" :on-pick="onPick" />
  </div>
</template>
