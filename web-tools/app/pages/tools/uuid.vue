<template>
  <div class="desktop-tool-page flex h-full min-h-0 flex-col">
<div class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <span class="text-slate-500">数量</span>
          <select
            v-model.number="count"
            class="px-2.5 py-1.5 text-sm bg-white"
          >
            <option v-for="n in 20" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </label>
        <button
          type="button"
          class="nexus-btn-primary"
          @click="generate"
        >
          生成
        </button>
        <button
          type="button"
          class="nexus-btn-secondary"
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
          class="w-full px-3 py-2 text-sm font-mono"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          spellcheck="false"
          autocomplete="off"
        />
      </label>
      <p v-if="checkMessage" class="text-sm" :class="checkOk ? 'text-indigo-700' : 'text-red-600'">
        {{ checkMessage }}
      </p>

      <ul
        v-if="lines.length"
        class="nexus-card divide-y divide-slate-100 text-sm font-mono"
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
            class="shrink-0 nexus-text-link text-xs"
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

const count = ref(5)

useConsumeToolPrefill('uuid', (text) => {
  checkInput.value = text
})
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
  generate()
})
</script>
