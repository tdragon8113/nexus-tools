<template>
  <div class="json-type-view overflow-auto max-h-full font-mono text-xs leading-relaxed">
    <p v-if="typeModel.truncated" class="mb-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-900">
      节点较多，仅显示前 {{ typeModel.lines.length }} 条路径（可缩小 JSON 后再试）。
    </p>
    <ul class="space-y-0.5 text-slate-800">
      <li v-for="(line, i) in typeModel.lines" :key="i" class="flex gap-2 flex-wrap break-all">
        <span class="shrink-0 text-violet-700">{{ line.path }}</span>
        <span class="text-slate-400">→</span>
        <span class="text-cyan-800">{{ line.typeLabel }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { collectJsonTypes, type JsonTypeLine } from '~/utils/jsonTypePaths'

const props = withDefaults(
  defineProps<{
    data: unknown
    maxLines?: number
  }>(),
  { maxLines: 4000 }
)

const typeModel = computed(() => {
  const acc: JsonTypeLine[] = []
  collectJsonTypes(props.data, '$', acc, props.maxLines + 1)
  return {
    lines: acc.slice(0, props.maxLines),
    truncated: acc.length > props.maxLines
  }
})
</script>
