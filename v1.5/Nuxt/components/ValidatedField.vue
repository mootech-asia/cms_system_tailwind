<template lang="pug">
div
  label(:for="id" class="block text-white/80 mb-1") {{ label }}
  template(v-if="toggleable")
    div(class="relative")
      input(:id="id" v-model.trim="localValue" :type="resolvedType" :placeholder="placeholder" :disabled="disabled"
        class="w-full h-[30px] pl-3 pr-10 rounded-md bg-[#1F1F1F] text-white text-sm placeholder-[#6D6D6D] border border-white/10 focus:outline-none focus:border-2 focus:border-[#00D0FF] disabled:opacity-60 disabled:cursor-not-allowed"
        :class="{ 'border-2 border-[#FF5470] focus:border-[#FF5470]': invalid }")
      button(type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white" @click="localShow = !localShow")
        NuxtImg(v-if="!localShow" src="/images/icon/eye.svg" alt="eye" class="w-4 h-4")
        NuxtImg(v-else src="/images/icon/eye-show.svg" alt="eye-show" class="w-4 h-4")
  template(v-else)
    div(v-if="resolvedType === 'date'" class="relative")
      input(:id="id" ref="dateEl" v-model.trim="localValue" :type="resolvedType" :placeholder="''" @click="openDatePicker" :disabled="disabled"
        class="w-full h-[30px] px-3 rounded-md bg-[#1F1F1F] text-white text-sm  placeholder-[#6D6D6D] border border-white/10 focus:outline-none focus:border-2 focus:border-[#00D0FF]"
        :class="{ 'border-2 border-[#FF5470] focus:border-[#FF5470]': invalid, 'has-value': !!localValue }")
      span(v-if="!localValue" class="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 text-[#6D6D6D] text-sm" @click="openDatePicker") {{ placeholder || 'Enter your birthday' }}
    input(v-else :id="id" v-model.trim="localValue" :type="resolvedType" :placeholder="placeholder" :disabled="disabled"
      class="w-full h-[30px] px-3 rounded-md bg-[#1F1F1F] text-white text-sm  placeholder-[#6D6D6D] border border-white/10 focus:outline-none focus:border-2 focus:border-[#00D0FF] disabled:opacity-60 disabled:cursor-not-allowed"
      :class="{ 'border-2 border-[#FF5470] focus:border-[#FF5470]': invalid }")
  p(v-if="help" class="text-[#FF5470] text-sm mt-1") {{ help }}
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApiRulesStore } from '~/stores/apiRules'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  fieldName: { type: String, required: true },
  id: { type: String, default: '' },
  inputType: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  label: { type: String, default: '' },
  toggleable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

onMounted(() => {
  emit('invalid', { fieldName: props.fieldName, invalid: !!failRule.value })
})

const emit = defineEmits(['update:modelValue', 'invalid'])
const apiRulesStore = useApiRulesStore()
const { t } = useI18n()

const localValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const localShow = ref(false)
const resolvedType = computed(() =>
  props.toggleable ? (localShow.value ? 'text' : 'password') : props.inputType,
)

const rulesReady = computed(() => (apiRulesStore.rules || []).length > 0)
const field = computed(() =>
  (apiRulesStore.rules || []).find((f) => f.field_name === props.fieldName),
)

const failRule = computed(() => {
  const f = field.value
  const v = String(localValue.value ?? '').trim()
  if (!rulesReady.value || !f || v.length === 0) return null
  const arr = f.patterns || []
  const minLen = Number(f.min)
  if (Number.isFinite(minLen) && v.length < minLen) {
    return (
      arr.find(
        (p) =>
          p?.name === 'lengthRange' ||
          /length/i.test(p?.name || '') ||
          /lengthRange/.test(p?.id || ''),
      ) || null
    )
  }
  for (const p of arr) {
    const rex = p?.regex?.test
      ? p.regex
      : p?.regexSource
        ? new RegExp(p.regexSource, p.regexFlags || '')
        : null
    if (rex && !rex.test(v)) return p
  }
  return null
})

const invalid = computed(() => !!failRule.value)
const help = computed(() => {
  const d = failRule.value?.description
  if (!d) return ''
  const params = failRule.value?.i18nParams || undefined
  if (typeof d === 'string') return t(d, params)
  return String(d)
})

const dateEl = ref(null)
function openDatePicker() {
  const el = dateEl.value
  if (!el) return
  if (typeof el.showPicker === 'function') el.showPicker()
  else el.focus()
}

watch(invalid, (val) => {
  emit('invalid', { fieldName: props.fieldName, invalid: val })
})
</script>

<style scoped>
:deep(input[type='date']) {
  color-scheme: dark;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px 16px;
  padding-right: 32px;
}
:deep(input[type='date']:not(.has-value):not(:focus)::-webkit-datetime-edit) {
  color: transparent;
}
:deep(input[type='date']:not(.has-value):not(:focus)::-webkit-datetime-edit-year-field) {
  color: transparent;
}
:deep(input[type='date']:not(.has-value):not(:focus)::-webkit-datetime-edit-month-field) {
  color: transparent;
}
:deep(input[type='date']:not(.has-value):not(:focus)::-webkit-datetime-edit-day-field) {
  color: transparent;
}
:deep(input[type='date'].has-value::-webkit-datetime-edit),
:deep(input[type='date']:focus::-webkit-datetime-edit) {
  color: inherit;
}
:deep(input[type='date']::-webkit-calendar-picker-indicator) {
  opacity: 0;
}
</style>
