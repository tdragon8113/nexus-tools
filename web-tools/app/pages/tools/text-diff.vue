<template>
  <div class="desktop-tool-page flex h-full min-h-0 flex-col">
<div class="mb-3 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/85 bg-slate-50/90 px-1.5 py-1 shadow-sm">
      <label class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-slate-600">
        <span class="shrink-0 text-xs font-medium text-slate-500">语言</span>
        <select
          v-model="diffLanguage"
          class="max-w-[8.5rem] rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-200/80"
        >
          <option v-for="item in textDiffLanguages" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </select>
      </label>
      <span class="h-5 w-px bg-slate-200" aria-hidden="true" />
      <button type="button" class="text-diff-tool-btn" @click="swapTexts">
        <van-icon name="exchange" size="18" />
        <span>交换</span>
      </button>
      <button type="button" class="text-diff-tool-btn" :disabled="!leftText" @click="copyWithToast(leftText)">
        <van-icon name="notes-o" size="18" />
        <span>复制左侧</span>
      </button>
      <button type="button" class="text-diff-tool-btn" :disabled="!rightText" @click="copyWithToast(rightText)">
        <van-icon name="description" size="18" />
        <span>复制右侧</span>
      </button>
      <button type="button" class="text-diff-tool-btn text-red-600 hover:bg-red-50" @click="clearAll">
        <van-icon name="delete-o" size="18" />
        <span>清空</span>
      </button>
      <span class="h-5 w-px bg-slate-200" aria-hidden="true" />
      <button
        type="button"
        class="text-diff-tool-btn"
        :disabled="!canFormat || formatting || !leftText.trim()"
        title="按当前语言格式化左侧"
        @click="formatSide('left')"
      >
        <van-icon name="orders-o" size="18" />
        <span>{{ formatting ? '格式化中…' : '格式化左' }}</span>
      </button>
      <button
        type="button"
        class="text-diff-tool-btn"
        :disabled="!canFormat || formatting || !rightText.trim()"
        title="按当前语言格式化右侧"
        @click="formatSide('right')"
      >
        <van-icon name="orders-o" size="18" />
        <span>格式化右</span>
      </button>
      <button
        type="button"
        class="text-diff-tool-btn"
        :disabled="!canFormat || formatting || (!leftText.trim() && !rightText.trim())"
        title="按当前语言格式化两侧"
        @click="formatBoth"
      >
        <van-icon name="completed" size="18" />
        <span>格式化全部</span>
      </button>
      <span class="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
      <button
        type="button"
        class="text-diff-tool-btn"
        :disabled="diffBlocks.length === 0 || activeDiffIndex <= 0"
        aria-label="上一处差异"
        title="上一处差异"
        @click="jumpDiff(-1)"
      >
        <van-icon name="arrow-left" size="18" />
      </button>
      <button
        type="button"
        class="text-diff-tool-btn"
        :disabled="diffBlocks.length === 0 || activeDiffIndex >= diffBlocks.length - 1"
        aria-label="下一处差异"
        title="下一处差异"
        @click="jumpDiff(1)"
      >
        <van-icon name="arrow" size="18" />
      </button>
      <span v-if="diffBlocks.length > 0" class="px-2 text-xs text-slate-500 tabular-nums">
        {{ activeDiffIndex + 1 }} / {{ diffBlocks.length }}
      </span>
      <div class="ml-auto flex items-center gap-3 px-2 text-xs text-slate-500 tabular-nums">
        <span v-if="hasInput && diffCount === 0" class="font-medium text-emerald-700">文本一致</span>
        <span v-else>{{ diffCount }} 处差异</span>
        <span>左 {{ leftLineCount }} 行</span>
        <span>右 {{ rightLineCount }} 行</span>
      </div>
    </div>

    <div class="grid min-h-0 grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <section class="min-w-0 border-r border-slate-200">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">左侧文本</span>
          <span class="text-xs text-slate-400 tabular-nums">{{ leftText.length }} 字符</span>
        </div>
        <ClientOnly>
          <TextDiffCodeMirrorPane
            ref="leftPaneRef"
            v-model="leftText"
            :language="diffLanguage"
            class="h-[calc(100vh-15rem)] min-h-[34rem]"
            :decorations="leftDecorations"
            :range-decorations="leftRangeDecorations"
            @scroll="syncRightScroll"
          />
        </ClientOnly>
      </section>

      <section class="min-w-0">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">右侧文本</span>
          <span class="text-xs text-slate-400 tabular-nums">{{ rightText.length }} 字符</span>
        </div>
        <ClientOnly>
          <TextDiffCodeMirrorPane
            ref="rightPaneRef"
            v-model="rightText"
            :language="diffLanguage"
            class="h-[calc(100vh-15rem)] min-h-[34rem]"
            :decorations="rightDecorations"
            :range-decorations="rightRangeDecorations"
            @scroll="syncLeftScroll"
          />
        </ClientOnly>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { diffChars } from 'diff'
import { alignedLineDiff, buildLineDiffViewRows, type AlignedLineRow, type LineDiffViewRow } from '~/utils/jsonLineDiffView'
import { lineCountFor } from '~/utils/jsonTool'
import { showToast } from 'vant'
import {
  isTextDiffLanguageId,
  textDiffLanguages,
  type TextDiffLanguageId
} from '~/utils/textDiffCodeMirrorLanguage'
import { canFormatTextDiffLanguage, formatTextDiffSource } from '~/utils/textDiffFormat'
import type { TextDiffLineDecoration, TextDiffRangeDecoration } from '~/components/TextDiffCodeMirrorPane.vue'

useHead({ title: '文本对比 - Nexus Tools' })

const leftText = useState('text-diff-left', () => '')
const rightText = useState('text-diff-right', () => '')
const diffLanguage = useState<TextDiffLanguageId>('text-diff-language', () => 'plain')

watch(diffLanguage, (value) => {
  if (!isTextDiffLanguageId(value)) diffLanguage.value = 'plain'
})

const formatting = ref(false)
const canFormat = computed(() => canFormatTextDiffLanguage(diffLanguage.value))

const leftPaneRef = ref<InstanceType<typeof TextDiffCodeMirrorPane> | null>(null)
const rightPaneRef = ref<InstanceType<typeof TextDiffCodeMirrorPane> | null>(null)

const hasInput = computed(() => Boolean(leftText.value || rightText.value))
const alignedRows = computed(() => alignedLineDiff(leftText.value, rightText.value))
const diffRows = computed(() => buildLineDiffViewRows(leftText.value, rightText.value).rows)
const diffCount = computed(() => diffRows.value.filter((row) => row.kind !== 'equal').length)
const leftLineCount = computed(() => lineCountFor(leftText.value))
const rightLineCount = computed(() => lineCountFor(rightText.value))
const activeDiffIndex = useState('text-diff-active-index', () => 0)

interface DiffBlock {
  leftLineNo: number | null
  rightLineNo: number | null
}

const diffBlocks = computed<DiffBlock[]>(() => {
  const blocks: DiffBlock[] = []
  let current: DiffBlock | null = null
  let previousChanged = false

  for (const row of diffRows.value) {
    if (row.kind === 'equal') {
      current = null
      previousChanged = false
      continue
    }

    if (!current || !previousChanged) {
      current = { leftLineNo: row.leftLineNo, rightLineNo: row.rightLineNo }
      blocks.push(current)
    } else {
      current.leftLineNo ??= row.leftLineNo
      current.rightLineNo ??= row.rightLineNo
    }
    previousChanged = true
  }

  return blocks
})

watch(diffBlocks, (blocks) => {
  if (blocks.length === 0) {
    activeDiffIndex.value = 0
  } else if (activeDiffIndex.value >= blocks.length) {
    activeDiffIndex.value = blocks.length - 1
  }
})

function buildDecorations(rows: LineDiffViewRow[], side: 'left' | 'right'): TextDiffLineDecoration[] {
  const seen = new Set<number>()
  const decorations: TextDiffLineDecoration[] = []

  for (const row of rows) {
    if (row.kind === 'equal') continue
    const line = side === 'left' ? row.leftLineNo : row.rightLineNo
    if (line == null || seen.has(line)) continue
    seen.add(line)

    if (row.kind === 'delete' && side === 'left') {
      decorations.push({ line, className: 'text-diff-line-del' })
    } else if (row.kind === 'insert' && side === 'right') {
      decorations.push({ line, className: 'text-diff-line-add' })
    } else if (row.kind === 'change') {
      decorations.push({
        line,
        className: side === 'left' ? 'text-diff-line-change-left' : 'text-diff-line-change-right'
      })
    }
  }

  return decorations
}

const leftDecorations = computed(() => buildDecorations(diffRows.value, 'left'))
const rightDecorations = computed(() => buildDecorations(diffRows.value, 'right'))

function buildRangeDecorations(rows: AlignedLineRow[], side: 'left' | 'right'): TextDiffRangeDecoration[] {
  const ranges: TextDiffRangeDecoration[] = []
  let leftLine = 1
  let rightLine = 1

  for (const row of rows) {
    if (row.kind === 'equal') {
      leftLine++
      rightLine++
      continue
    }

    if (row.kind === 'delete') {
      if (side === 'left' && row.left.length > 0) {
        ranges.push({
          line: leftLine,
          fromCh: 0,
          toCh: row.left.length,
          className: 'text-diff-char-del'
        })
      }
      leftLine++
      continue
    }

    if (row.kind === 'insert') {
      if (side === 'right' && row.right.length > 0) {
        ranges.push({
          line: rightLine,
          fromCh: 0,
          toCh: row.right.length,
          className: 'text-diff-char-add'
        })
      }
      rightLine++
      continue
    }

    let leftCh = 0
    let rightCh = 0
    for (const part of diffChars(row.left, row.right)) {
      const len = part.value.length
      if (part.removed) {
        if (side === 'left' && len > 0) {
          ranges.push({
            line: leftLine,
            fromCh: leftCh,
            toCh: leftCh + len,
            className: 'text-diff-char-del'
          })
        }
        leftCh += len
      } else if (part.added) {
        if (side === 'right' && len > 0) {
          ranges.push({
            line: rightLine,
            fromCh: rightCh,
            toCh: rightCh + len,
            className: 'text-diff-char-add'
          })
        }
        rightCh += len
      } else {
        leftCh += len
        rightCh += len
      }
    }
    leftLine++
    rightLine++
  }

  return ranges
}

const leftRangeDecorations = computed(() => buildRangeDecorations(alignedRows.value, 'left'))
const rightRangeDecorations = computed(() => buildRangeDecorations(alignedRows.value, 'right'))

function scrollToDiff(index: number) {
  const block = diffBlocks.value[index]
  if (!block) return
  if (block.leftLineNo != null) leftPaneRef.value?.scrollToLine(block.leftLineNo)
  if (block.rightLineNo != null) rightPaneRef.value?.scrollToLine(block.rightLineNo)
}

function jumpDiff(delta: number) {
  if (diffBlocks.value.length === 0) return
  const next = Math.min(Math.max(activeDiffIndex.value + delta, 0), diffBlocks.value.length - 1)
  activeDiffIndex.value = next
  scrollToDiff(next)
}

function syncRightScroll(top: number) {
  rightPaneRef.value?.setScrollTop(top)
}

function syncLeftScroll(top: number) {
  leftPaneRef.value?.setScrollTop(top)
}

function swapTexts() {
  const nextLeft = rightText.value
  rightText.value = leftText.value
  leftText.value = nextLeft
}

function clearAll() {
  leftText.value = ''
  rightText.value = ''
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
    showToast('已格式化')
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
    showToast('已格式化')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '格式化失败')
  } finally {
    formatting.value = false
  }
}
</script>

<style>
.text-diff-tool-btn {
  display: inline-flex;
  height: 2rem;
  align-items: center;
  gap: 0.35rem;
  border-radius: 0.5rem;
  padding: 0 0.6rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  transition: background-color 0.14s ease, color 0.14s ease;
}

.text-diff-tool-btn:hover:not(:disabled) {
  background: rgb(241 245 249);
  color: rgb(15 23 42);
}

.text-diff-tool-btn:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}
</style>
