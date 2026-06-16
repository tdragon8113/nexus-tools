<template>
  <div class="table-tool-page desktop-tool-page flex h-full min-h-0 flex-col overflow-hidden">
    <div class="nexus-toolbar shrink-0 flex-col gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            class="table-tbar-tip"
            :class="tbarBtn"
            data-tip="加载示例"
            aria-label="示例"
            @click="loadSample"
          >
            <van-icon name="notes-o" size="18" />
          </button>
          <button
            type="button"
            class="table-tbar-tip"
            :class="tbarBtn"
            data-tip="导入文件"
            aria-label="导入"
            @click="triggerImport"
          >
            <van-icon name="upgrade" size="18" />
          </button>
          <button
            type="button"
            class="table-tbar-tip"
            :class="tbarBtn"
            data-tip="转置"
            aria-label="转置"
            :disabled="!hasRows"
            @click="transposeTable"
          >
            <van-icon name="exchange" size="18" />
          </button>
          <button
            type="button"
            class="table-tbar-tip"
            :class="tbarBtn"
            data-tip="删除空行"
            aria-label="删除空行"
            :disabled="!hasRows"
            @click="stripEmptyRows"
          >
            <van-icon name="filter-o" size="18" />
          </button>
          <button
            type="button"
            class="table-tbar-tip"
            :class="tbarBtn"
            data-tip="去重"
            aria-label="去重"
            :disabled="!hasRows"
            @click="dedupeTable"
          >
            <van-icon name="cluster-o" size="18" />
          </button>
          <button
            type="button"
            class="table-tbar-tip"
            :class="tbarBtnDanger"
            data-tip="清空"
            aria-label="清空"
            :disabled="!hasRows && !pasteInput"
            @click="clearAll"
          >
            <van-icon name="delete-o" size="18" />
          </button>
        </div>

        <span class="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:inline" aria-hidden="true" />

        <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
          <input v-model="hasHeader" type="checkbox" class="rounded border-slate-300">
          首行为表头
        </label>
      </div>

      <div
        v-if="showPaste"
        class="nexus-upload-zone w-full"
      >
        <label class="block text-xs font-medium text-slate-700">粘贴或拖拽表格数据</label>
        <textarea
          v-model="pasteInput"
          class="nexus-tool-input mt-2 min-h-[88px] w-full px-3 py-2 font-mono text-xs"
          placeholder="CSV、TSV、JSON 数组，或从 Excel 复制的表格…"
          spellcheck="false"
          @keydown.meta.enter.prevent="applyPaste"
          @keydown.ctrl.enter.prevent="applyPaste"
        />
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="nexus-btn-secondary text-xs"
            :disabled="!pasteInput.trim() || parsing"
            @click="applyPaste"
          >
            {{ parsing ? '解析中…' : '解析到表格' }}
          </button>
          <p class="text-[11px] text-slate-500">
            支持 .csv / .tsv / .json / .xlsx · Cmd/Ctrl+Enter 解析
          </p>
        </div>
      </div>
    </div>

    <div
      class="table-tool-workspace mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain lg:flex lg:flex-col lg:overflow-hidden"
    >
      <div class="table-tool-split flex flex-col gap-3 pb-2 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-2 lg:pb-0">
        <div class="table-tool-editor lg:min-w-0 lg:flex-1">
          <div class="flex shrink-0 items-center justify-between gap-2">
            <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              表格编辑器
            </h2>
            <button
              type="button"
              class="text-[11px] text-indigo-600 hover:text-indigo-700"
              @click="showPaste = !showPaste"
            >
              {{ showPaste ? '收起输入' : '展开输入' }}
            </button>
          </div>
          <TableConvertGrid
            v-if="hasRows"
            class="table-tool-grid min-h-0 flex-1"
            :rows="rows"
            :has-header="hasHeader"
            @update:cell="updateCell"
            @add-row="addRow"
            @add-col="addCol"
            @remove-row="removeSelectedRow"
            @remove-col="removeSelectedCol"
            @select-row="selectedRow = $event"
            @select-col="selectedCol = $event"
          />
          <div
            v-else
            class="table-tool-grid table-tool-grid--empty flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500"
          >
            粘贴数据、导入文件，或点击「示例」开始编辑
          </div>
        </div>

        <section
          class="table-tool-export lg:flex-1"
          :class="{ 'table-tool-export--json': isJsonOutput }"
        >
          <h2 class="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            导出格式
          </h2>
          <div class="table-tool-export-body">
            <div
              class="table-tool-export-options shrink-0 rounded-xl border border-slate-200/90 bg-white p-2.5"
              :class="isJsonOutput ? 'space-y-2' : 'space-y-3'"
            >
              <label class="block text-xs text-slate-600">
                <span class="mb-1 block">输出格式</span>
                <select
                  v-model="outputFormat"
                  class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option
                    v-for="item in TABLE_OUTPUT_FORMATS"
                    :key="item.id"
                    :value="item.id"
                  >
                    {{ item.label }}
                  </option>
                </select>
              </label>

              <div
                v-if="isJsonOutput"
                class="table-tool-json-options grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-slate-600"
              >
                <label class="col-span-2 flex cursor-pointer items-center gap-2 sm:col-span-1">
                  <input v-model="minify" type="checkbox" class="rounded border-slate-300">
                  压缩输出
                </label>
                <label v-if="!minify" class="block sm:col-span-1">
                  <span class="mb-1 block">缩进</span>
                  <select
                    v-model="indent"
                    class="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                  >
                    <option value="2">2 空格</option>
                    <option value="4">4 空格</option>
                    <option value="tab">Tab</option>
                  </select>
                </label>
                <label class="col-span-2 block">
                  <span class="mb-1 block">根对象名（可选）</span>
                  <input
                    v-model="jsonRootKey"
                    type="text"
                    class="w-full rounded-md border border-slate-200 px-2 py-1 font-mono text-xs"
                    placeholder="data"
                  >
                </label>
              </div>

              <label
                v-if="outputFormat === 'sql'"
                class="block text-xs text-slate-600"
              >
                <span class="mb-1 block">表名</span>
                <input
                  v-model="sqlTableName"
                  type="text"
                  class="w-full rounded-md border border-slate-200 px-2 py-1 font-mono text-xs"
                  placeholder="table_name"
                >
              </label>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="nexus-btn-primary flex-1 text-xs"
                  :disabled="!outputText"
                  @click="copyOutput"
                >
                  复制
                </button>
                <button
                  type="button"
                  class="nexus-btn-secondary flex-1 text-xs"
                  :disabled="!outputText"
                  @click="downloadOutput"
                >
                  下载
                </button>
              </div>
            </div>

            <textarea
              :value="outputText"
              readonly
              class="table-tool-output nexus-tool-input resize-none overflow-y-auto px-3 py-2 font-mono text-xs"
              placeholder="转换结果将显示在这里"
              spellcheck="false"
            />
          </div>
        </section>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".csv,.tsv,.txt,.json,.xlsx,.xls"
      class="sr-only"
      @change="onFileSelected"
    >
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import TableConvertGrid from '~/components/TableConvertGrid.vue'
import { copyWithToast } from '~/composables/useCopyText'
import {
  getDesktopLocalStateValue,
  persistDesktopLocalStateKeyFireAndForget
} from '~/core/desktopLocalState'
import {
  dedupeRows,
  exportTable,
  normalizeRows,
  outputFileExtension,
  parseTableExcelBuffer,
  parseTableInputErrorMessage,
  parseTableTextInput,
  removeEmptyRows,
  SAMPLE_TABLE_ROWS,
  TABLE_OUTPUT_FORMATS,
  transposeRows,
  type TableIndent,
  type TableOutputFormat
} from '~/utils/tableConvert'
import { RENDERER_LOCAL_STATE_KEYS } from '~~/shared/rendererLocalState'

const OUTPUT_FORMAT_KEY = RENDERER_LOCAL_STATE_KEYS.tableConvertFormat
const HAS_HEADER_KEY = RENDERER_LOCAL_STATE_KEYS.tableConvertHasHeader

const tbarBtn =
  'inline-flex size-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40'
const tbarBtnDanger =
  'inline-flex size-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 disabled:opacity-40'

const rows = ref<string[][]>([])
const pasteInput = ref('')
const showPaste = ref(true)
const parsing = ref(false)
const hasHeader = ref(true)
const outputFormat = ref<TableOutputFormat>('json-objects')
const minify = ref(false)
const indent = ref<TableIndent>('2')
const jsonRootKey = ref('')
const sqlTableName = ref('table_name')
const selectedRow = ref<number | null>(null)
const selectedCol = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const stateReady = ref(false)

const hasRows = computed(() => rows.value.length > 0)
const isJsonOutput = computed(() => outputFormat.value.startsWith('json-'))

const outputText = computed(() => {
  if (!hasRows.value) return ''
  return exportTable(rows.value, outputFormat.value, {
    hasHeader: hasHeader.value,
    minify: minify.value,
    indent: indent.value,
    jsonRootKey: jsonRootKey.value,
    sqlTableName: sqlTableName.value
  })
})

onMounted(() => {
  if (!import.meta.client) return
  const savedFormat = getDesktopLocalStateValue(OUTPUT_FORMAT_KEY)
  if (savedFormat && TABLE_OUTPUT_FORMATS.some((item) => item.id === savedFormat)) {
    outputFormat.value = savedFormat as TableOutputFormat
  }
  const savedHeader = getDesktopLocalStateValue(HAS_HEADER_KEY)
  if (savedHeader === '0') hasHeader.value = false
  if (savedHeader === '1') hasHeader.value = true
  void nextTick(() => {
    stateReady.value = true
  })
})

watch(outputFormat, (value) => {
  if (stateReady.value) persistDesktopLocalStateKeyFireAndForget(OUTPUT_FORMAT_KEY, value)
})

watch(hasHeader, (value) => {
  if (stateReady.value) persistDesktopLocalStateKeyFireAndForget(HAS_HEADER_KEY, value ? '1' : '0')
})

function setRows(next: string[][]) {
  rows.value = normalizeRows(next)
  selectedRow.value = null
  selectedCol.value = null
}

function updateCell(rowIndex: number, colIndex: number, value: string) {
  const next = rows.value.map((row) => [...row])
  if (!next[rowIndex]) return
  next[rowIndex][colIndex] = value
  rows.value = next
}

function addRow() {
  const cols = rows.value[0]?.length ?? 1
  rows.value = [...rows.value, Array.from({ length: cols }, () => '')]
}

function addCol() {
  if (!rows.value.length) {
    rows.value = [['']]
    return
  }
  rows.value = rows.value.map((row) => [...row, ''])
}

function removeSelectedRow() {
  if (selectedRow.value === null) return
  const next = rows.value.filter((_, index) => index !== selectedRow.value)
  setRows(next.length ? next : [['']])
}

function removeSelectedCol() {
  if (selectedCol.value === null) return
  const index = selectedCol.value
  const next = rows.value.map((row) => row.filter((_, colIndex) => colIndex !== index))
  setRows(next[0]?.length ? next : [['']])
}

async function applyPaste() {
  const text = pasteInput.value.trim()
  if (!text) {
    showToast('请先粘贴数据')
    return
  }
  parsing.value = true
  try {
    setRows(await parseTableTextInput(text))
    showToast(`已载入 ${rows.value.length} 行`)
    showPaste.value = false
  } catch (error) {
    showToast(parseTableInputErrorMessage(error))
  } finally {
    parsing.value = false
  }
}

function loadSample() {
  setRows(SAMPLE_TABLE_ROWS.map((row) => [...row]))
  pasteInput.value = ''
  showPaste.value = false
  showToast('已加载示例表格')
}

function transposeTable() {
  setRows(transposeRows(rows.value))
  showToast('已转置')
}

function stripEmptyRows() {
  const next = removeEmptyRows(rows.value)
  setRows(next.length ? next : [['']])
  showToast('已删除空行')
}

function dedupeTable() {
  const next = dedupeRows(rows.value)
  setRows(next.length ? next : [['']])
  showToast('已去重')
}

function clearAll() {
  rows.value = []
  pasteInput.value = ''
  showPaste.value = true
}

function triggerImport() {
  fileInputRef.value?.click()
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  parsing.value = true
  try {
    const lower = file.name.toLowerCase()
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const buffer = await file.arrayBuffer()
      setRows(await parseTableExcelBuffer(buffer))
    } else {
      const text = await file.text()
      setRows(await parseTableTextInput(text))
    }
    showToast(`已导入 ${file.name}`)
    showPaste.value = false
  } catch (error) {
    showToast(parseTableInputErrorMessage(error))
  } finally {
    parsing.value = false
  }
}

async function copyOutput() {
  if (!outputText.value) return
  await copyWithToast(outputText.value)
}

function downloadOutput() {
  if (!outputText.value) return
  const ext = outputFileExtension(outputFormat.value)
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `table.${ext}`
  anchor.click()
  URL.revokeObjectURL(url)
  showToast('已开始下载')
}
</script>

<style scoped>
.table-tbar-tip {
  position: relative;
}

.table-tool-workspace {
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

.table-tool-editor,
.table-tool-export {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 窄屏：两块区域保持较高视口，整体超出时由 workspace 纵向滚动 */
.table-tool-editor {
  min-height: clamp(20rem, 52vh, 38rem);
  height: clamp(20rem, 52vh, 38rem);
}

.table-tool-grid,
.table-tool-grid--empty {
  min-height: 0;
  flex: 1 1 auto;
}

.table-tool-export {
  width: 100%;
}

.table-tool-export-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
}

.table-tool-export {
  min-height: clamp(22rem, 58vh, 40rem);
}

.table-tool-export--json {
  min-height: clamp(26rem, 72vh, 46rem);
}

.table-tool-output {
  flex: 1 1 auto;
  min-height: clamp(16rem, 46vh, 32rem);
  height: auto;
}

.table-tool-export--json .table-tool-output {
  min-height: clamp(18rem, 52vh, 36rem);
}

@media (min-width: 1024px) {
  .table-tool-workspace {
    display: flex;
    flex-direction: column;
  }

  .table-tool-split {
    min-height: 0;
  }

  .table-tool-editor {
    height: auto;
    min-height: 0;
    flex: 1 1 0;
  }

  .table-tool-export {
    width: min(100%, 22rem);
    min-height: 0;
    flex: 1 1 0;
  }

  .table-tool-export--json {
    min-height: 0;
  }

  .table-tool-export-body {
    flex: 1 1 auto;
    min-height: 0;
  }

  .table-tool-output {
    min-height: clamp(14rem, 30vh, 22rem);
    flex: 1 1 auto;
  }

  .table-tool-export--json .table-tool-output {
    min-height: clamp(16rem, 34vh, 26rem);
  }
}

.table-tbar-tip::after {
  content: attr(data-tip);
  position: absolute;
  left: 50%;
  top: calc(100% + 6px);
  z-index: 30;
  translate: -50% 0;
  white-space: nowrap;
  border-radius: 0.375rem;
  background: rgb(15 23 42 / 0.92);
  padding: 0.25rem 0.5rem;
  font-size: 11px;
  color: white;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}

.table-tbar-tip:hover::after,
.table-tbar-tip:focus-visible::after {
  opacity: 1;
}
</style>
