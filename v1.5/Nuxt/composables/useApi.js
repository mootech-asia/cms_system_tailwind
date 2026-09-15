import { request } from '~/composables/useRequest'

export const api = {
  // - Server Sitting
  status: () => request('/api/status', 'GET'),
  platformRegisterInfo: () => request('/api/platform/register-info', 'GET'),

  // - Auth
  register: (data) => request('/api/auth/register', 'POST', data),
  login: (data, opts) => request('/api/auth/login', 'POST', data, opts),
  logout: (opts) => request('/api/auth/logout', 'POST', undefined, opts),
  forgotPassword: (data) => request('/api/auth/forgot-password', 'POST', data),
  changePassword: (data) => request('/api/player/reset-password', 'POST', data),
  refreshToken: (data) => request('/api/auth/refresh', 'POST', data),

  // - Profile
  getProfile: (data, opts) => request('/api/player/profile', 'GET', data, opts),
  updatedProfile: (data) => request('/api/player/profile/update', 'POST', data),
  getSecurityCenter: (data) => request('/api/player/account/security', 'GET', data),

  // - Wallet
  getTransactionHistory: (data) => request('/api/player/transaction-history', 'GET', data),
  getDepositWithdrawHistory: (data) => request('/api/player/deposit-withdraw-history', 'GET', data),
  changeFundPassword: (data) => request('/api/player/change-fund-password', 'POST', data),
  deposit: (data) => request('/api/player/deposit', 'POST', data),
  withdrawal: (data) => request('/api/player/withdraw', 'POST', data),
  addBankCard: (data) => request('/api/player/bank-card/add', 'POST', data),
  deleteBankCard: (data) => request('/api/player/bank-card/delete', 'POST', data),
  getBankCardList: (data) => request('/api/player/bank-card/list', 'GET', data),
  getAccountRecord: (data) => request('/api/player/account-records', 'GET', data),
  getProfitAndLoss: (data) => request('/api/player/profit-loss', 'GET', data),
  getBankList: () => request('/api/player/available-bank-list', 'GET'),
  /**
   * 查詢可提流水
   * @see {@link https://teams.live.com/l/message/19:U2oe8mnB8y7SIcU60t2jZ12TvqbQHYPcYZoJULJup941@thread.v2/1786331935510?context=%7B%22contextType%22%3A%22chat%22%7D}
   * @returns {Promise<{ data: WithdrawalTurnover }>}
   */
  getTurnoverWithdrawal: () => request('/api/player/turnover/withdrawable', 'GET'),
  /**
   * 各遊戲類型還需要多少流水
   * @see {@link https://teams.live.com/l/message/19:U2oe8mnB8y7SIcU60t2jZ12TvqbQHYPcYZoJULJup941@thread.v2/1786331935510?context=%7B%22contextType%22%3A%22chat%22%7D}
   * @returns {Promise<{ data: TurnoverRequirements }>}
   */
  getTurnoverRequirements: () => request('/api/player/turnover/requirements', 'GET'),

  // - Game
  gameList: () => request('/api/platform/gamelists', 'GET'),
  getGameList: (data) => request('/api/platform/games', 'GET', data),
  getGameVendors: () => request('/api/platform/gamevendors', 'GET'),
  openGame: (data) => request('/api/game/launch', 'GET', data),
  addFavorite: (data) => request('/api/player/favorite/add', 'POST', data),
  removeFavorite: (data) => request('/api/player/favorite/delete', 'POST', data),
  getFavoriteList: (data) => request('/api/player/favorite/list', 'GET', data),

  // - Promotion
  getAnnouncements: () => request('/api/platform/announcements', 'GET'),
  getPromotionDeposit: () => request('/api/promotions/deposit', 'GET'),
  getPromotionList: (data) => request('/api/promotions/list', 'GET', data),
  getPromotionTypes: () => request('/api/promotions/banner_types', 'GET'),
  getPromotionDetail: (id) => request('/api/promotions/get', 'GET', id),

  // - Service
  getServiceList: () => request('/api/platform/scripts', 'GET')
}

/**
 * @typedef {Object} WithdrawalTurnover
 * @property {string} withdrawableAmount - 目前可提領金額
 * @property {string} balance - 錢包餘額
 * @property {number} ruleApplied - 1=全有全無（流水沒跑完不能提）、2=部分放行（有上限）
 * @property {boolean} allCompleted - 所有任務都已滿足（含下面兩種免除情況）
 * @property {boolean} noRecords - 這個玩家"從來沒有"流水任務
 * @property {number} pendingCount - 還沒完成的任務數
 * @property {number} evaluatedAt - 這份結果"實際被算出來"的 Unix 秒；快取命中時會早於現在
 * @property {string} remaining - 用戶總流水需求金額
 *
 * @typedef {Object} TurnoverRequirements 各遊戲的流水需求
 * @property {boolean} allCompleted - 所有任務都已滿足（含下面兩種免除情況）
 * @property {boolean} noRecords - 這個玩家"從來沒有"流水任務
 * @property {number} pendingCount - 還沒完成的任務數
 * @property {PendingTask[]} pendingTasks - 未完成任務逐筆的進度與來源
 * @property {{ gameType: 'slot' | 'live' | 'fish' | 'pvp' | 'sports' | 'mini_game', required: number }[]} requirements - 固定六筆(遊戲與流水需求金額)
 * @property {number} evaluatedAt - 這份結果"實際被算出來"的 Unix 秒；快取命中時會早於現在
 *
 * @typedef {Object} PendingTask
 * @property {number} recordId - 任務 ID
 * @property {string} itemName - 任務名稱（活動名 / 手動補賞 / 洗分…）
 * @property {number} target - 目標流水
 * @property {number} achieved - 目前已累積
 * @property {number} remaining - 還差多少（target - achieved，不會是負的）
 * @property {('slot' | 'live' | 'fish' | 'pvp' | 'sports' | 'mini_game')[]} gameTypes - 限定的遊戲類型；空陣列 = 不限類型
 * @property {number} createdAt - 任務成立時間；只有這之後的投注才算進這筆任務
 * @property {number} category - 任務來源(1:存款促銷 | 2:一般存款 | 3:調整 | 4:活動促銷)
 * @property {string} depositFlowAmount - 存款流水需求金額
 * @property {string} bonusFlowAmount - 獎金流水需求金額
 *
 * @typedef {Object} PendingTurnoverTask
 * @property {number} recordId - 任務 ID
 * @property {string} itemName - 任務名稱（活動名 / 手動補賞 / 洗分…）
 * @property {number} target - 目標流水
 * @property {number} achieved - 目前已累積
 * @property {number} remaining - 還差多少（target - achieved，不會是負的）
 * @property {('slot' | 'live' | 'fish' | 'pvp' | 'sports' | 'mini_game')[]} gameTypes - 限定的遊戲類型；空陣列 = 不限類型
 * @property {number} createdAt - 任務成立時間；只有這之後的投注才算進這筆任務
 * @property {number} category - 任務來源(1:存款促銷 | 2:一般存款 | 3:調整 | 4:活動促銷)
 */
