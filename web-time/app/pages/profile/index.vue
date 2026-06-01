<template>
  <div class="relative">
    <div v-if="loading" class="flex justify-center items-center py-24">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <template v-else-if="authed && user">
      <div class="px-4 py-4 space-y-4">
        <div class="doc-surface p-5">
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 border-2 border-white"
            >
              <van-icon name="user" size="32" class="text-white" />
            </div>
            <div class="min-w-0">
              <h2 class="font-sans text-lg font-semibold text-slate-900 truncate">{{ user.username }}</h2>
              <p class="text-slate-600 text-sm mt-1 truncate">{{ user.email }}</p>
            </div>
          </div>
        </div>

        <div class="doc-surface overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
            <h3 class="font-sans text-sm font-semibold text-slate-900">账号信息</h3>
          </div>
          <van-cell-group :border="false">
            <van-cell title="用户名" :value="user.username" icon="user-o" />
            <van-cell title="邮箱" :value="user.email" icon="envelop-o" />
            <van-cell
              title="昵称"
              :value="user.nickname || '未设置'"
              icon="user-circle-o"
              is-link
              clickable
              @click="openNicknameDialog"
            />
          </van-cell-group>
        </div>

        <div class="doc-surface overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
            <h3 class="font-sans text-sm font-semibold text-slate-900">更多</h3>
          </div>
          <van-cell-group :border="false">
            <van-cell title="生活卡片" icon="apps-o" is-link clickable :to="linkWithBack('/profile/cards')" />
            <van-cell title="记录标签" icon="label-o" is-link clickable :to="linkWithBack('/profile/tags')" />
          </van-cell-group>
          <div class="p-3 border-t border-slate-100 space-y-2">
            <van-button block plain type="default" @click="handleLogout">
              退出登录
            </van-button>
            <van-button block plain type="danger" @click="showDeleteConfirm = true">
              注销账号
            </van-button>
          </div>
        </div>
      </div>

      <van-dialog
        v-model:show="showDeleteConfirm"
        title="确认注销"
        message="注销后账号数据将无法恢复，确定要注销吗？"
        show-cancel-button
        @confirm="handleDeleteAccount"
      />

      <van-dialog
        v-model:show="showNicknameDialog"
        title="修改昵称"
        show-cancel-button
        confirm-button-text="保存"
        :before-close="beforeNicknameClose"
      >
        <van-field
          v-model="nicknameDraft"
          maxlength="50"
          placeholder="请输入昵称"
          clearable
          class="!pb-2"
        />
      </van-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import { forceAuthLogout } from '~/composables/useAuthRefresh'

useHead({
  title: '我的 · Nexus Time'
})

definePageMeta({
  middleware: 'require-auth'
})

const { user, deleteAccount, getCurrentUser, getAccessToken, logout, updateProfile } = useAuthApi()
const { sync: syncAuth, authed } = useAuthSession()
const { linkWithBack } = useBackNavigation()

const showDeleteConfirm = ref(false)
const showNicknameDialog = ref(false)
const nicknameDraft = ref('')
const loading = ref(true)

onMounted(async () => {
  await nextTick()
  syncAuth()
  if (!getAccessToken() || !authed.value) {
    loading.value = false
    return
  }
  try {
    const res = await getCurrentUser()
    if (res.code !== 200 || !res.data) {
      if (res.code === 401) {
        await forceAuthLogout('/profile')
      } else {
        await navigateTo('/auth/login?redirect=/profile')
      }
    }
  } catch {
    await forceAuthLogout('/profile')
  } finally {
    loading.value = false
  }
})

const openNicknameDialog = () => {
  nicknameDraft.value = user.value?.nickname ?? ''
  showNicknameDialog.value = true
}

const beforeNicknameClose = async (action: 'confirm' | 'cancel') => {
  if (action === 'cancel') return true

  const res = await updateProfile(nicknameDraft.value.trim())
  if (res.code !== 200) {
    showToast(res.message || '保存失败')
    return false
  }
  showToast('昵称已更新')
  return true
}

const handleLogout = async () => {
  await logout()
  await navigateTo('/manage/time')
}

const handleDeleteAccount = async () => {
  try {
    await deleteAccount()
    await navigateTo('/manage/time')
  } catch {
    // 错误处理
  }
}
</script>
