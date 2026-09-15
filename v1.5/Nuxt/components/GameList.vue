<template lang="pug">
div(class="mt-7 grid grid-cols-3 gap-4 md:gap-7 md:grid-cols-6 3xl:grid-cols-7")
  div(
    v-for="(g, idx) in displayedGames"
    :key="`${g.game_id || g.id}-${idx}`"
    @click="openGame(g)"
    class="cursor-pointer"
  )
    div(class="relative rounded-2xl xl:rounded-[28px] overflow-hidden shadow-lg ring-1 ring-white/10 bg-[#0B1733] group")
      NuxtImg(:src="getSrc(g.game_id || g.id || idx, g.desktop_icon_url, 'game')" @error="onError(g.game_id || g.id || idx, 'game')" alt="cover" class="w-full aspect-square object-cover group-hover:scale-125 duration-1000 ease-out")
    div(class="pt-2 px-1")
      h4(class="text-white font-bold text-sm xl:text-xl leading-tight truncate") {{ g.display_name }}
      div(class="flex justify-between items-center")
        p(class="text-white/60 text-sm truncate max-w-[70%]") {{ g.provider }}
        button(v-if="userStore.isLoggedIn" type="button" class="relative inline-flex items-center justify-center w-3.5 h-3.5 xl:w-6 md:h-6 group" @click.stop="toggleFavorite(g, idx)")
          NuxtImg(v-if="g.isFavorite" src="/images/icon/like-fill.svg" alt="fav" class="w-full h-full")
          template(v-else)
            NuxtImg(src="/images/icon/like.svg" alt="fav" class="w-full h-full group-hover:hidden")
            span(
              class="w-full h-full hidden group-hover:inline-block"
              style="background: linear-gradient(90deg, var(--linear-gradient-pink), var(--linear-gradient-orange)); -webkit-mask: url('/images/icon/like.svg') no-repeat center / contain; mask: url('/images/icon/like.svg') no-repeat center / contain;"
            )

  //- intersection sentinel for infinite scroll
  div(ref="sentinel" class="h-8 w-full col-span-full")
Login(v-model="showLogin" initialMode="login")
  
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, toRefs, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '~/composables/useApi'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useAlertStore } from '~/stores/alert'
import { useImageFallback } from '~/composables/useImageFallback'

const userStore = useUserStore()
const alert = useAlertStore()
const route = useRoute()
const { t, locale } = useI18n()
const showLogin = ref(false)

const { getSrc, onError } = useImageFallback()

const props = defineProps({
  displayedGames: { type: Array, required: true },
  toggleFavorite: { type: Function, required: true },
  loadMore: { type: Function, required: false },
  hasMore: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
})

const { displayedGames, toggleFavorite, loadMore, hasMore, loadingMore } = toRefs(props)

const sentinel = ref(null)
let observer
let lastLoadTime = 0
let loadTimer
const LOAD_INTERVAL = 1000
const BOTTOM_OFFSET = 240

function clearLoadTimer () {
  if (!loadTimer) return
  clearTimeout(loadTimer)
  loadTimer = null
}

function isSentinelVisible () {
  if (!sentinel.value || typeof window === 'undefined') return false
  const rect = sentinel.value.getBoundingClientRect()
  return rect.top <= window.innerHeight + BOTTOM_OFFSET && rect.bottom >= -BOTTOM_OFFSET
}

function isNearPageBottom () {
  if (typeof window === 'undefined') return false
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const viewportBottom = scrollTop + window.innerHeight
  const pageHeight = document.documentElement.scrollHeight
  return pageHeight - viewportBottom <= BOTTOM_OFFSET
}

function shouldTryLoad () {
  return isSentinelVisible() || isNearPageBottom()
}

function scheduleLoadCheck (delay = LOAD_INTERVAL) {
  if (typeof window === 'undefined') return
  clearLoadTimer()
  if (!hasMore.value || !loadMore.value) return
  loadTimer = window.setTimeout(() => {
    loadTimer = null
    tryLoadMore()
  }, delay)
}

function tryLoadMore () {
  if (!loadMore.value || !hasMore.value) {
    clearLoadTimer()
    return
  }
  if (!shouldTryLoad()) {
    clearLoadTimer()
    return
  }

  if (loadingMore.value) {
    scheduleLoadCheck()
    return
  }

  const now = Date.now()
  const waitTime = LOAD_INTERVAL - (now - lastLoadTime)
  if (waitTime > 0) {
    scheduleLoadCheck(waitTime)
    return
  }

  lastLoadTime = now
  Promise.resolve(loadMore.value()).finally(() => {
    nextTick(() => {
      if (shouldTryLoad()) scheduleLoadCheck()
    })
  })
}

const setupObserver = () => {
  if (!sentinel.value || !loadMore.value || !hasMore.value) {
    clearLoadTimer()
    return
  }
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

  if (observer) {
    observer.disconnect()
    observer = null
  }

  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (!entry?.isIntersecting) return
    tryLoadMore()
  }, { rootMargin: `${BOTTOM_OFFSET}px 0px` })

  observer.observe(sentinel.value)
  tryLoadMore()
}

function handleScrollCheck () {
  if (!shouldTryLoad()) return
  tryLoadMore()
}

onMounted(() => {
  setupObserver()
  window.addEventListener('scroll', handleScrollCheck, { passive: true })
  window.addEventListener('resize', handleScrollCheck)
})

onBeforeUnmount(() => {
  clearLoadTimer()
  window.removeEventListener('scroll', handleScrollCheck)
  window.removeEventListener('resize', handleScrollCheck)
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

watch(
  () => [hasMore.value, loadingMore.value],
  () => {
    nextTick(() => {
      if (!observer) setupObserver()
      tryLoadMore()
    })
  },
)

const openGame = async (g) => {
  if (!userStore.isLoggedIn) {
    showLogin.value = true
    return
  }

  const res = await api.openGame({
    vendor_code: g.provider,
    game_code: g.game_id,
    currency: 'krw',
    platform: window.innerWidth >= 1024 ? 'web' : 'h5',
    gateway: g.gateway,
  })

  if (res.success && res?.data) {
    window.open(res.data, '_blank')
  } else {
    alert.openError(res.message, { cancellable: false })
  }
}
</script>
