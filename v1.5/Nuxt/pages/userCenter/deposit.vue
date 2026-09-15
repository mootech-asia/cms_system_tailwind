<template lang="pug">
div(class="w-full xl:w-[calc(100vw-260px)] xl:ml-[260px] bg-white")
  h1(class="text-[#060C34] text-[32px] font-bold xl:pt-4 pb-2 px-8 border-b border-[#E7E7E7] hidden xl:block") {{ t('userCenter.deposit') }}
  section(class="min-h-screen xl:min-h-[calc(100vh-70px)] px-4 xl:px-8 pb-20 xl:pb-10")
    div(class="max-w-[945px] mx-auto pt-2.5 xl:pb-8")
      //- Deposit Method
      //- div(class="xl:mt-6 mb-4")
      //-   span(class="block w-fit mx-auto px-6 py-1 xl:py-1.5 rounded-full bg-[#0A1140] text-sm text-white mb-4") {{ t('userCenter.depositPage.depositMethod') }}
      //-   div(class="grid grid-cols-4 xl:grid-cols-5 gap-3.5 xl:gap-5")
      //-     button(v-for="(m, i) in methods" :key="m.id" type="button"
      //-       class="h-20 rounded-[10px] border-2 bg-white text-[#060C34] font-bold"
      //-       :class="[selectedMethod === m.id ? 'border-[#FFE373] bg-[#FFE373]' : 'border-[#E5E7EB] hover:border-[#0A1140]/30', i >= 4 ? 'hidden xl:block' : '']"
      //-       @click="selectedMethod = m.id") {{ m.label }}

      //- Payment Channels
      //- div(class="mt-4 xl:mt-6 mb-4")
      //-   span(class="block w-fit mx-auto px-6 py-1 xl:py-1.5 rounded-full bg-[#0A1140] text-sm text-white mb-4") {{ t('userCenter.depositPage.paymentChannels') }}
      //-   div(class="grid grid-cols-4 xl:grid-cols-5 gap-3.5 xl:gap-5")
      //-     button(v-for="(c, i) in channels" :key="c.id" type="button"
      //-       class="h-20 rounded-[10px] border-2 bg-white text-[#060C34] font-bold"
      //-       :class="[selectedChannel === c.id ? 'border-[#FFE373] bg-[#FFE373]' : 'border-[#E5E7EB] hover:border-[#0A1140]/30', i >= 4 ? 'hidden xl:block' : '']"
      //-       @click="selectedChannel = c.id") {{ c.label }}

      //- Deposit Amount
      div(class="mb-4")
        span(class="block w-fit mx-auto px-6 py-1 xl:py-1.5 rounded-full bg-[#0A1140] text-sm text-white mb-4") {{ t('userCenter.depositPage.depositAmount') }}
        div(class="grid grid-cols-5 xl:grid-cols-5 gap-1 xl:gap-5")
          button(v-for="a in amounts" :key="a" type="button"
            class="h-10 xl:h-20 rounded-[10px] text-xs xl:text-base border-2 text-[#6D6D6D]"
            :class="selectedAmount === a ? 'border-[#FFE373] bg-[#FFE373] text-[#060C34] font-bold' : 'border-[#E5E7EB] hover:border-[#0A1140]/30 bg-white'"
            @click="selectedAmount = a") {{ a }}

      //- Input Amount
      div(class="mt-4")
        input(v-model="amount" type="text" inputmode="numeric" pattern="[0-9]*" :placeholder="amountPlaceholder" class="w-full h-10 xl:h-12 text-sm xl:text-base rounded-[10px] border border-[#B0B0B0] px-4 text-[#060C34] placeholder-[#6D6D6D] focus:outline-none focus:ring-2 focus:ring-[#060C34]" @input="onAmountInput" @blur="onAmountBlur")
        p(class="text-[#E11D48] text-xs xl:text-sm mt-4") {{ t('userCenter.depositPage.limitNote', { min: minAmountText, max: maxAmountText }) }}
        p(class="text-[#E11D48] text-xs xl:text-sm mt-4") {{ t('userCenter.withdrawalPage.remainingTurnoverAmount') }}{{ formatAmount(userStore.profile?.remaining_turnover_amount) }}      

      //- Choose promotion
      div(v-if="promotions.length > 0" class="mt-4 xl:mt-6 mb-4 pb-40 xl:pb-0")
        span(class="block xl:hidden w-fit mx-auto px-6 py-1 xl:py-1.5 text-sm rounded-full bg-[#0A1140] text-white") {{ t('userCenter.depositPage.promotions') }}
        span(class="hidden xl:block w-fit mx-auto px-6 py-1 xl:py-1.5 xl:text-base rounded-full bg-[#0A1140] text-white") {{ t('userCenter.depositPage.choosePromotion') }}
        div(class="mt-4 space-y-4")
          div(v-for="(p, i) in promotions" :key="i" class="rounded-[10px] border px-2 xl:px-4 py-1 xl:py-3 cursor-pointer"
            :class="selectedPromotion === i ? 'bg-[#FFE373] border-transparent font-bold' : 'bg-white border-[#B0B0B0]'"
            @click="selectedPromotion = i")
            
            //- Mobile
            div(class="flex gap-1.5 items-start xl:hidden")
              div(class="mt-[2px] w-4 xl:w-5 h-4 xl:h-5 rounded-full border-2 flex items-center justify-center border-[#0A1140]")
                div(v-if="selectedPromotion === i" class="w-2 h-2 xl:w-2.5 xl:h-2.5 rounded-full bg-[#0A1140]")
              div(v-if="selectedPromotion === i" class="w-full flex flex-col text-[#060C34] text-sm leading-5")
                div(class="w-full flex text-[#060C34] text-sm leading-5")
                  p(class="w-[55%] border-r border-[#1F1F1F] border-r-1") {{ p.name }}
                  p(class="w-[45%] pl-2") ＋₩ {{ bonusText }} {{ t('userCenter.bonus') }}
                div
                  hr(class="my-2 border-[#060C34]")
                  div(class="text-gray-500 text-xs") {{ turnoverText }}
              div(v-else class="flex-1 text-[#060C34] text-sm leading-5") {{ p.name }}
              
            //- PC
            div(class="hidden xl:flex gap-6")
              div(class="mt-[2px] w-5 h-5 rounded-full border-2 flex items-center justify-center border-[#0A1140]")
                div(v-if="selectedPromotion === i" class="w-2.5 h-2.5 rounded-full bg-[#0A1140]")
              div(v-if="selectedPromotion === i" class="flex-1")
                div(class="flex items-start")
                  div(class="w-[560px] border-r border-[#1F1F1F] border-r-1 pl-2")
                    p(class="text-[#060C34] font-bold") {{ p.name }}
                    p(class="list-disc text-[#060C34] mt-1 space-y-1" v-html="p.remark")
                  div
                    p(class="text-[#060C34] font-bold ml-6") ＋₩ {{ bonusText }} {{ t('userCenter.bonus') }}
                div
                  hr(class="my-2 border-[#060C34]")
                  div(class="text-gray-500 text-xs") {{ turnoverText }}

              div(v-else class="flex-1")
                p(class="text-[#060C34] font-bold") {{ p.name }}
                p(class="list-disc text-[#060C34] mt-1 space-y-1" v-html="p.remark")

      div(class="fixed left-0 right-0 bottom-0 xl:static xl:mt-10")
        button(type="button" class="w-full h-[51px] flex justify-center items-center bg-[#0A1140] font-bold hover:border-gradient-primary-mask disabled:opacity-50 disabled:cursor-not-allowed xl:rounded-[10px]"
          :disabled="isDisabled" @click="toNext()")
          p(class="w-fit text-gradient-primary") {{ t('common.next') || t('userCenter.depositPage.next') }}
        button(type="button" class="xl:mt-2 w-full h-12 xl:border border-[#060C34] text-[#060C34] text-[14px] font-bold xl:rounded-md bg-white" @click="navigateTo('/usercenter')") {{ t('common.back') }}

</template>

<script setup>
definePageMeta({ layout: 'usercenter' })
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '~/stores/user'
import { calculateTurnover, calculateFixedTurnover, toThousandth } from '~/utils/calculate'
import { formatAmount } from '~/composables/useFormat'

const { t } = useI18n()

const methods = [
  { id: 1, label: '' },
  { id: 2, label: '' },
  { id: 3, label: '' },
  { id: 4, label: '' },
  { id: 5, label: '' },
]

const channels = [
  { id: 1, label: '' },
  { id: 2, label: '' },
  { id: 3, label: '' },
  { id: 4, label: '' },
  { id: 5, label: '' },
]

const amounts = ['10,000', '50,000', '100,000', '500,000', '1,000,000']

const userStore = useUserStore()
const isDisabled = ref(true)
const selectedMethod = ref(1)
const selectedChannel = ref(1)
const selectedAmount = ref(null)
const amount = ref('')
const minAmount = ref(10000)
const maxAmount = ref(9000000)
const minAmountText = computed(() => new Intl.NumberFormat('en-US').format(minAmount.value))
const maxAmountText = computed(() => new Intl.NumberFormat('en-US').format(maxAmount.value))
const amountPlaceholder = computed(() => `₩ ${minAmountText.value} - ${maxAmountText.value}`)

watch(selectedAmount, (v) => {
  amount.value = v
})

const amountNumber = computed(() => {
  const digits = (amount.value || '').replace(/\D/g, '')
  return digits ? Number(digits) : 0
})

watch(amountNumber, (v) => {
  if (!v || v < minAmount.value || v > maxAmount.value) {
    isDisabled.value = true
    selectedAmount.value = null
  } else {
    isDisabled.value = false
  }
})

function formatWithCommas(s) {
  const digits = (s || '').replace(/\D/g, '')
  if (!digits) return ''
  return new Intl.NumberFormat('en-US').format(Number(digits))
}
function onAmountInput(e) {
  const v = e.target.value || ''
  const digits = String(v).replace(/\D/g, '')
  if (!digits) {
    amount.value = ''
    e.target.value = ''
    selectedAmount.value = null
    return
  }

  const n = Number(digits)
  if (n > maxAmount.value) {
    amount.value = ''
    e.target.value = ''
    selectedAmount.value = null
    return
  }

  const formatted = new Intl.NumberFormat('en-US').format(n)
  amount.value = formatted
  e.target.value = formatted
}
function onAmountBlur() {
  const digits = String(amount.value || '').replace(/\D/g, '')
  if (!digits) {
    amount.value = ''
    return
  }

  const n = Number(digits)
  if (n < minAmount.value || n > maxAmount.value) {
    amount.value = ''
    selectedAmount.value = null
    return
  }

  amount.value = new Intl.NumberFormat('en-US').format(n)
}

const promotions = ref([])
const selectedPromotion = ref(0)

onMounted(async () => {
  getPromotionDeposit()
})

async function getPromotionDeposit() {
  const res = await api.getPromotionDeposit()
  if (res.data.length > 0) {
    promotions.value = [
      ...res.data,
      {
        promotion_id: 'none',
        name: t('userCenter.depositPage.noPromotion'),
        remark: '',
        prize: {
          bonus_reward_type: 'none',
        },
      },
    ]
  }
}

const matchedFixedPromo = computed(() => {
  const promo = promotions.value[selectedPromotion.value]
  const amt = amountNumber.value

  if (!promo || !amt) return null

  const prize = promo.prize
  if (prize.bonus_reward_type === 'fixed') {
    const candidates = (prize.fix_amount || []).filter((item) => amt >= item.deposit_amount)

    if (!candidates.length) return null

    // 從候選檔位中選擇 deposit_amount 最大的那一檔
    const matched = candidates.reduce(
      (max, cur) => (cur.deposit_amount > max.deposit_amount ? cur : max),
      candidates[0],
    )
    return matched
  }
})

const bonus = computed(() => {
  const promo = promotions.value[selectedPromotion.value]
  const amt = amountNumber.value

  if (!promo || !amt) return 0

  const prize = promo.prize
  if (prize.bonus_reward_type === 'percentage') {
    const cfg = prize.percentage

    // 檢查是否達到最小存款金額
    if (!cfg || amt < cfg.min_deposit_amount) return 0

    // 依照活動百分比計算原始紅利金額
    let b = amt * (cfg.bonus_percentage / 100)

    // 若有設定最小紅利金額，且計算結果低於下限，則套用最小紅利金額
    if (cfg.min_bonus_amount && b < cfg.min_bonus_amount) {
      b = cfg.min_bonus_amount
    }

    // 若有設定最大紅利金額，且計算結果高於上限，則套用最大紅利金額
    if (cfg.max_bonus_amount && cfg.max_bonus_amount > 0 && b > cfg.max_bonus_amount) {
      b = cfg.max_bonus_amount
    }

    return Math.round((b + Number.EPSILON) * 100) / 100
  }

  if (prize.bonus_reward_type === 'fixed') {
    const list = prize.fix_amount || []

    // 在固定檔位列表中，尋找所有存款金額小於等於目前金額的檔位
    const candidates = list.filter((item) => amt >= item.deposit_amount)

    // 若沒有任何符合條件的檔位，則不給紅利
    if (!candidates.length) return 0

    // 從候選檔位中選擇 deposit_amount 最大的那一檔
    const matched = candidates.reduce(
      (max, cur) => (cur.deposit_amount > max.deposit_amount ? cur : max),
      candidates[0],
    )

    // 依照該檔位設定的固定紅利金額
    return matched.bonus_amount || 0
  }

  return 0
})

const bonusText = computed(() => {
  const v = Number(bonus.value || 0)
  const hasFraction = Math.round(v * 100) % 100 !== 0
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: hasFraction ? 2 : 0,
  }).format(v)
})

const turnoverText = computed(() => {
  const promo = promotions.value[selectedPromotion.value]
  const amt = amountNumber.value
  const label = t('userCenter.withdrawalPage.requiredTurnoverAmount')

  if (!promo || !amt) return `${label}：₩ ${0}`
  if (promo.promotion_id === 'none') return `${label}：₩ ${toThousandth(amt)}`

  const {
    prize,
    bonus_turnover_multiplier,
    deposit_turnover_multiplier,
    exceed_bonus_deposit_turnover_multiplier
  } = promo

  let turnoverAmount = 0
  if (prize.bonus_reward_type === 'percentage') {
    const {
      bonus_percentage,
      max_bonus_amount,
      // maximum_turnover,
      min_bonus_amount,
      min_deposit_amount,
      // minimum_turnover,
    } = prize.percentage

    if (amt < min_deposit_amount) {
      return `${label}：₩ ${turnoverAmount}`
    } else {
      const result = calculateTurnover(amt, {
        bonusPercent: bonus_percentage,
        minBonus: min_bonus_amount,
        maxBonus: max_bonus_amount,
        depositMultiple: deposit_turnover_multiplier,
        bonusMultiple: bonus_turnover_multiplier,
        otherMultiple: exceed_bonus_deposit_turnover_multiplier,
      })

      turnoverAmount = result.totalTurnover
    }
  }
  if (prize.bonus_reward_type === 'fixed' && matchedFixedPromo.value) {
    turnoverAmount = calculateFixedTurnover(amt, {
      depositAmount: matchedFixedPromo.value.deposit_amount,
      bonusAmount: matchedFixedPromo.value.bonus_amount,
      depositMultiple: deposit_turnover_multiplier,
      bonusMultiple: bonus_turnover_multiplier,
      otherMultiple: exceed_bonus_deposit_turnover_multiplier,
    })
  }

  return `${label}：₩ ${toThousandth(turnoverAmount)}`
})

function toNext() {
  if (promotions.value.length === 0) {
    navigateTo(`/usercenter/transactioninfo?type=deposit&amount=${amountNumber.value}`)
  } else {
    navigateTo(
      `/usercenter/transactioninfo?type=deposit&amount=${amountNumber.value}&bonus=${bonus.value}&promotion_id=${promotions.value[selectedPromotion.value].promotion_id}&promotion_name=${promotions.value[selectedPromotion.value].name}&description=${promotions.value[selectedPromotion.value].remark}`,
    )
  }
}
</script>
