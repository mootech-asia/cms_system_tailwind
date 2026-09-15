<template lang="pug">
div(v-if="backUrl" class="flex items-center gap-1.5 xl:gap-2 mb-8 ")
  div(class="flex items-center cursor-pointer" @click="navigateTo(backUrl)")
    NuxtImg(src="/images/icon/back-white.svg" alt="Back White" class="w-[16px] h-[16px]")
    p(class="text-[16px] md:text-[20px] font-bold text-white") {{ $t('common.back') }}
div(class="relative w-full")
  div(class="flex items-center xl:border-b-gradient-primary gap-2 pb-1")
    div(class="text-gradient-primary text-xl leading-relaxed xl:text-[28px] font-bold") {{ gameTitle }}
      div(v-if="route.name === 'gameList'" class="inline-block bg-[#B0B0B0] w-[1px] h-4 ml-4")
      span(v-if="route.name === 'gameList'" class="ml-2 text-xl text-[#B0B0B0] font-bold") {{ route.query.vendor }}

div(class="flex flex-col md:flex-row justify-between md:mt-[28px]")
  template(v-if="showOptions")
    div(class="flex flex-row")
      div(class="w-1/2 xl:w-fit flex justify-center items-center px-4 py-2 border-b border-[#4F4F4F] cursor-pointer" v-for="game in gameOptions" :key="game.id"
        :class="{ 'border-b-gradient-primary': modelActiveGameOption === game.id }" @click="updateActive(game.id)")
        h3(class="whitespace-nowrap text-white font-bold" :class="{ 'text-gradient-primary': modelActiveGameOption === game.id }") {{ game.name }}
    div(class="flex-1 border-b border-[#4F4F4F] mr-4 hidden md:block")

  form(class="flex items-center gap-2 md:ml-auto mt-4 xl:mt-0" @submit.prevent="onSearch")
    input(
      v-model="modelSearchQuery"
      type="text"
      :placeholder="placeholder"
      class="game-filter-search-input w-full xl:w-[288px] h-10 rounded-lg bg-[#1E1E1E] text-sm text-white placeholder:text-[#E7E7E7] px-4 border border-white/10 outline-none transition"
    )
    button(
      type="submit"
      class="min-w-[102px] inline-flex items-center px-3 py-2 rounded-lg text-gradient-primary transform-gpu transition-transform duration-200 ease-out border-gradient-primary-mask hover:translate-y-[1px]"
      @mouseenter="setIsHover(true)"
      @mouseleave="setIsHover(false)"
    )
      NuxtImg(src="/images/icon/search-gradient.svg" alt="Search Gradient" class="w-[18px] h-[18px] mr-1")
      span(class="text-gradient-primary md:text-sm font-bold") {{ $t('common.search') }}
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()

const props = defineProps({
  gameTitle: { type: String, default: '' },
  vendorName: { type: Boolean, default: false },
  showOptions: { type: Boolean, default: false },
  gameOptions: { type: Array, default: () => [] },
  activeGameOption: { type: String, default: '' },
  searchQuery: { type: String, default: '' },
  backUrl: { type: String, default: '' },
  isGame: { type: Boolean, default: false }
})
const emit = defineEmits(['update:activeGameOption', 'update:searchQuery', 'search'])

const modelActiveGameOption = computed({
  get: () => props.activeGameOption,
  set: (v) => emit('update:activeGameOption', v),
})
const modelSearchQuery = computed({
  get: () => props.searchQuery,
  set: (v) => emit('update:searchQuery', v),
})

const placeholder = computed(() => {
  if(props.isGame) {
    return t('common.gameName')
  }

  return route.name === 'gameType' && route.query.type !== 'hotgames' ? t('common.vendorName') : t('common.gameName')
})

function updateActive(id) {
  modelActiveGameOption.value = id
}
function onSearch() {
  emit('search', modelActiveGameOption.value)
}

const isHover = ref(false)
function setIsHover(value) {
  isHover.value = value
}
</script>

<style scoped>
.game-filter-search-input:focus {
  border-color: transparent;
  border-width: 2px;
  background:
    linear-gradient(#1e1e1e, #1e1e1e) padding-box,
    linear-gradient(90deg, var(--linear-gradient-pink), var(--linear-gradient-orange)) border-box;
}
</style>
