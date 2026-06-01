<template>
  <button
    type="button"
    class="life-card relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all active:scale-[0.98] disabled:opacity-60"
    :class="[
      selected
        ? 'border-indigo-400 bg-indigo-50/80 shadow-sm ring-2 ring-indigo-300'
        : muted
          ? 'border-dashed border-slate-300/80 bg-slate-50/60'
          : 'border-slate-200/80 bg-white/80',
      compact ? 'p-2.5 gap-1.5' : ''
    ]"
    :disabled="saving"
    @click="$emit('select', card)"
  >
    <div
      class="flex items-center justify-center rounded-xl"
      :class="[iconBgClass, compact ? 'h-9 w-9' : 'h-11 w-11']"
    >
      <van-icon :name="card.icon" :size="compact ? 18 : 22" :class="iconTextClass" />
    </div>
    <span
      class="font-medium text-slate-800 leading-tight text-center"
      :class="compact ? 'text-[11px]' : 'text-xs'"
    >
      {{ card.label }}
    </span>
    <span
      v-if="badge"
      class="absolute top-1.5 right-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600"
    >
      {{ badge }}
    </span>
    <van-icon
      v-if="selected"
      name="success"
      size="16"
      class="absolute top-2 right-2 text-indigo-500"
    />
  </button>
</template>

<script setup lang="ts">
import { type LifeCard, type LifeCardColor } from '~/composables/useLifeCards'

const props = defineProps<{
  card: LifeCard
  selected?: boolean
  saving?: boolean
  compact?: boolean
  muted?: boolean
  badge?: string
}>()

defineEmits<{
  select: [card: LifeCard]
}>()

const ICON_BG: Record<LifeCardColor, string> = {
  indigo: 'bg-indigo-100',
  amber: 'bg-amber-100',
  emerald: 'bg-emerald-100',
  rose: 'bg-rose-100',
  sky: 'bg-sky-100',
  slate: 'bg-slate-100'
}

const ICON_TEXT: Record<LifeCardColor, string> = {
  indigo: 'text-indigo-600',
  amber: 'text-amber-600',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
  sky: 'text-sky-600',
  slate: 'text-slate-600'
}

const iconBgClass = computed(() => ICON_BG[props.card.color])
const iconTextClass = computed(() => ICON_TEXT[props.card.color])
</script>
