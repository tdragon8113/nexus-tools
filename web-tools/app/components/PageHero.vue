<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    eyebrow?: string
    /** 子工具页：左侧自定义图标槽 + 单行标题 */
    compact?: boolean
    /** 为 false 时不渲染图标列（如纯标题落地页） */
    showIcon?: boolean
  }>(),
  {
    compact: false,
    showIcon: true
  }
)
</script>

<template>
  <header
    class="border-b border-slate-200/80"
    :class="compact ? 'mb-4 pb-3' : 'mb-4 pb-3'"
  >
    <div v-if="compact && showIcon" class="flex items-center gap-3">
      <slot name="icon" />
      <h1 class="font-display text-xl font-semibold text-slate-900">
        {{ title }}
      </h1>
    </div>

    <div
      v-else-if="!compact && showIcon"
      class="flex flex-col sm:flex-row sm:items-start gap-4"
    >
      <slot name="icon" />
      <div class="min-w-0">
        <p
          v-if="eyebrow"
          class="text-xs font-semibold tracking-wider text-indigo-600/90 mb-2"
        >
          {{ eyebrow }}
        </p>
        <h1 class="font-display text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
          {{ title }}
        </h1>
      </div>
    </div>

    <div v-else class="max-w-2xl">
      <p v-if="eyebrow" class="doc-eyebrow mb-3">
        {{ eyebrow }}
      </p>
      <h1 class="font-display text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
        {{ title }}
      </h1>
    </div>
  </header>
</template>
