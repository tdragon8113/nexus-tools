<template>
  <div
    class="group json-cm-wrap relative flex min-h-0 min-w-0 flex-col overflow-hidden"
    :class="[
      tone === 'output' ? 'bg-slate-50/50' : 'bg-[var(--doc-code-bg)]',
      fillHeight ? 'json-cm-wrap--fill h-full min-h-[20rem]' : 'h-full min-h-0 flex-1'
    ]"
  >
    <p
      v-if="placeholder && showPlaceholder"
      class="json-cm-ph pointer-events-none absolute top-3 z-[1] max-w-[calc(100%-4.5rem)] truncate text-sm font-mono text-slate-400 group-focus-within:hidden"
      :style="{ left: 'var(--json-cm-ph-left)' }"
    >
      {{ placeholder }}
    </p>
    <div ref="hostRef" class="json-cm-host min-h-0 w-full flex-1" />
  </div>
</template>

<script setup lang="ts">
import { json } from '@codemirror/lang-json'
import { indentWithTab } from '@codemirror/commands'
import { indentUnit as cmIndentUnit } from '@codemirror/language'
import { Annotation, Compartment, EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { jsonLiveLintExtension } from '~/utils/jsonCodeMirrorLint'
import { jsonIndentLayerExtension } from '~/utils/jsonCodeMirrorNesting'
import { jsonCodeMirrorBasicSetup } from '~/utils/jsonCodeMirrorSetup'
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

function afterLayout(fn: () => void) {
  void nextTick(() => {
    requestAnimationFrame(fn)
  })
}

/** `indentWithTab` 在新版 @codemirror/commands 中是 KeyBinding，须包成 keymap 扩展 */
const tabIndentKeymap = keymap.of([indentWithTab])

const props = withDefaults(
  defineProps<{
    modelValue: string
    readOnly?: boolean
    placeholder?: string
    tabSize?: number
    /** Tab / 自动缩进时插入的一段缩进，与 JSON 工具「缩进」选项一致（空格或 \\t） */
    singleIndent?: string
    /** output 与主输入区背景、行号栏略有区分 */
    tone?: 'input' | 'output'
    /** 桌面工具页：按父容器高度铺满，不依赖内容撑开 */
    fillHeight?: boolean
  }>(),
  {
    readOnly: false,
    placeholder: '',
    tabSize: 2,
    singleIndent: '  ',
    tone: 'input',
    fillHeight: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [v: string]
  paste: [v: string]
}>()

const hostRef = ref<HTMLElement | null>(null)
const viewRef = shallowRef<EditorView | null>(null)

const External = Annotation.define<boolean>()

const readOnlyComp = new Compartment()
const tabSizeComp = new Compartment()
const indentUnitComp = new Compartment()
const tabIndentComp = new Compartment()

const showPlaceholder = computed(() => !props.modelValue.trim())

function syncDocFromModel() {
  const view = viewRef.value
  if (!view) return
  const v = props.modelValue
  if (v === view.state.doc.toString()) return
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: v },
    annotations: External.of(true)
  })
}

watch(() => props.modelValue, syncDocFromModel, { flush: 'post' })

watch(
  () => props.readOnly,
  (ro) => {
    const view = viewRef.value
    if (!view) return
    view.dispatch({
      effects: [
        readOnlyComp.reconfigure(EditorState.readOnly.of(ro)),
        tabIndentComp.reconfigure(ro ? [] : tabIndentKeymap)
      ]
    })
  }
)

watch(
  () => props.tabSize,
  (n) => {
    viewRef.value?.dispatch({
      effects: tabSizeComp.reconfigure(EditorState.tabSize.of(Math.max(1, n)))
    })
  }
)

watch(
  () => props.singleIndent,
  (u) => {
    viewRef.value?.dispatch({
      effects: indentUnitComp.reconfigure(cmIndentUnit.of(u))
    })
  }
)

function buildExtensions(): Extension[] {
  const isInput = props.tone === 'input'
  const scrollerBg = isInput ? 'var(--doc-code-bg)' : 'rgb(248 250 252 / 0.5)'
  const gutterBg = isInput ? 'rgb(241 245 249 / 0.85)' : 'rgb(248 250 252 / 0.95)'
  const lineNoColor = 'rgb(148 163 184)'
  const foldIdle = 'rgb(100 116 139)'
  const foldHover = 'rgb(71 85 105)'

  return [
    ...jsonCodeMirrorBasicSetup,
    json(),
    tabSizeComp.of(EditorState.tabSize.of(Math.max(1, props.tabSize))),
    indentUnitComp.of(cmIndentUnit.of(props.singleIndent)),
    tabIndentComp.of(props.readOnly ? [] : tabIndentKeymap),
    readOnlyComp.of(EditorState.readOnly.of(props.readOnly)),
    jsonLiveLintExtension(280),
    jsonIndentLayerExtension(),
    EditorView.theme({
      '&': {
        height: '100%',
        minHeight: 0,
        flex: '1 1 auto',
        fontSize: '14px',
        backgroundColor: 'transparent'
      },
      '.cm-scroller': {
        flex: '1 1 auto',
        minHeight: 0,
        overflowX: 'auto',
        overflowY: 'auto',
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        backgroundColor: scrollerBg
      },
      '.cm-content': { padding: '12px 0' },
      '.cm-gutters': {
        backgroundColor: gutterBg,
        borderRight: '1px solid rgb(226 232 240)',
        paddingLeft: '0',
        color: lineNoColor
      },
      '.cm-lineNumbers': {
        color: lineNoColor,
        minWidth: '0'
      },
      '.cm-activeLine': {
        backgroundColor: isInput ? 'rgb(248 250 252 / 0.55)' : 'rgb(248 250 252 / 0.35)'
      },
      '.cm-activeLineGutter': {
        backgroundColor: isInput ? 'rgb(241 245 249 / 0.45)' : 'rgb(248 250 252 / 0.5)'
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgb(191 219 254 / 0.38)'
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: 'rgb(191 219 254 / 0.48)'
      },
      '.cm-lineNumbers .cm-gutterElement': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 2px',
        minWidth: '0',
        fontSize: '12px',
        textAlign: 'right',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box'
      },
      '.cm-foldGutter': {
        width: '1.125rem',
        minWidth: '1.125rem',
        maxWidth: '1.125rem',
        flexShrink: '0'
      },
      '.cm-foldGutter .cm-gutterElement': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1px',
        boxSizing: 'border-box',
        cursor: 'pointer',
        borderRadius: '2px'
      },
      '.cm-foldGutter .cm-gutterElement:hover .json-cm-fold-marker': {
        color: foldHover
      },
      '.cm-foldGutter .json-cm-fold-marker': {
        boxSizing: 'border-box',
        width: '0.875rem',
        minWidth: '0.875rem',
        maxWidth: '0.875rem',
        height: '0.875rem',
        flexShrink: '0',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: foldIdle,
        transition: 'color 0.12s ease'
      },
      '.cm-foldGutter .json-cm-fold-marker svg': {
        display: 'block',
        width: '0.75rem',
        height: '0.75rem',
        flexShrink: '0'
      },
      '&.cm-focused': { outline: 'none' },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'rgb(30 41 59)'
      },
      '.cm-matchingBracket': {
        backgroundColor: 'rgb(191 219 254 / 0.45)',
        outline: '1px solid rgb(59 130 246 / 0.55)',
        borderRadius: '2px'
      },
      '.cm-nonmatchingBracket': {
        backgroundColor: 'rgb(254 202 202 / 0.5)',
        outline: '1px solid rgb(239 68 68 / 0.55)',
        borderRadius: '2px'
      }
    }),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) return
      if (update.transactions.some((tr) => tr.annotation(External))) return
      if (props.readOnly) return
      const doc = update.state.doc.toString()
      emit('update:modelValue', doc)
      if (update.transactions.some((tr) => tr.isUserEvent('input.paste'))) {
        emit('paste', doc)
      }
    })
  ]
}

let resizeObserver: ResizeObserver | null = null

function shellEl(): HTMLElement | null {
  return hostRef.value?.closest('.json-editor-shell') ?? hostRef.value?.parentElement ?? null
}

/** CodeMirror 默认按内容高度排版；铺满父级需显式同步 host 像素高度 */
function syncFillHeight() {
  if (!props.fillHeight || !hostRef.value) return
  const shell = shellEl()
  const h = shell?.clientHeight ?? 0
  if (h < 48) return
  hostRef.value.style.height = `${h}px`
  hostRef.value.style.minHeight = `${h}px`
  viewRef.value?.requestMeasure?.()
}

onMounted(() => {
  if (!hostRef.value) return
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: buildExtensions()
  })
  const view = new EditorView({ state, parent: hostRef.value })
  viewRef.value = view
  syncDocFromModel()

  afterLayout(syncFillHeight)

  const measureTarget = shellEl() ?? hostRef.value
  resizeObserver = new ResizeObserver(() => {
    syncFillHeight()
  })
  resizeObserver.observe(measureTarget)
  if (hostRef.value) resizeObserver.observe(hostRef.value)
})

watch(
  () => props.fillHeight,
  () => {
    afterLayout(syncFillHeight)
  }
)

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  viewRef.value?.destroy()
  viewRef.value = null
})

defineExpose({ syncDocFromModel })
</script>

<style>
.json-cm-wrap {
  /* 与行号列 + 折叠列 + 内边距对齐，避免占位文案与正文首列错位 */
  --json-cm-ph-left: calc(1.125rem + 2ch + 8px);
}

.json-cm-wrap .json-cm-host {
  display: block;
  min-height: 0;
  flex: 1 1 auto;
}

.json-cm-wrap--fill {
  height: 100%;
  min-height: 20rem;
}

.json-cm-wrap--fill .json-cm-host {
  height: 100%;
  min-height: 20rem;
}

/* 滚动区铺满可视高度，横向滚动条固定在面板底部 */
.json-cm-wrap .cm-editor {
  display: flex;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
}

.json-cm-wrap--fill .cm-editor {
  min-height: 20rem;
}

.json-cm-wrap .cm-scroller {
  flex: 1 1 auto;
  min-height: 0;
}

.json-cm-wrap .json-cm-squiggle {
  text-decoration: underline wavy #dc2626;
  text-underline-offset: 0.12em;
  text-decoration-thickness: 1px;
}

/* lint 悬停提示：盖过折叠按钮与行号，避免被裁切 */
.json-cm-wrap .cm-tooltip {
  z-index: 50;
  max-width: min(22rem, calc(100vw - 2rem));
}
.json-cm-wrap .cm-diagnostic {
  font-size: 0.8125rem;
  line-height: 1.45;
  padding: 0.35rem 0.5rem;
}

/* 缩进层级色带（与语法高亮配合，便于分辨嵌套） */
.json-cm-wrap .cm-line.json-indent-d1 {
  box-shadow: inset 3px 0 0 rgb(59 130 246 / 0.42);
}
.json-cm-wrap .cm-line.json-indent-d2 {
  box-shadow: inset 3px 0 0 rgb(139 92 246 / 0.4);
}
.json-cm-wrap .cm-line.json-indent-d3 {
  box-shadow: inset 3px 0 0 rgb(236 72 153 / 0.38);
}
.json-cm-wrap .cm-line.json-indent-d4 {
  box-shadow: inset 3px 0 0 rgb(245 158 11 / 0.42);
}
.json-cm-wrap .cm-line.json-indent-d5 {
  box-shadow: inset 3px 0 0 rgb(16 185 129 / 0.4);
}
.json-cm-wrap .cm-line.json-indent-d6 {
  box-shadow: inset 3px 0 0 rgb(6 182 212 / 0.4);
}
.json-cm-wrap .cm-line.json-indent-d7 {
  box-shadow: inset 3px 0 0 rgb(99 102 241 / 0.4);
}
.json-cm-wrap .cm-line.json-indent-d8 {
  box-shadow: inset 3px 0 0 rgb(234 88 12 / 0.4);
}
</style>
