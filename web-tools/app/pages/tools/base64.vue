<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { to: '/', label: '首页' },
        { label: 'Base64' }
      ]"
    />

    <PageHero title="Base64 编解码" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-green-100 flex items-center justify-center shadow-sm border border-green-100"
        >
          <van-icon name="shield-o" size="24" class="text-green-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">
        UTF-8 文本与 Base64 互转，仅在浏览器内处理。
      </p>
    </PageHero>

    <div class="space-y-4">
      <label class="block">
        <span class="sr-only">输入文本</span>
        <textarea
          v-model="input"
          class="w-full min-h-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 font-mono"
          placeholder="在此输入要编码或已编码的文本…"
          spellcheck="false"
        />
      </label>

      <p v-if="error" class="text-sm text-red-600" role="alert">
        {{ error }}
      </p>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-green-500/40"
          @click="encode"
        >
          编码为 Base64
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-slate-300"
          @click="decode"
        >
          从 Base64 解码
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          @click="clearAll"
        >
          清空
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          :disabled="!input"
          @click="copyInput"
        >
          复制输入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { utf8ToBase64, base64ToUtf8 } from '~~/utils/utf8Base64'

useHead({ title: 'Base64 - Nexus Tools' })

const input = ref('')
const error = ref('')

const encode = () => {
  error.value = ''
  try {
    input.value = utf8ToBase64(input.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '编码失败'
  }
}

const decode = () => {
  error.value = ''
  try {
    input.value = base64ToUtf8(input.value)
  } catch {
    error.value = '无法解码：请确认是有效的 Base64 字符串'
  }
}

const clearAll = () => {
  input.value = ''
  error.value = ''
}

const copyInput = () => {
  void copyWithToast(input.value)
}
</script>
