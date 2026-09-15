<template lang="pug">
div(class="relative group")
  button(type="button" class="box-border w-auto h-10 inline-flex items-center justify-center rounded-md text-white text-sm font-normal border-[1px] border-white py-2 px-3 whitespace-nowrap")
    NuxtImg(src="/images/icon/lang-us.svg" alt="lang" class="w-6 h-6 mr-1")
    span(class="text-white") {{ currentLabel }}
  div(class="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block z-[70]")
    div(class="rounded-lg bg-black/80 text-white w-max")
      button(v-for="opt in options" :key="opt.value" type="button" class="flex items-center w-full text-sm rounded-lg hover:bg-neutral-700 whitespace-nowrap px-3 py-2" @click="select(opt.value)")
        NuxtImg(:src="opt.icon" alt="lang" class="w-[24px] h-[14px] mr-1")
        p {{ opt.label }}
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const options = [
  { value: 'en', label: 'English', icon: '/images/icon/lang-us2.svg' },
  { value: 'ko', label: '한국어', icon: '/images/icon/lang-kr.png' },
]
const { locale, setLocale } = useI18n()
const isLanguageHover = ref(false)
const current = computed(() => locale.value)
const currentLabel = computed(
  () => options.find((o) => o.value === current.value)?.label || '한국어',
)

async function select(val) {
  try {
    await setLocale(val)
  } catch {
    locale.value = val
  }
}
</script>
