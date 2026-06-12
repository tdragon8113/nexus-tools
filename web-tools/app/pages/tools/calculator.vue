<template>
  <div class="calculator-page desktop-tool-page flex h-full min-h-0 flex-col">
    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
    >
      <header
        class="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-2.5"
      >
        <span class="text-xs tabular-nums text-slate-500">{{ entries.length }} 条记录</span>
        <div class="flex items-center gap-2 text-xs">
          <button
            type="button"
            class="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
            :disabled="entries.length === 0"
            @click="copyAll"
          >
            复制全部
          </button>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
            :disabled="entries.length === 0"
            @click="clearHistory"
          >
            清空
          </button>
        </div>
      </header>

      <ul
        v-if="entries.length > 0"
        role="list"
        class="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-contain"
      >
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 px-3.5 py-2 transition-colors focus-within:bg-sky-50/50 hover:bg-slate-50/80"
        >
          <input
            :ref="(el) => setEntryInputRef(entry.id, el)"
            v-model="entry.expr"
            type="text"
            inputmode="text"
            class="calculator-tape-input min-w-0 font-mono text-sm leading-snug text-slate-800 placeholder:text-slate-400"
            placeholder="计算公式"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            @input="onEntryInput(entry)"
            @paste.prevent="onEntryPaste(entry, $event)"
            @blur="onEntryBlur(entry)"
            @keydown.enter.prevent="focusDraft"
            @click.stop
          >

          <p
            v-if="entry.error"
            class="max-w-[11rem] truncate text-right text-sm text-red-600"
            :title="entry.error"
          >
            {{ entry.error }}
          </p>
          <p
            v-else-if="entry.result != null"
            class="max-w-[11rem] truncate text-right font-mono text-base font-semibold tabular-nums text-slate-900"
            :title="`= ${entry.result}`"
          >
            = {{ entry.result }}
          </p>
          <p
            v-else
            class="text-right font-mono text-base font-semibold tabular-nums text-slate-300"
          >
            =
          </p>

          <div
            class="flex w-14 shrink-0 justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <button
              type="button"
              class="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
              title="复制"
              @click.stop="copyEntry(entry)"
            >
              <van-icon name="description" size="15" />
            </button>
            <button
              type="button"
              class="rounded-md p-1 text-slate-400 hover:bg-white hover:text-red-600"
              title="删除"
              @click.stop="removeEntry(entry.id)"
            >
              <van-icon name="delete-o" size="15" />
            </button>
          </div>
        </li>
      </ul>

      <p
        v-else
        class="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-slate-400"
      >
        在下方输入算式，按 Enter 添加记录
      </p>

      <footer class="calculator-draft shrink-0 border-t border-slate-200/90 bg-slate-50/80 px-4 py-3.5">
        <div class="flex items-stretch gap-3">
          <label class="calculator-draft-field flex min-w-0 flex-1 items-center">
            <input
              ref="draftRef"
              :value="draft"
              type="text"
              inputmode="decimal"
              class="calculator-draft-input min-w-0 flex-1 font-mono text-2xl text-slate-900 placeholder:text-slate-400"
              placeholder="1+2*3"
              spellcheck="false"
              autocomplete="off"
              autocapitalize="off"
              @input="onDraftInput"
              @keydown.enter.prevent="commitDraft"
              @keydown.esc.prevent="clearDraft"
              @paste.prevent="onDraftPaste"
            >
          </label>
          <div class="flex w-[9.5rem] shrink-0 items-center justify-end">
            <p
              v-if="draftError"
              class="max-w-full truncate text-right text-sm text-red-600"
              :title="draftError"
            >
              {{ draftError }}
            </p>
            <p
              v-else-if="draftPreview != null"
              class="max-w-full truncate text-right font-mono text-2xl font-semibold tabular-nums text-slate-900"
              :title="`= ${draftPreview}`"
            >
              = {{ draftPreview }}
            </p>
            <p
              v-else
              class="text-right font-mono text-2xl font-semibold tabular-nums text-slate-300"
            >
              =
            </p>
          </div>
        </div>
        <p class="mt-2 text-xs text-slate-400">
          仅数字与 + - * / % ^ ( ) · Enter 添加 · Esc 清空
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getDesktopLocalStateValue,
  persistDesktopLocalStateKeyFireAndForget
} from '~/core/desktopLocalState'
import {
  evaluateArithmetic,
  formatCalcResult,
  sanitizeArithmeticInput
} from '~~/utils/calcExpression'
import { RENDERER_LOCAL_STATE_KEYS } from '~~/shared/rendererLocalState'

useHead({ title: '计算器 - Nexus Tools' })

const STORAGE_KEY = RENDERER_LOCAL_STATE_KEYS.calculatorTape

interface CalcEntry {
  id: string
  expr: string
  result: string | null
  error: string | null
  createdAt: number
}

const draftRef = ref<HTMLInputElement | null>(null)
const entryInputRefs = new Map<string, HTMLInputElement>()
const draft = ref('')
const entries = ref<CalcEntry[]>([])

let persistTimer: ReturnType<typeof setTimeout> | null = null

const draftEval = computed(() => {
  const expr = draft.value.trim()
  if (!expr) return null
  return evaluateArithmetic(expr)
})

const draftPreview = computed(() => {
  const r = draftEval.value
  if (!r || !r.ok) return null
  return formatCalcResult(r.value)
})

const draftError = computed(() => {
  const expr = draft.value.trim()
  if (!expr) return ''
  const r = draftEval.value
  if (!r || r.ok) return ''
  return r.error
})

function setEntryInputRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLInputElement) entryInputRefs.set(id, el)
  else entryInputRefs.delete(id)
}

function focusDraft() {
  draftRef.value?.focus()
}

function focusEntry(id: string) {
  entryInputRefs.get(id)?.focus()
}

function onDraftInput(event: Event) {
  draft.value = sanitizeArithmeticInput((event.target as HTMLInputElement).value)
}

function onDraftPaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text') ?? ''
  const el = draftRef.value
  if (!el) return
  const start = el.selectionStart ?? draft.value.length
  const end = el.selectionEnd ?? draft.value.length
  const merged = draft.value.slice(0, start) + pasted + draft.value.slice(end)
  draft.value = sanitizeArithmeticInput(merged)
  void nextTick(() => {
    const pos = sanitizeArithmeticInput(draft.value.slice(0, start) + pasted).length
    el.setSelectionRange(pos, pos)
  })
}

function onEntryInput(entry: CalcEntry) {
  const next = sanitizeArithmeticInput(entry.expr)
  if (next !== entry.expr) entry.expr = next
  recalcEntry(entry)
}

function onEntryPaste(entry: CalcEntry, event: ClipboardEvent) {
  const el = entryInputRefs.get(entry.id)
  const pasted = event.clipboardData?.getData('text') ?? ''
  if (!el) {
    entry.expr = sanitizeArithmeticInput(entry.expr + pasted)
    recalcEntry(entry)
    return
  }
  const start = el.selectionStart ?? entry.expr.length
  const end = el.selectionEnd ?? entry.expr.length
  const merged = entry.expr.slice(0, start) + pasted + entry.expr.slice(end)
  entry.expr = sanitizeArithmeticInput(merged)
  recalcEntry(entry)
}

function schedulePersist() {
  if (!import.meta.client) return
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistTimer = null
    persist()
  }, 280)
}

function persist() {
  if (!import.meta.client) return
  try {
    persistDesktopLocalStateKeyFireAndForget(STORAGE_KEY, JSON.stringify(entries.value))
  } catch {
    /* ignore quota */
  }
}

function restore() {
  if (!import.meta.client) return
  try {
    const raw = getDesktopLocalStateValue(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    entries.value = parsed
      .filter(
        (item): item is CalcEntry =>
          item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.expr === 'string'
      )
      .map((item) => {
        const entry: CalcEntry = {
          id: item.id,
          expr: sanitizeArithmeticInput(item.expr),
          result: item.result ?? null,
          error: item.error ?? null,
          createdAt: item.createdAt ?? Date.now()
        }
        recalcEntry(entry)
        return entry
      })
  } catch {
    entries.value = []
  }
}

function applyEval(entry: CalcEntry, expr: string) {
  const trimmed = expr.trim()
  if (!trimmed) {
    entry.result = null
    entry.error = null
    return
  }
  const r = evaluateArithmetic(expr)
  entry.result = r.ok ? formatCalcResult(r.value) : null
  entry.error = r.ok ? null : r.error
}

function recalcEntry(entry: CalcEntry) {
  applyEval(entry, entry.expr)
  schedulePersist()
}

function createEntry(expr: string): CalcEntry {
  const entry: CalcEntry = {
    id: crypto.randomUUID(),
    expr,
    result: null,
    error: null,
    createdAt: Date.now()
  }
  applyEval(entry, expr)
  return entry
}

function commitDraft() {
  const expr = draft.value.trim()
  if (!expr) return
  const r = evaluateArithmetic(expr)
  if (!r.ok) return
  const entry = createEntry(expr)
  entries.value = [...entries.value, entry]
  persist()
  draft.value = ''
  void nextTick(() => focusDraft())
}

function clearDraft() {
  draft.value = ''
  focusDraft()
}

function removeEntry(id: string) {
  entries.value = entries.value.filter((item) => item.id !== id)
  entryInputRefs.delete(id)
  persist()
}

function clearHistory() {
  entries.value = []
  entryInputRefs.clear()
  persist()
}

function onEntryBlur(entry: CalcEntry) {
  if (!entry.expr.trim()) {
    removeEntry(entry.id)
    return
  }
  persist()
}

function copyEntry(entry: CalcEntry) {
  const text = entry.error
    ? `${entry.expr}\n错误: ${entry.error}`
    : `${entry.expr} = ${entry.result}`
  void copyWithToast(text, '已复制')
}

function copyAll() {
  if (entries.value.length === 0) return
  const text = entries.value
    .map((entry) =>
      entry.error ? `${entry.expr}\n错误: ${entry.error}` : `${entry.expr} = ${entry.result}`
    )
    .join('\n\n')
  void copyWithToast(text, '已复制全部记录')
}

const { drain: drainCalculatorPrefill } = useConsumeToolPrefill(
  'calculator',
  (text) => {
    const entry = createEntry(sanitizeArithmeticInput(text))
    entries.value = [...entries.value, entry]
    persist()
    void nextTick(() => focusEntry(entry.id))
  },
  { consumeOnMount: false }
)

onMounted(() => {
  restore()
  const before = entries.value.length
  drainCalculatorPrefill()
  void nextTick(() => {
    if (entries.value.length === before) focusDraft()
  })
})
</script>

<style>
/* 记账条内联输入：勿套用桌面工具页默认的圆角边框 input 样式 */
html[data-nexus-desktop='1'] .calculator-page input.calculator-tape-input {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  padding: 0;
  outline: none;
}

html[data-nexus-desktop='1'] .calculator-page input.calculator-tape-input:focus {
  border: 0;
  background: transparent;
  box-shadow: none;
  outline: none;
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
}

html[data-nexus-desktop='1'] .calculator-page .calculator-draft-field {
  border: 1px solid rgb(203 213 225);
  border-radius: 0.75rem;
  background: rgb(255 255 255);
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
  padding: 0.625rem 1rem;
  min-height: 3.25rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

html[data-nexus-desktop='1'] .calculator-page .calculator-draft-field:focus-within {
  border-color: rgb(129 140 248);
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.18);
}

html[data-nexus-desktop='1'] .calculator-page input.calculator-draft-input {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  padding: 0;
  outline: none;
  min-height: 2.75rem;
  line-height: 2.75rem;
  font-size: 1.5rem;
}

html[data-nexus-desktop='1'] .calculator-page input.calculator-draft-input:focus {
  border: 0;
  box-shadow: none;
  outline: none;
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
}

html[data-nexus-desktop='1'] .calculator-page .calculator-draft:focus-within {
  background: rgb(248 250 252);
}
</style>
