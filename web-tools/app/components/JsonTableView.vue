<template>
  <div class="json-table-view overflow-auto max-h-full">
    <template v-if="model.kind === 'objects'">
      <table class="min-w-full border-collapse text-left font-mono text-xs">
        <thead>
          <tr>
            <th
              v-for="c in model.columns"
              :key="c"
              class="sticky top-0 z-[1] border-b border-slate-200 bg-slate-100 px-2 py-2 font-semibold text-slate-700 whitespace-nowrap"
            >
              {{ c }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, ri) in model.rows"
            :key="ri"
            class="border-b border-slate-100 hover:bg-slate-50/90"
          >
            <td
              v-for="c in model.columns"
              :key="c"
              class="max-w-[18rem] px-2 py-1.5 align-top text-slate-800"
            >
              <span class="line-clamp-3 break-all" :title="fullCell(row, c)">{{ previewCell(row, c) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
    <template v-else>
      <table class="min-w-full border-collapse text-left font-mono text-xs">
        <thead>
          <tr>
            <th
              class="sticky top-0 z-[1] w-[40%] border-b border-slate-200 bg-slate-100 px-2 py-2 font-semibold text-slate-700"
            >
              路径
            </th>
            <th
              class="sticky top-0 z-[1] border-b border-slate-200 bg-slate-100 px-2 py-2 font-semibold text-slate-700"
            >
              值
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(r, i) in model.rows"
            :key="i"
            class="border-b border-slate-100 hover:bg-slate-50/90"
          >
            <td class="px-2 py-1.5 align-top text-violet-700 break-all">{{ r.path }}</td>
            <td class="max-w-[24rem] px-2 py-1.5 align-top text-slate-800">
              <span class="line-clamp-4 break-all" :title="r.value">{{ r.value }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildJsonTable, cellPreview } from '~/utils/jsonTable'

const props = defineProps<{
  data: unknown
}>()

const model = computed(() => buildJsonTable(props.data))

function previewCell(row: Record<string, unknown>, key: string): string {
  return cellPreview(row[key])
}

function fullCell(row: Record<string, unknown>, key: string): string {
  const v = row[key]
  if (v === null) return 'null'
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v, null, 0)
  } catch {
    return String(v)
  }
}
</script>
