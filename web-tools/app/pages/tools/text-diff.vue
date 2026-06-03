<template>
  <div class="text-diff-tool-page desktop-tool-page flex h-full min-h-0 flex-col">
    <div
      class="nexus-toolbar flex-col gap-2"
    >
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex shrink-0 flex-wrap items-center gap-1.5">
          <button
            v-if="!compareMode"
            type="button"
            class="rounded-xl border border-indigo-600 bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40"
            :disabled="!canStartCompare"
            @click="enterCompareWithSync"
          >
            开始对比
          </button>
          <template v-else>
            <button
              type="button"
              class="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              @click="exitCompareWithSync"
            >
              返回编辑
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"
              :disabled="diffComputing"
              @click="refreshCompareWithSync"
            >
              重新对比
            </button>
          </template>
        </div>

        <span class="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:inline" aria-hidden="true" />

        <div class="flex shrink-0 flex-wrap items-center gap-0.5">
          <button
            type="button"
            class="text-diff-tbar-tip"
            :class="[tbarBtn, tbarDisabled]"
            data-tip="交换左右"
            aria-label="交换左右"
            :disabled="compareMode"
            @click="swapTexts"
          >
            <van-icon name="exchange" size="18" />
          </button>
          <button
            v-if="compareMode"
            type="button"
            class="text-diff-tbar-tip"
            :class="[tbarBtn, tbarDisabled]"
            data-tip="复制 Unified Diff"
            aria-label="复制 Unified Diff"
            :disabled="!hasInput || diffCount === 0 || diffComputing"
            @click="copyUnifiedDiff"
          >
            <svg
              class="size-[18px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M8 6h11M8 12h11M8 18h11M5 6h.01M5 12h.01M5 18h.01" />
            </svg>
          </button>
          <button
            v-if="canFormat && !compareMode"
            type="button"
            class="text-diff-tbar-tip"
            :class="[tbarBtn, tbarDisabled]"
            :data-tip="formatBothTip"
            :aria-label="formatBothTip"
            :disabled="formatting || (!leftText.trim() && !rightText.trim())"
            @click="formatBothWithSync"
          >
            <svg
              class="size-[18px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M5 7h14M5 12h8.5M5 17h14" />
            </svg>
          </button>
          <button
            type="button"
            class="text-diff-tbar-tip"
            :class="tbarBtnDanger"
            data-tip="清空"
            aria-label="清空"
            :disabled="!hasInput"
            @click="clearAllWithSync"
          >
            <van-icon name="delete-o" size="18" />
          </button>
        </div>

        <span class="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:inline" aria-hidden="true" />

        <label class="flex items-center gap-1.5 text-xs text-slate-600">
          <span class="shrink-0">语法</span>
          <select
            v-model="diffLanguage"
            class="max-w-[7.5rem] rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            :disabled="compareMode"
          >
            <option v-for="item in textDiffLanguages" :key="item.id" :value="item.id">
              {{ item.label }}
            </option>
          </select>
          <span v-if="!canFormat" class="text-[11px] text-slate-400">不可格式化</span>
        </label>

        <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
          <input v-model="wordWrap" type="checkbox" class="rounded border-slate-300 text-indigo-600" />
          自动换行
        </label>

        <template v-if="compareMode">
          <span class="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:inline" aria-hidden="true" />

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <label class="flex cursor-pointer items-center gap-1 text-xs text-slate-600">
              <input
                v-model="compareOptions.ignoreTrimWhitespace"
                type="checkbox"
                class="rounded border-slate-300 text-indigo-600"
              />
              忽略行尾空白
            </label>
            <label class="flex cursor-pointer items-center gap-1 text-xs text-slate-600">
              <input
                v-model="compareOptions.ignoreWhitespace"
                type="checkbox"
                class="rounded border-slate-300 text-indigo-600"
              />
              忽略空白
            </label>
            <label class="flex cursor-pointer items-center gap-1 text-xs text-slate-600">
              <input
                v-model="compareOptions.ignoreCase"
                type="checkbox"
                class="rounded border-slate-300 text-indigo-600"
              />
              忽略大小写
            </label>
            <label class="flex cursor-pointer items-center gap-1 text-xs text-slate-600">
              <input
                v-model="compareOptions.ignoreEmptyLines"
                type="checkbox"
                class="rounded border-slate-300 text-indigo-600"
              />
              忽略空行
            </label>
          </div>
        </template>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <template v-if="compareMode">
          <div class="flex items-center gap-0.5">
            <button
              type="button"
              class="text-diff-tbar-tip"
              :class="[tbarBtn, tbarDisabled]"
              data-tip="上一处差异"
              aria-label="上一处差异"
              :disabled="diffBlocks.length === 0 || activeDiffIndex <= 0 || diffComputing"
              @click="jumpDiff(-1, scrollToDiffLine)"
            >
              <van-icon name="arrow-left" size="18" />
            </button>
            <button
              type="button"
              class="text-diff-tbar-tip"
              :class="[tbarBtn, tbarDisabled]"
              data-tip="下一处差异"
              aria-label="下一处差异"
              :disabled="diffBlocks.length === 0 || activeDiffIndex >= diffBlocks.length - 1 || diffComputing"
              @click="jumpDiff(1, scrollToDiffLine)"
            >
              <van-icon name="arrow" size="18" />
            </button>
          </div>

          <span v-if="diffBlocks.length > 0" class="text-xs tabular-nums text-slate-500">
            {{ activeDiffIndex + 1 }} / {{ diffBlocks.length }}
          </span>

          <span
            class="text-xs tabular-nums"
            :class="hasInput && diffCount === 0 ? 'font-medium text-emerald-700' : 'text-slate-500'"
          >
            {{ diffStatusText }}
          </span>

          <span v-if="diffComputing" class="text-xs text-slate-400">对比更新中…</span>
        </template>

        <span v-else class="text-xs text-slate-500">编辑模式 · 输入完成后点击「开始对比」</span>

        <span v-if="formatting" class="text-xs text-slate-400">格式化中…</span>

        <span class="ml-auto shrink-0 text-xs tabular-nums text-slate-400">
          左 {{ leftLineCount }} 行 · 右 {{ rightLineCount }} 行
        </span>
      </div>
    </div>

    <div
      class="text-diff-workspace doc-surface grid min-h-[28rem] flex-1 grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <section class="text-diff-pane flex min-h-0 min-w-0 flex-col border-r border-slate-200">
        <div
          class="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-slate-50/80 px-3 py-1.5"
        >
          <span class="text-xs font-medium text-slate-500">
            原始
            <span v-if="compareMode" class="font-normal text-slate-400">（只读）</span>
          </span>
          <div class="flex items-center gap-0.5">
            <TextDiffPaneActions
              :has-text="Boolean(leftText)"
              :can-format="canFormat && !compareMode"
              :format-tip="formatSideTip('left')"
              :format-disabled="formatting || !leftText.trim()"
              @copy="copyWithToast(leftText)"
              @format="formatSideWithSync('left')"
            />
            <span class="ml-1 text-xs tabular-nums text-slate-400">{{ leftText.length }} 字符</span>
          </div>
        </div>
        <div class="text-diff-pane__editor min-h-0 flex-1">
          <ClientOnly>
            <TextDiffCodeMirrorPane
              :key="compareMode ? 'compare-left' : 'edit-left'"
              ref="leftPaneRef"
              :model-value="compareMode ? leftDisplayText : leftText"
              :language="diffLanguage"
              :variant="compareMode ? 'diff' : 'plain'"
              :readonly="compareMode"
              :word-wrap="wordWrap"
              :decorations="compareMode ? leftDecorations : []"
              :range-decorations="compareMode ? leftRangeDecorations : []"
              placeholder="粘贴或输入原始文本…"
              @update:model-value="leftText = $event"
              @scroll="syncRightScroll"
            />
          </ClientOnly>
        </div>
      </section>

      <section class="text-diff-pane flex min-h-0 min-w-0 flex-col">
        <div
          class="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-slate-50/80 px-3 py-1.5"
        >
          <span class="text-xs font-medium text-slate-500">
            对比
            <span v-if="compareMode" class="font-normal text-slate-400">（只读）</span>
          </span>
          <div class="flex items-center gap-0.5">
            <TextDiffPaneActions
              :has-text="Boolean(rightText)"
              :can-format="canFormat && !compareMode"
              :format-tip="formatSideTip('right')"
              :format-disabled="formatting || !rightText.trim()"
              @copy="copyWithToast(rightText)"
              @format="formatSideWithSync('right')"
            />
            <span class="ml-1 text-xs tabular-nums text-slate-400">{{ rightText.length }} 字符</span>
          </div>
        </div>
        <div class="text-diff-pane__editor min-h-0 flex-1">
          <ClientOnly>
            <TextDiffCodeMirrorPane
              :key="compareMode ? 'compare-right' : 'edit-right'"
              ref="rightPaneRef"
              :model-value="compareMode ? rightDisplayText : rightText"
              :language="diffLanguage"
              :variant="compareMode ? 'diff' : 'plain'"
              :readonly="compareMode"
              :word-wrap="wordWrap"
              :decorations="compareMode ? rightDecorations : []"
              :range-decorations="compareMode ? rightRangeDecorations : []"
              placeholder="粘贴或输入对比文本…"
              @update:model-value="rightText = $event"
              @scroll="syncLeftScroll"
            />
          </ClientOnly>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { textDiffLanguages } from '~/utils/textDiffCodeMirrorLanguage'
import TextDiffCodeMirrorPane from '~/components/TextDiffCodeMirrorPane.vue'

useHead({ title: '文本对比 - Nexus Tools' })

const tbarCore =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full border-0 outline-none transition-[background-color,opacity] duration-150 focus-visible:ring-2 focus-visible:ring-offset-2'
const tbarBtn = `${tbarCore} bg-transparent text-slate-600 hover:bg-black/[0.055] active:bg-black/[0.08] focus-visible:ring-slate-300/60`
const tbarBtnDanger = `${tbarCore} bg-transparent text-red-600 hover:bg-red-500/[0.08] active:bg-red-500/[0.12] focus-visible:ring-red-300/50`
const tbarDisabled = 'disabled:opacity-40 disabled:pointer-events-none'
const {
  leftText,
  rightText,
  leftDisplayText,
  rightDisplayText,
  diffLanguage,
  compareOptions,
  compareMode,
  activeDiffIndex,
  wordWrap,
  formatting,
  diffComputing,
  canFormat,
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
} = useTextDiff()

const leftPaneRef = ref<InstanceType<typeof TextDiffCodeMirrorPane> | null>(null)
const rightPaneRef = ref<InstanceType<typeof TextDiffCodeMirrorPane> | null>(null)

function scrollToDiffLine(alignedLineNo: number) {
  leftPaneRef.value?.scrollToLine(alignedLineNo)
  rightPaneRef.value?.scrollToLine(alignedLineNo)
}

function syncPanes() {
  void nextTick(() => {
    for (const pane of [leftPaneRef.value, rightPaneRef.value]) {
      pane?.syncDocFromModel?.()
      requestAnimationFrame(() => pane?.syncDocFromModel?.())
    }
  })
}

function syncPaneAfterFormat(side?: 'left' | 'right') {
  void nextTick(() => {
    const panes =
      side === 'left'
        ? [leftPaneRef.value]
        : side === 'right'
          ? [rightPaneRef.value]
          : [leftPaneRef.value, rightPaneRef.value]
    for (const pane of panes) {
      pane?.syncDocFromModel?.()
      requestAnimationFrame(() => pane?.syncDocFromModel?.())
    }
  })
}

function enterCompareWithSync() {
  enterCompareMode()
  syncPanes()
}

function exitCompareWithSync() {
  exitCompareMode()
  syncPanes()
}

function refreshCompareWithSync() {
  refreshCompare()
  syncPanes()
}

function clearAllWithSync() {
  clearAll()
  syncPanes()
}

async function formatSideWithSync(side: 'left' | 'right') {
  await formatSide(side)
  syncPaneAfterFormat(side)
}

async function formatBothWithSync() {
  await formatBoth()
  syncPaneAfterFormat()
}

function syncRightScroll(top: number) {
  rightPaneRef.value?.setScrollTop(top)
}

function syncLeftScroll(top: number) {
  leftPaneRef.value?.setScrollTop(top)
}

useConsumeToolPrefill(
  'text-diff',
  withCodeMirrorPrefillSync((raw) => {
    leftText.value = raw
  }, leftPaneRef)
)
</script>

<style>
.text-diff-tbar-tip[data-tip] {
  position: relative;
}

.text-diff-tbar-tip[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  z-index: 200;
  transform: translateX(-50%);
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  color: rgb(51 65 85);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgb(15 23 42 / 0.08);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.14s ease, visibility 0.14s ease;
}

.text-diff-tbar-tip[data-tip]:hover:not(:disabled)::after {
  opacity: 1;
  visibility: visible;
}

.text-diff-workspace {
  display: grid;
  min-height: 0;
  height: 100%;
}

.text-diff-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.text-diff-pane__editor {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.text-diff-pane__editor .text-diff-cm-wrap {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
