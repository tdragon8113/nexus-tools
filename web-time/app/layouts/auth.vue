<template>
  <div
    class="doc-page-shell doc-page-gradient min-h-screen flex flex-col items-center justify-center px-4 pt-[env(safe-area-inset-top,0px)] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] text-slate-900"
  >
    <a href="#main-content" class="doc-skip-link">跳到主内容</a>
    <main id="main-content" class="w-full max-w-md flex flex-col outline-none" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
