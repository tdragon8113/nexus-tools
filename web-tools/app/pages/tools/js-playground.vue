<template>
  <div class="js-playground-page desktop-tool-page flex h-full min-h-0 flex-col">
    <div
      class="relative z-30 mb-2 flex shrink-0 flex-wrap items-center gap-2 overflow-visible rounded-xl border border-slate-200/85 bg-slate-50/90 px-2 py-1.5 shadow-sm"
    >
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
        :disabled="running || !code.trim()"
        @click="runCode"
      >
        <van-icon name="play-circle-o" size="16" />
        {{ running ? '执行中…' : '运行' }}
        <span class="hidden text-[10px] font-normal opacity-80 sm:inline">⌘↵</span>
      </button>

      <div class="flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          class="js-playground-tbar-tip"
          :class="[tbarBtn, tbarDisabled]"
          data-tip="复制代码"
          aria-label="复制代码"
          :disabled="!code"
          @click="copyWithToast(code)"
        >
          <van-icon name="description" size="18" />
        </button>
        <button
          type="button"
          class="js-playground-tbar-tip"
          :class="[tbarBtn, tbarDisabled]"
          data-tip="复制输出"
          aria-label="复制输出"
          :disabled="!hasOutput"
          @click="copyOutput"
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
          type="button"
          class="js-playground-tbar-tip"
          :class="[tbarBtn, tbarDisabled]"
          data-tip="清空输出"
          aria-label="清空输出"
          :disabled="!hasOutput"
          @click="clearOutput"
        >
          <van-icon name="cross" size="18" />
        </button>
        <button
          type="button"
          class="js-playground-tbar-tip"
          :class="tbarBtnDanger"
          data-tip="清空代码"
          aria-label="清空代码"
          :disabled="!code"
          @click="clearCode"
        >
          <van-icon name="delete-o" size="18" />
        </button>
      </div>

      <span class="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:inline" aria-hidden="true" />

      <label class="flex items-center gap-1.5 text-xs text-slate-600">
        <span class="shrink-0">示例</span>
        <select
          class="max-w-[8.5rem] rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          @change="onSnippetChange"
        >
          <option value="">插入示例…</option>
          <option v-for="item in jsPlaygroundSnippets" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </select>
      </label>

      <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
        <input v-model="wordWrap" type="checkbox" class="rounded border-slate-300 text-emerald-600" />
        自动换行
      </label>

      <span class="ml-auto shrink-0 text-xs text-slate-400">
        本地执行 · 超时 5s · ⌘↵ 运行 · Ctrl+Space 补全
      </span>
    </div>

    <div class="js-playground-workspace grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(9rem,0.42fr)] gap-2">
      <section
        class="js-playground-pane flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div
          class="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-slate-50/80 px-3 py-1.5"
        >
          <span class="text-xs font-medium text-slate-500">JavaScript</span>
          <span class="text-xs tabular-nums text-slate-400">{{ code.length }} 字符</span>
        </div>
        <div class="js-playground-pane__editor min-h-0 flex-1">
          <ClientOnly>
            <TextDiffCodeMirrorPane
              ref="editorRef"
              v-model="code"
              language="javascript"
              variant="playground"
              :word-wrap="wordWrap"
              placeholder="// 临时写点 JS，点运行或按 ⌘↵"
            />
          </ClientOnly>
        </div>
      </section>

      <section
        class="js-playground-pane flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div
          class="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-slate-50/80 px-3 py-1.5"
        >
          <span class="text-xs font-medium text-slate-500">输出</span>
          <span
            v-if="lastResult"
            class="text-xs tabular-nums"
            :class="lastResult.ok ? 'text-emerald-600' : 'text-red-600'"
          >
            {{ lastResult.ok ? '成功' : '失败' }} · {{ lastResult.durationMs.toFixed(1) }} ms
          </span>
        </div>
        <div class="min-h-0 flex-1 overflow-auto bg-slate-950 px-3 py-2">
          <pre
            v-if="hasOutput"
            class="m-0 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-100"
          >{{ outputText }}</pre>
          <p v-else class="m-0 font-mono text-xs text-slate-500">console 输出与 return 值会显示在这里</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import TextDiffCodeMirrorPane from '~/components/TextDiffCodeMirrorPane.vue'
import { jsPlaygroundSnippets, useJsPlayground } from '~/composables/useJsPlayground'

useHead({ title: 'JS 运行 - Nexus Tools' })

const tbarCore =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full border-0 outline-none transition-[background-color,opacity] duration-150 focus-visible:ring-2 focus-visible:ring-offset-2'
const tbarBtn = `${tbarCore} bg-transparent text-slate-600 hover:bg-black/[0.055] active:bg-black/[0.08] focus-visible:ring-slate-300/60`
const tbarBtnDanger = `${tbarCore} bg-transparent text-red-600 hover:bg-red-500/[0.08] active:bg-red-500/[0.12] focus-visible:ring-red-300/50`
const tbarDisabled = 'disabled:opacity-40 disabled:pointer-events-none'

const {
  code,
  wordWrap,
  running,
  lastResult,
  outputText,
  hasOutput,
  runCode,
  clearCode,
  clearOutput,
  applySnippet,
  copyOutput
} = useJsPlayground()

const editorRef = ref<InstanceType<typeof TextDiffCodeMirrorPane> | null>(null)

function onSnippetChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (!value) return
  applySnippet(value)
  ;(event.target as HTMLSelectElement).value = ''
  void nextTick(() => editorRef.value?.syncDocFromModel?.())
}

function onRunShortcut(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey) || event.key !== 'Enter') return
  event.preventDefault()
  void runCode()
}

onMounted(() => {
  window.addEventListener('keydown', onRunShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onRunShortcut)
})
</script>

<style>
.js-playground-tbar-tip[data-tip] {
  position: relative;
}

.js-playground-tbar-tip[data-tip]::after {
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

.js-playground-tbar-tip[data-tip]:hover:not(:disabled)::after {
  opacity: 1;
  visibility: visible;
}

.js-playground-workspace {
  min-height: 28rem;
}

.js-playground-pane {
  display: flex;
  flex-direction: column;
}

.js-playground-pane__editor {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.js-playground-pane__editor .text-diff-cm-wrap {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
