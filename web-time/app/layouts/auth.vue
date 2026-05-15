<template>
  <div
    class="doc-page-shell doc-page-gradient min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:p-6 text-slate-900"
  >
    <a href="#main-content" class="doc-skip-link">跳到主内容</a>
    <main
      id="main-content"
      class="w-full max-w-md flex flex-col outline-none"
      tabindex="-1"
    >
      <slot />
    </main>
  </div>
</template>
