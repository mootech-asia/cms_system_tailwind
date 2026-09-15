import { api } from '~/composables/useApi'
import { useGlobalUiStore } from '~/stores/globalUi'
import { useUserStore } from '~/stores/user'

const pending = {}

function hasItems (value) {
  return Boolean(value && Object.keys(value).length > 0)
}

function runOnce (key, loader) {
  if (!pending[key]) {
    pending[key] = loader().finally(() => {
      pending[key] = null
    })
  }
  return pending[key]
}

function getPriorityListByGames (games, filterRules) {
  if (!filterRules.length) {
    return []
  }

  if (!Array.isArray(filterRules[0])) {
    return filterRules
  }

  const matchedResults = []

  const vendorMaps = games.reduce((r, c) => {
    r[c.vendor] = true
    return r
  }, {})

  for (const vendors of filterRules) {
    if (vendors.length === 1) {
      matchedResults.push(vendors[0])
    } else {
      const vendor = vendors.find(v => vendorMaps[v])
      if (vendor) {
        matchedResults.push(vendor)
      }
    }
  }
  return matchedResults
}

function sortByPriorityVendors (gameList, priorityVendors, type) {
  priorityVendors = getPriorityListByGames(gameList, priorityVendors)
  const vendorOrder = new Map(priorityVendors.map((vendor, index) => [vendor, index]))
  // group by vendor with priority list & gateway:1 is first
  const groupVendors = gameList.filter(g => priorityVendors.includes(g.vendor))
    .reduce((r, c) => {
      r[c.vendor] = r[c.vendor] ?? []
      if (c.gateway === 1) {
        r[c.vendor].unshift(c)
      } else {
        r[c.vendor].push(c)
      }
      return r
    }, {})
  return [...gameList].sort((a, b) => {
    if (type === 'live') {
      // 元素是在群組中的第一個
      const isFirstA = groupVendors[a.vendor]?.[0] === a
      const isFirstB = groupVendors[b.vendor]?.[0] === b
      const aOrder = isFirstA ? vendorOrder.get(a.vendor) : priorityVendors.length
      const bOrder = isFirstB ? vendorOrder.get(b.vendor) : priorityVendors.length
      return aOrder - bOrder
    }

    const aOrder = vendorOrder.get(a.vendor) ?? priorityVendors.length
    const bOrder = vendorOrder.get(b.vendor) ?? priorityVendors.length
    return aOrder - bOrder
  })
}

export function usePlatformData () {
  const globalUiStore = useGlobalUiStore()
  const userStore = useUserStore()

  async function loadAnnouncements ({ force = false } = {}) {
    if (!force && hasItems(globalUiStore.announcements)) return

    await runOnce('announcements', async () => {
      const { data } = await api.getAnnouncements()
      globalUiStore.setAnnouncements(data)
    })
  }

  async function loadVendors ({ force = false } = {}) {
    if (!force && hasItems(globalUiStore.vendorList)) return

    await runOnce('vendors', async () => {
      const { data } = await api.getGameVendors()
      const priorityVendorsByType = {
        live: [['WCLIVE', 'EVOLIVE', 'Evolution'], ['PP'], ['AA', 'SexyCasino'], ['MG'], ['PT', 'Playtech']],
        sports: ['PINGAPI', 'BTI', 'SABA'],
        slot: ['PP', 'EVONTT', 'PGS', 'MG']
      }
      const sortGameTypes = (gameTypes = []) => gameTypes.map((item) => {
        const priorityVendors = priorityVendorsByType[item.type]
        if (priorityVendors && Array.isArray(item.game_list)) {
          return {
            ...item,
            game_list: sortByPriorityVendors(item.game_list, priorityVendors, item.type)
          }
        }
        return item
      })
      data.desktop_game_types = sortGameTypes(data.desktop_game_types)
      data.mobile_game_types = sortGameTypes(data.mobile_game_types)
      globalUiStore.setVendorList(data)
    })
  }

  async function loadFavoriteList ({ force = false } = {}) {
    const token = useCookie('token')
    if (!token.value) return
    if (!force && Array.isArray(globalUiStore.favoriteList?.games)) return

    await runOnce('favorites', async () => {
      const { data } = await api.getFavoriteList()
      globalUiStore.setFavoriteList(data)
    })
  }

  async function loadGameList ({ force = false } = {}) {
    if (!force && hasItems(globalUiStore.gameList)) return

    await runOnce('games', async () => {
      const result = await api.gameList()
      globalUiStore.setGameList(result?.data || {})

      const token = useCookie('token')
      if (!token.value || !userStore.isLoggedIn) return

      await loadFavoriteList()

      const favoriteGames = Array.isArray(globalUiStore.favoriteList?.games)
        ? globalUiStore.favoriteList.games
        : []
      const apiHotGames = Array.isArray(globalUiStore.gameList?.hot_games)
        ? globalUiStore.gameList.hot_games
        : []
      const enrichedHotGames = apiHotGames.map((game) => {
        const find = favoriteGames.find(
          (g) => g.game_id === game.game_id && g.provider === game.provider
        )
        return {
          ...game,
          isFavorite: !!find
        }
      })

      globalUiStore.setGameList({
        ...globalUiStore.gameList,
        hot_games: enrichedHotGames
      })
    })
  }

  async function initPlatformData ({
    announcements = false,
    games = false,
    vendors = false,
    favorites = false,
    force = false
  } = {}) {
    await Promise.all([
      announcements ? loadAnnouncements({ force }) : Promise.resolve(),
      vendors ? loadVendors({ force }) : Promise.resolve(),
      favorites ? loadFavoriteList({ force }) : Promise.resolve(),
      games ? loadGameList({ force }) : Promise.resolve()
    ])
  }

  return {
    initPlatformData,
    loadAnnouncements,
    loadFavoriteList,
    loadGameList,
    loadVendors
  }
}
