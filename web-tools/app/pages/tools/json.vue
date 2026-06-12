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
          data-tip="全部展开"
          aria-label="全部展开"
          @click="expandAll"
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
            <path d="M7 17V13" />
            <path d="M7 17H11" />
            <path d="M17 7H13" />
            <path d="M17 7V11" />
          </svg>
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="全部折叠"
          aria-label="全部折叠"
          @click="collapseAll"
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
            <path d="M9 15V19" />
            <path d="M9 15H5" />
            <path d="M15 9H19" />
            <path d="M15 9V5" />
          </svg>
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="压缩复制"
          aria-label="压缩复制"
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
        </select>
      </label>
      <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
        <input v-model="sortKeys" type="checkbox" class="rounded border-slate-300 text-indigo-600" />
        键名排序
      </label>

      <span class="ml-auto text-xs tabular-nums text-slate-400">{{ lineCount }} 行</span>
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
import { copyWithToast } from '~/composables/useCopyText'
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


const jsonText = ref('')
const jsonPaneRef = ref<{
  syncDocFromModel?: () => void
  foldAll?: () => boolean
  unfoldAll?: () => boolean
} | null>(null)

function jsonParseFailed(raw: string): boolean {
  if (!sliceForJsonParse(raw).slice) return false
  return !parseJson(raw).ok
}

const indentMode = ref<IndentMode>('2')
const sortKeys = ref(false)
/** 勾选「键名排序」前的文本，用于取消排序时恢复键顺序 */
const keyOrderBaseline = ref<string | null>(null)

const lineCount = computed(() => lineCountFor(jsonText.value))
const editorTabSize = computed(() => (indentMode.value === 'tab' ? 4 : Number(indentMode.value)))
const editorSingleIndent = computed(() => {
  const g = getIndent(indentMode.value)
  return g === '\t' ? '\t' : ' '.repeat(g as number)
})

type FormatJsonResult =
  | { ok: true; text: string }
  | { ok: false; message: string }

function stringifyValue(
  v: unknown,
  minified: boolean,
  sourceForOrders: string,
  orderSourceOverride?: string
): string {
  let value = v
  if (sortKeys.value) value = sortKeysDeep(value)

  if (sortKeys.value) {
    return minified
      ? JSON.stringify(value)
      : JSON.stringify(value, null, getIndent(indentMode.value))
  }

  const orderText = orderSourceOverride ?? sourceForOrders
  const { slice } = sliceForJsonParse(orderText)
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

function formatRawJson(
  raw: string,
  minified: boolean,
  orderSourceOverride?: string
): FormatJsonResult {
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
    text: stringifyValue(result.value, minified, raw, orderSourceOverride)
  }
}

function applyFormat(minified: boolean, orderSourceOverride?: string) {
  const out = formatRawJson(jsonText.value, minified, orderSourceOverride)
  if (!out.ok) {
    showToast(out.message)
    return
  }
  jsonText.value = trimTrailingBlankLines(out.text)
}

function formatJson() {
  applyFormat(false)
}

function collapseAll() {
  if (!jsonText.value.trim()) return
  if (!jsonPaneRef.value?.foldAll?.()) showToast('没有可折叠的内容')
}

function expandAll() {
  if (!jsonText.value.trim()) return
  jsonPaneRef.value?.unfoldAll?.()
}

function compressAndCopy() {
  const out = formatRawJson(jsonText.value, true)
  if (!out.ok) {
    showToast(out.message)
    return
  }
  const compressed = trimTrailingBlankLines(out.text)
  if (!compressed) {
    showToast('内容为空')
    return
  }
  void copyWithToast(compressed)
}

function clearAll() {
  jsonText.value = ''
  keyOrderBaseline.value = null
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

watch(sortKeys, (enabled) => {
  if (!jsonText.value.trim() || jsonParseFailed(jsonText.value)) return
  if (enabled) {
    keyOrderBaseline.value = normalizeJsonInput(jsonText.value)
    applyFormat(false)
    return
  }
  applyFormat(false, keyOrderBaseline.value ?? undefined)
  keyOrderBaseline.value = null
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
  color: var(--nexus-tool-tooltip-text);
  white-space: nowrap;
  background: var(--nexus-tool-tooltip-bg);
  border: 1px solid var(--nexus-tool-tooltip-border);
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
