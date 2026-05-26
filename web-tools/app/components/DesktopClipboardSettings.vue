<script setup lang="ts">
import type { ClipboardPolicy } from '~/core/desktopClipboardPolicy'

const POLICY_OPTIONS: {
  value: ClipboardPolicy
  label: string
  description: string
}[] = [
  {
    value: 'smart',
    label: '智能',
    description: 'JSON、URL 等自动填入；长文本仅提示，可按 Tab 填入。'
  },
  {
    value: 'always',
    label: '始终',
    description: '快捷键唤起时总是填入剪贴板（应用内点「搜索」除外）。'
  },
  {
    value: 'never',
    label: '从不',
    description: '不自动填入；需要时自行粘贴到搜索框。'
  }
]

const { policy, loaded, syncFromMain, setPolicy } = useDesktopClipboardPrefs()

onMounted(() => {
  void syncFromMain()
})
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-4">
    <h3 class="text-sm font-semibold text-slate-800">剪贴板填入</h3>
    <p class="mt-1 text-xs leading-relaxed text-slate-500">
      控制用快捷键打开搜索时，是否将剪贴板内容写入搜索框。
    </p>

    <div v-if="!loaded" class="mt-3 text-xs text-slate-400">加载中…</div>
    <fieldset v-else class="mt-3 space-y-2" :disabled="!loaded">
      <label
        v-for="opt in POLICY_OPTIONS"
        :key="opt.value"
        class="flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 transition-colors"
        :class="
          policy === opt.value
            ? 'border-blue-300 bg-blue-50/60'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
        "
      >
        <input
          type="radio"
          name="clipboard-policy"
          class="mt-0.5 shrink-0"
          :value="opt.value"
          :checked="policy === opt.value"
          @change="setPolicy(opt.value)"
        />
        <span class="min-w-0">
          <span class="block text-sm font-medium text-slate-800">{{ opt.label }}</span>
          <span class="mt-0.5 block text-xs leading-relaxed text-slate-500">{{ opt.description }}</span>
        </span>
      </label>
    </fieldset>
  </section>
</template>
