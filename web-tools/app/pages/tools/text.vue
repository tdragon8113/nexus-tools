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
            v-if="canFormat"
            type="button"
            class="text-tbar-tip"
            :class="[tbarBtn, tbarDisabled]"
            :data-tip="formatTip"
            :aria-label="formatTip"
            :disabled="formatting || !hasEditorContent"
            @click="formatDocument"
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
            class="text-tbar-tip"
            :class="[tbarBtn, tbarDisabled]"
            :data-tip="downloadTip"
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

        <template v-if="isMarkdownMode">
          <span class="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:inline" aria-hidden="true" />
          <div class="flex flex-wrap items-center gap-1 text-xs text-slate-600">
            <span class="shrink-0">视图</span>
            <div class="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                v-for="item in markdownViewOptions"
                :key="item.id"
                type="button"
                class="rounded px-2 py-0.5 font-medium transition-colors"
                :class="
                  markdownView === item.id
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-slate-500 hover:text-slate-800'
                "
                @click="markdownView = item.id"
              >
                {{ item.label }}
              </button>
            </div>
            <span class="hidden text-[11px] text-slate-400 lg:inline">如 # 标题、**粗体** 或 &lt;h1&gt;</span>
          </div>
        </template>

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
      :class="{ 'text-editor-shell--md-split': isMarkdownMode && markdownView === 'split' }"
    >
      <TextDiffCodeMirrorPane
        v-show="!isMarkdownMode || markdownView !== 'preview'"
        ref="editorRef"
        v-model="text"
        :language="language"
        variant="plain"
        :word-wrap="wordWrap"
        class="min-h-0 flex-1"
      />
      <MarkdownPreviewPane
        v-if="isMarkdownMode && markdownView !== 'edit'"
        :source="text"
        class="min-h-0 flex-1"
        :class="{ 'md-preview-only': markdownView === 'preview' }"
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
import {
  canFormatTextDiffLanguage,
  formatActionLabel,
  formatTextDiffSource
} from '~/utils/textDiffFormat'

useHead({ title: '文本编辑 - Nexus Tools' })

const LANGUAGE_KEY = 'nexus-text-editor-language'
const WRAP_KEY = 'nexus-text-editor-wrap'
const MD_VIEW_KEY = 'nexus-text-editor-md-view'

type MarkdownViewMode = 'edit' | 'split' | 'preview'

const text = ref('')
const language = ref<TextDiffLanguageId>('plain')
const wordWrap = ref(true)
const formatting = ref(false)
const markdownView = ref<MarkdownViewMode>('edit')
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

const isMarkdownMode = computed(() => language.value === 'markdown')

const canFormat = computed(() => canFormatTextDiffLanguage(language.value))

const formatTip = computed(() => formatActionLabel(language.value))

const downloadTip = computed(() =>
  language.value === 'markdown' ? '下载为 .md' : '下载为 .txt'
)

const markdownViewOptions: { id: MarkdownViewMode; label: string }[] = [
  { id: 'edit', label: '编辑' },
  { id: 'split', label: '分栏' },
  { id: 'preview', label: '预览' }
]

useConsumeToolPrefill('text', withCodeMirrorPrefillSync((raw) => { text.value = raw }, editorRef))

function isMarkdownViewMode(value: string): value is MarkdownViewMode {
  return value === 'edit' || value === 'split' || value === 'preview'
}

onMounted(() => {
  if (!import.meta.client) return
  const savedLang = localStorage.getItem(LANGUAGE_KEY)
  if (savedLang && isTextDiffLanguageId(savedLang)) language.value = savedLang
  const savedWrap = localStorage.getItem(WRAP_KEY)
  if (savedWrap === '0') wordWrap.value = false
  if (savedWrap === '1') wordWrap.value = true
  const savedMdView = localStorage.getItem(MD_VIEW_KEY)
  if (savedMdView && isMarkdownViewMode(savedMdView)) markdownView.value = savedMdView
})

watch(language, (v) => {
  if (import.meta.client) localStorage.setItem(LANGUAGE_KEY, v)
})

watch(wordWrap, (v) => {
  if (import.meta.client) localStorage.setItem(WRAP_KEY, v ? '1' : '0')
})

watch(markdownView, (v) => {
  if (import.meta.client) localStorage.setItem(MD_VIEW_KEY, v)
})

watch(language, (id, prev) => {
  if (id === 'markdown' && prev !== 'markdown' && markdownView.value === 'edit') {
    markdownView.value = 'split'
  }
  if (id !== 'markdown' && markdownView.value !== 'edit') {
    markdownView.value = 'edit'
  }
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

async function formatDocument() {
  if (!canFormat.value || formatting.value) return
  const source = readEditorText()
  if (!source.trim()) return
  formatting.value = true
  try {
    const formatted = await formatTextDiffSource(language.value, source)
    applyText(formatted, formatActionLabel(language.value))
  } catch (e) {
    showToast(e instanceof Error ? e.message : '格式化失败')
  } finally {
    formatting.value = false
  }
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
  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
    language.value = 'markdown'
    if (markdownView.value === 'edit') markdownView.value = 'split'
  }
  const reader = new FileReader()
  reader.onload = () => applyText(String(reader.result ?? ''), `已导入 ${file.name}`)
  reader.onerror = () => showToast('读取失败')
  reader.readAsText(file, 'UTF-8')
}

function downloadText() {
  if (!text.value) return
  const isMd = language.value === 'markdown'
  const blob = new Blob([text.value], {
    type: isMd ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = isMd ? 'document.md' : 'document.txt'
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

.text-editor-shell--md-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.text-editor-shell--md-split .text-diff-cm-wrap {
  border-right: 1px solid rgb(226 232 240);
}

.text-editor-shell--md-split .markdown-preview-pane {
  border: none;
  border-radius: 0;
  background: rgb(248 250 252 / 0.5);
}

.text-editor-shell .md-preview-only {
  border: none;
  border-radius: 0;
  background: rgb(248 250 252 / 0.35);
}
</style>
