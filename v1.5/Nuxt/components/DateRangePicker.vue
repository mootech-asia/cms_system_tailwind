<template lang="pug">
div(class="w-full relative inline-block")
  NuxtImg(src="/images/icon/usercenter/date.svg" alt="date" class="w-6 h-6 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none select-none")
  DatePicker(
    :modelValue="innerValue"
    @update:modelValue="onUpdate"
    selectionMode="range"
    :dateFormat="dateFormat"
    aria-label="Date"
    :numberOfMonths="isMobile ? 1 : 2"
    :maxDate="maxSelectableDate"
    appendTo="body"
    :placeholder="placeholder"
    class="w-[260px]"
    inputClass="h-10 pl-10 text-[#060C34] border-none"
    showButtonBar
  )
    template(#buttonbar="{ todayCallback, clearCallback }")
      div(class="flex justify-between w-full gap-2 px-2 pb-2")
        div(class="flex flex-wrap gap-2")
          button(type="button" class="px-2 py-1 rounded border" @click="setToday") {{ $t('common.dateRange.today') }}
          button(type="button" class="px-2 py-1 rounded border" @click="setYesterday") {{ $t('common.dateRange.yesterday') }}
          button(type="button" class="px-2 py-1 rounded border" @click="setThisWeek") {{ $t('common.dateRange.thisWeek') }}
          button(type="button" class="px-2 py-1 rounded border" @click="setLastWeek") {{ $t('common.dateRange.lastWeek') }}
          button(type="button" class="px-2 py-1 rounded border" @click="setLastMonth") {{ $t('common.dateRange.lastMonth') }}
  button(
    type="button"
    class="absolute right-2 top-1/2 -translate-y-1/2 text-[#6D6D6D] hover:text-[#060C34]"
    v-if="hasAny && !isBothToday"
    @click="$emit('clear')"
  ) ✕
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import DatePicker from 'primevue/datepicker'

const props = defineProps({
  modelValue: { type: [Array, Date, String, null], default: null },
  placeholder: { type: String, default: '' },
  dateFormat: { type: String, default: 'yy/mm/dd' },
})
const emit = defineEmits(['update:modelValue', 'clear'])

const innerValue = ref(props.modelValue)
const maxSelectableDate = computed(() => endOfDay(new Date()))
watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = normalizeRangeValue(val)
  },
  { immediate: true },
)

const isMobile = ref(false)
let _resizeHandler
onMounted(() => {
  initDatePickerColors()
  _resizeHandler = () => {
    isMobile.value = typeof window !== 'undefined' ? window.innerWidth < 768 : false
  }
  _resizeHandler()
  updateWidths()
  if (typeof window !== 'undefined')
    window.addEventListener('resize', _resizeHandler, { passive: true })
})
onUnmounted(() => {
  if (typeof window !== 'undefined' && _resizeHandler)
    window.removeEventListener('resize', _resizeHandler)
})

function initDatePickerColors() {
  document.documentElement.style.setProperty('--p-datepicker-date-selected-background', '#060C34')
  document.documentElement.style.setProperty(
    '--p-datepicker-date-range-selected-background',
    '#E7E7E7',
  )
  document.documentElement.style.setProperty('--p-datepicker-date-range-selected-color', '#334155')
}

const hasAny = computed(() => {
  const v = innerValue.value
  if (Array.isArray(v)) return !!(v[0] || v[1])
  return !!v
})

function toDate(v) {
  if (!v) return null
  if (v instanceof Date) return v
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const isBothToday = computed(() => {
  const v = innerValue.value
  if (!Array.isArray(v)) return false

  const start = toDate(v[0])
  const end = toDate(v[1])
  if (!start || !end) return false

  const today = new Date()
  return isSameDay(start, today) && isSameDay(end, today)
})

function onUpdate(val) {
  const next = normalizeRangeValue(val)
  innerValue.value = next
  emit('update:modelValue', next)
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function clampToMaxDate(d) {
  if (!d) return null
  const max = maxSelectableDate.value
  return d.getTime() > max.getTime() ? new Date(max) : d
}

function normalizeRangeValue(val) {
  if (Array.isArray(val)) {
    return val.map((item) => clampToMaxDate(toDate(item)))
  }

  return clampToMaxDate(toDate(val))
}

function setRange(start, end) {
  const safeStart = clampToMaxDate(startOfDay(start))
  const safeEnd = clampToMaxDate(endOfDay(end))
  const v = [safeStart, safeEnd]
  innerValue.value = v
  emit('update:modelValue', v)
}

function setToday() {
  const d = new Date()
  setRange(d, d)
}

function setYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  setRange(d, d)
}

function getIsoWeekStart(d) {
  const x = startOfDay(d)
  const day = x.getDay() || 7
  x.setDate(x.getDate() - (day - 1))
  return x
}

function setThisWeek() {
  const now = new Date()
  const start = getIsoWeekStart(now)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  setRange(start, end > now ? now : end)
}

function setLastWeek() {
  const now = new Date()
  const thisStart = getIsoWeekStart(now)
  const start = new Date(thisStart)
  start.setDate(start.getDate() - 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  setRange(start, end)
}

function setLastMonth() {
  const now = new Date()
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const start = new Date(firstThisMonth.getFullYear(), firstThisMonth.getMonth() - 1, 1)
  const end = new Date(firstThisMonth.getFullYear(), firstThisMonth.getMonth(), 0)
  setRange(start, end)
}

function onClear(clearCallback) {
  if (typeof clearCallback === 'function') clearCallback()
  innerValue.value = null
  emit('update:modelValue', null)
  emit('clear')
}

function updateWidths() {
  const inputEl = document.querySelector('.p-inputtext')
  const pickerEl = document.querySelector('.p-datepicker')
  if (!inputEl || !pickerEl) return
  inputEl.style.width = '155px'
  pickerEl.style.width = '215px'
}
</script>

<style scoped>
:deep(.p-inputtext) {
  background-color: #ffffff !important;
  color: #060c34 !important;
  margin-left: 36px;
  padding-left: 0;
  padding-right: 0;
  border: none !important;
  border-radius: 8px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  box-shadow: none;
  font-size: 14px;
}
:deep(.p-inputtext)::placeholder {
  color: #060c34;
}

:deep(.p-datepicker),
:deep(.p-datepicker .p-datepicker-header) {
  width: -webkit-fill-available !important;
  background-color: #ffffff !important;
  color: #060c34 !important;
  border-radius: 8px;
}

@media (min-width: 1280px) {
  :deep(.p-datepicker),
  :deep(.p-datepicker .p-datepicker-header) {
    width: 215px !important;
  }
}
</style>
