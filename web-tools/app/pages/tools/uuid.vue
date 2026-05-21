<template>
  <div class="max-w-3xl px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { to: '/', label: '首页' },
        { label: 'UUID' }
      ]"
    />

    <PageHero title="UUID v4" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center shadow-sm border border-amber-100"
        >
          <van-icon name="gift-o" size="24" class="text-amber-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">
        使用浏览器 <code class="text-xs bg-slate-100 px-1 rounded">crypto.randomUUID()</code> 生成随机 UUID（RFC 4122 v4）。
      </p>
    </PageHero>

    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <span class="text-slate-500">数量</span>
          <select
            v-model.number="count"
            class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
          >
            <option v-for="n in 20" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </label>
        <button
          type="button"
          class="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-amber-700"
          @click="generate"
        >
          生成
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
          :disabled="!lines.length"
          @click="copyAll"
        >
          复制全部
        </button>
      </div>

      <label class="block">
        <span class="block text-xs font-medium text-slate-600 mb-1">校验 / 粘贴（可选）</span>
        <input
          v-model="checkInput"
          type="text"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          spellcheck="false"
          autocomplete="off"
        />
      </label>
      <p v-if="checkMessage" class="text-sm" :class="checkOk ? 'text-emerald-700' : 'text-red-600'">
        {{ checkMessage }}
      </p>

      <ul
        v-if="lines.length"
        class="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 text-sm font-mono"
        role="list"
      >
        <li
          v-for="(line, i) in lines"
          :key="i"
          class="flex items-center justify-between gap-2 px-3 py-2"
        >
          <span class="tabular-nums break-all text-slate-900">{{ line }}</span>
          <button
            type="button"
            class="shrink-0 text-xs text-amber-700 hover:underline"
            @click="copyWithToast(line)"
          >
            复制
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

useHead({ title: 'UUID - Nexus Tools' })

const { consumeUuidPrefill } = usePlainToolPrefill()

const count = ref(5)
const lines = ref<string[]>([])
const checkInput = ref('')

const generateOne = (): string => {
  if (import.meta.client && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  throw new Error('当前环境不支持 crypto.randomUUID')
}

const generate = () => {
  try {
    const n = Math.min(20, Math.max(1, count.value))
    const out: string[] = []
    for (let i = 0; i < n; i++) out.push(generateOne())
    lines.value = out
  } catch {
    showToast('生成失败')
  }
}

const copyAll = () => {
  void copyWithToast(lines.value.join('\n'))
}

const checkOk = computed(() => {
  const t = checkInput.value.trim()
  if (!t) return null
  return UUID_RE.test(t)
})

const checkMessage = computed(() => {
  const t = checkInput.value.trim()
  if (!t) return ''
  return checkOk.value ? '格式符合 UUID v4' : '不符合常见 UUID v4 格式'
})

onMounted(() => {
  const pre = consumeUuidPrefill()
  if (pre) checkInput.value = pre
  generate()
})
</script>
