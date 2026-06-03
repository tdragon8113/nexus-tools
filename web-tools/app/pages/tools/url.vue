<template>
  <div class="desktop-tool-page flex h-full min-h-0 flex-col">
<div class="space-y-4">
      <label class="block">
        <span class="sr-only">文本</span>
        <textarea
          v-model="input"
          class="w-full min-h-[140px] px-3 py-2.5 text-sm font-mono text-slate-900"
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
          class="nexus-btn-primary"
          @click="encode"
        >
          编码（encodeURIComponent）
        </button>
        <button
          type="button"
          class="nexus-btn-secondary"
          @click="decode"
        >
          解码（decodeURIComponent）
        </button>
        <button type="button" class="nexus-btn-secondary" @click="clear">
          清空
        </button>
        <button
          type="button"
          class="nexus-btn-secondary"
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

const input = ref('')
const error = ref('')

useConsumeToolPrefill('url', (text) => {
  input.value = text
})

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

</script>
