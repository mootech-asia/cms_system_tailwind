<template lang="pug">
section
  div(v-for="(gameType, gameIndex) in gameTypes" :key="gameType.id")
    div(class="relative w-full px-5 sm:px-6 lg:px-[96px] 3xl:px-[160px]")
      div(class="flex items-end justify-between border-b-gradient-primary pb-3 mt-4")
        div(class="flex items-center gap-2 cursor-pointer" @click="linkToGameType(gameType)")
          NuxtImg(v-if="gameType.icon" :src="gameType.icon" class="w-6 h-6 xl:w-6 xl:h-6" :alt="$t('gameType.types.' + gameType.tKey)")
          h2(class="text-gradient-primary font-normal xl:text-xl") {{ $t('gameType.types.' + gameType.tKey) }}
        div(class="flex items-center gap-3")
          button(type="button" class="text-white/70 hover:text-white xl:font-semibold text-sm xl:text-base" @click="linkToGameType(gameType)") {{ $t('hotGame.seeAll') }}
          button(type="button" class="hidden md:flex"
            :class="showPrev[gameIndex] ? 'hover:opacity-90' : 'cursor-not-allowed'"
            :disabled="!showPrev[gameIndex]"
            @click="scrollPrev(gameIndex)")
            NuxtImg(:src="showPrev[gameIndex] ? '/images/icon/arrow-right2.svg' : '/images/icon/arrow-left2.svg'"
              :class="['w-5 h-5', showPrev[gameIndex] ? 'rotate-180' : '']" alt="prev")
          button(type="button" class="hidden md:flex"
            :class="showNext[gameIndex] ? 'hover:opacity-90' : 'cursor-not-allowed'"
            :disabled="!showNext[gameIndex]"
            @click="scrollNext(gameIndex)")
            NuxtImg(:src="showNext[gameIndex] ? '/images/icon/arrow-right2.svg' : '/images/icon/arrow-left2.svg'"
              :class="['w-5 h-5', showNext[gameIndex] ? '' : 'rotate-180']" alt="next")

      div(class="relative mt-4 xl:mt-7")
        //- Live Casino (>= 1920: 2 大 + 小圖橫向滑動)
        //- div(v-if="gameType.tKey === 'liveCasino' && isWide" class="w-full mb-10")
        //-   div(class="grid grid-cols-4 gap-6 mb-6")
        //-     div(
        //-       v-for="(game, gIdx) in gameType.gameList.slice(0, 2)"
        //-       :key="`${game.game_id || game.id || game.vendor}-big-${gIdx}`"
        //-       class="relative col-span-2 rounded-3xl overflow-hidden cursor-pointer group"
        //-       @click="openGame(game, gameType.tKey)")
        //-         LiveGameCard(size="big" :fgSrc="`/images/index/mainGame/live/live_${gIdx%33}.webp`" :nameSrc="getGameNameImageSrc(game)" fgClass="h-[550px] right-3.5")
        //-   div(:ref="el => setScrollerRef(gameIndex, el)" class="w-full flex overflow-y-hidden overflow-x-auto no-scrollbar gap-2 xl:gap-4 mb-4 xl:mb-10")
        //-     div(v-for="(game, idx) in gameType.gameList.slice(2)" :key="`${game.game_id || game.id || game.vendor}-small-${idx}`" class="relative cursor-pointer group" @click="openGame(game, gameType.tKey)")
        //-       LiveGameCard(:fgSrc="`/images/index/mainGame/live/live_${idx+2}.webp`" :nameSrc="getGameNameImageSrc(game)")

        //- Live Casino (< 1920: 一排橫向)
        div(v-if="gameType.tKey === 'liveCasino'" :ref="el => setScrollerRef(gameIndex, el)" class="w-full flex overflow-y-hidden overflow-x-auto no-scrollbar gap-2 xl:gap-[28px] mb-4 xl:mb-10")
          div(v-for="(game, idx) in gameType.gameList" :key="`${game.game_id || game.id}-${idx}`" class="relative cursor-pointer group" @click="openGame(game, gameType.tKey)")
            LiveGameCard(:fgSrc="''" :bgSrc="'/images/index/mainGame/main_card_bg.png'" :nameSrc="getGameNameImageSrc(game)")

        //- Live Sports (>= 1920:  1 大 + 2小圖)
        //- div(v-else-if="gameType.tKey === 'liveSports' && isWide" :ref="el => setScrollerRef(gameIndex, el)" class="w-full overflow-y-hidden overflow-x-auto no-scrollbar gap-2 xl:gap-[28px] mb-4 xl:mb-10")
        //-   div(v-if="gameType.gameList && gameType.gameList.length > 0" class="relative cursor-pointer group mb-4" @click="openGame(gameType.gameList[0], gameType.tKey)")
        //-     LiveGameCard(
        //-       size="wide"
        //-       bgSrc="/images/index/mainGame/img-sport-bg-big.webp"
        //-       fgSrcLeft="/images/index/mainGame/live/live_sport_left.png"
        //-       fgSrc="/images/index/mainGame/live/live_sport_right.png"
        //-       fgClassLeft="h-full bottom-0 -left-4 md:-left-0"
        //-       fgClass="h-full bottom-0 -right-4 md:-right-0"
        //-       :nameSrc="getGameNameImageSrc(gameType.gameList[0])"
        //-       nameClass="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] md:w-[30%] pointer-events-none transform-gpu transition-transform duration-500 ease-out group-hover:scale-110")
        //-   div(class="flex gap-4")
        //-     div(v-for="(game, idx) in gameType.gameList.slice(1, 3)" :key="`${game.game_id || game.id}-${idx}`" class="flex-1 cursor-pointer group max-w-[50%]" @click="openGame(game, gameType.tKey)")
        //-       LiveGameCard(size="big" :fgSrc="`/images/index/mainGame/sport_${idx+1}.webp`" :nameSrc="getGameNameImageSrc(game)" fgClass="h-[550px] right-9")

        //- Live Sports (< 1920: 一排橫向)
        div(v-else-if="gameType.tKey === 'liveSports'" :ref="el => setScrollerRef(gameIndex, el)" class="w-full flex overflow-y-hidden overflow-x-auto no-scrollbar gap-2 xl:gap-[28px] mb-4 xl:mb-10")
          div(v-for="(game, idx) in gameType.gameList" :key="`${game.game_id || game.id}-${idx}`" class="relative cursor-pointer group" @click="openGame(game, gameType.tKey)")
            LiveGameCard(
              :fgSrc="''"
              :bgSrc="'/images/index/mainGame/main_card_bg2.png'"
              sizeClass="w-[350px] md:w-[525px] aspect-[525/251]"
              bgClass="absolute inset-0 w-full h-full rounded-xl xl:rounded-3xl object-cover"
              :nameSrc="getGameNameImageSrc(game)")

        //- Mini Game & Slot Game
        div(v-if="gameType.tKey === 'miniGames' || gameType.tKey === 'slots'" :ref="el => setScrollerRef(gameIndex, el)" class="w-full xl:h-[260px] flex overflow-x-auto overflow-y-hidden no-scrollbar gap-2 xl:gap-[28px] mb-4 xl:mb-10")
          div(v-for="(game, idx) in gameType.gameList" :key="`${game.game_id || game.id}-${idx}`" class="flex flex-col items-center text-left cursor-pointer group overflow-visible" @click="openGame(game)")
            NuxtImg(:src="getSrc(game.game_id || game.id || idx, game.desktop_icon_url, 'game')" @error="onError(game.game_id || game.id || idx, 'game')" class="min-w-20 min-h-20 md:min-w-40 md:min-h-40 rounded-xl xl:rounded-3xl transition-transform duration-500 ease-out transform-gpu origin-top group-hover:scale-110 hover:z-10 will-change-transform"  :alt="$t('gameType.types.' + gameType.tKey)")
            p(class="w-20 xl:w-40 text-white font-bold text-xl hidden xl:block mt-2 transition-transform duration-500 ease-out transform-gpu origin-top z-10") {{ game.display_name }}
            p(class="w-20 xl:w-40 text-white text-sm hidden xl:block mt-1 transition-transform duration-500 ease-out transform-gpu origin-top z-10") {{ game.provider }}  

  Login(v-model="showLogin" initialMode="login")

</template>
<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGlobalUiStore } from '~/stores/globalUi'
import { useUserStore } from '~/stores/user'
import { useAlertStore } from '~/stores/alert'
import { useI18n } from 'vue-i18n'
import { useImageFallback } from '~/composables/useImageFallback'
import { LiveGameLaunchMap } from '~/constants/mapping'
import { getLiveGameVendorKey } from '~/utils/keys'

const router = useRouter()
const route = useRoute()
const globalUiStore = useGlobalUiStore()
const userStore = useUserStore()
const alert = useAlertStore()
const { t } = useI18n()
const showLogin = ref(false)
const showPingApiSports = ref(false)

const { getSrc, onError } = useImageFallback()

const scrollers = reactive({})
const showPrev = reactive({})
const showNext = reactive({})
const listeners = reactive({})
const isWide = ref(false)
const updateIsWide = () => {
  if (typeof window !== 'undefined') isWide.value = window.innerWidth >= 1920
}

const gameTypes = ref([
  // {
  //   id: 1,
  //   tKey: 'miniGames',
  //   icon: '/images/icon/miniGames2.svg',
  //   height: 'h-[230px] top-0',
  //   link: '/gameType?type=minigames',
  //   gameList: [],
  // },
  {
    id: 2,
    tKey: 'liveCasino',
    icon: '/images/icon/liveCasino2.svg',
    height: 'h-[180px] top-0',
    link: '/gameType?type=live',
    gameList: [],
  },
  {
    id: 3,
    tKey: 'liveSports',
    icon: '/images/icon/liveSports.svg',
    height: 'h-[180px] top-0',
    link: '/gameType?type=sports',
    gameList: [],
  },
  {
    id: 4,
    tKey: 'slots',
    icon: '/images/icon/slotGames2.svg',
    height: 'h-[230px] top-0',
    link: '/gameType?type=slots',
    gameList: [],
  },
])

function setScrollerRef(index, el) {
  if (!el || scrollers[index] === el) return
  scrollers[index] = el
  const handler = () => updateNav(index)
  listeners[index] = handler
  el.addEventListener('scroll', handler, { passive: true })
  nextTick(() => updateNav(index))
}

function updateNav(index) {
  const el = scrollers[index]
  if (!el) return
  const maxLeft = el.scrollWidth - el.clientWidth - 1
  showPrev[index] = el.scrollLeft > 0
  showNext[index] = el.scrollLeft < Math.max(maxLeft, 0)
}

function updateAll() {
  gameTypes.value.forEach((_, index) => updateNav(index))
}

onMounted(() => {
  updateIsWide()
  updateAll()
  window.addEventListener('resize', updateAll)
  window.addEventListener('resize', updateIsWide)
})

onBeforeUnmount(() => {
  Object.keys(scrollers).forEach((k) => {
    const el = scrollers[k]
    const handler = listeners[k]
    if (el && handler) el.removeEventListener('scroll', handler)
  })
  window.removeEventListener('resize', updateAll)
  window.removeEventListener('resize', updateIsWide)
})

watch(
  () => [globalUiStore.gameList, globalUiStore.vendorList, globalUiStore.isPC],
  () => {
    initVendorList()
  },
  { immediate: true },
)

function getPageStep(el, index) {
  const gameType = gameTypes.value[index]
  if (gameType?.tKey === 'liveCasino') {
    const firstCard = el.children?.[0]
    const cardWidth = firstCard?.getBoundingClientRect?.().width || 280
    const gap = typeof window !== 'undefined' && window.innerWidth >= 1280 ? 24 : 16
    return cardWidth + gap
  }
  const firstCard = el.children?.[0]
  const cardWidth = firstCard?.getBoundingClientRect?.().width || 80
  const gap = parseFloat(
    window.getComputedStyle(el).columnGap || window.getComputedStyle(el).gap || '0',
  )
  const unit = cardWidth + gap
  const perPage = Math.max(1, Math.floor(el.clientWidth / unit))
  return perPage * unit
}

function scrollNext(index) {
  const el = scrollers[index]
  if (!el) return
  const step = getPageStep(el, index)
  const maxLeft = el.scrollWidth - el.clientWidth
  const target = Math.min(el.scrollLeft + step, maxLeft)
  const delta = target - el.scrollLeft
  if (delta > 0) el.scrollBy({ left: delta, behavior: 'smooth' })
}

function scrollPrev(index) {
  const el = scrollers[index]
  if (!el) return
  const step = getPageStep(el, index)
  const target = Math.max(el.scrollLeft - step, 0)
  const delta = el.scrollLeft - target
  if (delta > 0) el.scrollBy({ left: -delta, behavior: 'smooth' })
}

function getGameNameImageSrc(g) {
  const name = String(g?.vendor || '').trim()
  if (!name) return ''

  const lower = name.toLowerCase()
  const ext = lower === 'bti sports' || lower === 'saba sports' ? 'svg' : 'png'
  const filename = `${name}.${ext}`
  return `/images/index/mainGame/live/${encodeURIComponent(filename)}`
}

async function initVendorList() {
  // gameTypes.value[0].gameList = globalUiStore.gameList?.mini_games || []
  const vendorList = globalUiStore.isPC
    ? globalUiStore.vendorList?.desktop_game_types
    : globalUiStore.vendorList?.mobile_game_types
  gameTypes.value[0].gameList = vendorList?.find((item) => item.type === 'live')?.game_list || []
  const sportsGameList = vendorList?.find((item) => item.type === 'sports')?.game_list || []
  gameTypes.value[1].gameList = sportsGameList
  showPingApiSports.value = sportsGameList.some(
    (game) => String(game.vendor).toUpperCase() === 'PINGAPI',
  )
  gameTypes.value[2].gameList = globalUiStore.gameList?.slots_games || []
  await nextTick()
  updateAll()
}

const linkToGameType = (gameType) => {
  if (gameType.tKey === 'miniGames') {
    router.push('/gameType?type=mini_game')
  } else if (gameType.tKey === 'slots') {
    router.push('/gameType?type=slot')
  } else if (gameType.tKey === 'liveCasino') {
    router.push('/gameType?type=live')
  } else {
    router.push('/gameType?type=sports')
  }
}

const openGame = async (g, gameTypeKey = '') => {
  if (!userStore.isLoggedIn) {
    showLogin.value = true
    return
  }

  let gateway = g.gateway
  let vendor_code = g.provider
  let game_code = g.game_id
  if (gameTypeKey === 'liveSports') {
    vendor_code = g.vendor
  } else if (gameTypeKey === 'liveCasino') {
    vendor_code = g.vendor
    const key = getLiveGameVendorKey({ vendor: g.vendor, gateway })
    game_code = LiveGameLaunchMap[key]?.game_code || 'unknown'
  }

  const res = await api.openGame({
    vendor_code,
    game_code,
    currency: 'krw',
    platform: gameTypeKey === 'liveSports' ? 'web' : window.innerWidth >= 1024 ? 'web' : 'h5',
    gateway,
  })

  if (res.success && res?.data) {
    window.open(res.data, '_blank')
  } else {
    alert.openError(res.message, { cancellable: false })
  }
}
</script>
