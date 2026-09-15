<template lang="pug">
h1(class="h-[62px] bg-white text-[#060C34] text-[32px] font-bold py-2 px-8 border-b border-[#E7E7E7] hidden xl:block ml-[260px]") {{ t('userCenter.withdrawalDetailPage.title') }}
section(class="h-[calc(100vh-48px)] xl:h-[calc(100vh-199px)] bg-[#F2F2F2] px-4 py-3 xl:py-6 pb-24 xl:ml-[260px] overflow-y-auto")
  div(class="w-full xl:relative xl:max-w-[1190px] xl:h-[calc(100vh-258px)] mx-auto")
    div(class="space-y-2 xl:space-y-3 pb-24")
      //- refresh
      div(class="w-max flex items-center shrink-0 whitespace-nowrap px-3 h-10 rounded-lg bg-white border border-[#E5E7EB] text-[#060C34] text-sm") 
        p(class="text-[#6D6D6D] text-sm") {{ t('userCenter.common.autoRefresh.in') }}
        span(class="text-[#060C34] text-sm font-bold pl-2") {{ autoRefreshSecondsLeft }}
        span(class="text-[#6D6D6D] text-sm border-r pr-2") {{ t('userCenter.common.autoRefresh.secondsShort') }}
        NuxtImg(
          src="/images/icon/refresh-blue.svg"
          class="icon-refresh w-5 h-5 xl:w-6 xl:h-6 ml-1"
          :class="isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none refresh-spin-once' : 'cursor-pointer hover:opacity-80'"
          @click="getTurnoverRequirements"
        )

      //- DataList Mobile
      div(class="mt-4 overflow-auto xl:hidden")
        table(class="w-full text-xs text-center bg-white rounded-[10px] overflow-hidden")
          thead(class="bg-[#F6E27B] text-[#060C34] font-bold")
            tr
              th(class="py-3 w-[90px]") {{ t('userCenter.common.headers.date') }}
              th(class="py-3 w-[62px]") {{ t('common.type') }}
              th(class="py-3 w-[80px]") {{ t('userCenter.withdrawalDetailPage.activityName') }}
              th(class="py-3 w-[60px]") {{ t('userCenter.withdrawalDetailPage.progress') }}
          tbody
            tr(v-for="r in records" :key="r.recordId" class="border-b border-[#E5E7EB] cursor-pointer" @click="openDetail(r)")
              td(class="py-3 text-[#060C34]") {{ dayjs.unix(r.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
              td(class="py-3 text-[#060C34]") {{ categoryMaps[r.category] }}
              td(class="py-3 font-bold text-[#060C34]") {{ r.itemName }}
              td(class="py-3 font-bold text-[#060C34]") {{ `${r.achieved} / ${r.target}` }}

      //- PC  
      div(class="hidden xl:block mt-4 overflow-auto")
        div(class="min-w-[1000px]")
          div(class="bg-[#F6E27B] text-[#060C34] font-bold rounded-t-[10px]")
            div(class="flex justify-between items-center px-4 py-3 text-sm text-center")
              p(class="w-[120px]") {{ t('userCenter.common.headers.date') }}
              p(class="w-[140px]") {{ t('common.type') }}
              p(class="w-[132px]") {{ t('userCenter.common.headers.gameType') }}
              p(class="w-[70px]") {{ t('userCenter.withdrawalDetailPage.activityName') }}
              p(class="w-[140px]") {{ t('userCenter.withdrawalDetailPage.depositRollover') }}
              p(class="w-[104px]") {{ t('userCenter.withdrawalDetailPage.bonusRollover') }}
              p(class="w-[111px]") {{ t('userCenter.withdrawalDetailPage.progress') }}
          div(v-for="r in records" :key="r.recordId" class="flex justify-between items-center px-4 py-3 text-sm text-center text-[#060C34] bg-white border-b border-[#E5E7EB]")
            div(class="w-[120px]") {{ dayjs.unix(r.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
            p(class="w-[140px]") {{ categoryMaps[r.category] }}
            p(class="w-[132px] flex flex-wrap")
              template(v-if="!r.gameTypes.length")
                div(v-for="gameType in Object.keys(gameTypeMaps)" :key="gameType" class="m-1 text-xs px-2 py-1 bg-[#d19200] rounded-2xl") {{ gameTypeMaps[gameType] }}
              template(v-else)
                div(v-for="gameType in r.gameTypes" :key="gameType" class="m-1 text-xs px-2 py-1 bg-[#d19200] rounded-2xl") {{ gameTypeMaps[gameType] }}
            p(class="w-[70px] font-bold") {{ r.itemName }}
            p(class="w-[140px]") {{ formatAmount(r.depositFlowAmount) }}
            p(class="w-[104px]") {{ formatAmount(r.bonusFlowAmount) }}
            p(class="w-[111px]") {{ `${r.achieved} / ${r.target}` }}

      //- Infinite scroll sentinel
      div(ref="sentinel" class="h-8 w-full")
      
    //- Mobile Detail
    div(v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center")
      div(class="absolute inset-0 bg-black/50" @click="closeDetail")
      div(class="relative bg-white rounded-[10px] w-[90%] max-w-[560px] px-6 py-4 text-[#060C34]")
        div(class="flex items-center justify-between gap-2")
          div(class="flex items-center gap-1")
            p(class="text-[#060C34] text-sm font-bold truncate-2-lines") {{ detail.recordId }}
            button(type="button" class="inline-flex items-center text-[#060C34] ml-1" @click="copy(detail.transaction_number)")
              NuxtImg(src="/images/icon/usercenter/copy.svg" alt="copy" class="min-w-4 min-h-4")
          div(class="min-w-[70px] text-right text-[#060C34]")
            p(class="text-xs leading-4") {{ dayjs.unix(detail.createdAt).format('YYYY-MM-DD') }}
            p(class="text-xs leading-4 mt-1") {{ dayjs.unix(detail.createdAt).format('HH:mm:ss') }}
          button(type="button" class="absolute right-0 top-[-24px] w-4 h-4 inline-flex items-center justify-center rounded-full bg-white/80 hover:bg-white" @click="closeDetail")
            NuxtImg(src="/images/icon/usercenter/close.svg" alt="close" class="w-3 h-3")

        div(class="relative my-2 h-5")
          div(class="absolute left-0 right-1 top-1/2 -translate-y-1/2 h-px bg-[#E7E7E7]")
          div(class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")
          div(class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")

        div(class="grid grid-cols-1 gap-1 text-[#060C34]")
          p(class="text-sm") {{ t('common.type') }}：{{ categoryMaps[detail.category] }}
          p(v-if="!detail.gameTypes.length" class="text-sm flex")
            div(class="text-nowrap") {{ t('userCenter.common.headers.gameType') }}：
            div(class="flex flex-wrap")
              div(v-for="gameType in Object.keys(gameTypeMaps)" :key="gameType" class="m-1 text-xs px-2 py-1 bg-[#d19200] rounded-2xl") {{ gameTypeMaps[gameType] }}
          p(v-else class="text-sm flex")
            div(class="text-nowrap") {{ t('userCenter.common.headers.gameType') }}：
            div(class="flex flex-wrap")
              div(v-for="gameType in detail.gameTypes" :key="gameType" class="m-1 text-xs px-3 py-2 bg-[#d19200] rounded-2xl") {{ gameTypeMaps[gameType] }}
          p(class="text-sm") {{ t('userCenter.withdrawalDetailPage.activityName') }}：{{ detail.itemName || '---' }}
          p(class="text-sm") {{ t('userCenter.withdrawalDetailPage.depositRollover') }}： {{ formatAmount(detail.depositFlowAmount) || '0' }}
          p(class="text-sm") {{ t('userCenter.withdrawalDetailPage.bonusRollover') }}： {{ formatAmount(detail.bonusFlowAmount) || '0' }}
          p(class="text-sm") {{ t('userCenter.withdrawalDetailPage.progress') }}： {{ `${detail.achieved} / ${detail.target}` }}

</template>

<script setup>
definePageMeta({ layout: 'usercenter' })

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { api } from '~/composables/useApi'
import { useI18n } from '#imports'
import { formatAmount } from '~/composables/useFormat'
import dayjs from 'dayjs'

// mock data
// import TurnoverRequirementsJson from '~/mock/user/turnover-requirements.json'

const { t } = useI18n()
const autoRefreshSecondsLeft = ref(30)
const isLoading = ref(false)
/** @type {Ref<import('~/composables/useApi').TurnoverRequirements | undefined>} */
const response = ref()
let timerId = null

const categoryMaps = computed(() => {
    return {
        1: t('userCenter.withdrawalDetailPage.category.1'),
        2: t('userCenter.withdrawalDetailPage.category.2'),
        3: t('userCenter.withdrawalDetailPage.category.3'),
        4: t('userCenter.withdrawalDetailPage.category.4'),
    }
})

const gameTypeMaps = computed(() => {
  return {
    slot: t('gameType.types.slots'),
    live: t('gameType.types.liveCasino'),
    fish: t('gameType.types.fish'),
    // pvp: t('gameType.types.poker'),
    sports: t('gameType.types.sports'),
    mini_game: t('gameType.types.miniGames')
  }
})

const records = computed(() => {
    return response.value?.pendingTasks ?? []
})

const showDetail = ref(false)
const detail = ref({})

async function getTurnoverRequirements() {
  try {
    isLoading.value = true
    // const { data } = TurnoverRequirementsJson
    const { data } = await api.getTurnoverRequirements()
    response.value = data
  } catch(error) {
    alert.openError(error.message)
  }
  window.setTimeout(() => {
    isLoading.value = false
    autoRefreshSecondsLeft.value = 30
  }, 600)
}

function autoRefresh() {
  timerId = window.setInterval(() => {
    if (autoRefreshSecondsLeft.value <= 0) {
      getTurnoverRequirements()
      return
    }

    autoRefreshSecondsLeft.value -= 1
  }, 1000)
}

function openDetail(r) {
  detail.value = r
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  detail.value = null
}

function copy(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
}

onMounted(async () => {
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.backgroundColor = '#F2F2F2'
  }

  await getTurnoverRequirements()
  autoRefresh()
})

onUnmounted(() => {
  window.clearInterval(timerId)
})
</script>

<style scoped>
.truncate-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.refresh-spin-once {
  animation: refresh-spin-once 0.6s linear;
}

@keyframes refresh-spin-once {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
