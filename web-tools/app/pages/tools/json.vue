<template>
  <div class="json-tool-page desktop-tool-page flex h-full min-h-0 flex-col">
    <div
      class="nexus-toolbar"
    >
      <div class="flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="格式化"
          aria-label="格式化"
          @click="formatJson"
        >
          <svg
            class="size-[18px] shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M5 7h14M5 12h8.5M5 17h14" />
          </svg>
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="压缩为一行并复制"
          aria-label="压缩为一行并复制"
          @click="compressAndCopy"
        >
          <svg
            class="size-[18px] shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5.25 12 7.75M9.25 6.5 12 8.75 14.75 6.5" />
            <path d="M5 10.5h14M5 13h14" />
            <path d="M12 18.75 12 16.25M9.25 17.5 12 15.25 14.75 17.5" />
          </svg>
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="复制"
          aria-label="复制"
          @click="copyText"
        >
          <van-icon name="description" size="18" />
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="导入文件"
          aria-label="导入文件"
          @click="triggerImport"
        >
          <van-icon name="upgrade" size="18" />
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="[jsonTbarBtnDefault, jsonTbarBtnDisabled]"
          data-tip="下载 JSON"
          aria-label="下载 JSON"
          :disabled="!jsonText.trim()"
          @click="downloadJson"
        >
          <van-icon name="down" size="18" />
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDanger"
          data-tip="清空"
          aria-label="清空"
          @click="clearAll"
        >
          <van-icon name="delete-o" size="18" />
        </button>
      </div>

      <span class="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:inline" aria-hidden="true" />

      <label class="flex items-center gap-1.5 text-xs text-slate-600">
        <span class="shrink-0">缩进</span>
        <select
          v-model="indentMode"
          class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="2">2 空格</option>
          <option value="4">4 空格</option>
          <option value="tab">Tab</option>
        </select>
      </label>
      <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
        <input v-model="sortKeys" type="checkbox" class="rounded border-slate-300 text-indigo-600" />
        键名排序
      </label>

      <span class="ml-auto text-xs tabular-nums text-slate-400">{{ lineCount }} 行</span>

      <input
        ref="fileInputRef"
        type="file"
        accept=".json,application/json,text/json"
        class="hidden"
        @change="onFileSelected"
      />
    </div>

    <section
      class="json-editor-shell doc-surface flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[var(--doc-code-bg)]"
    >
      <JsonCodeMirrorPane
        ref="jsonPaneRef"
        v-model="jsonText"
        fill-height
        :tab-size="editorTabSize"
        :single-indent="editorSingleIndent"
        placeholder="在此粘贴或输入 JSON，点击工具栏「格式化」…"
        @paste="onEditorPaste"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import {
  parseJson,
  sortKeysDeep,
  getIndent,
  lineCountFor,
  sliceForJsonParse,
  normalizeJsonInput,
  trimTrailingBlankLines,
  type IndentMode
} from '~/utils/jsonTool'
import {
  extractSourceKeyOrders,
  stringifyCompactWithSourceOrder,
  stringifyPrettyWithSourceOrder
} from '~/utils/jsonPrettyOrdered'

useHead({
  title: 'JSON 格式化 - Nexus Tools'
})

const jsonTbarBtnCore =
  'relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border-0 outline-none transition-[background-color,opacity,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-offset-2'
const jsonTbarBtnDefault = `${jsonTbarBtnCore} bg-transparent text-slate-600 hover:bg-black/[0.055] active:bg-black/[0.08] focus-visible:ring-slate-300/60`
const jsonTbarBtnDanger = `${jsonTbarBtnCore} bg-transparent text-red-600 hover:bg-red-500/[0.08] active:bg-red-500/[0.12] focus-visible:ring-red-300/50`
const jsonTbarBtnDisabled = 'disabled:opacity-40 disabled:pointer-events-none'


const jsonText = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const jsonPaneRef = ref<{ syncDocFromModel?: () => void } | null>(null)

function jsonParseFailed(raw: string): boolean {
  if (!sliceForJsonParse(raw).slice) return false
  return !parseJson(raw).ok
}

const indentMode = ref<IndentMode>('2')
const sortKeys = ref(false)

const lineCount = computed(() => lineCountFor(jsonText.value))
const editorTabSize = computed(() => (indentMode.value === 'tab' ? 4 : Number(indentMode.value)))
const editorSingleIndent = computed(() => {
  const g = getIndent(indentMode.value)
  return g === '\t' ? '\t' : ' '.repeat(g as number)
})

type FormatJsonResult =
  | { ok: true; text: string }
  | { ok: false; message: string }

function stringifyValue(v: unknown, minified: boolean, sourceForOrders: string): string {
  let value = v
  if (sortKeys.value) value = sortKeysDeep(value)

  if (sortKeys.value) {
    return minified
      ? JSON.stringify(value)
      : JSON.stringify(value, null, getIndent(indentMode.value))
  }

  const { slice } = sliceForJsonParse(sourceForOrders)
  const orders = slice ? extractSourceKeyOrders(slice) : null
  if (!orders) {
    return minified
      ? JSON.stringify(value)
      : JSON.stringify(value, null, getIndent(indentMode.value))
  }
  return minified
    ? stringifyCompactWithSourceOrder(value, orders)
    : stringifyPrettyWithSourceOrder(value, orders, indentMode.value)
}

function formatRawJson(raw: string, minified: boolean): FormatJsonResult {
  raw = normalizeJsonInput(raw)
  if (!sliceForJsonParse(raw).slice) {
    return { ok: true, text: '' }
  }
  const result = parseJson(raw)
  if (!result.ok) {
    return { ok: false, message: result.message }
  }
  return {
    ok: true,
    text: stringifyValue(result.value, minified, raw)
  }
}

function applyFormat(minified: boolean) {
  const out = formatRawJson(jsonText.value, minified)
  if (!out.ok) {
    showToast(out.message)
    return
  }
  jsonText.value = trimTrailingBlankLines(out.text)
}

function formatJson() {
  applyFormat(false)
}

function compressAndCopy() {
  applyFormat(true)
  if (jsonParseFailed(jsonText.value)) return
  void copyText()
}

async function copyText() {
  if (!jsonText.value.trim()) {
    showToast('内容为空')
    return
  }
  try {
    await navigator.clipboard.writeText(jsonText.value)
    showToast('已复制')
  } catch {
    showToast('复制失败')
  }
}

function triggerImport() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    applyPrefillRaw(String(reader.result ?? ''))
  }
  reader.onerror = () => showToast('读取文件失败')
  reader.readAsText(file, 'UTF-8')
}

function downloadJson() {
  if (!jsonText.value.trim()) return
  const blob = new Blob([jsonText.value], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.json'
  a.click()
  URL.revokeObjectURL(url)
  showToast('已开始下载')
}

function clearAll() {
  jsonText.value = ''
}

function setJsonFromRaw(raw: string) {
  raw = normalizeJsonInput(raw)
  if (!sliceForJsonParse(raw).slice) {
    jsonText.value = trimTrailingBlankLines(raw)
  } else {
    const out = formatRawJson(raw, false)
    jsonText.value = trimTrailingBlankLines(out.ok ? out.text || raw : raw)
  }
}

/** 文件导入等：写入后同步 CodeMirror */
function applyPrefillRaw(raw: string) {
  setJsonFromRaw(raw)
  void nextTick(() => {
    jsonPaneRef.value?.syncDocFromModel?.()
    requestAnimationFrame(() => jsonPaneRef.value?.syncDocFromModel?.())
  })
}

function onEditorPaste(raw: string) {
  const normalized = trimTrailingBlankLines(normalizeJsonInput(raw))
  if (!sliceForJsonParse(normalized).slice) return
  if (!parseJson(normalized).ok) return
  const out = formatRawJson(normalized, false)
  if (!out.ok) return
  jsonText.value = trimTrailingBlankLines(out.text)
}

useConsumeToolPrefill('json', withCodeMirrorPrefillSync(setJsonFromRaw, jsonPaneRef))

watch(indentMode, () => {
  if (!jsonText.value.trim() || jsonParseFailed(jsonText.value)) return
  applyFormat(false)
})

watch(sortKeys, () => {
  if (!jsonText.value.trim() || jsonParseFailed(jsonText.value)) return
  applyFormat(false)
})
</script>

<style>
.json-tbar-tip[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  left: 50%;
  top: calc(100% + 6px);
  transform: translateX(-50%);
  padding: 7px 12px;
  font-size: 12px;
  line-height: 1.35;
  font-weight: 500;
  color: rgb(51 65 85);
  white-space: nowrap;
  background: #fff;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  box-shadow: 0 4px 14px rgb(15 23 42 / 0.08);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.14s ease, visibility 0.14s ease;
  z-index: 200;
}

.json-tbar-tip[data-tip]:hover:not(:disabled)::after {
  opacity: 1;
  visibility: visible;
}

.json-editor-shell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
