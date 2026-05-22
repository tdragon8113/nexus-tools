<script setup lang="ts">
import { showToast } from 'vant'
import { toolMatchesQuery } from '~/core/search'
import { siteTools, type SiteTool } from '~/core/tools'

const props = withDefaults(
  defineProps<{
    filter?: string
    columns?: '2' | '3' | '4'
    /**
     * default — 网站工具集大卡片
     * compact — 横向小卡片网格
     * list — 桌面工具集列表（uTools 风格）
     * icons — 桌面工具集图标网格（仅图标+名称）
     */
    variant?: 'default' | 'compact' | 'list' | 'icons'
    /** list 模式下键盘高亮行 */
    activeIndex?: number
    onPick?: (tool: SiteTool) => void | Promise<void>
  }>(),
  { filter: '', columns: '3', variant: 'default', activeIndex: -1 }
)

const emit = defineEmits<{ pick: [tool: SiteTool] }>()

const tools = computed(() => siteTools.filter((t) => t.id !== 'more'))

const filtered = computed(() => {
  if (!props.filter.trim()) return tools.value
  return tools.value.filter((t) => toolMatchesQuery(t, props.filter))
})

const iconGridClass = computed(() => {
  if (props.columns === '2') return 'grid-cols-3 sm:grid-cols-4'
  if (props.columns === '4') return 'grid-cols-5'
  return 'grid-cols-4'
})

const gridClass = computed(() => {
  if (props.variant === 'icons') return iconGridClass.value
  if (props.variant === 'compact') {
    if (props.columns === '2') return 'grid-cols-2'
    if (props.columns === '4') return 'grid-cols-4'
    return 'grid-cols-3'
  }
  if (props.columns === '2') return 'grid-cols-2'
  if (props.columns === '4') return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  return 'grid-cols-2 lg:grid-cols-3'
})

const gapClass = computed(() =>
  props.variant === 'compact' ? 'gap-1.5' : 'gap-2.5 sm:gap-3'
)

const listRef = ref<HTMLElement | null>(null)

watch(
  () => [props.activeIndex, props.variant, filtered.value.length] as const,
  () => {
    if (
      (props.variant !== 'list' && props.variant !== 'icons') ||
      props.activeIndex == null ||
      props.activeIndex < 0
    )
      return
    void nextTick(() => {
      const el = listRef.value?.querySelector(`[data-tool-idx="${props.activeIndex}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    })
  }
)

async function pick(tool: SiteTool) {
  if (!tool.path) {
    showToast('即将上线')
    return
  }
  if (props.onPick) {
    await props.onPick(tool)
    return
  }
  emit('pick', tool)
}
</script>

<template>
  <!-- 桌面：紧凑列表 -->
  <ul
    v-if="variant === 'list'"
    ref="listRef"
    class="overflow-hidden rounded-md border border-slate-200/80 bg-white shadow-sm"
    role="listbox"
  >
    <li
      v-for="(tool, i) in filtered"
      :key="tool.id"
      role="option"
      :data-tool-idx="i"
      :aria-selected="activeIndex === i"
      :class="i > 0 ? 'border-t border-slate-100' : ''"
    >
      <button
        type="button"
        :title="`${tool.name} — ${tool.desc}`"
        class="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors"
        :class="[
          activeIndex === i ? 'bg-blue-50' : 'hover:bg-slate-50 active:bg-slate-100/90',
          !tool.path ? 'cursor-default opacity-60' : ''
        ]"
        @click="pick(tool)"
      >
        <div
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          :class="tool.bgColor"
        >
          <van-icon :name="tool.icon" size="14" :class="tool.iconColor" />
        </div>
        <span class="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">
          {{ tool.name }}
        </span>
      </button>
    </li>
    <li v-if="!filtered.length" class="px-3 py-8 text-center text-xs text-slate-500">
      没有匹配的工具
    </li>
  </ul>

  <!-- 桌面：图标网格 -->
  <div
    v-else-if="variant === 'icons'"
    ref="listRef"
    role="listbox"
    class="grid gap-2"
    :class="iconGridClass"
  >
    <button
      v-for="(tool, i) in filtered"
      :key="tool.id"
      type="button"
      role="option"
      :data-tool-idx="i"
      :aria-selected="activeIndex === i"
      :title="tool.desc"
      class="flex flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2.5 transition-colors"
      :class="[
        activeIndex === i
          ? 'border-blue-400 bg-blue-50 shadow-sm shadow-blue-500/10'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50',
        !tool.path ? 'cursor-default opacity-60' : ''
      ]"
      @click="pick(tool)"
    >
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl"
        :class="tool.bgColor"
      >
        <van-icon :name="tool.icon" size="22" :class="tool.iconColor" />
      </div>
      <span class="w-full truncate text-center text-xs font-medium leading-tight text-slate-800">
        {{ tool.name }}
      </span>
    </button>
    <p
      v-if="!filtered.length"
      class="col-span-full py-10 text-center text-xs text-slate-500"
    >
      没有匹配的工具
    </p>
  </div>

  <!-- 网站：卡片网格 -->
  <template v-else>
    <div class="grid" :class="[gapClass, gridClass]">
      <button
        v-for="tool in filtered"
        :key="tool.id"
        type="button"
        class="group text-left shadow-sm transition-colors"
        :class="
          variant === 'compact'
            ? [
                'flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 hover:border-blue-200 hover:bg-blue-50/40',
                !tool.path ? 'cursor-default opacity-75' : ''
              ]
            : [
                'flex flex-col items-start gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3.5 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:gap-3 sm:p-4',
                !tool.path ? 'cursor-default opacity-75' : ''
              ]
        "
        @click="pick(tool)"
      >
        <div
          class="flex shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
          :class="[
            tool.bgColor,
            variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10 rounded-xl sm:h-11 sm:w-11'
          ]"
        >
          <van-icon
            :name="tool.icon"
            :size="variant === 'compact' ? 16 : 20"
            :class="tool.iconColor"
          />
        </div>
        <div class="min-w-0 flex-1">
          <span
            class="block font-semibold text-slate-900"
            :class="variant === 'compact' ? 'truncate text-xs' : 'text-sm'"
          >{{ tool.name }}</span>
          <span
            class="block text-slate-500"
            :class="
              variant === 'compact'
                ? 'truncate text-[10px] leading-tight'
                : 'mt-1 text-xs leading-relaxed'
            "
          >{{ tool.desc }}</span>
        </div>
      </button>
    </div>
    <p
      v-if="!filtered.length"
      class="text-center text-slate-500"
      :class="variant === 'compact' ? 'py-6 text-xs' : 'py-10 text-sm'"
    >
      没有匹配的工具
    </p>
  </template>
</template>
