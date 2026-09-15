import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '~/composables/useApi'
import { useGlobalUiStore } from '~/stores/globalUi'
import { useUserStore } from '~/stores/user'

export function useGameList () {
  const userStore = useUserStore()
  const globalUiStore = useGlobalUiStore()
  const route = useRoute()

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

  function resetAndLoad () {
    page.value = 1
    total.value = 0
    games.value = []
    isSearching.value = false
    getGames()
  }

  async function getGames (append = false) {
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
          (g) => g.game_id === game.game_id && g.provider === game.provider
        )
        return {
          ...game,
          isFavorite: !!find
        }
      })

      allGames.value = enrichedGames
      games.value = enrichedGames
      clearInterval(intervalId)
    }, 500)
  }

  function search () {
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

  async function toggleFavorite (game, idx) {
    console.log('ggggg', game, idx)
    const find = globalUiStore.favoriteList.games.find(
      (g) => g.game_id === game.game_id && g.provider === game.provider
    )

    games.value[idx].isFavorite = !games.value[idx].isFavorite

    if (find) {
      const res = await api.removeFavorite({
        game_id: game.game_id,
        provider: game.provider,
        gateway: game.gateway
      })
      globalUiStore.favoriteList.games = globalUiStore.favoriteList.games.filter(
        (g) => g.game_id !== game.game_id
      )
    } else {
      const res = await api.addFavorite({
        game_id: game.game_id,
        game_type: route.query.type,
        provider: game.provider,
        gateway: game.gateway
      })
      globalUiStore.favoriteList.games.push(game)
    }
  }

  async function loadMore () {
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

  return {
    games,
    hasMore,
    loadingMore,
    searchQuery,
    toggleFavorite,
    loadMore,
    resetAndLoad,
    search
  }
}
