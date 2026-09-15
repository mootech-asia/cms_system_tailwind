<template lang="pug">
div(:class="containerClass")
  img(:src="bgSrc" :class="bgImgClass")
  img(v-if="fgSrcLeft" :src="fgSrcLeft" :class="['absolute bottom-0 pointer-events-none duration-500 ease-out', fgClassLeft]")
  img(v-if="fgSrc" :src="fgSrc" :class="['absolute bottom-0 pointer-events-none duration-500 ease-out', fgClass]")
  img(v-if="nameSrc" :src="nameSrc" :class="nameImgClass")
  button(type="button" :class="buttonClass") {{ $t('hotGame.playNow') }}
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: String, default: 'small' }, // 'small' | 'big' | 'wide'
  sizeClass: { type: String, default: '' }, // 覆寫外框尺寸（例如讓外框尺寸跟著背景圖）
  fgSrc: { type: String, default: '' },
  fgSrcLeft: { type: String, default: '' },
  nameSrc: { type: String, default: '' },
  bgClass: { type: String, default: '' },
  bgSrc: { type: String, default: '/images/index/mainGame/img-livegame-bg.webp' },
  fgClass: { type: String, default: 'h-[180px] md:h-[275px] right-3 top-2' },
  fgClassLeft: { type: String, default: 'h-[180px] md:h-[275px] -left-16 md:-left-0' },
  nameClass: { type: String, default: '' },
  btnClass: { type: String, default: '' },
})

const baseContainer =
  'relative rounded-xl xl:rounded-3xl transition-transform duration-500 ease-out transform-gpu origin-top group-hover:scale-110 hover:z-10 will-change-transform overflow-hidden'

const containerClass = computed(() => {
  if (props.sizeClass) return `${baseContainer} ${props.sizeClass}`
  if (props.size === 'wide') return `${baseContainer} w-full h-[250px] md:h-[300px]`
  if (props.size === 'big') return `${baseContainer} w-full h-[550px]`
  return `${baseContainer} w-[280px] h-[175px] md:w-[400px] md:h-[270px]`
})

const defaultBgClass = computed(() => {
  if (props.size === 'wide') return 'absolute inset-0 w-full h-full rounded-xl xl:rounded-3xl object-cover'
  if (props.size === 'big') return 'absolute inset-0 w-full max-h-[800px] top-12 rounded-xl xl:rounded-3xl object-cover'
  return 'absolute inset-0 w-full max-h-[250px] top-5 rounded-xl xl:rounded-3xl object-cover'
})

// 名稱圖以「底部」為基準：不論圖片原始寬高、比例為何，
// 都水平置中，且與下方按鈕保持固定間距（圖片變高只會往上長）。
const defaultNameClass = computed(() => {
  const base =
    'absolute pointer-events-none w-auto h-auto object-contain transform-gpu transition-transform duration-500 ease-out scale-[0.7] group-hover:scale-[0.8]'
  if (props.size === 'wide')
    return `${base} left-1/2 -translate-x-1/2 bottom-[70px] md:bottom-[84px] max-w-[50%] max-h-[45%] origin-bottom`
  if (props.size === 'big')
    return `${base} top-[40%] -translate-y-1/2 translate-x-[25%] w-[40%] origin-left`
  return `${base} left-1/2 -translate-x-1/2 bottom-[45%] md:bottom-[45%] max-w-[60%] max-h-[50%] origin-bottom`
})

const nameImgClass = computed(() => props.nameClass || defaultNameClass.value)
const bgImgClass = computed(() => props.bgClass || defaultBgClass.value)

const defaultBtnClass = computed(() => {
  if (props.size === 'wide')
    return 'left-1/2 -translate-x-1/2 w-[200px] md:w-[280px] h-9 md:h-12 bottom-6 rounded-xl text-base md:text-2xl'
  if (props.size === 'big') return 'w-[360px] h-[70px] left-16 bottom-36 rounded-2xl text-[32px]'
  return 'left-1/2 -translate-x-1/2 w-[126px] md:w-[180px] h-6 md:h-9 bottom-10 rounded-md md:rounded-xl text-xs md:text-base'
})

const buttonClass = computed(() => [
  'absolute font-bold bg-gradient-to-r from-[#F3AC2F] to-[#E528A5] text-[#060C34] transition-colors duration-200 group-hover:bg-none group-hover:bg-[#E52865] group-hover:text-white',
  props.btnClass || defaultBtnClass.value,
])
</script>
