import { RangeSetBuilder, type Extension, type Text } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view'

function leadingIndentColumns(lineText: string, tabSize: number): number {
  let cols = 0
  for (const ch of lineText) {
    if (ch === ' ') cols += 1
    else if (ch === '\t') cols += tabSize
    else break
  }
  return cols
}

/** 每层缩进空白正中（2 空格时在 col 1、3、5…） */
function guideColumnsForIndent(indent: number, tabSize: number): number[] {
  if (indent <= 0 || tabSize <= 0) return []
  const levels = Math.floor(indent / tabSize)
  const half = tabSize / 2
  const cols: number[] = []
  for (let level = 1; level <= levels; level++) {
    cols.push(level * tabSize - half)
  }
  return cols
}

/** 按行缩进绘制虚线引导（与 VS Code 缩进参考线一致） */
function computeIndentGuides(doc: Text, tabSize: number): Map<number, number[]> {
  const out = new Map<number, number[]>()
  let carryIndent = 0

  for (let n = 1; n <= doc.lines; n++) {
    const text = doc.line(n).text
    const trimmed = text.trim()
    let indent = leadingIndentColumns(text, tabSize)

    if (trimmed) carryIndent = indent
    else indent = carryIndent

    const cols = guideColumnsForIndent(indent, tabSize)
    if (cols.length) out.set(n, cols)
  }

  return out
}

function guideLineBackground(cols: number[], charWidth: number): string {
  return cols
    .map((col) => {
      const x = Math.round(col * charWidth)
      return `linear-gradient(90deg,transparent ${x - 0.5}px,var(--json-cm-indent-guide) ${x - 0.5}px,var(--json-cm-indent-guide) ${x + 0.5}px,transparent ${x + 0.5}px)`
    })
    .join(',')
}

function buildScopeGuideDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc
  if (!doc.length) return Decoration.none

  const tabSize = view.state.tabSize
  const charWidth = view.defaultCharacterWidth
  if (!charWidth) return Decoration.none

  const guideByLine = computeIndentGuides(doc, tabSize)
  const { from, to } = view.viewport
  const builder = new RangeSetBuilder<Decoration>()

  for (let n = 1; n <= doc.lines; n++) {
    const line = doc.line(n)
    if (line.to < from || line.from > to) continue

    const cols = guideByLine.get(n)
    if (!cols?.length) continue

    builder.add(
      line.from,
      line.from,
      Decoration.line({
        class: 'json-cm-indent-guide-line',
        attributes: { style: `background-image:${guideLineBackground(cols, charWidth)}` }
      })
    )
  }

  return builder.finish()
}

/** 缩进实线引导（VS Code 风格） */
export function jsonIndentLayerExtension(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none

      constructor(view: EditorView) {
        this.decorations = buildScopeGuideDecorations(view)
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.geometryChanged ||
          update.startState.tabSize !== update.state.tabSize
        ) {
          this.decorations = buildScopeGuideDecorations(update.view)
        }
      }
    },
    { decorations: (v) => v.decorations }
  )
}
