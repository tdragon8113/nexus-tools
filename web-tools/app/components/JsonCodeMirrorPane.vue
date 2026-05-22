<template>
  <div
    class="group json-cm-wrap relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
    :class="tone === 'output' ? 'bg-slate-50/50' : 'bg-[var(--doc-code-bg)]'"
  >
    <p
      v-if="placeholder && showPlaceholder"
      class="json-cm-ph pointer-events-none absolute top-3 z-[1] max-w-[calc(100%-4.5rem)] truncate text-sm font-mono text-slate-400 group-focus-within:hidden"
      :style="{ left: 'var(--json-cm-ph-left)' }"
    >
      {{ placeholder }}
    </p>
    <div ref="hostRef" class="json-cm-host h-full min-h-0 min-w-0 flex-1" />
  </div>
</template>

<script setup lang="ts">
import { json } from '@codemirror/lang-json'
import { indentWithTab } from '@codemirror/commands'
import { indentUnit as cmIndentUnit } from '@codemirror/language'
import { Annotation, Compartment, EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { jsonLiveLintExtension } from '~/utils/jsonCodeMirrorLint'
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
    /** output 与主输入区背景、行号栏略有区分 */
    tone?: 'input' | 'output'
  }>(),
  {
    readOnly: false,
    placeholder: '',
    tabSize: 2,
    singleIndent: '  ',
    tone: 'input'
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

onMounted(() => {
  if (!hostRef.value) return
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: buildExtensions()
  })
  const view = new EditorView({ state, parent: hostRef.value })
  viewRef.value = view
})

onUnmounted(() => {
  viewRef.value?.destroy()
  viewRef.value = null
})
</script>

<style>
.json-cm-wrap {
  /* 与行号列 + 折叠列 + 内边距对齐，避免占位文案与正文首列错位 */
  --json-cm-ph-left: calc(1.125rem + 2ch + 8px);
}

.json-cm-wrap .json-cm-host {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 滚动区铺满可视高度，横向滚动条固定在面板底部 */
.json-cm-wrap .cm-editor {
  display: flex;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
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
</style>
