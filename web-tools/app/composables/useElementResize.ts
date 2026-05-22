/** 监听元素高度变化并回调（用于 Electron 搜索窗自适应高度） */
export function useElementResize(
  target: Ref<HTMLElement | null>,
  onResize: (height: number) => void
) {
  let ro: ResizeObserver | null = null

  const measure = () => {
    if (target.value) {
      onResize(Math.ceil(target.value.getBoundingClientRect().height))
    }
  }

  onMounted(() => {
    ro = new ResizeObserver(measure)
    if (target.value) ro.observe(target.value)
    nextTick(measure)
  })

  onUnmounted(() => ro?.disconnect())
}
