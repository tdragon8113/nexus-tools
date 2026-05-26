import type { Ref } from 'vue'
import {
  clearLastSearchTransferText,
  clearPendingToolOpenPrefill,
  clearRouterToolPrefill,
  readRouterToolPrefill,
  takePendingToolOpenPrefill,
  useToolContentPrefill
} from '~/core/prefill'

/**
 * 工具页挂载时消费预填；并监听 map（SPA 再次进入同一工具页时 onMounted 不会重跑）。
 */
export function useConsumeToolPrefill(
  toolId: string,
  apply: (text: string) => void,
  options?: { consumeOnMount?: boolean }
) {
  const { consume, map } = useToolContentPrefill()

  function drain(): boolean {
    if (!import.meta.client) return false

    const fromMap = consume(toolId)
    if (fromMap) {
      apply(fromMap)
      clearRouterToolPrefill()
      clearLastSearchTransferText()
      clearPendingToolOpenPrefill(toolId)
      return true
    }

    const fromRouter = readRouterToolPrefill(toolId)
    if (fromRouter) {
      apply(fromRouter)
      clearRouterToolPrefill()
      clearLastSearchTransferText()
      clearPendingToolOpenPrefill(toolId)
      return true
    }

    const fromPending = takePendingToolOpenPrefill(toolId)
    if (fromPending) {
      apply(fromPending)
      clearRouterToolPrefill()
      clearLastSearchTransferText()
      return true
    }

    return false
  }

  function scheduleDrain() {
    if (drain()) return
    void nextTick(() => {
      if (drain()) return
      requestAnimationFrame(() => {
        drain()
      })
    })
  }

  if (options?.consumeOnMount !== false) {
    onMounted(scheduleDrain)
  }

  if (import.meta.client) {
    watch(
      () => map.value[toolId],
      (v) => {
        if (v) scheduleDrain()
      },
      { immediate: true }
    )
  }

  return { drain, scheduleDrain }
}

/** CodeMirror 工具页：写入 model 后同步文档 */
export function withCodeMirrorPrefillSync(
  setValue: (text: string) => void,
  editorRef: Ref<{ syncDocFromModel?: () => void } | null | undefined>
): (text: string) => void {
  return (text: string) => {
    setValue(text)
    void nextTick(() => {
      editorRef.value?.syncDocFromModel?.()
      requestAnimationFrame(() => editorRef.value?.syncDocFromModel?.())
    })
  }
}

/** @deprecated 使用 {@link applyPrefillForTool} */
export function prefillToolFromSearch(toolId: string, raw: string) {
  applyPrefillForTool(toolId, raw)
}
