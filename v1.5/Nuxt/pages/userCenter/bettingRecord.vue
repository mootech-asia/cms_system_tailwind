<template lang="pug">
h1(class="h-[62px] bg-white text-[#060C34] text-[32px] font-bold py-2 px-8 border-b border-[#E7E7E7] hidden xl:block ml-[260px]") {{ t('userCenter.bettingRecord') }}
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
              th(class="py-3 w-[90px]") {{ t('userCenter.common.headers.orderNo') }}
              th(class="py-3 w-[62px]") {{ t('userCenter.common.headers.game') }}
              th(class="py-3 w-[80px]") {{ t('userCenter.common.headers.settlementTime') }}
              th(class="py-3 w-[60px]") {{ t('userCenter.common.headers.betPL') }}
          tbody
            tr(v-for="r in records" :key="r.id" class="border-b border-[#E5E7EB] cursor-pointer" @click="openDetail(r)")
              td(class="py-3 text-[#060C34] whitespace-normal break-all") {{ r.third_party_transaction_id }}
              td(class="py-3 text-[#060C34]") {{ r.game_code }}
              td(class="py-3 font-bold text-[#060C34]") {{ dayjs.unix(r.transaction_time).format('YYYY-MM-DD HH:mm:ss') }}
              td(class="py-3 font-bold" :class="r.play_and_loss > 0 ? 'text-[#1DBF73]' : 'text-[#E11D48]'") {{ formatAmount(r.play_and_loss) }}

      //- PC  
      div(class="hidden xl:block mt-4 overflow-auto")
        div(class="min-w-[1000px]")
          div(class="bg-[#F6E27B] text-[#060C34] font-bold rounded-t-[10px]")
            div(class="flex justify-between items-center px-2 py-3 text-sm text-center")
              p(class="w-[160px]") {{ t('userCenter.common.headers.orderNo') }}
              p(class="w-[120px]") {{ t('userCenter.common.headers.game') }}
              p(class="w-[160px]") {{ t('userCenter.common.headers.settlementTime') }}
              p(class="w-[120px]") {{ t('userCenter.common.headers.betAmount') }}
              p(class="w-[120px]") {{ t('userCenter.common.headers.validBet') }}
              p(class="w-[120px]") {{ t('userCenter.common.headers.winnigs') }}
              p(class="w-[60px]") {{ t('userCenter.common.headers.result') }}
              p(class="w-[120px]") {{ t('userCenter.common.headers.betPL') }}
          div(v-for="r in records" :key="r.third_party_transaction_id" class="bg-white border-b border-[#E5E7EB] last:border-b-0")
            div(class="flex justify-between items-center px-2 py-3 text-sm text-center")
              div(class="w-[170px]")
                button(type="button" class="inline-flex items-center gap-2 text-[#060C34] rounded-full px-3 py-1 text-sm whitespace-normal break-all" @click="toggleExpand(r.third_party_transaction_id)")
                  span {{ r.third_party_transaction_id }}
                  NuxtImg(v-if="r.details.length > 0" src="/images/icon/toggle-arrow.svg" alt="toggle" class="w-4 h-4" :class="isExpanded(r.third_party_transaction_id) ? 'rotate-180' : ''")
              p(class="w-[120px] text-[#060C34]") {{ r.game_code }}
              p(class="w-[160px] font-bold text-[#060C34]") {{ dayjs.unix(r.transaction_time).format('YYYY-MM-DD HH:mm:ss') }}
              p(class="w-[120px] font-bold text-[#060C34]") {{ formatAmount(r.bet_amount) }}
              p(class="w-[120px] text-[#060C34]") {{ formatAmount(r.valid_bet_amount) }}
              p(class="w-[120px] font-bold" :class="r.win_amount > 0 ? 'text-[#1DBF73]' : r.win_amount < 0 ? 'text-[#E11D48]' : 'text-[#060C34]'") {{ formatAmount(r.win_amount) }}
              p(class="w-[60px] text-[#060C34] font-bold break-all" :class="['WIN', '승'].includes(r.win_lose) ? 'text-[#1DBF73]' : ['LOSE', '패'].includes(r.win_lose) ? 'text-[#E11D48]' : 'text-[#060C34]'") {{ r.win_lose ?? '-' }}
              p(class="w-[120px] text-[#060C34] font-bold" :class="r.play_and_loss > 0 ? 'text-[#1DBF73]' : r.play_and_loss < 0 ? 'text-[#E11D48]' : 'text-[#060C34]'") {{ formatAmount(r.play_and_loss) }}

            div(v-if="isExpanded(r.third_party_transaction_id)")
              div(class="grid items-center grid-cols-[80px_minmax(160px,1fr)_minmax(160px,1fr)_140px_70px_90px_80px] gap-2 text-xs bg-[#D6D8DC] text-[#6D6D6D] font-bold px-10 py-1 min-w-0")
                p(class="text-center") {{ t('userCenter.bettingRecordPage.detailHeaders.betType') }}
                p(class="text-center") {{ t('userCenter.bettingRecordPage.detailHeaders.leagueName') }}
                p(class="text-center") {{ t('userCenter.bettingRecordPage.detailHeaders.eventName') }}
                p(class="text-center") {{ t('userCenter.bettingRecordPage.detailHeaders.betChoice') }}
                p(class="text-center") {{ t('userCenter.bettingRecordPage.detailHeaders.odds') }}
                p(class="text-center") {{ t('userCenter.bettingRecordPage.detailHeaders.matchResult') }}
                p(class="text-center") {{ t('userCenter.bettingRecordPage.detailHeaders.winLoss') }}
              div(v-for="(d, i) in (r.details || [])" :key="i" class="grid items-center grid-cols-[80px_minmax(160px,1fr)_minmax(160px,1fr)_140px_70px_90px_80px] gap-2 text-xs bg-[#E5E7EB] text-[#6D6D6D] px-10 py-1 min-w-0")
                p(class="text-center") {{ d.parlay ? 'Parlay' : 'Single' }}
                p(class="text-center whitespace-normal break-words") {{ d.league_name || '-' }}
                p(class="text-center whitespace-normal break-words") {{ d.event_name || '-' }}
                p(class="text-center whitespace-normal break-words") {{ d.bet_selection || '-' }}
                p(class="text-center") {{ d.odds ?? '-' }}
                p(class="text-center") {{ d.match_result || '-' }}
                p(class="text-center") {{ d.bet_result || '-' }}

      //- Infinite scroll sentinel
      div(ref="sentinel" class="h-8 w-full")

    div(class="fixed bottom-0 left-0 right-0 z-40 xl:left-[240px] xl:bottom-4 justify-center")
      div(class="w-full xl:max-w-[1190px] mx-auto px-4 bg-[#0A1140] text-[#F6E27B] xl:rounded")
        div(class="flex items-center justify-between h-12")
          p {{ t('userCenter.common.headers.totalProfitAndLoss') }}
          p(class="text-sm xl:text-base font-bold") {{ formatAmount(totalAmount) }}
      
    //- Mobile Detail
    div(v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center")
      div(class="absolute inset-0 bg-black/50" @click="closeDetail")
      div(class="relative bg-white rounded-[10px] w-[90%] max-w-[560px] px-6 py-4 text-[#060C34]")
        div(class="flex items-center justify-between")
          div(class="flex items-center gap-1")
            p(class="text-[#060C34] text-sm font-bold truncate-2-lines") {{ detail.third_party_transaction_id }}
            button(type="button" class="inline-flex items-center text-[#060C34] ml-1" @click="copy(detail.third_party_transaction_id)")
              NuxtImg(src="/images/icon/usercenter/copy.svg" alt="copy" class="min-w-4 min-h-4")
          div(class="text-right text-[#060C34]")
            p(class="text-xs leading-4") {{ dayjs.unix(detail.transaction_time).format('YYYY-MM-DD') }}
            p(class="text-xs leading-4 mt-1") {{ dayjs.unix(detail.transaction_time).format('HH:mm:ss') }}
          button(type="button" class="absolute right-0 top-[-24px] w-4 h-4 inline-flex items-center justify-center rounded-full bg-white/80 hover:bg-white" @click="closeDetail")
            NuxtImg(src="/images/icon/usercenter/close.svg" alt="close" class="w-3 h-3")

        div(class="relative my-2 h-5")
          div(class="absolute left-0 right-1 top-1/2 -translate-y-1/2 h-px bg-[#E7E7E7]")
          div(class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")
          div(class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")

        div(class="grid grid-cols-1 gap-1 text-[#060C34]")
          p(class="text-sm") {{ t('userCenter.common.headers.game') }}： {{ detail.game_code || '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.settlementTime') }}： {{ dayjs.unix(detail.transaction_time).format('YYYY-MM-DD HH:mm:ss') || '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.betAmount') }}： {{ detail.bet_amount || '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.validBet') }}： {{ detail.valid_bet_amount || '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.winnigs') }}： {{ detail.win_amount || '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.result') }}： {{ detail.win_lose || '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.betPL') }}： {{ detail.win_amount - detail.valid_bet_amount || '---' }}

        div(class="mt-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-60vh)]")
          div(v-for="(d, i) in (detail.details && detail.details.length ? detail.details : [])" :key="i" class="bg-[#E5E7EB] rounded-[18px] px-2.5 py-2.5")
            div(class="space-y-2.5 text-[#0B0B0B]")
              p(class="text-sm") {{ t('userCenter.bettingRecordPage.detailHeaders.betType') }} : {{ d.parlay === true ? 'Parlay' : d.parlay === false ? 'Single' : '-' }}
              p(class="text-sm") {{ t('userCenter.bettingRecordPage.detailHeaders.leagueName') }} : {{ d.league_name || '-' }}
              p(class="text-sm") {{ t('userCenter.bettingRecordPage.detailHeaders.eventName') }} : {{ d.event_name || '-' }}
              p(class="text-sm") {{ t('userCenter.bettingRecordPage.detailHeaders.betChoice') }} : {{ d.bet_selection || '-' }}
              p(class="text-sm") {{ t('userCenter.bettingRecordPage.detailHeaders.odds') }} : {{ d.odds ?? '-' }}
              p(class="text-sm") {{ t('userCenter.bettingRecordPage.detailHeaders.matchResult') }} : {{ d.match_result || '-' }}
              p(class="text-sm") {{ t('userCenter.bettingRecordPage.detailHeaders.winLoss') }} : {{ d.bet_result || '-' }}

</template>

<script setup>
definePageMeta({ layout: 'usercenter' })

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { api } from '~/composables/useApi'
import { useI18n } from 'vue-i18n'
import { formatAmount } from '~/composables/useFormat'
import { useAlertStore } from '~/stores/alert'
import dayjs from 'dayjs'
// import transactionJson from '~/mock/user/transaction-history.json'

const { t } = useI18n()
const alertStore = useAlertStore()

const totalAmount = ref(0)
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
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loadingMore = ref(false)
const sentinel = ref(null)
let observer

const showDetail = ref(false)
const detail = ref({})

const expandedMap = ref({})

const hasMore = computed(() => {
  if (!total.value) {
    return records.value.length > 0
  }
  return records.value.length < total.value
})

onMounted(() => {
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.backgroundColor = '#F2F2F2'
  }
  resetAndFetch()
  initObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = undefined
  }
})

async function getTransactionHistory() {
  const startDate = dayjs(dateRange.value[0]).startOf('day').format('YYYY-MM-DD')
  const endDate = dayjs(dateRange.value[1]).endOf('day').format('YYYY-MM-DD')

  try {
    // const data = await transactionJson
    const { data } = await api.getTransactionHistory({
      page: page.value,
      page_size: pageSize.value,
      start_date: startDate,
      end_date: endDate,
    })

    let delta = 0
    if (data.records.length) {
      data.records.forEach((r) => {
        delta += r.win_amount - r.valid_bet_amount
      })
    }

    totalAmount.value += delta
    records.value = [...records.value, ...data.records]
    total.value = data.total_count || 0
  } catch (e) {
    alertStore.openError(e?.message || t('common.error'), { cancellable: false })
  }
}

function initObserver() {
  if (!sentinel.value) return
  if (observer) observer.disconnect()

  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry && entry.isIntersecting) {
      loadMore()
    }
  })

  observer.observe(sentinel.value)
}

async function loadMore() {
  if (loadingMore.value) return
  if (!records.value.length) return
  if (!hasMore.value) return

  loadingMore.value = true
  try {
    page.value += 1
    await getTransactionHistory()
  } finally {
    loadingMore.value = false
  }
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

function toggleExpand(id) {
  expandedMap.value = { ...expandedMap.value, [id]: !expandedMap.value[id] }
}

function isExpanded(id) {
  return Boolean(expandedMap.value[id])
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

  page.value = 1
  total.value = 0
  records.value = []
  totalAmount.value = 0
  await getTransactionHistory()
}
</script>
