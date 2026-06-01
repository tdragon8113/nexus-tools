<template>
  <div class="flex items-center gap-2 py-1">
    <span class="shrink-0 text-xl leading-none" aria-hidden="true">{{ currentEmoji }}</span>
    <div class="flex items-center gap-0.5" role="group" aria-label="感受评分">
      <button
        v-for="n in 5"
        :key="n"
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg transition-transform active:scale-95"
        :aria-label="`${n} 星`"
        @click="modelValue = n"
      >
        <span
          class="text-xl leading-none"
          :class="n <= modelValue ? 'text-amber-400' : 'text-slate-200'"
        >
          {{ n <= modelValue ? '★' : '☆' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFeelingLevel } from '~/composables/useLifeCards'

const modelValue = defineModel<number>({ default: 3 })

const currentEmoji = computed(() => {
  const rating = modelValue.value >= 1 && modelValue.value <= 5 ? modelValue.value : 3
  return getFeelingLevel(rating as 1 | 2 | 3 | 4 | 5).emoji
})
</script>
