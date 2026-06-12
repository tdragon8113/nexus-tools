<template>
  <div class="desktop-tool-page flex h-full min-h-0 flex-col">
    <div class="flex flex-wrap items-center gap-2">
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none ring-sky-200/80 focus:ring-2"
        placeholder="输入 IP 地址，留空查询本机"
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
        @keydown.enter.prevent="runLookup()"
      >
      <button
        type="button"
        class="nexus-btn-secondary shrink-0"
        :disabled="loading"
        @click="runLookup()"
      >
        {{ loading ? '查询中…' : '查询' }}
      </button>
      <div
        v-if="proxyStatus.enabled"
        class="inline-flex shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
        role="group"
        aria-label="本机 IP 查询方式"
      >
        <button
          type="button"
          class="px-3 py-2 text-sm transition disabled:opacity-40"
          :class="localLookupMode === 'direct'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-50'"
          :disabled="loading"
          title="绕过系统 HTTP/SOCKS 代理查询本机 IP"
          @click="lookupLocal(false)"
        >
          本机·直连
        </button>
        <button
          type="button"
          class="border-l border-slate-200 px-3 py-2 text-sm transition disabled:opacity-40"
          :class="localLookupMode === 'proxy'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-50'"
          :disabled="loading"
          title="经系统代理查询本机 IP，用于验证代理是否生效"
          @click="lookupLocal(true)"
        >
          本机·代理
        </button>
      </div>
      <button
        v-else
        type="button"
        class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        :disabled="loading"
        @click="lookupLocal(false)"
      >
        本机 IP
      </button>
    </div>

    <p
      v-if="proxyStatus.enabled && proxyStatus.summary"
      class="mt-1.5 truncate text-xs text-slate-400"
      title="若「直连」与「代理」结果相同，可能是代理软件开启了 TUN/增强模式接管全局流量"
    >
      系统代理 {{ proxyStatus.summary }}
    </p>

    <p
      v-if="error"
      class="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </p>

    <section
      v-if="result"
      class="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
    >
      <div class="border-b border-slate-100 px-4 py-3">
        <div class="flex flex-wrap items-center gap-2">
          <p class="font-mono text-lg font-semibold text-slate-900">
            {{ result.flagEmoji }} {{ result.ip }}
          </p>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {{ result.version }}
          </span>
          <span
            v-if="lastLookupViaProxy != null"
            class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            {{ lastLookupViaProxy ? '经系统代理' : '直连' }}
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">
          {{ locationLine }}
        </p>
      </div>

      <dl class="divide-y divide-slate-100">
        <div
          v-for="row in detailRows"
          :key="row.label"
          class="grid grid-cols-[5.5rem_1fr] gap-3 px-4 py-2.5 text-sm"
        >
          <dt class="text-slate-500">
            {{ row.label }}
          </dt>
          <dd class="min-w-0 break-all font-medium text-slate-800">
            {{ row.value }}
          </dd>
        </div>
      </dl>

      <div class="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          class="text-sm text-slate-600 hover:text-slate-900"
          @click="copySummary"
        >
          复制摘要
        </button>
        <button
          type="button"
          class="text-sm text-slate-600 hover:text-slate-900"
          @click="copyDetails"
        >
          复制详情
        </button>
      </div>
    </section>

    <p
      v-else-if="!loading && !error"
      class="mt-6 text-center text-sm text-slate-400"
    >
      {{ proxyStatus.enabled ? '输入 IP 后查询，或点「本机·直连 / 本机·代理」对比出口' : '输入 IP 后按 Enter 查询，或点击「本机 IP」' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  getDesktopLocalStateValue,
  persistDesktopLocalStateKeyFireAndForget
} from '~/core/desktopLocalState'
import {
  extractIpFromText,
  fetchIpLookup,
  formatIpLookupSummary,
  type IpLookupInfo
} from '~~/utils/ipLookup'
import { RENDERER_LOCAL_STATE_KEYS } from '~~/shared/rendererLocalState'

useHead({ title: 'IP 查询 - Nexus Tools' })

const PROXY_PREF_KEY = RENDERER_LOCAL_STATE_KEYS.ipLocalUseSystemProxy

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<IpLookupInfo | null>(null)
const proxyStatus = ref({ enabled: false, summary: '' })
const localLookupMode = ref<'direct' | 'proxy'>('direct')
const lastLookupViaProxy = ref<boolean | null>(null)

const locationLine = computed(() => {
  if (!result.value) return ''
  const parts = [result.value.country, result.value.region, result.value.city].filter(Boolean)
  return parts.join(' · ') || '未知位置'
})

const detailRows = computed(() => {
  if (!result.value) return []
  const data = result.value
  const coord =
    data.latitude != null && data.longitude != null
      ? `${data.latitude}, ${data.longitude}`
      : '—'

  return [
    { label: '大洲', value: data.continent || '—' },
    { label: '国家', value: data.country ? `${data.country} (${data.countryCode || '—'})` : '—' },
    { label: '地区', value: data.region || '—' },
    { label: '城市', value: data.city || '—' },
    { label: '邮编', value: data.postal || '—' },
    { label: '时区', value: data.timezone ? `${data.timezone} (${data.timezoneUtc || '—'})` : '—' },
    { label: '运营商', value: data.isp || '—' },
    { label: '组织', value: data.org || '—' },
    { label: 'ASN', value: data.asn != null ? String(data.asn) : '—' },
    { label: '坐标', value: coord }
  ]
})

function restoreProxyPreference() {
  if (!import.meta.client) return
  const raw = getDesktopLocalStateValue(PROXY_PREF_KEY)
  localLookupMode.value = raw === '1' ? 'proxy' : 'direct'
}

function persistProxyPreference(mode: 'direct' | 'proxy') {
  if (!import.meta.client) return
  persistDesktopLocalStateKeyFireAndForget(PROXY_PREF_KEY, mode === 'proxy' ? '1' : '0')
}

async function loadProxyStatus() {
  if (!import.meta.client || !window.nexusDesktop?.getIpProxyStatus) return
  try {
    proxyStatus.value = await window.nexusDesktop.getIpProxyStatus()
  } catch {
    proxyStatus.value = { enabled: false, summary: '' }
  }
}

async function runLookup(ip?: string, options?: { useSystemProxy?: boolean }) {
  const target = ip ?? query.value
  const isLocalLookup = !target.trim()
  const useSystemProxy = isLocalLookup ? options?.useSystemProxy === true : undefined
  loading.value = true
  error.value = ''
  const response = await fetchIpLookup(target, { useSystemProxy })
  loading.value = false

  if (!response.ok) {
    result.value = null
    lastLookupViaProxy.value = null
    error.value = response.error
    return
  }

  result.value = response.data
  query.value = response.data.ip
  if (isLocalLookup) {
    const mode = useSystemProxy ? 'proxy' : 'direct'
    localLookupMode.value = mode
    persistProxyPreference(mode)
    lastLookupViaProxy.value = useSystemProxy === true
  } else {
    lastLookupViaProxy.value = null
  }
}

function lookupLocal(useSystemProxy: boolean) {
  query.value = ''
  void runLookup('', { useSystemProxy })
}

function buildDetailsText(): string {
  if (!result.value) return ''
  const lines = [
    `IP: ${result.value.ip}`,
    `类型: ${result.value.version}`,
    `位置: ${locationLine.value}`,
    ...detailRows.value.map((row) => `${row.label}: ${row.value}`)
  ]
  return lines.join('\n')
}

function copySummary() {
  if (!result.value) return
  void copyWithToast(formatIpLookupSummary(result.value), '已复制摘要')
}

function copyDetails() {
  const text = buildDetailsText()
  if (!text) return
  void copyWithToast(text, '已复制详情')
}

const { drain: drainIpPrefill } = useConsumeToolPrefill(
  'ip',
  (text) => {
    const ip = extractIpFromText(text)
    if (ip) {
      query.value = ip
      void runLookup(ip)
      return
    }
    query.value = text.trim()
    if (query.value) void runLookup(query.value)
  },
  { consumeOnMount: false }
)

onMounted(() => {
  restoreProxyPreference()
  void loadProxyStatus()
  drainIpPrefill()
  inputRef.value?.focus()
})
</script>
