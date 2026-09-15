<template lang="pug">
main(class="bg-[#060C34]")
  PromotionModal
  Banner
  Marquee
  HotGame
  GameType
  Promotion
</template>
<script setup>
import { onMounted } from 'vue'
import { usePlatformData } from '~/composables/usePlatformData'

const { initPlatformData } = usePlatformData()

onMounted(() => {
  initPlatformData({
    announcements: true,
    games: true,
    vendors: true,
    favorites: true,
  })
})
</script>
