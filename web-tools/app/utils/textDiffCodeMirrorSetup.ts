import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, indentOnInput } from '@codemirror/language'
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
import { jsPlaygroundAutocompleteExtension } from '~/utils/jsPlaygroundCodeMirror'

/** 文本对比编辑器：保留语法与 lint，不占用折叠 / lint 栏宽度 */
export const textDiffCodeMirrorSetup: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
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
    ...completionKeymap,
    ...lintKeymap
  ])
]

/** 纯文本编辑：行号 + 历史 + 搜索；语法高亮由 language bundle 注入 */
export const plainTextCodeMirrorSetup: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap])
]

/** 代码编辑：补全、括号配对；语法高亮与语言补全由 language bundle 注入 */
export const codeEditorCodeMirrorSetup: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  autocompletion({ activateOnTyping: true, defaultKeymap: true }),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...completionKeymap
  ])
]

/** JS 运行：专用补全（覆盖默认 language 补全） */
export const jsPlaygroundCodeMirrorSetup: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  jsPlaygroundAutocompleteExtension,
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...completionKeymap
  ])
]
