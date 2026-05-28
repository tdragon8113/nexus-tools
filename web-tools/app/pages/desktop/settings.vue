<script setup lang="ts">
definePageMeta({
  layout: 'desktop',
  desktopPanelScroll: true
})

useHead({ title: '设置 - Nexus Tools' })

const { autoHideOnBlur, loaded, syncFromMain, setAutoHideOnBlur } = useDesktopAutoHide()

onMounted(() => {
  void syncFromMain()
})
</script>

<template>
  <div class="desktop-settings-page w-full pb-1 pt-0.5">
    <DesktopSettingsPanel>
      <DesktopSettingsField
        label="失焦时自动隐藏"
        description="开启：点击其他应用或使用 Cmd+Tab 时收起窗口。关闭：窗口保留在后台，仅被其他软件覆盖。图钉固定时始终不收起。"
      >
        <DesktopSettingsToggle
          :model-value="autoHideOnBlur"
          :disabled="!loaded"
          compact
          label="失焦时自动隐藏"
          @update:model-value="setAutoHideOnBlur"
        />
      </DesktopSettingsField>

      <DesktopSettingsField
        border-top
        label="剪贴板填入"
        description="用快捷键打开搜索时，是否将剪贴板内容写入搜索框。应用内点击「搜索」不会自动填入。"
      >
        <DesktopClipboardSettings />
      </DesktopSettingsField>
    </DesktopSettingsPanel>
  </div>
</template>
