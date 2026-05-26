import { RangeSetBuilder, type Extension } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view'

const DEPTH_CLASS = [
  'json-indent-d1',
  'json-indent-d2',
  'json-indent-d3',
  'json-indent-d4',
  'json-indent-d5',
  'json-indent-d6',
  'json-indent-d7',
  'json-indent-d8'
] as const

function leadingIndentColumns(line: string, tabSize: number): number {
  let cols = 0
  for (const ch of line) {
    if (ch === ' ') cols += 1
    else if (ch === '\t') cols += tabSize
    else break
  }
  return cols
}

function buildIndentLayerDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc
  if (!doc.length) return Decoration.none

  const tabSize = view.state.tabSize
  const { from, to } = view.viewport
  const builder = new RangeSetBuilder<Decoration>()

  for (let n = 1; n <= doc.lines; n++) {
    const line = doc.line(n)
    if (line.to < from || line.from > to) continue

    const text = line.text
    if (!text.trim()) continue

    const depth = Math.floor(leadingIndentColumns(text, tabSize) / tabSize)
    if (depth <= 0) continue

    const cls = DEPTH_CLASS[Math.min(depth, DEPTH_CLASS.length) - 1]
    builder.add(line.from, line.from, Decoration.line({ class: cls }))
  }

  return builder.finish()
}

/** 按缩进层级给行加左侧色带，便于浏览嵌套结构 */
export function jsonIndentLayerExtension(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none

      constructor(view: EditorView) {
        this.decorations = buildIndentLayerDecorations(view)
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.geometryChanged) {
          this.decorations = buildIndentLayerDecorations(update.view)
        }
      }
    },
    { decorations: (v) => v.decorations }
  )
}
