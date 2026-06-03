<template>
  <div class="desktop-tool-page flex h-full min-h-0 flex-col">
<div class="space-y-5">
      <div class="flex flex-wrap items-end gap-4">
        <label class="block">
          <span class="block text-xs font-medium text-slate-600 mb-1">长度</span>
          <input
            v-model.number="length"
            type="number"
            min="4"
            max="256"
            class="w-24 px-3 py-2 text-sm"
          >
        </label>
        <div class="flex flex-wrap gap-4 text-sm">
          <label class="inline-flex items-center gap-2">
            <input v-model="upper" type="checkbox" class="rounded border-slate-300">
            大写 A–Z
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="lower" type="checkbox" class="rounded border-slate-300">
            小写 a–z
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="digits" type="checkbox" class="rounded border-slate-300">
            数字
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="symbols" type="checkbox" class="rounded border-slate-300">
            符号
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="excludeAmbiguous" type="checkbox" class="rounded border-slate-300">
            排除易混淆 (0 O 1 l I)
          </label>
        </div>
      </div>

      <label v-if="symbols" class="block">
        <span class="block text-xs font-medium text-slate-600 mb-1">自定义符号（可选，留空用默认集）</span>
        <input
          v-model="symbolSet"
          type="text"
          class="w-full max-w-xl px-3 py-2 text-sm font-mono"
          placeholder="!@#$..."
          spellcheck="false"
          autocomplete="off"
        >
      </label>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="nexus-btn-primary"
          @click="regenerate"
        >
          生成
        </button>
        <button
          type="button"
          class="nexus-btn-secondary"
          :disabled="!password"
          @click="copyWithToast(password)"
        >
          复制
        </button>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div
        v-if="password"
        class="nexus-info-panel font-mono text-sm break-all text-slate-900 select-all"
        role="status"
      >
        {{ password }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { generateRandomPassword } from '~~/utils/randomPassword'

useHead({ title: '随机密码 - Nexus Tools' })

const length = ref(20)
const upper = ref(true)
const lower = ref(true)
const digits = ref(true)
const symbols = ref(true)
const excludeAmbiguous = ref(true)
const symbolSet = ref('')

const password = ref('')
const error = ref('')

const regenerate = () => {
  error.value = ''
  password.value = ''
  try {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
      throw new Error('当前环境不支持安全随机数')
    }
    password.value = generateRandomPassword({
      length: length.value,
      upper: upper.value,
      lower: lower.value,
      digits: digits.value,
      symbols: symbols.value,
      excludeAmbiguous: excludeAmbiguous.value,
      symbolSet: symbolSet.value.trim() || undefined
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '生成失败'
  }
}

onMounted(() => {
  regenerate()
})
</script>
