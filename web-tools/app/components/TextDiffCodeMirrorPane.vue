<template>
  <div
    class="text-diff-cm-wrap h-full min-h-0 min-w-0 overflow-hidden bg-white"
    :class="{ 'text-diff-cm-wrap--plain': variant === 'plain' }"
  >
    <div ref="hostRef" class="h-full min-h-0 min-w-0" />
  </div>
</template>

<script setup lang="ts">
import { Compartment, EditorState, StateEffect, StateField, type Extension } from '@codemirror/state'
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view'
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import {
  isTextDiffLanguageId,
  loadTextDiffLanguageBundle,
  type TextDiffLanguageId
} from '~/utils/textDiffCodeMirrorLanguage'
import { plainTextCodeMirrorSetup, textDiffCodeMirrorSetup } from '~/utils/textDiffCodeMirrorSetup'

export interface TextDiffLineDecoration {
  line: number
  className: string
}

export interface TextDiffRangeDecoration {
  line: number
  fromCh: number
  toCh: number
  className: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: TextDiffLanguageId
    /** diff：对比用完整能力；plain：纯文本，行号栏紧凑 */
    variant?: 'diff' | 'plain'
    decorations?: TextDiffLineDecoration[]
    rangeDecorations?: TextDiffRangeDecoration[]
    placeholder?: string
    wordWrap?: boolean
  }>(),
  {
    language: 'plain',
    variant: 'diff',
    decorations: () => [],
    rangeDecorations: () => [],
    placeholder: '',
    wordWrap: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  scroll: [top: number]
}>()

const hostRef = ref<HTMLElement | null>(null)
const viewRef = shallowRef<EditorView | null>(null)
const languageComp = new Compartment()
const lintComp = new Compartment()
const highlightComp = new Compartment()
const wrapComp = new Compartment()
let suppressScrollEmit = false
let languageRequestId = 0

const External = StateEffect.define<string>()
const setDecorations = StateEffect.define<{
  lines: TextDiffLineDecoration[]
  ranges: TextDiffRangeDecoration[]
}>()

function buildDecorations(
  state: EditorState,
  lineDecorations: TextDiffLineDecoration[],
  rangeDecorations: TextDiffRangeDecoration[]
): DecorationSet {
  const lineRanges = lineDecorations
    .filter((item) => item.line >= 1 && item.line <= state.doc.lines)
    .map((item) => ({
      from: state.doc.line(item.line).from,
      decoration: Decoration.line({ class: item.className })
    }))

  const markRanges = rangeDecorations
    .filter((item) => item.line >= 1 && item.line <= state.doc.lines && item.toCh > item.fromCh)
    .map((item) => {
      const line = state.doc.line(item.line)
      const from = Math.min(line.from + item.fromCh, line.to)
      const to = Math.min(line.from + item.toCh, line.to)
      return {
        from,
        decoration: Decoration.mark({ class: item.className }),
        to
      }
    })
    .filter((item) => item.to > item.from)

  const all = [
    ...lineRanges.map((item) => item.decoration.range(item.from)),
    ...markRanges.map((item) => item.decoration.range(item.from, item.to))
  ]

  return Decoration.set(all, true)
}

const lineDecorationField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state, props.decorations, props.rangeDecorations)
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setDecorations)) {
        return buildDecorations(tr.state, effect.value.lines, effect.value.ranges)
      }
    }
    if (tr.docChanged) {
      return buildDecorations(tr.state, props.decorations, props.rangeDecorations)
    }
    return value
  },
  provide: (field) => EditorView.decorations.from(field)
})

function getDocument(): string {
  return viewRef.value?.state.doc.toString() ?? ''
}

/** 强制写入全文（处理/替换等必须走此接口，避免与 v-model 竞态） */
function setDocument(value: string) {
  const view = viewRef.value
  if (!view) return
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: value },
    effects: External.of(value)
  })
}

function syncDocFromModel() {
  const view = viewRef.value
  if (!view) return
  const value = props.modelValue
  if (value === view.state.doc.toString()) return
  setDocument(value)
}

watch(() => props.modelValue, syncDocFromModel, { flush: 'post' })

watch(
  () => [props.decorations, props.rangeDecorations] as const,
  ([lines, ranges]) => {
    viewRef.value?.dispatch({
      effects: setDecorations.of({ lines, ranges })
    })
  },
  { deep: true }
)

async function applyLanguage(language: TextDiffLanguageId) {
  const requestId = ++languageRequestId
  const bundle = await loadTextDiffLanguageBundle(language)
  if (requestId !== languageRequestId) return
  viewRef.value?.dispatch({
    effects: [
      languageComp.reconfigure(bundle.language),
      highlightComp.reconfigure(bundle.highlight),
      lintComp.reconfigure(bundle.lint ? [bundle.lint] : [])
    ]
  })
}

watch(
  () => props.language,
  (language) => {
    if (!isTextDiffLanguageId(language)) return
    void applyLanguage(language)
  }
)

watch(
  () => props.wordWrap,
  (wordWrap) => {
    viewRef.value?.dispatch({
      effects: wrapComp.reconfigure(wordWrap ? EditorView.lineWrapping : [])
    })
  }
)

function buildExtensions(): Extension[] {
  const isPlain = props.variant === 'plain'
  const baseSetup = isPlain ? plainTextCodeMirrorSetup : textDiffCodeMirrorSetup
  const lineNoColor = 'rgb(148 163 184)'

  return [
    ...baseSetup,
    languageComp.of([]),
    highlightComp.of([]),
    wrapComp.of(props.wordWrap ? EditorView.lineWrapping : []),
    ...(isPlain ? [] : [lintComp.of([]), lineDecorationField]),
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: 'white'
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'var(--font-mono, ui-monospace, monospace)'
      },
      '.cm-content': {
        padding: '12px 0',
        minHeight: isPlain ? undefined : '100%'
      },
      '.cm-gutters': {
        backgroundColor: 'rgb(248 250 252)',
        borderRight: '1px solid rgb(226 232 240)',
        color: lineNoColor,
        paddingLeft: '0',
        width: 'auto !important'
      },
      '.cm-lineNumbers': {
        color: lineNoColor,
        minWidth: '0',
        width: 'auto !important',
        flex: '0 0 auto'
      },
      '.cm-lineNumbers .cm-gutterElement': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        boxSizing: 'border-box',
        minWidth: '0',
        padding: '0 2px',
        fontSize: '11px',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        whiteSpace: 'nowrap'
      },
      '.cm-line': {
        padding: '0 0.75rem'
      },
      '.cm-activeLine': {
        backgroundColor: 'rgb(248 250 252 / 0.65)'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgb(241 245 249)'
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgb(191 219 254 / 0.38)'
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: 'rgb(191 219 254 / 0.48)'
      },
      '&.cm-focused': {
        outline: 'none'
      },
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
      },
      '.text-diff-line-del': {
        backgroundColor: 'rgb(254 226 226 / 0.92)'
      },
      '.text-diff-line-add': {
        backgroundColor: 'rgb(220 252 231 / 0.95)'
      },
      '.text-diff-line-change-left': {
        backgroundColor: 'rgb(255 241 242 / 0.95)'
      },
      '.text-diff-line-change-right': {
        backgroundColor: 'rgb(236 253 245 / 0.95)'
      },
      '.text-diff-line-pad': {
        backgroundColor: 'rgb(248 250 252 / 0.95)'
      },
      '.text-diff-char-del': {
        backgroundColor: 'rgb(248 113 113 / 0.72)',
        borderRadius: '2px'
      },
      '.text-diff-char-add': {
        backgroundColor: 'rgb(74 222 128 / 0.72)',
        borderRadius: '2px'
      }
    }),
    EditorView.domEventHandlers({
      scroll(event, view) {
        if (event.target !== view.scrollDOM || suppressScrollEmit) return
        emit('scroll', view.scrollDOM.scrollTop)
      }
    }),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) return
      if (update.transactions.some((tr) => tr.effects.some((effect) => effect.is(External)))) return
      emit('update:modelValue', update.state.doc.toString())
    })
  ]
}

function setScrollTop(top: number) {
  const view = viewRef.value
  if (!view) return
  suppressScrollEmit = true
  view.scrollDOM.scrollTop = top
  window.setTimeout(() => {
    suppressScrollEmit = false
  }, 0)
}

function scrollToLine(lineNo: number) {
  const view = viewRef.value
  if (!view || lineNo < 1 || lineNo > view.state.doc.lines) return
  const line = view.state.doc.line(lineNo)
  suppressScrollEmit = true
  view.dispatch({
    effects: EditorView.scrollIntoView(line.from, { y: 'center' })
  })
  window.setTimeout(() => {
    suppressScrollEmit = false
  }, 0)
}

defineExpose({ setScrollTop, scrollToLine, syncDocFromModel, getDocument, setDocument })

onMounted(() => {
  if (!hostRef.value) return
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: buildExtensions()
  })
  viewRef.value = new EditorView({ state, parent: hostRef.value })
  syncDocFromModel()
  void nextTick(() => {
    viewRef.value?.dispatch({
      effects: setDecorations.of({ lines: props.decorations, ranges: props.rangeDecorations })
    })
    void applyLanguage(props.language)
  })
})

onUnmounted(() => {
  viewRef.value?.destroy()
  viewRef.value = null
})
</script>

<style>
.text-diff-cm-wrap .cm-editor {
  height: 100%;
}

.text-diff-cm-wrap .cm-lineNumbers {
  flex: 0 0 auto;
  width: auto !important;
  min-width: 0 !important;
}

.text-diff-cm-wrap .cm-tooltip {
  z-index: 50;
  max-width: min(22rem, calc(100vw - 2rem));
}

.text-diff-cm-wrap .cm-diagnostic {
  font-size: 0.8125rem;
  line-height: 1.45;
  padding: 0.35rem 0.5rem;
}

.text-diff-cm-wrap .cm-lintRange-error {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='m0 3 l3 -3 l3 3' fill='none' stroke='%23dc2626' stroke-width='1'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-position: left bottom;
  padding-bottom: 0.12em;
}
</style>
