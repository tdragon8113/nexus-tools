/** 监听元素高度变化并回调（用于 Electron 搜索窗自适应高度） */
export function useElementResize(
  target: Ref<HTMLElement | null>,
  onResize: (height: number) => void,
  measureEl?: (el: HTMLElement) => number
) {
  let ro: ResizeObserver | null = null

  const measure = () => {
    const el = target.value
    if (!el) return
    const h = measureEl ? measureEl(el) : Math.max(el.offsetHeight, el.scrollHeight)
    onResize(Math.ceil(h))
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
