<template lang="pug">
main(class="bg-[#060C34] pt-16 xl:pt-[128px]")
  div(class="px-5 pt-4 xl:px-[96px] 3xl:px-[160px] flex items-center cursor-pointer" @click="navigateTo('/promotionlist')")
    NuxtImg(src="/images/icon/back-white.svg" alt="Back White" class="w-[16px] h-[16px]")
    p(class="xl:text-[20px] font-bold text-white") {{ $t('common.back') }}
  PromotionDetail
</template>
