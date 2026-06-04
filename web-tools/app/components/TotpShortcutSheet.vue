<script setup lang="ts">
import { showToast } from 'vant'
import {
  formatAcceleratorLabel,
  keyboardEventToAccelerator,
  totpShortcutErrorMessage
} from '~/core/totpShortcut'

const props = defineProps<{
  open: boolean
  accountId: string
  accountTitle: string
  currentShortcut?: string
}>()

const emit = defineEmits<{
  close: []
  saved: [accelerator: string | null]
}>()

const { setShortcut } = useTotpDesktopAutofill()
const { trusted, required, refresh } = useTotpAccessibility()
const { goSettings } = useDesktop()

const capturing = ref(false)
const draftAccelerator = ref('')

watch(
  () => props.open,
  (visible) => {
    if (!visible) {
      capturing.value = false
      draftAccelerator.value = ''
      return
    }
    draftAccelerator.value = props.currentShortcut ?? ''
    capturing.value = true
    void refresh()
  }
)

async function openSettingsForAuth() {
  emit('close')
  await goSettings()
}

function onKeydown(event: KeyboardEvent) {
  if (!capturing.value) return
  event.preventDefault()
  event.stopPropagation()

  if (event.key === 'Escape') {
    emit('close')
    return
  }

  if (event.key === 'Backspace' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    void clearShortcut()
    return
  }

  const accelerator = keyboardEventToAccelerator(event)
  if (!accelerator) return
  void saveShortcut(accelerator)
}

async function saveShortcut(accelerator: string) {
  draftAccelerator.value = accelerator
  const result = await setShortcut(props.accountId, accelerator)
  if (!result.ok) {
    showToast(totpShortcutErrorMessage(result.error))
    return
  }
  showToast(`已设置快捷键 ${formatAcceleratorLabel(accelerator)}`)
  emit('saved', accelerator)
  emit('close')
}

async function clearShortcut() {
  const result = await setShortcut(props.accountId, null)
  if (!result.ok) {
    showToast(totpShortcutErrorMessage(result.error))
    return
  }
  draftAccelerator.value = ''
  showToast('已清除快捷键')
  emit('saved', null)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/35 p-4 sm:items-center"
      @mousedown.self="emit('close')"
    >
      <div
        class="totp-shortcut-sheet w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-900">设置自动填入快捷键</p>
            <p class="mt-1 truncate text-xs text-slate-500">{{ accountTitle }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭"
            @click="emit('close')"
          >
            <van-icon name="cross" size="16" />
          </button>
        </div>

        <div
          v-if="required && !trusted"
          class="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900"
        >
          请先在
          <button type="button" class="font-medium text-indigo-700 hover:underline" @click="openSettingsForAuth">
            设置 → 辅助功能
          </button>
          中完成授权。
        </div>

        <div
          class="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-6 text-center"
          :class="capturing ? 'ring-2 ring-indigo-500/20' : ''"
        >
          <p class="text-xs text-slate-500">按下组合键</p>
          <p class="mt-2 font-mono text-2xl font-semibold tracking-wide text-slate-900">
            {{
              draftAccelerator
                ? formatAcceleratorLabel(draftAccelerator)
                : currentShortcut
                  ? formatAcceleratorLabel(currentShortcut)
                  : '未设置'
            }}
          </p>
          <p class="mt-3 text-xs leading-relaxed text-slate-500">
            在任意输入框聚焦时按下快捷键，会自动键入当前验证码（类似 Raycast）。
            <span class="text-slate-400">Esc 取消 · Backspace 清除</span>
          </p>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <button
            v-if="currentShortcut || draftAccelerator"
            type="button"
            class="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            @click="clearShortcut"
          >
            清除快捷键
          </button>
          <button
            type="button"
            class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            @click="emit('close')"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
