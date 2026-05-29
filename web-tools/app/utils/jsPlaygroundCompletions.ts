import {
  completeFromList,
  type Completion,
  type CompletionContext,
  type CompletionResult
} from '@codemirror/autocomplete'
import {
  completionPath,
  localCompletionSource,
  snippets as jsSnippets
} from '@codemirror/lang-javascript'

const Identifier = /^[\w$]*$/

const SECTION = {
  local: { name: '局部', rank: 0 },
  global: { name: '全局', rank: 1 },
  snippet: { name: '片段', rank: 2 },
  keyword: { name: '关键字', rank: 3 }
} as const

/** 运行时根对象：用于 console.log、JSON.parse 等链式补全 */
const PLAYGROUND_GLOBALS: Record<string, unknown> = {
  console,
  JSON,
  Math,
  Date,
  Array,
  Object,
  String,
  Number,
  Boolean,
  Map,
  Set,
  WeakMap,
  WeakSet,
  Promise,
  RegExp,
  Error,
  TypeError,
  RangeError,
  SyntaxError,
  URL,
  URLSearchParams,
  Intl,
  fetch,
  document,
  window,
  navigator,
  localStorage,
  sessionStorage,
  structuredClone,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  encodeURIComponent,
  decodeURIComponent,
  btoa,
  atob,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  globalThis
}

/** path 形如 "console" / "JSON" / "Array" */
const API_SIGNATURES: Record<string, Record<string, string>> = {
  console: {
    log: 'log(...data: any[]): void',
    info: 'info(...data: any[]): void',
    warn: 'warn(...data: any[]): void',
    error: 'error(...data: any[]): void',
    debug: 'debug(...data: any[]): void',
    table: 'table(tabularData: any, properties?: string[]): void',
    dir: 'dir(item: any, options?: object): void',
    trace: 'trace(...data: any[]): void',
    time: 'time(label?: string): void',
    timeEnd: 'timeEnd(label?: string): void',
    timeLog: 'timeLog(label?: string, ...data: any[]): void',
    group: 'group(...label: any[]): void',
    groupCollapsed: 'groupCollapsed(...label: any[]): void',
    groupEnd: 'groupEnd(): void',
    clear: 'clear(): void',
    count: 'count(label?: string): void',
    assert: 'assert(condition?: boolean, ...data: any[]): void'
  },
  JSON: {
    parse: 'parse(text: string, reviver?: Function): any',
    stringify: 'stringify(value: any, replacer?: Function | string[], space?: number | string): string'
  },
  Math: {
    abs: 'abs(x: number): number',
    ceil: 'ceil(x: number): number',
    floor: 'floor(x: number): number',
    round: 'round(x: number): number',
    max: 'max(...values: number[]): number',
    min: 'min(...values: number[]): number',
    pow: 'pow(base: number, exp: number): number',
    sqrt: 'sqrt(x: number): number',
    random: 'random(): number',
    trunc: 'trunc(x: number): number',
    sign: 'sign(x: number): number'
  },
  Array: {
    from: 'from<T>(arrayLike: ArrayLike<T>): T[]',
    isArray: 'isArray(value: any): boolean',
    of: 'of<T>(...items: T[]): T[]'
  },
  Object: {
    keys: 'keys(obj: object): string[]',
    values: 'values(obj: object): any[]',
    entries: 'entries(obj: object): [string, any][]',
    fromEntries: 'fromEntries(entries: Iterable<[string, any]>): object',
    assign: 'assign(target: object, ...sources: object[]): object',
    freeze: 'freeze<T>(obj: T): T',
    hasOwn: 'hasOwn(obj: object, key: PropertyKey): boolean'
  },
  String: {
    fromCharCode: 'fromCharCode(...codes: number[]): string',
    fromCodePoint: 'fromCodePoint(...codePoints: number[]): string',
    raw: 'raw(template: TemplateStringsArray, ...substitutions: any[]): string'
  },
  Number: {
    isFinite: 'isFinite(value: any): boolean',
    isInteger: 'isInteger(value: any): boolean',
    isNaN: 'isNaN(value: any): boolean',
    parseFloat: 'parseFloat(string: string): number',
    parseInt: 'parseInt(string: string, radix?: number): number'
  },
  Date: {
    now: 'now(): number',
    parse: 'parse(dateString: string): number',
    UTC: 'UTC(...args: number[]): number'
  },
  Promise: {
    all: 'all<T>(values: Iterable<T | PromiseLike<T>>): Promise<T[]>',
    race: 'race<T>(values: Iterable<T | PromiseLike<T>>): Promise<T>',
    resolve: 'resolve<T>(value: T): Promise<T>',
    reject: 'reject(reason?: any): Promise<never>'
  },
  Map: {
    groupBy: 'groupBy<K, T>(items: Iterable<T>, key: (item: T) => K): Map<K, T[]>'
  },
  URL: {
    canParse: 'canParse(url: string, base?: string): boolean',
    createObjectURL: 'createObjectURL(obj: Blob): string',
    revokeObjectURL: 'revokeObjectURL(url: string): void'
  }
}

const GLOBAL_ENTRIES: Completion[] = [
  { label: 'console', type: 'namespace', detail: 'Console', boost: 30, section: SECTION.global },
  { label: 'JSON', type: 'namespace', detail: 'JSON', boost: 28, section: SECTION.global },
  { label: 'Math', type: 'namespace', detail: 'Math', boost: 26, section: SECTION.global },
  { label: 'Date', type: 'class', detail: 'Date', boost: 24, section: SECTION.global },
  { label: 'Array', type: 'class', detail: 'Array<T>', boost: 24, section: SECTION.global },
  { label: 'Object', type: 'namespace', detail: 'Object', boost: 24, section: SECTION.global },
  { label: 'String', type: 'class', detail: 'String', boost: 22, section: SECTION.global },
  { label: 'Number', type: 'class', detail: 'Number', boost: 20, section: SECTION.global },
  { label: 'Boolean', type: 'class', detail: 'Boolean', boost: 18, section: SECTION.global },
  { label: 'Promise', type: 'class', detail: 'Promise<T>', boost: 22, section: SECTION.global },
  { label: 'Map', type: 'class', detail: 'Map<K, V>', boost: 20, section: SECTION.global },
  { label: 'Set', type: 'class', detail: 'Set<T>', boost: 20, section: SECTION.global },
  { label: 'RegExp', type: 'class', detail: 'RegExp', boost: 18, section: SECTION.global },
  { label: 'Error', type: 'class', detail: 'Error', boost: 16, section: SECTION.global },
  { label: 'URL', type: 'class', detail: 'URL', boost: 18, section: SECTION.global },
  { label: 'URLSearchParams', type: 'class', detail: 'URLSearchParams', boost: 16, section: SECTION.global },
  {
    label: 'fetch',
    type: 'function',
    detail: 'fetch(url: string, init?: RequestInit): Promise<Response>',
    boost: 22,
    section: SECTION.global
  },
  { label: 'document', type: 'variable', detail: 'Document', boost: 14, section: SECTION.global },
  { label: 'window', type: 'variable', detail: 'Window', boost: 12, section: SECTION.global },
  { label: 'navigator', type: 'variable', detail: 'Navigator', boost: 10, section: SECTION.global },
  { label: 'localStorage', type: 'variable', detail: 'Storage', boost: 12, section: SECTION.global },
  { label: 'sessionStorage', type: 'variable', detail: 'Storage', boost: 10, section: SECTION.global },
  {
    label: 'setTimeout',
    type: 'function',
    detail: 'setTimeout(fn: Function, ms?: number): number',
    boost: 16,
    section: SECTION.global
  },
  {
    label: 'setInterval',
    type: 'function',
    detail: 'setInterval(fn: Function, ms?: number): number',
    boost: 14,
    section: SECTION.global
  },
  { label: 'clearTimeout', type: 'function', detail: 'clearTimeout(id: number): void', boost: 8, section: SECTION.global },
  { label: 'clearInterval', type: 'function', detail: 'clearInterval(id: number): void', boost: 8, section: SECTION.global },
  {
    label: 'parseInt',
    type: 'function',
    detail: 'parseInt(string: string, radix?: number): number',
    boost: 14,
    section: SECTION.global
  },
  {
    label: 'parseFloat',
    type: 'function',
    detail: 'parseFloat(string: string): number',
    boost: 14,
    section: SECTION.global
  },
  { label: 'isNaN', type: 'function', detail: 'isNaN(value: any): boolean', boost: 10, section: SECTION.global },
  { label: 'isFinite', type: 'function', detail: 'isFinite(value: any): boolean', boost: 10, section: SECTION.global },
  {
    label: 'encodeURIComponent',
    type: 'function',
    detail: 'encodeURIComponent(text: string): string',
    boost: 10,
    section: SECTION.global
  },
  {
    label: 'decodeURIComponent',
    type: 'function',
    detail: 'decodeURIComponent(text: string): string',
    boost: 10,
    section: SECTION.global
  },
  { label: 'btoa', type: 'function', detail: 'btoa(data: string): string', boost: 10, section: SECTION.global },
  { label: 'atob', type: 'function', detail: 'atob(data: string): string', boost: 10, section: SECTION.global },
  { label: 'structuredClone', type: 'function', detail: 'structuredClone<T>(value: T): T', boost: 12, section: SECTION.global },
  { label: 'Intl', type: 'namespace', detail: 'Intl', boost: 10, section: SECTION.global },
  { label: 'globalThis', type: 'variable', detail: 'globalThis', boost: 6, section: SECTION.global },
  { label: 'NaN', type: 'constant', detail: 'number', boost: 4, section: SECTION.global },
  { label: 'Infinity', type: 'constant', detail: 'number', boost: 4, section: SECTION.global },
  { label: 'undefined', type: 'constant', detail: 'undefined', boost: 2, section: SECTION.global }
]

const JS_KEYWORDS = completeFromList(
  'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield async await of'
    .split(' ')
    .map((label) => ({
      label,
      type: 'keyword' as const,
      section: SECTION.keyword
    }))
)

function scoreMatch(label: string, query: string): number {
  if (!query) return 0
  const lower = label.toLowerCase()
  const q = query.toLowerCase()
  if (lower === q) return 100
  if (lower.startsWith(q)) return 80 - (lower.length - q.length)
  if (lower.includes(q)) return 40 - lower.indexOf(q)
  return -1
}

function resolveTarget(path: string[]): unknown | null {
  if (path.length === 0) return PLAYGROUND_GLOBALS
  let target: unknown = PLAYGROUND_GLOBALS
  for (const step of path) {
    if (target == null || (typeof target !== 'object' && typeof target !== 'function')) return null
    if (!(step in (target as Record<string, unknown>))) return null
    target = (target as Record<string, unknown>)[step]
  }
  return target
}

function enumerateMembers(target: unknown, pathPrefix: string): Completion[] {
  if (target == null || (typeof target !== 'object' && typeof target !== 'function')) return []

  const signatures = API_SIGNATURES[pathPrefix] ?? {}
  const options: Completion[] = []
  const seen = new Set<string>()
  let cursor: unknown = target

  for (let depth = 0; cursor && (typeof cursor === 'object' || typeof cursor === 'function'); depth++) {
    for (const name of Object.getOwnPropertyNames(cursor)) {
      if (!/^[\w$]+$/.test(name) || seen.has(name)) continue
      seen.add(name)

      let value: unknown
      try {
        value = (cursor as Record<string, unknown>)[name]
      } catch {
        continue
      }

      const type =
        typeof value === 'function'
          ? /^[A-Z]/.test(name)
            ? 'class'
            : depth === 0
              ? 'function'
              : 'method'
          : 'property'

      options.push({
        label: name,
        type,
        detail: signatures[name],
        boost: 20 - depth * 3,
        section: SECTION.global
      })
    }

    cursor = Object.getPrototypeOf(cursor)
    if (!cursor || cursor === Object.prototype) break
  }

  return options
}

function dedupeOptions(options: Completion[]): Completion[] {
  const map = new Map<string, Completion>()
  for (const option of options) {
    const prev = map.get(option.label)
    if (!prev || (option.boost ?? 0) > (prev.boost ?? 0)) map.set(option.label, option)
  }
  return [...map.values()].sort((a, b) => {
    const boostDiff = (b.boost ?? 0) - (a.boost ?? 0)
    if (boostDiff !== 0) return boostDiff
    return a.label.localeCompare(b.label)
  })
}

function buildResult(from: number, options: Completion[]): CompletionResult | null {
  if (options.length === 0) return null
  return { from, options: dedupeOptions(options), validFor: Identifier }
}

export function jsPlaygroundCompletionSource(context: CompletionContext): CompletionResult | null {
  const path = completionPath(context)
  if (!path) return null

  const from = context.pos - path.name.length
  const query = path.name

  if (path.path.length > 0) {
    const target = resolveTarget(path.path)
    if (target == null) return null
    const pathPrefix = path.path.join('.')
    const members = enumerateMembers(target, pathPrefix)
    const filtered = members.filter((item) => scoreMatch(item.label, query) >= 0)
    return buildResult(from, filtered)
  }

  const options: Completion[] = []

  const local = localCompletionSource(context)
  if (local) {
    for (const item of local.options) {
      options.push({
        ...item,
        boost: (item.boost ?? 0) + 60,
        section: SECTION.local
      })
    }
  }

  for (const entry of GLOBAL_ENTRIES) {
    const match = scoreMatch(entry.label, query)
    if (match >= 0) options.push({ ...entry, boost: (entry.boost ?? 0) + match })
  }

  for (const name of Object.keys(PLAYGROUND_GLOBALS)) {
    if (options.some((item) => item.label === name)) continue
    const match = scoreMatch(name, query)
    if (match < 0) continue
    options.push({
      label: name,
      type: typeof PLAYGROUND_GLOBALS[name] === 'function' ? 'function' : 'variable',
      boost: match,
      section: SECTION.global
    })
  }

  for (const snippet of jsSnippets) {
    const match = scoreMatch(snippet.label, query)
    if (match >= 0 && (context.explicit || query.length > 0)) {
      options.push({
        ...snippet,
        boost: match + 25,
        section: SECTION.snippet
      })
    }
  }

  const keywordResult = JS_KEYWORDS(context)
  if (keywordResult) {
    for (const item of keywordResult.options) {
      const match = scoreMatch(item.label, query)
      if (match >= 0) {
        options.push({
          ...item,
          boost: match - 10,
          section: SECTION.keyword
        })
      }
    }
  }

  return buildResult(from, options)
}
