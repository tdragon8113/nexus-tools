<script setup lang="ts">
import type { SiteTool } from '~/core/tools'

const props = defineProps<{
  tools: SiteTool[]
  activeIndex: number
}>()

const emit = defineEmits<{
  'update:activeIndex': [index: number]
  pick: [tool: SiteTool]
}>()

function setActive(i: number) {
  emit('update:activeIndex', i)
}
</script>

<template>
  <div
    v-if="tools.length"
    class="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    role="listbox"
  >
    <button
      v-for="(tool, i) in tools"
      :key="tool.id"
      type="button"
      role="option"
      :aria-selected="i === props.activeIndex"
      class="flex w-[5.25rem] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition-colors"
      :class="
        i === props.activeIndex
          ? 'border-blue-400 bg-blue-50 shadow-sm shadow-blue-500/10'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50'
      "
      @mouseenter="setActive(i)"
      @mousedown.prevent="emit('pick', tool)"
    >
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl"
        :class="tool.bgColor"
      >
        <van-icon :name="tool.icon" size="22" :class="tool.iconColor" />
      </div>
      <span class="w-full truncate text-center text-xs font-medium leading-tight text-slate-800">
        {{ tool.name }}
      </span>
    </button>
  </div>
</template>
