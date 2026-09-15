<template lang="pug">
main(class="bg-[#060C34]")
  Banner(:banner-configs="bannerConfigs")
  Marquee(class="hidden xl:block")

  //- GameType
  div(class="w-full min-h-[calc(100vh-365px)] xl:min-h-[449px] h-full px-5 pt-6 xl:py-16 xl:px-[96px] 3xl:px-[160px]")
    GameFilter(
      :gameTitle="gameTitle"
      :vendorName="true"
      :showOptions="false"
      :gameOptions="gameOptions"
      :backUrl="`/gameType?type=${route.query.type}`"
      v-model:activeGameOption="activeGameOption"
      v-model:searchQuery="searchQuery"
      @search="search"
    )

    //- Games
    GameList(
      :displayedGames="games"
      :toggleFavorite="toggleFavorite"
      :loadMore="loadMore"
      :hasMore="hasMore"
      :loadingMore="loadingMore"
    )
</template>
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { api } from '~/composables/useApi'
import { usePlatformData } from '~/composables/usePlatformData'
import { useGlobalUiStore } from '~/stores/globalUi'
import { useUserStore } from '~/stores/user'
import GameFilter from '~/components/GameFilter.vue'
import GameList from '~/components/GameList.vue'

const userStore = useUserStore()
const globalUiStore = useGlobalUiStore()
const { initPlatformData } = usePlatformData()
const route = useRoute()
const { t } = useI18n()
const activeGameOption = ref('all')
const bannerConfigs = ref([])
const gameTitle = computed(() => {
  const match = gameTitleList.value.find((item) => item.type === route.query.type)
  return match ? t('gameType.types.' + match.tKey) : ''
})

const bannerMaps = {
  hotgames: 'hot_game_banner_d',
  mini_game: 'mini_game_banner_d',
  slot: 'slots_banner_d',
  sports: 'sports_banner_d',
  esports_games: 'esports_banner_d',
  live: 'live_banner_d',
  poker_games: 'poker_banner_d',
  fish: 'fish_banner_d',
  lottery_games: 'lottery_banner_d',
}

const gameOptions = computed(() => [
  { id: 'all', name: t('gameList.options.all') },
  { id: 'favorite', name: t('gameList.options.favorite') },
])

const gameTitleList = ref([
  { type: 'mini_game', tKey: 'miniGames' },
  { type: 'slot', tKey: 'slots' },
  { type: 'sports', tKey: 'sports' },
  { type: 'esports_games', tKey: 'esports' },
  { type: 'live', tKey: 'liveCasino' },
  { type: 'poker_games', tKey: 'poker' },
  { type: 'fish', tKey: 'fish' },
])

watch(
  () => [route.query.type, globalUiStore.announcements],
  () => {
    const tq = route.query.type
    const items = globalUiStore.announcements?.banner_items || []
    const matchedItems = items.filter((item) => item.meta_json?.config?.banner_group_name === bannerMaps[tq])
    bannerConfigs.value = matchedItems.flatMap((item) => item.meta_json?.config?.banner_configs || [])
  },
  { immediate: true },
)

const searchQuery = ref('')

const games = ref([])
const allGames = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loadingMore = ref(false)
const isSearching = ref(false)

const totalPages = computed(() => {
  if (!total.value || !pageSize.value) return 0
  return Math.ceil(total.value / pageSize.value)
})

const hasMore = computed(() => {
  if (isSearching.value) return false
  if (!total.value) return false
  if (totalPages.value && page.value >= totalPages.value) return false
  return games.value.length < total.value
})

onMounted(async () => {
  await initPlatformData({
    announcements: true,
    favorites: true,
  })
  resetAndLoad()
})

watch(
  () => [route.query.type, route.query.vendor],
  () => {
    resetAndLoad()
  },
)

function resetAndLoad() {
  page.value = 1
  total.value = 0
  games.value = []
  isSearching.value = false
  getGames()
}

async function getGames(append = false) {
  if (append && totalPages.value && page.value > totalPages.value) return

  const { data } = await api.getGameList({
    game_vendor: route.query.vendor,
    game_type: route.query.type,
    page: page.value,
    page_size: pageSize.value,
    gateway: route.query.gateway
  })

  const rawGames = data.games || []

  // 先顯示原始遊戲列表
  const baseGames = append ? [...games.value, ...rawGames] : rawGames
  games.value = baseGames
  total.value = data.total

  if (append && !rawGames.length) {
    total.value = baseGames.length
  }

  const token = useCookie('token')
  if (!token.value) return

  // 等待 userStore.isLoggedIn / favoriteList 準備好，再標記 isFavorite
  const intervalId = setInterval(() => {
    if (!token.value) {
      clearInterval(intervalId)
      return
    }

    if (!userStore.isLoggedIn || !Array.isArray(globalUiStore.favoriteList?.games)) {
      return
    }

    const enrichedGames = baseGames.map((game) => {
      const find = globalUiStore.favoriteList.games.find(
        (g) => g.game_id === game.game_id && g.provider === game.provider,
      )
      return {
        ...game,
        isFavorite: !!find,
      }
    })

    allGames.value = enrichedGames
    games.value = enrichedGames
    clearInterval(intervalId)
  }, 500)
}

function search() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    isSearching.value = false
    games.value = []
    page.value = 1
    total.value = 0
    getGames()
    return
  }

  isSearching.value = true
  games.value = allGames.value.filter((game) => game.display_name.toLowerCase().includes(q))
}

async function toggleFavorite(game, idx) {
  const find = globalUiStore.favoriteList.games.find(
    (g) => g.game_id === game.game_id && g.provider === game.provider,
  )

  games.value[idx].isFavorite = !games.value[idx].isFavorite

  if (find) {
    const res = await api.removeFavorite({
      game_id: game.game_id,
      provider: game.provider,
      gateway: game.gateway,
    })
    globalUiStore.favoriteList.games = globalUiStore.favoriteList.games.filter(
      (g) => g.game_id !== game.game_id,
    )
  } else {
    const res = await api.addFavorite({
      game_id: game.game_id,
      game_type: route.query.type,
      provider: game.provider,
      gateway: game.gateway,
    })
    globalUiStore.favoriteList.games.push(game)
  }
}

async function loadMore() {
  if (loadingMore.value) return
  if (!hasMore.value) return
  if (totalPages.value && page.value >= totalPages.value) return
  loadingMore.value = true
  try {
    page.value += 1
    await getGames(true)
  } finally {
    loadingMore.value = false
  }
}
</script>
