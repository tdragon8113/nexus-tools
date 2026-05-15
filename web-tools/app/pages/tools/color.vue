<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { to: '/', label: '首页' },
        { label: '颜色转换' }
      ]"
    />

    <PageHero title="颜色转换" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-pink-100 flex items-center justify-center shadow-sm border border-pink-100"
        >
          <van-icon name="brush-o" size="24" class="text-pink-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">HEX、RGB、HSL 互转，取色器与文本均可编辑。</p>
    </PageHero>

    <div class="flex flex-wrap gap-6 items-start">
      <div
        class="w-28 h-28 rounded-2xl border border-slate-200 shadow-inner shrink-0"
        :style="{ backgroundColor: previewCss }"
        aria-hidden="true"
      />
      <div class="flex-1 min-w-[200px] space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">HEX</label>
          <div class="flex gap-2 flex-wrap">
            <input
              v-model="hexInput"
              type="text"
              class="flex-1 min-w-[8rem] rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono uppercase"
              placeholder="#RRGGBB"
              @blur="syncFromHex"
            >
            <input v-model="picker" type="color" class="h-10 w-14 cursor-pointer rounded border border-slate-200" @input="onPicker">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">RGB</label>
          <input
            v-model="rgbText"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
            placeholder="rgb(255, 0, 128)"
            @blur="syncFromRgbText"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">HSL</label>
          <input
            v-model="hslText"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
            placeholder="hsl(330, 100%, 50%)"
            @blur="syncFromHslText"
          >
        </div>
        <p v-if="err" class="text-sm text-red-600">{{ err }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            @click="copyWithToast(rgbDerived, '已复制 RGB')"
          >
            复制 RGB
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            @click="copyWithToast(hslDerived, '已复制 HSL')"
          >
            复制 HSL
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            @click="copyWithToast(hexNorm, '已复制 HEX')"
          >
            复制 HEX
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatHsl, formatRgb, hslToRgb, parseHex, rgbToHex, rgbToHsl } from '~~/utils/colorConvert'

useHead({ title: '颜色转换 - Nexus Tools' })

const err = ref('')

const rgb = ref({ r: 59, g: 130, b: 246 })
const hexInput = ref('#3B82F6')
const picker = ref('#3b82f6')

const hexNorm = computed(() => rgbToHex(rgb.value))
const hslModel = computed(() => rgbToHsl(rgb.value))
const rgbDerived = computed(() => formatRgb(rgb.value))
const hslDerived = computed(() => formatHsl(hslModel.value))
const previewCss = computed(() => formatRgb(rgb.value))

const rgbText = ref('')
const hslText = ref('')

watch(
  rgb,
  () => {
    hexInput.value = hexNorm.value
    picker.value = hexNorm.value.toLowerCase()
    rgbText.value = rgbDerived.value
    hslText.value = hslDerived.value
    err.value = ''
  },
  { immediate: true }
)

function applyRgb(next: typeof rgb.value) {
  rgb.value = next
}

function syncFromHex() {
  err.value = ''
  const p = parseHex(hexInput.value)
  if (!p) {
    err.value = 'HEX 格式无效'
    return
  }
  applyRgb(p.rgb)
}

function onPicker() {
  err.value = ''
  const p = parseHex(picker.value)
  if (p) applyRgb(p.rgb)
}

function parseRgbLoose(s: string): { r: number; g: number; b: number } | null {
  const m = s.trim().match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (!m) return null
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }
}

function parseHslLoose(s: string): { h: number; s: number; l: number } | null {
  const m = s.trim().match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i)
  if (!m) return null
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) }
}

function syncFromRgbText() {
  err.value = ''
  const c = parseRgbLoose(rgbText.value)
  if (!c || [c.r, c.g, c.b].some(n => Number.isNaN(n))) {
    err.value = 'RGB 解析失败，示例 rgb(255, 0, 128)'
    return
  }
  applyRgb(c)
}

function syncFromHslText() {
  err.value = ''
  const h = parseHslLoose(hslText.value)
  if (!h || [h.h, h.s, h.l].some(n => Number.isNaN(n))) {
    err.value = 'HSL 解析失败，示例 hsl(330, 100%, 50%)'
    return
  }
  applyRgb(hslToRgb(h))
}
</script>
