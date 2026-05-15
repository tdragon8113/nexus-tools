import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle
} from '@codemirror/language'
import { lintKeymap } from '@codemirror/lint'
import { EditorState, type Extension } from '@codemirror/state'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection
} from '@codemirror/view'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** 固定 viewBox，展开/折叠仅换 path，避免槽位跳动 */
export function jsonFoldMarkerEl(open: boolean): HTMLSpanElement {
  const el = document.createElement('span')
  el.className = 'json-cm-fold-marker'
  el.setAttribute('aria-hidden', 'true')
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '1.35')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  path.setAttribute('d', open ? 'M4 6 L8 10 L12 6' : 'M6 4 L10 8 L6 12')
  svg.appendChild(path)
  el.appendChild(svg)
  return el
}

/** 对齐官方 `codemirror` 的 basicSetup，仅折叠 gutter 用自定义 marker */
export const jsonCodeMirrorBasicSetup: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter({ markerDOM: jsonFoldMarkerEl }),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap
  ])
]
