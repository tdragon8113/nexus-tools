<template>
  <div class="desktop-tool-page flex h-full min-h-0 flex-col">
    <div class="flex flex-wrap items-center gap-2">
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none ring-sky-200/80 focus:ring-2"
        placeholder="输入经纬度，如 31.2222, 121.4581"
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
      <button
        type="button"
        class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        :disabled="loading"
        @click="useCurrentLocation"
      >
        当前位置
      </button>
    </div>

    <p
      v-if="notice"
      class="mt-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-800"
    >
      {{ notice }}
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
        <p class="font-mono text-lg font-semibold text-slate-900">
          {{ coordinatesLine }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ result.displayName || locationLine }}
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
        <button
          type="button"
          class="text-sm text-slate-600 hover:text-slate-900"
          @click="openMap"
        >
          在地图中打开
        </button>
      </div>
    </section>

    <p
      v-else-if="!loading && !error"
      class="mt-6 text-center text-sm text-slate-400"
    >
      支持「纬度, 经度」或「纬度 经度」，按 Enter 查询
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  extractCoordinatesFromText,
  fetchGeoLookup,
  formatCoordinates,
  formatGeoLookupSummary,
  openStreetMapUrl,
  type GeoLookupInfo
} from '~~/utils/geoLookup'
import { fetchIpLookup } from '~~/utils/ipLookup'

useHead({ title: '经纬度查询 - Nexus Tools' })

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const loading = ref(false)
const error = ref('')
const notice = ref('')
const result = ref<GeoLookupInfo | null>(null)

const coordinatesLine = computed(() => {
  if (!result.value) return ''
  return formatCoordinates(result.value.latitude, result.value.longitude)
})

const locationLine = computed(() => {
  if (!result.value) return ''
  const parts = [result.value.country, result.value.region, result.value.city].filter(Boolean)
  return parts.join(' · ') || '未知位置'
})

const detailRows = computed(() => {
  if (!result.value) return []
  const data = result.value

  return [
    { label: '地名', value: data.name || '—' },
    { label: '国家', value: data.country ? `${data.country}${data.countryCode ? ` (${data.countryCode})` : ''}` : '—' },
    { label: '地区', value: data.region || '—' },
    { label: '城市', value: data.city || '—' },
    { label: '时区', value: data.timezone || '—' },
    { label: '海拔', value: data.elevation != null ? `${data.elevation} m` : '—' },
    { label: '完整地址', value: data.displayName || '—' }
  ]
})

async function runLookup(text?: string) {
  const target = text ?? query.value
  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    const response = await fetchGeoLookup(target)
    if (!response.ok) {
      result.value = null
      error.value = response.error
      return
    }

    result.value = response.data
    query.value = formatCoordinates(response.data.latitude, response.data.longitude)
  } finally {
    loading.value = false
  }
}

function requestDevicePosition(highAccuracy: boolean): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: highAccuracy,
      timeout: highAccuracy ? 15_000 : 10_000,
      maximumAge: 120_000
    })
  })
}

async function tryApproximateFromIp(): Promise<boolean> {
  try {
    const response = await fetchIpLookup('')
    if (!response.ok) return false
    const { latitude, longitude } = response.data
    if (latitude == null || longitude == null) return false

    const coords = formatCoordinates(latitude, longitude)
    query.value = coords
    const geoResponse = await fetchGeoLookup(coords)

    if (!geoResponse.ok) {
      result.value = null
      error.value = geoResponse.error
      return false
    }

    result.value = geoResponse.data
    notice.value = 'GPS 定位不可用，已根据公网 IP 估算坐标（精度较低）'
    return true
  } catch {
    return false
  }
}

async function useCurrentLocation() {
  if (!import.meta.client) return

  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    if (navigator.geolocation) {
      try {
        let pos: GeolocationPosition
        try {
          pos = await requestDevicePosition(false)
        } catch {
          pos = await requestDevicePosition(true)
        }
        const coords = formatCoordinates(pos.coords.latitude, pos.coords.longitude)
        query.value = coords
        await runLookup(coords)
        return
      } catch (geoError) {
        const code = geoError instanceof GeolocationPositionError ? geoError.code : -1
        if (code === 1) {
          error.value = '未获得定位权限。请在「系统设置 → 隐私与安全性 → 定位服务」中允许 Nexus Tools'
          return
        }
      }
    }

    const approximated = await tryApproximateFromIp()
    if (!approximated) {
      error.value = navigator.geolocation
        ? '无法获取 GPS 或 IP 位置，请手动输入经纬度'
        : '当前环境不支持定位，请手动输入经纬度'
    }
  } finally {
    loading.value = false
  }
}

function buildDetailsText(): string {
  if (!result.value) return ''
  const lines = [
    `坐标: ${coordinatesLine.value}`,
    `位置: ${locationLine.value}`,
    ...detailRows.value.map((row) => `${row.label}: ${row.value}`)
  ]
  return lines.join('\n')
}

function copySummary() {
  if (!result.value) return
  void copyWithToast(formatGeoLookupSummary(result.value), '已复制摘要')
}

function copyDetails() {
  const text = buildDetailsText()
  if (!text) return
  void copyWithToast(text, '已复制详情')
}

async function openMap() {
  if (!result.value) return
  const url = openStreetMapUrl(result.value.latitude, result.value.longitude)
  if (!import.meta.client) return
  if (window.nexusDesktop?.openExternal) {
    const ok = await window.nexusDesktop.openExternal(url)
    if (ok) return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

const { drain: drainGeoPrefill } = useConsumeToolPrefill(
  'geo',
  (text) => {
    const coords = extractCoordinatesFromText(text)
    if (coords) {
      query.value = formatCoordinates(coords.lat, coords.lng)
      void runLookup(query.value)
      return
    }
    query.value = text.trim()
    if (query.value) void runLookup(query.value)
  },
  { consumeOnMount: false }
)

onMounted(() => {
  drainGeoPrefill()
  inputRef.value?.focus()
})
</script>
