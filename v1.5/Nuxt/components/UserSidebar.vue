<template lang="pug">
nav(class="relative xl:fixed top-[124px] bottom-0 left-0 w-full xl:max-w-[260px] bg-white xl:bg-[#06123D] py-0 xl:py-[18px]")
  //- Mobile
  //- Overlay to block background scroll/clicks
  div(v-show="store.showMobileUserCenterNavbar" ref="overlayEl" class="xl:hidden fixed top-8 inset-0 z-10 bg-transparent" 
    @touchmove.prevent @wheel.prevent)
  //- Scrollable sidebar panel
  ul(class="block xl:hidden fixed top-8 bottom-0 overflow-y-scroll overscroll-contain w-full transition-[right] duration-200 ease-out z-20 bg-white"
    :class="store.showMobileUserCenterNavbar ? 'right-0' : '-right-[100vw]'")
    li(v-for="(item, idx) in visibleItems" :key="idx" class="px-6 py-1.5 group")
      button(type="button" class="w-full h-[35px] flex items-center text-[#060C34] gap-2  py-2.5 cursor-pointer select-none px-1 border-b border-white/15 bg-transparent"
        @click="item.id === 'customerService' ? store.setShowCustomerServiceModal(true) : (navigateTo(item.link), store.setShowMobileUserCenterNavbar(!store.showMobileUserCenterNavbar))")
        div(class="w-[30px] h-[30px] icon-gradient"
          :style="{ '--icon-url': `url(${item.icon})`, background: 'none rgb(6, 12, 52)' }")
        span(class="flex-1 bg-[#F4F4F4] text-left p-2 rounded-[10px]" :class="{ 'text-[#060C34]': item.id === activeIndex }" ) {{ t(item.labelKey) }}
    div(class="flex px-6 py-1.5 gap-2 group")
      button(class="flex-1 bg-[#060C34] text-white text-center font-bold p-2 rounded-[10px]" @click="router.push('/usercenter/deposit'); store.setShowMobileUserCenterNavbar(false)") {{ t('userCenter.deposit') }}
      button(class="flex-1 bg-[#060C34] text-white text-center font-bold p-2 rounded-[10px]" @click="router.push('/usercenter/withdrawal'); store.setShowMobileUserCenterNavbar(false)") {{ t('userCenter.withdrawal') }}

  //- PC
  ul(class="hidden xl:block")
    div(class="flex px-8 gap-3 group mb-4")
      button(class="btn-hover-primary-pill bg-transparent border-gradient-primary-mask text-center font-bold px-2.5 py-2 rounded-[10px] transition-all duration-200" @click="router.push('/usercenter/deposit'); store.setShowMobileUserCenterNavbar(false)")
        span(class="btn-hover-primary-pill-label text-gradient-primary") {{ t('userCenter.deposit') }}
      button(class="btn-hover-primary-pill bg-transparent border-gradient-primary-mask text-center font-bold px-2.5 py-2 rounded-[10px] transition-all duration-200" @click="router.push('/usercenter/withdrawal'); store.setShowMobileUserCenterNavbar(false)")
        span(class="btn-hover-primary-pill-label text-gradient-primary") {{ t('userCenter.withdrawal') }}
    li(v-for="(item, idx) in visibleItems" :key="idx" class="pl-8 pr-[30px] mb-4 group")
      button(type="button" class="user-sidebar-nav-item w-full h-[35px] flex items-center text-white gap-1 py-2.5 cursor-pointer select-none px-2 border-b border-white/15 bg-transparent rounded-[10px] transition-colors duration-200"
        :class="{ 'bg-gradient-primary border-0 rounded-[10px]': item.id === activeIndex }" @click="item.id === 'customerService' ? store.setShowCustomerServiceModal(true) : (activeIndex = item.id, navigateTo(item.link))")
        div(class="user-sidebar-nav-icon w-6 h-6 icon-gradient"
          :style="{ '--icon-url': `url(${item.icon})`, background: item.id === activeIndex ? '#060C34' : undefined, backgroundImage: item.id === activeIndex ? 'none' : undefined }")
        span(class="user-sidebar-nav-label font-semibold" :class="{ 'text-[#060C34]': item.id === activeIndex }" ) {{ t(item.labelKey) }}


</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const store = useGlobalUiStore()
const isXL = ref(false)
const activeIndex = ref(null)

const { t } = useI18n()

onMounted(() => {
  initMatchMedia()
  syncActiveByRoute()
})

function initMatchMedia() {
  const mq = window.matchMedia('(min-width: 1280px)')
  const update = () => {
    isXL.value = mq.matches
    if (isXL.value) store.setShowMobileUserCenterNavbar(false)
  }
  update()
  mq.addEventListener('change', update)
  onBeforeUnmount(() => mq.removeEventListener('change', update))
}

let scrollY = 0
function lockScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  scrollY = window.scrollY || window.pageYOffset || 0
  const body = document.body
  if (!body) return
  body.style.position = 'fixed'
  body.style.top = `-${scrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
}

function unlockScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const body = document.body
  if (!body) return
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  window.scrollTo(0, scrollY || 0)
}

watch(
  () => store.showMobileUserCenterNavbar,
  (val) => {
    if (isXL.value) return
    if (typeof window === 'undefined') return
    if (val) lockScroll()
    else unlockScroll()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  unlockScroll()
})

const items = [
  {
    id: 'gameLobby',
    labelKey: 'userCenter.sidebar.gameLobby',
    link: '/',
    icon: '/images/icon/usercenter/gameLobby.svg',
  },
  {
    id: 'accountOverview',
    labelKey: 'userCenter.sidebar.accountOverview',
    link: '/usercenter',
    icon: '/images/icon/usercenter/dashboard.svg',
  },
  // { label: 'Reward Center', link: '', icon: '/images/icon/usercenter/rewardCenter.svg' },
  {
    id: 'bettingRecord',
    labelKey: 'userCenter.sidebar.bettingRecord',
    link: '/usercenter/bettingrecord',
    icon: '/images/icon/usercenter/bettingRecord.svg',
  },
  {
    id: 'depositRecord',
    labelKey: 'userCenter.sidebar.depositRecord',
    link: '/usercenter/depositrecord',
    icon: '/images/icon/usercenter/depositRecord.svg',
  },
  {
    id: 'profitAndLoss',
    labelKey: 'userCenter.sidebar.profitAndLoss',
    link: '/usercenter/profitandloss',
    icon: '/images/icon/usercenter/profitAndLoss.svg',
  },
  {
    id: 'withdrawalRecord',
    labelKey: 'userCenter.sidebar.withdrawalRecord',
    link: '/usercenter/withdrawalrecord',
    icon: '/images/icon/usercenter/withdrawalRecord.svg',
  },
  {
    id: 'withdrawalDetail',
    labelKey: 'userCenter.sidebar.withdrawalDetail',
    link: '/usercenter/withdrawaldetail',
    icon: '/images/icon/usercenter/withdrawalDetail.svg',
  },
  {
    id: 'accountRecord',
    labelKey: 'userCenter.sidebar.accountRecord',
    link: '/usercenter/accountsrecord',
    icon: '/images/icon/usercenter/accountRecord.svg',
  },
  {
    id: 'personalInfo',
    labelKey: 'userCenter.sidebar.personalInfo',
    link: '/usercenter/personalinfo',
    icon: '/images/icon/usercenter/myAccount.svg',
  },
  {
    id: 'securityCenter',
    labelKey: 'userCenter.sidebar.securityCenter',
    link: '/usercenter/securitycenter',
    icon: '/images/icon/usercenter/securityCenter.svg',
  },
  // { label: 'Invite Friends', link: '', icon: '/images/icon/usercenter/inviteFriends.svg' },
  // { label: 'Mission', link: '', icon: '/images/icon/usercenter/mission.svg' },
  // { label: 'Points Mall', link: '', icon: '/images/icon/usercenter/points.svg' },
  // { label: 'Manual Rebate', link: '', icon: '/images/icon/usercenter/manualRebate.svg' },
  // { label: 'Internal Message', link: '', icon: '/images/icon/usercenter/internalMessage.svg' },
  {
    id: 'customerService',
    labelKey: 'userCenter.sidebar.customerService',
    link: '',
    icon: '/images/icon/usercenter/customerService.svg',
  },
  // { label: 'About Us', link: '', icon: '/images/icon/usercenter/about.svg' },
  // { label: 'Suggestion', link: '', icon: '/images/icon/usercenter/suggestion.svg' },
]

const visibleItems = computed(() => {
  return isXL.value ? items.filter((i) => i.id !== 'gameLobby') : items
})

const route = useRoute()
function syncActiveByRoute() {
  const p = route.path.toLowerCase()
  const list = visibleItems.value
  let match = null
  let maxLen = -1
  list.forEach((it) => {
    if (!it.link) return
    const link = it.link.toLowerCase()
    if (p.startsWith(link) && link.length > maxLen) {
      maxLen = link.length
      match = it
    }
  })
  if (!match) match = list.find((it) => it.link === '/usercenter') || list[0]
  activeIndex.value = match ? match.id : null
}

watch(
  () => [route.fullPath, isXL.value],
  () => {
    syncActiveByRoute()
  },
  { immediate: true },
)
</script>
