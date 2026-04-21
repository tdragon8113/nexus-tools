<template>
  <div class="doc-page-gradient flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <div
          class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30"
        >
          <span class="font-display font-semibold text-2xl text-white leading-none">N</span>
        </div>
        <p class="doc-eyebrow mb-3">账号</p>
        <h1 class="font-display text-2xl sm:text-3xl font-semibold text-slate-900">创建账号</h1>
        <p class="text-slate-600 mt-2 text-sm sm:text-base">注册后即可使用个人中心与后续同步能力。</p>
      </div>

      <div class="doc-surface p-6 sm:p-8 rounded-lg">
        <div v-if="errorMessage" class="mb-4 p-3 rounded-md bg-red-50 border border-red-100 text-red-700 text-sm text-center">
          {{ errorMessage }}
        </div>

        <van-form @submit="handleRegister">
          <van-cell-group inset class="!mx-0">
            <van-field
              v-model="form.username"
              name="username"
              placeholder="用户名"
              left-icon="user-o"
              :rules="[{ required: true, message: '请输入用户名' }]"
            />
            <van-field
              v-model="form.email"
              name="email"
              placeholder="邮箱"
              left-icon="envelop-o"
              :rules="[
                { required: true, message: '请输入邮箱' },
                { pattern: emailPattern, message: '邮箱格式不正确' }
              ]"
            />
            <van-field
              v-model="form.password"
              type="password"
              name="password"
              placeholder="密码（至少 6 位）"
              left-icon="lock"
              :rules="[
                { required: true, message: '请输入密码' },
                { pattern: /^.{6,}$/, message: '密码至少6位' }
              ]"
            />
            <van-field
              v-model="form.confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="再次输入密码"
              left-icon="lock"
              :rules="[
                { required: true, message: '请确认密码' },
                { validator: validateConfirmPassword, message: '两次密码不一致' }
              ]"
            />
          </van-cell-group>

          <div class="mt-6">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="loading"
              class="!bg-gradient-to-r !from-blue-500 !to-purple-600 !border-0"
            >
              注册
            </van-button>
          </div>
        </van-form>

        <div class="mt-6 text-center text-sm">
          <NuxtLink to="/auth/login" class="text-blue-600 font-medium hover:underline underline-offset-2">
            已有账号？去登录
          </NuxtLink>
        </div>
      </div>

      <div class="text-center mt-8">
        <NuxtLink to="/" class="text-sm text-slate-500 hover:text-slate-800 transition-colors">
          ← 返回首页
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const { register } = useAuthApi()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const errorMessage = ref('')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateConfirmPassword = (val: string) => val === form.password

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await register(form.username, form.email, form.password)
    if (response.code === 200) {
      await navigateTo('/auth/login')
    } else {
      errorMessage.value = response.message || '注册失败'
    }
  } catch (error) {
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
