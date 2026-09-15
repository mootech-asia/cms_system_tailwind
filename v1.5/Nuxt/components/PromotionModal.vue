<template lang="pug">
div(v-if="visible" class="fixed max-h-screen inset-0 z-[200]")
  div(class="absolute inset-0 bg-black/70")
  div(class="relative w-full h-full")

    //- Mobile
    div(class="relative w-full h-full xl:hidden")
      div(v-for="(card, i) in promotionData" :key="card.id" class="absolute z-[201] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2")
        div(v-if="card.showCard && i === current" class="flex flex-col w-[min(280px,calc(100vw-32px))] landscape:w-[min(240px,calc(100vw-24px))] h-[min(436px,calc(100dvh-32px))] landscape:h-[min(320px,calc(100dvh-24px))] bg-white/50 rounded-2xl overflow-hidden")
          div(class="h-[54px] flex justify-between items-center px-7")
            NuxtImg(src="/images/index/img-logo.png" alt="close" class="w-[84px]")
            button(type="button" class="w-6 h-6 inline-flex items-center justify-center" @click.stop="onCloseCard(card.id)")
              NuxtImg(src="/images/icon/close.svg" alt="close" class="w-6 h-6")
          div(v-html="card.content" class="card-content flex-1 min-h-0 overflow-hidden" @click="linkToDetail(card.promotion_id)")
          div(class="px-4 py-4 landscape:py-2 bg-white/50 rounded-b-2xl")
            label(class="flex justify-center items-center gap-1 text-white/90")
              input(type="checkbox" v-model="rememberTodayList[card.id]" class="custom-checkbox")
              span(class="text-blue-950") {{ $t('promotion.dontRemindToday') }}

    //- PC
    div(class="hidden xl:flex items-center justify-center w-full h-full")
      div(class="w-[1194px] 2xl:w-[1392px] 3xl:w-[1848px] flex items-center justify-center gap-6 px-6 py-10")
        template(v-for="(card, i) in desktopCards" :key="card.id || i")
          div(class="relative z-[201] rounded-2xl")
            div(class="flex flex-col w-[430px] 3xl:w-[500px] h-[626px] 3xl:h-[711px] bg-white/50 rounded-2xl")
              div(class="h-[72px] flex justify-between items-center px-7")
                NuxtImg(src="/images/index/img-logo.png" alt="close" class="w-[140px]")
                button(type="button" class="w-6 h-6 inline-flex items-center justify-center" @click.stop="onCloseCard(card.id)")
                  NuxtImg(src="/images/icon/close.svg" alt="close" class="w-6 h-6")
              div(v-html="card.content" class="card-content flex-1 min-h-0 overflow-hidden" @click="linkToDetail(card.promotion_id)")
              div(class="flex justify-center items-center gap-2 px-4 py-4 bg-white/50 rounded-b-2xl")
                input(type="checkbox" v-model="rememberTodayList[card.id]" class="custom-checkbox")
                span(class="text-blue-950 font-bold") {{ $t('promotion.dontRemindToday') }}
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, toRaw, watch } from 'vue'
import { useGlobalUiStore } from '~/stores/globalUi'

const globalUiStore = useGlobalUiStore()

// ===== Constants =====
const STORAGE_KEY = 'promotion'
const MEDIA_QUERY = '(min-width: 1280px)'

// ===== State =====
const visible = ref(false) // 是否顯示整個遮罩
const isDesktop = ref(false) // 是否為桌機尺寸
const current = ref(0) // 手機模式用：當前索引
const rememberTodayList = ref([]) // 每張是否勾選「今天不再提醒」

// 卡片資料（可改由 API/檔案載入）
const promotionData = ref([])

// ===== Derived: desktopCards（<1920 顯示最多 3 張；>=1920 顯示全部） =====
const desktopCards = computed(() => {
  const withIndex = promotionData.value.map((c, _idx) => ({ ...c, _idx })).filter((c) => c.showCard)
  return withIndex.slice(0, 3)
})

// ===== Helpers: LocalStorage =====
function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${STORAGE_KEY}_${y}-${m}-${day}`
}

function getDismissedIds() {
  const raw = localStorage.getItem(todayKey())
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (typeof parsed === 'string') return [parsed]
    return []
  } catch (_) {
    // 舊格式或手動寫入單值字串
    return [raw]
  }
}

function saveDismissedId(id) {
  const set = new Set(getDismissedIds())
  set.add(String(id))
  localStorage.setItem(todayKey(), JSON.stringify([...set]))
}

// ===== Helpers: UI state =====
function updateCurrentIndex() {
  // 指向第一個仍顯示的卡片（手機模式）
  const first = promotionData.value.findIndex((c) => !!c.showCard)
  current.value = first !== -1 ? first : 0
}

function initFromLocalStorage() {
  // 將今天已關閉的 id 套用到資料
  const dismissedIds = new Set(getDismissedIds())
  promotionData.value.forEach((card) => {
    if (dismissedIds.has(String(card.id))) card.showCard = false
  })
  visible.value = promotionData.value.some((c) => c.showCard)
  rememberTodayList.value = Array(promotionData.value.length).fill(false)
  updateCurrentIndex()
}

// ===== Media query setup/teardown =====
let mq
function onMediaChange(e) {
  isDesktop.value = e.matches
}

function setupMediaQuery() {
  mq = window.matchMedia(MEDIA_QUERY)
  isDesktop.value = mq.matches
  if (mq.addEventListener) mq.addEventListener('change', onMediaChange)
  else mq.addListener(onMediaChange)
}

function teardownMediaQuery() {
  if (!mq) return
  if (mq.removeEventListener) mq.removeEventListener('change', onMediaChange)
  else mq.removeListener(onMediaChange)
}

function linkToDetail(id) {
  if (id) {
    navigateTo(`/promotionDetail?id=${id}`)
  }
}

// ===== Events =====
function closeCard(id) {
  if (rememberTodayList.value[id]) {
    promotionData.value.find((c) => c.id === id) && saveDismissedId(id)
  }

  const idx = promotionData.value.findIndex((c) => c.id === id)
  if (idx === -1) return

  promotionData.value[idx].showCard = false

  // 如果全部關完，關閉整個遮罩
  if (promotionData.value.every((c) => !c.showCard)) {
    visible.value = false
    return
  }

  // 手機模式：移動到下一個仍顯示的卡片
  if (!isDesktop.value) {
    const len = promotionData.value.length
    let next = -1
    for (let offset = 1; offset < len; offset++) {
      const candidate = (idx + offset) % len
      if (promotionData.value[candidate].showCard) {
        next = candidate
        break
      }
    }
    if (next !== -1) current.value = next
  }
}

function onCloseCard(id) {
  return closeCard(id)
}

watch(
  () => globalUiStore.announcements,
  (val) => {
    const items = val?.popup_items

    if (!items || !items.length) {
      promotionData.value = []
      visible.value = false
      current.value = 0
      rememberTodayList.value = []
      return
    }

    promotionData.value = items.map((e) => ({
      id: e.announcement_id,
      title: e.title,
      showCard: true,
      content: e.content,
      promotion_id: e.meta_json?.config.promotion_id,
    }))

    initFromLocalStorage()
  },
  { deep: true, immediate: true },
)

// ===== Lifecycle =====
onMounted(() => {
  setupMediaQuery()
})

onBeforeUnmount(() => {
  teardownMediaQuery()
})
</script>

<style scoped>
.custom-checkbox {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #0a1140;
  border-radius: 8px;
  background: transparent;
  display: inline-block;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease,
    filter 150ms ease;
}

@media (min-width: 1280px) {
  .custom-checkbox {
    width: 24px;
    height: 24px;
  }
}
.custom-checkbox:focus {
  outline: none;
}
.custom-checkbox:checked {
  background: #0a1140;
  border-color: #0a1140;
  box-shadow: inset 0 0 0 2px #ffffff;
}
.custom-checkbox:hover:not(:checked) {
  background: rgba(255, 255, 255, 0.35);
  border-color: #e5e7eb;
}
.custom-checkbox:active {
  filter: brightness(0.95);
}
.custom-checkbox:checked::after {
  content: '';
  display: block;
  width: 6px;
  height: 8px;
  border: 2px solid #ffffff;
  border-left: 0;
  border-top: 0;
  margin-top: 2px;
  transform: translate(5px, 1px) rotate(45deg);
  border-radius: 1px;
}

@media (min-width: 1280px) {
  .custom-checkbox:checked::after {
    transform: translate(7px, 3px) rotate(45deg);
  }
}

:deep(.card-content img) {
  width: 100% !important;
  display: block;
}

:deep(figure) {
  height: 100%;
}

:deep(figure img) {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持比例，填滿容器，裁切多餘部分 */
  object-position: center; /* 以中間為對齊點 */
  display: block;
}
</style>
