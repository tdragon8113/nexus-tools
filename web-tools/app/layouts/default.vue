<template>
  <div class="doc-page-shell doc-page-gradient text-slate-900 min-h-screen flex flex-col">
    <a href="#main-content" class="doc-skip-link">跳到主内容</a>
    <AppHeader />
    <WorkbenchMobileNav />
    <div class="flex flex-1 min-w-0 min-h-0">
      <WorkbenchSidebar />
      <main
        id="main-content"
        class="flex-1 min-w-0 outline-none w-full"
        tabindex="-1"
      >
        <slot />
      </main>
    </div>
    <footer class="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
      <p>© 2026 Nexus Tools</p>
    </footer>
  </div>
</template>
