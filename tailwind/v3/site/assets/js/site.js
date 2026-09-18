// CMS_Frontend_v3 — 純靜態站 vanilla JS 行為層
// 涵蓋 Hero / Promos / Rail / CategoryView / Leaderboard / RewardsBanner /
// 三個 modal / 收藏 / 版面微調 / account 系列頁等行為。
// 全域式 <script>（非 module），不使用 fetch/import，file:// 可直開。
// 任何一段初始化失敗都不能讓其他功能或 console 冒出錯誤，因此每段都包在 safe() 裡。
(function () {
  'use strict';

  var DATA = window.CMS_DATA || {};
  var GAMES = DATA.GAMES || { slots: [], live: [], originals: [], table: [] };
  var PROVIDERS = DATA.PROVIDERS || [];
  var WINNERS = DATA.WINNERS || [];

  var CURRENT_PAGE = (location.pathname.split('/').pop() || '').trim();
  if (!CURRENT_PAGE) CURRENT_PAGE = 'index.html';

  function safe(fn) {
    try { fn(); } catch (e) { /* 靜默吞掉——不可讓單一功能失敗拖垮整頁或觸發 console error */ }
  }

  function escapeHtml(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var escapeAttr = escapeHtml;

  function fmtNum(n) {
    return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ============================================================
   * 共用 icon（僅列出「動態產生的 markup」會用到的圖示；其餘既有
   * 靜態頁面裡的 svg 一律原樣保留，不重新產生）
   * ========================================================== */
  var ICON_PATHS = {
    fire: '<path d="M12 2c1 4 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9Z" fill="currentColor"/>',
    star: '<path d="m12 3 2.6 6 6.4.6-4.8 4.4 1.4 6.4L12 17l-5.6 3.4 1.4-6.4L3 9.6l6.4-.6L12 3Z" fill="currentColor"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor"/>',
    heart: '<path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z" fill="currentColor"/>'
  };
  function iconSvg(name, size) {
    var p = ICON_PATHS[name];
    if (!p) return '';
    size = size || 18;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24">' + p + '</svg>';
  }
  var CV_HEART = '<svg class="cv-heart" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z" ' +
    'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> ';
  function gcardHeartSvg(isFav) {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path ' +
      'd="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z" ' +
      'fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  var CHECK_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>';
  var CLOSE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round"/></svg>';
  var TIER_ICON = '<svg width="10" height="11" viewBox="0 0 12 14" fill="currentColor"><path d="M6 0 0 3.5v7L6 14l6-3.5v-7L6 0Z"/></svg>';
  var MENU_ICONS = {
    person: '<svg width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6 19a6 6 0 0 1 12 0"/></g></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></g></svg>',
    key: '<svg width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><circle cx="8" cy="12" r="3.5"/><path d="M11 12h9M17 12v3M20 12v2"/></g></svg>',
    card: '<svg width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></g></svg>',
    logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    cs: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 16 0v4a3 3 0 0 1-3 3h-2v-7h5M4 12v4a3 3 0 0 0 3 3h2v-7H4"/></svg>'
  };

  /* STR（動態 markup 用字串）已移到下方 i18n 區塊之後，改由 tr() 依當前語系解析。 */

  /* ============================================================
   * i18n：
   * 靜態站以 data-i18n / data-i18n-title 屬性標註可翻譯文字，t(path) 從
   * window.CMS_I18N 依當前語系取值（fallback zh）；切語系寫入 localStorage
   * 後重載整頁套用（純靜態多頁站本就整頁導覽，重載最單純可靠）。
   * ========================================================== */
  var I18N = window.CMS_I18N || { LANGS: { zh: { label: '中文', shortLabel: '中', htmlLang: 'zh-Hant' } }, TRANSLATIONS: { zh: {} } };
  var LOCALE_KEY = I18N.LOCALE_STORAGE_KEY || 'cms-v3:locale';
  var FALLBACK_LOCALE = 'en';
  var LANG_FLAGS = { zh: '<svg width="18" height="12" viewBox="0 0 30 20"><rect width="30" height="20" fill="#de2910"></rect><polygon points="5.000,2.000 5.674,4.073 7.853,4.073 6.090,5.354 6.763,7.427 5.000,6.146 3.237,7.427 3.910,5.354 2.147,4.073 4.326,4.073" fill="#ffde00"></polygon><polygon points="9.143,2.514 9.620,1.966 9.246,1.343 9.914,1.628 10.391,1.080 10.328,1.803 10.996,2.088 10.288,2.251 10.224,2.975 9.851,2.352" fill="#ffde00"></polygon><polygon points="11.010,4.141 11.662,3.821 11.560,3.102 12.065,3.624 12.718,3.304 12.378,3.946 12.884,4.467 12.168,4.343 11.829,4.985 11.726,4.266" fill="#ffde00"></polygon><polygon points="11.038,6.725 11.765,6.699 11.964,6.001 12.213,6.683 12.939,6.657 12.367,7.105 12.616,7.787 12.014,7.382 11.442,7.830 11.641,7.131" fill="#ffde00"></polygon><polygon points="9.219,8.375 9.899,8.632 10.353,8.064 10.319,8.790 10.999,9.046 10.298,9.239 10.265,9.964 9.865,9.357 9.165,9.550 9.618,8.982" fill="#ffde00"></polygon></svg>', en: '<svg width="18" height="12" viewBox="0 0 30 20"><rect width="30" height="20" fill="#B22234"></rect><rect y="1.54" width="30" height="1.54" fill="#fff"></rect><rect y="4.62" width="30" height="1.54" fill="#fff"></rect><rect y="7.69" width="30" height="1.54" fill="#fff"></rect><rect y="10.77" width="30" height="1.54" fill="#fff"></rect><rect y="13.85" width="30" height="1.54" fill="#fff"></rect><rect y="16.92" width="30" height="1.54" fill="#fff"></rect><rect width="13" height="10.77" fill="#3C3B6E"></rect><g fill="#fff"><circle cx="2.6" cy="2.2" r="0.7"></circle><circle cx="6.5" cy="2.2" r="0.7"></circle><circle cx="10.4" cy="2.2" r="0.7"></circle><circle cx="4.5" cy="4.5" r="0.7"></circle><circle cx="8.4" cy="4.5" r="0.7"></circle><circle cx="2.6" cy="6.8" r="0.7"></circle><circle cx="6.5" cy="6.8" r="0.7"></circle><circle cx="10.4" cy="6.8" r="0.7"></circle><circle cx="4.5" cy="9" r="0.7"></circle><circle cx="8.4" cy="9" r="0.7"></circle></g></svg>', ko: '<svg width="18" height="12" viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"></rect><circle cx="15" cy="10" r="6" fill="#CD2E3A"></circle><path d="M15,4 a6,6 0 0,0 0,12 a3,3 0 0,0 0,-6 a3,3 0 0,1 0,-6" fill="#0047A0"></path></svg>', th: '<svg width="18" height="12" viewBox="0 0 30 20"><rect width="30" height="20" fill="#A51931"></rect><rect y="3.33" width="30" height="13.34" fill="#F4F5F8"></rect><rect y="6.67" width="30" height="6.66" fill="#2D2A4A"></rect></svg>' };
  function readLocale() {
    try { var s = localStorage.getItem(LOCALE_KEY); return (I18N.LANGS && I18N.LANGS[s]) ? s : FALLBACK_LOCALE; }
    catch (e) { return FALLBACK_LOCALE; }
  }
  var LOCALE = readLocale();
  function localeRoot(loc) {
    return {
      t: (I18N.TRANSLATIONS || {})[loc],
      HERO_COPY: (I18N.HERO_COPY || {})[loc],
      PROMO_RIBBON_COPY: (I18N.PROMO_RIBBON_COPY || {})[loc],
      PROMOTION_COPY: (I18N.PROMOTION_COPY || {})[loc],
      TOURNAMENT_COPY: (I18N.TOURNAMENT_COPY || {})[loc],
      SPOTLIGHT_COPY: (I18N.SPOTLIGHT_COPY || {})[loc]
    };
  }
  function resolvePath(root, path) {
    var parts = String(path).replace(/\[(\d+)\]/g, '.$1').split('.');
    var cur = root;
    for (var i = 0; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  }
  function tr(path, fallback) {
    var v = resolvePath(localeRoot(LOCALE), path);
    if (v == null) v = resolvePath(localeRoot(FALLBACK_LOCALE), path);
    return (v == null || typeof v !== 'string') ? (fallback != null ? fallback : path) : v;
  }
  function setLocale(loc) {
    if (!I18N.LANGS || !I18N.LANGS[loc] || loc === LOCALE) { closeLangMenu(); return; }
    try { localStorage.setItem(LOCALE_KEY, loc); } catch (e) {}
    location.reload();
  }
  function applyI18n(scope) {
    var root = scope || document;
    Array.prototype.forEach.call(root.querySelectorAll('[data-i18n]'), function (el) {
      var val = tr(el.getAttribute('data-i18n'), null);
      if (val == null) return;
      var suffix = el.getAttribute('data-i18n-suffix') || '';
      el.textContent = val + suffix;
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-i18n-title]'), function (el) {
      var val = tr(el.getAttribute('data-i18n-title'), null);
      if (val != null) el.textContent = val;
    });
    /* 混合內容：只替換元素的第一個非空白文字節點，保留子元素(icon/計數)與原空白 */
    Array.prototype.forEach.call(root.querySelectorAll('[data-i18n-text]'), function (el) {
      var val = tr(el.getAttribute('data-i18n-text'), null);
      if (val == null) return;
      for (var i = 0; i < el.childNodes.length; i++) {
        var node = el.childNodes[i];
        if (node.nodeType === 3 && node.nodeValue.replace(/\s+/g, ' ').trim()) {
          var m = node.nodeValue.match(/^(\s*)[\s\S]*?(\s*)$/);
          node.nodeValue = (m ? m[1] : '') + val + (m ? m[2] : '');
          break;
        }
      }
    });
    /* 屬性翻譯：placeholder */
    Array.prototype.forEach.call(root.querySelectorAll('[data-i18n-placeholder]'), function (el) {
      var val = tr(el.getAttribute('data-i18n-placeholder'), null);
      if (val != null) el.setAttribute('placeholder', val);
    });
    /* 屬性翻譯：aria-label／title 取同一鍵，元素既有哪個就設哪個 */
    Array.prototype.forEach.call(root.querySelectorAll('[data-i18n-label]'), function (el) {
      var val = tr(el.getAttribute('data-i18n-label'), null);
      if (val == null) return;
      if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', val);
      if (el.hasAttribute('title')) el.setAttribute('title', val);
    });
    /* 組合式 aria-label（section 收合鈕）：收合動詞＋翻譯後的區塊標題重建 */
    var collapseWord = tr('t.common.collapse', '收合');
    Array.prototype.forEach.call(root.querySelectorAll('.section-collapse'), function (btn) {
      var grp = btn.closest('.section-title-group');
      var titleEl = grp ? grp.querySelector('.section-title') : null;
      if (!titleEl) return;
      var name = '';
      for (var i = 0; i < titleEl.childNodes.length; i++) {
        var node = titleEl.childNodes[i];
        if (node.nodeType === 3 && node.nodeValue.trim()) { name = node.nodeValue.trim(); break; }
      }
      if (name) btn.setAttribute('aria-label', collapseWord + ' ' + name);
    });
    /* 組合式 aria-label（促銷卡）：以翻譯後的標題重建 */
    Array.prototype.forEach.call(root.querySelectorAll('.promo-card-link'), function (card) {
      var titleEl = card.querySelector('.promo-card-title');
      if (titleEl && titleEl.textContent.trim()) card.setAttribute('aria-label', titleEl.textContent.trim());
    });
    /* 會員／帳戶頁烘焙英文（未走 data-i18n）：以 i18n-member.js 字典按當前語系替換純文字節點 */
    var MEMBER = window.CMS_I18N_MEMBER;
    if (MEMBER && LOCALE !== 'en') {
      var mwalk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var mnodes = [], mn;
      while ((mn = mwalk.nextNode())) mnodes.push(mn);
      mnodes.forEach(function (node) {
        var parent = node.parentNode;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) return;
        var raw = node.nodeValue; if (!raw) return;
        var entry = MEMBER[raw.trim()];
        var val = entry && entry[LOCALE];
        if (val != null) {
          var mm = raw.match(/^(\s*)[\s\S]*?(\s*)$/);
          node.nodeValue = (mm ? mm[1] : '') + val + (mm ? mm[2] : '');
        }
      });
      /* 動態注入的表單 placeholder 走屬性、非文字節點，text-node walker 抓不到；
         以同一字典按當前語系替換（僅在有對應鍵時覆寫，其餘保留原值）。 */
      Array.prototype.forEach.call(root.querySelectorAll('[placeholder]'), function (el) {
        var pe = MEMBER[(el.getAttribute('placeholder') || '').trim()];
        if (pe && pe[LOCALE] != null) el.setAttribute('placeholder', pe[LOCALE]);
      });
    }
    /* 語言切換器觸發鈕的目前語系標籤（"中文"/"English"/… 非 TRANSLATIONS 值，直接取 LANGS） */
    var langLabel = (I18N.LANGS || {})[LOCALE];
    Array.prototype.forEach.call(root.querySelectorAll('.sb-lang-label'), function (el) {
      if (langLabel && langLabel.label) el.textContent = langLabel.label;
    });
    Array.prototype.forEach.call(root.querySelectorAll('.sb-lang > .sb-flag'), function (el) {
      if (LANG_FLAGS[LOCALE]) el.innerHTML = LANG_FLAGS[LOCALE];
    });
  }
  function initI18n() {
    var info = (I18N.LANGS || {})[LOCALE];
    document.documentElement.lang = (info && info.htmlLang) || 'en';
    applyI18n(document);
  }

  /* 動態產生 markup 用的字串：由 tr() 依當前語系解析（切語系會 reload，載入時解析即可）。
     3 個 modal 原始碼本身仍是純英文寫死，未經 tr()。 */
  var STR = {
    all: tr('t.common.all', '全部'),
    favorites: tr('t.common.favorites', '我的最愛'),
    loadMore: tr('t.common.loadMore', '載入更多'),
    noFavorites: tr('t.lobby.noFavorites', '尚未加入我的最愛，點擊遊戲愛心即可收藏。'),
    noProviderGames: function (p) { return tr('t.lobby.noProviderGames', '目前沒有來自 {provider} 的遊戲。').replace('{provider}', p); },
    noGames: tr('t.lobby.noGames', '目前沒有可顯示的遊戲。')
  };

  /* ============================================================
   * useFavorites 對照（同一組 localStorage key，行為完全相同）
   * ========================================================== */
  var FAV_KEY = 'lobby_favs_v1';
  var favs = (function () {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
    catch (e) { return new Set(); }
  })();
  function isFav(id) { return favs.has(id); }
  function toggleFav(id) {
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favs))); } catch (e) {}
    document.dispatchEvent(new CustomEvent('cms:favorites-changed'));
  }

  /* ============================================================
   * 卡片 <-> CMS_DATA 比對（title+provider+image 檔名三者組合在
   * 同一分類陣列內是唯一的，見 phase2 report / data.js 生成演算法）
   * ========================================================== */
  var GAME_INDEX = null;
  function buildGameIndex() {
    var map = {};
    ['slots', 'live', 'originals', 'table'].forEach(function (cat) {
      (GAMES[cat] || []).forEach(function (g) {
        var base = (g.image || '').split('/').pop();
        map[g.title + '|' + g.provider + '|' + base] = g;
      });
    });
    return map;
  }
  function resolveGameFromCard(card) {
    if (!GAME_INDEX) GAME_INDEX = buildGameIndex();
    var titleEl = card.querySelector('.gcard-title');
    var provEl = card.querySelector('.gcard-provider');
    var imgEl = card.querySelector('.gcard-art-image');
    var title = titleEl ? titleEl.textContent.trim() : '';
    var provider = provEl ? provEl.textContent.trim() : '';
    var src = imgEl ? (imgEl.getAttribute('src') || '') : '';
    var base = src.split('/').pop();
    var found = GAME_INDEX[title + '|' + provider + '|' + base];
    if (found) return found;
    return {
      id: 'card-' + (title + '|' + provider).replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
      title: title || 'Game', provider: provider || '—', category: 'slots',
      rtp: '96.00', maxWin: '1000x', image: src, tag: null, players: 0
    };
  }

  function gameCardHTML(g, showFav) {
    var fav = favs.has(g.id);
    var tagHtml = g.tag
      ? '<span class="gcard-tag' + (g.tag === 'Hot' ? ' hot' : '') + (g.tag === 'New' ? ' new' : '') + '">' + escapeHtml(g.tag) + '</span>'
      : '';
    var favHtml = showFav
      ? '<button type="button" class="gcard-fav' + (fav ? ' on' : '') + '" aria-label="' + (fav ? 'Remove favorite' : 'Add favorite') + '">' + gcardHeartSvg(fav) + '</button>'
      : '';
    var playersHtml = g.category === 'live'
      ? '<div class="gcard-players"><span class="live-dot"></span>' + Number(g.players || 0).toLocaleString() + ' playing</div>'
      : '';
    return '<article class="gcard" style="cursor:pointer">' +
      '<div class="gcard-art">' +
        '<img class="gcard-art-image" src="' + escapeAttr(g.image) + '" alt="" loading="lazy" decoding="async">' +
        tagHtml + favHtml + playersHtml +
      '</div>' +
      '<div class="gcard-meta"><div class="gcard-title">' + escapeHtml(g.title) + '</div><div class="gcard-provider">' + escapeHtml(g.provider) + '</div></div>' +
    '</article>';
  }

  /* ============================================================
   * 遊戲卡圖片載入失敗（404／網路錯誤）時的墊底畫面：把壞掉的
   * <img> 藏起來（src 保留不動，resolveGameFromCard() 靠它比對遊戲，
   * 不能覆寫），讓 .gcard-art-broken 這個 class 掛上去的
   * assets/mock/game-fallback.svg 墊底圖從背景整張顯示。error 事件
   * 不會冒泡，只能在 capture 階段抓；已處理過（img.hidden）就不重複跑。
   * ========================================================== */
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.nodeName !== 'IMG' || !img.classList.contains('gcard-art-image') || img.hidden) return;
    img.hidden = true;
    var art = img.closest('.gcard-art');
    if (art) art.classList.add('gcard-art-broken');
  }, true);

  /* ============================================================
   * CategoryView（All / Favorites / Provider tabs + load more）
   * 同一份 renderer 同時用於：
   *   (a) 5 個已預先烘焙的頁面（hot-games / mini-games / slots / live / fish）
   *       ——載入時立刻用 CMS_DATA 重繪一次，換取完整互動能力
   *   (b) Promos 分類 tab 點擊時的動態重繪
   * ========================================================== */
  var CATEGORY_PARAMS = {
    'Hot Games': { title: tr('t.nav.Hot Games', '熱門遊戲'), icon: 'fire', games: GAMES.slots.concat(GAMES.live, GAMES.originals), showFilterTabs: false, showProviderTabs: false, showFavorites: true, enableLoadMore: false, pageSize: 10 },
    'Mini Games': { title: tr('t.nav.Mini Games', '小遊戲'), icon: 'star', games: GAMES.originals, showFilterTabs: true, showProviderTabs: true, showFavorites: true, enableLoadMore: true, pageSize: 10 },
    'Slots': { title: tr('t.nav.Slots', '老虎機'), icon: 'fire', games: GAMES.slots, showFilterTabs: true, showProviderTabs: true, showFavorites: true, enableLoadMore: true, pageSize: 10 },
    'Live': { title: tr('t.nav.Live', '真人'), icon: 'bolt', games: GAMES.live, showFilterTabs: true, showProviderTabs: true, showFavorites: true, enableLoadMore: true, pageSize: 10 },
    'Fish': { title: tr('t.nav.Fish', '捕魚'), icon: null, games: GAMES.slots, showFilterTabs: true, showProviderTabs: true, showFavorites: true, enableLoadMore: true, pageSize: 10 },
    /* 我的最愛（.cat-tabs 在 Lobby 右邊新增的入口，對照手機版
       favorites.html 的做法）：橫跨全部分類(不像其他分類只服務單一
       games 陣列)，favoritesOnly 讓 renderCategoryView 一律套用收藏
       篩選，不受 state.filter 影響，也不顯示 All/Favorites/廠商頁籤。 */
    'Favorites': { title: STR.favorites, icon: 'heart', games: GAMES.slots.concat(GAMES.live, GAMES.originals, GAMES.table), showFilterTabs: false, showProviderTabs: false, showFavorites: true, favoritesOnly: true, enableLoadMore: true, pageSize: 20 }
  };

  function renderCategoryView(section) {
    var params = section._cvParams, state = section._cvState;
    if (!params || !state) return;
    var filtered = params.games;
    if (params.favoritesOnly || state.filter === 'Favorites') {
      filtered = params.games.filter(function (g) { return favs.has(g.id); });
    } else if (params.showProviderTabs && state.filter !== 'All') {
      filtered = params.games.filter(function (g) { return g.provider === state.filter; });
    }
    var shown = params.enableLoadMore ? filtered.slice(0, state.visibleCount) : filtered;
    var canLoadMore = params.enableLoadMore && shown.length < filtered.length;
    var favCount = params.games.filter(function (g) { return favs.has(g.id); }).length;

    var titleHtml = (params.icon ? iconSvg(params.icon, 18) + ' ' : '') + escapeHtml(params.title) + ' <span class="count">' + filtered.length + '</span>';
    var headHtml = '<div class="section-head"><h2 class="section-title">' + titleHtml + '</h2></div>';

    var tabsHtml = '';
    if (params.showFilterTabs) {
      var tabBtns = '<button type="button" class="cv-tab' + (state.filter === 'All' ? ' active' : '') + '" data-filter="All">' + STR.all + '</button>';
      if (params.showFavorites) {
        tabBtns += '<button type="button" class="cv-tab' + (state.filter === 'Favorites' ? ' active' : '') + '" data-filter="Favorites">' +
          CV_HEART + STR.favorites + (favCount > 0 ? '<span class="cv-tab-count">' + favCount + '</span>' : '') + '</button>';
      }
      if (params.showProviderTabs) {
        PROVIDERS.forEach(function (p) {
          tabBtns += '<button type="button" class="cv-tab' + (state.filter === p ? ' active' : '') + '" data-filter="' + escapeAttr(p) + '">' + escapeHtml(p) + '</button>';
        });
      }
      tabsHtml = '<div class="cv-tabs">' + tabBtns + '</div>';
    }

    var bodyHtml;
    if (shown.length === 0) {
      var emptyText = (params.favoritesOnly || state.filter === 'Favorites') ? STR.noFavorites
        : (params.showProviderTabs && state.filter !== 'All') ? STR.noProviderGames(state.filter)
        : STR.noGames;
      bodyHtml = '<div class="cv-empty">' + escapeHtml(emptyText) + '</div>';
    } else {
      bodyHtml = '<div class="grid">' + shown.map(function (g) { return gameCardHTML(g, params.showFavorites); }).join('') + '</div>';
    }

    var footHtml = canLoadMore
      ? '<div class="cv-foot"><button type="button" class="cv-view-all">' + STR.loadMore + '</button></div>'
      : '';

    section.setAttribute('data-screen-label', params.title);
    section.innerHTML = headHtml + tabsHtml + bodyHtml + footHtml;
  }

  function mountCategoryView(section, tabName) {
    var params = CATEGORY_PARAMS[tabName];
    if (!params) return;
    section._cvParams = params;
    section._cvState = { filter: 'All', visibleCount: params.pageSize || 10 };
    renderCategoryView(section);
  }

  /* ============================================================
   * 我的收藏總覽頁（favorites.html，目前只有手機版有這個入口）：
   * 橫跨全部分類(slots/live/originals/table)收集已收藏的遊戲，不像
   * renderCategoryView 只服務單一分類。收藏異動(toggleFav 觸發的
   * cms:favorites-changed)即時重繪，取消收藏的卡片會立刻從清單消失。
   * ========================================================== */
  function initFavoritesPage() {
    var section = document.querySelector('[data-favorites-page]');
    if (!section) return;
    var grid = section.querySelector('.grid');
    var empty = section.querySelector('.cv-empty');
    var countEl = section.querySelector('.count');
    function render() {
      var all = GAMES.slots.concat(GAMES.live, GAMES.originals, GAMES.table);
      var list = all.filter(function (g) { return favs.has(g.id); });
      if (countEl) countEl.textContent = list.length;
      if (!list.length) {
        if (grid) grid.hidden = true;
        if (empty) empty.hidden = false;
        return;
      }
      if (empty) empty.hidden = true;
      if (grid) { grid.hidden = false; grid.innerHTML = list.map(function (g) { return gameCardHTML(g, true); }).join(''); }
    }
    render();
    document.addEventListener('cms:favorites-changed', render);
  }

  /* ============================================================
   * Promos（cat-tabs）+ 動態重繪／導頁
   * ========================================================== */
  var TAB_NAMES = ['Lobby', 'Favorites', 'Hot Games', 'Mini Games', 'Slots', 'Sports', 'Live', 'Fish', 'Promotion'];
  var TAB_PAGE = { 'Lobby': 'index.html', 'Favorites': 'favorites.html', 'Hot Games': 'hot-games.html', 'Mini Games': 'mini-games.html', 'Slots': 'slots.html', 'Sports': 'sports.html', 'Live': 'live.html', 'Fish': 'fish.html', 'Promotion': 'promotion.html' };
  var PAGE_TO_TAB = { 'favorites.html': 'Favorites', 'hot-games.html': 'Hot Games', 'mini-games.html': 'Mini Games', 'slots.html': 'Slots', 'live.html': 'Live', 'fish.html': 'Fish' };
  var CMS_BACKED = { 'Favorites': 1, 'Hot Games': 1, 'Mini Games': 1, 'Slots': 1, 'Live': 1, 'Fish': 1 };

  var catTabsEl = null, contentTarget = null, originalContentNode = null;

  function swapToCategoryView(name) {
    if (!contentTarget) return;
    var section = document.createElement('section');
    section.className = 'lobby-section';
    contentTarget.replaceWith(section);
    contentTarget = section;
    mountCategoryView(section, name);
  }

  function restoreOriginalContent() {
    if (!originalContentNode || !contentTarget) return;
    var fresh = originalContentNode.cloneNode(true);
    contentTarget.replaceWith(fresh);
    contentTarget = fresh;
  }

  function setActiveTab(name) {
    if (!catTabsEl) return;
    Array.prototype.forEach.call(catTabsEl.querySelectorAll('.cat-tab'), function (b, i) {
      b.classList.toggle('active', TAB_NAMES[i] === name);
    });
  }

  function handleCatTabClick(name) {
    if (!name) return;
    setActiveTab(name);
    if (CMS_BACKED[name]) {
      swapToCategoryView(name);
    } else if (name === 'Lobby') {
      if (CURRENT_PAGE === 'index.html') restoreOriginalContent();
      else location.href = 'index.html';
    } else {
      var target = TAB_PAGE[name];
      if (target && target !== CURRENT_PAGE) location.href = target;
    }
  }

  function initPromosAndCategoryViews() {
    catTabsEl = document.querySelector('.cat-tabs');
    if (!catTabsEl) return;
    contentTarget = catTabsEl.nextElementSibling;
    if (contentTarget) originalContentNode = contentTarget.cloneNode(true);

    var ownTab = PAGE_TO_TAB[CURRENT_PAGE];
    if (ownTab && contentTarget && CATEGORY_PARAMS[ownTab]) {
      mountCategoryView(contentTarget, ownTab);
    }
  }

  /* ============================================================
   * Hero 輪播（僅存在於 8 個 Lobby 家族頁面；直接綁定，非委派——
   * Hero 永遠在 cat-tabs 之前，不會被 Promos 動態重繪影響到）
   * ========================================================== */
  function initHero() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var len = slides.length;
    if (!len) return;
    var idx = 0;
    for (var i = 0; i < slides.length; i++) { if (slides[i].classList.contains('active')) { idx = i; break; } }
    var timer = null;

    function apply() {
      slides.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }
    function resetAuto() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () { idx = (idx + 1) % len; apply(); }, 6500);
    }
    function next() { idx = (idx + 1) % len; apply(); resetAuto(); }
    function prev() { idx = (idx - 1 + len) % len; apply(); resetAuto(); }
    function goTo(i) { idx = i; apply(); resetAuto(); }

    var prevBtn = hero.querySelector('.hero-controls .icon-btn[aria-label="Previous"]');
    var nextBtn = hero.querySelector('.hero-controls .icon-btn[aria-label="Next"]');
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });

    var touchStartX = null;
    hero.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev(); }
      touchStartX = null;
    });

    resetAuto();
  }

  /* ============================================================
   * Rail 橫向捲動（箭頭 enable/disable 隨 scrollLeft；用 capture 階段
   * 監聽 scroll，DOM 被 Promos 重繪整個換掉也不用重新綁定）
   * ========================================================== */
  function updateRailArrows(rail) {
    var section = rail.closest('.lobby-section');
    if (!section) return;
    var arrows = section.querySelectorAll('.section-actions .arrow');
    if (arrows.length < 2) return;
    var canL = rail.scrollLeft > 4;
    var canR = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4;
    arrows[0].disabled = !canL;
    arrows[1].disabled = !canR;
  }
  function initRails() {
    var rails = document.querySelectorAll('.rail');
    if (!rails.length) return;
    Array.prototype.forEach.call(rails, updateRailArrows);
    Array.prototype.forEach.call(document.querySelectorAll('.rail .gcard'), function (c) { c.style.cursor = 'pointer'; });
    window.addEventListener('resize', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.rail'), updateRailArrows);
    });
    document.addEventListener('scroll', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('rail')) updateRailArrows(t);
    }, true);
  }

  /* ============================================================
   * Leaderboard（每 2.8s 插入一筆新紀錄，維持 10 筆，重新排名）
   * ========================================================== */
  function initLeaderboard() {
    if (!WINNERS.length) return;
    if (!document.querySelector('.leaderboard')) return;
    setInterval(function () {
      var board = document.querySelector('.leaderboard');
      if (!board) return;
      var pick = WINNERS[Math.floor(Math.random() * WINNERS.length)];
      var noise = Math.random() * 80 + 5;
      var mult = Math.random() * 50 + 1.5;
      var payout = noise * mult;
      var row = document.createElement('div');
      row.className = 'lb-row fresh';
      row.innerHTML =
        '<span class="lb-rank top">01</span>' +
        '<div class="lb-user"><div class="lb-avatar" style="--avatar-bg: linear-gradient(135deg, oklch(0.55 0.2 ' + pick.hue + '), oklch(0.4 0.18 ' + ((pick.hue + 80) % 360) + '))">' + escapeHtml(pick.avatar) + '</div>' + escapeHtml(pick.user) + '</div>' +
        '<span class="lb-game">' + escapeHtml(pick.game) + '</span>' +
        '<span class="lb-num">' + noise.toFixed(2) + '</span>' +
        '<span class="lb-num">' + mult.toFixed(2) + '×</span>' +
        '<span class="lb-payout">+' + fmtNum(payout) + '</span>';

      var head = board.querySelector('.lb-head');
      Array.prototype.forEach.call(board.querySelectorAll('.lb-row'), function (r) { r.classList.remove('fresh'); });
      if (head) head.insertAdjacentElement('afterend', row); else board.appendChild(row);

      var allRows = Array.prototype.slice.call(board.querySelectorAll('.lb-row'));
      allRows.forEach(function (r, i) {
        var rankEl = r.querySelector('.lb-rank');
        if (rankEl) { rankEl.textContent = String(i + 1).padStart(2, '0'); rankEl.classList.toggle('top', i < 3); }
      });
      for (var i = 10; i < allRows.length; i++) allRows[i].remove();
    }, 2800);
  }

  /* ============================================================
   * RewardsBanner 倒數（畫面上是 display:none，但原始元件仍持續跑
   * 計時邏輯——這裡照樣跑，純為行為對齊，不影響可視驗證）
   * PromoRibbon 時鐘（不在指定 P0/P1 清單內，但同頁常駐、成本很低，
   * 一併補上以提高整體對齊度）
   * ========================================================== */
  function initRewardsCountdown() {
    var el = document.querySelector('.rb-timer-val');
    if (!el) return;
    var h = 20, m = 33, s = 6;
    setInterval(function () {
      s -= 1;
      if (s < 0) { s = 59; m -= 1; }
      if (m < 0) { m = 59; h -= 1; }
      if (h < 0) { h = 23; }
      el.textContent = 'Next in ' + String(h).padStart(2, '0') + 'h : ' + String(m).padStart(2, '0') + 'm : ' + String(s).padStart(2, '0') + 's';
    }, 1000);
  }
  function initPromoRibbonClock() {
    var el = document.querySelector('.promo-ribbon-time');
    if (!el) return;
    var span = document.createElement('span');
    Array.prototype.forEach.call(el.childNodes, function (n) {
      if (n.nodeType === 3 && n.textContent.trim()) { span.textContent = n.textContent; el.replaceChild(span, n); }
    });
    if (!span.isConnected) el.appendChild(span);
    setInterval(function () {
      var now = new Date();
      span.textContent = ' ' + [now.getHours(), now.getMinutes(), now.getSeconds()].map(function (v) { return String(v).padStart(2, '0'); }).join(':');
      el.setAttribute('datetime', now.toISOString());
    }, 1000);
  }

  /* ============================================================
   * 通用 section 收合（Rail / Leaderboard / Promotion / Providers /
   * Tournaments 共用 .section-collapse，v-show 對照為直接切換
   * inline display，無需額外 CSS）
   * ========================================================== */
  function toggleSectionCollapse(btn) {
    var section = btn.closest('.lobby-section');
    if (!section) return;
    var collapsed = section.classList.toggle('is-collapsed');
    btn.classList.toggle('active', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    Array.prototype.forEach.call(section.children, function (child) {
      if (!child.classList.contains('section-head')) child.style.display = collapsed ? 'none' : '';
    });
  }

  /* ============================================================
   * 三個 Modal：GameModal / SignInModal / CustomerServiceModal
   * ========================================================== */
  function showModalEl(el) { if (el) el.style.display = ''; }
  function hideModalEl(el) { if (el) el.style.display = 'none'; }

  function gameModalHTML(game) {
    var categoryLabel = tr('t.modal.game.category.' + game.category, game.category);
    var desc = tr('t.modal.game.descTemplate', '{title} is a {category} game from {provider}. Spin volatile reels, stack multipliers, and bank wins instantly to your crypto balance. Provably fair on every round.')
      .replace('{title}', escapeHtml(game.title)).replace('{category}', escapeHtml(categoryLabel)).replace('{provider}', escapeHtml(game.provider));
    var fav = favs.has(game.id);
    return '<div class="modal-head">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<div style="font-family:var(--font-display);font-weight:700;font-size:17px">' + escapeHtml(game.title) + '</div>' +
          '<span class="gcard-provider" style="font-size:12px">' + escapeHtml(game.provider) + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<button type="button" class="modal-gm-fav' + (fav ? ' on' : '') + '" data-gm-fav-id="' + escapeAttr(game.id) + '" aria-label="' + (fav ? 'Remove favorite' : 'Add favorite') + '">' + gcardHeartSvg(fav) + '</button>' +
          '<button type="button" class="modal-close" aria-label="' + escapeAttr(tr('t.modal.close', 'Close')) + '">' + CLOSE_ICON + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="game-modal-art">[ ' + escapeHtml(String(game.title).toUpperCase()) + ' ' + escapeHtml(tr('t.modal.game.previewSuffix', 'GAMEPLAY PREVIEW')) + ' ]</div>' +
        '<div style="color:var(--text-mid);font-size:13.5px;line-height:1.6">' + desc + '</div>' +
        '<div class="game-modal-stats">' +
          '<div class="game-modal-stat"><div class="game-modal-stat-label">' + escapeHtml(tr('t.modal.game.rtp', 'RTP')) + '</div><div class="game-modal-stat-val">' + escapeHtml(game.rtp) + '%</div></div>' +
          '<div class="game-modal-stat"><div class="game-modal-stat-label">' + escapeHtml(tr('t.modal.game.maxWin', 'Max win')) + '</div><div class="game-modal-stat-val">' + escapeHtml(game.maxWin) + '</div></div>' +
          '<div class="game-modal-stat"><div class="game-modal-stat-label">' + escapeHtml(tr('t.modal.game.volatility', 'Volatility')) + '</div><div class="game-modal-stat-val">' + escapeHtml(tr('t.modal.game.volatilityHigh', 'High')) + '</div></div>' +
        '</div>' +
      '</div>';
  }
  function openGameModal(game) {
    var el = document.getElementById('cms-modal-game');
    if (!el) return;
    var modal = el.querySelector('.modal');
    if (modal) modal.innerHTML = gameModalHTML(game);
    showModalEl(el);
  }

  var SIGNIN_STATE = { tab: 'signin', email: 'player@100.gg', username: '' };
  function signInModalHTML(state) {
    var tab = state.tab;
    var headTitle = tab === 'forgot' ? tr('t.modal.signin.forgotPasswordTitle', 'Forgot Password') : (tab === 'signin' ? tr('t.modal.signin.welcomeBack', 'Welcome back') : tr('t.modal.signin.createAccountTitle', 'Create your account'));
    var head = '<div class="modal-head"><div style="font-family:var(--font-display);font-weight:700;font-size:17px">' + escapeHtml(headTitle) + '</div>' +
      '<button type="button" class="modal-close" aria-label="' + escapeAttr(tr('t.modal.close', 'Close')) + '">' + CLOSE_ICON + '</button></div>';
    var body;
    if (tab === 'forgot') {
      body = '<form data-role="cms-form">' +
          '<div class="field"><label>' + escapeHtml(tr('t.modal.signin.emailLabel', 'Email')) + '</label><input type="email" name="email" placeholder="' + escapeAttr(tr('t.modal.signin.resetEmailPlaceholder', 'Enter your email')) + '" value="' + escapeAttr(state.email) + '"></div>' +
          '<button type="submit" class="reset-btn">' + escapeHtml(tr('t.modal.signin.sendResetLink', 'Send Reset Link')) + '</button>' +
          '<div class="signin-foot">' + escapeHtml(tr('t.modal.signin.rememberPassword', 'Remember your password?')) + ' <a href="#" data-tab="signin">' + escapeHtml(tr('t.modal.signin.backToLogin', 'Back to Login')) + '</a></div>' +
        '</form>';
    } else {
      body = '<div class="signin-tabs">' +
          '<button type="button" class="signin-tab' + (tab === 'signin' ? ' active' : '') + '" data-tab="signin">' + escapeHtml(tr('t.modal.signin.signInTab', 'Sign in')) + '</button>' +
          '<button type="button" class="signin-tab' + (tab === 'register' ? ' active' : '') + '" data-tab="register">' + escapeHtml(tr('t.nav.Register', 'Register')) + '</button>' +
        '</div>' +
        '<form data-role="cms-form">' +
          (tab === 'register' ? '<div class="field"><label>' + escapeHtml(tr('t.modal.signin.usernameLabel', 'Username')) + '</label><input name="username" placeholder="player_one" value="' + escapeAttr(state.username) + '"></div>' : '') +
          '<div class="field"><label>' + escapeHtml(tr('t.modal.signin.emailLabel', 'Email')) + '</label><input type="email" name="email" placeholder="you@email.com" value="' + escapeAttr(state.email) + '"></div>' +
          '<div class="field"><label>' + escapeHtml(tr('t.modal.signin.passwordLabel', 'Password')) + '</label><input type="password" name="pw" placeholder="••••••••"></div>' +
          (tab === 'register' ? '<div class="field"><label style="display:flex;align-items:center;gap:8px;color:var(--text-mid)"><input type="checkbox" checked style="margin:0"><span style="font-size:12px">' + escapeHtml(tr('t.modal.signin.ageTerms', "I'm 18+ and accept the Terms")) + '</span></label></div>' : '') +
          '<button type="submit" class="btn primary" style="width:100%;padding:12px;margin-top:6px">' + escapeHtml(tab === 'signin' ? tr('t.modal.signin.signInSubmit', 'Sign in →') : tr('t.modal.signin.createAccountSubmit', 'Create account →')) + '</button>' +
        '</form>' +
        '<div class="signin-foot">' + (tab === 'signin'
          ? escapeHtml(tr('t.modal.signin.noAccount', 'No account?')) + ' <a href="#" data-tab="register">' + escapeHtml(tr('t.nav.Register', 'Register')) + '</a> · <a href="#" data-tab="forgot">' + escapeHtml(tr('t.modal.signin.forgot', 'Forgot?')) + '</a>'
          : escapeHtml(tr('t.modal.signin.alreadyPlayer', 'Already a player?')) + ' <a href="#" data-tab="signin">' + escapeHtml(tr('t.modal.signin.signInTab', 'Sign in')) + '</a>') + '</div>';
    }
    return head + '<div class="modal-body">' + body + '</div>';
  }
  function renderSignInModal() {
    var el = document.getElementById('cms-modal-signin');
    if (!el) return;
    var modal = el.querySelector('.modal');
    if (modal) modal.innerHTML = signInModalHTML(SIGNIN_STATE);
  }
  function openSignInModal(tab) {
    SIGNIN_STATE.tab = tab || 'signin';
    renderSignInModal();
    showModalEl(document.getElementById('cms-modal-signin'));
  }
  function captureSignInFormValues() {
    var el = document.getElementById('cms-modal-signin');
    if (!el) return;
    var emailInp = el.querySelector('input[name="email"]');
    var userInp = el.querySelector('input[name="username"]');
    if (emailInp) SIGNIN_STATE.email = emailInp.value;
    if (userInp) SIGNIN_STATE.username = userInp.value;
  }

  function initCustomerServiceFab() {
    if (!document.getElementById('cms-modal-customerservice')) return;
    if (document.querySelector('.cms-cs-fab')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tb-icon-btn cms-cs-fab';
    var csLabel = tr('t.modal.cs.title', '客服中心');
    btn.setAttribute('aria-label', csLabel);
    btn.setAttribute('title', csLabel);
    btn.setAttribute('data-action', 'open-cs');
    btn.innerHTML = MENU_ICONS.cs;
    document.body.appendChild(btn);
  }

  /* ============================================================
   * TopBar：登入/登出、頭像選單、外觀（skin）選單、餘額浮動
   * ========================================================== */
  var SKINS = [
    { id: 'white', label: 'Pearl Signature', theme: 'light', swatch: '#4d4941', surface: '#f5f2e9' },
    { id: 'sage-atelier', label: 'Sage Atelier', theme: 'light', swatch: '#9ab7ac', surface: '#ecefe9' },
    { id: 'night-esports-green', label: 'Emerald Nocturne', theme: 'dark', swatch: '#9fe2d1', surface: '#0d1316' },
    { id: 'arctic-cyan', label: 'Arctic Cyan', theme: 'dark', swatch: '#62c8d8', surface: '#071116' },
    { id: 'midnight-gold', label: 'Midnight Gold', theme: 'dark', swatch: '#d2b465', surface: '#080d16' },
    { id: 'obsidian-copper', label: 'Obsidian Copper', theme: 'dark', swatch: '#d8a06b', surface: '#0d0e0f' },
    { id: 'crimson-noir', label: 'Crimson Noir', theme: 'dark', swatch: '#df7b89', surface: '#11090d' },
    { id: 'blue', label: 'Sapphire Royale', theme: 'dark', swatch: '#2473ff', surface: '#05080f' },
    { id: 'cosmic-spectrum-purple', label: 'Cosmic Amethyst', theme: 'dark', swatch: '#6a48ff', surface: '#0b0a25' },
    { id: 'jade-jackpot', label: 'Jade Jackpot', theme: 'dark', swatch: '#39ff7c', surface: '#050e09' }
  ];
  var currentSkinId = 'blue';

  function findSkin(id) {
    for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === id) return SKINS[i];
    return null;
  }
  function applySkin(id, silent) {
    var skin = findSkin(id) || findSkin('blue');
    document.documentElement.setAttribute('data-skin', skin.id);
    document.documentElement.setAttribute('data-theme', skin.theme);
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-2');
    document.documentElement.style.removeProperty('--accent-3');
    currentSkinId = skin.id;
    if (!silent) {
      try { localStorage.setItem('cms_theme', skin.theme); localStorage.setItem('cms_skin', skin.id); } catch (e) {}
    }
    var menu = document.querySelector('.tb-skin-menu');
    if (menu) renderSkinMenu(menu);
  }
  function restoreSkin() {
    var saved = null;
    try {
      var savedTheme = localStorage.getItem('cms_theme');
      var savedSkin = localStorage.getItem('cms_skin');
      if (savedTheme || savedSkin) {
        saved = (savedTheme === 'light' && (!savedSkin || savedSkin === 'blue')) ? 'white' : savedSkin;
      }
    } catch (e) {}
    if (saved && findSkin(saved)) applySkin(saved, true);
    else currentSkinId = document.documentElement.getAttribute('data-skin') || 'blue';
    /* useTweaks.js applies TWEAK_DEFAULTS.aspect (1.1) as --card-aspect on every
       boot; without it the cards fall back to main.css's 0.74 and render ~75px
       taller than intended. */
    document.documentElement.style.setProperty('--card-aspect', '1.1');
  }

  /* ============================================================
   * Saved design modules (/studio → localStorage 'cms-v3:design-modules').
   * Apply the per-module variant selection as data-ui-* attributes + --ui-*
   * custom properties so variants.css restyles this live page. Guarded: with
   * no saved config nothing is written and the v1 baseline is untouched.
   * ========================================================== */
  var DESIGN_MODULE_IDS = ['game-card', 'promotion-card', 'spotlight', 'banner', 'ticker', 'button', 'tabs', 'form', 'tag', 'table', 'profile', 'panel', 'navigation', 'section-title', 'modal'];
  var DESIGN_VARIANT_TOKENS = {
    v1: { radius: 'var(--radius-card)', border: '1px solid var(--line)', surface: 'var(--bg-card)', shadow: 'none', inset: 'none', backdrop: 'none', clip: 'none', space: '16px', gap: '12px', weight: 'var(--weight-semibold)', hover: 'translateY(-1px)' },
    v2: { radius: '10px', border: '1px dashed color-mix(in oklch, var(--accent) 62%, var(--line-hi))', surface: 'linear-gradient(135deg, color-mix(in oklch, var(--accent) 16%, var(--bg-card)) 0 28%, var(--bg-card) 28% 72%, color-mix(in oklch, var(--accent-2) 14%, var(--bg-card)) 72% 100%)', shadow: '0 12px 0 color-mix(in oklch, var(--accent) 18%, transparent)', inset: 'inset 0 0 0 1px color-mix(in oklch, var(--text) 8%, transparent)', backdrop: 'none', clip: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)', space: '18px', gap: '14px', weight: 'var(--weight-bold)', hover: 'translateY(-4px) rotate(-.3deg)', motif: '"TICKET"', motifSize: '46px', motifOpacity: '.14' },
    v3: { radius: '22px 22px 8px 8px', border: '2px solid color-mix(in oklch, var(--text) 18%, var(--line-hi))', surface: 'linear-gradient(180deg, color-mix(in oklch, var(--bg-card-hi) 82%, var(--accent) 18%), var(--bg-card) 42%, color-mix(in oklch, var(--bg-elev) 78%, black 22%))', shadow: '0 18px 36px rgba(0, 0, 0, .28)', inset: 'inset 0 6px 0 color-mix(in oklch, var(--accent) 32%, transparent), inset 0 -10px 0 color-mix(in oklch, black 18%, transparent)', backdrop: 'none', clip: 'none', space: '20px', gap: '14px', weight: 'var(--weight-bold)', hover: 'translateY(-5px) scale(1.015)', motif: '"777"', motifSize: '58px', motifOpacity: '.18' },
    v4: { radius: '18px', border: '1px solid color-mix(in oklch, var(--accent-2) 24%, transparent)', surface: 'linear-gradient(145deg, color-mix(in oklch, var(--bg-card) 68%, transparent), color-mix(in oklch, var(--accent) 10%, transparent))', shadow: '0 20px 46px rgba(0, 0, 0, .20)', inset: 'inset 0 1px 0 color-mix(in oklch, white 18%, transparent), inset 0 -1px 0 color-mix(in oklch, var(--accent) 16%, transparent)', backdrop: 'blur(20px) saturate(1.18)', clip: 'none', space: '20px', gap: '16px', weight: 'var(--weight-semibold)', hover: 'translateY(-4px)', motif: '"$"', motifSize: '76px', motifOpacity: '.12' },
    v5: { radius: '2px', border: '1px solid color-mix(in oklch, var(--accent) 72%, var(--line-hi))', surface: 'linear-gradient(110deg, color-mix(in oklch, var(--accent) 18%, var(--bg-elev)) 0 44%, var(--bg-elev) 44% 58%, color-mix(in oklch, var(--accent-2) 18%, var(--bg-elev)) 58% 100%)', shadow: '0 0 0 1px color-mix(in oklch, var(--accent) 20%, transparent), 0 18px 28px color-mix(in oklch, var(--accent) 16%, transparent)', inset: 'inset 6px 0 0 var(--accent), inset -1px 0 0 color-mix(in oklch, var(--accent-2) 40%, transparent)', backdrop: 'none', clip: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, calc(100% - 10px) 100%, 18px 100%, 0 calc(100% - 18px))', space: '18px', gap: '10px', weight: 'var(--weight-bold)', hover: 'translateX(5px)', motif: '"ZAP"', motifSize: '44px', motifOpacity: '.18' },
    v6: { radius: '26px 26px 14px 14px', border: '1px solid color-mix(in oklch, var(--accent) 42%, var(--line-hi))', surface: 'radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--accent) 24%, transparent), transparent 42%), linear-gradient(180deg, var(--bg-card-hi), var(--bg-card))', shadow: '0 24px 56px rgba(0, 0, 0, .30)', inset: 'inset 0 2px 0 color-mix(in oklch, var(--accent-2) 38%, transparent), inset 0 -8px 0 color-mix(in oklch, black 10%, transparent)', backdrop: 'none', clip: 'none', space: '22px', gap: '16px', weight: 'var(--weight-bold)', hover: 'translateY(-6px)', motif: '"JACKPOT"', motifSize: '38px', motifOpacity: '.16' },
    v7: { radius: '3px', border: '1px solid color-mix(in oklch, var(--line-hi) 82%, transparent)', surface: 'repeating-linear-gradient(90deg, transparent 0 18px, color-mix(in oklch, var(--line) 54%, transparent) 18px 19px), repeating-linear-gradient(0deg, transparent 0 22px, color-mix(in oklch, var(--line) 48%, transparent) 22px 23px), var(--bg-card)', shadow: 'inset 0 0 0 1px color-mix(in oklch, var(--accent) 12%, transparent)', inset: 'none', backdrop: 'none', clip: 'none', space: '9px', gap: '6px', weight: 'var(--weight-medium)', hover: 'translateY(-1px) scale(.995)', motif: '"01"', motifSize: '34px', motifOpacity: '.12' },
    v8: { radius: '0px', border: '1px solid color-mix(in oklch, var(--text) 16%, transparent)', surface: 'linear-gradient(90deg, transparent 0 12%, color-mix(in oklch, var(--bg-card) 72%, transparent) 12% 100%)', shadow: 'none', inset: 'inset 0 4px 0 var(--accent), inset 0 -1px 0 color-mix(in oklch, var(--text) 9%, transparent)', backdrop: 'none', clip: 'none', space: '28px', gap: '20px', weight: 'var(--weight-bold)', hover: 'translateY(-3px)', motif: '"VIP"', motifSize: '52px', motifOpacity: '.10' },
    v9: { radius: '8px', border: '1px solid color-mix(in oklch, var(--accent-2) 34%, var(--line-hi))', surface: 'radial-gradient(circle at 12% 50%, color-mix(in oklch, var(--accent) 10%, transparent) 0 18%, transparent 19%), repeating-linear-gradient(0deg, transparent 0 28px, color-mix(in oklch, var(--line) 76%, transparent) 28px 29px), var(--bg-card)', shadow: '0 10px 0 color-mix(in oklch, var(--bg-elev) 78%, transparent)', inset: 'inset 0 1px 0 color-mix(in oklch, var(--text) 8%, transparent), inset 0 0 0 5px color-mix(in oklch, var(--accent) 5%, transparent)', backdrop: 'none', clip: 'none', space: '16px', gap: '12px', weight: 'var(--weight-semibold)', hover: 'translateY(-2px)', motif: '"$"', motifSize: '58px', motifOpacity: '.11' },
    v10: { radius: '12px 4px 4px 12px', border: '1px solid color-mix(in oklch, var(--accent) 46%, var(--line))', surface: 'linear-gradient(90deg, color-mix(in oklch, var(--accent) 18%, var(--bg-card)) 0 18%, var(--bg-card) 18% 100%)', shadow: '0 12px 24px color-mix(in oklch, var(--accent) 12%, transparent)', inset: 'inset 7px 0 0 var(--accent), inset -1px 0 0 color-mix(in oklch, var(--accent-2) 32%, transparent)', backdrop: 'none', clip: 'none', space: '18px', gap: '12px', weight: 'var(--weight-bold)', hover: 'translateX(5px)', motif: '">>"', motifSize: '42px', motifOpacity: '.16' }
  };
  function applyLobbyLayout() {
    var raw = null;
    try { raw = localStorage.getItem('cms-v3:lobby-layout'); } catch (e) { return; }
    if (!raw) return;
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { return; }
    var hidden = parsed && parsed.hidden;
    if (Array.isArray(hidden)) {
      hidden.forEach(function (slug) {
        var el = document.querySelector('.lobby-section[data-section="' + slug + '"]');
        if (el) el.style.display = 'none';
      });
    }
    var order = parsed && parsed.order;
    if (Array.isArray(order) && order.length) {
      var list = document.querySelector('.lobby-section-list');
      if (list) {
        order.forEach(function (slug) {
          var el = document.querySelector('.lobby-section[data-section="' + slug + '"]');
          var item = el && el.closest('.lobby-sort-item');
          if (item) list.appendChild(item);
        });
      }
    }
  }
  function applyAccountSections() {
    var raw = null;
    try { raw = localStorage.getItem('cms-v3:account-sections'); } catch (e) { return; }
    if (!raw) return;
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { return; }
    var hidden = parsed && parsed.hidden;
    if (!Array.isArray(hidden)) return;
    hidden.forEach(function (id) {
      var el = document.querySelector('[data-section="' + id + '"]');
      if (el) el.style.display = 'none';
    });
  }
  /* Top-of-page blocks (hero banner / ticker / rewards card) — /studio →
     'cms-v3:top-block-layout'. Reordered in place relative to .cat-tabs so
     the reorderable lobby-section-list below is untouched. */
  var TOP_BLOCK_SELECTOR = { 'hero-banner': '.hero', ticker: '.promo-ribbon', 'rewards-banner': '.rewards-wrap' };
  function applyTopBlockLayout() {
    var raw = null;
    try { raw = localStorage.getItem('cms-v3:top-block-layout'); } catch (e) { return; }
    if (!raw) return;
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { return; }
    var hidden = parsed && parsed.hidden;
    if (Array.isArray(hidden)) {
      hidden.forEach(function (slug) {
        var el = document.querySelector(TOP_BLOCK_SELECTOR[slug]);
        if (el) el.style.display = 'none';
      });
    }
    var order = parsed && parsed.order;
    if (Array.isArray(order) && order.length) {
      var catTabs = document.querySelector('.cat-tabs');
      if (catTabs && catTabs.parentNode) {
        order.forEach(function (slug) {
          var el = document.querySelector(TOP_BLOCK_SELECTOR[slug]);
          if (el) catTabs.parentNode.insertBefore(el, catTabs);
        });
      }
    }
  }
  /* /studio → 'cms-v3:show-skin-button'. Absent key = shown (default). */
  function applySkinButtonVisibility() {
    var raw = null;
    try { raw = localStorage.getItem('cms-v3:show-skin-button'); } catch (e) { return; }
    if (!raw) return;
    var show = true;
    try { show = JSON.parse(raw) !== false; } catch (e) { return; }
    if (show) return;
    var wraps = document.querySelectorAll('.tb-skin-wrap');
    for (var i = 0; i < wraps.length; i++) wraps[i].style.display = 'none';
  }
  /* Hero banners (/studio → 'cms-v3:hero-banners'). The baked hero-bg markup
     already carries --hero-image/--hero-position/--hero-mobile-* custom
     props for exactly this override (see main.css .hero-bg); only the
     inline background-image duplicate needs clearing so the var wins, and
     the slide/dot count needs to track a banner set that differs from the
     shipped 5 — cloning cycles copy from the original slides since there's
     no new title/sub source for banners beyond the baked set. */
  function applyHeroBannerVars(bg, banner) {
    /* A banner with no image (corrupt/legacy localStorage entry) must leave
       the slide's existing background untouched — writing '--hero-image:
       url(undefined)' blanks the layer with no visible fallback, since the
       inline background-image this removes is the only other source of the
       picture. */
    if (!banner || typeof banner.image !== 'string' || !banner.image) return;
    /* --hero-image is consumed via var() inside main.css, so a relative URL
       here would resolve against main.css's own location instead of the
       page; resolve to an absolute URL first (no-op for data:/absolute URLs). */
    var resolvedImage = new URL(banner.image, document.baseURI).href;
    /* A stored URL can point at a file that no longer exists (renamed/removed
       asset from an older localStorage snapshot) — probe it first so a 404
       leaves the slide's existing background alone instead of going blank. */
    var probe = new Image();
    probe.onload = function () {
      bg.style.removeProperty('background-image');
      bg.style.setProperty('--hero-image', 'url(' + resolvedImage + ')');
      bg.style.setProperty('--hero-position', banner.position || 'center');
      bg.style.setProperty('--hero-mobile-position', banner.mobilePosition || banner.position || 'center');
    };
    probe.src = resolvedImage;
  }
  function applyHeroBanners(banners) {
    var hero = document.querySelector('.hero');
    if (!hero || !Array.isArray(banners) || !banners.length) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var baseCount = slides.length;
    if (!baseCount) return;
    var dotsWrap = hero.querySelector('.hero-dots');
    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.querySelectorAll('.hero-dot')) : [];
    while (slides.length < banners.length) {
      var clone = slides[slides.length % baseCount].cloneNode(true);
      clone.classList.remove('active');
      hero.insertBefore(clone, dotsWrap || null);
      slides.push(clone);
      if (dotsWrap && dots.length) {
        var dotClone = dots[0].cloneNode(true);
        dotClone.classList.remove('active');
        dotClone.setAttribute('aria-label', 'Slide ' + slides.length);
        dotsWrap.appendChild(dotClone);
        dots.push(dotClone);
      }
    }
    while (slides.length > banners.length) {
      var extraSlide = slides.pop();
      if (extraSlide.parentNode) extraSlide.parentNode.removeChild(extraSlide);
      if (dots.length) { var extraDot = dots.pop(); if (extraDot.parentNode) extraDot.parentNode.removeChild(extraDot); }
    }
    banners.forEach(function (banner, i) {
      var bg = slides[i].querySelector('.hero-bg');
      if (bg) applyHeroBannerVars(bg, banner);
      slides[i].classList.toggle('active', i === 0);
      if (dots[i]) dots[i].classList.toggle('active', i === 0);
    });
  }
  function applySavedBanners() {
    var raw = null;
    try { raw = localStorage.getItem('cms-v3:hero-banners'); } catch (e) { return; }
    if (!raw) return;
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { return; }
    applyHeroBanners(parsed);
  }
  window.__cmsApplyHeroBanners = applyHeroBanners;
  function applyModuleVariantVars(el, moduleId, variantId) {
    var tokens = DESIGN_VARIANT_TOKENS[variantId] || DESIGN_VARIANT_TOKENS.v1;
    Object.keys(tokens).forEach(function (tk) { el.style.setProperty('--ui-' + moduleId + '-' + tk, tokens[tk]); });
    var stack = [tokens.shadow, tokens.inset].filter(function (x) { return x && x !== 'none'; }).join(', ') || 'none';
    el.style.setProperty('--ui-' + moduleId + '-shadow-stack', stack);
  }
  function applySavedDesign() {
    var raw = null;
    try { raw = localStorage.getItem('cms-v3:design-modules'); } catch (e) { return; }
    if (!raw) return;
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { return; }
    var modules = parsed && parsed.modules;
    if (!modules || typeof modules !== 'object') return;
    var root = document.documentElement;
    DESIGN_MODULE_IDS.forEach(function (id) {
      var v = DESIGN_VARIANT_TOKENS[modules[id]] ? modules[id] : 'v1';
      root.setAttribute('data-ui-' + id, v);
      applyModuleVariantVars(root, id, v);
    });
  }
  /* Per-section variant overrides (/studio → 'cms-v3:section-variants').
     Same v1-v10 vocabulary as the global module chips, but scoped to a single
     [data-section] block instead of :root — variants.css's gate selector
     also accepts [data-section] (see main.css) so a section carrying its own
     data-ui-<module> attribute + --ui-<module>-* vars overrides the global
     pick for just its own descendants, via ordinary custom-property cascade.
     Unmapped sections (no clear 1:1 module, e.g. tournaments/account panels)
     are intentionally not offered this control. */
  var PER_SECTION_MODULE = {
    'live-casino': 'game-card', 'recently-played': 'game-card', slots: 'game-card', 'top-wins': 'table',
    promotions: 'promotion-card', providers: 'ticker', 'featured-games': 'spotlight'
  };
  function applySectionVariants(map) {
    map = (map && typeof map === 'object') ? map : {};
    Object.keys(PER_SECTION_MODULE).forEach(function (slug) {
      var el = document.querySelector('[data-section="' + slug + '"]');
      if (!el) return;
      var moduleId = PER_SECTION_MODULE[slug];
      el.removeAttribute('data-ui-' + moduleId);
      Object.keys(DESIGN_VARIANT_TOKENS.v1).forEach(function (tk) { el.style.removeProperty('--ui-' + moduleId + '-' + tk); });
      el.style.removeProperty('--ui-' + moduleId + '-shadow-stack');
      var variantId = map[slug];
      if (!variantId || !DESIGN_VARIANT_TOKENS[variantId]) return;
      if (variantId !== 'v1') el.setAttribute('data-ui-' + moduleId, variantId);
      applyModuleVariantVars(el, moduleId, variantId);
    });
  }
  function applySavedSectionVariants() {
    var raw = null;
    try { raw = localStorage.getItem('cms-v3:section-variants'); } catch (e) { return; }
    if (!raw) return;
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { return; }
    applySectionVariants(parsed);
  }
  window.__cmsApplySectionVariants = applySectionVariants;

  /* Site name (/studio → 'cms-v3:site-name'), drives the browser tab title. */
  function applySavedSiteName() {
    var raw = null;
    try { raw = localStorage.getItem('cms-v3:site-name'); } catch (e) { return; }
    if (raw && raw.trim()) document.title = raw.trim();
  }

  /* 側邊欄 .sb-deposit／.sb-withdraw 原本各自寫死主色／外框（看
     components.css 的 :is(...) 分組），跟目前在哪一頁無關；改成用
     CURRENT_PAGE 判斷，讓當前頁面對應的那顆掛 .is-current 顯示主色，
     另一顆退回外框樣式（其餘頁面兩顆都不特別標示）。 */
  function applySbMoneyActiveState() {
    var isDeposit = CURRENT_PAGE === 'deposit.html';
    var isWithdraw = CURRENT_PAGE === 'withdrawal.html';
    Array.prototype.forEach.call(document.querySelectorAll('.sb-deposit'), function (el) { el.classList.toggle('is-current', isDeposit); });
    Array.prototype.forEach.call(document.querySelectorAll('.sb-withdraw'), function (el) { el.classList.toggle('is-current', isWithdraw); });
  }

  /* ============================================================
   * Site-wide CHROME variants (/studio → 'cms-v3:chrome').
   * Toggle chrome-module + chrome-{part}--vN on the real header, footer and
   * mobile-nav so chrome-variants.css restyles the whole shell. v1 (or no
   * saved config) strips every chrome class → the shipped baseline is untouched.
   * Mirrors the v2 factory applyChromeVariant / applyStudioChromeNow capability.
   * ========================================================== */
  function applyChromePart(el, part, variant) {
    if (!el || !el.classList) return;
    var remove = [];
    for (var i = 0; i < el.classList.length; i++) {
      var c = el.classList[i];
      if (c === 'chrome-module' || c.indexOf('chrome-' + part + '--') === 0) remove.push(c);
    }
    remove.forEach(function (c) { el.classList.remove(c); });
    if (variant && variant !== 'v1') {
      el.classList.add('chrome-module');
      el.classList.add('chrome-' + part + '--' + variant);
    }
  }
  function applyChromeVariant(chrome) {
    if (!chrome) return;
    applyChromePart(document.querySelector('header.header') || document.querySelector('header'), 'header', chrome.header || 'v1');
    applyChromePart(document.querySelector('footer'), 'footer', chrome.footer || 'v1');
    applyChromePart(document.querySelector('.mobile-nav'), 'footer', chrome.footer || 'v1');
  }
  function readSavedChrome() {
    var raw = null;
    try { raw = localStorage.getItem('cms-v3:chrome'); } catch (e) { return null; }
    if (!raw) return null;
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { return null; }
    var c = parsed && (parsed.chrome || parsed);
    if (!c || typeof c !== 'object' || (!c.header && !c.footer)) return null;
    return { header: c.header || 'v1', footer: c.footer || 'v1' };
  }
  /* Real top-level site: apply the published chrome on every page load,
     alongside restoreSkin / applySavedDesign. */
  function applySavedChrome() {
    if (window.self !== window.top) return;
    var chrome = readSavedChrome();
    if (chrome) applyChromeVariant(chrome);
  }
  /* /studio preview iframe only: re-assert the published chrome on this page's
     own boot so there is no flash of the baseline before the parent studio
     drives the (possibly newer) draft via window.__cmsApplyChrome. */
  function applyStudioChromeNow() {
    if (window.self === window.top) return;
    var chrome = readSavedChrome();
    if (chrome) applyChromeVariant(chrome);
  }
  /* Same-origin hook the /studio preview calls to reflect its draft chrome
     instantly without persistence — the chrome counterpart of how the studio
     drives the iframe for skins / design modules. */
  window.__cmsApplyChrome = function (chrome) { applyChromeVariant(chrome); };

  /* Visibility filters (/studio → 'cms-v3:visible-skins' / 'cms-v3:visible-locales').
     Restrict the skin/language menus to the allowed set; the current selection is
     always kept so nothing can strand the visitor. No key = show everything. */
  function readVisibleSet(key) {
    var raw = null;
    try { raw = localStorage.getItem(key); } catch (e) { return null; }
    if (!raw) return null;
    var ids = null;
    try { ids = JSON.parse(raw); } catch (e) { return null; }
    if (!Array.isArray(ids) || !ids.length) return null;
    var set = {};
    ids.forEach(function (i) { set[i] = 1; });
    return set;
  }
  function visibleSkinList() {
    var set = readVisibleSet('cms-v3:visible-skins');
    if (!set) return SKINS;
    var out = SKINS.filter(function (s) { return set[s.id] || s.id === currentSkinId; });
    return out.length ? out : SKINS;
  }
  /* 尚未在 studio 設定過可見語言時(no key),中文預設對玩家隱藏,
     可在 studio「前台可見語言」重新開啟;一旦 studio 存過設定,
     一律以該設定為準(含重新勾回中文)。 */
  function visibleLocaleKeys(keys) {
    var set = readVisibleSet('cms-v3:visible-locales');
    if (!set) return keys.filter(function (k) { return k !== 'zh' || k === LOCALE; });
    var out = keys.filter(function (k) { return set[k] || k === LOCALE; });
    return out.length ? out : keys;
  }

  function renderSkinMenu(menu) {
    menu.className = 'tb-skin-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', 'Skin');
    menu.innerHTML = visibleSkinList().map(function (s) {
      var active = s.id === currentSkinId;
      return '<button type="button" class="tb-skin-option' + (active ? ' active' : '') + '" role="option" aria-selected="' + active + '" data-skin="' + s.id + '">' +
        '<span class="tb-skin-swatch" style="--skin-color:' + s.swatch + ';--skin-surface:' + s.surface + '" aria-hidden="true"></span>' +
        '<span class="tb-skin-label">' + escapeHtml(s.label) + '</span>' +
        (active ? CHECK_ICON : '') +
      '</button>';
    }).join('');
  }
  function closeSkinMenu() {
    var m = document.querySelector('.tb-skin-menu'); if (m) m.remove();
    var trig = document.querySelector('.tb-skin-trigger'); if (trig) trig.setAttribute('aria-expanded', 'false');
  }
  function toggleSkinMenu(trigger) {
    var wrap = trigger.closest('.tb-skin-wrap');
    if (!wrap) return;
    var existing = wrap.querySelector('.tb-skin-menu');
    if (existing) { closeSkinMenu(); return; }
    closeUserMenu();
    closeNotifMenu();
    var menu = document.createElement('div');
    wrap.appendChild(menu);
    renderSkinMenu(menu);
    trigger.setAttribute('aria-expanded', 'true');
  }

  /* 開頁時要跟 doLogout() 寫入的 cms_v3_logged_out 對齊，不然登出後
     換頁/整頁重整一律又變回登入狀態，看起來像登出完全沒作用。 */
  var USER = (function () {
    var loggedOut = false;
    try { loggedOut = localStorage.getItem('cms_v3_logged_out') === '1'; } catch (e) {}
    return { loggedIn: !loggedOut, name: 'PlayerOne', email: 'player@100.gg' };
  })();
  var BALANCE = 1284.32;

  function loggedOutHTML() {
    return '<button type="button" class="btn" data-action="open-signin">' + tr('t.nav.Login', '登入') + '</button>' +
      '<button type="button" class="btn primary" data-action="open-signin">' + tr('t.nav.Register', '註冊') + '</button>';
  }
  function loggedInHTML() {
    var initials = escapeHtml(USER.name.slice(0, 2).toUpperCase());
    return '<div class="tb-balance"><div class="tb-balance-rows">' +
        '<div class="tb-balance-row"><span class="tb-balance-label">' + tr('t.topbar.balance', '餘額：') + '</span><span class="tb-balance-num">' + fmtNum(BALANCE) + '</span></div>' +
        '<div class="tb-balance-row"><span class="tb-balance-label">' + tr('t.topbar.points', '點數：') + '</span><span class="tb-balance-num">0.00</span></div>' +
      '</div></div>' +
      '<div class="tb-user-wrap">' +
        '<button type="button" class="tb-user-circle" aria-label="' + tr('t.topbar.account', '帳戶') + '"><span class="tb-avatar circle">' + initials + '</span><span class="tb-tier-badge" aria-hidden="true">' + TIER_ICON + '</span></button>' +
      '</div>';
  }
  function setAuthSection(html) {
    /* site-mobile 頁面的 topbar 其實有兩個 .header-actions：一個是桌機版
       樣式(含 .tb-skin-wrap，這寬度下用 CSS 隱藏)，另一個才是手機版
       實際顯示的(.tb-balance.m-header-balance + 通知鈴 .m-header-
       bell-wrap)。原本只用 querySelector 抓第一個，手機版真正看得到的
       那個從沒被换過，登出後畫面看起來一直沒反應。改成 querySelectorAll
       逐一處理；且不能整段清空重插——手機版的通知鈴跟登入狀態無關，
       要保留，只換掉 .tb-skin-wrap/.m-header-bell-wrap 以外的內容(也就
       是原本的餘額/頭像，或登入/註冊按鈕)，新內容插在通知鈴前面(若
       這個 header-actions 沒有通知鈴，插在最後)。 */
    var all = document.querySelectorAll('.header-actions');
    Array.prototype.forEach.call(all, function (headerActions) {
      var bellWrap = headerActions.querySelector('.m-header-bell-wrap');
      var node = headerActions.firstChild;
      while (node) {
        var next = node.nextSibling;
        var keep = node.nodeType === 1 && (node.classList.contains('tb-skin-wrap') || node.classList.contains('m-header-bell-wrap'));
        if (!keep) headerActions.removeChild(node);
        node = next;
      }
      if (bellWrap) bellWrap.insertAdjacentHTML('beforebegin', html);
      else headerActions.insertAdjacentHTML('beforeend', html);
    });
  }
  function renderAuthSection() { setAuthSection(USER.loggedIn ? loggedInHTML() : loggedOutHTML()); }
  /* bfcache 修復：doLogout() 用 location.href 換頁時，如果目標頁在這次
     瀏覽階段已經造訪過(例如先進 index.html 才點進 security-center.html
     再登出跳回 index.html)，瀏覽器可能直接從 bfcache 還原那個分頁當時
     的記憶體狀態(含當時還是登入中的 USER)，而不是重新執行整段開機
     腳本——這種情況下 USER.loggedIn 不會照 cms_v3_logged_out 旗標重新
     判斷，畫面看起來像「登出後換頁又自動變回登入」。pageshow 的
     event.persisted 專門用來偵測這種從 bfcache 還原的情況，還原時強制
     重新讀旗標、重繪 topbar。 */
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    try { USER.loggedIn = localStorage.getItem('cms_v3_logged_out') !== '1'; } catch (err) {}
    renderAuthSection();
  });

  function userMenuHTML() {
    var initials = escapeHtml(USER.name.slice(0, 2).toUpperCase());
    var items = [
      { label: tr('t.nav.Personal Info', '個人資料'), href: 'personal-info.html', icon: MENU_ICONS.person },
      { label: tr('t.nav.Change Login Password', '變更登入密碼'), href: '#', kind: 'login', icon: MENU_ICONS.lock },
      { label: tr('t.nav.Change Transaction Password', '變更交易密碼'), href: '#', kind: 'transaction', icon: MENU_ICONS.key }
    ];
    var itemsHtml = items.map(function (it) {
      var kindAttr = it.kind ? ' data-action="open-change-password" data-cp-kind="' + it.kind + '"' : '';
      return '<a href="' + it.href + '" class="tb-menu-item tb-menu-item-2l"' + kindAttr + '><span class="tb-menu-ico">' + it.icon + '</span>' +
        '<span class="tb-menu-2l-text"><span class="tb-menu-2l-name">' + it.label + '</span></span></a>';
    }).join('');
    return '<div class="tb-menu">' +
        '<div class="tb-menu-head"><div class="tb-avatar lg">' + initials + '</div><div><div class="tb-menu-name">' + escapeHtml(USER.name) + '</div><div class="tb-menu-email">' + escapeHtml(USER.email) + '</div></div></div>' +
        itemsHtml +
        '<div class="tb-menu-sep"></div>' +
        '<button type="button" class="tb-menu-item logout tb-menu-item-2l" data-action="logout"><span class="tb-menu-ico">' + MENU_ICONS.logout + '</span><span class="tb-menu-2l-text"><span class="tb-menu-2l-name">' + tr('t.nav.Logout', '登出') + '</span></span></button>' +
      '</div>';
  }
  function closeUserMenu() { var m = document.querySelector('.tb-menu'); if (m) m.remove(); }
  function toggleUserMenu(circleBtn) {
    var existing = document.querySelector('.tb-menu');
    if (existing) { closeUserMenu(); return; }
    closeSkinMenu();
    closeNotifMenu();
    var wrap = circleBtn.closest('.tb-user-wrap');
    if (wrap) wrap.insertAdjacentHTML('beforeend', userMenuHTML());
  }

  /* ============================================================
   * 手機版通知鈴鐺(.m-header-bell)下拉預覽：站上沒有真的通知資料
   * 來源，這裡固定放 4 筆假訊息示意畫面長相，圖示複用側欄既有的
   * 優惠/儲值紀錄/等級徽章 svg 路徑、登入安全圖示複用 MENU_ICONS.lock，
   * 面板本身沿用桌機頭像選單的 .tb-menu/.tb-menu-item-2l 樣式，
   * 沒有新增任何圖示或卡片樣式。
   * ========================================================== */
  var NOTIF_ICONS = {
    gift: '<svg width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M12 9v12M3 13h18M12 9H8.5a2.5 2.5 0 1 1 2.2-3.7L12 9Zm0 0h3.5a2.5 2.5 0 1 0-2.2-3.7L12 9Z"/></g></svg>',
    deposit: '<svg width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M12 4v12m0 0-4-4m4 4 4-4"/><path d="M4 20h16"/></g></svg>',
    tier: '<svg width="14" height="16" viewBox="0 0 12 14" fill="currentColor"><path d="M6 0 0 3.5v7L6 14l6-3.5v-7L6 0Z"/></svg>'
  };
  var NOTIF_DATA = [
    { icon: NOTIF_ICONS.gift, title: 'Weekend Reload Bonus', body: 'Deposit today and get 20% extra, up to $500.', time: '10m ago' },
    { icon: NOTIF_ICONS.deposit, title: 'Deposit Successful', body: 'Your deposit of $200.00 has been credited.', time: '1h ago' },
    { icon: NOTIF_ICONS.tier, title: "You're 62% to Bronze", body: 'Keep playing to unlock Bronze tier rewards.', time: '3h ago' },
    { icon: MENU_ICONS.lock, title: 'New Login Detected', body: 'New login from 125.227.44.193. Not you? Change your password.', time: '1d ago' }
  ];
  function notifMenuHTML() {
    var itemsHtml = NOTIF_DATA.map(function (n) {
      return '<div class="tb-menu-item tb-menu-item-2l"><span class="tb-menu-ico">' + n.icon + '</span>' +
        '<span class="tb-menu-2l-text">' +
          '<span class="tb-menu-2l-name">' + escapeHtml(n.title) + '</span>' +
          '<span class="tb-menu-2l-sub">' + escapeHtml(n.body) + '</span>' +
          '<span class="tb-menu-2l-sub" style="opacity:.7">' + escapeHtml(n.time) + '</span>' +
        '</span></div>';
    }).join('');
    return '<div class="tb-menu m-notif-menu">' +
        '<div class="tb-menu-head"><div style="font-weight:700;font-size:14px;color:var(--text);">Notifications</div></div>' +
        itemsHtml +
      '</div>';
  }
  function closeNotifMenu() { var m = document.querySelector('.m-notif-menu'); if (m) m.remove(); }
  function toggleNotifMenu(trigger) {
    var wrap = trigger.closest('.m-header-bell-wrap');
    if (!wrap) return;
    var existing = wrap.querySelector('.m-notif-menu');
    if (existing) { closeNotifMenu(); return; }
    closeUserMenu();
    closeSkinMenu();
    closeLangMenu();
    wrap.insertAdjacentHTML('beforeend', notifMenuHTML());
  }

  function doLogout() {
    USER.loggedIn = false;
    renderAuthSection();
    closeUserMenu();
    /* USER 只存在單頁記憶體，換頁就重置——這裡寫 localStorage 旗標，
       上面 USER 初始化時會讀它，換頁/整頁重整後才會維持登出狀態。
       手機版個人資料頁登入引導(site-mobile/personal-info.html)也是
       靠同一把旗標判斷。原本試過登出後直接 location.href 導回首頁，
       但同一分頁在這次瀏覽階段如果已經造訪過目標網址，實測會被還原成
       上一次造訪時的狀態、不會重新跑開機腳本，導致換頁後畫面又變回
       登入中，比留在原頁不導頁更誤導人；改成留在原頁，topbar 立刻換成
       登出樣式，同時跳一個看得到的成功訊息，不依賴任何換頁時機。 */
    try { localStorage.setItem('cms_v3_logged_out', '1'); } catch (e) {}
    showDialog(resultDialogHTML('success', 'Logged Out', 'You have been logged out.'));
  }
  function doLogin(name, email) {
    USER.loggedIn = true;
    USER.name = name || 'player';
    USER.email = email || 'player@100.gg';
    renderAuthSection();
    hideModalEl(document.getElementById('cms-modal-signin'));
    try { localStorage.removeItem('cms_v3_logged_out'); } catch (e) {}
  }

  function initBalanceFloat() {
    if (!document.querySelector('.tb-balance-rows')) return;
    setInterval(function () {
      if (!USER.loggedIn) return;
      BALANCE = +(BALANCE + (Math.random() * 4 - 1.7)).toFixed(2);
      var el = document.querySelector('.tb-balance-rows .tb-balance-row:first-child .tb-balance-num');
      if (el) el.textContent = fmtNum(BALANCE);
    }, 5500);
  }

  /* ============================================================
   * 手機底部導覽 Browse 按鈕 <-> 側欄遮罩
   * ========================================================== */
  function initMobileNav() {
    var browseBtn = document.querySelector('.mobile-nav .mnav-btn:not([href])');
    var shell = document.querySelector('.shell');
    var closeToggle = document.querySelector('.sb-collapse-toggle');
    function syncCloseToggleLabel() {
      if (!closeToggle || !shell) return;
      var label = shell.classList.contains('mobile-open') ? 'Close menu' : 'Collapse sidebar';
      closeToggle.setAttribute('aria-label', label);
      closeToggle.setAttribute('title', label);
    }
    if (browseBtn && shell) {
      browseBtn.addEventListener('click', function () { shell.classList.toggle('mobile-open'); syncCloseToggleLabel(); });
    }
    var topMenuBtn = document.querySelector('.m-topbar-menu');
    if (topMenuBtn && shell) {
      topMenuBtn.addEventListener('click', function () { shell.classList.toggle('mobile-open'); syncCloseToggleLabel(); });
    }
    var backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop && shell) {
      backdrop.addEventListener('click', function () { shell.classList.remove('mobile-open'); syncCloseToggleLabel(); });
    }
  }

  /* ============================================================
   * 全域委派點擊（大部分互動走這裡；DOM 被整段換掉也不必重新綁定）
   * ========================================================== */
  function onDocumentClick(e) {
    var t = e.target;

    var closeBtn = t.closest('.modal-close');
    if (closeBtn) { var bg = closeBtn.closest('.modal-bg'); if (bg) { if (bg.hasAttribute('data-transient')) bg.remove(); else hideModalEl(bg); } return; }
    if (t.classList && t.classList.contains('modal-bg')) { if (t.hasAttribute('data-transient')) t.remove(); else hideModalEl(t); return; }
    var dialogCloseBtn = t.closest('[data-dialog-close]');
    if (dialogCloseBtn) { var dcbg = dialogCloseBtn.closest('.modal-bg'); if (dcbg) dcbg.remove(); return; }
    var gmFavBtn = t.closest('.modal-gm-fav');
    if (gmFavBtn) {
      var gmGameId = gmFavBtn.getAttribute('data-gm-fav-id');
      toggleFav(gmGameId);
      var gmNowFav = isFav(gmGameId);
      gmFavBtn.classList.toggle('on', gmNowFav);
      gmFavBtn.setAttribute('aria-label', gmNowFav ? 'Remove favorite' : 'Add favorite');
      gmFavBtn.innerHTML = gcardHeartSvg(gmNowFav);
      return;
    }

    var openSignin = t.closest('[data-action="open-signin"]');
    if (openSignin) { openSignInModal('signin'); return; }
    var openChangePassword = t.closest('[data-action="open-change-password"]');
    if (openChangePassword) {
      e.preventDefault();
      var cpTitleEl = openChangePassword.querySelector('.tb-menu-2l-name');
      openChangePasswordDialog(openChangePassword.getAttribute('data-cp-kind'), cpTitleEl ? cpTitleEl.textContent.trim() : 'Change Password');
      return;
    }
    var openCs = t.closest('[data-action="open-cs"]');
    if (openCs) { showModalEl(document.getElementById('cms-modal-customerservice')); return; }
    var logoutBtn = t.closest('[data-action="logout"]');
    if (logoutBtn) { doLogout(); return; }

    var userCircle = t.closest('.tb-user-circle');
    if (userCircle) { toggleUserMenu(userCircle); return; }
    var skinTrigger = t.closest('.tb-skin-trigger');
    if (skinTrigger) { toggleSkinMenu(skinTrigger); return; }
    var skinOption = t.closest('.tb-skin-option');
    if (skinOption) { applySkin(skinOption.getAttribute('data-skin')); closeSkinMenu(); return; }
    var langTrigger = t.closest('.sb-lang');
    if (langTrigger) { toggleLangMenu(langTrigger); return; }
    var langItem = t.closest('.sb-lang-item');
    if (langItem) { var loc = langItem.getAttribute('data-locale'); closeLangMenu(); if (loc) setLocale(loc); return; }
    var bellTrigger = t.closest('.m-header-bell');
    if (bellTrigger) { toggleNotifMenu(bellTrigger); return; }

    var collapseSidebarBtn = t.closest('.sb-collapse-money');
    if (collapseSidebarBtn) { var shell1 = document.querySelector('.shell'); var sbC = document.querySelector('.sidebar'); if (shell1) shell1.classList.add('collapsed'); if (sbC) sbC.classList.add('collapsed'); return; }
    var toggleSidebarBtn = t.closest('.sb-collapse-toggle');
    if (toggleSidebarBtn) {
      var shell3 = document.querySelector('.shell');
      if (shell3 && shell3.classList.contains('mobile-open')) {
        /* 手機斷點這顆鈕只會在全螢幕抽屜打開時出現(main.css 換成 X 圖示)，
           點擊改成關閉選單，不走桌機收合側欄那套邏輯。 */
        shell3.classList.remove('mobile-open');
        toggleSidebarBtn.setAttribute('aria-label', 'Collapse sidebar');
        toggleSidebarBtn.setAttribute('title', 'Collapse sidebar');
        return;
      }
      var sb3 = document.querySelector('.sidebar');
      var collapsedNow = sb3 ? sb3.classList.toggle('collapsed') : false;
      if (shell3) shell3.classList.toggle('collapsed', collapsedNow);
      var toggleLabel = collapsedNow ? 'Expand sidebar' : 'Collapse sidebar';
      toggleSidebarBtn.setAttribute('aria-label', toggleLabel);
      toggleSidebarBtn.setAttribute('title', toggleLabel);
      return;
    }

    var sectionToggleBtn = t.closest('.sb-section-toggle');
    if (sectionToggleBtn) {
      var sec = sectionToggleBtn.closest('.sb-section');
      var itemsWrap = sec ? sec.querySelector('.sb-section-items') : null;
      var nowCollapsed = sectionToggleBtn.classList.toggle('collapsed');
      sectionToggleBtn.setAttribute('aria-expanded', String(!nowCollapsed));
      if (itemsWrap) itemsWrap.style.display = nowCollapsed ? 'none' : '';
      return;
    }

    var backToTopBtn = t.closest('.footer-min-logo');
    if (backToTopBtn) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var apBackBtn = t.closest('.ap-back');
    if (apBackBtn) { location.href = apBackBtn.getAttribute('data-back-target') || 'account-overview.html'; return; }
    var outlineBackBtn = t.closest('.ap-btn-wide.outline');
    if (outlineBackBtn && outlineBackBtn.textContent.trim() === 'Back') { location.href = 'account-overview.html'; return; }

    var sectionCollapseBtn = t.closest('.section-collapse');
    if (sectionCollapseBtn) { toggleSectionCollapse(sectionCollapseBtn); return; }

    var arrowBtn = t.closest('.rail-wrap .arrow, .section-actions .arrow');
    if (arrowBtn && !arrowBtn.disabled) {
      var wrap = arrowBtn.closest('.lobby-section');
      var rail = wrap ? wrap.querySelector('.rail') : null;
      if (rail) {
        var dir = arrowBtn.getAttribute('aria-label') === 'Scroll left' ? -1 : 1;
        rail.scrollBy({ left: dir * rail.clientWidth * 0.85, behavior: 'smooth' });
      }
      return;
    }

    var seeAllLink = t.closest('.lobby-section-list .see-all');
    if (seeAllLink) {
      e.preventDefault();
      var links = Array.prototype.slice.call(document.querySelectorAll('.lobby-section-list .see-all'));
      var idx = links.indexOf(seeAllLink);
      var seeAllName = ['Slots', 'Live'][idx];
      if (seeAllName) handleCatTabClick(seeAllName);
      return;
    }

    var catTab = t.closest('.cat-tabs .cat-tab');
    if (catTab && catTabsEl) {
      var tabs = Array.prototype.slice.call(catTabsEl.querySelectorAll('.cat-tab'));
      handleCatTabClick(TAB_NAMES[tabs.indexOf(catTab)]);
      return;
    }

    var cvTab = t.closest('.cv-tab');
    if (cvTab) {
      var cvSection = cvTab.closest('.lobby-section');
      if (cvSection && cvSection._cvParams) {
        cvSection._cvState.filter = cvTab.getAttribute('data-filter');
        cvSection._cvState.visibleCount = cvSection._cvParams.pageSize || 10;
        renderCategoryView(cvSection);
      }
      return;
    }
    var loadMoreBtn = t.closest('.cv-view-all');
    if (loadMoreBtn) {
      var lmSection = loadMoreBtn.closest('.lobby-section');
      if (lmSection && lmSection._cvParams) {
        lmSection._cvState.visibleCount += (lmSection._cvParams.pageSize || 10);
        renderCategoryView(lmSection);
      }
      return;
    }

    var favBtn = t.closest('.gcard-fav');
    if (favBtn) {
      var favCard = favBtn.closest('.gcard');
      var favGame = resolveGameFromCard(favCard);
      toggleFav(favGame.id);
      var nowFav = isFav(favGame.id);
      favBtn.classList.toggle('on', nowFav);
      favBtn.setAttribute('aria-label', nowFav ? 'Remove favorite' : 'Add favorite');
      favBtn.innerHTML = gcardHeartSvg(nowFav);
      return;
    }
    var gcard = t.closest('.gcard');
    if (gcard) { openGameModal(resolveGameFromCard(gcard)); return; }

    var signinTabBtn = t.closest('#cms-modal-signin .signin-tab');
    if (signinTabBtn) { captureSignInFormValues(); SIGNIN_STATE.tab = signinTabBtn.getAttribute('data-tab'); renderSignInModal(); return; }
    var signinTabLink = t.closest('#cms-modal-signin [data-tab]');
    if (signinTabLink) { e.preventDefault(); captureSignInFormValues(); SIGNIN_STATE.tab = signinTabLink.getAttribute('data-tab'); renderSignInModal(); return; }

    // 外部點擊關閉下拉選單（放在具體 trigger 判斷之後，才不會一開就被自己關掉）
    var openMenu = document.querySelector('.tb-menu');
    if (openMenu && !t.closest('.tb-user-wrap')) closeUserMenu();
    var openSkin = document.querySelector('.tb-skin-menu');
    if (openSkin && !t.closest('.tb-skin-wrap')) closeSkinMenu();
    var openLang = document.querySelector('.sb-lang-menu');
    if (openLang && !t.closest('.sb-lang-wrap')) closeLangMenu();
    var openNotif = document.querySelector('.m-notif-menu');
    if (openNotif && !t.closest('.m-header-bell-wrap')) closeNotifMenu();

    // 其餘裝飾用 href="#"（尚未特化處理者）避免跳頁
    var hashLink = t.closest('a[href="#"]');
    if (hashLink) { e.preventDefault(); return; }
  }

  function onDocumentSubmit(e) {
    var form = e.target;
    if (!form || !form.closest || !form.closest('#cms-modal-signin')) return;
    e.preventDefault();
    var emailInp = form.querySelector('input[name="email"]');
    var userInp = form.querySelector('input[name="username"]');
    var email = emailInp ? emailInp.value : '';
    var username = userInp ? userInp.value : '';
    var name = (SIGNIN_STATE.tab === 'register' && username) ? username : ((email.split('@')[0]) || 'player');
    doLogin(name, email || 'player@100.gg');
  }

  function onDocumentKeydown(e) {
    if (e.key !== 'Escape') return;
    hideModalEl(document.getElementById('cms-modal-game'));
    hideModalEl(document.getElementById('cms-modal-signin'));
    hideModalEl(document.getElementById('cms-modal-customerservice'));
    var transientDialog = document.querySelector('.modal-bg[data-transient]');
    if (transientDialog) transientDialog.remove();
    closeUserMenu();
    closeSkinMenu();
    closeLangMenu();
    closeNotifMenu();
  }

  /* ============================================================
   * 共用小工具：頁面內一次性對話框（confirm / success / warning），
   * 與既有三個常駐 modal 不同——用完即從 DOM 移除，不重複佔位。
   * ========================================================== */
  function showDialog(bodyHtml, extraClass) {
    var bg = document.createElement('div');
    bg.className = 'modal-bg' + (extraClass ? ' ' + extraClass : '');
    bg.setAttribute('data-transient', '1');
    bg.innerHTML = bodyHtml;
    document.body.appendChild(bg);
    applyI18n(bg);
    return bg;
  }
  function resultDialogHTML(type, title, message, extraBtnHtml) {
    var warn = type !== 'success';
    var icon = warn
      ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v6M12 17h.01"/></svg>'
      : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';
    return '<div class="pi-success" data-dialog-panel>' +
        '<div class="pi-success-check' + (warn ? ' warn' : '') + '">' + icon + '</div>' +
        '<div class="pi-success-title">' + escapeHtml(title) + '</div>' +
        (message ? '<div class="pi-success-sub">' + escapeHtml(message) + '</div>' : '') +
        '<button type="button" class="ap-btn-wide ap-grad" data-dialog-close>' + (warn ? 'Got It' : 'Continue') + '</button>' +
        (extraBtnHtml || '') +
      '</div>';
  }

  /* ============================================================
   * Sidebar：選單分組收合(sb-section-toggle) / 語言選單(sb-lang，
   * 目前僅中文一種語系，誠實呈現單一已選項，不捏造多語系資料)
   * ========================================================== */
  function renderLangMenu(menu) {
    menu.className = 'sb-lang-menu';
    menu.setAttribute('role', 'listbox');
    var langs = I18N.LANGS || { zh: { label: '中文' } };
    menu.innerHTML = visibleLocaleKeys(Object.keys(langs)).map(function (key) {
      var active = key === LOCALE;
      return '<button type="button" class="sb-lang-item' + (active ? ' active' : '') + '"' +
        ' role="option" aria-selected="' + (active ? 'true' : 'false') + '" data-locale="' + key + '">' +
        '<span class="sb-flag" aria-hidden="true">' + (LANG_FLAGS[key] || '') + '</span><span>' + escapeHtml(langs[key].label) + '</span>' +
        (active ? CHECK_ICON : '') + '</button>';
    }).join('');
  }
  function closeLangMenu() { var m = document.querySelector('.sb-lang-menu'); if (m) m.remove(); }
  function toggleLangMenu(trigger) {
    var wrap = trigger.closest('.sb-lang-wrap');
    if (!wrap) return;
    var existing = wrap.querySelector('.sb-lang-menu');
    if (existing) { closeLangMenu(); return; }
    closeUserMenu(); closeSkinMenu(); closeNotifMenu();
    var menu = document.createElement('div');
    wrap.appendChild(menu);
    renderLangMenu(menu);
  }

  /* ============================================================
   * Account Overview：暱稱編輯 / 餘額 refresh 動畫 / 銀行卡輪播＋刪除確認 /
   * 快速動作導覽（3 張銀行卡為固定展示資料，delete 確認框沿用既有樣板）
   * ========================================================== */
  /* 帳戶總覽 ↔ 提款頁 共用同一份帳戶資料源（localStorage-backed，跨頁持久化） */
  var ACCOUNT_STORE_KEY = 'cms-v3:accounts';
  function defaultAccountStore() {
    return {
      banks: [
        { bank: 'KB Bank', number: '********1234', date: '2025-01-08 21:22:25' },
        { bank: 'Shinhan Bank', number: '********5678', date: '2025-01-08 21:22:25' },
        { bank: 'Woori Bank', number: '********9012', date: '2025-01-08 21:22:25' }
      ],
      cryptos: [
        { type: 'USDT TRC20', address: 'TXk9Ym...0tUw', date: '2025-01-08 21:22:25' }
      ]
    };
  }
  function loadAccountStore() {
    try {
      var raw = localStorage.getItem(ACCOUNT_STORE_KEY);
      if (raw) { var p = JSON.parse(raw); if (p && Array.isArray(p.banks) && Array.isArray(p.cryptos)) return p; }
    } catch (e) {}
    return defaultAccountStore();
  }
  function saveAccountStore(s) {
    try { localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function bankInitials(name) {
    return String(name || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'BK';
  }
  function initAccountOverviewPage() {
    var gridPanels = document.querySelectorAll('.ap-grid > .ap-panel');
    var panel = gridPanels[0] || null;         // Banking Details
    var cryptoPanel = gridPanels[1] || null;   // Crypto Wallet
    if (!panel) return;
    var store = loadAccountStore();
    var banks = store.banks;
    var cryptos = store.cryptos;
    var bankIdx = 0;

    function renderBanks() {
      var countEl = panel.querySelector('.ap-bank-count');
      var rows = panel.querySelectorAll('.ap-bank-row');
      if (!banks.length) {
        if (rows[0]) rows[0].outerHTML = '<div class="ap-bank-empty">No bank accounts yet.</div>';
        var navEl = panel.querySelector('.ap-bank-nav'); if (navEl) navEl.style.display = 'none';
        return;
      }
      var b = banks[bankIdx];
      if (countEl) countEl.textContent = (bankIdx + 1) + '/' + banks.length;
      if (rows[0]) { var numEl = rows[0].querySelector('.ap-bank-num'); if (numEl) numEl.textContent = '**** **** **** ' + String(b.number).slice(-4); }
      if (rows[1]) { var nameEl = rows[1].querySelector('span'); if (nameEl) nameEl.textContent = b.bank; }
    }
    function openDeleteConfirm() {
      var b = banks[bankIdx];
      if (!b) return;
      var dlg = showDialog(
        '<div class="confirm-dialog" data-dialog-panel>' +
          '<div class="confirm-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg></div>' +
          '<div class="confirm-title">Delete Account?</div>' +
          '<div class="confirm-sub">Are you sure you want to remove <strong>' + escapeHtml(b.bank) + '</strong>? This action cannot be undone.</div>' +
          '<div class="confirm-actions">' +
            '<button type="button" class="ap-btn-wide outline" data-dialog-close>Cancel</button>' +
            '<button type="button" class="ap-btn-wide confirm-del-btn" data-action="confirm-delete-bank">Delete</button>' +
          '</div>' +
        '</div>'
      );
      var delConfirmBtn = dlg.querySelector('[data-action="confirm-delete-bank"]');
      if (delConfirmBtn) delConfirmBtn.addEventListener('click', function () {
        banks.splice(bankIdx, 1);
        bankIdx = Math.max(0, bankIdx - 1);
        saveAccountStore(store);
        renderBanks();
        dlg.remove();
      });
    }

    var arrows = panel.querySelectorAll('.ap-bank-arrow');
    if (arrows[0]) arrows[0].addEventListener('click', function () { bankIdx = (bankIdx - 1 + banks.length) % banks.length; renderBanks(); });
    if (arrows[1]) arrows[1].addEventListener('click', function () { bankIdx = (bankIdx + 1) % banks.length; renderBanks(); });
    var delBtn = panel.querySelector('.ap-bank-del');
    if (delBtn) delBtn.addEventListener('click', openDeleteConfirm);

    var pencilBtn = document.querySelector('.ap-pencil');
    if (pencilBtn) pencilBtn.addEventListener('click', function () {
      var nickWrap = pencilBtn.closest('.ap-hero-nick');
      var nickEl = nickWrap ? nickWrap.querySelector('span:not(.muted)') : null;
      var cur = nickEl ? nickEl.textContent.trim() : '';
      var next = window.prompt('Nickname', cur);
      if (next && next.trim() && nickEl) nickEl.textContent = next.trim();
    });
    var refreshBtn = document.querySelector('.ap-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', function () {
      refreshBtn.classList.add('spinning');
      setTimeout(function () { refreshBtn.classList.remove('spinning'); }, 700);
    });

    function renderCrypto() {
      if (!cryptoPanel) return;
      var cRows = cryptoPanel.querySelectorAll('.ap-bank-row');
      var delc = cryptoPanel.querySelector('.ap-bank-del');
      var c = cryptos[0];
      if (!c) {
        if (cRows[0]) { var t0 = cRows[0].querySelector('.ap-bank-num'); if (t0) t0.textContent = 'No crypto wallet'; }
        if (cRows[1]) cRows[1].style.display = 'none';
        if (delc) delc.style.display = 'none';
        return;
      }
      if (cRows[1]) cRows[1].style.display = '';
      if (delc) delc.style.display = '';
      if (cRows[0]) { var tE = cRows[0].querySelector('.ap-bank-num'); if (tE) tE.textContent = c.type; }
      if (cRows[1]) { var aE = cRows[1].querySelector('span'); if (aE) aE.textContent = c.address; }
    }
    var cryptoDel = cryptoPanel ? cryptoPanel.querySelector('.ap-bank-del') : null;
    if (cryptoDel) cryptoDel.addEventListener('click', function () {
      var c = cryptos[0]; if (!c) return;
      var dlg = showDialog(
        '<div class="confirm-dialog" data-dialog-panel>' +
          '<div class="confirm-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg></div>' +
          '<div class="confirm-title">Delete Wallet?</div>' +
          '<div class="confirm-sub">Are you sure you want to remove <strong>' + escapeHtml(c.type) + '</strong>? This action cannot be undone.</div>' +
          '<div class="confirm-actions">' +
            '<button type="button" class="ap-btn-wide outline" data-dialog-close>Cancel</button>' +
            '<button type="button" class="ap-btn-wide confirm-del-btn" data-action="confirm-delete-crypto">Delete</button>' +
          '</div>' +
        '</div>'
      );
      var okc = dlg.querySelector('[data-action="confirm-delete-crypto"]');
      if (okc) okc.addEventListener('click', function () { cryptos.splice(0, 1); saveAccountStore(store); renderCrypto(); dlg.remove(); });
    });
    var cryptoCopy = cryptoPanel ? cryptoPanel.querySelector('.ap-bank-copy') : null;
    if (cryptoCopy) cryptoCopy.addEventListener('click', function () {
      var c = cryptos[0]; if (!c) return;
      try { navigator.clipboard.writeText(c.address); } catch (e) {}
      var original = cryptoCopy.innerHTML;
      cryptoCopy.innerHTML = CHECK_ICON;
      cryptoCopy.setAttribute('aria-label', 'Copied');
      setTimeout(function () {
        cryptoCopy.innerHTML = original;
        cryptoCopy.setAttribute('aria-label', 'Copy address');
      }, 1500);
    });

    renderBanks();
    renderCrypto();

    var addLinks = document.querySelectorAll('.ap-add-bank');
    Array.prototype.forEach.call(addLinks, function (lnk) {
      var isCrypto = !!(cryptoPanel && cryptoPanel.contains(lnk));
      lnk.addEventListener('click', function (e) {
        e.preventDefault();
        location.href = 'withdrawal.html?tab=manage&method=' + (isCrypto ? 'crypto' : 'bank');
      });
    });
    var quickDeposit = document.querySelector('.ap-quick-panel .ap-btn-wide.ap-grad');
    if (quickDeposit) quickDeposit.addEventListener('click', function () { location.href = 'deposit.html'; });
    var quickWithdraw = document.querySelector('.ap-quick-panel .ap-btn-wide.outline');
    if (quickWithdraw) quickWithdraw.addEventListener('click', function () { location.href = 'withdrawal.html'; });
    var viewMoreLink = document.querySelector('.ap-view-more');
    if (viewMoreLink) viewMoreLink.addEventListener('click', function (e) { e.preventDefault(); location.href = 'account-record.html'; });
  }

  /* ============================================================
   * Security Center：sc-item 導覽 + 密碼變更彈窗（沿用 signin modal 的
   * .modal.sm/.field 結構與 showDialog/resultDialogHTML 結果對話框，
   * 無實際存檔動作，僅本地驗證欄位後顯示成功訊息）
   * ========================================================== */
  function changePasswordDialogHTML(title) {
    return '<div class="modal sm"><div class="modal-head">' +
        '<div style="font-family: var(--font-display); font-weight: 700; font-size: 17px;">' + escapeHtml(title) + '</div>' +
        '<button class="modal-close"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg></button>' +
      '</div><div class="modal-body"><form data-cp-form>' +
        '<div class="field"><label>Current Password</label><input type="password" data-cp-field="current" placeholder="••••••••"></div>' +
        '<div class="field"><label>New Password</label><input type="password" data-cp-field="new" placeholder="••••••••"></div>' +
        '<div class="field"><label>Confirm New Password</label><input type="password" data-cp-field="confirm" placeholder="••••••••"></div>' +
        '<button type="submit" class="btn primary" style="width: 100%; padding: 12px; margin-top: 6px;">Confirm</button>' +
      '</form></div></div>';
  }
  function openChangePasswordDialog(kind, title) {
    var bg = showDialog(changePasswordDialogHTML(title));
    var form = bg.querySelector('[data-cp-form]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var current = form.querySelector('[data-cp-field="current"]').value.trim();
      var pw1 = form.querySelector('[data-cp-field="new"]').value.trim();
      var pw2 = form.querySelector('[data-cp-field="confirm"]').value.trim();
      if (!current || !pw1 || !pw2) { showDialog(resultDialogHTML('warning', 'Notice', 'Please complete all fields.')); return; }
      if (pw1 !== pw2) { showDialog(resultDialogHTML('warning', 'Notice', 'New password and confirmation do not match.')); return; }
      bg.remove();
      var msg = kind === 'transaction' ? 'Transaction password updated successfully.' : 'Login password updated successfully.';
      showDialog(resultDialogHTML('success', 'Success!', msg));
    });
  }
  function initSecurityCenterPage() {
    var items = document.querySelectorAll('.sc-item');
    if (!items.length) return;
    var GO_MAP = { 'Personal Info': 'personal-info.html', 'Banking Details': 'withdrawal.html' };
    var PW_KIND = { 'Change Login Password': 'login', 'Change Transaction Password': 'transaction' };
    Array.prototype.forEach.call(items, function (btn) {
      var nameEl = btn.querySelector('.sc-item-name');
      var name = nameEl ? nameEl.textContent.trim() : '';
      if (name === 'Logout') { btn.addEventListener('click', doLogout); return; }
      var target = GO_MAP[name];
      if (target) { btn.addEventListener('click', function () { location.href = target; }); return; }
      var kind = PW_KIND[name];
      if (kind) btn.addEventListener('click', function () { openChangePasswordDialog(kind, name); });
    });
  }

  /* ============================================================
   * Personal Info：Submit -> success 對話框（無實際存檔動作，僅顯示成功訊息）
   * ========================================================== */
  function initPersonalInfoPage() {
    var card = document.querySelector('.pi-card');
    if (!card) return;
    var submitBtn = card.querySelector('.ap-btn-wide.ap-grad');
    if (!submitBtn) return;
    submitBtn.addEventListener('click', function () {
      showDialog(resultDialogHTML('success', 'Success!', 'Profile updated successfully.'));
    });
  }

  /* ============================================================
   * Record 系列頁面（5 頁共用同一套渲染邏輯）：
   *  - 狀態篩選：純 DOM 顯示/隱藏（所有列本來就已完整渲染在畫面上，
   *    只是篩選同一份固定資料，無需另外複製資料）
   *  - 日期欄位點擊喚出原生日期選擇器
   *  - 自動刷新倒數（Deposit/Withdrawal/Profit and Loss 三種類型才有）
   *  - rec-confirm 按鈕未接任何動作（日期範圍從未真的套用到 rows 篩選），
   *    維持現狀，不捏造篩選邏輯
   * ========================================================== */
  function initRecordPage() {
    var table = document.querySelector('.rec-table');
    if (!table) return;

    var statusBtn = document.querySelector('.rec-status-btn');
    if (statusBtn) {
      var wrap = statusBtn.closest('.rec-status-wrap');
      var closeStatusMenu = function () { var m = wrap.querySelector('.rec-status-menu'); if (m) m.remove(); };
      var applyStatusFilter = function (val) {
        Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (tr) {
          if (val === 'All') { tr.style.display = ''; return; }
          var pill = tr.querySelector('.rec-pill');
          tr.style.display = (pill && pill.textContent.trim() === val) ? '' : 'none';
        });
        statusBtn.textContent = 'Status : ' + val;
        applyI18n(statusBtn);
      };
      statusBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var existing = wrap.querySelector('.rec-status-menu');
        if (existing) { closeStatusMenu(); return; }
        var menu = document.createElement('div');
        menu.className = 'rec-status-menu';
        menu.innerHTML = ['All', 'Pending', 'Approved', 'Rejected'].map(function (s) {
          return '<button type="button" class="rec-status-opt" data-status="' + s + '">' + s + '</button>';
        }).join('');
        wrap.appendChild(menu);
        applyI18n(menu);
        menu.addEventListener('click', function (e2) {
          var opt = e2.target.closest('.rec-status-opt');
          if (!opt) return;
          applyStatusFilter(opt.getAttribute('data-status'));
          closeStatusMenu();
        });
      });
      document.addEventListener('click', function (e) { if (!e.target.closest('.rec-status-wrap')) closeStatusMenu(); });
    }

    Array.prototype.forEach.call(document.querySelectorAll('.rec-date-cell'), function (cell) {
      cell.addEventListener('click', function () {
        var inp = cell.querySelector('input');
        if (!inp) return;
        try { inp.showPicker(); } catch (e) { inp.focus(); }
      });
    });

    var refreshBtn = document.querySelector('.rec-refresh-btn');
    if (refreshBtn) {
      var secEl = refreshBtn.parentElement ? refreshBtn.parentElement.querySelector('strong') : null;
      var secs = secEl ? (parseInt(secEl.textContent, 10) || 20) : 20;
      setInterval(function () {
        secs = secs <= 1 ? 20 : secs - 1;
        if (secEl) secEl.textContent = String(secs);
      }, 1000);
      refreshBtn.addEventListener('click', function () { secs = 20; if (secEl) secEl.textContent = String(secs); });
    }

    /* 體育串關展開列（目前只有 betting-record.html 有 .rec-row-parlay，
       其餘 4 個 record 頁面 querySelectorAll 拿到空集合，安全跳過）。 */
    Array.prototype.forEach.call(table.querySelectorAll('.rec-expand-btn'), function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.rec-row-parlay');
        var detail = row && row.nextElementSibling;
        if (!detail || !detail.classList.contains('rec-parlay-detail')) return;
        var open = row.classList.toggle('open');
        detail.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ============================================================
   * Support 頁：9 個分頁 + FAQ 手風琴 + Exclusion turnover list 篩選。
   * 內容為既有 SUP_CONTENT / EXCLUSION / FAQ_GROUPS 純文字資料，非新增資料模型。
   * ========================================================== */
  var SUP_CONTENT = {
    Support: [{ panel: 'Please contact our Customer Center.', body: [] }],
    Notice: [
      { panel: 'Urgent Notice — 100% Official Telegram Change.', body: [
        { p: 'Impersonators pretending to be 100% are increasing.' },
        { p: '100% provides guidance through only one official Telegram. If there is any problem with the existing Telegram, we will only provide guidance through this channel or live chat.' },
        { p: '100% Official Telegram notice room: https://t.me/100kor' },
        { p: 'If you cannot reach us through the existing Telegram, please verify through live chat that it is not an impersonator before proceeding with your inquiry.' }
      ]},
      { panel: 'How to inquire about deposit accounts', body: [
        { p: 'For deposit account inquiries, please contact us via live chat or the Customer Center Telegram after signing up.' }
      ]}
    ],
    About: [{ panel: 'About 100%', body: [
      { p: '100% is legally registered as a sportsbook, online betting, and casino operator, and holds a license issued by the relevant authorities.' },
      { p: '100% provides the best products and services to users around the world and has established itself as one of the most popular sites.' }
    ]}],
    Privacy: [
      { panel: 'Privacy Policy', body: [
        { p: 'This policy describes how the information and data you provide to 100% are used between 100% and the customer.' },
        { p: 'By submitting your information and using the site, you consent to the use of your information in accordance with this Privacy Policy.' }
      ]},
      { panel: 'Information Collection & Use', body: [
        { p: 'We collect, use, and dispose of information and data about you, including the following:' },
        { ol: ['All information you create and submit by email or on the website;', 'Transaction history related to the website;', 'Details of your site visits, such as traffic data and location data.'] }
      ]}
    ],
    Info: [{ panel: 'Additional Notes', body: [
      { p: '100% is not responsible for the content or accuracy of internal or external websites.' },
      { p: 'All information provided by the company is based on fact. The company reserves the right to correct obvious errors.' }
    ]}],
    Addiction: [
      { panel: 'Preventing Gaming Addiction', body: [
        { p: '100% encourages members to enjoy gaming while also preventing gaming addiction.' },
        { ul: ['Self-assessment', 'Betting management', 'Deposit limit management', 'Child protection', 'Help & suggestions'] }
      ]},
      { panel: 'Deposit Limit Management', body: [
        { p: 'If you wish to change or lower your deposit limit, please contact a customer agent via live chat.' }
      ]},
      { panel: 'Help & Suggestions', body: [
        { p: 'GamCare — 0808 8020 133 (free call in the UK) or www.gamcare.org.uk' },
        { p: 'GambleAware — www.gambleaware.org' },
        { p: 'Gamblers Anonymous — www.gamblersanonymous.org' }
      ]}
    ],
    Rules: [
      { panel: 'Rules & Regulations', body: [
        { p: 'We at 100% strictly penalize members who sign up with the intent to use the site through abnormal methods. If a member is deemed to be in violation of the stated rules, 100% has the right to confiscate the member’s account without prior warning.' }
      ]},
      { panel: 'Deposit & Withdrawal', body: [
        { ul: [
          'If you deposit to the wrong account without confirming beforehand, 100% accepts no responsibility for that amount.',
          'Deposit and withdrawal requests can only be made with account information registered under your own name.',
          'To prevent illegal money laundering and financial fraud, the full deposit amount must be wagered before withdrawal is possible.'
        ]}
      ]}
    ]
  };
  var SUP_EXCLUSION = [
    { name: 'Sicbo', type: 'Slot', vendor: 'AG', pct: '100%' },
    { name: 'Ema Black Jack D21', type: 'Live', vendor: 'AG', pct: '100%' },
    { name: '1000 Diamond Bet Roulette', type: 'Slot', vendor: 'PT', pct: '100%' },
    { name: 'Lightning Roulette', type: 'Live', vendor: 'EVO', pct: '100%' },
    { name: 'Crazy Time', type: 'Live', vendor: 'EVO', pct: '100%' },
    { name: 'Sweet Bonanza', type: 'Slot', vendor: 'PP', pct: '50%' }
  ];
  var SUP_FAQ_GROUPS = [
    { title: 'General Information', faqs: [
      { q: 'About 100%', a: '100% is an overseas betting site that provides trusted and verified games. From sports, slot games, live casinos to mini games.' },
      { q: 'Are the games provided on the site fair?', a: '100% is a legally registered company, and game results are absolutely fair, just, and based on facts.' },
      { q: 'Is my personal information safe?', a: 'All personal data is encrypted in transit and at rest. We never share your information with third parties without consent.' }
    ]},
    { title: 'Account Management', faqs: [
      { q: 'How do I change my password?', a: 'Go to Security Center from your account menu, enter your current password and your new password twice, then confirm.' },
      { q: 'I lost my password, how can I get it reissued?', a: 'Click "Forgot?" on the login window, enter your username and registered email, and we will send password reset instructions.' }
    ]}
  ];
  function supPanelHTML(blocks) {
    return blocks.map(function (block) {
      var bodyHtml = '';
      if (block.body && block.body.length) {
        bodyHtml = '<div class="sup-panel-body">' + block.body.map(function (blk) {
          if (blk.p) return '<p class="sup-p">' + escapeHtml(blk.p).replace(/\n/g, '<br>') + '</p>';
          if (blk.ul) return '<ul class="sup-ul">' + blk.ul.map(function (li) { return '<li>' + escapeHtml(li) + '</li>'; }).join('') + '</ul>';
          if (blk.ol) return '<ol class="sup-ol">' + blk.ol.map(function (li) { return '<li>' + escapeHtml(li) + '</li>'; }).join('') + '</ol>';
          return '';
        }).join('') + '</div>';
      }
      return '<div class="sup-panel"><div class="sup-panel-h">' + escapeHtml(block.panel) + '</div>' + bodyHtml + '</div>';
    }).join('');
  }
  function supFaqHTML(openMap) {
    return SUP_FAQ_GROUPS.map(function (g, gi) {
      var items = g.faqs.map(function (f, fi) {
        var key = gi + '-' + fi;
        var open = !!openMap[key];
        return '<div class="sup-faq' + (open ? ' open' : '') + '" data-faq-key="' + key + '">' +
            '<button type="button" class="sup-faq-q"><span>' + escapeHtml(f.q) + '</span>' +
              '<svg class="sup-faq-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
            '</button>' +
            (open ? '<div class="sup-faq-a">' + escapeHtml(f.a) + '</div>' : '') +
          '</div>';
      }).join('');
      return '<div class="sup-group"><h2 class="sup-group-title">' + escapeHtml(g.title) + '</h2><div class="sup-faq-list">' + items + '</div></div>';
    }).join('');
  }
  function supExclusionListHTML(filter, query) {
    var list = SUP_EXCLUSION.filter(function (e) {
      return (filter === 'All' || e.type === filter) && e.name.toLowerCase().indexOf((query || '').toLowerCase()) !== -1;
    });
    if (!list.length) return '<div class="sup-panel"><div class="sup-panel-body"><p class="sup-p">No results.</p></div></div>';
    return list.map(function (e) {
      return '<div class="sup-panel"><div class="sup-panel-h">' + escapeHtml(e.name) + '</div><div class="sup-panel-body"><ul class="sup-ul">' +
        '<li><span>Game type:</span> ' + escapeHtml(e.type) + '</li><li><span>Game Vendor:</span> ' + escapeHtml(e.vendor) + '</li><li><span>Exclusion Percentage:</span> ' + escapeHtml(e.pct) + '</li>' +
      '</ul></div></div>';
    }).join('');
  }
  function supExclusionHTML(filter, query) {
    var types = ['All'];
    SUP_EXCLUSION.forEach(function (e) { if (types.indexOf(e.type) === -1) types.push(e.type); });
    return '<div class="sup-ex">' +
        '<div class="sup-ex-filters">' +
          '<select class="sup-ex-select">' + types.map(function (t) { return '<option' + (t === filter ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' +
          '<div class="sup-ex-search"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>' +
            '<input class="sup-ex-query" placeholder="Game Name" value="' + escapeAttr(query || '') + '"></div>' +
        '</div>' +
        '<div class="sup-ex-list">' + supExclusionListHTML(filter, query) + '</div>' +
      '</div>';
  }
  function initSupportPage() {
    var tabsWrap = document.querySelector('.sup-tabs');
    if (!tabsWrap) return;
    /* 分頁身分以固定英文鍵（依鈕位置）判定，不用 textContent——換語系後
       鈕文字會被 i18n 換成中文，用文字比對會查不到 SUP_CONTENT 而整頁空白。 */
    var SUP_TAB_KEYS = ['Support', 'Notice', 'About', 'Privacy', 'Info', 'Addiction', 'Rules', 'Exclusion turnover list', 'FAQ'];
    var supTabBtns = Array.prototype.slice.call(tabsWrap.querySelectorAll('.sup-tab'));
    var openMap = { '0-0': true, '0-1': true };
    var exState = { filter: 'All', query: '' };

    function renderTab(tab) {
      supTabBtns.forEach(function (b, i) {
        b.classList.toggle('active', SUP_TAB_KEYS[i] === tab);
      });
      var node = tabsWrap.nextElementSibling;
      while (node) { var next = node.nextElementSibling; node.remove(); node = next; }
      var html;
      if (tab === 'FAQ') html = supFaqHTML(openMap);
      else if (tab === 'Exclusion turnover list') html = supExclusionHTML(exState.filter, exState.query);
      else html = supPanelHTML(SUP_CONTENT[tab] || []);
      tabsWrap.insertAdjacentHTML('afterend', html);
      applyI18n(tabsWrap.parentElement);
    }

    tabsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.sup-tab');
      if (!btn) return;
      renderTab(SUP_TAB_KEYS[supTabBtns.indexOf(btn)]);
    });
    document.addEventListener('click', function (e) {
      var faqQ = e.target.closest('.sup-faq-q');
      if (!faqQ) return;
      var faqEl = faqQ.closest('[data-faq-key]');
      if (!faqEl) return;
      var key = faqEl.getAttribute('data-faq-key');
      openMap[key] = !openMap[key];
      renderTab('FAQ');
    });
    document.addEventListener('change', function (e) {
      if (e.target.classList && e.target.classList.contains('sup-ex-select')) {
        exState.filter = e.target.value;
        renderTab('Exclusion turnover list');
      }
    });
    document.addEventListener('input', function (e) {
      if (e.target.classList && e.target.classList.contains('sup-ex-query')) {
        exState.query = e.target.value;
        var listWrap = document.querySelector('.sup-ex-list');
        if (listWrap) { listWrap.innerHTML = supExclusionListHTML(exState.filter, exState.query); applyI18n(listWrap); }
      }
    });

    renderTab('FAQ');
  }

  /* ============================================================
   * Sports 頁：分頁篩選(cv-tab)＋載入更多，比賽資料/演算法為既有
   * baseMatches 常數 + provider 演算法，供應商清單沿用既有
   * CMS_DATA.PROVIDERS，不新增資料模型。sport-odd 按鈕未接任何點擊
   * （純展示賠率），維持現狀。
   * ========================================================== */
  var SPORTS_BASE_MATCHES = [
    { league: 'Champions League', home: 'Real Madrid', away: 'Bayern', start: 'Today · 20:00', odds: ['1.85', '3.40', '4.20'], score: '1 - 0' },
    { league: 'Premier League', home: 'Arsenal', away: 'Man City', start: 'Today · 22:30', odds: ['2.95', '3.20', '2.40'] },
    { league: 'NBA', home: 'Lakers', away: 'Celtics', start: 'Tomorrow · 03:30', odds: ['1.65', '—', '2.25'] },
    { league: 'La Liga', home: 'Barcelona', away: 'Atletico', start: 'Sat · 21:00', odds: ['1.55', '4.10', '5.60'] },
    { league: 'Serie A', home: 'Inter', away: 'Juventus', start: 'Sun · 19:45', odds: ['2.10', '3.30', '3.60'] },
    { league: 'NFL', home: 'Chiefs', away: 'Eagles', start: 'Sun · 23:00', odds: ['1.90', '—', '1.95'] }
  ];
  function buildSportsMatches() {
    var all = [];
    PROVIDERS.forEach(function (provider, providerIndex) {
      [0, 1].forEach(function (variant) {
        var template = SPORTS_BASE_MATCHES[(providerIndex + variant * 3) % SPORTS_BASE_MATCHES.length];
        var live = variant === 0 && providerIndex % 5 === 0;
        var odds = template.odds.map(function (odd, oddIndex) {
          if (odd === '—') return odd;
          return (+odd + providerIndex * 0.03 + variant * 0.08 + oddIndex * 0.02).toFixed(2);
        });
        all.push({
          league: template.league, home: template.home, away: template.away, start: template.start,
          provider: provider, live: live,
          min: (34 + providerIndex) + "'",
          score: template.score || ((providerIndex % 3) + ' - ' + ((providerIndex + 1) % 3)),
          odds: odds
        });
      });
    });
    return all;
  }
  function sportCardHTML(m) {
    var scoreHtml = m.live ? '<div class="sport-score">' + escapeHtml(m.score) + '</div>' : '';
    var headRight = m.live
      ? '<span class="sport-live"><span class="dot"></span>LIVE ' + escapeHtml(m.min) + '</span>'
      : '<span class="sport-time">' + escapeHtml(m.start) + '</span>';
    return '<article class="sport-card' + (m.live ? ' live' : '') + '">' +
        '<div class="sport-head"><span class="sport-league">' + escapeHtml(m.league) + '</span>' + headRight + '</div>' +
        '<div class="sport-teams">' +
          '<div class="sport-team"><div class="sport-team-logo" style="--logo-hue:200">' + escapeHtml(m.home.slice(0, 2).toUpperCase()) + '</div><span>' + escapeHtml(m.home) + '</span></div>' +
          scoreHtml +
          '<div class="sport-team"><span>' + escapeHtml(m.away) + '</span><div class="sport-team-logo" style="--logo-hue:340">' + escapeHtml(m.away.slice(0, 2).toUpperCase()) + '</div></div>' +
        '</div>' +
        '<div class="sport-odds">' +
          '<button type="button" class="sport-odd"><span>1</span><strong>' + escapeHtml(m.odds[0]) + '</strong></button>' +
          '<button type="button" class="sport-odd"' + (m.odds[1] === '—' ? ' disabled' : '') + '><span>X</span><strong>' + escapeHtml(m.odds[1]) + '</strong></button>' +
          '<button type="button" class="sport-odd"><span>2</span><strong>' + escapeHtml(m.odds[2]) + '</strong></button>' +
        '</div>' +
      '</article>';
  }
  function initSportsPage() {
    var tabsWrap = document.querySelector('.sports-grid') ? document.querySelector('.cv-tabs') : null;
    var grid = document.querySelector('.sports-grid');
    if (!tabsWrap || !grid) return;
    var foot = grid.nextElementSibling && grid.nextElementSibling.classList.contains('cv-foot') ? grid.nextElementSibling : null;
    var allMatches = buildSportsMatches();
    var state = { filter: 'All', visibleCount: 8 };

    function render() {
      var filtered = state.filter === 'All' ? allMatches : allMatches.filter(function (m) { return m.provider === state.filter; });
      var shown = filtered.slice(0, state.visibleCount);
      grid.innerHTML = shown.map(sportCardHTML).join('');
      if (foot) foot.style.display = shown.length < filtered.length ? '' : 'none';
      var countEl = document.querySelector('.section-title .count');
      if (countEl) countEl.textContent = filtered.length;
    }

    tabsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.cv-tab');
      if (!btn) return;
      Array.prototype.forEach.call(tabsWrap.querySelectorAll('.cv-tab'), function (b) { b.classList.toggle('active', b === btn); });
      state.filter = btn.textContent.trim();
      state.visibleCount = 8;
      render();
    });
    if (foot) {
      var loadMoreBtn = foot.querySelector('.cv-view-all');
      if (loadMoreBtn) loadMoreBtn.addEventListener('click', function () { state.visibleCount += 4; render(); });
    }
    render();
  }

  /* ============================================================
   * 優惠卡片（index.html 首頁 4 張 + promotion.html 載入更多剩餘 2 張）：
   * 既有 PROMOTION_OFFERS（4 筆，逐字保留，未新增/未省略），點擊導向 promotion-detail.html（依 data-promo-id
   * 帶 ?id= 深連結），該頁的行動按鈕才導向各自 actionTarget 對照的真實
   * 頁面；promotion.html 缺少的第 3、4 張卡片 markup 逐字取自 index.html
   * 已渲染的同一組資料，非新增視覺／資料。
   * ========================================================== */
  var PROMOTION_ACTION_TARGETS = {
    'first-deposit': 'deposit.html',
    'daily-reload': 'deposit.html',
    'refer-and-earn': 'account-overview.html',
    'vip-cashback': 'account-overview.html'
  };
  var PROMOTION_ART = {
    'first-deposit': 'assets/mock/promo-1-v2.jpg',
    'daily-reload': 'assets/mock/promo-2-v2.jpg',
    'refer-and-earn': 'assets/mock/promo-3-v2.jpg',
    'vip-cashback': 'assets/mock/promo-4-v2.jpg'
  };
  var PROMOTION_EXTRA_CARDS_HTML = [
    '<button class="promo-card promo-card-link" type="button" data-promo-id="refer-and-earn" aria-label="查看 推薦好友賺 25%" style="--promo-hue: var(--accent);"><span class="promo-card-tag" data-i18n="PROMOTION_COPY.refer-and-earn.tag">推薦</span><div class="promo-card-art" aria-hidden="true" style="background-image: url(&quot;assets/mock/promo-3-v2.jpg&quot;);"></div><h3 class="promo-card-title" data-i18n="PROMOTION_COPY.refer-and-earn.title">推薦好友賺 25%</h3><p class="promo-card-sub" data-i18n="PROMOTION_COPY.refer-and-earn.sub">邀請好友後可獲得長期佣金。</p><span class="promo-card-cta" data-i18n="PROMOTION_COPY.first-deposit.cta" data-i18n-suffix=" →">查看 →</span></button>',
    '<button class="promo-card promo-card-link" type="button" data-promo-id="vip-cashback" aria-label="查看 最高 20% 返水" style="--promo-hue: var(--accent);"><span class="promo-card-tag" data-i18n="PROMOTION_COPY.vip-cashback.tag">VIP</span><div class="promo-card-art" aria-hidden="true" style="background-image: url(&quot;assets/mock/promo-4-v2.jpg&quot;);"></div><h3 class="promo-card-title" data-i18n="PROMOTION_COPY.vip-cashback.title">最高 20% 返水</h3><p class="promo-card-sub" data-i18n="PROMOTION_COPY.vip-cashback.sub">每週依 VIP 等級返水，無上限。</p><span class="promo-card-cta" data-i18n="PROMOTION_COPY.first-deposit.cta" data-i18n-suffix=" →">查看 →</span></button>'
  ];
  function initPromotionCards() {
    var grid = document.querySelector('.promo-grid');
    if (!grid) return;
    var cards = grid.querySelectorAll('.promo-card.promo-card-link');
    if (!cards.length) return;

    function bindCard(card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-promo-id');
        location.href = id ? ('promotion-detail.html?id=' + encodeURIComponent(id)) : 'promotion.html';
      });
    }
    Array.prototype.forEach.call(cards, bindCard);

    var foot = grid.nextElementSibling;
    var loadMoreBtn = (foot && foot.classList.contains('cv-foot')) ? foot.querySelector('.cv-view-all') : null;
    if (loadMoreBtn && cards.length < 4) {
      loadMoreBtn.addEventListener('click', function () {
        PROMOTION_EXTRA_CARDS_HTML.forEach(function (html) {
          grid.insertAdjacentHTML('beforeend', html);
          bindCard(grid.lastElementChild);
        });
        applyI18n(grid);
        foot.style.display = 'none';
      });
    }
  }

  /* ============================================================
   * 促銷內容頁（promotion-detail.html?id=<PROMOTION_COPY key>）：
   * PROMOTION_COPY 本來就有 reward/eligibility/validity/description/
   * highlights/steps/terms/actionLabel 完整欄位、t.lobby.promotionDetail.*
   * 也已有對應標籤翻譯（四語系皆備），只是先前從未有頁面把它們渲染出來
   * （personal-info.html 的 Back 鈕還借用著 promotionDetail.back 這個
   * key）。本函式把既有資料接上畫面，非新增文案。
   * ========================================================== */
  function initPromotionDetail() {
    var root = document.getElementById('promo-detail-root');
    if (!root) return;
    var id = new URLSearchParams(location.search).get('id');
    var byLocale = I18N.PROMOTION_COPY || {};
    var promo = id && ((byLocale[LOCALE] && byLocale[LOCALE][id]) || (byLocale[FALLBACK_LOCALE] && byLocale[FALLBACK_LOCALE][id]));
    if (!promo) {
      root.innerHTML = '<p class="promo-detail-desc">' + escapeHtml(tr('lobby.promotionDetail.notFound', 'Promotion not found.')) + '</p>' +
        '<button type="button" class="ap-btn-wide outline" id="promo-detail-cta">' + escapeHtml(tr('lobby.promotionDetail.back', 'Back')) + '</button>';
      var backBtn = document.getElementById('promo-detail-cta');
      if (backBtn) backBtn.addEventListener('click', function () { location.href = 'promotion.html'; });
      return;
    }
    function statRow(label, value) {
      return '<div class="game-modal-stat"><div class="game-modal-stat-label">' + escapeHtml(label) + '</div><div class="game-modal-stat-val">' + escapeHtml(value) + '</div></div>';
    }
    function listSection(label, items, ordered) {
      if (!items || !items.length) return '';
      var tag = ordered ? 'ol' : 'ul';
      var lis = items.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
      return '<h2 class="promo-detail-h2">' + escapeHtml(label) + '</h2><' + tag + ' class="promo-detail-list">' + lis + '</' + tag + '>';
    }
    var art = PROMOTION_ART[id] || '';
    var artAlt = tr('lobby.promotionDetail.artworkAlt', '{title} campaign artwork').replace('{title}', promo.title);
    var target = PROMOTION_ACTION_TARGETS[id] || 'promotion.html';
    root.innerHTML =
      '<span class="promo-card-tag">' + escapeHtml(promo.tag) + '</span>' +
      '<div class="promo-detail-art" role="img" aria-label="' + escapeHtml(artAlt) + '" style="background-image: url(&quot;' + art + '&quot;);"></div>' +
      '<h1 class="ap-h1">' + escapeHtml(promo.title) + '</h1>' +
      '<p class="promo-detail-desc">' + escapeHtml(promo.description) + '</p>' +
      '<div class="game-modal-stats">' +
        statRow(tr('lobby.promotionDetail.reward', 'Reward'), promo.reward) +
        statRow(tr('lobby.promotionDetail.eligibility', 'Eligibility'), promo.eligibility) +
        statRow(tr('lobby.promotionDetail.availability', 'Availability'), promo.validity) +
      '</div>' +
      listSection(tr('lobby.promotionDetail.offerDetails', 'Offer details'), promo.highlights, false) +
      listSection(tr('lobby.promotionDetail.howToClaim', 'How to claim'), promo.steps, true) +
      listSection(tr('lobby.promotionDetail.termsConditions', 'Terms & conditions'), promo.terms, false) +
      '<p class="promo-detail-hint">' + escapeHtml(tr('lobby.promotionDetail.actionHint', '')) + '</p>' +
      '<button type="button" class="ap-btn-wide ap-grad" id="promo-detail-cta">' + escapeHtml(promo.actionLabel) + '</button>';
    var cta = document.getElementById('promo-detail-cta');
    if (cta) cta.addEventListener('click', function () { location.href = target; });
  }

  /* ============================================================
   * Deposit 頁：provider 分頁(A-D，連動可用付款方式數) + 金額速選 +
   * 優惠方案選擇(啟用送出按鈕) + 送出結果對話框。轉帳明細畫面／QR 中繼
   * 畫面(step 2/3)簡化省略，送出後直接顯示對應結果訊息。
   * ========================================================== */
  function initDepositPage() {
    var providerTabs = document.querySelectorAll('.ui-tablist--underline .ui-tab--underline');
    var methodTabs = document.querySelectorAll('.dp-method-tabs button');
    var amountBtns = document.querySelectorAll('.ap-amount-btn');
    var customInput = document.querySelector('.ap-form-card .ap-input');
    var promoCards = document.querySelectorAll('.ap-promo-card');
    var applyBtn = document.querySelector('.ap-form-card .ap-btn-wide.ap-grad');
    if (!providerTabs.length || !applyBtn) return;

    var METHOD_COUNT = { a: 4, b: 3, c: 2, d: 1 };
    var PROVIDER_LETTERS = ['a', 'b', 'c', 'd'];
    var state = { provider: 'a' };

    function syncProviderMethods() {
      var count = METHOD_COUNT[state.provider] || 4;
      var visibleMethods = Array.prototype.slice.call(methodTabs, 0, count);
      Array.prototype.forEach.call(methodTabs, function (btn, i) { btn.style.display = i < count ? '' : 'none'; });
      var stillVisible = Array.prototype.some.call(visibleMethods, function (btn) { return btn.classList.contains('active'); });
      if (!stillVisible && visibleMethods[0]) {
        Array.prototype.forEach.call(methodTabs, function (b) { b.classList.remove('active'); });
        visibleMethods[0].classList.add('active');
      }
    }
    Array.prototype.forEach.call(providerTabs, function (btn, i) {
      btn.addEventListener('click', function () {
        /* .ui-tab--underline 高亮吃 .active 或 [aria-selected="true"] 任一個；
           只改 .active 會讓靜態頁預設 aria-selected="true" 的第一顆永遠亮著，
           所以兩者一起更新（比照 withdrawal setPrimaryTab）。 */
        Array.prototype.forEach.call(providerTabs, function (b) { var on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
        state.provider = PROVIDER_LETTERS[i] || 'a';
        syncProviderMethods();
      });
    });
    Array.prototype.forEach.call(methodTabs, function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(methodTabs, function (b) { b.classList.toggle('active', b === btn); });
      });
    });

    Array.prototype.forEach.call(amountBtns, function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(amountBtns, function (b) { b.classList.toggle('active', b === btn); });
        if (customInput) customInput.value = '₩ ' + btn.textContent.trim();
      });
    });
    if (customInput) {
      customInput.addEventListener('input', function () {
        var digits = customInput.value.replace(/[^\d]/g, '');
        customInput.value = '₩ ' + (digits ? Number(digits).toLocaleString() : '');
        Array.prototype.forEach.call(amountBtns, function (b) { b.classList.remove('active'); });
      });
    }

    Array.prototype.forEach.call(promoCards, function (card) {
      var radio = card.querySelector('input[type="radio"]');
      if (!radio) return;
      radio.addEventListener('change', function () {
        Array.prototype.forEach.call(promoCards, function (c) { c.classList.toggle('active', c === card); });
        applyBtn.disabled = false;
      });
    });

    /* 儲值流程：Apply → bank 直接進「轉帳明細」；LinePay/USDT 先過「掃碼付款」
       QR 中繼，Next 後 LinePay 再進轉帳明細、USDT 直接成功；
       轉帳明細 Complete → 成功。 */
    var depositCard = document.querySelector('.ap-form-card');
    var depositTabsEls = [document.querySelector('.ui-tablist--underline'), document.querySelector('.dp-method-tabs')];
    function currentAmountVal() { return (customInput && customInput.value) ? customInput.value : '₩ 10,000'; }
    function depositMethodId() {
      var act = document.querySelector('.dp-method-tabs button.active');
      var label = act ? act.textContent.trim() : 'Bank Card';
      if (/LinePay/i.test(label)) return 'linepay';
      if (/TRC20/i.test(label)) return 'trc20';
      if (/ERC20/i.test(label)) return 'erc20';
      return 'bank';
    }
    function hideDepositForm() { depositTabsEls.concat([depositCard]).forEach(function (el) { if (el) el.style.display = 'none'; }); }
    function restoreDepositForm() { depositTabsEls.concat([depositCard]).forEach(function (el) { if (el) el.style.display = ''; }); }
    function removeDepositStep() { var s = document.querySelector('.dp-step'); if (s) s.remove(); }
    function depositSuccess() { showDialog(resultDialogHTML('success', 'Success!', 'Your deposit application has been submitted.')); }

    function showDepositTransferStep(amountVal) {
      hideDepositForm(); removeDepositStep();
      var sec = document.createElement('section');
      sec.className = 'ap-form-card dp-step';
      sec.innerHTML =
        '<div class="dp-step-pill">Transfer Details</div>' +
        '<div class="dp-trow"><span class="dp-tlabel">Deposit Amount</span><strong class="dp-tamount">' + escapeHtml(amountVal) + '</strong></div>' +
        '<div class="dp-trow"><span class="dp-tlabel">Deposit Account</span><strong>wururu1234</strong></div>' +
        '<p class="dp-tnote">Once the transfer is complete, please click the "Complete" button below. Should you have any questions, please feel free to contact our Customer Service team.</p>' +
        '<p class="dp-tcs"><a href="#" data-dp-cs>Customer Service</a></p>' +
        '<button type="button" class="ap-btn-wide ap-grad" data-dp-complete>Complete</button>';
      depositCard.parentElement.insertBefore(sec, depositCard.nextSibling);
      safe(function () { applyI18n(sec); });
      var cs = sec.querySelector('[data-dp-cs]'); if (cs) cs.addEventListener('click', function (e) { e.preventDefault(); location.href = 'customer-service.html'; });
      var done = sec.querySelector('[data-dp-complete]'); if (done) done.addEventListener('click', depositSuccess);
    }
    var DP_ADDR = { linepay: 'https://line.example/pay/8f3c1a92b7d4e05f', trc20: 'TXk9YmR2pQ7sN3vB1cE6hK8jL0tUw', erc20: '0x8f3c1a92b7d4e05fA1cE6hK8jL0tUw12' };
    function dpQrModules() {
      var s = '', seed = 7;
      function finder(x, y) {
        return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#0b0e13"></rect><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"></rect><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#0b0e13"></rect>';
      }
      s += finder(0, 0) + finder(22, 0) + finder(0, 22);
      for (var y = 0; y < 29; y++) for (var x = 0; x < 29; x++) {
        if ((x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20)) continue;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        if ((seed >> 16) % 100 < 46) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#0b0e13"></rect>';
      }
      return s;
    }
    function showDepositQrStep(methodId) {
      hideDepositForm(); removeDepositStep();
      var isAddr = methodId === 'trc20' || methodId === 'erc20';
      var addr = DP_ADDR[methodId] || DP_ADDR.linepay;
      var sec = document.createElement('section');
      sec.className = 'ap-form-card dp-step dp-step-center';
      sec.innerHTML =
        '<div class="dp-step-pill">Scan to Pay</div>' +
        '<p class="dp-qr-hint">Please scan the QR code below with your phone, or copy the payment ' + (isAddr ? 'address' : 'link') + ' to complete the payment.</p>' +
        '<div class="dp-qr"><svg width="176" height="176" viewBox="0 0 29 29" shape-rendering="crispEdges" role="img" aria-label="Payment QR code"><rect width="29" height="29" fill="#fff"></rect>' + dpQrModules() + '</svg></div>' +
        '<label class="dp-qr-label">' + (isAddr ? 'Payment Address' : 'Payment Link') + '</label>' +
        '<div class="dp-qr-row"><input class="ap-input" value="' + escapeHtml(addr) + '" readonly><button type="button" class="ap-btn-wide outline dp-qr-copy" data-dp-copy>Copy</button></div>' +
        '<p class="dp-qr-note">This is an illustrative QR code and payment ' + (isAddr ? 'address' : 'link') + ', for interface display only.</p>' +
        '<div class="dp-step-actions"><button type="button" class="ap-btn-wide ap-grad" data-dp-next>Next</button><button type="button" class="ap-btn-wide outline" data-dp-back>Back</button></div>';
      depositCard.parentElement.insertBefore(sec, depositCard.nextSibling);
      safe(function () { applyI18n(sec); });
      var cp = sec.querySelector('[data-dp-copy]'); if (cp) cp.addEventListener('click', function () {
        try { navigator.clipboard.writeText(addr); } catch (e) {}
        var o = cp.textContent; cp.textContent = 'Copied'; setTimeout(function () { cp.textContent = o; }, 1500);
      });
      var bk = sec.querySelector('[data-dp-back]'); if (bk) bk.addEventListener('click', function () { sec.remove(); restoreDepositForm(); });
      var nx = sec.querySelector('[data-dp-next]'); if (nx) nx.addEventListener('click', function () {
        sec.remove();
        if (methodId === 'linepay') showDepositTransferStep(currentAmountVal());
        else { restoreDepositForm(); depositSuccess(); }
      });
    }
    applyBtn.addEventListener('click', function () {
      if (applyBtn.disabled) return;
      var m = depositMethodId();
      if (m === 'bank') showDepositTransferStep(currentAmountVal());
      else showDepositQrStep(m);
    });
  }

  /* ============================================================
   * Withdrawal 頁：主分頁(Withdraw / Account Management) x 方式子分頁
   * (Bank / Crypto) 共 4 種組合，靜態頁只烘焙其中一種，其餘 3 種畫面
   * markup 逐欄位動態產生（欄位名稱/placeholder 沿用既有資料，非新增
   * 資料模型）。送出/註冊皆做必填驗證與筆數上限，成功訊息為既有文案。
   * ========================================================== */
  function initWithdrawalPage() {
    var primaryTabs = document.querySelectorAll('.ui-tablist--underline .ui-tab--underline');
    var panelHost = document.querySelector('.wd-panel');
    if (!primaryTabs.length || !panelHost) return;

    var state = { primary: 'withdraw', withdrawMethod: 'bank', manageMethod: 'bank', bankIdx: 0, manageAdd: { bank: false, crypto: false } };
    var acctStore = loadAccountStore();
    var bankAccounts = acctStore.banks;
    var cryptoWallets = acctStore.cryptos;
    var BANKS = ['Shinhan Bank', 'KB Bank', 'Woori Bank', 'Hana Bank', 'NH Bank'];
    try {
      var wq = new URLSearchParams(location.search);
      var wtab = wq.get('tab'), wm = wq.get('method');
      if (wtab === 'manage' || wtab === 'management') state.primary = 'management';
      if (wm === 'bank' || wm === 'crypto') { state.manageMethod = wm; state.withdrawMethod = wm; }
    } catch (e) {}

    function methodTabsHTML(group) {
      if (group === 'withdraw') {
        return '<div class="wd-method-tabs" role="tablist" aria-label="Withdrawal method">' +
          '<button type="button" data-method="bank" class="' + (state.withdrawMethod === 'bank' ? 'active' : '') + '" role="tab"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>Bank Card</button>' +
          '<button type="button" data-method="crypto" class="' + (state.withdrawMethod === 'crypto' ? 'active' : '') + '" role="tab"><span class="wd-coin-mark">B</span>Crypto Wallet</button>' +
        '</div>';
      }
      return '<div class="wd-method-tabs" role="tablist" aria-label="Account type">' +
        '<button type="button" data-method="bank" class="' + (state.manageMethod === 'bank' ? 'active' : '') + '" role="tab"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>Bank Account</button>' +
        '<button type="button" data-method="crypto" class="' + (state.manageMethod === 'crypto' ? 'active' : '') + '" role="tab"><span class="wd-coin-mark">B</span>Crypto Wallet</button>' +
      '</div>';
    }
    var EYE_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg>';
    var DELETE_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6"/></svg>';
    var EYE_OFF_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.73 5.08A11 11 0 0 1 12 5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 0 1-2.17 3.35M6.6 6.6A11.6 11.6 0 0 0 1 12.5 11 11 0 0 0 12 20a10.9 10.9 0 0 0 5.4-1.4M14.12 14.12A3 3 0 1 1 9.88 9.88"/><path d="m2 2 20 20"/></svg>';
    /* 提款金額輸入尾碼遮罩：與帳戶總覽 / 管理清單同一份 cms-v3:accounts，取末四碼加全形星號（比照 v2 bound-card ＊＊＊＊1234） */
    function acctTail(num) {
      var digits = String(num || '').replace(/\D/g, '');
      return '＊＊＊＊' + (digits.slice(-4) || '0000');
    }
    /* 流水列（紅字、主錢包上下各一條）— 對照 v2 提款銀行面板 rollover 兩欄。
       withDetail 只給第一次呼叫(卡片上方)加「Detail」捷徑,對照設計稿只
       出現一次,提交前的第二條流水列不重複加。 */
    function rolloverRowHTML(withDetail) {
      return '<div class="ap-rollover">' +
        '<div><div>*Rollover Achieved</div><div><strong>amount: ₩0.00</strong>' +
          (withDetail ? ' <a href="withdrawal-detail.html" class="ap-rollover-detail">Detail</a>' : '') +
        '</div></div>' +
        '<div><div>Target amount:</div><div><strong>₩0.00</strong></div></div>' +
      '</div>';
    }
    function withdrawBankPanelHTML() {
      var n = bankAccounts.length;
      if (state.bankIdx >= n) state.bankIdx = 0;
      var b = bankAccounts[state.bankIdx];
      var cardBlock = b
        ? '<div>' +
            '<div class="ap-wd-acchead">' +
              '<button type="button" class="ap-wd-arrow" data-action="bank-prev" aria-label="Previous account"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg></button>' +
              'My Bank Accounts <b>' + (state.bankIdx + 1) + ' / ' + n + '</b>' +
              '<button type="button" class="ap-wd-arrow" data-action="bank-next" aria-label="Next account"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 6 6 6-6 6"/></svg></button>' +
            '</div>' +
            '<div class="ap-wd-card">' +
              '<button type="button" class="ap-wd-card-add" data-action="goto-manage-bank" aria-label="Add bank account"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>' +
              '<span class="ap-wd-card-name">' + escapeHtml(b.bank) + '</span>' +
              '<div class="ap-wd-card-acc"><span class="ap-wd-card-acc-label">Account Number</span><span class="ap-wd-card-acc-num">' + escapeHtml(acctTail(b.number)) + '</span></div>' +
              '<span class="ap-wd-card-holder">M＊＊＊＊＊＊＊</span>' +
              '<div class="ap-wd-card-bind"><span class="muted">Bind Date</span>' + escapeHtml(String(b.date).slice(0, 10)) + '</div>' +
            '</div>' +
            '<button type="button" class="ap-refresh-link" data-action="bank-refresh"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>Refresh</button>' +
          '</div>'
        : '<div class="wd-compact-empty"><span class="wd-empty-symbol">B</span><span>No registered withdrawal account</span></div>' +
          '<button type="button" class="wd-empty-action" data-action="goto-manage-bank"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Add bank account</button>';
      return '<h2 class="ap-section-h"><span class="ap-mark"></span>Bank Card</h2>' + cardBlock +
        '<div class="ap-wallet"><div class="ap-wallet-label">Main Wallet</div><div class="ap-wallet-amt">₩ 0.00</div></div>' +
        rolloverRowHTML(true) +
        '<h2 class="ap-section-h"><span class="ap-mark"></span>Withdrawal Amount &amp; Password</h2>' +
        '<input class="ap-input" data-f="amount" inputmode="numeric" placeholder="₩ 10,000 ~ ₩ 9,000,000">' +
        '<div class="ap-input-wrap"><input class="ap-input" data-f="password" type="password" placeholder="* * * * * *"><button type="button" class="ap-eye" data-action="toggle-pw" aria-label="Show password">' + EYE_SVG + '</button></div>' +
        rolloverRowHTML() +
        '<button type="button" class="ap-btn-wide ap-grad" data-action="submit-withdraw" disabled>Submit</button>';
    }
    function withdrawCryptoPanelHTML() {
      var wallets = cryptoWallets.length ? cryptoWallets.map(function (w) {
        return '<div class="wd-account-card"><span class="wd-wallet-logo">' + escapeHtml(w.type.slice(0, 1)) + '</span><div class="wd-account-copy"><strong>' + escapeHtml(w.type) + '</strong><span>' + escapeHtml(w.address) + '</span><span>' + escapeHtml(w.date) + '</span></div></div>';
      }).join('') : (
        '<div class="wd-empty-wallet"><span class="wd-empty-symbol">B</span><strong>Empty wallet list</strong>' +
        '<button type="button" class="wd-empty-action" data-action="goto-manage-crypto"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Add wallet</button></div>'
      );
      return '<h2 class="ap-section-h"><span class="ap-mark"></span>Crypto Wallet</h2>' + wallets +
        '<div class="wd-balance-list"><div class="wd-balance-row"><span>Central Wallet:</span><strong>0.00</strong></div><div class="wd-balance-row"><span>Available Amount:</span><strong>0.00</strong></div></div>' +
        '<h2 class="ap-section-h"><span class="ap-mark"></span>Withdrawal Amount &amp; Password</h2>' +
        '<div class="wd-form-grid">' +
          '<label>Wallet Type:</label><select class="ap-input" data-f="wtype"><option value="" disabled selected>Please select wallet type</option><option>USDT-TRC20</option><option>USDT-ERC20</option><option>BTC</option></select>' +
          '<label>Wallet Address:</label><input class="ap-input" data-f="waddr" placeholder="Please fill in wallet address">' +
          '<label>Withdrawal Amount:</label><input class="ap-input" data-f="amount" inputmode="numeric" placeholder="100,000 ~ 20,000,000">' +
          '<label>Transaction Password:</label><input class="ap-input" data-f="password" type="password" placeholder="Please fill in the transaction password">' +
        '</div>' +
        '<button type="button" class="ap-btn-wide ap-grad" data-action="submit-withdraw" disabled>Submit</button>';
    }
    /* 帳戶管理的新增入口：兩個分頁的表單預設收起，由這顆「+」帶出。視覺沿用
       前台既有的 .wd-empty-action，不新增等價樣式。收合用「不輸出 HTML」而
       非 hidden 屬性 —— .wd-form-grid 有自己的 display，hidden 會被蓋掉；
       renderPanel() 反正會重建 innerHTML。 */
    function addToggleHTML(kind) {
      var label = kind === 'bank' ? 'Add bank account' : 'Add wallet';
      return '<button type="button" class="wd-empty-action wd-add-toggle" data-action="toggle-add-' + kind + '" aria-expanded="' + (state.manageAdd[kind] ? 'true' : 'false') + '">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' + label + '</button>';
    }
    function manageBankPanelHTML() {
      var rows = bankAccounts.map(function (a, idx) {
        return '<div class="wd-account-card"><div class="wd-bank-logo">' + escapeHtml(bankInitials(a.bank)) + '</div><div class="wd-account-copy"><strong>' + escapeHtml(a.bank) + '</strong><span>' + escapeHtml(a.number) + '</span><span>' + escapeHtml(a.date) + '</span></div>' +
          '<button type="button" class="ap-bank-del" data-action="del-bank" data-idx="' + idx + '" aria-label="Delete account">' + DELETE_SVG + '</button></div>';
      }).join('');
      return '<h2 class="ap-section-h"><span class="ap-mark"></span>Registered Withdrawal Accounts <span class="wd-count">(' + bankAccounts.length + '/5)</span></h2>' + rows +
        addToggleHTML('bank') +
        (state.manageAdd.bank
          ? '<div class="wd-form-grid wd-management-form">' +
              '<label>Select Bank:</label><select class="ap-input" data-f="bank"><option value="" disabled selected>Please Select a Bank</option>' + BANKS.map(function (b) { return '<option>' + b + '</option>'; }).join('') + '</select>' +
              '<label>Name on Card:</label><input class="ap-input" value="T***" disabled>' +
              '<label>Account Number:</label><input class="ap-input" data-f="account" inputmode="numeric" placeholder="Please enter account/card/phone number">' +
              '<label>Transaction Password:</label><input class="ap-input" data-f="password" type="password" placeholder="Please fill in the transaction password">' +
            '</div>' +
            '<button type="button" class="ap-btn-wide ap-grad" data-action="register-bank" disabled>Submit</button>'
          : '');
    }
    function manageCryptoPanelHTML() {
      var rows = cryptoWallets.length ? cryptoWallets.map(function (w, idx) {
        return '<div class="wd-account-card"><span class="wd-wallet-logo">' + escapeHtml(w.type.slice(0, 1)) + '</span><div class="wd-account-copy"><strong>' + escapeHtml(w.type) + '</strong><span>' + escapeHtml(w.address) + '</span><span>' + escapeHtml(w.date) + '</span></div>' +
          '<button type="button" class="ap-bank-del" data-action="del-crypto" data-idx="' + idx + '" aria-label="Delete wallet">' + DELETE_SVG + '</button></div>';
      }).join('') : '<div class="wd-compact-empty"><span class="wd-empty-symbol">B</span><span>No registered crypto wallet</span></div>';
      return '<h2 class="ap-section-h"><span class="ap-mark"></span>Registered Crypto Wallets <span class="wd-count">(' + cryptoWallets.length + '/5)</span></h2>' + rows +
        addToggleHTML('crypto') +
        (state.manageAdd.crypto
          ? '<div class="wd-form-grid wd-management-form">' +
              '<label>Wallet Type:</label><select class="ap-input" data-f="wtype"><option value="" disabled selected>Please select wallet type</option><option>USDT-TRC20</option><option>USDT-ERC20</option><option>BTC</option></select>' +
              '<label>Wallet Address:</label><input class="ap-input" data-f="waddr" placeholder="Please fill in wallet address">' +
              '<label>Transaction Password:</label><input class="ap-input" data-f="password" type="password" placeholder="Please fill in the transaction password">' +
            '</div>' +
            '<button type="button" class="ap-btn-wide ap-grad" data-action="register-crypto" disabled>Submit</button>'
          : '');
    }
    function checkReady() {
      var btn = panelHost.querySelector('[data-action="submit-withdraw"], [data-action="register-bank"], [data-action="register-crypto"]');
      if (!btn) return;
      var inputs = panelHost.querySelectorAll('[data-f]');
      var ready = inputs.length > 0;
      Array.prototype.forEach.call(inputs, function (inp) { if (!inp.value || !String(inp.value).trim()) ready = false; });
      btn.disabled = !ready;
    }
    function renderPanel() {
      var group = state.primary;
      var method = group === 'withdraw' ? state.withdrawMethod : state.manageMethod;
      var tabsHost = panelHost.parentElement.querySelector('.wd-method-tabs');
      if (tabsHost) tabsHost.outerHTML = methodTabsHTML(group);
      panelHost.innerHTML = (group === 'withdraw')
        ? (method === 'bank' ? withdrawBankPanelHTML() : withdrawCryptoPanelHTML())
        : (method === 'bank' ? manageBankPanelHTML() : manageCryptoPanelHTML());
      checkReady();
      applyI18n(panelHost.parentElement || panelHost);
    }

    /* .ui-tab--underline 的高亮吃 .active 或 [aria-selected="true"] 任一個
       （components.css），所以兩者必須一起換 —— 只切 class 會讓靜態 HTML 上
       aria-selected="true" 的那顆永遠亮著。 */
    function setPrimaryTab(idx) {
      Array.prototype.forEach.call(primaryTabs, function (b, i) {
        var on = i === idx;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
      });
    }

    Array.prototype.forEach.call(primaryTabs, function (btn, i) {
      btn.addEventListener('click', function () {
        setPrimaryTab(i);
        state.primary = i === 0 ? 'withdraw' : 'management';
        renderPanel();
      });
    });

    document.addEventListener('click', function (e) {
      var scope = e.target.closest('.wd-panel') || e.target.closest('.wd-method-tabs');
      if (!scope) return;
      var pwToggle = e.target.closest('[data-action="toggle-pw"]');
      if (pwToggle) {
        var pwWrap = pwToggle.closest('.ap-input-wrap');
        var pwInp = pwWrap ? pwWrap.querySelector('input') : null;
        if (pwInp) {
          var reveal = pwInp.type === 'password';
          pwInp.type = reveal ? 'text' : 'password';
          pwToggle.innerHTML = reveal ? EYE_OFF_SVG : EYE_SVG;
          pwToggle.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
        }
        return;
      }
      var bankPrevBtn = e.target.closest('[data-action="bank-prev"]');
      if (bankPrevBtn) { if (bankAccounts.length) { state.bankIdx = (state.bankIdx - 1 + bankAccounts.length) % bankAccounts.length; renderPanel(); } return; }
      var bankNextBtn = e.target.closest('[data-action="bank-next"]');
      if (bankNextBtn) { if (bankAccounts.length) { state.bankIdx = (state.bankIdx + 1) % bankAccounts.length; renderPanel(); } return; }
      var bankRefreshBtn = e.target.closest('[data-action="bank-refresh"]');
      if (bankRefreshBtn) { bankRefreshBtn.classList.add('spinning'); setTimeout(function () { bankRefreshBtn.classList.remove('spinning'); }, 700); return; }
      var delBankBtn = e.target.closest('[data-action="del-bank"]');
      if (delBankBtn) {
        var delBankIdx = Number(delBankBtn.getAttribute('data-idx'));
        var bankToDelete = bankAccounts[delBankIdx];
        if (!bankToDelete) return;
        var bankDlg = showDialog(
          '<div class="confirm-dialog" data-dialog-panel>' +
            '<div class="confirm-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg></div>' +
            '<div class="confirm-title">Delete Account?</div>' +
            '<div class="confirm-sub">Are you sure you want to remove <strong>' + escapeHtml(bankToDelete.bank) + '</strong>? This action cannot be undone.</div>' +
            '<div class="confirm-actions">' +
              '<button type="button" class="ap-btn-wide outline" data-dialog-close>Cancel</button>' +
              '<button type="button" class="ap-btn-wide confirm-del-btn" data-action="confirm-del-bank-mgmt">Delete</button>' +
            '</div>' +
          '</div>'
        );
        var bankDlgBtn = bankDlg.querySelector('[data-action="confirm-del-bank-mgmt"]');
        if (bankDlgBtn) bankDlgBtn.addEventListener('click', function () {
          bankAccounts.splice(delBankIdx, 1);
          saveAccountStore(acctStore);
          renderPanel();
          bankDlg.remove();
        });
        return;
      }
      var delCryptoBtn = e.target.closest('[data-action="del-crypto"]');
      if (delCryptoBtn) {
        var delCryptoIdx = Number(delCryptoBtn.getAttribute('data-idx'));
        var walletToDelete = cryptoWallets[delCryptoIdx];
        if (!walletToDelete) return;
        var cryptoDlg = showDialog(
          '<div class="confirm-dialog" data-dialog-panel>' +
            '<div class="confirm-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg></div>' +
            '<div class="confirm-title">Delete Wallet?</div>' +
            '<div class="confirm-sub">Are you sure you want to remove <strong>' + escapeHtml(walletToDelete.type) + '</strong>? This action cannot be undone.</div>' +
            '<div class="confirm-actions">' +
              '<button type="button" class="ap-btn-wide outline" data-dialog-close>Cancel</button>' +
              '<button type="button" class="ap-btn-wide confirm-del-btn" data-action="confirm-del-crypto-mgmt">Delete</button>' +
            '</div>' +
          '</div>'
        );
        var cryptoDlgBtn = cryptoDlg.querySelector('[data-action="confirm-del-crypto-mgmt"]');
        if (cryptoDlgBtn) cryptoDlgBtn.addEventListener('click', function () {
          cryptoWallets.splice(delCryptoIdx, 1);
          saveAccountStore(acctStore);
          renderPanel();
          cryptoDlg.remove();
        });
        return;
      }
      var addBankBtn = e.target.closest('[data-action="goto-manage-bank"]');
      if (addBankBtn) { state.primary = 'management'; state.manageMethod = 'bank'; state.manageAdd.bank = true; setPrimaryTab(1); renderPanel(); return; }
      var methodBtn = e.target.closest('.wd-method-tabs button[data-method]');
      if (methodBtn) {
        if (state.primary === 'withdraw') state.withdrawMethod = methodBtn.getAttribute('data-method');
        else state.manageMethod = methodBtn.getAttribute('data-method');
        renderPanel();
        return;
      }
      var addToggle = e.target.closest('[data-action^="toggle-add-"]');
      if (addToggle) {
        var kind = addToggle.getAttribute('data-action') === 'toggle-add-bank' ? 'bank' : 'crypto';
        state.manageAdd[kind] = !state.manageAdd[kind];
        renderPanel();
        return;
      }
      var addWalletBtn = e.target.closest('[data-action="goto-manage-crypto"]');
      if (addWalletBtn) {
        state.primary = 'management'; state.manageMethod = 'crypto';
        state.manageAdd.crypto = true;
        setPrimaryTab(1);
        renderPanel();
        return;
      }
      var submitBtn = e.target.closest('[data-action="submit-withdraw"]');
      if (submitBtn && !submitBtn.disabled) {
        var methodLabel = (state.withdrawMethod === 'bank') ? 'Bank card' : 'Crypto wallet';
        showDialog(resultDialogHTML('success', 'Success!', methodLabel + ' withdrawal request submitted successfully.'));
        return;
      }
      var regBankBtn = e.target.closest('[data-action="register-bank"]');
      if (regBankBtn && !regBankBtn.disabled) {
        if (bankAccounts.length >= 5) { showDialog(resultDialogHTML('warning', 'Account Limit', 'A maximum of five withdrawal accounts can be registered.')); return; }
        var bankSel = panelHost.querySelector('[data-f="bank"]');
        var acctInp = panelHost.querySelector('[data-f="account"]');
        var last4 = (acctInp.value || '').replace(/\D/g, '').slice(-4) || acctInp.value.slice(-4);
        bankAccounts.push({ bank: bankSel.value, number: '********' + last4, date: new Date().toISOString().slice(0, 19).replace('T', ' ') });
        saveAccountStore(acctStore);
        state.manageAdd.bank = false;
        renderPanel();
        showDialog(resultDialogHTML('success', 'Success!', 'Withdrawal account registered successfully.'));
        return;
      }
      var regCryptoBtn = e.target.closest('[data-action="register-crypto"]');
      if (regCryptoBtn && !regCryptoBtn.disabled) {
        if (cryptoWallets.length >= 5) { showDialog(resultDialogHTML('warning', 'Wallet Limit', 'A maximum of five crypto wallets can be registered.')); return; }
        var wtypeSel = panelHost.querySelector('[data-f="wtype"]');
        var waddrInp = panelHost.querySelector('[data-f="waddr"]');
        var addr = (waddrInp.value || '').trim();
        cryptoWallets.push({ type: wtypeSel.value, address: addr.slice(0, 8) + '...' + addr.slice(-6), date: new Date().toISOString().slice(0, 19).replace('T', ' ') });
        saveAccountStore(acctStore);
        state.manageAdd.crypto = false;
        renderPanel();
        showDialog(resultDialogHTML('success', 'Success!', 'Crypto wallet registered successfully.'));
        return;
      }
    });
    document.addEventListener('input', function (e) { if (e.target.closest && e.target.closest('.wd-panel')) checkReady(); });
    document.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('.wd-panel')) checkReady(); });

    // 靜態頁面初次渲染的 method-tabs/wd-panel markup 沒有 data-method /
    // data-action 掛勾，開場先用同一套 renderPanel() 正規化一次；並依 URL
    // 深連結參數把主頁籤切到對應分頁。
    setPrimaryTab(state.primary === 'management' ? 1 : 0);
    renderPanel();
  }

  /* ============================================================
   * Bootstrap
   * ========================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    safe(initI18n);
    /* topbar 的登入/未登入 HTML 原本只在 doLogin()/doLogout() 觸發，
       靜態 HTML 一律先假設已登入；沒有這行的話，就算 USER.loggedIn
       依 cms_v3_logged_out 旗標正確初始化成 false，畫面還是照樣顯示
       頭像，看起來像登出後換頁又自動變回登入。 */
    safe(renderAuthSection);
    safe(restoreSkin);
    safe(applySkinButtonVisibility);
    safe(applySavedSiteName);
    safe(applySbMoneyActiveState);
    safe(applySavedDesign);
    safe(applySavedSectionVariants);
    safe(applyLobbyLayout);
    safe(applyTopBlockLayout);
    safe(applyAccountSections);
    safe(applySavedChrome);
    safe(applyStudioChromeNow);
    safe(applySavedBanners);
    safe(initHero);
    safe(initRails);
    safe(initPromosAndCategoryViews);
    safe(initLeaderboard);
    safe(initRewardsCountdown);
    safe(initPromoRibbonClock);
    safe(initCustomerServiceFab);
    safe(initBalanceFloat);
    safe(initMobileNav);
    safe(initAccountOverviewPage);
    safe(initSecurityCenterPage);
    safe(initPersonalInfoPage);
    safe(initRecordPage);
    safe(initFavoritesPage);
    safe(initSupportPage);
    safe(initSportsPage);
    safe(initPromotionCards);
    safe(initPromotionDetail);
    safe(initDepositPage);
    safe(initWithdrawalPage);
    /* 各頁 render 完後再套一次 i18n，補翻 JS 動態產生（在 initI18n 之後才建）的內容 */
    safe(function () { applyI18n(document); });
    safe(function () { document.addEventListener('click', onDocumentClick); });
    safe(function () { document.addEventListener('submit', onDocumentSubmit); });
    safe(function () { document.addEventListener('keydown', onDocumentKeydown); });
    safe(function () {
      document.addEventListener('cms:favorites-changed', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.lobby-section'), function (section) {
          if (section._cvParams) renderCategoryView(section);
        });
      });
    });
  });
})();
