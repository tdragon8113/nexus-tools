<template>
  <div class="w-full space-y-2 py-1">
    <div class="flex items-center gap-1 overflow-x-auto pb-0.5">
      <button
        v-for="action in SUMMARY_FORMAT_ACTIONS"
        :key="action.id"
        type="button"
        class="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border text-sm transition-colors"
        :class="[
          isFormatActive(action.id)
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
            : 'border-slate-200 text-slate-600 active:bg-slate-50',
          action.id === 'bold' ? 'font-bold' : '',
          action.id === 'italic' ? 'italic font-serif' : '',
          action.id === 'heading' ? 'font-semibold' : ''
        ]"
        :aria-label="action.title"
        :aria-pressed="isFormatActive(action.id)"
        @mousedown.prevent
        @click="applyFormat(action)"
      >
        {{ action.symbol }}
      </button>
      <button
        type="button"
        class="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-500 active:bg-slate-50 disabled:opacity-40 ml-auto"
        :disabled="!modelValue.trim()"
        aria-label="清空"
        @mousedown.prevent
        @click="handleClear"
      >
        ✕
      </button>
    </div>

    <div class="relative">
      <p
        v-if="isEmpty"
        class="pointer-events-none absolute left-3 top-2.5 text-sm text-slate-400"
      >
        这段做了什么、有什么收获
      </p>
      <div
        ref="editorRef"
        contenteditable
        class="summary-editor rich-text min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        @input="onEditorInput"
        @paste="onPaste"
        @keyup="updateActiveFormats"
        @click="updateActiveFormats"
        @focus="updateActiveFormats"
        @blur="onEditorBlur"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { showConfirmDialog } from 'vant'
import {
  SUMMARY_FORMAT_ACTIONS,
  detectActiveFormats,
  htmlToSimpleMarkdown,
  isEditableEmpty,
  markdownToEditableHtml,
  type SummaryFormatAction,
  type SummaryFormatId
} from '~/utils/richText'

const modelValue = defineModel<string>({ default: '' })

const editorRef = ref<HTMLElement | null>(null)
const syncing = ref(false)
const isEmpty = ref(true)
const activeFormats = ref<Set<SummaryFormatId>>(new Set())

function isFormatActive (id: SummaryFormatId) {
  return activeFormats.value.has(id)
}

function updateActiveFormats () {
  activeFormats.value = detectActiveFormats(editorRef.value)
}

function onSelectionChange () {
  const el = editorRef.value
  if (!el) return
  const selection = document.getSelection()
  if (!selection?.anchorNode || !el.contains(selection.anchorNode)) return
  updateActiveFormats()
}

function setEditorHtml (html: string) {
  const el = editorRef.value
  if (!el) return
  syncing.value = true
  el.innerHTML = html
  isEmpty.value = isEditableEmpty(el.innerHTML)
  syncing.value = false
  nextTick(updateActiveFormats)
}

function syncFromEditor () {
  const el = editorRef.value
  if (!el || syncing.value) return

  const markdown = htmlToSimpleMarkdown(el.innerHTML)

  isEmpty.value = !markdown.trim()
  if (markdown !== modelValue.value) {
    syncing.value = true
    modelValue.value = markdown
    syncing.value = false
  }
}

function onEditorInput () {
  syncFromEditor()
  updateActiveFormats()
}

function onEditorBlur () {
  syncFromEditor()
  activeFormats.value = new Set()
}

function applyFormat (action: SummaryFormatAction) {
  const el = editorRef.value
  if (!el) return
  el.focus()

  switch (action.id) {
    case 'bold':
      document.execCommand('bold')
      break
    case 'italic':
      document.execCommand('italic')
      break
    case 'heading':
      if (isFormatActive('heading')) {
        document.execCommand('formatBlock', false, 'P')
      } else {
        document.execCommand('formatBlock', false, 'H2')
      }
      break
    case 'list':
      document.execCommand('insertUnorderedList')
      break
    case 'quote':
      if (isFormatActive('quote')) {
        document.execCommand('formatBlock', false, 'P')
      } else {
        document.execCommand('formatBlock', false, 'BLOCKQUOTE')
      }
      break
    case 'divider':
      document.execCommand('insertHorizontalRule')
      break
  }

  syncFromEditor()
  nextTick(updateActiveFormats)
}

function onPaste (event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, text)
  onEditorInput()
}

async function handleClear () {
  if (!modelValue.value.trim()) return
  try {
    await showConfirmDialog({
      title: '清空总结',
      message: '确定清空已写内容吗？',
      confirmButtonText: '清空',
      confirmButtonColor: '#ef4444'
    })
    modelValue.value = ''
    setEditorHtml('<p><br></p>')
    activeFormats.value = new Set()
    nextTick(() => editorRef.value?.focus())
  } catch {
    // cancelled
  }
}

watch(modelValue, (value) => {
  if (syncing.value) return
  const el = editorRef.value
  if (!el) return
  const current = htmlToSimpleMarkdown(el.innerHTML)
  if (value !== current) {
    setEditorHtml(markdownToEditableHtml(value))
  }
})

onMounted(() => {
  setEditorHtml(markdownToEditableHtml(modelValue.value))
  document.addEventListener('selectionchange', onSelectionChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
})
</script>

<style scoped>
.summary-editor :deep(.rich-p) {
  margin: 0 0 0.35rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: rgb(51 65 85);
}

.summary-editor :deep(.rich-p:last-child),
.summary-editor :deep(.rich-list:last-child),
.summary-editor :deep(.rich-quote:last-child),
.summary-editor :deep(.rich-heading:last-child),
.summary-editor :deep(h2:last-child),
.summary-editor :deep(blockquote:last-child),
.summary-editor :deep(ul:last-child) {
  margin-bottom: 0;
}

.summary-editor :deep(.rich-heading),
.summary-editor :deep(h2) {
  margin: 0 0 0.35rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(15 23 42);
}

.summary-editor :deep(.rich-list),
.summary-editor :deep(ul) {
  margin: 0 0 0.35rem;
  padding-left: 1rem;
  list-style: disc;
  color: rgb(51 65 85);
}

.summary-editor :deep(.rich-list li),
.summary-editor :deep(ul li) {
  margin: 0.125rem 0;
}

.summary-editor :deep(.rich-quote),
.summary-editor :deep(blockquote) {
  margin: 0 0 0.35rem;
  padding-left: 0.625rem;
  border-left: 2px solid rgb(199 210 254);
  color: rgb(100 116 139);
  font-size: 0.875rem;
}

.summary-editor :deep(.rich-hr),
.summary-editor :deep(hr) {
  margin: 0.5rem 0;
  border: none;
  border-top: 1px dashed rgb(226 232 240);
}
</style>
