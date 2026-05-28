<script setup lang="ts">
import type { ClipboardPolicy } from '~/core/desktopClipboardPolicy'

const POLICY_OPTIONS: { value: ClipboardPolicy; label: string; hint: string }[] = [
  { value: 'smart', label: '智能', hint: 'JSON、URL 等自动填入；长文本仅提示，可按 Tab 填入' },
  { value: 'always', label: '始终', hint: '快捷键唤起时总是填入剪贴板' },
  { value: 'never', label: '从不', hint: '不自动填入，需要时自行粘贴' }
]

const { policy, loaded, syncFromMain, setPolicy } = useDesktopClipboardPrefs()

onMounted(() => {
  void syncFromMain()
})
</script>

<template>
  <div v-if="!loaded" class="py-1 text-[13px] text-slate-400">加载中…</div>
  <DesktopSettingsPopup
    v-else
    :model-value="policy"
    :options="POLICY_OPTIONS"
    @update:model-value="setPolicy"
  />
</template>
