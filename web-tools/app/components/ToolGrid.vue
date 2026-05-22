<script setup lang="ts">
import { showToast } from 'vant'
import { toolMatchesQuery } from '~/core/search'
import { siteTools, type SiteTool } from '~/core/tools'

const props = withDefaults(
  defineProps<{
    filter?: string
    columns?: '2' | '3' | '4'
    onPick?: (tool: SiteTool) => void | Promise<void>
  }>(),
  { filter: '', columns: '3' }
)

const emit = defineEmits<{ pick: [tool: SiteTool] }>()

const tools = computed(() => siteTools.filter((t) => t.id !== 'more'))

const filtered = computed(() => {
  if (!props.filter.trim()) return tools.value
  return tools.value.filter((t) => toolMatchesQuery(t, props.filter))
})

const gridClass = computed(() => {
  if (props.columns === '2') return 'grid-cols-2'
  if (props.columns === '4') return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  return 'grid-cols-2 lg:grid-cols-3'
})

async function pick(tool: SiteTool) {
  if (!tool.path) {
    showToast('即将上线')
    return
  }
  if (props.onPick) {
    await props.onPick(tool)
    return
  }
  emit('pick', tool)
}
</script>

<template>
  <div class="grid gap-2.5 sm:gap-3" :class="gridClass">
    <button
      v-for="tool in filtered"
      :key="tool.id"
      type="button"
      class="group flex flex-col items-start gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:gap-3 sm:p-4"
      :class="!tool.path ? 'cursor-default opacity-75' : ''"
      @click="pick(tool)"
    >
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 sm:h-11 sm:w-11"
        :class="tool.bgColor"
      >
        <van-icon :name="tool.icon" size="20" :class="tool.iconColor" />
      </div>
      <div class="min-w-0 w-full">
        <span class="block text-sm font-semibold text-slate-900">{{ tool.name }}</span>
        <span class="mt-1 block text-xs leading-relaxed text-slate-500">{{ tool.desc }}</span>
      </div>
    </button>
  </div>
  <p v-if="!filtered.length" class="py-10 text-center text-sm text-slate-500">没有匹配的工具</p>
</template>
