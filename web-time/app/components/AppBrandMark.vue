<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'header' | 'auth'
  }>(),
  { variant: 'header' }
)
</script>

<template>
  <div
    class="shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 font-semibold text-white leading-none"
    :class="
      variant === 'auth'
        ? 'w-16 h-16 rounded-2xl text-2xl shadow-lg shadow-blue-500/30'
        : 'w-9 h-9 rounded-lg text-lg shadow-md shadow-indigo-500/25'
    "
  >
    N
  </div>
</template>
