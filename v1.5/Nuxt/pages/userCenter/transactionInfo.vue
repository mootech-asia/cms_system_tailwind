<template lang="pug">
h1(class="w-[calc(100vw-260px)] h-[62px] bg-white text-[#060C34] text-[32px] font-bold py-2 px-8 border-b border-[#E7E7E7] hidden xl:block ml-[260px]")
  | {{ $route.query.type === 'withdrawal' ?  t('userCenter.withdrawalInfo') : t('userCenter.depositInfo') }}
section(class="h-screen xl:h-[calc(100vh-185px)] bg-white py-6 xl:py-8 xl:pl-[260px]")
  div(class="max-w-[945px] mx-auto flex flex-col h-full px-7 xl:px-7")
    span(class="block w-fit mx-auto px-6 py-1 xl:py-1.5 rounded-full bg-[#0A1140] text-white mb-10") {{ t('userCenter.transactionDetails') }}
    
    div(class="border border-Base/Neutral/100 rounded-xl px-6 pt-3")
      div(class="mb-2 xl:mb-4")
        div(class="flex flex-col xl:flex-row items-center justify-between")
          p(class="w-full xl:w-fit text-sm xl:text-xl text-start font-bold text-[#060C34]") {{ $route.query.type === 'withdrawal' ?  t('userCenter.withdrawalAmount') : t('userCenter.depositAmount') }}
          p(class="w-full xl:w-fit text-end text-xl xl:text-[32px] leading-[1.2] font-bold text-[#060C34]") ₩ {{ amount }}

      div(v-if="route.query.promotion_id" class="border-b border-[#E7E7E7]")
        div(class="flex flex-col xl:flex-row items-center justify-between mb-2 xl:mb-4")
          span(class="w-full xl:w-fit text-sm xl:text-xl text-start font-bold text-[#060C34]") {{ $route.query.type === 'withdrawal' ?  t('userCenter.withdrawalPromotions') : t('userCenter.depositPromotions') }}
          span(class="w-full xl:w-fit text-end font-bold text-[#0E8D6C]") ＋₩ {{ $route.query.bonus || 0 }} {{ t('userCenter.bonus') }}
      
      div(v-if="route.query.promotion_id" class="flex flex-col xl:flex-row items-center justify-between py-3")
        span(class="w-full xl:w-fit text-sm xl:text-xl text-start font-bold text-[#060C34]") {{ t('userCenter.receivedAmount') }}
        span(class="w-full xl:w-fit text-end font-bold text-[#060C34]") ₩ {{ receivedAmount }}

    div(class="px-4 pt-6 pb-4 flex items-center justify-between rounded-md")
      span(class="leading-[1.2] text-[#060C34] font-bold")  {{ $route.query.type === 'withdrawal' ?  t('userCenter.withdrawalAccount') : t('userCenter.depositAccount') }}
      span(class="text-sm leading-[1.2] text-[#060C34] font-bold pr-2") {{ userStore.profile?.username }}

    //- Description text
    p(class="text-[#4F4F4F] mt-4 text-[16px] px-4")  {{ t('userCenter.transactionDescription') }}
    div(class="mt-6 flex justify-start")
      button(type="button" class="text-[16px] text-blue-700 underline px-4" @click="store.setShowCustomerServiceModal(true)") {{ t('userCenter.customerService') }}

    //- Bottom actions
    div(class="mt-16 xl:mb-10 fixed xl:relative bottom-0 left-0 right-0 z-[100]")
      div(class="max-w-[945px] mx-auto")
        button(type="button" class="w-full h-12 bg-[#060C34] text-white font-bold xl:rounded-md" @click="submit")
          p(class="w-fit text-gradient-primary mx-auto") {{ t('common.complete') }}
        button(type="button" class="xl:mt-4 w-full h-12 border border-[#060C34] text-[#060C34] text-[14px] font-bold xl:rounded-md bg-white" @click="router.back()") {{ t('common.back') }}

</template>
<script setup>
definePageMeta({ layout: 'usercenter' })

import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { api } from '~/composables/useApi'
import { useUserStore } from '~/stores/user'
import { useGlobalUiStore } from '~/stores/globalUi'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const store = useGlobalUiStore()
const alert = useAlertStore()

const amount = ref('0')

onMounted(() => {
  initAmount()
  checkProfile()
})

function checkProfile() {
  // WithdrawalInfo 重新整理 - 導致store沒有把transaction_password存起來，需要跳轉到withdrawal
  if (route.query.type === 'withdrawal' && !userStore.profile) {
    navigateTo('/usercenter/withdrawal')
  }
}

const receivedAmount = computed(() => {
  const bonus = Number(route.query.bonus) || 0
  const amt = Number(amount.value.replace(/,/g, '')) || 0
  return formatAmount(bonus + amt)
})

function formatAmount(val) {
  if (val === undefined || val === null || val === '') return '0'
  const num = Number(val)
  if (Number.isNaN(num)) return String(val)
  return num.toLocaleString('en-US')
}

function initAmount() {
  amount.value = formatAmount(route.query.amount)
}

const isSubmitting = ref(false)

async function refreshProfile() {
  const [{ data }, { data: tData }] = await Promise.all([api.getProfile(), api.getTurnoverWithdrawal()])
  userStore.setProfile({ ...data, remaining_turnover_amount: tData.remaining })
}

function decodeMaybeEncoded(val) {
  if (val == null) return val
  if (typeof val !== 'string') return val
  return val.replace(/%([0-9A-Fa-f]{2})/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16))
    } catch {
      return `%${hex}`
    }
  })
}

const submit = async () => {
  if (isSubmitting.value) return

  if (route.query.type === 'deposit') {
    try {
      const payload = {
        amount: String(decodeMaybeEncoded(route.query.amount)).trim(),
        bonus_amount: decodeMaybeEncoded(route.query.bonus),
      }

      if (route.query.promotion_id !== 'none') {
        payload.promotion_id = route.query.promotion_id
        payload.promotion_name = decodeMaybeEncoded(route.query.promotion_name)
        payload.description = decodeMaybeEncoded(route.query.description)
      }

      const res = await api.deposit(payload)

      isSubmitting.value = true
      alert.openSuccess(res.message, { redirectUrl: '/usercenter/depositrecord' })
    } catch (error) {
      isSubmitting.value = false
      alert.openError(error.message || t('common.error'))
    }
  } else {
    try {
      const res = await api.withdrawal({
        amount: userStore.withdrawalFormData.amount,
        band_card_id: userStore.withdrawalFormData.band_card_id,
        transaction_password: userStore.withdrawalFormData.transaction_password,
      })
      await refreshProfile()
      alert.openSuccess(res.message, { redirectUrl: '/usercenter/withdrawalrecord', closeOnBackdrop: false })
    } catch (error) {
      alert.openError(error.message)
    }
  }
}
</script>
