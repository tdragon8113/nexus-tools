<template>
  <div class="totp-page desktop-tool-page relative flex h-full min-h-0 flex-col">
    <template v-if="!formVisible && !shareAccount">
      <div class="flex min-h-0 flex-1 flex-col px-1 pb-16 pt-1">
        <div
          v-if="liveRows.length > 0"
          class="flex min-h-0 flex-1 flex-col"
        >
          <div class="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
            <p class="min-w-0 text-xs tabular-nums text-slate-400">
              {{ hintText }}
            </p>
            <div
              class="flex shrink-0 items-center gap-1.5"
              :class="liveRows.length < 2 ? 'pointer-events-none opacity-50' : ''"
            >
              <span class="text-xs font-medium text-slate-600">排序</span>
              <DesktopSettingsToggle
                v-model="reorderMode"
                compact
                label="拖动排序"
                :disabled="liveRows.length < 2"
              />
            </div>
          </div>

          <div
            ref="listRef"
            :data-reorder="reorderEnabled ? 'on' : 'off'"
            class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1"
            :class="reorderEnabled ? 'rounded-2xl ring-2 ring-indigo-200/80 ring-offset-2 ring-offset-slate-50' : ''"
          >
            <TransitionGroup
              name="sort-list"
              tag="div"
              class="space-y-3"
              :class="[
                reorderEnabled ? 'sort-list--sortable' : '',
                isDragging ? 'sort-list--dragging' : ''
              ]"
            >
              <article
                v-for="(row, i) in displayRows"
                :key="row.account.id"
                :data-sort-id="row.account.id"
                :data-sort-idx="i"
                class="group relative"
              >
                <div
                  tabindex="0"
                  class="nexus-desktop-tile flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3.5 text-left shadow-sm transition active:scale-[0.995] hover:border-indigo-200 hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                  :class="[
                    reorderEnabled ? 'nexus-desktop-tile--sortable' : '',
                    isDragging && dragItemId === row.account.id
                      ? 'pointer-events-none opacity-35 scale-[0.99]'
                      : '',
                    !reorderMode && !row.code ? 'opacity-50' : ''
                  ]"
                  :aria-disabled="!reorderMode && !row.code"
                  @pointerdown="onItemPointerDown($event, i, { id: row.account.id, row })"
                  @click="onRowClick(row)"
                  @keydown.enter.prevent="onRowClick(row)"
                  @keydown.space.prevent="onRowClick(row)"
                >
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-inner"
                :style="{ backgroundColor: avatarColor(row.account) }"
                aria-hidden="true"
              >
                {{ avatarInitial(row.account) }}
              </div>

              <div class="min-w-0 flex-1">
                <p class="truncate text-[15px] font-semibold leading-tight text-slate-900">
                  {{ displayIssuer(row.account) }}
                </p>
                <p
                  v-if="displayAccount(row.account)"
                  class="mt-0.5 truncate text-xs text-slate-500"
                >
                  {{ displayAccount(row.account) }}
                </p>
              </div>

              <div class="flex shrink-0 items-center gap-3">
                <p
                  class="font-mono text-[1.75rem] font-semibold leading-none tabular-nums tracking-[0.12em] text-slate-900"
                  :class="{ 'opacity-40': row.remaining <= 5 }"
                >
                  {{ formatCode(row.code, row.account.digits) }}
                </p>

                <div
                  class="relative flex h-11 w-11 items-center justify-center"
                  aria-label="剩余秒数"
                >
                  <svg
                    class="absolute inset-0 -rotate-90"
                    viewBox="0 0 36 36"
                    aria-hidden="true"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      :r="timerRadius"
                      fill="none"
                      stroke="#e2e8f0"
                      stroke-width="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      :r="timerRadius"
                      fill="none"
                      stroke="#6366f1"
                      stroke-width="3"
                      stroke-linecap="round"
                      :stroke-dasharray="`${timerCircumference} ${timerCircumference}`"
                      :stroke-dashoffset="timerDashOffset(row)"
                      class="transition-[stroke-dashoffset] duration-1000 ease-linear"
                    />
                  </svg>
                  <span class="text-xs font-medium tabular-nums text-slate-600">
                    {{ row.remaining }}
                  </span>
                </div>
              </div>
                </div>

                <div
                  v-if="!reorderMode"
                  class="absolute -right-1 -top-1 z-10 flex gap-0.5 rounded-full border border-slate-200 bg-white p-0.5 opacity-0 shadow-sm pointer-events-none transition group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                >
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                aria-label="分享"
                @click.stop="openShare(row.account)"
              >
                <van-icon name="share-o" size="14" />
              </button>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                aria-label="编辑"
                @click.stop="openEditForm(row.account)"
              >
                <van-icon name="edit" size="14" />
              </button>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600"
                aria-label="删除"
                @click.stop="removeRow(row.account.id)"
              >
                <van-icon name="delete-o" size="14" />
              </button>
                </div>
              </article>
            </TransitionGroup>
          </div>
        </div>

        <div
          v-else
          class="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
            <van-icon name="certificate" size="32" class="text-indigo-500" />
          </div>
          <p class="text-base font-medium text-slate-800">
            暂无验证器账户
          </p>
          <p class="mt-1 max-w-xs text-sm text-slate-500">
            扫描或导入 otpauth 二维码，验证码会显示在这里
          </p>
        </div>
      </div>

      <button
        type="button"
        class="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-95"
        aria-label="新增账户"
        @click="openAddForm"
      >
        <van-icon name="plus" size="22" />
      </button>
    </template>

    <div
      v-else-if="formVisible"
      class="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          aria-label="返回"
          @click="closeForm"
        >
          <van-icon name="arrow-left" size="18" />
        </button>
        <p class="text-base font-semibold text-slate-900">
          {{ formMode === 'edit' ? '编辑账户' : '添加账户' }}
        </p>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="rounded-2xl border px-3 py-4 text-left transition"
            :class="tab === 'qr'
              ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300'"
            @click="tab = 'qr'"
          >
            <van-icon name="scan" size="22" class="text-indigo-600" />
            <p class="mt-2 text-sm font-medium text-slate-900">
              扫描二维码
            </p>
            <p class="mt-0.5 text-xs text-slate-500">
              从图片导入
            </p>
          </button>
          <button
            type="button"
            class="rounded-2xl border px-3 py-4 text-left transition"
            :class="tab === 'url'
              ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300'"
            @click="tab = 'url'"
          >
            <van-icon name="edit" size="22" class="text-indigo-600" />
            <p class="mt-2 text-sm font-medium text-slate-900">
              手动输入
            </p>
            <p class="mt-0.5 text-xs text-slate-500">
              链接或密钥
            </p>
          </button>
        </div>

        <div v-if="tab === 'qr'" class="mt-5">
          <input
            ref="fileRef"
            type="file"
            accept="image/*"
            class="sr-only"
            @change="onQrFile"
          >
          <button
            type="button"
            class="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 transition hover:border-indigo-300 hover:bg-indigo-50/40"
            @click="pickQrFile"
          >
            <van-icon name="photograph" size="28" class="text-slate-400" />
            <p class="mt-3 text-sm font-medium text-slate-800">
              选择二维码图片
            </p>
            <p class="mt-1 text-xs text-slate-500">
              支持 authenticator 设置页导出的二维码
            </p>
          </button>
        </div>

        <div v-else class="mt-5 space-y-3">
          <label class="block">
            <span class="mb-1.5 block text-xs font-medium text-slate-600">otpauth 链接或 Base32 密钥</span>
            <textarea
              v-model="draftText"
              class="min-h-[132px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="otpauth://totp/..."
              spellcheck="false"
              autocomplete="off"
              @input="onDraftChange"
            />
          </label>
        </div>

        <p v-if="parseError" class="mt-4 text-sm text-red-600">
          {{ parseError }}
        </p>
        <p v-if="nameError" class="mt-2 text-sm text-red-600">
          {{ nameError }}
        </p>

        <div v-if="draftConfig" class="mt-5 space-y-3">
          <p class="text-xs font-medium text-slate-600">
            显示名称
          </p>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-xs text-slate-500">服务名称</span>
              <input
                v-model="draftIssuer"
                type="text"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="如 阿里云"
                autocomplete="off"
                @input="onNameChange"
              >
            </label>
            <label class="block">
              <span class="mb-1 block text-xs text-slate-500">账户名称</span>
              <input
                v-model="draftLabel"
                type="text"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="如 user@email.com"
                autocomplete="off"
                @input="onNameChange"
              >
            </label>
          </div>
        </div>

        <div
          v-if="previewConfig"
          class="mt-4 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-3 py-3"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            :style="{ backgroundColor: avatarColorFromConfig(previewConfig) }"
          >
            {{ avatarInitialFromConfig(previewConfig) }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-slate-900">
              {{ displayIssuerFromConfig(previewConfig) }}
            </p>
            <p
              v-if="displayAccountFromConfig(previewConfig)"
              class="truncate text-xs text-slate-500"
            >
              {{ displayAccountFromConfig(previewConfig) }}
            </p>
          </div>
        </div>
      </div>

      <div class="border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          class="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40"
          :disabled="!canSaveDraft"
          @click="saveDraft"
        >
          {{ formMode === 'edit' ? '保存修改' : '保存账户' }}
        </button>
      </div>
    </div>

    <div
      v-else-if="shareAccount"
      class="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          aria-label="返回"
          @click="closeShare"
        >
          <van-icon name="arrow-left" size="18" />
        </button>
        <p class="text-base font-semibold text-slate-900">
          分享账户
        </p>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
        <div class="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            :style="{ backgroundColor: avatarColor(shareAccount) }"
          >
            {{ avatarInitial(shareAccount) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-slate-500">
              服务名称
            </p>
            <p class="truncate text-sm font-medium text-slate-900">
              {{ displayIssuer(shareAccount) }}
            </p>
            <p
              v-if="displayAccount(shareAccount)"
              class="mt-2 text-xs text-slate-500"
            >
              账户名称
            </p>
            <p
              v-if="displayAccount(shareAccount)"
              class="truncate text-sm text-slate-800"
            >
              {{ displayAccount(shareAccount) }}
            </p>
          </div>
        </div>

        <div class="mt-5 flex justify-center">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <img
              v-if="shareQrDataUrl"
              :src="shareQrDataUrl"
              alt="otpauth 二维码"
              class="h-52 w-52"
            >
            <div
              v-else
              class="flex h-52 w-52 items-center justify-center text-sm text-slate-400"
            >
              生成中…
            </div>
          </div>
        </div>

        <label class="mt-5 block">
          <span class="mb-1.5 block text-xs font-medium text-slate-600">otpauth 链接</span>
          <textarea
            :value="shareUrl"
            readonly
            class="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs leading-relaxed text-slate-700"
          />
        </label>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            @click="copyShareUrl"
          >
            复制链接
          </button>
          <button
            type="button"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-40"
            :disabled="!shareQrDataUrl"
            @click="downloadShareQr"
          >
            下载二维码
          </button>
        </div>

        <p class="mt-4 text-xs leading-relaxed text-slate-500">
          分享链接或二维码即可在其他设备导入此账户。请妥善保管，勿泄露给他人。
        </p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="ghostBox && dragGhostRow"
        class="sort-list-ghost flex w-full items-center gap-3 rounded-2xl border border-indigo-300 bg-white px-3.5 py-3.5 shadow-lg shadow-indigo-500/20"
        :style="{
          left: `${ghostBox.left}px`,
          top: `${ghostBox.top}px`,
          width: `${ghostBox.width}px`,
          height: `${ghostBox.height}px`
        }"
      >
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-inner"
          :style="{ backgroundColor: avatarColor(dragGhostRow.account) }"
        >
          {{ avatarInitial(dragGhostRow.account) }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[15px] font-semibold leading-tight text-slate-900">
            {{ displayIssuer(dragGhostRow.account) }}
          </p>
          <p
            v-if="displayAccount(dragGhostRow.account)"
            class="mt-0.5 truncate text-xs text-slate-500"
          >
            {{ displayAccount(dragGhostRow.account) }}
          </p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import jsQR from 'jsqr'
import QRCode from 'qrcode'
import { showToast } from 'vant'
import DesktopSettingsToggle from '~/components/DesktopSettingsToggle.vue'
import { copyWithToast } from '~/composables/useCopyText'
import { useConsumeToolPrefill } from '~/composables/useConsumeToolPrefill'
import { useTotpAccounts, type TotpAccountLive } from '~/composables/useTotpAccounts'
import {
  applyTotpDisplayNames,
  buildOtpAuthUrl,
  formatTotpCode,
  parseTotpInput,
  totpAvatarColor,
  totpAvatarInitial,
  totpDisplayAccount,
  totpDisplayIssuer,
  TOTP_TIMER_CIRCUMFERENCE,
  TOTP_TIMER_RADIUS,
  totpTimerDashOffset,
  type StoredTotpAccount,
  type TotpConfig
} from '~~/utils/totp'

useHead({ title: '2FA / TOTP - Nexus Tools' })

const {
  liveRows,
  loadAccounts,
  addAccount,
  updateAccount,
  removeAccount,
  setAccountOrder,
  hasDuplicate
} = useTotpAccounts()

type TotpSortItem = { id: string; row: TotpAccountLive }

const reorderMode = ref(false)
const listRef = ref<HTMLElement | null>(null)
const listLayout = ref<'list' | 'grid'>('list')

const reorderEnabled = computed(() => reorderMode.value && liveRows.value.length > 1)

const sortItems = computed<TotpSortItem[]>(() =>
  liveRows.value.map((row) => ({ id: row.account.id, row }))
)

const {
  isDragging,
  dragItemId,
  dragItem,
  ghostBox,
  displayItems,
  onItemPointerDown,
  shouldIgnoreClick
} = useDragSortList({
  enabled: reorderEnabled,
  immediate: reorderEnabled,
  items: sortItems,
  containerRef: listRef,
  layout: listLayout,
  onCommitOrder: setAccountOrder
})

const displayRows = computed(() =>
  reorderEnabled.value
    ? displayItems.value.map((item) => item.row)
    : liveRows.value
)

const dragGhostRow = computed(() => {
  const item = dragItem.value as TotpSortItem | null
  return item?.row ?? null
})

const hintText = computed(() => {
  const count = `${liveRows.value.length} 个账户`
  if (reorderMode.value && reorderEnabled.value) {
    return `${count} · 拖动调整顺序 · 点击不会复制验证码`
  }
  if (liveRows.value.length > 1) {
    return `${count} · 点击复制验证码 · 开启排序后可拖动`
  }
  return `${count} · 点击复制验证码`
})

type FormMode = 'add' | 'edit'

const formVisible = ref(false)
const formMode = ref<FormMode>('add')
const editingId = ref<string | null>(null)
const shareAccount = ref<StoredTotpAccount | null>(null)
const shareQrDataUrl = ref('')

const tab = ref<'url' | 'qr'>('qr')
const draftText = ref('')
const draftIssuer = ref('')
const draftLabel = ref('')
const draftConfig = ref<TotpConfig | null>(null)
const parseError = ref('')
const nameError = ref('')
const fileRef = ref<HTMLInputElement | null>(null)

const timerRadius = TOTP_TIMER_RADIUS
const timerCircumference = TOTP_TIMER_CIRCUMFERENCE

const previewConfig = computed(() => {
  if (!draftConfig.value) return null
  return applyTotpDisplayNames(draftConfig.value, {
    issuer: draftIssuer.value,
    label: draftLabel.value
  })
})

const canSaveDraft = computed(() => {
  if (!draftConfig.value || parseError.value) return false
  return Boolean(draftIssuer.value.trim() || draftLabel.value.trim())
})

const shareUrl = computed(() => (
  shareAccount.value ? buildOtpAuthUrl(shareAccount.value) : ''
))

function storedToPreviewConfig(account: StoredTotpAccount): TotpConfig {
  return {
    secret: new Uint8Array(0),
    label: account.label,
    issuer: account.issuer,
    digits: account.digits,
    period: account.period,
    algorithm: account.algorithm
  }
}

function displayIssuer(account: StoredTotpAccount) {
  return totpDisplayIssuer(storedToPreviewConfig(account))
}

function displayAccount(account: StoredTotpAccount) {
  return totpDisplayAccount(storedToPreviewConfig(account))
}

function displayIssuerFromConfig(config: TotpConfig) {
  return totpDisplayIssuer(config)
}

function displayAccountFromConfig(config: TotpConfig) {
  return totpDisplayAccount(config)
}

function avatarInitial(account: StoredTotpAccount) {
  return totpAvatarInitial(storedToPreviewConfig(account))
}

function avatarColor(account: StoredTotpAccount) {
  return totpAvatarColor(storedToPreviewConfig(account))
}

function avatarInitialFromConfig(config: TotpConfig) {
  return totpAvatarInitial(config)
}

function avatarColorFromConfig(config: TotpConfig) {
  return totpAvatarColor(config)
}

function formatCode(code: string, digits: number) {
  return formatTotpCode(code, digits)
}

function timerDashOffset(row: TotpAccountLive) {
  return totpTimerDashOffset(row.remaining, row.account.period, timerRadius)
}

function resetDraft() {
  draftText.value = ''
  draftIssuer.value = ''
  draftLabel.value = ''
  draftConfig.value = null
  parseError.value = ''
  nameError.value = ''
  if (fileRef.value) fileRef.value.value = ''
}

function syncNamesFromConfig(config: TotpConfig) {
  draftIssuer.value = config.issuer ?? ''
  draftLabel.value = config.label
}

function onNameChange() {
  nameError.value = ''
  if (!draftIssuer.value.trim() && !draftLabel.value.trim()) {
    nameError.value = '请填写服务名称或账户名称'
  }
}

function openAddForm() {
  formMode.value = 'add'
  editingId.value = null
  formVisible.value = true
  tab.value = 'qr'
  resetDraft()
}

function openEditForm(account: StoredTotpAccount) {
  formMode.value = 'edit'
  editingId.value = account.id
  formVisible.value = true
  tab.value = 'url'
  draftText.value = buildOtpAuthUrl(account)
  draftConfig.value = null
  parseError.value = ''
  nameError.value = ''
  syncNamesFromConfig(storedToPreviewConfig(account))
  onDraftChange()
}

function closeForm() {
  formVisible.value = false
  editingId.value = null
  resetDraft()
}

async function openShare(account: StoredTotpAccount) {
  shareAccount.value = account
  shareQrDataUrl.value = ''
  try {
    shareQrDataUrl.value = await QRCode.toDataURL(buildOtpAuthUrl(account), {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'M'
    })
  } catch {
    showToast('二维码生成失败')
  }
}

function closeShare() {
  shareAccount.value = null
  shareQrDataUrl.value = ''
}

function onDraftChange() {
  const trimmed = draftText.value.trim()
  if (!trimmed) {
    draftConfig.value = null
    parseError.value = ''
    return
  }

  const parsed = parseTotpInput(trimmed)
  if (!parsed.ok) {
    draftConfig.value = null
    parseError.value = parsed.error
    return
  }

  draftConfig.value = parsed.config
  syncNamesFromConfig(parsed.config)
  onNameChange()
  const exceptId = formMode.value === 'edit' ? editingId.value ?? undefined : undefined
  parseError.value = hasDuplicate(parsed.config, exceptId) ? '该账户已存在' : ''
}

function buildDraftForSave(): TotpConfig | null {
  if (!draftConfig.value) return null
  if (!canSaveDraft.value) {
    nameError.value = '请填写服务名称或账户名称'
    return null
  }
  return applyTotpDisplayNames(draftConfig.value, {
    issuer: draftIssuer.value,
    label: draftLabel.value
  })
}

function applyPrefill(raw: string) {
  openAddForm()
  tab.value = 'url'
  draftText.value = raw
  onDraftChange()
}

function saveDraft() {
  const config = buildDraftForSave()
  if (!config) return

  const exceptId = formMode.value === 'edit' ? editingId.value ?? undefined : undefined
  if (hasDuplicate(config, exceptId)) {
    parseError.value = '该账户已存在'
    return
  }

  if (formMode.value === 'edit' && editingId.value) {
    const ok = updateAccount(editingId.value, config)
    if (!ok) {
      parseError.value = '保存失败'
      return
    }
    showToast('已更新')
  } else {
    const ok = addAccount(config)
    if (!ok) {
      parseError.value = '保存失败'
      return
    }
    showToast('已保存')
  }

  closeForm()
}

function pickQrFile() {
  fileRef.value?.click()
}

async function onQrFile(ev: Event) {
  parseError.value = ''
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) {
    parseError.value = '无法读取图片'
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    parseError.value = 'Canvas 不可用'
    bitmap.close()
    return
  }
  ctx.drawImage(bitmap, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const qr = jsQR(imageData.data, imageData.width, imageData.height)
  bitmap.close()

  if (!qr?.data) {
    parseError.value = '未识别到二维码，换一张更清晰的图试试'
    return
  }

  tab.value = 'url'
  draftText.value = qr.data
  onDraftChange()
  if (draftConfig.value && !parseError.value && canSaveDraft.value) {
    saveDraft()
  }
}

function removeRow(id: string) {
  removeAccount(id)
  showToast('已删除')
}

async function onRowClick(row: TotpAccountLive) {
  if (reorderMode.value || shouldIgnoreClick()) return
  if (!row.code) return
  await copyRowCode(row)
}

async function copyRowCode(row: TotpAccountLive) {
  if (!row.code) return
  await copyWithToast(row.code, '验证码已复制')
}

async function copyShareUrl() {
  if (!shareUrl.value) return
  await copyWithToast(shareUrl.value, '链接已复制')
}

function downloadShareQr() {
  if (!shareQrDataUrl.value || !import.meta.client) return
  const a = document.createElement('a')
  a.href = shareQrDataUrl.value
  a.download = `${displayIssuer(shareAccount.value!)}-totp.png`.replace(/[^\w\u4e00-\u9fff-]+/g, '_')
  a.click()
}

useConsumeToolPrefill('totp', applyPrefill)

onMounted(() => {
  loadAccounts()
})
</script>

<style scoped>
.sort-list-move {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.sort-list--dragging .sort-list-move {
  transition-duration: 0.18s;
}

.sort-list--sortable .nexus-desktop-tile {
  touch-action: none;
  user-select: none;
}
</style>

<style>
.sort-list-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transform: scale(1.02);
}
</style>
