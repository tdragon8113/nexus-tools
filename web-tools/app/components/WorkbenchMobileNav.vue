<template>
  <div
    class="lg:hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-sm px-2 py-2"
  >
    <nav
      class="flex gap-1 overflow-x-auto text-sm whitespace-nowrap pb-0.5"
      aria-label="快捷导航"
    >
      <NuxtLink
        to="/"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        首页
      </NuxtLink>
      <NuxtLink
        to="/tools/json"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        JSON
      </NuxtLink>
      <NuxtLink
        to="/tools/base64"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        Base64
      </NuxtLink>
      <NuxtLink
        to="/tools/timestamp"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        时间戳
      </NuxtLink>
      <NuxtLink
        to="/tools/url"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        URL
      </NuxtLink>
      <NuxtLink
        to="/tools/uuid"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        UUID
      </NuxtLink>
      <NuxtLink
        to="/tools/password"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        密码
      </NuxtLink>
      <NuxtLink
        to="/tools/calculator"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        计算
      </NuxtLink>
      <NuxtLink
        to="/tools/qrcode"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        二维码
      </NuxtLink>
      <NuxtLink
        to="/tools/color"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        颜色
      </NuxtLink>
      <NuxtLink
        to="/tools/regex"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        正则
      </NuxtLink>
      <NuxtLink
        to="/tools/http"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        HTTP
      </NuxtLink>
      <NuxtLink
        to="/tools/hash"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        哈希
      </NuxtLink>
      <NuxtLink
        to="/tools/code"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        格式化
      </NuxtLink>
    </nav>
  </div>
</template>
