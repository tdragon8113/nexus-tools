<template>
  <div
    class="table-grid flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white"
  >
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
      <p class="text-xs font-medium text-slate-600">
        {{ rowCount }} 行 × {{ colCount }} 列
      </p>
      <div class="flex flex-wrap items-center gap-1.5">
        <button type="button" class="table-grid-btn" @click="emit('add-row')">+ 行</button>
        <button type="button" class="table-grid-btn" @click="emit('add-col')">+ 列</button>
        <button
          type="button"
          class="table-grid-btn"
          :disabled="!selectedRow"
          @click="emit('remove-row')"
        >
          − 行
        </button>
        <button
          type="button"
          class="table-grid-btn"
          :disabled="!selectedCol"
          @click="emit('remove-col')"
        >
          − 列
        </button>
      </div>
    </div>

    <div class="table-grid-scroll min-h-0 flex-1 overflow-auto overscroll-contain">
      <table class="w-full min-w-max border-collapse text-xs">
        <thead>
          <tr>
            <th class="table-grid-corner sticky left-0 top-0 z-20 w-10 border-b border-r border-slate-200 bg-slate-50" />
            <th
              v-for="(_, colIndex) in colCount"
              :key="`h-${colIndex}`"
              class="table-grid-col-head sticky top-0 z-10 min-w-[6rem] border-b border-r border-slate-200 bg-slate-50 px-1 py-1 text-center font-medium text-slate-500"
              :class="{ 'table-grid-col-head--active': selectedCol === colIndex }"
              @click="selectCol(colIndex)"
            >
              {{ columnLabel(colIndex) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rows" :key="`r-${rowIndex}`">
            <th
              class="table-grid-row-head sticky left-0 z-10 w-10 border-b border-r border-slate-200 bg-slate-50 px-1 py-1 text-center font-medium text-slate-500"
              :class="{ 'table-grid-row-head--active': selectedRow === rowIndex }"
              @click="selectRow(rowIndex)"
            >
              {{ rowIndex + 1 }}
            </th>
            <td
              v-for="(_, colIndex) in row"
              :key="`c-${rowIndex}-${colIndex}`"
              class="border-b border-r border-slate-100 p-0"
              :class="{
                'bg-indigo-50/70': selectedRow === rowIndex || selectedCol === colIndex,
                'bg-amber-50/80': hasHeader && rowIndex === 0
              }"
            >
              <input
                :value="row[colIndex]"
                class="table-grid-cell"
                spellcheck="false"
                @input="onCellInput(rowIndex, colIndex, $event)"
                @focus="onCellFocus(rowIndex, colIndex)"
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  rows: string[][]
  hasHeader?: boolean
}>()

const emit = defineEmits<{
  'update:cell': [rowIndex: number, colIndex: number, value: string]
  'add-row': []
  'add-col': []
  'remove-row': []
  'remove-col': []
  'select-row': [rowIndex: number | null]
  'select-col': [colIndex: number | null]
}>()

const selectedRow = ref<number | null>(null)
const selectedCol = ref<number | null>(null)

const rowCount = computed(() => props.rows.length)
const colCount = computed(() => props.rows[0]?.length ?? 0)
const hasHeader = computed(() => props.hasHeader ?? true)

function columnLabel(index: number): string {
  let label = ''
  let n = index + 1
  while (n > 0) {
    n -= 1
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26)
  }
  return label
}

function selectRow(rowIndex: number) {
  selectedRow.value = selectedRow.value === rowIndex ? null : rowIndex
  emit('select-row', selectedRow.value)
}

function selectCol(colIndex: number) {
  selectedCol.value = selectedCol.value === colIndex ? null : colIndex
  emit('select-col', selectedCol.value)
}

function onCellFocus(rowIndex: number, colIndex: number) {
  selectedRow.value = rowIndex
  selectedCol.value = colIndex
  emit('select-row', rowIndex)
  emit('select-col', colIndex)
}

function onCellInput(rowIndex: number, colIndex: number, event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:cell', rowIndex, colIndex, target.value)
}
</script>

<style scoped>
.table-grid-btn {
  @apply rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40;
}

.table-grid-cell {
  @apply block w-full min-w-[6rem] border-0 bg-transparent px-2 py-1.5 font-mono text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-500/25;
}

.table-grid-row-head--active,
.table-grid-col-head--active {
  @apply bg-indigo-100 text-indigo-700;
}

.table-grid-scroll {
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}
</style>
