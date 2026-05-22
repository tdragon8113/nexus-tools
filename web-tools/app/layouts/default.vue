<template>
  <div class="doc-page-shell doc-page-gradient flex min-h-screen flex-col text-slate-900">
    <a href="#main-content" class="doc-skip-link">跳到主内容</a>
    <AppHeader />
    <main
      id="main-content"
      class="min-h-0 w-full min-w-0 flex-1 outline-none"
      tabindex="-1"
    >
      <slot />
    </main>
  </div>
</template>
