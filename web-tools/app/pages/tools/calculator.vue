<template>
  <div class="max-w-2xl px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { to: '/', label: '首页' },
        { label: '计算器' }
      ]"
    />

    <PageHero title="计算器" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-sky-100 flex items-center justify-center shadow-sm border border-sky-100"
        >
          <van-icon name="records" size="24" class="text-sky-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">
        每条记录可直接修改算式并实时重算；底部输入新算式后按 Enter 追加记录。
      </p>
    </PageHero>

    <div class="mt-6 flex flex-wrap items-center gap-2 text-sm">
      <span class="text-slate-500 tabular-nums">{{ entries.length }} 条记录</span>
      <span class="text-slate-300">·</span>
      <button
        type="button"
        class="text-slate-600 hover:text-slate-900 disabled:opacity-40"
        :disabled="entries.length === 0"
        @click="copyAll"
      >
        复制全部
      </button>
      <button
        type="button"
        class="text-red-600 hover:text-red-700 disabled:opacity-40"
        :disabled="entries.length === 0"
        @click="clearHistory"
      >
        清空记录
      </button>
    </div>

    <div class="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ul
        v-if="entries.length > 0"
        role="list"
        class="max-h-[min(52vh,28rem)] divide-y divide-slate-100 overflow-y-auto overscroll-contain"
      >
        <li
          v-for="(entry, index) in entries"
          :key="entry.id"
          class="group relative min-h-[4.25rem] px-4 py-3 transition-colors focus-within:bg-sky-50/40"
          :class="index % 2 === 0 ? 'bg-white' : 'bg-slate-50/90'"
        >
          <input
            :ref="(el) => setEntryInputRef(entry.id, el)"
            v-model="entry.expr"
            type="text"
            inputmode="text"
            class="w-full border-0 bg-transparent pr-16 font-mono text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="计算公式"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            @input="recalcEntry(entry)"
            @blur="onEntryBlur(entry)"
            @keydown.enter.prevent="focusDraft"
            @click.stop
          >
          <p
            v-if="entry.error"
            class="mt-1 text-right text-sm text-red-600"
          >
            {{ entry.error }}
          </p>
          <p
            v-else-if="entry.result != null"
            class="mt-0.5 text-right font-mono text-xl font-semibold tabular-nums text-slate-900"
          >
            = {{ entry.result }}
          </p>
          <p
            v-else
            class="mt-0.5 text-right font-mono text-xl font-semibold tabular-nums text-slate-300"
          >
            =
          </p>

          <div
            class="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <button
              type="button"
              class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
              title="复制"
              @click.stop="copyEntry(entry)"
            >
              <van-icon name="description" size="16" />
            </button>
            <button
              type="button"
              class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600"
              title="删除"
              @click.stop="removeEntry(entry.id)"
            >
              <van-icon name="delete-o" size="16" />
            </button>
          </div>
        </li>
      </ul>

      <p
        v-else
        class="border-b border-slate-100 px-4 py-8 text-center text-sm text-slate-400"
      >
        在下方输入算式，按 Enter 添加记录
      </p>

      <div
        class="relative min-h-[5.25rem] bg-sky-50/60 px-4 py-3 ring-inset ring-sky-200/50 focus-within:bg-sky-50 focus-within:ring-2"
      >
        <input
          ref="draftRef"
          v-model="draft"
          type="text"
          inputmode="text"
          class="w-full border-0 bg-transparent font-mono text-sm text-slate-800 outline-none placeholder:text-slate-400"
          placeholder="新建计算公式"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          @keydown.enter.prevent="commitDraft"
          @keydown.esc.prevent="clearDraft"
        >
        <p
          v-if="draftError"
          class="mt-2 text-right text-xs text-red-600"
        >
          {{ draftError }}
        </p>
        <p
          v-else-if="draftPreview != null"
          class="mt-1 text-right font-mono text-xl font-semibold tabular-nums text-slate-900"
        >
          = {{ draftPreview }}
        </p>
        <p
          v-else
          class="mt-1 text-right font-mono text-xl font-semibold tabular-nums text-slate-300"
        >
          =
        </p>
        <p class="mt-2 text-[11px] text-slate-400">
          Enter 追加新记录 · Esc 清空 · 记录内可直接修改算式
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { evaluateArithmetic, formatCalcResult } from '~~/utils/calcExpression'

useHead({ title: '计算器 - Nexus Tools' })

const STORAGE_KEY = 'nexus-calculator-tape-v1'

interface CalcEntry {
  id: string
  expr: string
  result: string | null
  error: string | null
  createdAt: number
}

const { consumeCalculatorPrefill } = usePlainToolPrefill()

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value))
  } catch {
    /* ignore quota */
  }
}

function restore() {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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
          expr: item.expr,
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

onMounted(() => {
  restore()
  const prefill = consumeCalculatorPrefill()
  if (prefill) {
    const entry = createEntry(prefill)
    entries.value = [...entries.value, entry]
    persist()
    void nextTick(() => focusEntry(entry.id))
    return
  }
  void nextTick(() => focusDraft())
})
</script>
