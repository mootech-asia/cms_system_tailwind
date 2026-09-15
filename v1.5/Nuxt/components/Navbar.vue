<template lang="pug">
//- 手機版
header(v-if="hydrated && showNavbar" class="fixed top-0 z-[100] w-full h-16 bg-[#060C34] pt-4 pb-4 xl:hidden" :class="open ? 'bg-[#060C34CC]/80' : ''")
  div(class="w-full flex justify-between px-5")
    nuxtLink(to="/" class="block")
      NuxtImg(src="/images/index/img-logo.png" alt="logo" class="h-9 xl:w-[200px] xl:h-[74px]")
    button(type="button" class="w-9 h-9" @click="open = !open")
      NuxtImg(src="/images/icon/menu.svg" alt="menu" class="w-9 h-9")

transition(name="slide-down" class="xl:hidden")
  div(v-if="open" class="fixed left-0 right-0 top-[63px] z-[200] bg-[#060C34CC]/80 text-white")
    //- 上半部選單
    div(class="grid grid-cols-3 px-5 py-2 border-b border-white/30")
      button(v-for="item in topItems" :key="item.label" type="button" class="h-[57px] flex flex-col items-center justify-center gap-1 rounded-2xl" :class="{ 'bg-[#060C34]': activeKey === item.label }" @click="setActive(item)")
        span(v-if="activeKey === item.label" class="block w-6 h-6 icon-gradient" :style="{'--icon-url': `url(${item.icon})`}")
        NuxtImg(v-else :src="item.icon" :alt="item.label" class="block w-6 h-6")
        span(:class="['text-sm font-semibold leading-none', activeKey === item.label ? 'text-gradient-primary' : 'text-white']") {{ $t('navbar.top.' + item.tKey) }}
    
    //- 下半部選單
    div(class="flex flex-col")
      div(class="grid grid-cols-3 gap-y-6 px-5 py-2")
        button(v-for="item in bottomItems" :key="item.label" type="button" class="h-[57px] flex flex-col items-center justify-center gap-1 rounded-2xl" :class="{ 'bg-[#060C34]': activeKey === item.label }" @click="setActive(item)")
          span(v-if="activeKey === item.label" class="block w-6 h-6 icon-gradient" :style="{'--icon-url': `url(${item.icon})`}")
          NuxtImg(v-else :src="item.icon" :alt="item.label" class="block w-6 h-6")
          span(:class="['text-sm font-semibold leading-none', activeKey === item.label ? 'text-gradient-primary' : 'text-white']") {{ $t('navbar.bottom.' + item.tKey) }}

      //- UserInfo or Login
      div(v-if="userStore.profile" class="flex items-center justify-between py-4 px-7")
        div
          div(class="flex items-center gap-2")
            span(class="px-2 py-[2px] inline-flex items-center rounded-full bg-white text-[#060C34] text-sm font-bold") {{ `${userStore.profile.player_level_id}` }}
            span(class="text-white text-lg font-semibold") {{ userStore.profile.username }}
          p(class="text-yellow-300 text-sm font-semibold mt-1") {{ userStore.profile.balance }}
        button(type="button" class="p-2")
          NuxtImg(src="/images/icon/exit.svg" alt="go" class="w-6 h-6" @click="logout")
      div(v-else class="flex justify-center items-center gap-3 py-4 px-7")
        button(type="button" name="login" class="rounded-lg border-gradient-primary-mask py-2 px-4" @click="open = false; openAuth('login')")
          p(class="block w-full h-full rounded-full font-semibold text-gradient-primary") {{ $t('auth.login') }}
        button(type="button" name="register" class="rounded-lg border-gradient-primary-mask py-2 px-4" @click="open = false; openAuth('register')")
          p(class="block w-full h-full rounded-full font-semibold text-gradient-primary") {{ $t('auth.register') }}

//- PC
header(class="fixed top-0 z-[100] w-full hidden xl:block bg-[#060C34]")
  //- Navbar Links
  div(class="h-[132px] flex justify-between" :class="route.path.includes('/usercenter') ? 'px-10' : 'px-[96px] 3xl:px-[160px]'")
    div(class="flex items-center")
      NuxtImg(src="/images/index/img-logo.png" alt="logo" class="min-w-[200px] w-[200px] cursor-pointer" @click="router.push('/')")
    
    div(class="w-full h-full flex flex-col justify-between")
      div(class="flex justify-end gap-4 mt-2")
        div(v-if="userStore.profile" class="flex items-center")
          div(class="flex items-center relative group cursor-pointer")
            NuxtImg(src="/images/icon/user.svg" alt="user" class="w-5 h-5 mr-5")
            span(class="text-white cursor-pointer select-none hover:text-[#00D0FF]") ID: {{ userStore.profile.username }}
            div(class="absolute left-[-14px] top-full hidden group-hover:block z-[70]")
              div(class="rounded-lg bg-black/80 text-white ring-white/10 ring-1 w-max")
                button(v-for="opt in userMenu" :key="opt.labelKey" type="button" class="block text-left w-full rounded-lg hover:bg-neutral-700 whitespace-nowrap px-3 py-2" @click="router.push(opt.url)") {{ $t('userCenter.' + opt.labelKey) }}
          span(class="px-2 py-[2px] inline-flex items-center rounded-full bg-white text-[#1C378E] font-bold ml-2 mr-4") {{ `${userStore.profile.player_level_name}` }}
          div(class="flex flex-col leading-tight")
            div(class="flex text-sm")
              p(class="w-[60px] text-white/70 mr-2") {{ $t('navbar.balance') }}
              p(class="w-fit text-yellow-300") {{ userStore.profile.balance }}
            div(class="flex text-sm")
              p(class="w-[60px] text-white/70 mr-2") {{ $t('navbar.points') }}
              p(class="w-fit text-yellow-300") {{ userStore.profile.point_balance }}
          button(type="button" class="w-8 h-8 flex items-center justify-center ml-4" @click="logout")
            NuxtImg(src="/images/icon/exit.svg" alt="exit" class="w-5 h-5")
        div(v-if="!userStore.profile" class="flex justify-center items-center gap-4")
          button(type="button" name="login" class="box-border w-auto h-10 inline-flex items-center justify-center rounded-md text-white text-base font-normal border-[1px] border-white py-2 px-3 whitespace-nowrap"
            @click="openAuth('login')"
          ) {{ $t('auth.login') }}
          button(type="button" name="register" class="box-border w-auto h-10 inline-flex items-center justify-center rounded-md text-white text-base font-normal border-[1px] border-white py-2 px-3 whitespace-nowrap"
            @click="openAuth('register')"
          ) {{ $t('auth.register') }}
        LanguageSwitcher

      nav(class="flex justify-end whitespace-nowrap pb-4 gap-6")
        div(v-for="(item, index) in desktopNav" :key="item.label" class="relative group" )
          button(type="button" @click="setActivePC(item)" class="font-normal flex items-center gap-2" :class="activeKeyPC === item.label ? 'border-b-[1.3px] border-solid [border-image:linear-gradient(270deg,#F3AC2F_0%,#E528A5_100%)_1]': ''")
            //- span(v-if="activeKeyPC === item.label" class="block w-6 h-6 icon-gradient" :style="{'--icon-url': `url(${item.icon})`}")
            //- span(v-else class="block w-6 h-6 icon-gradient opacity-50 group-hover:opacity-100" :style="{'--icon-url': `url(${item.icon})`}")
            span(:class="activeKeyPC === item.label ? 'text-white' : 'text-white/50'" class="group-hover:text-white whitespace-nowrap text-sm pb-2") {{ $t('navbar.desktop.' + item.tKey) }}
          
          //- toggle links
          div(v-if="item.dropdowns" class="absolute top-full hidden group-hover:block z-[60]")
            div(class="rounded-lg bg-black/80 text-white ring-1 ring-white/10 w-max")
              button(v-for="opt in item.dropdowns" :key="opt" type="button" class="block text-left w-full p-2 hover:bg-neutral-700 whitespace-nowrap rounded-lg px-3 py-2"
                @click="router.push(opt.url)") {{ $t('navbar.dropdowns.' + opt) }}

  Login(v-model="showLogin" :initialMode="authMode")

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useAlertStore } from '~/stores/alert'
import { clearAuthState } from '~/composables/request/auth'
import { formatAmount } from '~/composables/useFormat'
import { api } from '~/composables/useApi'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const alert = useAlertStore()
const { t } = useI18n()

const open = ref(false)
const hydrated = ref(false)
const showLogin = ref(false)
const authMode = ref('login')

function openAuth(mode) {
  authMode.value = mode
  showLogin.value = true
}
const isHover = ref(false)
const isLoginHover = ref(false)
const isRegisterHover = ref(false)
const isLt1280 = ref(false)
const showNavbar = computed(
  () => !(route.path.toLowerCase().includes('usercenter') && isLt1280.value),
)

const username = 'Meaomeao'
const balance = '$1,000,000,000'
const points = '$1,000,000,000'

const topItems = [
  {
    label: 'Hot Games',
    tKey: 'hotGames',
    url: '/gameType?type=hotgames',
    icon: '/images/icon/hotGame.svg',
  },
  {
    label: 'Mini Games',
    tKey: 'miniGames',
    url: '/gameType?type=mini_game',
    icon: '/images/icon/miniGames.svg',
  },
  { label: 'Sports', tKey: 'sports', url: '/gameType?type=sports', icon: '/images/icon/sports.svg' },
  // { label: 'Poker', tKey: 'poker', url: '/gameType?type=poker_games', icon: '/images/icon/poker.svg' },
  // { label: 'Esports', tKey: 'esports', url: '/gameType?type=esports_games', icon: '/images/icon/esports.svg' },
  {
    label: 'Live Casino',
    tKey: 'liveCasino',
    url: '/gameType?type=live',
    icon: '/images/icon/liveCasino.svg',
  },
  // { label: 'Lottery', tKey: 'lottery', url: '/gameType?type=lottery_games', icon: '/images/icon/lottery.svg' },
  { label: 'Slots', tKey: 'slots', url: '/gameType?type=slot', icon: '/images/icon/slotGames.svg' },
  { label: 'Fish', tKey: 'fish', url: '/gameType?type=fish', icon: '/images/icon/fish.svg' },
]

const bottomItems = [
  // { label: 'Pointmall', tKey: 'pointmall', icon: '/images/icon/pointmall.svg' },
  {
    label: 'Withdrawal',
    tKey: 'withdrawal',
    url: '/usercenter/withdrawal',
    icon: '/images/icon/withdrawal.svg',
  },
  { label: 'Account', tKey: 'account', url: '/usercenter', icon: '/images/icon/accounts.svg' },
  // { label: 'Bonus', tKey: 'bonus', icon: '/images/icon/bonus.svg' },
  {
    label: 'Betting Records',
    tKey: 'bettingRecords',
    url: '/usercenter/bettingrecord',
    icon: '/images/icon/bettingRecord.svg',
  },
  // { label: 'Share', tKey: 'share', icon: '/images/icon/share.svg' },
]

const desktopNav = [
  { label: 'Home', tKey: 'home', url: '/', icon: '/images/icon/nav-home.svg' },
  { label: 'Hot Games', tKey: 'hotGames', url: '/gameType?type=hotgames', icon: '/images/icon/hotGame2.svg' },
  { label: 'Sports', tKey: 'sports', url: '/gameType?type=sports', dropdowns: [], icon: '/images/icon/sports.svg' },
  { label: 'Live', tKey: 'live', url: '/gameType?type=live', dropdowns: [], icon: '/images/index/hotGame/icon-Live2.png' },
  { label: 'Slots', tKey: 'slots', url: '/gameType?type=slot', icon: '/images/icon/slotGames.svg' },
  { label: 'Fish', tKey: 'fish', url: '/gameType?type=fish', icon: '/images/icon/fish.svg' },
  { label: 'Mini Games', tKey: 'miniGames', url: '/gameType?type=mini_game', icon: '/images/icon/miniGames.svg' },
  { label: 'Promotion', tKey: 'promotion', url: '/promotionlist', icon: '/images/icon/nav-promotion-logo.svg' },
  // { label: 'E-Sports', tKey: 'esports', url: '/gameType?type=esports_games', dropdowns: [] },
  // { label: 'Poker', tKey: 'poker', url: '/gameType?type=poker_games', dropdowns: [] },
  // { label: 'Lottery', tKey: 'lottery', url: '/gameType?type=lottery_games' },
  // { label: 'Points Mall', tKey: 'pointsMall', url: '/pointmall' },
]

const userMenu = [
  { labelKey: 'deposit', url: '/usercenter/deposit' },
  { labelKey: 'withdrawal', url: '/usercenter/withdrawal' },
  { labelKey: 'myAccount', url: '/usercenter' },
  // { label: 'Favorites', labelKey: 'favorites', url: '/usercenter/favorites' },
]

const activeKey = ref(null)
const activeKeyPC = ref(null)

function setActive(item) {
  if (
    !userStore.profile &&
    (item.tKey === 'withdrawal' || item.tKey === 'account' || item.tKey === 'bettingRecords')
  ) {
    open.value = false
    openAuth('login')
    return
  }
  activeKey.value = item.label
  open.value = false
  router.push(item.url)
}

function setActivePC(item) {
  activeKeyPC.value = item.label
  router.push(item.url)
}

function syncActiveKeyPC() {
  const p = route.path
  if (p === '/') {
    activeKeyPC.value = 'Home'
    return
  }
  if (p === '/gameType') {
    const t = String(route.query.type || '')
    activeKeyPC.value = desktopNav.find((it) => it.url === `/gameType?type=${t}`)?.label || ''
    return
  }
  if (p === '/gameList') {
    const t = String(route.query.type || '')
    activeKeyPC.value = desktopNav.find((it) => it.url === `/gameType?type=${t}`)?.label || ''
    return
  }
  const found = desktopNav.find((it) => (it.url || '').split('?')[0] === p)
  activeKeyPC.value = found ? found.label : ''
}

function setIsHover(payload) {
  isHover.value = payload
}

function updateIsLt1280() {
  const mq = window.matchMedia('(max-width: 1279.98px)')
  const update = () => {
    isLt1280.value = mq.matches
  }
  update()
  mq.addEventListener('change', update)
  onBeforeUnmount(() => mq.removeEventListener('change', update))
}

let timer
function pad(n) {
  return n.toString().padStart(2, '0')
}

onMounted(() => {
  hydrated.value = true
  syncActiveKeyPC()
  updateIsLt1280()
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

watch(
  () => route.fullPath,
  () => {
    syncActiveKeyPC()
  },
)

function onLogin(payload) {
  showLogin.value = false
}

async function logout() {
  try {
    await api.logout({ silent: true })
  } catch (error) {
    console.warn('Logout request failed, clearing local auth state instead.', error)
  } finally {
    clearAuthState(userStore)
    open.value = false
    navigateTo('/')
  }
}
</script>

<style scoped>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 150ms ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
