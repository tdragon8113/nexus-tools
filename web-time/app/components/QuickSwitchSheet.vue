<template>
  <van-popup
    v-model:show="open"
    round
    position="bottom"
    safe-area-inset-bottom
    :style="{ maxHeight: '85vh' }"
    @closed="resetPick"
  >
    <div class="flex max-h-[85vh] flex-col">
      <div class="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-indigo-600">{{ headerTitle }}</p>
            <p v-if="isSwitch && sessionTitle" class="mt-0.5 truncate text-sm text-slate-500">
              当前 · {{ sessionTitle }}
              <span class="tabular-nums">· {{ elapsedLabel }}</span>
            </p>
            <p v-else-if="!isSwitch" class="mt-0.5 text-sm text-slate-500">
              选择要记录的生活片段
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-500 active:bg-slate-100"
            @click="closeSheet"
          >
            关闭
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div v-if="loading" class="py-10 flex justify-center">
          <van-loading size="24px" />
        </div>

        <template v-else>
        <div>
          <p class="mb-2 text-xs font-medium text-slate-500">选择分类</p>
          <div class="grid grid-cols-4 gap-2">
            <LifeCardTile
              v-for="card in cards"
              :key="card.id"
              :card="card"
              compact
              :selected="selectedParentId === card.id"
              :muted="isSwitch && isCurrentCard(card.id)"
              :badge="isSwitch && isCurrentCard(card.id) ? '当前' : undefined"
              :saving="saving"
              @select="selectParent"
            />
          </div>
        </div>

        <div v-if="selectedParent?.children?.length">
          <p class="mb-2 text-xs font-medium text-slate-500">具体事项</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="child in selectedParent.children"
              :key="child.id"
              type="button"
              class="rounded-full border px-3 py-1.5 text-sm transition-colors active:scale-[0.98] disabled:opacity-50"
              :class="selectedChildId === child.id
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-700'"
              :disabled="saving"
              @click="selectChild(child.id)"
            >
              {{ child.label }}
            </button>
          </div>
        </div>
        </template>
      </div>

      <div class="shrink-0 space-y-2 border-t border-slate-100 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <van-button
          round
          block
          type="primary"
          class="!border-0 !bg-indigo-600"
          :loading="saving"
          :disabled="!canConfirm"
          @click="confirmPrimary"
        >
          {{ confirmLabel }}
        </van-button>

        <template v-if="isSwitch">
          <van-button
            round
            block
            plain
            type="default"
            :loading="saving"
            @click="confirmEndOnly"
          >
            仅结束当前记录
          </van-button>

          <button
            type="button"
            class="w-full py-2 text-center text-sm text-indigo-600 active:opacity-70"
            @click="goWriteSummary"
          >
            先写总结再切换
          </button>
        </template>

        <NuxtLink
          v-else
          :to="linkWithBack('/profile/cards')"
          class="block py-2 text-center text-sm text-indigo-600 active:opacity-70"
          @click="closeSheet"
        >
          管理生活卡片
        </NuxtLink>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import { type LifeCard, useLifeCards, writeLastLifePick } from '~/composables/useLifeCards'
import { useActiveSession } from '~/composables/useActiveSession'
import { useQuickSwitch } from '~/composables/useQuickSwitch'
import { useSegmentActions } from '~/composables/useSegmentActions'
import { formatDuration } from '~/utils/time'

const { open, mode, closeSheet } = useQuickSwitch()
const { cards, load, getCard, getChild, getRecordTitle, loading } = useLifeCards()
const {
  session,
  sessionTitle,
  elapsedSeconds
} = useActiveSession()
const { saving, startSegment, quickSwitch, endCurrentOnly } = useSegmentActions()
const { linkWithBack, navigateWithBack } = useBackNavigation()

const selectedParentId = ref('')
const selectedChildId = ref<string | undefined>()

const isSwitch = computed(() => mode.value === 'switch')
const headerTitle = computed(() => (isSwitch.value ? '切换下一段' : '开始记录'))
const elapsedLabel = computed(() => formatDuration(elapsedSeconds.value))

const selectedParent = computed(() =>
  selectedParentId.value ? getCard(selectedParentId.value) : undefined
)

const canConfirm = computed(() => {
  if (!selectedParentId.value || saving.value) return false
  const parent = selectedParent.value
  if (!parent) return false
  if (!parent.children?.length) return true
  return Boolean(selectedChildId.value)
})

const confirmLabel = computed(() => {
  if (!canConfirm.value) {
    return isSwitch.value ? '选择下一段' : '选择后开始'
  }
  const parent = selectedParent.value!
  const child = selectedChildId.value
    ? getChild(parent.id, selectedChildId.value)
    : undefined
  const title = getRecordTitle(parent.id, child?.id)
  return isSwitch.value ? `结束并开始 · ${title}` : `开始 · ${title}`
})

watch(open, (visible) => {
  if (visible) {
    void load()
    resetPick()
  }
})

function isCurrentCard (parentId: string) {
  return session.value?.parentId === parentId
}

function resetPick () {
  selectedParentId.value = ''
  selectedChildId.value = undefined
}

function selectParent (card: LifeCard) {
  selectedParentId.value = card.id
  selectedChildId.value = undefined
}

function selectChild (childId: string) {
  selectedChildId.value = childId
}

function resolvePayload () {
  const parent = selectedParent.value
  if (!parent) return null
  const child = selectedChildId.value
    ? getChild(parent.id, selectedChildId.value)
    : undefined
  if (parent.children?.length && !child) return null
  return { parent, child }
}

function rememberPick (parent: LifeCard, child?: { id: string, label: string }) {
  writeLastLifePick({
    parentId: parent.id,
    childId: child?.id
  })
}

async function confirmPrimary () {
  const payload = resolvePayload()
  if (!payload) {
    showToast(isSwitch.value ? '请选择下一段' : '请选择要记录的内容')
    return
  }

  rememberPick(payload.parent, payload.child)

  const ok = isSwitch.value
    ? await quickSwitch(payload.parent, payload.child)
    : await startSegment(payload.parent, payload.child)

  if (ok) closeSheet()
}

async function confirmEndOnly () {
  const ok = await endCurrentOnly({})
  if (ok) closeSheet()
}

function goWriteSummary () {
  closeSheet()
  void navigateWithBack('/manage/time/edit')
}
</script>
