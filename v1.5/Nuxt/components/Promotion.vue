<template lang="pug">
section(v-if="slides.length > 0" class="relative")
  div(class="w-full h-[420px] xl:h-[440px] bg-[#060C34]")
  div(class="absolute top-[28px] xl:top-[64px] w-full h-[250px] xl:h-auto px-5 xl:px-[96px] 3xl:px-[160px]")
    div(class="relative w-full h-full overflow-visible xl:overflow-visible")
      div(
        class="slides absolute inset-0 md:hidden overflow-hidden select-none"
        style="touch-action: pan-y;"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      )
        div(
          class="flex h-[250px] transition-transform duration-500 ease-out"
          :style="{ transform: `translateX(-${currentPage * 100}%)` }"
        )
          div(
            v-for="(s, i) in slides" :key="'m-'+i"
            class="h-[250px] w-full shrink-0 overflow-hidden"
            @click="onSlideClick(s)"
          )
            NuxtImg(:src="s.i18n.mobile_banner_image_url" class="w-full h-[170px] object-cover rounded-t-3xl bg-black/20" alt="Promotion")
            div(class="w-full flex items-center justify-center h-[30px] bg-gradient-primary")
              p(v-if="s.end_date !== 0" class="text-[#060C34] text-center text-sm text-bold") {{ dayjs.unix(s.start_date).format('YYYY.MM.DD') }} - {{ dayjs.unix(s.end_date).format('YYYY.MM.DD') || '' }}
              p(v-else class="text-[#060C34] text-center text-2xl text-bold") ∞
            div(class="w-full mx-auto bg-white/80 rounded-b-[24px] px-3.5 py-3 shadow-lg overflow-hidden")
              h3(class="text-black text-xs font-semibold") {{ s.title }}

      div(class="hidden md:block overflow-hidden")
        div(
          class="flex transition-transform duration-500 ease-out"
          :style="{ transform: `translateX(-${currentPage * 100}%)` }"
        )
          div(v-for="(page, p) in pagedPages" :key="'d-page-'+p" class="w-full shrink-0")
            div(class="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 md:gap-6 2xl:gap-8 xl:mx-auto")
              div(v-for="(s, i) in page" :key="'d-'+p+'-'+i" class="h-[250px] rounded-t-3xl overflow-hidden group cursor-pointer" @click="navigateTo(`/promotionDetail?id=${s.promotion_id}`)")
                div(class="w-full h-[170px] xl:h-[168px] relative overflow-hidden")
                  NuxtImg(:src="s.i18n.desktop_banner_image_url" class="w-full h-[170px] xl:h-[168px] object-cover bg-black/20 transform-gpu transition-[transform,height] duration-500 ease-out group-hover:scale-[1.15] group-hover:h-[204px] xl:group-hover:h-[202px]" alt="Promotion")
                div(class="w-full flex items-center justify-center h-[30px] bg-gradient-primary")
                  p(v-if="s.end_date !== 0" class="text-[#060C34] text-center text-sm text-bold") {{ dayjs.unix(s.start_date).format('YYYY.MM.DD') }} - {{ dayjs.unix(s.end_date).format('YYYY.MM.DD') || '' }}
                  p(v-else class="text-[#060C34] text-center text-2xl text-bold") ∞
                div(class="w-full mx-auto bg-white/80 rounded-b-[24px] px-3.5 py-3 shadow-lg overflow-hidden")
                  h3(class="text-black text-xs font-semibold") {{ s.title }}
    
    //- Pagination
    div(v-show="totalPages > 1" class="flex items-center justify-center gap-3 mt-6")
      button(v-for="i in totalPages" :key="'dot-d-' + i" type="button" @click="goPage(i-1)" class="dot" :class="{ 'dot--active': i - 1 === currentPage }")
    
    //- ReadMore
    div(class="flex items-center justify-center group mt-6")
      a(href="/promotionList" class="box-border inline-flex items-center gap-2 px-5 xl:px-6 py-2 rounded-lg font-semibold border disabled:opacity-50 disabled:cursor-not-allowed"
        :class="{ 'text-gradient-primary border-transparent border-gradient-primary-mask': !readMoreHover, 'border-[#E52865] bg-[#E52865] text-white': readMoreHover }"
        :style="{ '--bgp-stroke': '1px', '--bgp-inset': '0px' }"
        @mouseenter="setReadMoreHover(true)"
        @mouseleave="setReadMoreHover(false)"
      )
        span(:class="['font-bold', readMoreHover ? 'text-white' : 'text-gradient-primary']") {{ $t('common.readMore') }}
        span(:class="['transform-gpu transition-transform', readMoreHover ? 'text-white' : 'text-gradient-primary']") +
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useGlobalUiStore } from '~/stores/globalUi'
import dayjs from 'dayjs'

const globalUiStore = useGlobalUiStore()

const slides = ref([])
const active = ref(0)
const autoplayMs = 6000
let autoplayTimer = null
const pageSize = ref(2)
const currentPage = ref(0)
const totalPages = computed(() => Math.ceil(slides.value.length / pageSize.value))

const pointerId = ref(null)
const readMoreHover = ref(false)
const startX = ref(0)
const deltaX = ref(0)
const suppressClickUntil = ref(0)
const pagedPages = computed(() => {
  const pages = []
  const size = Math.max(1, pageSize.value)
  for (let i = 0; i < slides.value.length; i += size) {
    pages.push(slides.value.slice(i, i + size))
  }
  return pages
})

function setReadMoreHover(value) {
  readMoreHover.value = value
}

function updatePageSize() {
  const w = window.innerWidth
  if (w >= 1536) {
    pageSize.value = 4
  } else if (w >= 1240) {
    pageSize.value = 3
  } else if (w >= 768) {
    pageSize.value = 2
  } else {
    pageSize.value = 1
  }
  if (currentPage.value > totalPages.value - 1) {
    currentPage.value = Math.max(0, totalPages.value - 1)
  }
}

onMounted(() => {
  updatePageSize()
  window.addEventListener('resize', updatePageSize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSize)
})

function next() {
  const t = totalPages.value
  if (!t) return
  currentPage.value = (currentPage.value + 1) % t
}

function prev() {
  const t = totalPages.value
  if (!t) return
  currentPage.value = (currentPage.value - 1 + t) % t
}

function go(i) {
  if (i === active.value) return
  active.value = i
  startAutoplay()
}

const onPointerDown = (e) => {
  if (!slides.value?.length) return
  pointerId.value = e.pointerId
  startX.value = e.clientX
  deltaX.value = 0
  stopAutoplay()
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
    next()
    didSwipe = true
  } else if (deltaX.value >= threshold) {
    prev()
    didSwipe = true
  }
  pointerId.value = null
  deltaX.value = 0
  if (didSwipe) suppressClickUntil.value = Date.now() + 250
  startAutoplay()
}

const onPointerCancel = (e) => {
  if (pointerId.value !== null && e.pointerId === pointerId.value) {
    pointerId.value = null
  }
  deltaX.value = 0
  startAutoplay()
}

const onSlideClick = (s) => {
  if (Date.now() < suppressClickUntil.value) return
  navigateTo(`/promotionDetail?id=${s.promotion_id}`)
}

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(next, autoplayMs)
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

// 可視需要在這裡決定是否啟用自動輪播
// startAutoplay()

function goPage(p) {
  const t = totalPages.value
  if (!t) return
  currentPage.value = (p + t) % t
}

watch(
  () => globalUiStore.announcements,
  (val) => {
    if (val?.promotion_items) {
      slides.value = val.promotion_items
      if (active.value > slides.value.length - 1) {
        active.value = 0
      }
      if (currentPage.value > totalPages.value - 1) {
        currentPage.value = Math.max(0, totalPages.value - 1)
      }
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: #fff;
  transition:
    transform 150ms ease,
    opacity 150ms ease;
}

.dot--active {
  width: 20px;
  height: 20px;
  background: transparent;
  border: 3px solid rgba(255, 255, 255, 0.95);
}
</style>
