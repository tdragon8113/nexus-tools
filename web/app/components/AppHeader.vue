<template>
  <header class="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-100">
    <div class="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
      <NuxtLink to="/" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span class="text-white font-bold text-sm">N</span>
        </div>
        <span class="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Nexus Tools
        </span>
      </NuxtLink>
      <slot name="end">
        <nav class="flex items-center gap-3">
          <NuxtLink
            to="/auth/login"
            class="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
          >
            登录
          </NuxtLink>
          <NuxtLink
            to="/auth/register"
            class="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:opacity-90 transition-opacity"
          >
            注册
          </NuxtLink>
        </nav>
      </slot>
    </div>
  </header>
</template>
