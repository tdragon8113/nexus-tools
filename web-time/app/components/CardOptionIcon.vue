<template>
  <div
    class="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
    :class="[
      LIFE_CARD_COLORS[card.color].bg,
      muted ? 'opacity-60' : ''
    ]"
  >
    <van-icon
      :name="card.icon"
      size="16"
      :class="LIFE_CARD_COLORS[card.color].text"
    />
  </div>
</template>

<script setup lang="ts">
import { LIFE_CARD_COLORS, type LifeCard } from '~/composables/useLifeCards'

defineProps<{
  card: LifeCard
  muted?: boolean
}>()
</script>
