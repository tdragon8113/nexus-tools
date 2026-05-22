<template>
  <div class="max-w-4xl px-4 sm:px-6 py-8 md:py-10">

    <PageHero title="HTTP 请求" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-indigo-100 flex items-center justify-center shadow-sm border border-indigo-100"
        >
          <van-icon name="cluster-o" size="24" class="text-indigo-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">
        纯浏览器 fetch。若目标未配置 CORS，浏览器会拦截响应——这是站点安全策略，并非本工具故障。
      </p>
    </PageHero>

    <div class="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 mb-6">
      不要在此输入密钥；可被浏览器控制台与网络面板记录。
    </div>

    <div class="grid gap-4 md:grid-cols-[1fr_1fr]">
      <div class="space-y-3">
        <div class="flex gap-2">
          <select
            v-model="method"
            class="rounded-lg border border-slate-200 px-2 py-2 text-sm bg-white"
          >
            <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
          </select>
          <input
            v-model="url"
            type="url"
            class="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="https://api.github.com/"
          >
        </div>
        <label class="block">
          <span class="block text-xs font-medium text-slate-600 mb-1">请求头（每行 Key: Value）</span>
          <textarea
            v-model="headersRaw"
            class="w-full min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono"
            placeholder="Accept: application/json"
          />
        </label>
        <label v-if="methodHasBody" class="block">
          <span class="block text-xs font-medium text-slate-600 mb-1">Body</span>
          <textarea
            v-model="body"
            class="w-full min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono"
            placeholder='{"hello":"world"}'
          />
        </label>
        <button
          type="button"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          :disabled="loading"
          @click="send"
        >
          {{ loading ? '请求中…' : '发送' }}
        </button>
        <p v-if="err" class="text-sm text-red-600">{{ err }}</p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm min-h-[200px]">
        <template v-if="statusLine">
          <p class="font-mono text-slate-900 mb-2">{{ statusLine }}</p>
          <pre class="text-xs whitespace-pre-wrap break-all text-slate-700 mb-3 max-h-40 overflow-auto border border-slate-100 bg-white rounded p-2">{{ respHeaders }}</pre>
          <pre class="text-xs whitespace-pre-wrap break-all text-slate-900 max-h-96 overflow-auto border border-slate-100 bg-white rounded p-2">{{ respBody }}</pre>
          <button
            v-if="respBody"
            type="button"
            class="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-white"
            @click="copyWithToast(respBody)"
          >
            复制正文
          </button>
        </template>
        <p v-else class="text-slate-500">响应将显示在这里</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'HTTP 请求 - Nexus Tools' })

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
type M = (typeof methods)[number]

const method = ref<M>('GET')
const url = ref('https://api.github.com/')
const headersRaw = ref('Accept: application/json')
const body = ref('')

const loading = ref(false)
const err = ref('')
const statusLine = ref('')
const respHeaders = ref('')
const respBody = ref('')

const methodHasBody = computed(() => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.value))

function parseHeaders(raw: string): Headers {
  const h = new Headers()
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf(':')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim()
    if (k) h.append(k, v)
  }
  return h
}

const send = async () => {
  err.value = ''
  statusLine.value = ''
  respHeaders.value = ''
  respBody.value = ''
  loading.value = true
  try {
    const u = url.value.trim()
    if (!u) {
      err.value = '请输入 URL'
      return
    }
    const hdrs = parseHeaders(headersRaw.value)
    const init: RequestInit = { method: method.value, headers: hdrs }
    if (methodHasBody.value && body.value) init.body = body.value
    const res = await fetch(u, init)
    statusLine.value = `${res.status} ${res.statusText}`
    const entries = [...res.headers.entries()].map(([k, v]) => `${k}: ${v}`)
    respHeaders.value = entries.join('\n')
    const ct = res.headers.get('content-type') ?? ''
    const text = await res.text()
    if (ct.includes('application/json')) {
      try {
        respBody.value = JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        respBody.value = text
      }
    } else {
      respBody.value = text
    }
  } catch (e) {
    err.value = e instanceof Error ? e.message : '请求失败（常见于 CORS 或网络错误）'
  } finally {
    loading.value = false
  }
}
</script>
