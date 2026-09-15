<template lang="pug">
//- right
div(class="fixed top-[calc(50vh-80px)] right-2 xl:right-5 z-[100]")
  div(class="rounded-[999px] border border-[#585454]/25 bg-[#F7F7F7]/50 shadow-[0_18px_50px_rgba(10,17,64,0.18)] p-1.5")
    div(class="flex flex-col items-center gap-1")
      div(
        v-for="(item, i) in items"
        :key="item.src"
        class="relative group"
        @mouseenter="onEnter(i)"
        @mouseleave="onLeave(i)"
      )
        //- Icon Button
        button(type="button" class="w-[46px] h-[46px] flex items-center justify-center rounded-full bg-[#060C34] ring-1 ring-white/10 transition-[transform,opacity] duration-200 ease-out group-hover:scale-[1.03] group-hover:opacity-50")
          NuxtImg(:src="item.src" :alt="item.alt" class="w-full h-full")

        //- Popover (left side)
        transition(name="fade-scale")
          div(v-if="openIndex === i" class="absolute right-full mr-3 top-1/2 -translate-y-1/2 select-none")
            div(class="bg-black/90 text-white rounded-lg shadow-xl")
              button(
                v-for="(m, j) in item.menu"
                :key="j"
                type="button"
                class="block w-full text-left text-lg leading-none hover:text-white/90 px-3 py-2 hover:bg-neutral-700 rounded-lg whitespace-nowrap"
                @click.stop="onSelect(i, m.routeLabel)"
              ) {{ t(m.labelKey) }}

//- left
div(v-if="showLeftSidebar" class="fixed w-[108px] bottom-64 xl:bottom-4 left-2 z-[100] flex flex-col items-center gap-2 xl:gap-6")
  //- toggle button
  button(type="button" class="w-8 h-8 xl:w-10 xl:h-10 rounded-full grid place-items-center" @click="leftShowMore = !leftShowMore")
    NuxtImg(v-if="leftShowMore" src="/images/icon/sidebar-down.svg" alt="sidebar-down" class="w-5 h-5 xl:w-6 xl:h-6")
    NuxtImg(v-else src="/images/icon/sidebar-up.svg" alt="sidebar-up" class="w-5 h-5 xl:w-6 xl:h-6")
    
  //- stack items with staggered transition
  transition-group(
    name="left-stack"
    tag="div"
    class=" flex flex-col items-center"
    @before-leave="tgBeforeLeave"
    @leave="tgLeave"
    @after-leave="tgAfterLeave"
  )
    button(
      v-for="d in visibleLeftList"
      :key="d.item.src"
      type="button"
      class="focus:outline-none left-stack-item group"
      :style="{ '--delay-enter': `${d.i * 30}ms`, '--delay-leave': `${d.rev * 20}ms` }"
    )
      NuxtImg(:src="d.item.src" :alt="d.item.alt" class="w-[64px] h-[64px] xl:w-[96px] xl:h-[96px] xl:group-hover:w-[108px] xl:group-hover:h-[108px] transition-[width,height] duration-300 ease-out" loading="lazy" decoding="async")

  //- close button
  button(type="button" class="w-8 h-8 xl:w-10 xl:h-10 rounded-full grid place-items-center" @click="showLeftSidebar = false")
    NuxtImg(src="/images/icon/sidebar-close.svg" alt="sidebar-close" class="w-5 h-5 xl:w-6 xl:h-6")

</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useLiveChat } from '~/composables/useLiveChat'
const { t } = useI18n()
const { openLiveChat } = useLiveChat()

// ===== Constants =====
// 動畫參數（調整此處即可全域生效）
const LEAVE_DURATION_MS = 140 // 收起單一項目的高度/透明/位移動畫時長
const LEAVE_ADVANCE_REMOVE_MS = 500 // 提前從 DOM 移除的時間量（越大越早移除）
const LEAVE_OFFSET_Y_PX = 12 // 收起時往下位移距離
const EASE_SPRING = 'cubic-bezier(.22,.72,.18,1)'
const TELEGRAM_PROMO_CHANNEL_URL = 'https://t.me/win10096cs'

// ===== Data =====
const items = computed(() => [
  {
    src: '/images/icon/sidebar-service.svg',
    alt: 'sidebar-service',
    menu: [
      {
        labelKey: 'userCenter.sidebar.customerServiceMenu.liveChat',
        routeLabel: 'Live Chat',
      },
    ],
  },
  {
    src: '/images/icon/sidebar-telegram.svg',
    alt: 'sidebar-telegram',
    menu: [
      {
        labelKey: 'userCenter.sidebar.customerServiceMenu.promoChannel',
        routeLabel: 'Promo Channel',
      },
      // {
      //   labelKey: 'userCenter.sidebar.customerServiceMenu.telegramSupport',
      //   routeLabel: 'Telegram Support',
      // },
    ],
  },
  {
    src: '/images/icon/sidebar-helps.svg',
    alt: 'sidebar-helps',
    menu: [
      {
        labelKey: 'userCenter.sidebar.customerServiceMenu.faq',
        routeLabel: 'FAQ',
      },
      // {
      //   labelKey: 'userCenter.sidebar.customerServiceMenu.howToPlay',
      //   routeLabel: 'How to play',
      // },
    ],
  },
])

const leftItems = ref([
  { src: '/images/icon/sidebar-gifts.png', alt: 'sidebar-gifts' },
  { src: '/images/icon/sidebar-cal.png', alt: 'sidebar-telegram' },
  { src: '/images/icon/sidebar-champ.png', alt: 'sidebar-helps' },
  { src: '/images/icon/sidebar-redEnvelope.png', alt: 'sidebar-helps' },
  { src: '/images/icon/sidebar-spin.png', alt: 'sidebar-helps' },
  { src: '/images/icon/sidebar-egg.png', alt: 'sidebar-helps' },
])

const openIndex = ref(-1)
const leftShowMore = ref(false) // false: 只顯示第一個；true: 顯示全部
const showLeftSidebar = ref(false)

let openTimer = null
let closeTimer = null

// ===== Computed =====
const visibleLeftItems = computed(() =>
  leftShowMore.value ? leftItems.value : leftItems.value.slice(0, 1),
)
const visibleLeftList = computed(() => {
  const arr = visibleLeftItems.value
  const n = arr.length
  return arr.map((item, i) => ({ item, i, rev: n - 1 - i }))
})

// ===== Handlers =====
function onEnter(i) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  if (openTimer) {
    clearTimeout(openTimer)
  }
  openTimer = setTimeout(() => {
    openIndex.value = i
  }, 80)
}

function onLeave(i) {
  if (openTimer) {
    clearTimeout(openTimer)
    openTimer = null
  }
  if (closeTimer) {
    clearTimeout(closeTimer)
  }
  closeTimer = setTimeout(() => {
    if (openIndex.value === i) openIndex.value = -1
  }, 120)
}

function onSelect(i, label) {
  openIndex.value = -1
  if (i === 0) {
    void openLiveChat()
    return
  }
  if (i === 1 && label === 'Promo Channel') {
    window.open(TELEGRAM_PROMO_CHANNEL_URL, '_blank', 'noopener,noreferrer')
    return
  }
  if (i === 1) {
    navigateTo('/usercenter')
  }
  if (i === 2) {
    navigateTo('/about?tab=' + label)
  }
}

// ===== Utils =====
function parseCssMs(v) {
  // 將 '120ms' 或 '0ms' 轉為 number（毫秒）
  if (!v) return 0
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

// ===== Transition hooks (items collapse downward before removal) =====
function tgBeforeLeave(el) {
  el.style.overflow = 'hidden'
  el.style.willChange = 'height, opacity, transform'
  el.style.height = el.offsetHeight + 'px'
}
function tgLeave(el, done) {
  const duration = LEAVE_DURATION_MS
  el.style.transition = `height ${duration}ms ${EASE_SPRING}, opacity ${Math.max(0, duration - 10)}ms ease, transform ${Math.max(0, duration - 10)}ms ease`
  requestAnimationFrame(() => {
    el.style.height = '0px'
    el.style.opacity = '0'
    el.style.transform = `translateY(${LEAVE_OFFSET_Y_PX}px)`
  })
  const delayVar = getComputedStyle(el).getPropertyValue('--delay-leave') || '0ms'
  const delay = parseCssMs(delayVar)
  const total = delay + duration
  const doneAfter = Math.max(50, total - LEAVE_ADVANCE_REMOVE_MS)
  setTimeout(done, doneAfter)
}
function tgAfterLeave(el) {
  el.style.removeProperty('overflow')
  el.style.removeProperty('will-change')
  el.style.removeProperty('height')
  el.style.removeProperty('transition')
  el.style.removeProperty('opacity')
  el.style.removeProperty('transform')
}

onBeforeUnmount(() => {
  if (openTimer) clearTimeout(openTimer)
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<style>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
}

.left-stack-item {
  will-change: transform, opacity;
  transform: translateZ(0);
}
.left-stack-enter-active {
  transition:
    opacity 160ms cubic-bezier(0.22, 0.72, 0.18, 1),
    transform 180ms cubic-bezier(0.22, 0.72, 0.18, 1);
}
.left-stack-leave-active {
  transition:
    opacity 120ms cubic-bezier(0.22, 0.72, 0.18, 1),
    transform 140ms cubic-bezier(0.22, 0.72, 0.18, 1);
}
.left-stack-enter-active .left-stack-item {
  transition-delay: var(--delay-enter, 0ms);
}
.left-stack-leave-active .left-stack-item {
  transition-delay: var(--delay-leave, 0ms);
}
.left-stack-enter-from,
.left-stack-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
.left-stack-enter-to,
.left-stack-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.left-stack-move {
  transition: transform 200ms cubic-bezier(0.22, 0.72, 0.18, 1);
}
</style>
