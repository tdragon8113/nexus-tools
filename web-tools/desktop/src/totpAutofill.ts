import { execFileSync } from 'node:child_process'
import { app, clipboard, Notification, shell, systemPreferences } from 'electron'

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function notify(title: string, body: string) {
  if (!Notification.isSupported()) return
  new Notification({ title, body }).show()
}

/** 隐藏窗口后等待焦点回到目标应用（尽量短，过长会显得“迟滞”） */
export const FOCUS_HANDOFF_MS = 40

/** 开发模式（npm run desktop:dev）跑的是 Electron 二进制，不是打包后的 Nexus Tools */
export function isDesktopDevMode(): boolean {
  return process.platform === 'darwin' && !app.isPackaged
}

/** 从终端/IDE 启动时，nut.js 可能还要求该宿主应用具备辅助功能 */
function detectDevLaunchHostLabel(): string | null {
  if (!isDesktopDevMode()) return null
  try {
    let pid = process.ppid
    for (let depth = 0; depth < 8 && pid > 1; depth += 1) {
      const name = execFileSync('ps', ['-p', String(pid), '-o', 'comm='], { encoding: 'utf8' })
        .trim()
        .toLowerCase()
      if (name.includes('cursor')) return 'Cursor'
      if (name.includes('iterm')) return 'iTerm'
      if (name.includes('terminal')) return 'Terminal'
      if (name.includes('warp')) return 'Warp'
      if (name.includes('idea') || name.includes('pycharm') || name.includes('webstorm')) return 'JetBrains IDE'
      const ppid = Number(
        execFileSync('ps', ['-p', String(pid), '-o', 'ppid='], { encoding: 'utf8' }).trim()
      )
      if (!Number.isFinite(ppid) || ppid <= 1) break
      pid = ppid
    }
  } catch {
    /* ignore */
  }
  return null
}

/** 与 nut.js 一致的 macOS 辅助功能状态 */
export type MacAccessibilityAuthStatus = 'authorized' | 'denied' | 'not determined' | 'restricted' | 'unknown'

function getNutJsAccessibilityStatus(): MacAccessibilityAuthStatus {
  if (process.platform !== 'darwin') return 'authorized'
  try {
    const permissions = require('@nut-tree-fork/node-mac-permissions') as {
      getAuthStatus: (type: 'accessibility') => string
    }
    const status = permissions.getAuthStatus('accessibility')
    if (
      status === 'authorized' ||
      status === 'denied' ||
      status === 'not determined' ||
      status === 'restricted'
    ) {
      return status
    }
    return 'unknown'
  } catch {
    return systemPreferences.isTrustedAccessibilityClient(false) ? 'authorized' : 'unknown'
  }
}

/** 系统设置「辅助功能」列表里显示的应用名 */
export function getAccessibilityAppName(): string {
  if (isDesktopDevMode()) return 'Electron'
  return app.getName() || 'Nexus Tools'
}

export function getAccessibilityHint(): string {
  if (isDesktopDevMode()) return '请在系统设置 → 辅助功能中开启 Electron。'
  return '请在系统设置 → 辅助功能中开启本应用。'
}

/** Electron 系统 API（可能与 nut.js 判定不一致，仅作参考） */
export function hasAccessibilityPermission(): boolean {
  if (process.platform !== 'darwin') return true
  return systemPreferences.isTrustedAccessibilityClient(false)
}

export function canAutofillViaKeyboard(): boolean {
  return getNutJsAccessibilityStatus() === 'authorized'
}

function requestNutJsAccessibilityAccess() {
  if (process.platform !== 'darwin') return
  try {
    const permissions = require('@nut-tree-fork/node-mac-permissions') as {
      askForAccessibilityAccess: () => void
    }
    permissions.askForAccessibilityAccess()
  } catch {
    systemPreferences.isTrustedAccessibilityClient(true)
  }
}

export function openAccessibilitySettings() {
  if (process.platform !== 'darwin') return
  void shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'
  )
}

export function getAccessibilityStatus() {
  const isDev = isDesktopDevMode()
  const required = process.platform === 'darwin'
  const authStatus = getNutJsAccessibilityStatus()
  const launchHost = detectDevLaunchHostLabel()
  return {
    trusted: !required || authStatus === 'authorized',
    required,
    appName: getAccessibilityAppName(),
    isDev,
    hint: getAccessibilityHint(),
    authStatus,
    launchHost
  }
}

/** 请求辅助功能权限：打开系统设置并触发 nut.js / 系统授权入口 */
export function requestAccessibilityPermission() {
  if (process.platform !== 'darwin') {
    return { ...getAccessibilityStatus(), prompted: false as const, openedSettings: false as const }
  }

  const trustedBefore = canAutofillViaKeyboard()
  if (!trustedBefore) {
    requestNutJsAccessibilityAccess()
    openAccessibilitySettings()
  }

  return {
    ...getAccessibilityStatus(),
    prompted: !trustedBefore,
    openedSettings: !trustedBefore
  }
}

type NutModule = typeof import('@nut-tree-fork/nut-js')
let nutModule: NutModule | null = null

export function warmUpKeyboardAutomation() {
  if (process.platform !== 'darwin') return
  void loadNut().catch(() => {})
}

async function loadNut(): Promise<NutModule> {
  if (!nutModule) {
    nutModule = await import('@nut-tree-fork/nut-js')
  }
  nutModule.keyboard.config.autoDelayMs = 0
  return nutModule
}

const SHORTCUT_MODIFIERS = ['LeftAlt', 'RightAlt', 'LeftSuper', 'RightSuper'] as const

async function releaseShortcutModifiers(keyboard: NutModule['keyboard'], Key: NutModule['Key']) {
  await Promise.all(
    SHORTCUT_MODIFIERS.map((name) =>
      keyboard.releaseKey(Key[name]).catch(() => {
        /* 可能本就没按下 */
      })
    )
  )
}

/** 优先 Cmd+V 粘贴，比逐字键入快得多 */
async function pasteCodeInProcess(code: string) {
  const { keyboard, Key } = await loadNut()
  clipboard.writeText(code)
  await releaseShortcutModifiers(keyboard, Key)
  await keyboard.type(Key.LeftSuper, Key.V)
}

async function typeCodeInProcess(code: string) {
  const { keyboard } = await loadNut()
  await keyboard.type(code)
}

function scheduleClipboardRestore(previousClipboard: string) {
  if (!previousClipboard) return
  setTimeout(() => clipboard.writeText(previousClipboard), 350)
}

function fallbackToClipboard(code: string, previousClipboard: string, reason: 'permission' | 'error') {
  clipboard.writeText(code)
  const appName = getAccessibilityAppName()
  const body =
    reason === 'permission'
      ? `需要辅助功能权限（${appName}）。验证码已复制到剪贴板。`
      : `无法自动键入，验证码已复制到剪贴板。`
  notify('Nexus Tools', body)
  scheduleClipboardRestore(previousClipboard)
}

/** 将纯数字验证码键入当前焦点输入框（macOS 需辅助功能权限） */
export async function autofillTotpCode(code: string): Promise<'typed' | 'clipboard' | 'failed'> {
  if (!/^\d+$/.test(code)) {
    clipboard.writeText(code)
    return 'clipboard'
  }

  if (process.platform !== 'darwin') {
    clipboard.writeText(code)
    notify('Nexus Tools', '验证码已复制到剪贴板，请手动粘贴。')
    return 'clipboard'
  }

  const previousClipboard = clipboard.readText()

  if (!canAutofillViaKeyboard()) {
    requestNutJsAccessibilityAccess()
    fallbackToClipboard(code, previousClipboard, 'permission')
    return 'clipboard'
  }

  try {
    await pasteCodeInProcess(code)
    scheduleClipboardRestore(previousClipboard)
    return 'typed'
  } catch (pasteErr) {
    console.warn('[Nexus Tools] 粘贴填入失败，尝试逐字键入', pasteErr)
  }

  try {
    await typeCodeInProcess(code)
    scheduleClipboardRestore(previousClipboard)
    return 'typed'
  } catch (err) {
    console.warn('[Nexus Tools] TOTP 自动填入失败，回退到剪贴板', err)
    fallbackToClipboard(code, previousClipboard, 'error')
    return 'clipboard'
  }
}

export async function prepareFocusForAutofill(hideWindow: () => void) {
  hideWindow()
  await sleep(FOCUS_HANDOFF_MS)
}
