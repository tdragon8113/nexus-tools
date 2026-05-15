<template>
  <div class="max-w-md mx-auto px-4 sm:px-6 py-8 md:py-10">
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
        支持 + − × ÷、幂 ^（右结合，如 2^3^2）、取模 %、括号与小数；纯本地解析，不使用
        <code class="text-xs bg-slate-100 px-1 rounded">eval</code>。
      </p>
    </PageHero>

    <div class="mt-6 space-y-3">
      <div
        class="rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-right shadow-inner min-h-[3.5rem] flex flex-col justify-center"
      >
        <input
          v-model="expr"
          type="text"
          inputmode="decimal"
          class="w-full bg-transparent text-right text-lg text-slate-100 font-mono outline-none placeholder:text-slate-500"
          placeholder="0"
          spellcheck="false"
          autocomplete="off"
          @keydown.enter.prevent="runCalc"
        >
        <p v-if="resultText" class="mt-1 text-sm font-mono text-sky-300 tabular-nums">
          = {{ resultText }}
        </p>
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="(k, idx) in keys"
          :key="idx"
          type="button"
          class="rounded-xl py-3 text-base font-medium transition-transform active:scale-[0.98]"
          :class="[
            k.kind === 'op'
              ? 'bg-sky-100 text-sky-900 hover:bg-sky-200'
              : k.kind === 'eq'
                ? 'bg-sky-600 text-white hover:bg-sky-700'
                : k.kind === 'clear'
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200',
            k.colSpan === 4 ? 'col-span-4' : ''
          ]"
          @click="onKey(k)"
        >
          {{ k.label }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2 text-xs text-slate-500">
        <button type="button" class="underline hover:text-slate-800" @click="copyExpr">复制表达式</button>
        <button
          v-if="resultText"
          type="button"
          class="underline hover:text-slate-800"
          @click="copyWithToast(resultText, '已复制结果')"
        >
          复制结果
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { evaluateArithmetic, formatCalcResult } from '~~/utils/calcExpression'

useHead({ title: '计算器 - Nexus Tools' })

type Key =
  | { label: string; kind: 'num' | 'op' | 'dot'; value: string; colSpan?: number }
  | { label: string; kind: 'eq'; colSpan?: number }
  | { label: string; kind: 'clear'; action: 'ac' | 'bs'; colSpan?: number }

const keys: Key[] = [
  { label: 'AC', kind: 'clear', action: 'ac' },
  { label: '⌫', kind: 'clear', action: 'bs' },
  { label: '(', kind: 'op', value: '(' },
  { label: ')', kind: 'op', value: ')' },
  { label: '7', kind: 'num', value: '7' },
  { label: '8', kind: 'num', value: '8' },
  { label: '9', kind: 'num', value: '9' },
  { label: '÷', kind: 'op', value: '/' },
  { label: '4', kind: 'num', value: '4' },
  { label: '5', kind: 'num', value: '5' },
  { label: '6', kind: 'num', value: '6' },
  { label: '×', kind: 'op', value: '*' },
  { label: '1', kind: 'num', value: '1' },
  { label: '2', kind: 'num', value: '2' },
  { label: '3', kind: 'num', value: '3' },
  { label: '−', kind: 'op', value: '-' },
  { label: '0', kind: 'num', value: '0' },
  { label: '.', kind: 'dot', value: '.' },
  { label: '^', kind: 'op', value: '^' },
  { label: '%', kind: 'op', value: '%' },
  { label: '+', kind: 'op', value: '+', colSpan: 4 },
  { label: '=', kind: 'eq', colSpan: 4 }
]

const expr = ref('')
const resultText = ref('')
const error = ref('')

const runCalc = () => {
  error.value = ''
  resultText.value = ''
  const r = evaluateArithmetic(expr.value)
  if (!r.ok) {
    error.value = r.error
    return
  }
  resultText.value = formatCalcResult(r.value)
}

watch(expr, () => {
  error.value = ''
  resultText.value = ''
})

const onKey = (k: Key) => {
  if (k.kind === 'clear') {
    if (k.action === 'ac') {
      expr.value = ''
      error.value = ''
      resultText.value = ''
    } else {
      expr.value = expr.value.slice(0, -1)
    }
    return
  }
  if (k.kind === 'eq') {
    runCalc()
    return
  }
  expr.value += k.value
}

const copyExpr = () => {
  void copyWithToast(expr.value || '0')
}
</script>
