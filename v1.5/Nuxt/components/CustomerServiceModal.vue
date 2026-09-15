<template lang="pug">
div(v-if="store.showCustomerServiceModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60")
  div(class="relative w-[90%] max-w-[360px] bg-white rounded-[10px] px-6 py-5 text-[#060C34]")
    button(type="button" class="absolute right-0 top-[-30px] w-5 h-5 inline-flex items-center justify-center rounded-full" @click="close")
      img(src="/images/icon/close-white.svg" class="min-w-6 h-6")
    p(class="text-center font-semibold mb-4") {{ t('userCenter.customerServiceModal.title') }}
    div(class="flex flex-col gap-3")
      button(type="button" class="w-full h-10 flex items-center gap-1 rounded-[8px] bg-gradient-primary text-sm font-semibold text-left px-4 text-[#060C34]" @click="openLiveChat")
        img(src="/images/icon/usercenter/service.svg")
        span {{ t('userCenter.customerServiceModal.liveChat') }}
      button(type="button" class="w-full h-10 flex items-center gap-1 rounded-[8px] bg-gradient-primary text-sm font-semibold text-left px-4 text-[#060C34]" @click="openPromoChannel")
        img(src="/images/icon/usercenter/telegram.svg")
        span {{ t('userCenter.customerServiceModal.promoRoom') }}
</template>

<script setup>
const store = useGlobalUiStore()
const { t } = useI18n()
const { openLiveChat } = useLiveChat()
const TELEGRAM_PROMO_CHANNEL_URL = 'https://t.me/win10096cs'

function close () {
  store.setShowCustomerServiceModal(false)
}

function openPromoChannel () {
  window.open(TELEGRAM_PROMO_CHANNEL_URL, '_blank', 'noopener,noreferrer')
}
</script>
