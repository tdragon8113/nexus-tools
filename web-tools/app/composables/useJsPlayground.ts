import { showToast } from 'vant'
import { copyWithToast } from '~/composables/useCopyText'
import {
  getDesktopLocalStateValue,
  persistDesktopLocalStateKeyFireAndForget
} from '~/core/desktopLocalState'
import {
  formatJsPlaygroundLogLine,
  JS_PLAYGROUND_DEFAULT_TIMEOUT_MS,
  runJsPlaygroundCode,
  type JsPlaygroundLogEntry,
  type JsPlaygroundRunResult
} from '~/utils/jsPlaygroundRun'
import { RENDERER_LOCAL_STATE_KEYS } from '~~/shared/rendererLocalState'

const CODE_STORAGE_KEY = RENDERER_LOCAL_STATE_KEYS.jsPlaygroundCode
const WRAP_STORAGE_KEY = RENDERER_LOCAL_STATE_KEYS.jsPlaygroundWrap

const DEFAULT_CODE = `// 支持 top-level await 与 console.log
const nums = [1, 2, 3, 4]
console.log('sum =', nums.reduce((a, b) => a + b, 0))

await Promise.resolve()
return nums.map((n) => n * n)
`

export const jsPlaygroundSnippets: { id: string; label: string; code: string }[] = [
  {
    id: 'hello',
    label: 'Hello',
    code: `console.log('Hello, Nexus Tools!')
return { ok: true, at: new Date().toISOString() }`
  },
  {
    id: 'json',
    label: 'JSON 处理',
    code: `const raw = '{"name":"nexus","tags":["tools","js"]}'
const data = JSON.parse(raw)
console.log('keys:', Object.keys(data))
return data`
  },
  {
    id: 'fetch-hint',
    label: 'Fetch 示例',
    code: `// 受浏览器 / Electron 同源策略约束
const res = await fetch('https://httpbin.org/get?from=nexus-tools')
const json = await res.json()
console.log('status', res.status)
return json.url`
  },
  {
    id: 'date',
    label: '日期格式化',
    code: `const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const formatted = \`\${now.getFullYear()}-\${pad(now.getMonth() + 1)}-\${pad(now.getDate())} \${pad(now.getHours())}:\${pad(now.getMinutes())}:\${pad(now.getSeconds())}\`
console.log(formatted)
return formatted`
  }
]

export function useJsPlayground() {
  const code = useState('js-playground-code', () => DEFAULT_CODE)
  const wordWrap = ref(true)
  const running = ref(false)
  const lastResult = ref<JsPlaygroundRunResult | null>(null)

  onMounted(() => {
    if (!import.meta.client) return
    const savedCode = getDesktopLocalStateValue(CODE_STORAGE_KEY)
    if (savedCode !== null) code.value = savedCode
    const savedWrap = getDesktopLocalStateValue(WRAP_STORAGE_KEY)
    if (savedWrap === '0') wordWrap.value = false
    if (savedWrap === '1') wordWrap.value = true
  })

  watch(code, (value) => {
    if (import.meta.client) persistDesktopLocalStateKeyFireAndForget(CODE_STORAGE_KEY, value)
  })

  watch(wordWrap, (value) => {
    if (import.meta.client) {
      persistDesktopLocalStateKeyFireAndForget(WRAP_STORAGE_KEY, value ? '1' : '0')
    }
  })

  const outputText = computed(() => buildOutputText(lastResult.value))
  const hasOutput = computed(() => Boolean(outputText.value.trim()))
  const logEntries = computed(() => lastResult.value?.logs ?? [])

  function buildOutputText(result: JsPlaygroundRunResult | null): string {
    if (!result) return ''
    const lines: string[] = []
    for (const entry of result.logs) {
      lines.push(formatJsPlaygroundLogLine(entry))
    }
    if (result.ok) {
      if (result.returnValue !== undefined && result.returnValue !== 'undefined') {
        lines.push('')
        lines.push(`→ ${result.returnValue}`)
      }
      lines.push('')
      lines.push(`完成，耗时 ${result.durationMs.toFixed(1)} ms`)
    } else if (result.error) {
      if (lines.length > 0) lines.push('')
      lines.push(result.error)
      lines.push('')
      lines.push(`失败，耗时 ${result.durationMs.toFixed(1)} ms`)
    }
    return lines.join('\n').trimEnd()
  }

  async function runCode() {
    if (running.value) return
    running.value = true
    try {
      lastResult.value = await runJsPlaygroundCode(code.value, JS_PLAYGROUND_DEFAULT_TIMEOUT_MS)
      if (lastResult.value.ok) {
        showToast('执行完成')
      } else {
        showToast(lastResult.value.error?.split('\n')[0] ?? '执行失败')
      }
    } finally {
      running.value = false
    }
  }

  function clearCode() {
    code.value = ''
    lastResult.value = null
  }

  function clearOutput() {
    lastResult.value = null
  }

  function applySnippet(snippetId: string) {
    const snippet = jsPlaygroundSnippets.find((item) => item.id === snippetId)
    if (!snippet) return
    code.value = snippet.code
    lastResult.value = null
  }

  async function copyOutput() {
    if (!hasOutput.value) return
    await copyWithToast(outputText.value, '已复制输出')
  }

  return {
    code,
    wordWrap,
    running,
    lastResult,
    outputText,
    hasOutput,
    logEntries,
    runCode,
    clearCode,
    clearOutput,
    applySnippet,
    copyOutput
  }
}
