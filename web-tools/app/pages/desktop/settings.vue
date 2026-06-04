<script setup lang="ts">
definePageMeta({
  layout: 'desktop',
  desktopPanelScroll: true
})

useHead({ title: '设置 - Nexus Tools' })

const { autoHideOnBlur, loaded: autoHideLoaded, syncFromMain, setAutoHideOnBlur } = useDesktopAutoHide()
const { autoUpdateEnabled, loaded: updaterLoaded, syncFromMain: syncUpdater, setAutoUpdateEnabled } =
  useDesktopUpdater()
const { openAtLogin, loaded: launchAtLoginLoaded, syncFromMain: syncLaunchAtLogin, setOpenAtLogin } =
  useDesktopLaunchAtLogin()

onMounted(() => {
  void syncFromMain()
  void syncUpdater()
  void syncLaunchAtLogin()
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
          :disabled="!autoHideLoaded"
          compact
          label="失焦时自动隐藏"
          @update:model-value="setAutoHideOnBlur"
        />
      </DesktopSettingsField>

      <DesktopSettingsField
        border-top
        label="外观主题"
        description="搜索启动器与桌面窗口背景。跟随系统时会随 macOS 浅色/深色外观自动切换。"
      >
        <DesktopThemeSettings />
      </DesktopSettingsField>

      <DesktopSettingsField
        border-top
        label="辅助功能"
        description="用于快捷键自动填入等能力。macOS 需在系统设置中授权一次。"
      >
        <DesktopAccessibilitySettings />
      </DesktopSettingsField>

      <DesktopSettingsField
        border-top
        label="剪贴板填入"
        description="用快捷键打开搜索时，是否将剪贴板内容写入搜索框。应用内点击「搜索」不会自动填入。"
      >
        <DesktopClipboardSettings />
      </DesktopSettingsField>

      <DesktopSettingsField
        border-top
        label="开机自动启动"
        description="登录系统后在后台运行 Nexus Tools，可用全局快捷键唤起；开机启动时不会自动弹出搜索窗。"
      >
        <DesktopSettingsToggle
          :model-value="openAtLogin"
          :disabled="!launchAtLoginLoaded"
          compact
          label="开机自动启动"
          @update:model-value="setOpenAtLogin"
        />
      </DesktopSettingsField>

      <DesktopSettingsField
        border-top
        label="自动检查更新"
        description="启动后检查 GitHub Release。Windows 可后台下载并安装；macOS 可自动下载，安装需打开 Release 中的 DMG（覆盖安装后会自动清除隔离标记）。"
      >
        <DesktopSettingsToggle
          :model-value="autoUpdateEnabled"
          :disabled="!updaterLoaded"
          compact
          label="自动检查更新"
          @update:model-value="setAutoUpdateEnabled"
        />
      </DesktopSettingsField>

      <DesktopSettingsField
        border-top
        label="版本"
        description="显示当前安装版本，可手动检查 GitHub 最新发布。打包版支持在线检查与下载；开发模式仅显示版本号。"
      >
        <DesktopSettingsUpdater />
      </DesktopSettingsField>
    </DesktopSettingsPanel>
  </div>
</template>
