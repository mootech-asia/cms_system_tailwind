<template lang="pug">
div(class="mt-4 xl:mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4" :class="{ 'grid-cols-2': route.query.type === 'slots' }")
  div(
    v-for="(g, idx) in displayedGames"
    :key="`${g.id}-${idx}`"
    class="relative overflow-hidden rounded-3xl h-[160px] md:h-[140px] xl:h-[160px] ring-1 ring-white/10 bg-[#0B1733] group cursor-pointer"
    @click="goToGameList(g)"
  )
    img(src="/images/index/mainGame/img-livegame-bg.webp" class="absolute inset-0 w-full h-full rounded-xl xl:rounded-3xl object-cover")
    img(v-if="type === 'live'" :src="`/images/index/mainGame/live/live_${idx%33}.webp`" class="absolute right-[-1vw] md:right-[-6vw] xl:right-2 top-2 h-[90%] xl:h-[160px] pointer-events-none group-hover:scale-110 duration-500 ease-out")
    img(v-else-if="type === 'slot'" :src="`/images/index/mainGame/other/slot ${idx%26}.webp`" class="absolute right-0 xl:right-2 bottom-0 h-[90%] xl:h-[160px] pointer-events-none group-hover:scale-110 duration-500 ease-out")
    img(v-else :src="`/images/index/mainGame/other/slot ${idx%26}.png`" class="absolute right-0 bottom-0 h-[90%] xl:h-[160px] pointer-events-none group-hover:scale-110 duration-500 ease-out")
    img(v-if="getGameNameImageSrc(g)" :src="getGameNameImageSrc(g)" :class="!ImgScaleMap[g.vendor] ? 'w-[40%] xl:w-[100px]': ImgScaleMap[g.vendor]" class="absolute top-1/2 -translate-y-1/2 translate-x-[25%] pointer-events-none transform-gpu origin-left transition-transform duration-500 ease-out group-hover:scale-110")

Login(v-model="showLogin" initialMode="login")
</template>

<script setup>
import { ref, toRefs } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useI18n } from 'vue-i18n'
import { useAlertStore } from '~/stores/alert'
import { LiveGameLaunchMap } from '~/constants/mapping'
import { getLiveGameVendorKey } from '~/utils/keys'

const ImgScaleMap = {
  PP: 'w-[60%] translate-x-[15%] xl:w-[200px] xl:translate-x-[15px]',
  MG: 'w-[50%] xl:w-[180px] xl:translate-x-[30px]',
  Skywind: 'w-[60%] translate-x-[15%] xl:w-[170px] xl:translate-x-[10px]',
  Wazdan: 'w-[80%] translate-x-[-6%] xl:w-[250px] xl:translate-x-[-20px]',
  RelaxGaming: 'w-[70%] translate-x-[-5%] xl:w-[200px] xl:translate-x-[0px]',
  SAGaming: 'w-[50%] xl:w-[150px]',
  CockFight: 'w-[50%] xl:w-[150px]',
  AllbetLive: 'w-[55%] translate-x-[1%] xl:w-[170px] xl:translate-x-[0px]',
  WIFY: 'w-[80%] translate-x-[1%] xl:w-[250px] xl:translate-x-[10px]',
  BTGaming: 'w-[55%] xl:w-[150px]',
  CPGames: 'w-[55%] xl:w-[150px]',
  RoyalCasino: 'w-[55%] xl:w-[150px]',
  TGSpeed: 'w-[25%] translate-x-[40%]',
}

const userStore = useUserStore()
const alert = useAlertStore()
const { t } = useI18n()
const showLogin = ref(false)
const props = defineProps({
  displayedGames: {
    type: Array,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
})

const { displayedGames, type } = toRefs(props)
const route = useRoute()

function getGameNameImageSrc(g) {
  const name = String(g?.vendor || '').trim()
  if (!name) return ''

  const lower = name.toLowerCase()
  const ext = lower === 'bti sports' || lower === 'saba sports' ? 'svg' : 'png'
  const filename = `${name}.${ext}`
  return `/images/index/mainGame/live/${encodeURIComponent(filename)}`
}

function goToGameList(g) {
  if (!userStore.isLoggedIn) {
    showLogin.value = true
    return
  }
  
  if (route.query.type === 'sports' || route.query.type === 'live') {
    openGame(g)
  } else {
    navigateTo(`/gameList?vendor=${g.vendor}&type=${route.query.type}&gameId=${g.game_id}&gateway=${g.gateway}`)
  }
}

const openGame = async (g) => {
  let game_code = g.game_id
  // Live 遊戲指定點擊串聯到第三方遊戲大廳
  if (route.query.type === 'live') {
    const key = getLiveGameVendorKey({ vendor: g.vendor, gateway: g.gateway })
    game_code = LiveGameLaunchMap[key]?.game_code || 'unknown'
  }
  
  const res = await api.openGame({
    vendor_code: g.vendor,
    game_code,
    currency: 'krw',
    platform: 'web',
    gateway: g.gateway,
  })

  if (res.success && res?.data) {
    window.open(res.data, '_blank')
  } else {
    alert.openError(res.message, { cancellable: false })
  }
}
</script>
