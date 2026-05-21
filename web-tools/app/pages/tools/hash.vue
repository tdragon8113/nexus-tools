<template>
  <div class="max-w-3xl px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { to: '/', label: '首页' },
        { label: '哈希' }
      ]"
    />

    <PageHero title="MD5 / SHA" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-red-100 flex items-center justify-center shadow-sm border border-red-100"
        >
          <van-icon name="lock" size="24" class="text-red-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">文本摘要：MD5 由 spark-md5；SHA 系使用 Web Crypto。均在本地计算。</p>
    </PageHero>

    <div class="space-y-4">
      <div class="flex flex-wrap gap-3 items-center">
        <label class="text-sm text-slate-600">
          算法
          <select v-model="algo" class="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white">
            <option v-for="a in algos" :key="a" :value="a">{{ a }}</option>
          </select>
        </label>
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          :disabled="!out"
          @click="copyWithToast(out)"
        >
          复制摘要
        </button>
      </div>

      <label class="block">
        <span class="block text-xs font-medium text-slate-600 mb-1">输入</span>
        <textarea
          v-model="text"
          class="w-full min-h-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono shadow-sm"
          placeholder="任意文本…"
        />
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div v-if="out" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-xs text-slate-500 mb-1">十六进制</p>
        <p class="font-mono text-sm break-all text-slate-900">{{ out }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { digestText, type HashAlgorithm } from '~~/utils/hashDigest'

useHead({ title: '哈希 - Nexus Tools' })

const algos: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
const algo = ref<HashAlgorithm>('SHA-256')
const text = ref('')
const out = ref('')
const error = ref('')

let t: ReturnType<typeof setTimeout> | undefined
watch(
  [text, algo],
  () => {
    clearTimeout(t)
    out.value = ''
    error.value = ''
    if (!text.value) return
    t = setTimeout(() => {
      void (async () => {
        try {
          out.value = await digestText(algo.value, text.value)
        } catch (e) {
          error.value = e instanceof Error ? e.message : '计算失败'
        }
      })()
    }, 150)
  },
  { immediate: true }
)

onUnmounted(() => clearTimeout(t))
</script>
