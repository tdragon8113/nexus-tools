<template>
  <div class="json-tree text-sm font-mono leading-relaxed break-words">
    <template v-if="data === null">
      <span class="text-violet-600">null</span>
    </template>
    <template v-else-if="typeof data === 'boolean'">
      <span class="text-amber-700">{{ String(data) }}</span>
    </template>
    <template v-else-if="typeof data === 'number'">
      <span class="text-cyan-700">{{ data }}</span>
    </template>
    <template v-else-if="typeof data === 'string'">
      <span class="text-emerald-700">{{ jsonStringLiteral(data) }}</span>
    </template>
    <details
      v-else-if="Array.isArray(data)"
      class="json-tree__details group"
      :open="defaultOpen"
    >
      <summary
        class="cursor-pointer list-none text-slate-600 hover:text-blue-600 select-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-1"
      >
        <span class="text-slate-400 group-open:rotate-90 transition-transform inline-block w-3">▸</span>
        <span>[ {{ (data as unknown[]).length }} ]</span>
      </summary>
      <ul class="mt-1 ml-4 pl-2 border-l border-slate-200 space-y-1 list-none">
        <li v-for="(item, i) in data as unknown[]" :key="i" class="flex gap-2 flex-wrap">
          <span class="text-slate-400 shrink-0 tabular-nums w-8 text-right">{{ i }}</span>
          <span class="text-slate-500">:</span>
          <div class="min-w-0 flex-1">
            <JsonTreeView :data="item" :depth="depth + 1" />
          </div>
        </li>
      </ul>
    </details>
    <details
      v-else
      class="json-tree__details group"
      :open="defaultOpen"
    >
      <summary
        class="cursor-pointer list-none text-slate-600 hover:text-blue-600 select-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-1"
      >
        <span class="text-slate-400 group-open:rotate-90 transition-transform inline-block w-3">▸</span>
        <span>{ {{ keys.length }} keys }</span>
      </summary>
      <ul class="mt-1 ml-4 pl-2 border-l border-slate-200 space-y-1 list-none">
        <li v-for="k in keys" :key="k" class="flex gap-2 flex-wrap">
          <span class="text-blue-700 font-medium shrink-0">"{{ k }}"</span>
          <span class="text-slate-500">:</span>
          <div class="min-w-0 flex-1">
            <JsonTreeView :data="(data as Record<string, unknown>)[k]" :depth="depth + 1" />
          </div>
        </li>
      </ul>
    </details>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'JsonTreeView' })

const props = withDefaults(
  defineProps<{
    data: unknown
    /** 深层默认折叠，减轻大 JSON 压力 */
    depth?: number
  }>(),
  { depth: 0 }
)

const defaultOpen = computed(() => props.depth < 2)

function jsonStringLiteral(s: string): string {
  return JSON.stringify(s)
}

const keys = computed(() => {
  const d = props.data
  if (d === null || typeof d !== 'object' || Array.isArray(d)) return [] as string[]
  // 与 JSON.parse / JSON.stringify 一致：按对象键的插入顺序，不额外排序
  return Object.keys(d as object)
})
</script>
