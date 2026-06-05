export interface SortableListItem {
  id: string
}

const LONG_PRESS_MS = 200
const MOVE_START_PX = 5
const BODY_DRAG_CLASS = 'nexus-sort-dragging'

interface GhostBox {
  left: number
  top: number
  width: number
  height: number
}

export function useDragSortList<T extends SortableListItem>(options: {
  enabled: Ref<boolean>
  immediate: Ref<boolean>
  items: Ref<T[]>
  containerRef: Ref<HTMLElement | null>
  layout?: Ref<'list' | 'grid'>
  canDrag?: (item: T) => boolean
  onCommitOrder: (ids: string[]) => void
}) {
  const layout = options.layout ?? ref<'list' | 'grid'>('grid')

  const isDragging = ref(false)
  const dragItemId = ref<string | null>(null)
  const dragIndex = ref(-1)
  const previewIds = ref<string[] | null>(null)
  const ghostBox = ref<GhostBox | null>(null)

  let pressTimer: ReturnType<typeof setTimeout> | null = null
  let pressItem: T | null = null
  let pressRect: DOMRect | null = null
  let pressIndex = -1
  let pressPointerId: number | null = null
  let pressStartX = 0
  let pressStartY = 0
  let grabOffsetX = 0
  let grabOffsetY = 0
  let suppressClick = false
  let dragRaf = 0

  const displayItems = computed(() => {
    const source = options.items.value ?? []
    if (!previewIds.value) return source
    const map = new Map(source.map((item) => [item.id, item]))
    return previewIds.value
      .map((id) => map.get(id))
      .filter((item): item is T => Boolean(item))
  })

  const dragItem = computed(() => {
    if (!dragItemId.value) return null
    return displayItems.value.find((item) => item.id === dragItemId.value) ?? null
  })

  function clearPressTimer() {
    if (pressTimer) {
      clearTimeout(pressTimer)
      pressTimer = null
    }
  }

  function cleanupPressListeners() {
    window.removeEventListener('pointermove', onPressMove)
    window.removeEventListener('pointerup', onPressUp)
    window.removeEventListener('pointercancel', onPressUp)
  }

  function cleanupDragListeners() {
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
    window.removeEventListener('pointercancel', onDragEnd)
    if (dragRaf) {
      cancelAnimationFrame(dragRaf)
      dragRaf = 0
    }
  }

  function getDraggedElement(): HTMLElement | null {
    const container = options.containerRef.value
    if (!container || !dragItemId.value) return null
    return container.querySelector(`[data-sort-id="${dragItemId.value}"]`)
  }

  function getSlotElements(): HTMLElement[] {
    const container = options.containerRef.value
    if (!container) return []
    return [...container.querySelectorAll('[data-sort-id]')] as HTMLElement[]
  }

  function pointInRect(x: number, y: number, rect: DOMRect): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  }

  function resolveDropIndex(clientX: number, clientY: number): number {
    const current = dragIndex.value
    if (!dragItemId.value) return current

    const draggedEl = getDraggedElement()
    if (draggedEl) {
      const draggedRect = draggedEl.getBoundingClientRect()
      if (pointInRect(clientX, clientY, draggedRect)) return current
    }

    const slots = getSlotElements()
    for (const el of slots) {
      if (el.dataset.sortId === dragItemId.value) continue
      const idx = Number(el.dataset.sortIdx)
      if (!Number.isFinite(idx)) continue
      if (pointInRect(clientX, clientY, el.getBoundingClientRect())) return idx
    }

    let closestIdx = current
    let closestDist = Infinity
    for (const el of slots) {
      if (el.dataset.sortId === dragItemId.value) continue
      const idx = Number(el.dataset.sortIdx)
      if (!Number.isFinite(idx)) continue
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist =
        layout.value === 'list'
          ? Math.abs(clientY - cy)
          : Math.hypot(clientX - cx, clientY - cy)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = idx
      }
    }

    return closestIdx
  }

  function movePreview(from: number, to: number) {
    if (!previewIds.value || from === to) return
    const ids = [...previewIds.value]
    const [id] = ids.splice(from, 1)
    if (!id) return
    ids.splice(to, 0, id)
    previewIds.value = ids
    dragIndex.value = to
  }

  function beginDrag(index: number, item: T, rect: DOMRect) {
    if (!options.enabled.value) return
    isDragging.value = true
    dragItemId.value = item.id
    dragIndex.value = index
    previewIds.value = (options.items.value ?? []).map((entry) => entry.id)
    ghostBox.value = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    }
    document.body.classList.add(BODY_DRAG_CLASS)
  }

  function startDragListeners() {
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragEnd, { once: true })
    window.addEventListener('pointercancel', onDragEnd, { once: true })
  }

  function tryStartDrag(e: PointerEvent) {
    if (isDragging.value || !pressItem || !pressRect || pressPointerId !== e.pointerId) return
    clearPressTimer()
    cleanupPressListeners()
    beginDrag(pressIndex, pressItem, pressRect)
    startDragListeners()
    applyDragMove(e)
  }

  function onPressMove(e: PointerEvent) {
    if (pressPointerId !== e.pointerId) return

    const moved = Math.hypot(e.clientX - pressStartX, e.clientY - pressStartY)

    if (options.immediate.value) {
      if (moved >= MOVE_START_PX) tryStartDrag(e)
      return
    }

    if (pressTimer && moved > MOVE_START_PX) {
      clearPressTimer()
      cleanupPressListeners()
    }
  }

  function onPressUp(e: PointerEvent) {
    if (pressPointerId !== e.pointerId) return
    clearPressTimer()
    cleanupPressListeners()
    pressItem = null
    pressRect = null
  }

  function applyDragMove(e: PointerEvent) {
    if (!isDragging.value || !ghostBox.value) return
    ghostBox.value = {
      ...ghostBox.value,
      left: e.clientX - grabOffsetX,
      top: e.clientY - grabOffsetY
    }
    const target = resolveDropIndex(e.clientX, e.clientY)
    if (target !== dragIndex.value) {
      movePreview(dragIndex.value, target)
    }
  }

  function onDragMove(e: PointerEvent) {
    if (!isDragging.value) return
    if (dragRaf) cancelAnimationFrame(dragRaf)
    dragRaf = requestAnimationFrame(() => {
      dragRaf = 0
      applyDragMove(e)
    })
  }

  function onDragEnd() {
    cleanupDragListeners()
    document.body.classList.remove(BODY_DRAG_CLASS)
    if (previewIds.value) {
      options.onCommitOrder(previewIds.value)
    }
    previewIds.value = null
    isDragging.value = false
    dragItemId.value = null
    dragIndex.value = -1
    ghostBox.value = null
    pressItem = null
    pressRect = null
    suppressClick = true
    setTimeout(() => {
      suppressClick = false
    }, 100)
  }

  function onItemPointerDown(e: PointerEvent, index: number, item: T) {
    if (!options.enabled.value || e.button !== 0) return
    if (options.canDrag && !options.canDrag(item)) return

    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    pressIndex = index
    pressItem = item
    pressRect = rect
    pressPointerId = e.pointerId
    pressStartX = e.clientX
    pressStartY = e.clientY
    grabOffsetX = e.clientX - rect.left
    grabOffsetY = e.clientY - rect.top

    clearPressTimer()
    cleanupPressListeners()

    if (options.immediate.value) {
      window.addEventListener('pointermove', onPressMove)
      window.addEventListener('pointerup', onPressUp, { once: true })
      window.addEventListener('pointercancel', onPressUp, { once: true })
      return
    }

    pressTimer = setTimeout(() => {
      pressTimer = null
      if (!pressItem || !pressRect) return
      cleanupPressListeners()
      beginDrag(pressIndex, pressItem, pressRect)
      startDragListeners()
    }, LONG_PRESS_MS)

    window.addEventListener('pointermove', onPressMove)
    window.addEventListener('pointerup', onPressUp, { once: true })
    window.addEventListener('pointercancel', onPressUp, { once: true })
  }

  function shouldIgnoreClick() {
    return suppressClick || isDragging.value
  }

  onUnmounted(() => {
    clearPressTimer()
    cleanupPressListeners()
    cleanupDragListeners()
    document.body.classList.remove(BODY_DRAG_CLASS)
  })

  return {
    isDragging,
    dragItemId,
    dragItem,
    ghostBox,
    displayItems,
    onItemPointerDown,
    shouldIgnoreClick
  }
}
