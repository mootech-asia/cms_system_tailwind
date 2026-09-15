<template lang="pug">
main(class="bg-[#060C34]")
  Banner(:banner-configs="bannerConfigs")
  Marquee(class="hidden xl:block")

  //- GameType
  div(class="w-full min-h-[calc(100vh-353px)] xl:min-h-[449px] h-full px-5 pt-6 xl:py-16 xl:px-[96px] 3xl:px-[160px]")
    template(v-if="activeGameOption !== 'allGames'")
      GameFilter(
        :key="'normalGame'"
        :gameTitle="gameTitle"
        :showOptions="route.query.type !== 'hotgames'"
        :gameOptions="gameOptions"
        v-model:activeGameOption="activeGameOption"
        v-model:searchQuery="searchQuery"
        @search="search"
      )
    template(v-else)
      GameFilter(
        :key="'allGames'"
        :gameTitle="gameTitle"
        :showOptions="true"
        :gameOptions="gameOptions"
        :isGame="true"
        v-model:activeGameOption="activeGameOption"
        v-model:searchQuery="gameList.searchQuery.value"
        @search="gameList.search"
      )

    //- Games
    template(v-if="route.query.type === 'hotgames' || activeGameOption === 'favorites'")
      GameList(
        :key="'normal'"
        :displayedGames="displayedGames"
        :toggleFavorite="toggleFavorite"
        :loadMore="loadMore"
        :hasMore="hasMore"
        :loadingMore="loadingMore"
      )

    template(v-else-if="activeGameOption === 'allGames'")
      //- Games
      GameList(
        :key="'allGames'"
        :displayedGames="gameList.games.value"
        :toggleFavorite="gameList.toggleFavorite"
        :loadMore="gameList.loadMore"
        :hasMore="gameList.hasMore.value"
        :loadingMore="gameList.loadingMore.value"
      )

    template(v-else)
      GameProviderList(:displayedGames="vendorList" :type="route.query.type")
</template>
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useGlobalUiStore } from '~/stores/globalUi'
import { useUserStore } from '~/stores/user'
import { api } from '~/composables/useApi'
import { usePlatformData } from '~/composables/usePlatformData'
import GameFilter from '~/components/GameFilter.vue'
import { useGameList } from '~/composables/useGameList'

const userStore = useUserStore()
const globalUiStore = useGlobalUiStore()
const { initPlatformData } = usePlatformData()
const gameList = useGameList()

const route = useRoute()
const { t, locale } = useI18n()

const showAllGame = computed(() => {
  return ['fish', 'slot', 'mini_game'].includes(route.query.type)
})

const activeGameOption = ref(showAllGame.value ? 'allGames' : 'vendor')


const gameTitle = ref('')
const vendorList = ref([])
const displayedGames = ref([])

const allGames = ref([])
const page = ref(1)
const pageSize = ref(20)
const loadingMore = ref(false)
const total = ref(0)
const bannerConfigs = ref([])

const hasMore = computed(() => {
  if (!total.value) return false
  return displayedGames.value.length < total.value
})

const SPECIAL_GAME_TYPES = ['esports_games', 'poker_games', 'lottery_games']

const gameOptions = computed(() => {
  const base = []
  if (showAllGame.value) {
    base.push({ id: 'allGames', name: t('gameList.options.all') })
  }
  base.push({ id: 'vendor', name: t('gameType.options.vendor') })
  if (userStore.isLoggedIn) {
    base.push({ id: 'favorites', name: t('gameType.options.favorites') })
  }
  return base
})

function updateGameTitle() {
  const m = games.value.find((g) => g.name === route.query.type)
  gameTitle.value = m ? t('gameType.types.' + m.tKey) : ''
}

onMounted(async () => {
  await initPlatformData({
    announcements: true,
    games: true,
    vendors: true,
    favorites: true,
  })
  updateGameTitle()
  if (showAllGame) {
    await gameList.resetAndLoad()
  }
})

watch(
  () => locale.value,
  () => {
    updateGameTitle()
  },
)

const searchQuery = ref('')

function search(activeOption) {
  if (route.query.type === 'hotgames') {
    const hotGames = globalUiStore.gameList.hot_games || []
    const filtered = hotGames.filter((game) =>
      game.display_name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
    resetPagination(filtered)
  } else if (activeOption === 'vendor') {
    // hotgames之外的廠商列表
    const vendorListData =
      globalUiStore.vendorList.desktop_game_types?.find((item) => item.type === route.query.type)
        ?.game_list || []
    vendorList.value = vendorListData.filter((item) =>
      item.vendor.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  } else {
    // hotgames之外的favorites列表
    const favGames = Array.isArray(globalUiStore.favoriteList?.games)
      ? globalUiStore.favoriteList.games
      : []

    const filtered = favGames.filter(
      (game) =>
        game.game_type === route.query.type &&
        game.display_name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )

    resetPagination(filtered)
  }
}

const games = ref([
  { id: 1, name: 'hotgames', tKey: 'hotGames', list: [] },
  { id: 2, name: 'mini_game', tKey: 'miniGames', list: [] },
  { id: 3, name: 'slot', tKey: 'slots', list: [] },
  { id: 4, name: 'sports', tKey: 'sports', list: [] },
  { id: 5, name: 'esports_games', tKey: 'esports', list: [] },
  { id: 6, name: 'live', tKey: 'liveCasino', list: [] },
  { id: 6, name: 'poker_games', tKey: 'poker', list: [] },
  { id: 6, name: 'fish', tKey: 'fish', list: [] },
  { id: 6, name: 'lottery_games', tKey: 'lottery', label: t('gameType.types.lottery'), list: [] },
])

const favorites = ref(null)

watch(activeGameOption, (value) => {
  search(value)
})

async function toggleFavorite(game, idx) {
  const favGames = Array.isArray(globalUiStore.favoriteList?.games)
    ? globalUiStore.favoriteList.games
    : []
  const find = favGames.find((g) => g.game_id === game.game_id && g.provider === game.provider)
  displayedGames.value[idx].isFavorite = !displayedGames.value[idx].isFavorite

  if (find) {
    const res = await api.removeFavorite({
      game_id: game.game_id,
      provider: game.provider,
      gateway: game.gateway,
    })

    globalUiStore.favoriteList.games = globalUiStore.favoriteList.games.filter(
      (g) => g.game_id !== game.game_id,
    )

    if (route.query.type !== 'hotgames') {
      displayedGames.value = globalUiStore.favoriteList.games.filter(
        (g) => g.game_type === route.query.type,
      )
    }
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

function isFav(id) {
  return favorites.value?.has ? favorites.value.has(id) : false
}

function resetPagination(sourceGames) {
  allGames.value = sourceGames || []
  total.value = allGames.value.length
  page.value = 1
  displayedGames.value = allGames.value.slice(0, pageSize.value)
}

async function loadMore() {
  if (loadingMore.value) return
  if (!hasMore.value) return
  loadingMore.value = true
  try {
    page.value += 1
    displayedGames.value = allGames.value.slice(0, page.value * pageSize.value)
  } finally {
    loadingMore.value = false
  }
}

watch(() => route.query.type, () => {
  if (showAllGame) {
    gameList.resetAndLoad()
  }
})

watch(
  () => [
    route.query.type,
    globalUiStore.gameList,
    globalUiStore.favoriteList,
    globalUiStore.vendorList,
    globalUiStore.announcements,
    userStore.isLoggedIn,
  ],
  () => {
    const tq = route.query.type

    // banner image
    const items = globalUiStore.announcements?.banner_items || []

    const maps = {
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
    const matchedItems = items.filter((item) => item.meta_json?.config?.banner_group_name === maps[tq])
    bannerConfigs.value = matchedItems.flatMap((item) => item.meta_json?.config?.banner_configs || [])

    const m = games.value.find((g) => g.name === tq)
    gameTitle.value = m ? t('gameType.types.' + m.tKey) : ''
    activeGameOption.value = showAllGame.value ? 'allGames' : 'vendor'
    displayedGames.value = []
    vendorList.value = []

    // 標記我的最愛
    if (userStore.isLoggedIn && globalUiStore.favoriteList?.games) {
      globalUiStore.favoriteList.games.forEach((g) => {
        g.isFavorite = true
      })
    }

    // 特殊遊戲類型目前不顯示清單
    if (SPECIAL_GAME_TYPES.includes(tq)) {
      return
    }

    // 熱門遊戲列表
    if (tq === 'hotgames') {
      const src = globalUiStore.gameList?.hot_games || []
      if (src.length) {
        resetPagination(src)
      }
      return
    }

    // 一般遊戲類型：登入時顯示該類型的收藏清單
    if (userStore.isLoggedIn && globalUiStore.favoriteList?.games) {
      const src = globalUiStore.favoriteList.games.filter((g) => g.game_type === tq)
      if (src.length) {
        resetPagination(src)
      }
    }

    // Vendor 清單
    const val = globalUiStore.vendorList
    if (val && Object.keys(val).length > 0) {
      const desktopTypes = val.desktop_game_types || []
      const mobileTypes = val.mobile_game_types || []
      const matched = (globalUiStore.isPC ? desktopTypes : mobileTypes).find((g) => g.type === tq)
      vendorList.value = matched?.game_list || []
    }
  },
  { immediate: true },
)
</script>
