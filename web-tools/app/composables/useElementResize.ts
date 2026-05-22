/** 监听元素高度变化并回调（用于 Electron 搜索窗自适应高度） */
export function useElementResize(
  target: Ref<HTMLElement | null>,
  onResize: (height: number) => void
) {
  let ro: ResizeObserver | null = null

  const measure = () => {
    const el = target.value
    if (!el) return
    // offsetHeight 含 border，与 Electron 窗口可视区域对齐
    onResize(Math.ceil(el.offsetHeight))
  }

  const stopObserve = () => {
    ro?.disconnect()
    ro = null
  }

  const startObserve = (el: HTMLElement) => {
    stopObserve()
    ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
  }

  watch(
    target,
    (el) => {
      if (el) startObserve(el)
      else stopObserve()
    },
    { flush: 'post' }
  )

  onUnmounted(stopObserve)
}
