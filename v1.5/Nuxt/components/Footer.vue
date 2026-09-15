<template lang="pug">
footer(v-show="showFooter" class="w-full bg-[#060C34] pb-20 xl:pb-4 py-4 xl:py-8 px-6 xl:px-[84px] 3xl:px-[160px]")
  div(class="w-full h-[60px] overflow-hidden flex items-center")
    div(class="footer-marquee-track flex shrink-0 w-max whitespace-nowrap will-change-transform")
      div(class="flex items-center gap-10 pr-10")
        NuxtImg(v-for="(img, idx) in footerImages" :key="`a-${idx}`" :src="img" alt="footer" class="h-[60px]")
      div(class="flex items-center gap-10 pr-10" aria-hidden="true")
        NuxtImg(v-for="(img, idx) in footerImages" :key="`b-${idx}`" :src="img" alt="footer" class="h-[60px]")

  //- Language
  div(class="flex justify-end xl:hidden mt-12 xl:mt-0")
    div(ref="root" class="relative")
      button(type="button" class="w-[130px] h-8 flex items-center gap-1 border border-white/60 rounded-lg px-2 py-2 text-white text-sm bg-transparent hover:border-white focus:outline-none" @click="open = !open")
        NuxtImg(src="/images/icon/lang-us.svg" alt="world" class="w-7 h-7")
        span(class="font-semibold") {{ current.label }}
      transition(name="fade-scale")
        div(v-if="open" class="absolute right-0 mt-3 w-[130px] rounded-lg bg-black text-white ring-white/10 px-3 py-2")
          button(v-for="lang in languages" :key="lang.code" @click="select(lang)" class="h-[25px] flex items-center gap-1 w-full rounded-xl hover:bg-white/10 text-left")
            NuxtImg(:src="lang.image" alt="world" class="w-6 h-[14px]")
            span(class="text-sm") {{ lang.label }}

  //- Logo
  div(class="flex justify-start xl:justify-center xl:mt-14")
    NuxtImg(src="/images/index/img-logo.png" alt="logo" class="w-[88px] xl:w-[200px]")

  //- Copyright
  div(class="xl:text-center my-8")
    p(class="text-[#B0B0B0] text-sm") {{ $t('footer.desc') }}
    p(class="text-[#B0B0B0] text-sm") {{ $t('footer.desc2') }}
    p(class="text-[#888888] text-sm mt-2 xl:mt-4") {{ $t('footer.copyright') }}

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const languages = [
  { code: 'en', label: 'English', image: '/images/icon/lang-us2.svg' },
  { code: 'ko', label: '한국어', image: '/images/icon/lang-kr.png' },
]
const { locale, setLocale } = useI18n()
const current = computed(() => languages.find((l) => l.code === locale.value) || languages[1])
const open = ref(false)
const root = ref(null)
const route = useRoute()
const showFooter = ref(true)

const footerImages = [
  '7mojo.png',
  'APGaming.png',
  'AdvantPlay.png',
  'AlizeSlots.png',
  'Askmeslot.png',
  'ILoveU.png',
  'KingMidas.png',
  'Live88.png',
  'PGSoft.png',
  'PlayNGo.png',
  'Spinomenal.png',
  'TurboGames.png',
  'UpUpGame.png',
  'Winfinity.png',
  'YeeBet.png',
  'YellowBat.png',
  'hacksaw.png',
].map((name) => encodeURI(`/images/footer/${name}`))

async function select(lang) {
  try {
    await setLocale(lang.code)
  } catch {
    locale.value = lang.code
  }
  open.value = false
}

function onDocClick(e) {
  if (!root.value) return
  if (!root.value.contains(e.target)) open.value = false
}

function syncShowFooter() {
  const p = route.path.toLowerCase()
  if (p.includes('/sports')) showFooter.value = false
  else showFooter.value = !(p === '/usercenter' || p.startsWith('/usercenter/'))
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  syncShowFooter()
})

watch(() => route.fullPath, syncShowFooter, { immediate: true })

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
.footer-marquee-track {
  animation: footer-marquee 30s linear infinite;
}

@keyframes footer-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
