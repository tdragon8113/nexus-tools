import { linter, type Diagnostic, type Extension, type LintSource } from '@codemirror/lint'
import { parseJson, sliceForJsonParse } from '~/utils/jsonTool'

export function jsonLintSource(): LintSource {
  return (view) => {
    const text = view.state.doc.toString()
    if (!sliceForJsonParse(text).slice) return []
    const result = parseJson(text)
    if (result.ok) return []
    if (result.errorFromInRaw == null || result.errorToInRaw == null) return []
    const docLen = view.state.doc.length
    const from = Math.min(Math.max(result.errorFromInRaw, 0), docLen)
    const to = Math.min(Math.max(result.errorToInRaw, from + 1), docLen)
    const d: Diagnostic = {
      from,
      to: to > from ? to : from,
      severity: 'error',
      message: result.message,
      source: 'json',
      markClass: 'json-cm-squiggle'
    }
    return [d]
  }
}

/** 输入时延迟校验 JSON 语法 */
export function jsonLiveLintExtension(delay = 300): Extension {
  return linter(jsonLintSource(), { delay })
}
