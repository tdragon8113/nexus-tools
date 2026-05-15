<template>
  <div
    class="group json-cm-wrap relative h-full min-h-0 min-w-0 overflow-hidden"
    :class="tone === 'output' ? 'bg-slate-50/50' : 'bg-[var(--doc-code-bg)]'"
  >
    <p
      v-if="placeholder && showPlaceholder"
      class="json-cm-ph pointer-events-none absolute top-3 z-[1] max-w-[calc(100%-4.5rem)] truncate text-sm font-mono text-slate-400 group-focus-within:hidden"
      :style="{ left: 'var(--json-cm-ph-left)' }"
    >
      {{ placeholder }}
    </p>
    <div ref="hostRef" class="h-full min-h-0 min-w-0" />
  </div>
</template>

<script setup lang="ts">
import { json } from '@codemirror/lang-json'
import { indentWithTab } from '@codemirror/commands'
import { indentUnit as cmIndentUnit } from '@codemirror/language'
import { linter, type Diagnostic } from '@codemirror/lint'
import { Annotation, Compartment, EditorState, StateEffect, StateField, type Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { jsonCodeMirrorBasicSetup } from '~/utils/jsonCodeMirrorSetup'
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

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
    /** 解析错误时在原文中的字符下标，用于波浪下划线 */
    errorCharIndex?: number | null
    /** 与波浪线对应的说明，悬停波浪线时显示 */
    errorMessage?: string
    /** output 与主输入区背景、行号栏略有区分 */
    tone?: 'input' | 'output'
  }>(),
  {
    readOnly: false,
    placeholder: '',
    tabSize: 2,
    singleIndent: '  ',
    errorCharIndex: null,
    errorMessage: '',
    tone: 'input'
  }
)

const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const hostRef = ref<HTMLElement | null>(null)
const viewRef = shallowRef<EditorView | null>(null)

const External = Annotation.define<boolean>()

const setParseError = StateEffect.define<{ pos: number | null; message: string }>()

const parseErrorField = StateField.define<{ pos: number | null; message: string }>({
  create: () => ({ pos: null, message: '' }),
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setParseError)) return e.value
    }
    return value
  }
})

/** 由 lint 绘制波浪线 + 悬停显示 errorMessage（与官方 diagnostic 行为一致） */
const parseErrorLint = linter(
  (view) => {
    const { pos, message } = view.state.field(parseErrorField)
    if (pos == null || !message.trim()) return []
    const docLen = view.state.doc.length
    if (docLen === 0) return []
    const from = Math.min(Math.max(0, pos), docLen - 1)
    const to = Math.min(from + 1, docLen)
    const d: Diagnostic = {
      from,
      to,
      severity: 'error',
      message: message.trim(),
      markClass: 'json-cm-squiggle'
    }
    return [d]
  },
  {
    delay: 0,
    needsRefresh: (update) =>
      update.transactions.some((tr) => tr.effects.some((e) => e.is(setParseError)))
  }
)

const readOnlyComp = new Compartment()
const tabSizeComp = new Compartment()
const indentUnitComp = new Compartment()
const tabIndentComp = new Compartment()

const showPlaceholder = computed(() => !props.modelValue.trim())

watch(
  () => props.modelValue,
  (v) => {
    const view = viewRef.value
    if (!view) return
    if (v === view.state.doc.toString()) return
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: v },
      annotations: External.of(true)
    })
  }
)

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

function dispatchParseError() {
  const view = viewRef.value
  if (!view) return
  const pos =
    props.errorCharIndex != null && props.errorCharIndex >= 0 ? props.errorCharIndex : null
  const message = pos != null ? (props.errorMessage ?? '').trim() : ''
  view.dispatch({
    effects: setParseError.of({ pos, message })
  })
}

watch(
  () => [props.errorCharIndex, props.errorMessage, props.modelValue] as const,
  () => {
    dispatchParseError()
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
    parseErrorField,
    parseErrorLint,
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: 'transparent'
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        backgroundColor: scrollerBg
      },
      '.cm-content': { padding: '12px 0' },
      '.cm-gutters': {
        backgroundColor: gutterBg,
        borderRight: '1px solid rgb(226 232 240)',
        paddingLeft: '2px',
        color: lineNoColor
      },
      '.cm-lineNumbers': {
        color: lineNoColor
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
        padding: '0 3px 0 5px',
        minWidth: '20px',
        textAlign: 'right',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box'
      },
      '.cm-foldGutter': {
        width: '1.75rem',
        minWidth: '1.75rem',
        maxWidth: '1.75rem',
        flexShrink: '0'
      },
      '.cm-foldGutter .cm-gutterElement': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '1px',
        paddingRight: '3px',
        boxSizing: 'border-box',
        cursor: 'pointer',
        borderRadius: '3px'
      },
      '.cm-foldGutter .cm-gutterElement:hover .json-cm-fold-marker': {
        color: foldHover
      },
      '.cm-foldGutter .json-cm-fold-marker': {
        boxSizing: 'border-box',
        width: '1.375rem',
        minWidth: '1.375rem',
        maxWidth: '1.375rem',
        height: '1.375rem',
        flexShrink: '0',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: foldIdle,
        transition: 'color 0.12s ease'
      },
      '.cm-foldGutter .json-cm-fold-marker svg': {
        display: 'block',
        width: '0.95rem',
        height: '0.95rem',
        flexShrink: '0'
      },
      '&.cm-focused': { outline: 'none' },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'rgb(30 41 59)'
      }
    }),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) return
      if (update.transactions.some((tr) => tr.annotation(External))) return
      if (props.readOnly) return
      emit('update:modelValue', update.state.doc.toString())
    })
  ]
}

onMounted(() => {
  if (!hostRef.value) return
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: buildExtensions()
  })
  const view = new EditorView({ state, parent: hostRef.value })
  viewRef.value = view
  void nextTick(() => {
    dispatchParseError()
  })
})

onUnmounted(() => {
  viewRef.value?.destroy()
  viewRef.value = null
})
</script>

<style>
.json-cm-wrap {
  /* 与行号列 + 折叠列 + 内边距对齐，避免占位文案与正文首列错位 */
  --json-cm-ph-left: calc(2px + 28px + 1.75rem + 10px);
}

.json-cm-wrap .cm-editor {
  height: 100%;
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
</style>
