<template>
  <div class="doc-page-shell doc-page-gradient text-slate-900 min-h-screen flex flex-col">
    <a href="#main-content" class="doc-skip-link">跳到主内容</a>
    <AppHeader />
    <div class="flex flex-1 min-w-0 min-h-0">
      <WorkbenchSidebar />
      <div class="flex min-w-0 flex-1 flex-col">
        <WorkbenchTabs />
        <main
          id="main-content"
          class="flex-1 min-w-0 outline-none w-full"
          tabindex="-1"
        >
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
