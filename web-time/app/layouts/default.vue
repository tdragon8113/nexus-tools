<template>
  <div class="doc-page-shell doc-page-gradient text-slate-900 min-h-screen flex flex-col">
    <a href="#main-content" class="doc-skip-link">跳到主内容</a>
    <AppHeader />
    <main
      id="main-content"
      class="flex-1 min-w-0 w-full outline-none pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]"
      tabindex="-1"
    >
      <slot />
    </main>
    <MobileTabBar />
  </div>
</template>
