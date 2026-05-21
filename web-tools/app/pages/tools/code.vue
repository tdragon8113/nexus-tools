<template>
  <div class="max-w-4xl px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { to: '/', label: '首页' },
        { label: '代码格式化' }
      ]"
    />

    <PageHero title="代码格式化" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-violet-100 flex items-center justify-center border border-violet-100 shadow-sm"
        >
          <van-icon name="coupon-o" size="24" class="text-violet-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">浏览器端 Prettier，适合小段代码；大文件可能较慢。</p>
    </PageHero>

    <div class="flex flex-wrap gap-3 items-center mb-4">
      <label class="text-sm text-slate-600">
        语言
        <select v-model="lang" class="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm">
          <option v-for="l in langs" :key="l.id" :value="l.id">{{ l.label }}</option>
        </select>
      </label>
      <button
        type="button"
        class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        :disabled="formatting"
        @click="runFormat"
      >
        {{ formatting ? '格式化中…' : '格式化' }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
        :disabled="!output"
        @click="copyWithToast(output)"
      >
        复制结果
      </button>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <label class="block">
        <span class="block text-xs font-medium text-slate-600 mb-1">输入</span>
        <textarea
          v-model="input"
          class="w-full min-h-[280px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono shadow-sm"
        />
      </label>
      <div>
        <span class="block text-xs font-medium text-slate-600 mb-1">输出</span>
        <pre
          class="w-full min-h-[280px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all overflow-auto"
        >{{ output || '—' }}</pre>
      </div>
    </div>
    <p v-if="fmtErr" class="mt-3 text-sm text-red-600">{{ fmtErr }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Options } from 'prettier'

useHead({ title: '代码格式化 - Nexus Tools' })

type LangId = 'javascript' | 'typescript' | 'json' | 'html' | 'css' | 'markdown'

const langs: { id: LangId; label: string }[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'json', label: 'JSON' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'markdown', label: 'Markdown' }
]

const lang = ref<LangId>('json')
const input = ref('{\n  "hello": "world"\n}')
const output = ref('')
const fmtErr = ref('')
const formatting = ref(false)

function asPlugins(m: unknown): unknown[] {
  if (!m || typeof m !== 'object') return []
  return 'default' in m ? [(m as { default: unknown }).default] : [m]
}

const runFormat = async () => {
  formatting.value = true
  fmtErr.value = ''
  output.value = ''
  try {
    const { format } = await import('prettier/standalone')
    const estree = await import('prettier/plugins/estree')
    const babel = await import('prettier/plugins/babel')
    const typescript = await import('prettier/plugins/typescript')
    const html = await import('prettier/plugins/html')
    const postcss = await import('prettier/plugins/postcss')
    const markdown = await import('prettier/plugins/markdown')

    const base: Options = {
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      tabWidth: 2
    }

    let parser: string
    let plugins: unknown[]

    switch (lang.value) {
      case 'javascript':
        parser = 'babel'
        plugins = [...asPlugins(estree), ...asPlugins(babel)]
        break
      case 'typescript':
        parser = 'typescript'
        plugins = [...asPlugins(estree), ...asPlugins(typescript)]
        break
      case 'json':
        parser = 'json'
        plugins = [...asPlugins(estree), ...asPlugins(babel)]
        break
      case 'html':
        parser = 'html'
        plugins = [...asPlugins(html)]
        break
      case 'css':
        parser = 'css'
        plugins = [...asPlugins(postcss)]
        break
      case 'markdown':
        parser = 'markdown'
        plugins = [...asPlugins(markdown)]
        break
      default:
        parser = 'babel'
        plugins = [...asPlugins(estree), ...asPlugins(babel)]
    }

    output.value = await format(input.value, {
      ...base,
      parser,
      plugins
    })
  } catch (e) {
    fmtErr.value = e instanceof Error ? e.message : '格式化失败'
  } finally {
    formatting.value = false
  }
}
</script>
