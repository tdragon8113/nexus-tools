<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { to: '/', label: '首页' },
        { label: '二维码' }
      ]"
    />

    <PageHero title="二维码" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-purple-100 flex items-center justify-center shadow-sm border border-purple-100"
        >
          <van-icon name="qr" size="24" class="text-purple-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">
        在浏览器内生成 PNG，或上传含二维码的图片尝试解码（依赖图片清晰度）。
      </p>
    </PageHero>

    <div class="flex gap-2 mb-6 border-b border-slate-200 pb-1">
      <button
        type="button"
        class="px-3 py-1.5 text-sm rounded-lg transition-colors"
        :class="tab === 'gen' ? 'bg-purple-100 text-purple-900 font-medium' : 'text-slate-600 hover:bg-slate-100'"
        @click="tab = 'gen'"
      >
        生成
      </button>
      <button
        type="button"
        class="px-3 py-1.5 text-sm rounded-lg transition-colors"
        :class="tab === 'scan' ? 'bg-purple-100 text-purple-900 font-medium' : 'text-slate-600 hover:bg-slate-100'"
        @click="tab = 'scan'"
      >
        解码
      </button>
    </div>

    <div v-if="tab === 'gen'" class="space-y-4">
      <label class="block">
        <span class="block text-xs font-medium text-slate-600 mb-1">内容</span>
        <textarea
          v-model="genText"
          class="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          placeholder="网址或任意文本…"
        />
      </label>
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-sm">
          <span class="text-slate-500">宽度</span>
          <input
            v-model.number="genSize"
            type="number"
            min="64"
            max="1024"
            step="32"
            class="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm"
          >
        </label>
        <button
          type="button"
          class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          @click="makeQr"
        >
          生成
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
          :disabled="!dataUrl"
          @click="downloadPng"
        >
          下载 PNG
        </button>
      </div>
      <p v-if="genError" class="text-sm text-red-600">{{ genError }}</p>
      <div v-if="dataUrl" class="rounded-xl border border-slate-200 bg-white p-4 inline-block">
        <img :src="dataUrl" alt="二维码" class="max-w-full h-auto">
      </div>
    </div>

    <div v-else class="space-y-4">
      <label class="block">
        <span class="block text-xs font-medium text-slate-600 mb-1">选择图片</span>
        <input
          ref="fileRef"
          type="file"
          accept="image/*"
          class="block w-full text-sm text-slate-600"
          @change="onFile"
        >
      </label>
      <p v-if="scanError" class="text-sm text-red-600">{{ scanError }}</p>
      <p v-if="scanResult" class="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 font-mono break-all">
        {{ scanResult }}
      </p>
      <button
        v-if="scanResult"
        type="button"
        class="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        @click="copyWithToast(scanResult)"
      >
        复制结果
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import jsQR from 'jsqr'

useHead({ title: '二维码 - Nexus Tools' })

const tab = ref<'gen' | 'scan'>('gen')
const genText = ref('https://')
const genSize = ref(256)
const genError = ref('')
const dataUrl = ref('')

const fileRef = ref<HTMLInputElement | null>(null)
const scanError = ref('')
const scanResult = ref('')

const makeQr = async () => {
  genError.value = ''
  dataUrl.value = ''
  try {
    dataUrl.value = await QRCode.toDataURL(genText.value, {
      width: genSize.value,
      margin: 2,
      errorCorrectionLevel: 'M'
    })
  } catch {
    genError.value = '生成失败，请缩短内容或调整宽度'
  }
}

const downloadPng = () => {
  if (!dataUrl.value || !import.meta.client) return
  const a = document.createElement('a')
  a.href = dataUrl.value
  a.download = 'qrcode.png'
  a.click()
}

const onFile = async (ev: Event) => {
  scanError.value = ''
  scanResult.value = ''
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) {
    scanError.value = '无法读取图片'
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    scanError.value = 'Canvas 不可用'
    return
  }
  ctx.drawImage(bitmap, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, imageData.width, imageData.height)
  bitmap.close()

  if (!code) {
    scanError.value = '未识别到二维码，换一张更清晰的图试试'
    return
  }
  scanResult.value = code.data
}

onMounted(() => {
  void makeQr()
})
</script>
