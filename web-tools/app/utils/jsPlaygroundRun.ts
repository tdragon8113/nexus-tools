export type JsPlaygroundLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

export interface JsPlaygroundLogEntry {
  level: JsPlaygroundLogLevel
  offsetMs: number
  parts: string[]
}

export interface JsPlaygroundRunResult {
  ok: boolean
  logs: JsPlaygroundLogEntry[]
  returnValue?: string
  error?: string
  durationMs: number
}

export const JS_PLAYGROUND_DEFAULT_TIMEOUT_MS = 5000

function serializeValue(value: unknown, depth = 0): string {
  if (depth > 5) return '[…]'
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'bigint') return `${value}n`
  if (typeof value === 'symbol') return value.toString()
  if (typeof value === 'function') {
    return `[Function${value.name ? `: ${value.name}` : ''}]`
  }
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`
  }
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    if (value.length > 200) {
      return `[${value.slice(0, 200).map((item) => serializeValue(item, depth + 1)).join(', ')}, … +${value.length - 200}]`
    }
    return `[${value.map((item) => serializeValue(item, depth + 1)).join(', ')}]`
  }
  try {
    const json = JSON.stringify(
      value,
      (_key, inner) => {
        if (typeof inner === 'bigint') return inner.toString()
        if (typeof inner === 'function') return `[Function${inner.name ? `: ${inner.name}` : ''}]`
        if (inner instanceof Error) return inner.stack ?? inner.message
        return inner
      },
      2
    )
    if (json !== undefined) return json
  } catch {
    // fall through
  }
  return Object.prototype.toString.call(value)
}

function pushLog(
  logs: JsPlaygroundLogEntry[],
  level: JsPlaygroundLogLevel,
  startedAt: number,
  args: unknown[]
) {
  logs.push({
    level,
    offsetMs: performance.now() - startedAt,
    parts: args.map((arg) => serializeValue(arg))
  })
}

function buildConsole(logs: JsPlaygroundLogEntry[], startedAt: number): Console {
  const bind =
    (level: JsPlaygroundLogLevel) =>
    (...args: unknown[]) => {
      pushLog(logs, level, startedAt, args)
    }

  return {
    log: bind('log'),
    info: bind('info'),
    warn: bind('warn'),
    error: bind('error'),
    debug: bind('debug')
  } as Console
}

function getAsyncFunctionConstructor(): typeof Function {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return Object.getPrototypeOf(async function () {}).constructor as typeof Function
}

export async function runJsPlaygroundCode(
  source: string,
  timeoutMs = JS_PLAYGROUND_DEFAULT_TIMEOUT_MS
): Promise<JsPlaygroundRunResult> {
  const trimmed = source.trim()
  const startedAt = performance.now()
  const logs: JsPlaygroundLogEntry[] = []

  if (!trimmed) {
    return {
      ok: false,
      logs,
      error: '请输入要执行的 JavaScript 代码',
      durationMs: 0
    }
  }

  const sandboxConsole = buildConsole(logs, startedAt)

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`执行超时（${timeoutMs}ms）`))
    }, timeoutMs)
  })

  try {
    const AsyncFunction = getAsyncFunctionConstructor()
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const runner = new AsyncFunction('console', `"use strict";\n${source}`) as (
      console: Console
    ) => Promise<unknown>

    const result = await Promise.race([runner(sandboxConsole), timeoutPromise])
    return {
      ok: true,
      logs,
      returnValue: serializeValue(result),
      durationMs: performance.now() - startedAt
    }
  } catch (error) {
    return {
      ok: false,
      logs,
      error: error instanceof Error ? error.stack ?? error.message : String(error),
      durationMs: performance.now() - startedAt
    }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function formatJsPlaygroundLogLine(entry: JsPlaygroundLogEntry): string {
  const prefix = `[${entry.level}]`
  return `${prefix} ${entry.parts.join(' ')}`
}
