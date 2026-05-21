<template>
  <div class="max-w-3xl px-4 sm:px-6 py-8 md:py-10">
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
        UTF-8 文本与 Base64 互转；上传或粘贴图片 Base64 将自动预览，仅在浏览器内处理。
      </p>
    </PageHero>

    <div class="space-y-4">
      <section
        class="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 space-y-3"
        aria-label="上传图片编码"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-medium text-slate-800">上传图片 → Base64</p>
          <fieldset class="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <legend class="sr-only">输出格式</legend>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                v-model="imageOutputFormat"
                type="radio"
                class="text-green-600 focus:ring-green-500/40"
                value="data-uri"
              >
              Data URI
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                v-model="imageOutputFormat"
                type="radio"
                class="text-green-600 focus:ring-green-500/40"
                value="raw"
              >
              纯 Base64
            </label>
          </fieldset>
        </div>

        <input
          ref="fileRef"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="onImageFile"
        >

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-green-500/30"
            :disabled="encodingImage"
            @click="pickImageFile"
          >
            {{ encodingImage ? '编码中…' : '选择图片' }}
          </button>
          <p v-if="uploadedFileName" class="text-xs text-slate-500 truncate max-w-[min(100%,16rem)]">
            {{ uploadedFileName }}
          </p>
        </div>
      </section>

      <label class="block">
        <span class="sr-only">输入文本</span>
        <textarea
          v-model="input"
          class="w-full min-h-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 font-mono"
          placeholder="文本或图片 Base64 / data:image/...;base64,…"
          spellcheck="false"
        />
      </label>

      <section
        v-if="imagePreview"
        class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3"
        aria-label="图片预览"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-medium text-emerald-900">
            已识别为图片
          </p>
          <p class="text-xs text-emerald-800/80 font-mono">
            {{ imagePreview.mime }} · {{ formatBytes(imagePreview.byteLength) }}
          </p>
        </div>

        <div
          class="rounded-lg border border-emerald-100 bg-white p-3 flex items-center justify-center min-h-[120px] max-h-[min(70vh,480px)] overflow-auto"
        >
          <img
            :src="imagePreview.url"
            :alt="`图片预览 ${imagePreview.fileName}`"
            class="max-w-full max-h-[min(68vh,440px)] object-contain"
          >
        </div>

        <div class="flex flex-wrap gap-2">
          <a
            :href="imagePreview.url"
            :download="imagePreview.fileName"
            class="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            下载图片
          </a>
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            @click="dismissImagePreview"
          >
            关闭预览
          </button>
        </div>
      </section>

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
          从 Base64 解码文本
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
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { showToast } from 'vant'
import {
  Base64DecodeError,
  encodeImageFileToBase64,
  imageMimeToExtension,
  tryDecodeBase64Image,
  type ImageBase64OutputFormat,
  utf8ToBase64,
  base64ToUtf8
} from '~~/utils/utf8Base64'

const BASE64_DECODE_ERRORS: Record<Base64DecodeError['code'], string> = {
  empty: '请输入要解码的 Base64 字符串',
  invalid_length: 'Base64 长度无效，请检查是否复制完整',
  invalid: '无法解码：请确认是有效的 Base64 字符串（支持 Data URI 与 URL-safe）',
  not_image: '解码结果不是图片，请粘贴 PNG/JPEG/GIF/WebP 等图片的 Base64 或 data:image/…',
  too_large: '图片过大（超过 10MB），请缩短 Base64 或换用更小的图片'
}

interface ImagePreviewState {
  url: string
  mime: string
  byteLength: number
  fileName: string
}

useHead({ title: 'Base64 - Nexus Tools' })

const input = ref('')
const error = ref('')
const imagePreview = ref<ImagePreviewState | null>(null)
const fileRef = ref<HTMLInputElement | null>(null)
const imageOutputFormat = ref<ImageBase64OutputFormat>('data-uri')
const encodingImage = ref(false)
const uploadedFileName = ref('')
const previewDismissed = ref(false)

const { consumeBase64Prefill } = usePlainToolPrefill()

let previewDebounceTimer: ReturnType<typeof setTimeout> | null = null

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function clearImagePreview() {
  const prev = imagePreview.value
  if (prev?.url) URL.revokeObjectURL(prev.url)
  imagePreview.value = null
}

function dismissImagePreview() {
  previewDismissed.value = true
  clearImagePreview()
}

function setImagePreviewFromBytes(
  mime: string,
  byteLength: number,
  bytes: Uint8Array,
  fileName?: string
) {
  clearImagePreview()
  const blob = new Blob([bytes], { type: mime })
  const url = URL.createObjectURL(blob)
  const ext = imageMimeToExtension(mime)
  imagePreview.value = {
    url,
    mime,
    byteLength,
    fileName: fileName ?? `decoded-image.${ext}`
  }
}

function syncImagePreviewFromInput() {
  if (previewDismissed.value || encodingImage.value) return

  const raw = input.value
  if (!raw.trim()) {
    clearImagePreview()
    return
  }

  try {
    const decoded = tryDecodeBase64Image(raw)
    if (!decoded) {
      clearImagePreview()
      return
    }
    const name = uploadedFileName.value || undefined
    setImagePreviewFromBytes(
      decoded.mime,
      decoded.byteLength,
      decoded.bytes,
      name
    )
  } catch (e) {
    clearImagePreview()
    if (e instanceof Base64DecodeError && e.code === 'too_large') {
      error.value = BASE64_DECODE_ERRORS.too_large
    }
  }
}

function scheduleImagePreviewSync() {
  if (previewDebounceTimer) clearTimeout(previewDebounceTimer)
  previewDebounceTimer = setTimeout(() => {
    previewDebounceTimer = null
    syncImagePreviewFromInput()
  }, 300)
}

watch(input, () => {
  previewDismissed.value = false
  scheduleImagePreviewSync()
})

const encode = () => {
  error.value = ''
  previewDismissed.value = false
  try {
    input.value = utf8ToBase64(input.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '编码失败'
  }
}

const decode = () => {
  error.value = ''
  previewDismissed.value = true
  clearImagePreview()
  try {
    input.value = base64ToUtf8(input.value)
  } catch (e) {
    error.value =
      e instanceof Base64DecodeError
        ? BASE64_DECODE_ERRORS[e.code]
        : '无法解码：请确认是有效的 Base64 字符串'
  }
}

function resetFileInput() {
  if (fileRef.value) fileRef.value.value = ''
}

const pickImageFile = () => {
  fileRef.value?.click()
}

const onImageFile = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  error.value = ''
  previewDismissed.value = false
  encodingImage.value = true
  uploadedFileName.value = file.name

  try {
    const { output } = await encodeImageFileToBase64(
      file,
      imageOutputFormat.value
    )
    input.value = output
    syncImagePreviewFromInput()
    showToast('已生成 Base64')
  } catch (e) {
    uploadedFileName.value = ''
    error.value =
      e instanceof Base64DecodeError
        ? BASE64_DECODE_ERRORS[e.code]
        : '图片编码失败，请换一张图片重试'
  } finally {
    encodingImage.value = false
    resetFileInput()
  }
}

const clearAll = () => {
  input.value = ''
  error.value = ''
  uploadedFileName.value = ''
  previewDismissed.value = false
  clearImagePreview()
  resetFileInput()
}

onMounted(() => {
  const prefill = consumeBase64Prefill()
  if (prefill) {
    input.value = prefill
    syncImagePreviewFromInput()
  }
})

const copyInput = () => {
  void copyWithToast(input.value)
}

onUnmounted(() => {
  if (previewDebounceTimer) clearTimeout(previewDebounceTimer)
  clearImagePreview()
})
</script>
