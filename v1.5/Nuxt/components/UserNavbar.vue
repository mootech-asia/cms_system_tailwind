<template lang="pug">
header(class="sticky top-0 w-full h-8 z-50 bg-white xl:hidden")
  div(class="flex justify-between items-center h-full px-4")
    div(class="justify-self-end w-8 h-8")
    h1(class="text-[#060C34] text-xl text-center") {{ currentTitle }}
    button(type="button" class="justify-self-end w-8 h-8 flex items-center justify-center" @click="toggleMenu" aria-label="Toggle menu")
      svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 text-[#060C34]")
        g(fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round")
          line(x1="5" y1="6" x2="19" y2="6" :class="[store.showMobileUserCenterNavbar ? 'translate-y-[6px] rotate-45' : '', 'transform transition-transform duration-200 origin-center [transform-box:fill-box] [vector-effect:non-scaling-stroke]']")
          line(x1="5" y1="12" x2="19" y2="12" :class="[store.showMobileUserCenterNavbar ? 'opacity-0' : 'opacity-100', 'transition-opacity duration-200 origin-center [vector-effect:non-scaling-stroke]']")
          line(x1="5" y1="18" x2="19" y2="18" :class="[store.showMobileUserCenterNavbar ? '-translate-y-[6px] -rotate-45' : '', 'transform transition-transform duration-200 origin-center [transform-box:fill-box] [vector-effect:non-scaling-stroke]']")
</template>
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
const store = useGlobalUiStore()
const { t } = useI18n()
const route = useRoute()

function toggleMenu() {
  store.setShowMobileUserCenterNavbar(!store.showMobileUserCenterNavbar)
}

const webTitle = computed(() => [
  { label: t('userCenter.accountOverview'), link: '/usercenter' },
  { label: t('userCenter.deposit'), link: '/usercenter/deposit' },
  { label: t('userCenter.withdrawal'), link: '/usercenter/withdrawal' },
  { label: t('userCenter.depositRecord'), link: '/usercenter/depositrecord' },
  { label: t('userCenter.withdrawalRecord.title'), link: '/usercenter/withdrawalrecord' },
  { label: t('userCenter.withdrawalDetailPage.title'), link: '/usercenter/withdrawaldetail' },
  { label: t('userCenter.bettingRecord'), link: '/usercenter/bettingrecord' },
  { label: t('userCenter.profitAndLoss'), link: '/usercenter/profitandloss' },
  { label: t('userCenter.accountsRecord'), link: '/usercenter/accountsrecord' },
  { label: t('userCenter.bankingDetails'), link: '/usercenter/bankingdetails' },
  { label: t('userCenter.personalInfo'), link: '/usercenter/personalinfo' },
  { label: t('userCenter.securityCenter'), link: '/usercenter/securitycenter' },
  {
    label: t('userCenter.changePassword.changeLogin'),
    link: '/usercenter/changepassword?type=lgps',
  },
  {
    label: t('userCenter.changePassword.changeTransaction'),
    link: '/usercenter/changepassword?type=tsps',
  },
  { label: t('userCenter.withdrawalInfo'), link: '/usercenter/transactioninfo?type=withdrawal' },
  { label: t('userCenter.depositInfo'), link: '/usercenter/transactioninfo?type=deposit' },
])

const currentTitle = computed(() => {
  if (route.path.startsWith('/usercenter/changepassword')) {
    const type = route.query.type
    if (type === 'lgps') return t('userCenter.changePassword.changeLogin')
    if (type === 'tsps') return t('userCenter.changePassword.changeTransaction')
  }
  if (route.path.startsWith('/usercenter/transactioninfo')) {
    const type = route.query.type
    if (type === 'withdrawal') return t('userCenter.withdrawalInfo')
    if (type === 'deposit') return t('userCenter.depositInfo')
  }
  const found = webTitle.value.find((i) => i.link === route.path)
  return found?.label || ''
})
</script>
