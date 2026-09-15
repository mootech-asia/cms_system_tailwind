<template lang="pug">
section(class="min-h-[calc(100vh-397px)] xl:min-h-[calc(100vh-299px)] py-4 px-5 xl:px-[96px] xl:py-14 3xl:px-[160px]")
  h1(class="w-[127px] xl:w-[172px] text-xl xl:text-[28px] text-gradient-primary font-bold pb-2") {{ $t('navbar.desktop.promotion') }}
  div(class="detail-content max-w-[800px] text-white m-auto" v-html="promotionData?.content")
</template>
<script setup>
import { api } from '~/composables/useApi'

const route = useRoute()

const promotionData = ref(null)

onMounted(() => {
  getPromotionDetail()
})

async function getPromotionDetail() {
  try {
    const { data } = await api.getPromotionDetail({
      promotion_id: route.query.id,
    })
    promotionData.value = data
  } catch (error) {
    console.error('failed to get promotion detail:', error)
  }
}
</script>
<style scoped>
.detail-content :deep(img) {
  width: 100%;
}
</style>