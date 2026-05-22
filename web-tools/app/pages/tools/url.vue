<template>
  <div class="max-w-3xl px-4 sm:px-6 py-8 md:py-10">

    <PageHero title="URL 编码 / 解码" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-teal-100 flex items-center justify-center shadow-sm border border-teal-100"
        >
          <van-icon name="link-o" size="24" class="text-teal-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">
        使用 encodeURIComponent / decodeURIComponent 处理文本与查询参数（含中文），浏览器内完成。
      </p>
    </PageHero>

    <div class="space-y-4">
      <label class="block">
        <span class="sr-only">文本</span>
        <textarea
          v-model="input"
          class="w-full min-h-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
          placeholder="输入 URL、查询参数片段或任意需编码的文本…"
          spellcheck="false"
        />
      </label>

      <p v-if="error" class="text-sm text-red-600" role="alert">
        {{ error }}
      </p>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700"
          @click="encode"
        >
          编码（encodeURIComponent）
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          @click="decode"
        >
          解码（decodeURIComponent）
        </button>
        <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="clear">
          清空
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          :disabled="!input"
          @click="copyWithToast(input)"
        >
          复制
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'URL 编码 - Nexus Tools' })

const { consumeUrlPrefill } = usePlainToolPrefill()

const input = ref('')
const error = ref('')

const encode = () => {
  error.value = ''
  try {
    input.value = encodeURIComponent(input.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '编码失败'
  }
}

const decode = () => {
  error.value = ''
  try {
    input.value = decodeURIComponent(input.value)
  } catch {
    error.value = '解码失败：字符串可能不是合法的 percent-encoding'
  }
}

const clear = () => {
  input.value = ''
  error.value = ''
}

onMounted(() => {
  const pre = consumeUrlPrefill()
  if (pre) input.value = pre
})
</script>
