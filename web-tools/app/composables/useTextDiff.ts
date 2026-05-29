import { showToast } from 'vant'
import { copyWithToast } from '~/composables/useCopyText'
import { alignedLineDiff, LINE_DIFF_MAX_ROWS } from '~/utils/jsonLineDiffView'
import { lineCountFor } from '~/utils/jsonTool'
import {
  buildAlignedSideText,
  extractLeftSourceFromDisplay,
  extractRightSourceFromDisplay
} from '~/utils/textDiffAlignedView'
import {
  buildTextDiffBlocks,
  buildTextDiffLineDecorations,
  buildTextDiffRangeDecorations
} from '~/utils/textDiffDecorations'
import {
  isTextDiffLanguageId,
  textDiffLanguageLabel,
  type TextDiffLanguageId
} from '~/utils/textDiffCodeMirrorLanguage'
import {
  canFormatTextDiffLanguage,
  formatActionLabel,
  formatBothActionLabel,
  formatSideActionLabel,
  formatTextDiffSource
} from '~/utils/textDiffFormat'
import {
  TEXT_DIFF_CHAR_DIFF_MAX_ROWS,
  TEXT_DIFF_DEBOUNCE_MS,
  TEXT_DIFF_SOFT_WARN_CHARS,
  TEXT_DIFF_SOFT_WARN_LINES
} from '~/utils/textDiffLimits'
import {
  compareOptionsStatusSuffix,
  defaultTextDiffCompareOptions,
  loadTextDiffCompareOptionsFromStorage,
  saveTextDiffCompareOptionsToStorage,
  type TextDiffCompareOptions
} from '~/utils/textDiffOptions'
import { buildUnifiedDiffPatch } from '~/utils/textDiffUnified'

const LANGUAGE_KEY = 'nexus-text-diff-language'
const WRAP_KEY = 'nexus-text-diff-wrap'

type DebouncedDiffInput = {
  left: string
  right: string
  options: TextDiffCompareOptions
}

export function useTextDiff() {
  const leftText = useState('text-diff-left', () => '')
  const rightText = useState('text-diff-right', () => '')
  const diffLanguage = useState<TextDiffLanguageId>('text-diff-language', () => 'plain')
  const activeDiffIndex = useState('text-diff-active-index', () => 0)
  const compareOptions = ref<TextDiffCompareOptions>(defaultTextDiffCompareOptions())
  const compareMode = ref(false)
  const wordWrap = ref(true)
  const formatting = ref(false)
  const diffComputing = ref(false)
  const diffCapped = ref(false)

  const debouncedInput = ref<DebouncedDiffInput>({
    left: leftText.value,
    right: rightText.value,
    options: defaultTextDiffCompareOptions()
  })

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function flushDebouncedDiffNow() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    debouncedInput.value = {
      left: leftText.value,
      right: rightText.value,
      options: { ...compareOptions.value }
    }
    diffComputing.value = false
  }

  function scheduleDebouncedDiff() {
    diffComputing.value = true
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      flushDebouncedDiffNow()
    }, TEXT_DIFF_DEBOUNCE_MS)
  }

  watch(diffLanguage, (value) => {
    if (!isTextDiffLanguageId(value)) diffLanguage.value = 'plain'
  })

  onMounted(() => {
    if (!import.meta.client) return
    const savedLang = localStorage.getItem(LANGUAGE_KEY)
    if (savedLang && isTextDiffLanguageId(savedLang)) diffLanguage.value = savedLang
    const savedWrap = localStorage.getItem(WRAP_KEY)
    if (savedWrap === '0') wordWrap.value = false
    if (savedWrap === '1') wordWrap.value = true
    const savedOptions = loadTextDiffCompareOptionsFromStorage()
    if (savedOptions) compareOptions.value = savedOptions
  })

  watch([leftText, rightText, compareOptions], scheduleDebouncedDiffIfComparing, { deep: true })

  function scheduleDebouncedDiffIfComparing() {
    if (!compareMode.value) return
    scheduleDebouncedDiff()
  }

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  watch(diffLanguage, (value) => {
    if (import.meta.client) localStorage.setItem(LANGUAGE_KEY, value)
  })

  watch(wordWrap, (value) => {
    if (import.meta.client) localStorage.setItem(WRAP_KEY, value ? '1' : '0')
  })

  watch(
    compareOptions,
    (value) => {
      saveTextDiffCompareOptionsToStorage(value)
    },
    { deep: true }
  )

  const canFormat = computed(() => canFormatTextDiffLanguage(diffLanguage.value))
  const formatLanguageLabel = computed(() => textDiffLanguageLabel(diffLanguage.value))
  const formatBothTip = computed(() => formatBothActionLabel(diffLanguage.value))

  function formatSideTip(side: 'left' | 'right') {
    return formatSideActionLabel(diffLanguage.value, side)
  }

  const hasInput = computed(() => Boolean(leftText.value || rightText.value))
  const canStartCompare = computed(() => hasInput.value && !formatting.value)

  const alignedRows = computed(() => {
    if (!compareMode.value) return []
    const { left, right, options } = debouncedInput.value
    let rows = alignedLineDiff(left, right, options)
    if (rows.length > LINE_DIFF_MAX_ROWS) {
      rows = rows.slice(0, LINE_DIFF_MAX_ROWS)
      diffCapped.value = true
    } else {
      diffCapped.value = false
    }
    return rows
  })

  const enableCharDiff = computed(
    () => alignedRows.value.length <= TEXT_DIFF_CHAR_DIFF_MAX_ROWS
  )

  const leftDisplayText = computed(() => buildAlignedSideText(alignedRows.value, 'left'))
  const rightDisplayText = computed(() => buildAlignedSideText(alignedRows.value, 'right'))
  const diffCount = computed(() => alignedRows.value.filter((row) => row.kind !== 'equal').length)
  const leftLineCount = computed(() => lineCountFor(leftText.value))
  const rightLineCount = computed(() => lineCountFor(rightText.value))
  const diffBlocks = computed(() => buildTextDiffBlocks(alignedRows.value))
  const leftDecorations = computed(() => buildTextDiffLineDecorations(alignedRows.value, 'left'))
  const rightDecorations = computed(() => buildTextDiffLineDecorations(alignedRows.value, 'right'))
  const leftRangeDecorations = computed(() =>
    buildTextDiffRangeDecorations(alignedRows.value, 'left', {
      enableCharDiff: enableCharDiff.value,
      compareOptions: debouncedInput.value.options
    })
  )
  const rightRangeDecorations = computed(() =>
    buildTextDiffRangeDecorations(alignedRows.value, 'right', {
      enableCharDiff: enableCharDiff.value,
      compareOptions: debouncedInput.value.options
    })
  )

  const totalCharCount = computed(() => leftText.value.length + rightText.value.length)
  const showLargeTextHint = computed(
    () =>
      alignedRows.value.length > TEXT_DIFF_SOFT_WARN_LINES ||
      totalCharCount.value > TEXT_DIFF_SOFT_WARN_CHARS
  )

  const diffStatusText = computed(() => {
    if (diffComputing.value) return '计算中…'
    const suffix = compareOptionsStatusSuffix(debouncedInput.value.options)
    if (hasInput.value && diffCount.value === 0) return `文本一致${suffix}`
    let text = `${diffCount.value} 处差异${suffix}`
    if (diffCapped.value) text += ' · 仅显示前 12000 行'
    if (!enableCharDiff.value && diffCount.value > 0) text += ' · 已关闭字符级高亮'
    if (showLargeTextHint.value && diffCount.value > 0) text += ' · 文本较大'
    return text
  })

  watch(diffBlocks, (blocks) => {
    if (blocks.length === 0) {
      activeDiffIndex.value = 0
    } else if (activeDiffIndex.value >= blocks.length) {
      activeDiffIndex.value = blocks.length - 1
    }
  })

  function setLeftDisplay(value: string) {
    leftText.value = extractLeftSourceFromDisplay(value, alignedRows.value)
  }

  function setRightDisplay(value: string) {
    rightText.value = extractRightSourceFromDisplay(value, alignedRows.value)
  }

  function swapTexts() {
    const nextLeft = rightText.value
    rightText.value = leftText.value
    leftText.value = nextLeft
  }

  function clearAll() {
    leftText.value = ''
    rightText.value = ''
    compareMode.value = false
    diffComputing.value = false
  }

  function enterCompareMode() {
    if (!canStartCompare.value) return
    compareMode.value = true
    flushDebouncedDiffNow()
    activeDiffIndex.value = 0
  }

  function exitCompareMode() {
    compareMode.value = false
    diffComputing.value = false
  }

  function refreshCompare() {
    if (!compareMode.value) return
    flushDebouncedDiffNow()
  }

  function jumpDiff(delta: number, scrollToLine: (alignedLineNo: number) => void) {
    if (diffBlocks.value.length === 0) return
    const next = Math.min(Math.max(activeDiffIndex.value + delta, 0), diffBlocks.value.length - 1)
    activeDiffIndex.value = next
    const block = diffBlocks.value[next]
    if (block) scrollToLine(block.alignedLineNo)
  }

  async function copyUnifiedDiff() {
    const patch = buildUnifiedDiffPatch({
      left: leftText.value,
      right: rightText.value,
      compareOptions: compareOptions.value
    })
    if (!patch.trim()) {
      showToast('无差异')
      return
    }
    const suffix = compareOptionsStatusSuffix(compareOptions.value)
    const message = suffix ? `已复制 Unified Diff${suffix}` : '已复制 Unified Diff'
    await copyWithToast(patch, message)
  }

  async function formatSide(side: 'left' | 'right') {
    if (!canFormat.value || formatting.value) return
    const source = side === 'left' ? leftText.value : rightText.value
    if (!source.trim()) return
    formatting.value = true
    try {
      const formatted = await formatTextDiffSource(diffLanguage.value, source)
      if (side === 'left') leftText.value = formatted
      else rightText.value = formatted
      showToast(formatActionLabel(diffLanguage.value))
    } catch (e) {
      showToast(e instanceof Error ? e.message : '格式化失败')
    } finally {
      formatting.value = false
    }
  }

  async function formatBoth() {
    if (!canFormat.value || formatting.value) return
    if (!leftText.value.trim() && !rightText.value.trim()) return
    formatting.value = true
    try {
      const tasks: Promise<void>[] = []
      if (leftText.value.trim()) {
        tasks.push(
          formatTextDiffSource(diffLanguage.value, leftText.value).then((text) => {
            leftText.value = text
          })
        )
      }
      if (rightText.value.trim()) {
        tasks.push(
          formatTextDiffSource(diffLanguage.value, rightText.value).then((text) => {
            rightText.value = text
          })
        )
      }
      await Promise.all(tasks)
      showToast(formatBothActionLabel(diffLanguage.value))
    } catch (e) {
      showToast(e instanceof Error ? e.message : '格式化失败')
    } finally {
      formatting.value = false
    }
  }

  return {
    leftText,
    rightText,
    leftDisplayText,
    rightDisplayText,
    setLeftDisplay,
    setRightDisplay,
    diffLanguage,
    compareOptions,
    compareMode,
    activeDiffIndex,
    wordWrap,
    formatting,
    diffComputing,
    diffCapped,
    enableCharDiff,
    canFormat,
    formatLanguageLabel,
    formatBothTip,
    formatSideTip,
    hasInput,
    canStartCompare,
    diffBlocks,
    diffCount,
    diffStatusText,
    leftLineCount,
    rightLineCount,
    leftDecorations,
    rightDecorations,
    leftRangeDecorations,
    rightRangeDecorations,
    swapTexts,
    clearAll,
    enterCompareMode,
    exitCompareMode,
    refreshCompare,
    formatSide,
    formatBoth,
    copyUnifiedDiff,
    jumpDiff
  }
}
