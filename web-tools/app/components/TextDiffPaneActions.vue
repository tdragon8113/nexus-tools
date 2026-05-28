<template>
  <div class="flex items-center gap-0.5">
    <button
      type="button"
      class="text-diff-tbar-tip"
      :class="[paneTbarBtn, paneTbarDisabled]"
      data-tip="复制内容"
      aria-label="复制内容"
      :disabled="!hasText"
      @click="emit('copy')"
    >
      <van-icon name="description" size="18" />
    </button>
    <button
      v-if="canFormat"
      type="button"
      class="text-diff-tbar-tip"
      :class="[paneTbarBtn, paneTbarDisabled]"
      :data-tip="formatTip"
      :aria-label="formatTip"
      :disabled="formatDisabled"
      @click="emit('format')"
    >
      <svg
        class="size-[18px] shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M5 7h14M5 12h8.5M5 17h14" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasText: boolean
  canFormat: boolean
  formatTip: string
  formatDisabled: boolean
}>()

const emit = defineEmits<{
  copy: []
  format: []
}>()

const paneTbarCore =
  'inline-flex size-7 shrink-0 items-center justify-center rounded-full border-0 outline-none transition-[background-color,opacity] duration-150 focus-visible:ring-2 focus-visible:ring-offset-1'
const paneTbarBtn = `${paneTbarCore} bg-transparent text-slate-500 hover:bg-black/[0.055] active:bg-black/[0.08] focus-visible:ring-slate-300/60`
const paneTbarDisabled = 'disabled:opacity-40 disabled:pointer-events-none'
</script>
