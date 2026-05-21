<template>
  <div class="max-w-4xl px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { to: '/', label: '首页' },
        { label: '正则测试' }
      ]"
    />

    <PageHero title="正则测试" compact show-icon>
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-cyan-100 flex items-center justify-center shadow-sm border border-cyan-100"
        >
          <van-icon name="search" size="24" class="text-cyan-600" />
        </div>
      </template>
      <p class="mt-2 doc-prose-muted text-sm max-w-2xl">在浏览器中用 JavaScript RegExp 试匹配，注意勿对不可信模式长时间运算。</p>
    </PageHero>

    <div class="space-y-4">
      <div class="flex flex-wrap gap-6">
        <label class="block flex-1 min-w-[200px]">
          <span class="block text-xs font-medium text-slate-600 mb-1">模式（body）</span>
          <input
            v-model="pattern"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
            placeholder="例如 \\d+"
          >
        </label>
        <fieldset class="border-0 p-0 m-0">
          <legend class="text-xs font-medium text-slate-600 mb-1">标志</legend>
          <div class="flex flex-wrap gap-3 text-sm">
            <label v-for="f in flagDefs" :key="f.k" class="inline-flex items-center gap-1.5">
              <input v-model="flags[f.k]" type="checkbox" class="rounded border-slate-300">
              <span>{{ f.label }}</span>
            </label>
          </div>
        </fieldset>
      </div>

      <label class="block">
        <span class="block text-xs font-medium text-slate-600 mb-1">待测文本</span>
        <textarea
          v-model="haystack"
          class="w-full min-h-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono shadow-sm"
          placeholder="在此粘贴文本…"
        />
      </label>

      <p v-if="reError" class="text-sm text-red-600">{{ reError }}</p>

      <div v-if="matches.length" class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
        <p class="font-medium text-slate-800 mb-2">匹配 {{ matches.length }} 处</p>
        <ul class="space-y-2 max-h-80 overflow-auto">
          <li
            v-for="(m, i) in matches"
            :key="i"
            class="rounded-lg bg-white border border-slate-100 px-3 py-2 font-mono text-xs break-all"
          >
            <div class="text-slate-500 mb-1">{{ m.index }}–{{ m.index + m[0].length }}</div>
            <div>{{ m[0] }}</div>
            <ul v-if="m.groups && Object.keys(m.groups).length" class="mt-1 text-emerald-800">
              <li v-for="(v, k) in m.groups" :key="k">{{ k }}: {{ v }}</li>
            </ul>
          </li>
        </ul>
      </div>
      <p v-else-if="!reError && haystack" class="text-sm text-slate-500">无匹配</p>
    </div>
  </div>
</template>

<script setup lang="ts">
type FlagKey = 'g' | 'i' | 'm' | 's' | 'u' | 'y'

const flagDefs: { k: FlagKey; label: string }[] = [
  { k: 'g', label: 'g 全局' },
  { k: 'i', label: 'i 忽略大小写' },
  { k: 'm', label: 'm 多行' },
  { k: 's', label: 's . 匹配换行' },
  { k: 'u', label: 'u Unicode' },
  { k: 'y', label: 'y 粘连' }
]

useHead({ title: '正则测试 - Nexus Tools' })

const pattern = ref('\\d+')
const haystack = ref('foo123 bar456')
const flags = reactive<Record<FlagKey, boolean>>({
  g: true,
  i: false,
  m: false,
  s: false,
  u: true,
  y: false
})

const reError = ref('')
const matches = ref<RegExpMatchArray[]>([])

function buildFlagString(): string {
  return (Object.keys(flags) as FlagKey[]).filter(k => flags[k]).join('')
}

watch(
  [pattern, haystack, () => ({ ...flags })],
  () => {
    reError.value = ''
    matches.value = []
    const body = pattern.value
    const fs = buildFlagString()
    if (!body) return
    let re: RegExp
    try {
      re = new RegExp(body, fs)
    } catch (e) {
      reError.value = e instanceof Error ? e.message : '无效的正则'
      return
    }
    if (!haystack.value) return
    try {
      if (flags.g) {
        const all = [...haystack.value.matchAll(re)]
        matches.value = all
      } else {
        const one = haystack.value.match(re)
        matches.value = one ? [one] : []
      }
    } catch (e) {
      reError.value = e instanceof Error ? e.message : '匹配失败'
    }
  },
  { immediate: true }
)
</script>
