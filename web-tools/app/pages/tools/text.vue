<template>
  <div class="text-tool-page desktop-tool-page flex h-full min-h-0 flex-col">
    <div
      class="relative z-30 mb-2 flex shrink-0 flex-col gap-2 overflow-visible rounded-xl border border-slate-200/85 bg-slate-50/90 px-2 py-1.5 shadow-sm"
    >
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            class="text-tbar-tip"
            :class="tbarBtn"
            data-tip="复制全文"
            aria-label="复制"
            :disabled="!text"
            @click="copyWithToast(text)"
          >
            <van-icon name="description" size="18" />
          </button>
          <button
            type="button"
            class="text-tbar-tip"
            :class="tbarBtn"
            data-tip="导入文件"
            aria-label="导入"
            @click="triggerImport"
          >
            <van-icon name="upgrade" size="18" />
          </button>
          <button
            type="button"
            class="text-tbar-tip"
            :class="[tbarBtn, tbarDisabled]"
            data-tip="下载为 .txt"
            aria-label="下载"
            :disabled="!text"
            @click="downloadText"
          >
            <van-icon name="down" size="18" />
          </button>
          <button
            type="button"
            class="text-tbar-tip"
            :class="tbarBtnDanger"
            data-tip="清空"
            aria-label="清空"
            :disabled="!text"
            @click="clearAll"
          >
            <van-icon name="delete-o" size="18" />
          </button>
        </div>

        <span class="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:inline" aria-hidden="true" />

        <label class="flex items-center gap-1.5 text-xs text-slate-600">
          <span class="shrink-0">语法</span>
          <select
            v-model="language"
            class="max-w-[7.5rem] rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500/20"
          >
            <option v-for="item in textDiffLanguages" :key="item.id" :value="item.id">
              {{ item.label }}
            </option>
          </select>
        </label>

        <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
          <input v-model="wordWrap" type="checkbox" class="rounded border-slate-300 text-stone-600" />
          自动换行
        </label>

        <span class="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:inline" aria-hidden="true" />

        <div class="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          <span class="shrink-0">处理</span>
          <select
            v-model="transformAction"
            class="max-w-[9rem] rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500/20"
            @change="onTransformSelect"
          >
            <option value="">选择操作…</option>
            <option v-for="item in transformOptions" :key="item.id" :value="item.id">
              {{ item.label }}
            </option>
          </select>
          <button
            type="button"
            class="rounded-md border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-800 shadow-sm hover:bg-stone-200/80 disabled:opacity-40"
            :disabled="!hasEditorContent || !transformAction"
            @click="runSelectedTransform"
          >
            执行
          </button>
        </div>

        <span class="ml-auto shrink-0 text-xs tabular-nums text-slate-400">
          {{ stats.lines }} 行 · {{ stats.chars }} 字 · {{ stats.words }} 词 · {{ formatBytes(stats.bytes) }}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="findQuery"
          type="text"
          placeholder="查找"
          spellcheck="false"
          class="min-w-[6rem] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-mono shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500/20 sm:max-w-[10rem]"
        />
        <input
          v-model="replaceQuery"
          type="text"
          placeholder="替换为"
          spellcheck="false"
          class="min-w-[6rem] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-mono shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500/20 sm:max-w-[10rem]"
        />
        <label class="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-slate-600">
          <input v-model="replaceCaseSensitive" type="checkbox" class="rounded border-slate-300 text-stone-600" />
          区分大小写
        </label>
        <label class="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-slate-600">
          <input v-model="replaceRegex" type="checkbox" class="rounded border-slate-300 text-stone-600" />
          正则
        </label>
        <button
          type="button"
          class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"
          :disabled="!hasEditorContent || !findQuery"
          @click="replaceAll"
        >
          全部替换
        </button>
        <span class="text-[11px] text-slate-400">Ctrl/Cmd+F 编辑器内查找</span>
      </div>
    </div>

    <section
      class="text-editor-shell doc-surface flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <TextDiffCodeMirrorPane
        ref="editorRef"
        v-model="text"
        :language="language"
        variant="plain"
        :word-wrap="wordWrap"
        class="min-h-0 flex-1"
      />
    </section>

    <input
      ref="fileInputRef"
      type="file"
      accept=".txt,.md,.csv,.log,.json,.xml,.yaml,.yml,.html,.css,.js,.ts,text/*"
      class="hidden"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import {
  dedupeLines,
  escapeHtml,
  normalizeLineEndings,
  removeEmptyLines,
  replaceAllInText,
  reverseLines,
  sortLines,
  textEditorStats,
  transformCase,
  trimLineEnds,
  unescapeHtml
} from '~/utils/textTool'
import {
  isTextDiffLanguageId,
  textDiffLanguages,
  type TextDiffLanguageId
} from '~/utils/textDiffCodeMirrorLanguage'

useHead({ title: '文本编辑 - Nexus Tools' })

const LANGUAGE_KEY = 'nexus-text-editor-language'
const WRAP_KEY = 'nexus-text-editor-wrap'

const text = ref('')
const language = ref<TextDiffLanguageId>('plain')
const wordWrap = ref(true)
const editorRef = ref<{
  syncDocFromModel?: () => void
  getDocument?: () => string
  setDocument?: (value: string) => void
} | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const findQuery = ref('')
const replaceQuery = ref('')
const replaceCaseSensitive = ref(false)
const replaceRegex = ref(false)
const transformAction = ref('')

const tbarCore =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full border-0 outline-none transition-[background-color,opacity] duration-150 focus-visible:ring-2 focus-visible:ring-offset-2'
const tbarBtn = `${tbarCore} bg-transparent text-slate-600 hover:bg-black/[0.055] active:bg-black/[0.08] focus-visible:ring-slate-300/60`
const tbarBtnDanger = `${tbarCore} bg-transparent text-red-600 hover:bg-red-500/[0.08] active:bg-red-500/[0.12] focus-visible:ring-red-300/50`
const tbarDisabled = 'disabled:opacity-40 disabled:pointer-events-none'

const transformOptions = [
  { id: 'trim-ends', label: '去除行尾空白' },
  { id: 'drop-empty', label: '删除空行' },
  { id: 'sort', label: '行排序' },
  { id: 'dedupe', label: '行去重' },
  { id: 'reverse', label: '行反转' },
  { id: 'lf', label: '换行 → LF' },
  { id: 'crlf', label: '换行 → CRLF' },
  { id: 'upper', label: '转大写' },
  { id: 'lower', label: '转小写' },
  { id: 'title', label: '首字母大写' },
  { id: 'escape-html', label: 'HTML 转义' },
  { id: 'unescape-html', label: 'HTML 反转义' }
] as const

const stats = computed(() => textEditorStats(text.value))

const hasEditorContent = computed(() => Boolean(text.value.trim()))

useConsumeToolPrefill('text', withCodeMirrorPrefillSync((raw) => { text.value = raw }, editorRef))

onMounted(() => {
  if (!import.meta.client) return
  const savedLang = localStorage.getItem(LANGUAGE_KEY)
  if (savedLang && isTextDiffLanguageId(savedLang)) language.value = savedLang
  const savedWrap = localStorage.getItem(WRAP_KEY)
  if (savedWrap === '0') wordWrap.value = false
  if (savedWrap === '1') wordWrap.value = true
})

watch(language, (v) => {
  if (import.meta.client) localStorage.setItem(LANGUAGE_KEY, v)
})

watch(wordWrap, (v) => {
  if (import.meta.client) localStorage.setItem(WRAP_KEY, v ? '1' : '0')
})

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function readEditorText(): string {
  return editorRef.value?.getDocument?.() ?? text.value
}

function applyText(next: string, toast?: string) {
  text.value = next
  editorRef.value?.setDocument?.(next)
  void nextTick(() => editorRef.value?.setDocument?.(next))
  if (toast) showToast(toast)
}

function runTransform(id: string) {
  if (!id) return
  const source = readEditorText()
  if (!source.trim()) {
    showToast('请先输入文本')
    return
  }

  const map: Record<string, (s: string) => string> = {
    'trim-ends': trimLineEnds,
    'drop-empty': removeEmptyLines,
    sort: sortLines,
    dedupe: dedupeLines,
    reverse: reverseLines,
    lf: (s) => normalizeLineEndings(s, 'lf'),
    crlf: (s) => normalizeLineEndings(s, 'crlf'),
    upper: (s) => transformCase(s, 'upper'),
    lower: (s) => transformCase(s, 'lower'),
    title: (s) => transformCase(s, 'title'),
    'escape-html': escapeHtml,
    'unescape-html': unescapeHtml
  }
  const fn = map[id]
  if (!fn) return
  const next = fn(source)
  applyText(next, next === source ? '未发生变化' : '已处理')
}

function onTransformSelect(event: Event) {
  const id = (event.currentTarget as HTMLSelectElement).value
  if (!id) return
  runTransform(id)
  transformAction.value = ''
}

function runSelectedTransform() {
  runTransform(transformAction.value)
  transformAction.value = ''
}

function replaceAll() {
  if (!findQuery.value) return
  const source = readEditorText()
  const { text: next, count } = replaceAllInText(source, findQuery.value, replaceQuery.value, {
    caseSensitive: replaceCaseSensitive.value,
    useRegex: replaceRegex.value
  })
  if (replaceRegex.value && count === 0 && findQuery.value) {
    showToast('正则无效或无匹配')
    return
  }
  applyText(next, count > 0 ? `已替换 ${count} 处` : '无匹配')
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
  reader.onload = () => applyText(String(reader.result ?? ''), `已导入 ${file.name}`)
  reader.onerror = () => showToast('读取失败')
  reader.readAsText(file, 'UTF-8')
}

function downloadText() {
  if (!text.value) return
  const blob = new Blob([text.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.txt'
  a.click()
  URL.revokeObjectURL(url)
  showToast('已开始下载')
}

function clearAll() {
  applyText('')
}
</script>

<style scoped>
.text-tbar-tip[data-tip] {
  position: relative;
}

.text-tbar-tip[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  z-index: 200;
  transform: translateX(-50%);
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  color: rgb(51 65 85);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgb(15 23 42 / 0.08);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.14s ease, visibility 0.14s ease;
}

.text-tbar-tip[data-tip]:hover:not(:disabled)::after {
  opacity: 1;
  visibility: visible;
}
</style>

<style>
.text-editor-shell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.text-editor-shell .text-diff-cm-wrap {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
