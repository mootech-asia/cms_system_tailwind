<template lang="pug">
  section(class="relative w-full px-5 sm:px-6 lg:px-[96px] 3xl:px-[160px] py-6" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave")
    //- Header
    div(class="flex items-end justify-between border-b-gradient-primary pb-3 mb-5")
      div(class="flex items-center gap-2")
        NuxtImg(src="/images/index/game-icon.svg" class="w-6 h-6" alt="Hot Game")
        div(class="text-gradient-primary leading-relaxed text-[18px] xl:text-[24px] xl:leading-tight" :class='locale === "ko" ? "font-black" : "font-bold"') {{ $t('gameType.types.hotGames') }}
      div(class="flex items-center gap-3")
        button(type="button" class="text-white/70 hover:text-white xl:font-normal text-sm xl:text-base" @click="router.push('/gameType?type=hotgames')") {{ $t('hotGame.seeAll') }}
        button(type="button" class="hidden md:flex"  :class="canPrev ? 'hover:opacity-90' : 'cursor-not-allowed'" :disabled="!canPrev" @click="goToPrev")
          NuxtImg(:src="canPrev ? '/images/icon/arrow-right2.svg' : '/images/icon/arrow-left2.svg'" :class="['w-5 h-5', canPrev ? 'rotate-180' : '']" alt="prev")
        button(type="button" class="hidden md:flex" :class="canNext ? 'hover:opacity-90' : 'cursor-not-allowed'" :disabled="!canNext" @click="goToNext")
          NuxtImg(:src="canNext ? '/images/icon/arrow-right2.svg' : '/images/icon/arrow-left2.svg'" :class="['w-5 h-5', canNext ? '' : 'rotate-180']" alt="next")

    //- Cards strip
    div(
      ref="stripEl"
      v-show="showCarousel"
      class="overflow-hidden select-none"
      style="touch-action: pan-y;"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    )
      div(
        class="flex gap-5 xl:gap-6 transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(calc(-${currentIndex} * ${stepPx}px))` }"
      )
        div(
          v-for="(card, idx) in gameCards"
          :key="`${card.id}-${idx}`"
          class="group shrink-0 w-[311px] h-[145px] xl:w-[465px] xl:h-[220px] bg-[#1A214F] rounded-2xl p-2 xl:p-2.5 flex gap-3 xl:gap-2 cursor-pointer transition-transform duration-200 ease-out hover:z-20 hover:scale-105"
          @click="onCardClick(card)"
        )
          div(class="w-[120px] h-full xl:w-[200px] rounded-xl overflow-hidden shrink-0 bg-black/40")
            NuxtImg(
              class="w-full h-full object-cover"
              :src="getSrc(idx, card?.desktop_icon_url, 'hotgame')"
              :alt="getDisplayName(card)"
              @error="onError(idx, 'hotgame')"
            )
          div(class="flex-1 flex flex-col justify-between min-w-0")
            div
              span(class="inline-block px-2.5 py-2 rounded-xl bg-[#35527B] text-white text-xs xl:text-base font-bold mb-2.5") {{ $t('hotGame.promo') }}
              h3(class="text-white font-semibold text-base xl:text-xl truncate") {{ getDisplayName(card) }}
            button(
              type="button"
              class="mt-2 h-9 rounded-xl bg-gradient-to-r from-[#F3AC2F] to-[#E528A5] text-[#060C34] text-xl font-bold transition-colors duration-200 group-hover:bg-none group-hover:bg-[#E52865] group-hover:text-white"
              @click.stop="onCardClick(card)"
            ) {{ $t('hotGame.playNow') }}
  Login(v-model="showLogin" initialMode="login")
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useGlobalUiStore } from '~/stores/globalUi'
import { useUserStore } from '~/stores/user'
import { useAlertStore } from '~/stores/alert'
import { useImageFallback } from '~/composables/useImageFallback'
const { getSrc, onError } = useImageFallback()

const globalUiStore = useGlobalUiStore()
const userStore = useUserStore()
const alert = useAlertStore()

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const gameCards = ref([])
const showLogin = ref(false)

const gameIcons = ref([
  {
    id: 1,
    tKey: 'miniGames',
    link: '/gameType?type=mini_game',
    image: '/images/index/hotGame/icon-Maingames.png',
  },
  {
    id: 2,
    tKey: 'poker',
    link: '/gameType?type=poker_games',
    image: '/images/index/hotGame/icon-Poker.png',
  },
  // { id: 3, tKey: 'sports', link: '/gameType?type=sports', image: '/images/index/hotGame/icon-Sports.png' },
  {
    id: 4,
    tKey: 'live',
    link: '/gameType?type=live',
    image: '/images/index/hotGame/icon-Live.png',
  },
  {
    id: 5,
    tKey: 'fish',
    link: '/gameType?type=fish',
    image: '/images/index/hotGame/icon-Fish.png',
  },
  // { id: 6, tKey: 'esports', link: '/gameType?type=esports', image: '/images/index/hotGame/icon-Esports.png' },
  {
    id: 7,
    tKey: 'slots',
    link: '/gameType?type=slot',
    image: '/images/index/hotGame/icon-Slotgame.png',
  },
  // { id: 8, tKey: 'lottery', link: '/gameType?type=lottery', image: '/images/index/hotGame/icon-Lottery.png' },
])

const currentIndex = ref(0)
const isAutoPlaying = ref(true)
let timer = null

const showCarousel = ref(false)
const stripEl = ref(null)
const stepPx = ref(331)
const perPage = ref(1)
const updateStep = () => {
  if (typeof window === 'undefined') return
  const isXl = window.innerWidth >= 1280
  stepPx.value = isXl ? 465 + 24 : 311 + 20
  const containerW = stripEl.value?.clientWidth || window.innerWidth
  perPage.value = Math.max(1, Math.floor((containerW + (isXl ? 24 : 20)) / stepPx.value))
}
const pointerId = ref(null)
const startX = ref(0)
const deltaX = ref(0)
const blockClick = ref(false)
const suppressClickUntil = ref(0)

const startAutoPlay = () => {
  stopAutoPlay()
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % gameCards.value.length
  }, 4000)
}
const stopAutoPlay = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  updateStep()
  window.addEventListener('resize', updateStep, { passive: true })
})

onBeforeUnmount(() => {
  stopAutoPlay()
  if (typeof window !== 'undefined') window.removeEventListener('resize', updateStep)
})

watch(
  () => globalUiStore,
  (val) => {
    if (val.gameList.hot_games && Object.keys(val.gameList.hot_games).length > 0) {
      gameCards.value = val.gameList.hot_games
      showCarousel.value = true
    }
  },
  { deep: true, immediate: true },
)

const handleMouseEnter = () => {}
const handleMouseLeave = () => {}

const canPrev = computed(() => currentIndex.value > 0)
const canNext = computed(() => {
  const total = gameCards.value.length
  return currentIndex.value + (perPage.value || 1) < total
})

const goToNext = () => {
  const total = gameCards.value.length
  if (!total) return
  const step = perPage.value || 1
  const maxIndex = Math.max(0, total - step)
  currentIndex.value = Math.min(maxIndex, currentIndex.value + step)
}

const goToPrev = () => {
  const total = gameCards.value.length
  if (!total) return
  const step = perPage.value || 1
  currentIndex.value = Math.max(0, currentIndex.value - step)
}

const onPointerDown = (e) => {
  if (!gameCards.value?.length) return
  pointerId.value = e.pointerId
  startX.value = e.clientX
  deltaX.value = 0
  blockClick.value = false
  handleMouseEnter()
}

const onPointerMove = (e) => {
  if (pointerId.value === null || e.pointerId !== pointerId.value) return
  deltaX.value = e.clientX - startX.value
}

const onPointerUp = (e) => {
  if (pointerId.value === null || e.pointerId !== pointerId.value) return
  const threshold = 50
  let didSwipe = false
  if (deltaX.value <= -threshold) {
    goToNext()
    didSwipe = true
  } else if (deltaX.value >= threshold) {
    goToPrev()
    didSwipe = true
  }
  pointerId.value = null
  blockClick.value = didSwipe
  if (didSwipe) suppressClickUntil.value = Date.now() + 250
  deltaX.value = 0
  setTimeout(() => {
    blockClick.value = false
  }, 0)
  handleMouseLeave()
}

const onPointerCancel = (e) => {
  if (pointerId.value !== null && e.pointerId === pointerId.value) {
    pointerId.value = null
  }
  deltaX.value = 0
  setTimeout(() => {
    blockClick.value = false
  }, 0)
  handleMouseLeave()
}

const onCardClick = (card) => {
  if (blockClick.value) return
  if (Date.now() < suppressClickUntil.value) return
  openGame(card)
}

const getDisplayName = (card) => {
  const fallback = card?.display_name
  const map = card?.display_name_i18n
  const lang = locale.value
  if (!map || !lang) return fallback
  return map?.[lang] || fallback
}

const openGame = async (g) => {
  if (!userStore.isLoggedIn) {
    showLogin.value = true
    return
  }

  const res = await api.openGame({
    vendor_code: g.provider,
    game_code: g.game_id,
    currency: 'krw',
    platform: window.innerWidth >= 1024 ? 'web' : 'mobile',
    gateway: g.gateway,
  })

  if (res.success && res?.data) {
    window.open(res.data, '_blank')
  } else {
    alert.openError(res.message, { cancellable: false })
  }
}

// Class helpers
const getTransformClass = (position) => {
  if (position === 0) return 'transform scale-100'
  if (Math.abs(position) === 1) {
    return `${position === -1 ? '-translate-x-80 md:-translate-x-[350px]' : 'translate-x-80 md:translate-x-[350px]'}`
  }
  return `${position === -2 ? '-translate-x-[400px] md:-translate-x-[650px]' : 'translate-x-[400px] md:translate-x-[650px]'}`
}

const getZIndex = (position) => {
  if (position === 0) return 'z-20'
  if (Math.abs(position) === 1) return 'z-10'
  return 'z-0'
}

const getOpacity = (position) => {
  if (position === 0) return 'opacity-100'
  if (Math.abs(position) === 1) return 'opacity-[0.85]'
  return 'opacity-[0.70]'
}

const getSize = (position) => {
  if (position === 0) return 'w-[320px] h-[236px] md:w-[360px] md:h-[280px]'
  return 'w-72 h-52 md:w-[280px] md:h-[218px]'
}

const titleSizeClass = (position) => {
  if (position === 0) return 'text-2xl md:text-3xl text-gradient-primary'
  if (Math.abs(position) === 1) return 'text-xl md:text-2xl text-white'
}

const descSizeClass = (position) => {
  return 'text-sm md:text-base'
}
</script>

<style scoped>
.border-b-gradient-primary::after {
  height: 1px;
}

.active-glow {
  box-shadow:
    0 0 0 4px rgba(0, 208, 255, 0.7) inset,
    0 0 24px rgba(0, 208, 255, 0.55),
    0 12px 40px rgba(0, 208, 255, 0.35);
}

.bg-grid-pattern {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size:
    24px 24px,
    24px 24px;
  background-position:
    0 0,
    0 0;
}
</style>
