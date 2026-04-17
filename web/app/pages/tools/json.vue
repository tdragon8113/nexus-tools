<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <AppHeader />

    <!-- Tool Content -->
    <main class="max-w-5xl mx-auto px-4 py-8">
      <!-- Tool Header -->
      <div class="mb-6">
        <NuxtLink to="/" class="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 mb-4">
          <van-icon name="arrow-left" size="16" />
          <span class="text-sm">返回首页</span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <van-icon name="description" size="20" class="text-blue-500" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-800">JSON 格式化</h1>
            <p class="text-sm text-slate-500">美化、压缩、验证 JSON 数据</p>
          </div>
        </div>
      </div>

      <!-- Tool Panel -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <!-- Action Buttons -->
        <div class="flex border-b border-slate-100">
          <button
            @click="formatJson"
            class="flex-1 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <van-icon name="edit" size="16" />
            格式化
          </button>
          <button
            @click="compressJson"
            class="flex-1 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 border-l border-slate-100"
          >
            <van-icon name="minus" size="16" />
            压缩
          </button>
          <button
            @click="copyOutput"
            class="flex-1 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 border-l border-slate-100"
          >
            <van-icon name="share-o" size="16" />
            复制
          </button>
          <button
            @click="clearAll"
            class="flex-1 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 border-l border-slate-100"
          >
            <van-icon name="delete-o" size="16" />
            清空
          </button>
        </div>

        <!-- Editor Areas -->
        <div class="grid md:grid-cols-2 gap-0">
          <!-- Input -->
          <div class="border-r border-slate-100">
            <div class="px-4 py-2 bg-slate-50 border-b border-slate-100">
              <span class="text-xs font-medium text-slate-500">输入 JSON</span>
            </div>
            <textarea
              v-model="inputJson"
              class="w-full h-64 p-4 text-sm font-mono text-slate-700 resize-none focus:outline-none placeholder:text-slate-300"
              placeholder="粘贴 JSON 数据..."
              spellcheck="false"
            ></textarea>
          </div>

          <!-- Output -->
          <div>
            <div class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500">输出结果</span>
              <span v-if="error" class="text-xs text-red-500">{{ error }}</span>
              <span v-else-if="outputJson" class="text-xs text-green-500">有效 JSON</span>
            </div>
            <pre
              class="w-full h-64 p-4 text-sm font-mono text-slate-700 overflow-auto bg-slate-50"
            ><code>{{ outputJson || '等待输入...' }}</code></pre>
          </div>
        </div>
      </div>

      <!-- Tips -->
      <div class="mt-6 p-4 bg-blue-50 rounded-xl">
        <h3 class="text-sm font-medium text-blue-700 mb-2">使用提示</h3>
        <ul class="text-xs text-blue-600 space-y-1">
          <li>• 输入 JSON 后点击"格式化"进行美化</li>
          <li>• 点击"压缩"移除多余空格和换行</li>
          <li>• 无效 JSON 会显示错误信息</li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'

definePageMeta({
  layout: false
})

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const indentSpaces = ref(2)

const formatJson = () => {
  error.value = ''
  if (!inputJson.value.trim()) {
    outputJson.value = ''
    return
  }

  try {
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed, null, indentSpaces.value)
  } catch (e) {
    error.value = 'JSON 格式错误'
    outputJson.value = inputJson.value
  }
}

const compressJson = () => {
  error.value = ''
  if (!inputJson.value.trim()) {
    outputJson.value = ''
    return
  }

  try {
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed)
  } catch (e) {
    error.value = 'JSON 格式错误'
    outputJson.value = inputJson.value
  }
}

const copyOutput = async () => {
  if (!outputJson.value) return

  try {
    await navigator.clipboard.writeText(outputJson.value)
    showToast('已复制到剪贴板')
  } catch (e) {
    showToast('复制失败')
  }
}

const clearAll = () => {
  inputJson.value = ''
  outputJson.value = ''
  error.value = ''
}
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-all;
}

pre code {
  display: block;
}

textarea:focus {
  background: rgba(59, 130, 246, 0.02);
}
</style>
