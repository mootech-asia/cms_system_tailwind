<template lang="pug">
div(class="w-full")
  div(class="flex gap-2")
    //- Custom country dropdown
    div(class="relative")
      button(type="button" class="w-[100px] h-[30px] px-2 rounded-md bg-[#1F1F1F] text-white text-sm border border-white/10 flex items-center justify-between focus:outline-none focus:border-2 focus:border-[#00D0FF]"
        @click="toggleOpen"
      )
        div(class="flex items-center gap-2")
          span(class="text-lg") {{ selectedCountry.flag }}
          span(class="truncate text-left text-xs sm:text-sm")
            | ({{ selectedCountry.dialCode }})
        span(class="text-xs opacity-70" v-if="!isOpen") ▾
        span(class="text-xs opacity-70" v-else) ▴

      transition(name="fade-country")
        ul(v-if="isOpen" class="absolute z-20 mt-1 w-[calc(100vw-80px)] xl:w-[300px] max-h-60 overflow-auto rounded-md bg-[#0A1140] border border-white/20 shadow-xl")
          li(v-for="c in countries" :key="c.iso2" class="px-2 py-1.5 flex items-center gap-2 text-xs sm:text-sm text-white cursor-pointer hover:bg-[#122870]"
            @click="selectCountry(c.iso2)"
          )
            span(class="text-lg") {{ c.flag }}
            span(class="truncate") {{ $t(c.labelKey) }} ({{ c.dialCode }})

    input(
      v-model="localNumber"
      type="tel"
      inputmode="numeric"
      :placeholder="placeholder"
      class="flex-1 min-w-0 h-[30px] px-3 rounded-md bg-[#1F1F1F] text-white text-sm placeholder-[#6D6D6D] border border-white/10 focus:outline-none focus:border-2 focus:border-[#00D0FF]"
      @input="onNumberInput"
      @blur="emitCombined"
      @keyup.enter="emitCombined"
    )
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { parsePhoneNumberFromString } from 'libphonenumber-js/min'

const props = defineProps({
  mobile: { type: String, default: '' },
  mobileCode: { type: String, default: '' },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:mobile', 'update:mobileCode'])

const { locale } = useI18n()

const countries = ref([
  { iso2: 'KR', dialCode: '+82', labelKey: 'phoneCountry.kr', flag: '🇰🇷' },
  { iso2: 'TH', dialCode: '+66', labelKey: 'phoneCountry.th', flag: '🇹🇭' },
  { iso2: 'VN', dialCode: '+84', labelKey: 'phoneCountry.vn', flag: '🇻🇳' },
  { iso2: 'MY', dialCode: '+60', labelKey: 'phoneCountry.my', flag: '🇲🇾' },
  { iso2: 'KH', dialCode: '+855', labelKey: 'phoneCountry.kh', flag: '🇰🇭' },
  { iso2: 'CN', dialCode: '+86', labelKey: 'phoneCountry.cn', flag: '🇨🇳' },
  { iso2: 'PH', dialCode: '+63', labelKey: 'phoneCountry.ph', flag: '🇵🇭' },
  { iso2: 'ID', dialCode: '+62', labelKey: 'phoneCountry.id', flag: '🇮🇩' },
])

const selectedIso2 = ref('KH')
const localNumber = ref('')

const isOpen = ref(false)

const selectedCountry = computed(
  () => countries.value.find((c) => c.iso2 === selectedIso2.value) || countries.value[0],
)

function emitCombined() {
  const c = selectedCountry.value
  if (!c) {
    emit('update:mobile', localNumber.value || '')
    return
  }

  const raw = `${c.dialCode}${localNumber.value || ''}`

  // 嘗試用 libphonenumber-js 轉成 E.164，失敗就用 raw
  try {
    const phone = parsePhoneNumberFromString(raw, c.iso2)
    if (phone && phone.isValid()) {
      // 有效就更新 mobile / mobileCode
      const e164 = phone.number || raw
      emit('update:mobile', localNumber.value || '')
      emit('update:mobileCode', String(c.dialCode).replace(/^\+/, ''))
      return
    }
  } catch (e) {
    // ignore parse errors
  }
  // 無法解析時，仍然更新分開的欄位
  emit('update:mobile', localNumber.value || '')
  emit('update:mobileCode', String(c.dialCode).replace(/^\+/, ''))
}

// 如果外部已經有欄位值，嘗試同步回本地狀態（簡單版）
watch(
  () => ({ mobile: props.mobile, mobileCode: props.mobileCode }),
  (val) => {
    const mobile = String(val.mobile || '')
    const code = String(val.mobileCode || '')

    localNumber.value = mobile

    if (code) {
      const dialWithPlus = `+${code}`
      const matchByCode = countries.value.find((c) => c.dialCode === dialWithPlus)
      if (matchByCode) {
        selectedIso2.value = matchByCode.iso2
        return
      }
    }
  },
  { immediate: true, deep: true },
)

watch(selectedIso2, () => {
  // 切換國家時，重新組合一次
  emitCombined()
})

function toggleOpen() {
  isOpen.value = !isOpen.value
}

function selectCountry(iso2) {
  selectedIso2.value = iso2
  isOpen.value = false
}

function onNumberInput(event) {
  const raw = event?.target?.value ?? ''
  const digitsOnly = String(raw).replace(/[^0-9]/g, '')
  if (digitsOnly !== raw) {
    event.target.value = digitsOnly
  }
  localNumber.value = digitsOnly
}

const placeholder = computed(() => props.placeholder)
</script>

<style scoped>
.fade-country-enter-active,
.fade-country-leave-active {
  transition: opacity 120ms ease;
}
.fade-country-enter-from,
.fade-country-leave-to {
  opacity: 0;
}
</style>
