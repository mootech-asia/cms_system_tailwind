<template lang="pug">
h1(class="h-[62px] bg-white text-[#060C34] text-[32px] font-bold py-2 px-8 border-b border-[#E7E7E7] hidden xl:block ml-[260px]") {{ t('userCenter.profitAndLoss') }}
section(class="h-[calc(100vh-48px)] xl:h-[calc(100vh-199px)] bg-[#F2F2F2] px-4 py-3 xl:py-6 pb-24 xl:ml-[260px] overflow-y-auto")
  div(class="w-full xl:relative xl:max-w-[1190px] xl:h-[calc(100vh-258px)] mx-auto")
    div(class="space-y-2 xl:space-y-3 pb-24")

      //- Search
      //- div(class="relative")
      //-   input(v-model.trim="keyword" type="text" :placeholder="t('userCenter.common.searchBy')" class="w-full h-10 text-sm rounded-[10px] bg-white border border-[#E5E7EB] px-10 text-[#060C34] placeholder-[#6D6D6D] focus:outline-none focus:ring-2 focus:ring-[#060C34]")
      //-   div(class="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D6D6D]")
      //-     svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
      //-       path(fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20zm-6 0A4.5 4.5 0 1 1 14 9.5 4.505 4.505 0 0 1 9.5 14")
      
      //- Tags
      div(class="w-full overflow-x-auto gap-2 no-scrollbar")
        div(class="xl:inline-flex items-center gap-2")
          DateRangePicker(v-model="dateRange" :placeholder="t('userCenter.common.tags.time')" dateFormat="yy/mm/dd" @clear="clearDate" class="cursor-pointer")
          button(class="w-full xl:w-auto bg-[#060C34] text-white font-bold mt-2 xl:mt-0 px-3 py-2 rounded-md whitespace-nowrap inline-flex items-center justify-center" @click="resetAndFetch") {{ t('common.confirm') }}

      //- DataList
      div(class="mt-4 overflow-auto xl:hidden")
        table(class="w-full text-xs text-center bg-white rounded-[10px] overflow-hidden")
          thead(class="bg-[#F6E27B] text-[#060C34] font-bold")
            tr
              th(class="py-3 w-[90px]") {{ t('userCenter.common.headers.gameType') }}
              th(class="py-3 w-[62px]") {{ t('userCenter.common.headers.totalProfitAndLoss') }}
              th(class="py-3 w-[80px]") {{ t('userCenter.common.headers.betting') }}
              th(class="py-3 w-[80px]") {{ t('userCenter.common.headers.validBet') }}
          tbody
            tr(v-for="r in records" :key="r.id" class="border-b border-[#E5E7EB] cursor-pointer" @click="openDetail(r)")
              td(class="py-3 text-[#060C34]") {{ r.game_type.charAt(0).toUpperCase() + r.game_type.slice(1) }}
              td(class="py-3 text-[#060C34]") {{ formatAmount(r.pnl) }}
              td(class="py-3 text-[#060C34]") {{ formatAmount(r.betting) }}
              td(class="py-3 text-[#060C34]") {{ formatAmount(r.valid_bet_amount) }}

      //- PC  
      div(class="hidden xl:block mt-4 overflow-auto")
        div(class="min-w-[1000px]")
          div(class="bg-[#F6E27B] text-[#060C34] font-bold rounded-t-[10px]")
            div(class="flex justify-between items-center px-4 py-3 text-sm text-center")
              p(class="w-[160px]") {{ t('userCenter.common.headers.gameType') }}
              p(class="w-[140px]") {{ t('userCenter.common.headers.totalProfitAndLoss') }}
              p(class="w-[120px]") {{ t('userCenter.common.headers.betting') }}
              p(class="w-[120px]") {{ t('userCenter.common.headers.validBet') }}
              p(class="w-[120px]") {{ t('userCenter.common.headers.winAmount') }}
              p(class="w-[120px]") {{ t('userCenter.common.headers.rebate') }}
          div(v-for="r in records" :key="r.id" class="flex justify-between items-center px-4 py-3 text-sm text-center bg-white border-b border-[#E5E7EB]")
            div(class="w-[160px] text-[#060C34]") {{ r.game_type.charAt(0).toUpperCase() + r.game_type.slice(1) }}
            p(class="w-[140px] text-[#060C34]") {{ formatAmount(r.pnl) }}
            p(class="w-[120px] text-[#060C34]") {{ formatAmount(r.betting) }}
            p(class="w-[120px] text-[#060C34]") {{ formatAmount(r.valid_bet_amount) }}
            p(class="w-[120px] text-[#060C34]") {{ formatAmount(r.win) }}
            p(class="w-[120px] text-[#060C34]") {{ formatAmount(r.player_rebate) }}
      
    //- Mobile Detail
    div(v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center")
      div(class="absolute inset-0 bg-black/50" @click="closeDetail")
      div(class="relative bg-white rounded-[10px] w-[90%] max-w-[560px] px-6 py-4 text-[#060C34]")
        div(class="flex items-center justify-between")
          div(class="flex items-center gap-1")
            div(class="w-[30px] h-[30px] rounded-full flex justify-center items-center")
              NuxtImg(:src="`/images/icon/usercenter/games/${detail.game_type}.svg`" alt="bank" class="w-6 h-6")
            p(class="text-sm font-bold mt-1") {{ detail.game_type.charAt(0).toUpperCase() + detail.game_type.slice(1) }}
          button(type="button" class="absolute right-0 top-[-24px] w-4 h-4 inline-flex items-center justify-center rounded-full bg-white/80 hover:bg-white" @click="closeDetail")
            NuxtImg(src="/images/icon/usercenter/close.svg" alt="close" class="w-3 h-3")

        div(class="relative my-2 h-5")
          div(class="absolute left-0 right-1 top-1/2 -translate-y-1/2 h-px bg-[#E7E7E7]")
          div(class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")
          div(class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")

        div(class="flex flex-col text-[#060C34] gap-1")
          p(class="text-sm font-bold") {{ t('userCenter.common.headers.totalProfitAndLoss') }}：{{ formatAmount(detail.pnl) }}
          p(class="text-sm") {{ t('userCenter.common.headers.betting') }}：{{ formatAmount(detail.betting) }}
          p(class="text-sm") {{ t('userCenter.common.headers.validBet') }}：{{ formatAmount(detail.valid_bet_amount) }}
          p(class="text-sm") {{ t('userCenter.common.headers.winAmount') }}：{{ formatAmount(detail.win) }}
          p(class="text-sm") {{ t('userCenter.common.headers.rebate') }}：{{ formatAmount(detail.player_rebate) }}

</template>

<script setup>
definePageMeta({ layout: 'usercenter' })

import { ref, watch, onMounted } from 'vue'
import { api } from '~/composables/useApi'
import { useI18n } from 'vue-i18n'
import { formatAmount } from '~/composables/useFormat'
import { useAlertStore } from '~/stores/alert'
import dayjs from 'dayjs'

const { t } = useI18n()
const alertStore = useAlertStore()

const status = ref('')
const today = new Date()
const dateRange = ref([today, today])
const selectedOpen = ref(false)
const selectList = ref([
  { value: t('userCenter.common.selectList.all'), label: t('userCenter.common.selectList.all') },
  {
    value: t('userCenter.common.selectList.pending'),
    label: t('userCenter.common.selectList.pending'),
  },
  {
    value: t('userCenter.common.selectList.approved'),
    label: t('userCenter.common.selectList.approved'),
  },
  {
    value: t('userCenter.common.selectList.rejected'),
    label: t('userCenter.common.selectList.rejected'),
  },
])

const records = ref([])

const showDetail = ref(false)
const detail = ref({})

onMounted(() => {
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.backgroundColor = '#F2F2F2'
  }
  resetAndFetch()
})

async function getProfitAndLoss() {
  const startDate = dayjs(dateRange.value[0]).startOf('day').format('YYYY-MM-DD')
  const endDate = dayjs(dateRange.value[1]).endOf('day').format('YYYY-MM-DD')

  const { data } = await api.getProfitAndLoss({
    start_date: startDate,
    end_date: endDate,
  })

  records.value = data.categories
}

function clearDate() {
  dateRange.value = [today, today]
}

function openDetail(r) {
  detail.value = r
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
}

function selectStatus(b) {
  status.value = b.value
  selectedOpen.value = false
}

function copy(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
}

async function resetAndFetch() {
  const start = dateRange.value?.[0]
  const end = dateRange.value?.[1]
  if (!start || !end || !dayjs(start).isValid() || !dayjs(end).isValid()) {
    alertStore.openError(t('common.invalidDateRange'), { cancellable: false })
    return
  }

  records.value = []
  await getProfitAndLoss()
}
</script>
