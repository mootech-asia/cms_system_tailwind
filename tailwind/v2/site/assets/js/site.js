/**
 * WIN100 factory static site — vanilla JS behaviour layer.
 *
 * Plain global script (no ESM, no fetch, no bundler) — works via http server
 * AND file://. Reads seed data from window.WIN100_DATA (assets/js/data.js,
 * must be loaded before this file). Behaviour spec ported from frontend/ Vue
 * components (AppHeader, AppBanner, MiniGamesGrid, VendorBrowser, AuthModal,
 * useMemberPage, useCarousel, useCountdownTabs, app/utils/themes.ts) —
 * frontend/ itself was only read, never modified.
 *
 * Every init function defensively checks for its target markup before acting,
 * so the same site.js can be included unmodified on all 24 pages.
 */
(function () {
  'use strict';

  var D = window.WIN100_DATA || {};

  /* ============================== utils ================================ */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }
  /* 遊戲卡圖片載入失敗（404／網路錯誤）時的墊底畫面：把壞掉的 <img>
     藏起來，讓 .game-listing-card-media 掛上的 assets/game-fallback.svg
     從背景鋪滿卡片。error 事件不會冒泡，只能在 capture 階段抓。 */
  on(document, 'error', function (e) {
    var img = e.target;
    if (!img || img.nodeName !== 'IMG' || !img.classList.contains('game-listing-card-img') || img.hidden) return;
    img.hidden = true;
    var media = img.closest('.game-listing-card-media');
    if (media) media.classList.add('is-broken');
  }, true);
  /* 全螢幕/遮罩型 overlay 開啟時鎖住背景捲動,避免瀏覽器原生 scrollbar
     軌道穿插在 overlay 上層(position:fixed 蓋不到 viewport 的 scrollbar 溝槽)。
     用計數器而非布林值,允許巢狀開關(例如已開啟一個 overlay 時又開了另一個)
     仍能在最後一個關閉時才真正解鎖。 */
  var scrollLockCount = 0;
  function lockBodyScroll() {
    if (scrollLockCount === 0) {
      /* 實際捲動的是 document.scrollingElement(=<html>),只鎖 body 蓋不住。 */
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
    scrollLockCount++;
  }
  function unlockBodyScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function iconSvg(name, cls) {
    var d = (D.ICONS || {})[name] || '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : '') + '>' + d + '</svg>';
  }
  function pageName() {
    var seg = (location.pathname.split('/').pop() || 'index.html');
    return seg.replace(/\.html?$/, '') || 'index';
  }
  /* 單一權威清單:member-quick-links 的 Back 按鈕與 header 帳號列注入共用同一份,
     避免兩處各自維護一份、日後漏改。 */
  var MEMBER_PAGES = ['account', 'account-record', 'betting-record',
    'change-password', 'deposit', 'deposit-record', 'personal-info', 'profit-loss',
    'security', 'withdrawal', 'withdrawal-record', 'withdrawal-detail'];
  function isMemberPage() { return MEMBER_PAGES.indexOf(pageName()) !== -1; }
  function isActivePage(href) {
    var target = href.replace(/\.html$/, '');
    var cur = pageName();
    return target === 'index' ? cur === 'index' : cur === target;
  }
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  /* 錢包位址遮罩:前 6 碼 + … + 後 4 碼(withdrawal.html 管理頁/Crypto 面板與
     account.html Crypto Wallet 卡共用同一份遮罩規則)*/
  function walletMask(addr) {
    var s = addr || '';
    return s.length > 10 ? s.slice(0, 6) + '...' + s.slice(-4) : s;
  }

  /* ============================== favorites ============================== */
  /* 收藏(restores the feature dropped in the Nuxt→static conversion —
     VendorBrowser game grids + CategoryView used to carry an All/Favorites
     tab and a heart toggle per GameCard). Games have no stable id in this
     static rebuild, so a composite id is used: `kind|provider|i` (kind +
     index into that provider's generated grid); for kind==='live' the id is
     `live|<game name>` instead, since LIVE_GAME_NAMES is a stable enum that
     doesn't depend on which vendor's grid the card happened to render under.
     Persisted to localStorage as a plain JSON array of these id strings. */

  var FAVORITES_KEY = 'win100-static-favorites';
  function favoriteIds() {
    try {
      var raw = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }
  function saveFavoriteIds(ids) {
    try { window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids)); } catch (e) { /* ignore */ }
  }
  function isFavorite(id) { return favoriteIds().indexOf(id) !== -1; }
  function toggleFavorite(id) {
    var ids = favoriteIds();
    var idx = ids.indexOf(id);
    if (idx === -1) ids.push(id); else ids.splice(idx, 1);
    saveFavoriteIds(ids);
    return idx === -1; /* true = now favorited */
  }
  function favIdFor(provider, i, kind) {
    if (kind === 'live') {
      var names = D.LIVE_GAME_NAMES || ['Game'];
      return kind + '|' + names[i % names.length];
    }
    return kind + '|' + provider + '|' + i;
  }
  function parseFavId(id) {
    var sep = id.indexOf('|');
    var kind = id.slice(0, sep);
    var rest = id.slice(sep + 1);
    if (kind === 'live') return { kind: kind, provider: '', i: (D.LIVE_GAME_NAMES || []).indexOf(rest) };
    var lastSep = rest.lastIndexOf('|');
    return { kind: kind, provider: rest.slice(0, lastSep), i: parseInt(rest.slice(lastSep + 1), 10) || 0 };
  }
  function favToggleHtml(id) {
    var T = D.T || {};
    var active = isFavorite(id);
    return '<button type="button" class="fav-toggle' + (active ? ' is-active' : '') + '" data-fav-id="' +
      escapeHtml(id) + '" aria-pressed="' + active + '" aria-label="' + escapeHtml(T.favorites || 'Favorites') + '">' +
      iconSvg('heart') + '</button>';
  }
  /* Document-level delegation (not scoped to any one container) so the
     toggle keeps working across re-renders — cards are rebuilt wholesale on
     tab-switch / vendor drill-down, any container-scoped listener would go
     stale. Cards are themselves clickable (drill-down / play), hence the
     stopPropagation. */
  function initFavorites() {
    on(document, 'click', function (e) {
      var btn = e.target.closest('.fav-toggle');
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();
      var id = btn.getAttribute('data-fav-id');
      if (!id) return;
      var active = toggleFavorite(id);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
      document.dispatchEvent(new CustomEvent('win100-favorite-change', { detail: { id: id, active: active } }));
    });
  }

  /* =============================== theme ================================ */
  /* frontend/app/utils/themes.ts THEME_KEYS/THEME_LABELS + app/app.vue
     (<html data-theme>) + components/SkinSwitcher.vue. entry.*.css already
     bundles all 6 skins as [data-theme=X] rules, so flipping the attribute
     alone fully re-skins the page; the dynamic <link> swap below is kept too
     so the 6 themes/*.css files are genuinely (if redundantly) wired in, as
     a safety net if that bundle ever falls out of sync with the source files. */

  var THEME_STORAGE_KEY = 'win100-static-skin';
  var THEME_LINK_ID = 'win100-skin-link';

  function updateSkinUI(key) {
    $all('[data-skin-option]').forEach(function (el) {
      var active = el.getAttribute('data-skin-option') === key;
      el.classList.toggle('is-active', active);
    });
  }

  function applyTheme(key, persist) {
    var keys = D.THEME_KEYS || ['win100'];
    if (keys.indexOf(key) === -1) key = keys[0];
    document.documentElement.setAttribute('data-theme', key);
    var link = document.getElementById(THEME_LINK_ID);
    if (!link) {
      link = document.createElement('link');
      link.id = THEME_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = 'themes/' + key + '.css';
    if (persist !== false) {
      try { window.localStorage.setItem(THEME_STORAGE_KEY, key); } catch (e) { /* storage unavailable */ }
    }
    updateSkinUI(key);
  }

  function buildSkinPanelHtml() {
    var keys = D.THEME_KEYS || [];
    var labels = D.THEME_LABELS || {};
    /* /studio「公開皮膚」設定(win100-public-config.publicSkins)限縮前台可選清單 */
    var cfg = null;
    try { cfg = JSON.parse(localStorage.getItem('win100-public-config') || 'null'); } catch (e) {}
    var pub = (cfg && cfg.publicSkins) || [];
    if (pub.length) keys = keys.filter(function (k) { return pub.indexOf(k) !== -1; });
    return keys.map(function (k) {
      return '<div class="dd-panel-link" data-skin-option="' + k + '">' + escapeHtml(labels[k] || k) + '</div>';
    }).join('');
  }

  function initSkinSwitchers() {
    $all('button[aria-label="Switch skin"]').forEach(function (btn) {
      var wrap = btn.parentElement;
      var panel = null, backdrop = null;
      function close() {
        if (panel) { panel.remove(); panel = null; }
        if (backdrop) { backdrop.remove(); backdrop = null; }
      }
      function open() {
        backdrop = document.createElement('div');
        backdrop.className = 'dd-backdrop';
        on(backdrop, 'click', close);
        wrap.appendChild(backdrop);
        panel = document.createElement('div');
        panel.className = 'dd-panel dd-panel--right';
        panel.innerHTML = buildSkinPanelHtml();
        wrap.appendChild(panel);
        updateSkinUI(document.documentElement.getAttribute('data-theme') || 'win100');
        $all('[data-skin-option]', panel).forEach(function (opt) {
          on(opt, 'click', function () { applyTheme(opt.getAttribute('data-skin-option')); close(); });
        });
      }
      on(btn, 'click', function (e) {
        e.stopPropagation();
        if (panel) close(); else open();
      });
    });
  }

  function initTheme() {
    var saved = null;
    try { saved = window.localStorage.getItem(THEME_STORAGE_KEY); } catch (e) { /* ignore */ }
    applyTheme(saved || document.documentElement.getAttribute('data-theme') || 'win100', false);
    initSkinSwitchers();
  }

  /* ============================ locale switcher =========================== */
  /* components/LanguageSwitcher.vue + composables/useLocale.ts. All four
     locales (zh/en/ko/th) are fully translated in data.js — I18N plus the
     FAQ_ZH/FAQ_KO/FAQ_TH and SWEEP_PAIRS/SWEEP_PAIRS_KO/SWEEP_PAIRS_TH
     en-keyed dictionaries — and swapped in via the same exact-string-match
     mechanism this file already used for zh<->en. The trigger button itself
     (globe icon + current short label + chevron, wrapped in a `.dd-trigger-wrap`
     div) has no unique id/class in the baked HTML, so it's matched the same
     defensive way other structural triggers in this file are: by its exact
     rendered content. Two copies of this trigger exist per page (desktop
     header + hidden mobile nav), so every DOM update below applies to all
     matches, not just the first. */

  function buildLocalePanelHtml() {
    var pub = publicLocaleCodes();
    var locales = (D.LOCALES || []).filter(function (l) { return pub.indexOf(l.code) !== -1; });
    var cur = currentLocale();
    return locales.map(function (l) {
      var active = l.code === cur;
      return '<div class="dd-panel-link' + (active ? ' is-active' : '') + '" data-locale-option="' + l.code + '">' +
        escapeHtml(l.label) + '</div>';
    }).join('');
  }

  /* ============================================================
   * i18n(useLocale.ts 對應):zh/en/ko/th 四語系完整字典由 data.js 提供。
   * 靜態頁烘焙基準 = zh chrome + 設計原字(banner 英文大寫);applyLocale
   * 以「精確字串對照」在 text node / placeholder 層交換,任兩語系互切
   * 皆可逆 — 做法是對每個目標語系,把「另外三個語系各自的顯示文字」都
   * 收進同一份 swap map(而非追蹤『目前是哪個語系』這個額外狀態),
   * 這樣不管使用者從哪個語系切過來、或動態插入的內容是哪個語系寫死的
   * 原文,都能一次比對命中。
   * ========================================================== */
  var LOCALE_KEY = 'win100-locale';
  var LOGIN_KEY = 'win100-logged-in';
  /* LOCALE_CODES 是完整技術清單(swap-map 比對來源要用到全部語系,包含
     中文,不能移除),實際「玩家能不能選到」由 publicLocaleCodes() 另外
     決定 —— 中文預設隱藏,可在 studio「前台可見語言」重新開啟。 */
  var LOCALE_CODES = ['en', 'ko', 'th', 'zh'];
  var DEFAULT_PUBLIC_LOCALES = ['en', 'ko', 'th'];
  function publicLocaleCodes() {
    var cfg = publicConfig();
    return (cfg && Array.isArray(cfg.publicLocales) && cfg.publicLocales.length) ? cfg.publicLocales : DEFAULT_PUBLIC_LOCALES;
  }
  function currentLocale() {
    try {
      var saved = localStorage.getItem(LOCALE_KEY);
      var visible = publicLocaleCodes();
      if (saved && LOCALE_CODES.indexOf(saved) !== -1 && visible.indexOf(saved) !== -1) return saved;
      return visible.indexOf('en') !== -1 ? 'en' : visible[0];
    } catch (e) { return 'en'; }
  }
  function localeSwapMap(target) {
    var map = {};
    function addEntry(textFor) {
      var tgtText = textFor[target];
      if (!tgtText) return;
      LOCALE_CODES.forEach(function (loc) {
        if (loc === target) return;
        var srcText = textFor[loc];
        if (srcText && srcText !== tgtText) map[srcText] = tgtText;
      });
    }
    /* FAQ_ZH/FAQ_KO/FAQ_TH 與 SWEEP_PAIRS/_KO/_TH 皆以同一組 en 字串為
       key。先鋪這兩份,再覆蓋 I18N:同一個字串對到多個變體時(如
       熱門遊戲 = nav「Hot Games」與 banner 烘焙字「HOT GAMES」),以
       I18N 的標準 UI 文案為準;banner 靠 .category-hero-title 的
       text-transform:uppercase 維持大寫視覺,不受回填大小寫影響
       (下方 applyLocale 對 en 目標另有還原設計原字的處理)。 */
    [
      [D.FAQ_ZH, D.FAQ_KO, D.FAQ_TH],
      [D.SWEEP_PAIRS, D.SWEEP_PAIRS_KO, D.SWEEP_PAIRS_TH]
    ].forEach(function (triplet) {
      var zhDict = triplet[0] || {}, koDict = triplet[1] || {}, thDict = triplet[2] || {};
      Object.keys(zhDict).forEach(function (enStr) {
        addEntry({ en: enStr, zh: zhDict[enStr], ko: koDict[enStr], th: thDict[enStr] });
      });
    });
    var dicts = D.I18N || {};
    var zh = dicts.zh || {}, en = dicts.en || {}, ko = dicts.ko || {}, th = dicts.th || {};
    Object.keys(zh).forEach(function (k) {
      addEntry({ zh: zh[k], en: en[k], ko: ko[k], th: th[k] });
    });
    return map;
  }
  var activeLocaleMap = null;
  var SWAP_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  function swapInTree(root, map) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var trimmed = (node.nodeValue || '').trim();
      if (trimmed && Object.prototype.hasOwnProperty.call(map, trimmed)) {
        node.nodeValue = node.nodeValue.replace(trimmed, map[trimmed]);
      }
    }
    /* header-account-link 等按鈕的 aria-label/title、遊戲卡 img 的 alt 都是用
       D.T(烘焙基準字典)在產生 HTML 當下就寫死的屬性值,不是文字節點,
       TreeWalker 掃不到,要另外逐一比對這幾個屬性。 */
    SWAP_ATTRS.forEach(function (attr) {
      var els = root.querySelectorAll ? root.querySelectorAll('[' + attr + ']') : [];
      Array.prototype.forEach.call(els, function (el) {
        var v = el.getAttribute(attr);
        if (v && Object.prototype.hasOwnProperty.call(map, v)) el.setAttribute(attr, map[v]);
      });
    });
  }
  var LOCALE_LANG_ATTR = { zh: 'zh-Hant', en: 'en', ko: 'ko', th: 'th' };
  function applyLocale(target, persist) {
    if (LOCALE_CODES.indexOf(target) === -1) return false;
    /* category banner 的烘焙字是設計原字(HOT GAMES/SLOT MACHINES...),
       與 I18N 標準文案(Hot Games/Slots)同 zh/ko/th 對應、純字串映射
       會失真;首次呼叫先快照原字,en 時精確還原(zh/ko/th 三者都走一般
       字典,不需要保留英文大寫設計感)。 */
    var bannerEls = $all('.category-hero-title, .category-hero-content p');
    bannerEls.forEach(function (el) {
      if (!el.getAttribute('data-i18n-orig')) el.setAttribute('data-i18n-orig', el.textContent.trim());
    });
    activeLocaleMap = localeSwapMap(target);
    swapInTree(document.body, activeLocaleMap);
    if (target === 'en') {
      bannerEls.forEach(function (el) { el.textContent = el.getAttribute('data-i18n-orig'); });
    }
    document.documentElement.setAttribute('lang', LOCALE_LANG_ATTR[target] || target);
    var entry = (D.LOCALES || []).filter(function (l) { return l.code === target; })[0];
    localeTriggerSpans().forEach(function (trigger) {
      trigger.textContent = entry ? (entry.short || entry.label) : target;
    });
    if (persist) { try { localStorage.setItem(LOCALE_KEY, target); } catch (e) {} }
    return true;
  }
  /* 動態產生的內容(modal 重繪、提款面板、QR 步驟、優惠詳情等)一律
     由這個 observer 自動套用當前語系,杜絕漏網。只觀察節點新增,
     swap 僅改既有 text node 內容,不會觸發自身。 */
  function initLocaleObserver() {
    var mo = new MutationObserver(function (records) {
      if (!activeLocaleMap) return;
      records.forEach(function (r) {
        Array.prototype.forEach.call(r.addedNodes, function (n) {
          if (n.nodeType === 1) swapInTree(n, activeLocaleMap);
          else if (n.nodeType === 3) {
            var t = (n.nodeValue || '').trim();
            if (t && Object.prototype.hasOwnProperty.call(activeLocaleMap, t)) {
              n.nodeValue = n.nodeValue.replace(t, activeLocaleMap[t]);
            }
          }
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  function localeTriggerSpans() {
    return $all('button > span').filter(function (s) {
      var t = s.textContent.trim();
      return t === '中文' || t === 'EN' || t === '한국어' || t === 'ไทย' || t === 'English';
    });
  }

  /* ============================================================
   * 前後台連動(public-config.ts 對應):/studio「套用到本站」
   * 寫入 localStorage 的 win100-public-config;前台開機套用
   * + storage 事件跨分頁即時同步(換膚、站名、公開皮膚/語系範圍)。
   * ========================================================== */
  function publicConfig() {
    try { return JSON.parse(localStorage.getItem('win100-public-config') || 'null'); } catch (e) { return null; }
  }
  function applyPublicConfigNow() {
    var cfg = publicConfig();
    if (!cfg) return;
    if (cfg.siteName && cfg.siteName.trim()) document.title = cfg.siteName.trim();
    if (cfg.skin && (D.THEME_KEYS || []).indexOf(cfg.skin) !== -1) {
      applyTheme(cfg.skin, false);
    }
    if (typeof cfg.showSkinButton === 'boolean') {
      $all('.skin-switcher-trigger').forEach(function (btn) {
        (btn.closest('.dd-trigger-wrap') || btn).style.display = cfg.showSkinButton ? '' : 'none';
      });
    }
    /* 已發佈的 chrome / 區塊順序·顯示開關·變體 —— 真站頂層才套用;
       /studio 預覽 iframe 由 draft 直接驅動(見 applyStudioSectionsNow)。
       homeVariants 的陣列順序即發佈時的區塊順序,邏輯對照
       applyStudioSectionsNow:陣列外的區塊隱藏,陣列內依序重排 +
       套用 enabled/variant。 */
    if (window.self === window.top) {
      if (cfg.chrome) applyChromeVariant(cfg.chrome);
      if (cfg.homeVariants && cfg.homeVariants.length) {
        var blocks = $all('[data-studio-block]');
        var byId = {};
        blocks.forEach(function (el) { byId[el.getAttribute('data-studio-block')] = el; });
        var parent = blocks[0] && blocks[0].parentNode;
        var want = {};
        cfg.homeVariants.forEach(function (s) { want[s.id] = true; });
        blocks.forEach(function (el) {
          if (!want[el.getAttribute('data-studio-block')]) el.style.display = 'none';
        });
        cfg.homeVariants.forEach(function (s) {
          var el = byId[s.id];
          if (!el) return;
          el.style.display = (s.enabled === false) ? 'none' : '';
          if (parent) parent.appendChild(el);
          applyWeb3Variant(el, s.block, s.variant);
        });
      }
    }
  }
  function initPublicConfigSync() {
    applyPublicConfigNow();
    window.addEventListener('storage', function (ev) {
      if (ev.key === 'win100-public-config') applyPublicConfigNow();
    });
  }

  /* ============================================================
   * WEB3 變體套用:依 /studio 選定的變體(v2-v10)為區塊/chrome 掛上
   * .web3-module--{blockKey}.web3-layout--vN(對應 app.css 的 WEB3 BLOCK
   * LAYOUT SYSTEM);v1 = 移除所有 web3 class 回到烘焙原始版面。
   * ========================================================== */
  function applyWeb3Variant(el, blockKey, variant) {
    if (!el || !el.classList) return;
    var toRemove = [];
    for (var i = 0; i < el.classList.length; i++) {
      var c = el.classList[i];
      if (c === 'web3-module' || c.indexOf('web3-module--') === 0 || c.indexOf('web3-layout--') === 0) toRemove.push(c);
    }
    toRemove.forEach(function (c) { el.classList.remove(c); });
    el.removeAttribute('data-web3-layout');
    if (blockKey && variant && variant !== 'v1') {
      el.classList.add('web3-module');
      el.classList.add('web3-module--' + blockKey);
      el.classList.add('web3-layout--' + variant);
      el.setAttribute('data-web3-layout', variant);
    }
  }
  /* chrome(全站 header/footer)變體:真站頂層與 /studio 預覽共用同一套用邏輯 */
  function applyChromeVariant(chrome) {
    if (!chrome) return;
    applyWeb3Variant(document.querySelector('header'), 'site-header', chrome.header);
    applyWeb3Variant(document.querySelector('footer'), 'site-footer', chrome.footer);
  }
  /* /studio 預覽:依 draft.chrome 套 header/footer 變體(僅 iframe 內作用) */
  function applyStudioChromeNow() {
    if (window.self === window.top) return;
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem('win100-studio-draft') || 'null'); } catch (e) { return; }
    if (draft && draft.chrome) applyChromeVariant(draft.chrome);
  }

  /* ============================================================
   * /studio 區塊草稿預覽(studio-draft.ts 對應):設計後台把首頁區塊順序/
   * 顯示開關寫進 localStorage['win100-studio-draft'];本函式依該草稿對本頁
   * [data-studio-block] 標記的首頁區塊「重排 + 顯示/隱藏 + 變體」。
   * 只在 /studio 預覽 iframe(window.self !== window.top)內作用 —— 真站
   * 頂層瀏覽一律保持原樣,不受任何遺留草稿影響。
   * ========================================================== */
  function applyStudioSectionsNow() {
    var blocks = $all('[data-studio-block]');
    if (!blocks.length) return;                 /* 非首頁 / 無標記 → 不動作 */
    if (window.self === window.top) return;     /* 真站頂層瀏覽 → 保持原樣 */
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem('win100-studio-draft') || 'null'); } catch (e) { return; }
    var home = draft && draft.pages && draft.pages.home;
    var sections = home && home.sections;
    if (!sections || !sections.length) return;  /* 無草稿 → 前台原樣 */
    var byId = {};
    blocks.forEach(function (el) { byId[el.getAttribute('data-studio-block')] = el; });
    var parent = blocks[0].parentNode;
    var want = {};
    sections.forEach(function (s) { want[s.id] = true; });
    /* 草稿已移除的區塊先隱藏 */
    blocks.forEach(function (el) {
      if (!want[el.getAttribute('data-studio-block')]) el.style.display = 'none';
    });
    /* 依草稿順序重排,並套用顯示開關 + 變體 */
    sections.forEach(function (s) {
      var el = byId[s.id];
      if (!el) return;
      el.style.display = (s.enabled === false) ? 'none' : '';
      parent.appendChild(el);
      applyWeb3Variant(el, s.block, s.variant);
    });
  }
  /* 供同源的 /studio 直呼,免等 storage 事件即時反映(區塊 + chrome) */
  window.__win100ApplyStudioSections = function () {
    applyStudioSectionsNow();
    applyStudioChromeNow();
  };
  function initStudioSectionsSync() {
    applyStudioSectionsNow();
    applyStudioChromeNow();
    window.addEventListener('storage', function (ev) {
      if (ev.key === 'win100-studio-draft') { applyStudioSectionsNow(); applyStudioChromeNow(); }
    });
  }

  function initLocaleSwitcher() {
    $all('button').forEach(function (btn) {
      var span = btn.querySelector('span');
      if (!span || span.textContent.trim() !== '中文') return;
      if ($all('svg', btn).length < 2) return;
      var wrap = btn.parentElement;
      var panel = null, backdrop = null;
      function close() {
        if (panel) { panel.remove(); panel = null; }
        if (backdrop) { backdrop.remove(); backdrop = null; }
      }
      function open() {
        backdrop = document.createElement('div');
        backdrop.className = 'dd-backdrop';
        on(backdrop, 'click', close);
        wrap.appendChild(backdrop);
        panel = document.createElement('div');
        panel.className = 'dd-panel dd-panel--right';
        panel.innerHTML = buildLocalePanelHtml();
        wrap.appendChild(panel);
        $all('[data-locale-option]', panel).forEach(function (opt) {
          on(opt, 'click', function () {
            close();
            applyLocale(opt.getAttribute('data-locale-option'), true);
          });
        });
      }
      on(btn, 'click', function (e) {
        e.stopPropagation();
        if (panel) close(); else open();
      });
    });
  }

  /* ============================ nav dd-panel ============================= */
  /* Header 導覽列 hover 下拉選單(Sports/Live) */

  function initNavDropdowns() {
    $all('nav .dd-trigger-wrap').forEach(function (wrap) {
      var panel = $('.dd-panel', wrap);
      if (!panel) return;
      var timer = null;
      function show() { if (timer) clearTimeout(timer); panel.style.display = ''; }
      function hide() { timer = setTimeout(function () { panel.style.display = 'none'; }, 160); }
      on(wrap, 'mouseenter', show);
      on(wrap, 'mouseleave', hide);
      on(wrap, 'click', function (e) {
        if (e.target.closest('.dd-panel')) return;
        panel.style.display === 'none' ? show() : hide();
      });
    });
  }

  /* ============================ mobile menus ============================= */

  function mobileLoggedInBlockHtml() {
    var T = D.T || {};
    return (
      '<div class="mobile-account-block">' +
      '<div class="mobile-account-avatar">' + iconSvg('user', 'mobile-account-avatar-icon') + '</div>' +
      '<div class="mobile-account-info"><div class="mobile-account-name-row"><span class="mobile-account-name">meqomcao</span><span class="mobile-account-vip">VIP1</span>' +
      '<button type="button" class="header-account-link" style="margin-left:auto" data-logout aria-label="' + escapeHtml(T.logout) + '">' + iconSvg('log-out', 'icon-lg') + '</button></div>' +
      '<div class="mobile-account-stat-row mobile-account-stat-row--first"><span class="mobile-account-stat-label">' + escapeHtml(T.accountBalance) + '</span><span class="mobile-account-stat-label">: </span><span class="mobile-account-stat-value">₩1,000,000,000</span></div>' +
      '<div class="mobile-account-stat-row"><span class="mobile-account-stat-label">' + escapeHtml(T.accountPoints) + '</span><span class="mobile-account-stat-label">: </span><span class="mobile-account-stat-value">0.00</span></div></div></div>' +
      '<a href="account.html" class="mobile-account-view-btn" style="padding:10px 18px;text-decoration:none">' + escapeHtml(T.accountView) + '</a>'
    );
  }

  function navLinksHtml() {
    return (D.NAV_LINKS || []).map(function (l) {
      var active = isActivePage(l.href);
      return '<a href="' + l.href + '" class="mobile-nav-link' + (active ? ' is-active' : '') +
        '" style="text-decoration:none" data-mobile-nav-link>' + iconSvg(l.icon, 'mobile-nav-link-icon') + '<span>' + escapeHtml(l.label) + '</span></a>';
    }).join('');
  }

  function buildAppHeaderMobileMenu() {
    var links = D.NAV_LINKS || [];
    var T = D.T || {};
    var bottom = authState.loggedIn ? mobileLoggedInBlockHtml() : (
      '<button style="display:block;width:100%;text-align:left;padding:12px 14px;background:none;border:0;color:#fff;cursor:pointer;font-weight:600;font-size:15px" data-mobile-login>' + escapeHtml(T.login) + '</button>' +
      '<button class="btn-primary w-full" style="padding:12px 14px;font-size:15px;margin-top:4px" data-mobile-register>' + escapeHtml(T.register) + '</button>'
    );
    return (
      '<div class="header-mobile-menu-overlay" style="background:rgba(0,0,0,.6)" data-mobile-overlay>' +
      '<div class="header-mobile-menu-panel">' +
      '<div class="header-mobile-menu-head">' +
      '<img src="logo.png" alt="Casino Logo" class="header-mobile-menu-logo">' +
      '<button class="header-mobile-menu-close" aria-label="Close menu" data-mobile-close>' + iconSvg('x', 'icon-xl') + '</button></div>' +
      '<nav class="header-mobile-menu-nav" style="grid-template-rows:repeat(' + links.length + ',minmax(0,1fr))">' + navLinksHtml() + '</nav>' +
      '<div class="header-mobile-menu-foot" data-mobile-bottom>' + bottom + '</div>' +
      '</div></div>'
    );
  }

  function buildMemberHeaderMobileMenu() {
    var links = D.NAV_LINKS || [];
    return (
      '<div class="header-mobile-menu-overlay" style="background:rgba(0,0,0,.6)" data-mobile-overlay>' +
      '<div class="header-mobile-menu-panel">' +
      '<div class="header-mobile-menu-head">' +
      '<img src="logo.png" alt="Casino Logo" class="header-mobile-menu-logo">' +
      '<button class="header-mobile-menu-close" aria-label="Close menu" data-mobile-close>' + iconSvg('x', 'icon-xl') + '</button></div>' +
      '<nav class="header-mobile-menu-nav" style="grid-template-rows:repeat(' + links.length + ',minmax(0,1fr))">' + navLinksHtml() + '</nav>' +
      '<div class="header-mobile-menu-foot">' + mobileLoggedInBlockHtml() + '</div>' +
      '</div></div>'
    );
  }

  var mobileOverlayRoot = null;
  function closeMobileOverlay() { if (mobileOverlayRoot) { mobileOverlayRoot.remove(); mobileOverlayRoot = null; unlockBodyScroll(); } }
  function openMobileOverlay(html) {
    closeMobileOverlay();
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    mobileOverlayRoot = wrap.firstElementChild;
    document.body.appendChild(mobileOverlayRoot);
    lockBodyScroll();
    on(mobileOverlayRoot, 'click', function (e) { if (e.target === mobileOverlayRoot) closeMobileOverlay(); });
    on(mobileOverlayRoot.querySelector('[data-mobile-close]'), 'click', closeMobileOverlay);
    $all('[data-mobile-nav-link]', mobileOverlayRoot).forEach(function (a) { on(a, 'click', closeMobileOverlay); });
    on(mobileOverlayRoot.querySelector('[data-mobile-login]'), 'click', function () { closeMobileOverlay(); openAuth('login'); });
    on(mobileOverlayRoot.querySelector('[data-mobile-register]'), 'click', function () { closeMobileOverlay(); openAuth('register'); });
    bindAccountBarLogout(mobileOverlayRoot);
  }

  function initHeaderMobileMenus() {
    $all('header').forEach(function (header) {
      var hamburgerBtn = header.querySelector('button[aria-label="Menu"]');
      if (!hamburgerBtn) return;
      var isAppHeader = !!header.querySelector('[aria-label="Switch skin"]');
      on(hamburgerBtn, 'click', function () {
        openMobileOverlay(isAppHeader ? buildAppHeaderMobileMenu() : buildMemberHeaderMobileMenu());
      });
    });
  }

  /* MemberMenuDrawer.vue — mobile bottom nav "Browse" button (left drawer) */

  function buildMemberDrawerHtml() {
    var links = D.MEMBER_MENU_LINKS || [];
    var rows = links.map(function (l) {
      /* Customer Service 一列改走 data-cs-open 代理點擊 openCsModal(),
         不導頁(見 initCsOpenTriggers)。 */
      var active = !l.csOpen && isActivePage(l.href);
      return '<a href="' + l.href + '" class="mmd-row' + (active ? ' active' : '') + '"' + (l.csOpen ? ' data-cs-open' : '') + '>' + iconSvg(l.icon, 'mmd-icon') + '<span>' + escapeHtml(l.label) + '</span></a>';
    }).join('');
    return (
      '<div class="mmd-overlay" data-mmd-overlay>' +
      '<div class="mmd-panel">' +
      '<div class="mmd-head"><span>Menu</span><button type="button" aria-label="Close menu" data-mmd-close>' + iconSvg('x', 'icon-md') + '</button></div>' +
      '<nav class="mmd-links" style="grid-template-rows:repeat(' + links.length + ',minmax(0,1fr))">' + rows + '</nav>' +
      '</div></div>'
    );
  }

  var memberDrawerRoot = null;
  function closeMemberDrawer() { if (memberDrawerRoot) { memberDrawerRoot.remove(); memberDrawerRoot = null; unlockBodyScroll(); } }
  function openMemberDrawer() {
    closeMemberDrawer();
    var wrap = document.createElement('div');
    wrap.innerHTML = buildMemberDrawerHtml();
    memberDrawerRoot = wrap.firstElementChild;
    document.body.appendChild(memberDrawerRoot);
    lockBodyScroll();
    on(memberDrawerRoot, 'click', function (e) { if (e.target === memberDrawerRoot) closeMemberDrawer(); });
    on(memberDrawerRoot.querySelector('[data-mmd-close]'), 'click', closeMemberDrawer);
    $all('.mmd-row', memberDrawerRoot).forEach(function (a) { on(a, 'click', closeMemberDrawer); });
  }

  function initMobileBottomNav() {
    var browseLabel = (D.T || {}).browse || '瀏覽';
    var browseBtn = $all('.mobile-bottom-nav button').filter(function (b) {
      return (b.textContent || '').replace(/\s+/g, '') === browseLabel;
    })[0];
    on(browseBtn, 'click', openMemberDrawer);
  }

  /* ============================== auth modal ============================= */
  /* AuthModal.vue — Teleport'd, v-if so absent from the static DOM entirely;
     built on demand. Login has no validation in the source app either (dev
     bypass): submit just flips loggedIn and closes. */

  var AUTH_FIELDS = {
    login: [
      { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter your username' },
      { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password', eye: true },
    ],
    register: [
      { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter your username' },
      { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password', eye: true },
      { name: 'confirm', label: 'Confirm Password', type: 'password', placeholder: 'Confirm your password', eye: true },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
      { name: 'realname', label: 'Real Name', type: 'text', placeholder: 'Enter your real name' },
      { name: 'mobile', label: 'Mobile Number', type: 'tel', placeholder: 'Enter your mobile number' },
    ],
    forgot: [
      { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter your username' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
    ],
  };
  var AUTH_TITLES = { login: 'Login', register: 'Register', forgot: 'Forgot Password' };
  function readPersistedLogin() {
    try { return localStorage.getItem(LOGIN_KEY) === '1'; } catch (e) { return false; }
  }
  function persistLogin(loggedIn) {
    try {
      if (loggedIn) localStorage.setItem(LOGIN_KEY, '1');
      else localStorage.removeItem(LOGIN_KEY);
    } catch (e) {}
  }
  var authState = { loggedIn: readPersistedLogin() };

  function authFieldError(name, values) {
    var raw = values[name] || '';
    var v = raw.trim();
    switch (name) {
      case 'username':
        if (!v) return 'Please enter your username.';
        if (v.length < 3 || v.length > 16) return 'Username must be 3-16 characters.';
        return '';
      case 'password':
        if (raw.length < 5 || raw.length > 16) return 'Length must be 5-16 characters.';
        return '';
      case 'confirm':
        if (raw !== values.password) return 'The two passwords do not match.';
        return '';
      case 'email':
        if (!/^\S+@\S+\.\S+$/.test(v)) return 'Please enter a valid email address.';
        return '';
      case 'realname':
        if (!v) return 'Please enter your real name.';
        return '';
      case 'mobile':
        if (!/^\+?[0-9][0-9 -]{6,14}$/.test(v)) return 'Please enter a valid mobile number.';
        return '';
    }
    return '';
  }

  var authRoot = null;

  function closeAuth() {
    if (authRoot) { authRoot.remove(); authRoot = null; unlockBodyScroll(); }
    document.removeEventListener('keydown', onAuthKeydown);
  }
  function onAuthKeydown(e) { if (e.key === 'Escape') closeAuth(); }

  function authBodyHtml(mode) {
    var fields = AUTH_FIELDS[mode] || AUTH_FIELDS.login;
    var fieldsHtml = fields.map(function (f) {
      return (
        '<label class="auth-field-label">' + f.label + '</label>' +
        '<div class="auth-field-wrap">' +
        '<input data-field="' + f.name + '" type="' + f.type + '" placeholder="' + f.placeholder + '" class="a-input' + (f.eye ? ' a-input--eye' : '') + '">' +
        (f.eye ? '<button type="button" data-eye="' + f.name + '" class="auth-field-eye">' + iconSvg('eye') + '</button>' : '') +
        '</div>' +
        '<p data-error="' + f.name + '" class="auth-field-error" hidden></p>'
      );
    }).join('');
    return (
      fieldsHtml +
      (mode === 'login'
        ? '<div class="auth-remember-row"><label class="auth-remember-label"><input type="checkbox" class="auth-remember-checkbox">Remember me</label><a class="a-link font-semibold" data-auth-goto="forgot">Forgot Password?</a></div>'
        : '') +
      '<button class="a-btn" type="button" data-auth-submit>' + (mode === 'register' ? 'Next Step' : mode === 'forgot' ? 'Send Reset Link' : 'Login') + '</button>' +
      (mode === 'login' ? '<p class="auth-switch-text">Don’t have an account? <a class="a-link" data-auth-goto="register">Register</a></p>'
        : mode === 'register' ? '<p class="auth-switch-text">Already have an account? <a class="a-link" data-auth-goto="login">Login</a></p>'
        : '<p class="auth-switch-text">Remember your password? <a class="a-link" data-auth-goto="login">Back to Login</a></p>')
    );
  }

  function authResetSentHtml() {
    return (
      '<p class="auth-reset-title">Reset link sent</p>' +
      '<p class="auth-reset-desc">If the account exists, password reset instructions have been sent to your email.</p>' +
      '<button class="a-btn" type="button" data-auth-goto="login">Back to Login</button>'
    );
  }

  /* 已登入帳號列:單一權威 markup,前台頁(取代 Login/Register 鈕)與 member 頁
     (插入 header 右側)共用同一份,不重複維護兩份等價 HTML。 */
  function accountBarHtml() {
    var T = D.T || {};
    return (
      '<a href="account.html" class="header-account-link" aria-label="Account">' + iconSvg('user', 'icon-lg') + '</a>' +
      '<a href="account.html" class="header-account-link header-account-link--id">' +
      '<span class="header-account-id-label">' + escapeHtml(T.accountId) + '</span><span class="header-account-id-label">:</span>' +
      '<span class="header-account-id-value">meqomcao</span>' +
      '<span class="header-account-vip">VIP1</span></a>' +
      '<span class="header-account-divider"></span>' +
      '<a href="account.html" class="header-account-balance">' +
      '<span class="header-balance-label">' + escapeHtml(T.accountBalance) + '</span><span class="header-balance-label">:</span><span class="header-balance-value">₩1,000,000,000</span>' +
      '<span class="header-balance-label header-balance-label--spaced">' + escapeHtml(T.accountPoints) + '</span><span class="header-balance-label">:</span><span class="header-balance-value">0.00</span></a>' +
      '<button type="button" class="header-account-link" data-logout aria-label="' + escapeHtml(T.logout) + '">' + iconSvg('log-out', 'icon-lg') + '</button>'
    );
  }
  function bindAccountBarLogout(root) {
    $all('[data-logout]', root).forEach(function (btn) {
      on(btn, 'click', function () { persistLogin(false); location.reload(); });
    });
  }

  function applyLoggedInHeaderUI() {
    var T = D.T || {};
    $all('header').forEach(function (header) {
      var loginBtn = $all('button', header).filter(function (b) { return (b.textContent || '').trim() === T.login; })[0];
      var registerBtn = $all('button', header).filter(function (b) { return (b.textContent || '').trim() === T.register; })[0];
      if (!loginBtn || !registerBtn) return;
      var bar = loginBtn.parentElement;
      loginBtn.remove();
      registerBtn.remove();
      bar.insertAdjacentHTML('afterbegin', accountBarHtml());
      bindAccountBarLogout(bar);
    });
  }

  function localeTriggerHtml() {
    return (
      '<div class="dd-trigger-wrap"><button class="header-locale-trigger">' +
      iconSvg('globe', 'icon-sm') + '<span>中文</span>' + iconSvg('chevron-down', 'icon-xs') +
      '</button></div>'
    );
  }
  function applyMemberHeaderAccountBar() {
    if (!isMemberPage()) return;
    $all('header').forEach(function (header) {
      if (header.querySelector('[data-member-account-bar]')) return;
      var mobileWrap = header.querySelector('.header-mobile-controls');
      var row = mobileWrap ? mobileWrap.parentElement : header.querySelector('.site-header-row');
      if (!row) return;
      var bar = document.createElement('div');
      bar.className = 'header-account-bar';
      bar.setAttribute('data-member-account-bar', '');
      bar.innerHTML = accountBarHtml() + localeTriggerHtml();
      if (mobileWrap) row.insertBefore(bar, mobileWrap);
      else row.appendChild(bar);
      bindAccountBarLogout(bar);
    });
  }

  function bindAuthBody(mode) {
    $all('[data-auth-goto]', authRoot).forEach(function (a) {
      on(a, 'click', function (e) { e.preventDefault(); openAuth(a.getAttribute('data-auth-goto')); });
    });
    $all('[data-eye]', authRoot).forEach(function (btn) {
      on(btn, 'click', function () {
        var input = authRoot.querySelector('[data-field="' + btn.getAttribute('data-eye') + '"]');
        if (!input) return;
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.classList.toggle('is-active', !showing);
      });
    });
    var submitBtn = authRoot.querySelector('[data-auth-submit]');
    on(submitBtn, 'click', function () {
      if (mode === 'login') {
        authState.loggedIn = true;
        persistLogin(true);
        closeAuth();
        applyLoggedInHeaderUI();
        return;
      }
      var fields = AUTH_FIELDS[mode] || [];
      var values = {};
      fields.forEach(function (f) {
        var input = authRoot.querySelector('[data-field="' + f.name + '"]');
        values[f.name] = input ? input.value : '';
      });
      var ok = true;
      fields.forEach(function (f) {
        var msg = authFieldError(f.name, values);
        var errEl = authRoot.querySelector('[data-error="' + f.name + '"]');
        var inputEl = authRoot.querySelector('[data-field="' + f.name + '"]');
        if (msg) { ok = false; }
        if (errEl) { errEl.textContent = msg; errEl.hidden = !msg; }
        if (inputEl) inputEl.classList.toggle('input-ui-invalid', !!msg);
      });
      if (!ok) return;
      if (mode === 'forgot') {
        var body = authRoot.querySelector('[data-auth-body]');
        body.innerHTML = authResetSentHtml();
        bindAuthBody(mode);
        return;
      }
      authState.loggedIn = true;
      persistLogin(true);
      closeAuth();
      applyLoggedInHeaderUI();
    });
  }

  function openAuth(mode) {
    closeAuth();
    var title = AUTH_TITLES[mode] || 'Login';
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="auth-modal-overlay" data-auth-overlay>' +
      '<div class="auth-modal-box">' +
      '<div class="auth-modal-head">' +
      '<h3 class="auth-modal-title">' + title + '</h3>' +
      '<button type="button" data-auth-close class="auth-modal-close">×</button>' +
      '</div><div class="auth-modal-body" data-auth-body>' + authBodyHtml(mode) + '</div></div></div>';
    authRoot = wrap.firstElementChild;
    document.body.appendChild(authRoot);
    lockBodyScroll();
    document.addEventListener('keydown', onAuthKeydown);
    on(authRoot, 'click', function (e) { if (e.target === authRoot) closeAuth(); });
    on(authRoot.querySelector('[data-auth-close]'), 'click', closeAuth);
    bindAuthBody(mode);
  }

  function initAuthTriggers() {
    if (authState.loggedIn) { applyLoggedInHeaderUI(); return; }
    $all('header button').forEach(function (btn) {
      var text = (btn.textContent || '').trim();
      if (text === (D.T || {}).login) on(btn, 'click', function () { openAuth('login'); });
      else if (text === (D.T || {}).register) on(btn, 'click', function () { openAuth('register'); });
    });
  }

  /* ================================ banner =============================== */
  /* AppBanner.vue — index.html only, one slide server-rendered at a time. */

  function initBanner() {
    var section = document.querySelector('.campaign-hero');
    var banners = D.BANNERS || [];
    if (!section || !banners.length) return;

    var idx = 0;
    var initId = section.getAttribute('data-campaign');
    for (var bi = 0; bi < banners.length; bi++) { if (String(banners[bi].id) === String(initId)) { idx = bi; break; } }

    var media = section.querySelector('.campaign-hero-media');
    var eyebrowSpans = $all('.campaign-hero-eyebrow span', section);
    var badge = eyebrowSpans[eyebrowSpans.length - 1];
    var title = section.querySelector('.campaign-hero-title');
    var highlight = section.querySelector('.campaign-hero-highlight');
    var sub = section.querySelector('.campaign-hero-sub');
    var cta = section.querySelector('.campaign-hero-cta');
    var dots = $all('.campaign-hero-dot', section);
    var prevBtn = section.querySelector('.campaign-hero-arrow--prev');
    var nextBtn = section.querySelector('.campaign-hero-arrow--next');
    var timer = null;

    function render(i) {
      idx = i;
      var b = banners[idx];
      section.setAttribute('data-campaign', b.id);
      if (media) { media.src = b.img; media.alt = b.title; media.style.objectPosition = b.focalPoint || 'center'; media.hidden = false; }
      if (badge) badge.textContent = b.badge;
      if (title) title.textContent = b.title;
      if (highlight) highlight.textContent = b.highlight;
      if (sub) sub.textContent = b.sub;
      if (cta) cta.textContent = b.cta;
      dots.forEach(function (d, di) {
        var active = di === idx;
        d.classList.toggle('campaign-hero-dot--active', active);
        if (active) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }
    function next() { render((idx + 1) % banners.length); }
    function prev() { render((idx - 1 + banners.length) % banners.length); }
    function restart() {
      if (timer) clearInterval(timer);
      timer = banners.length > 1 ? setInterval(next, 6000) : null;
    }
    on(prevBtn, 'click', function () { prev(); restart(); });
    on(nextBtn, 'click', function () { next(); restart(); });
    dots.forEach(function (d, di) { on(d, 'click', function () { render(di); restart(); }); });
    on(media, 'error', function () { media.hidden = true; });
    on(section, 'mouseenter', function () { if (timer) clearInterval(timer); });
    on(section, 'mouseleave', restart);

    var startX = 0;
    on(section, 'touchstart', function (e) { startX = e.touches[0] ? e.touches[0].clientX : 0; }, { passive: true });
    on(section, 'touchend', function (e) {
      var endX = (e.changedTouches[0] && e.changedTouches[0].clientX) || startX;
      var dx = endX - startX;
      if (dx < -40) next(); else if (dx > 40) prev();
      restart();
    });

    restart();
  }

  /* ============================ mini games grid =========================== */
  /* home/MiniGamesGrid.vue — index.html only. Tabs auto-advance every 8s via
     useCountdownTabs (250ms tick); rail prev/next move by visible-card-count
     via moveRail(). Markup for non-active tabs isn't in the static DOM, so
     panels are rebuilt from data.js on tab switch. */

  function miniGamesFor(key) {
    var names = (D.MINI_NAMES || {})[key] || [];
    if (key === 'live') {
      var tables = D.LIVE_TABLES || [];
      return names.map(function (title, i) {
        var t = tables.length ? tables[i % tables.length] : {};
        return { title: title, img: t.image, focalPoint: t.focalPoint || 'center' };
      });
    }
    var pool = D.MINI_IMG_POOL || [];
    return names.map(function (title, i) {
      return { title: title, img: pool.length ? pool[i % pool.length] : '', focalPoint: 'center' };
    });
  }
  function buildMiniCard(g) {
    return '<div data-game-card class="mini-game-card">' +
      '<div class="mini-game-card-media">' +
      '<img src="' + g.img + '" alt="' + escapeHtml(g.title) + '" class="mini-game-card-img" style="object-position:' + g.focalPoint + ';" loading="lazy"></div>' +
      '<h3 class="mini-game-card-name">' + escapeHtml(g.title) + '</h3></div>';
  }

  function initMiniGamesGrid() {
    var keys = ['mini', 'slot', 'live'];
    var tabs = {};
    var i;
    for (i = 0; i < keys.length; i++) {
      tabs[keys[i]] = document.getElementById('games-tab-' + keys[i]);
      if (!tabs[keys[i]]) return;
    }
    var headerRight = document.querySelector('.game-tabs-actions');
    var showAllLink = headerRight ? headerRight.querySelector('a') : null;
    var initialPanel = document.querySelector('[id^="games-panel-"]');
    var railWrap = initialPanel ? initialPanel.parentElement : null;
    if (!railWrap) return;

    var current = (initialPanel.id || 'games-panel-mini').replace('games-panel-', '');
    var INTERVAL = 8000;
    var remainingMs = INTERVAL;
    var tickHandle = null;

    function renderPanel(key) {
      var oldPanel = railWrap.querySelector('[id^="games-panel-"]');
      var games = miniGamesFor(key);
      var panel = document.createElement('div');
      panel.id = 'games-panel-' + key;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'games-tab-' + key);
      panel.className = 'mini-game-panel';
      panel.innerHTML = games.map(buildMiniCard).join('');
      if (oldPanel) railWrap.replaceChild(panel, oldPanel); else railWrap.appendChild(panel);
    }

    function setActive(key, silent) {
      current = key;
      renderPanel(key);
      keys.forEach(function (k) {
        var btn = tabs[k];
        var active = k === key;
        btn.setAttribute('aria-selected', String(active));
        btn.setAttribute('aria-controls', 'games-panel-' + k);
        btn.tabIndex = active ? 0 : -1;
        if (active) {
          btn.classList.add('is-active');
          if (!btn.querySelector('.mini-countdown-bar')) {
            btn.insertAdjacentHTML('beforeend', '<span aria-hidden="true" class="mini-countdown-bar"><span style="width:0%"></span></span>');
          }
        } else {
          btn.classList.remove('is-active');
          var oldBar = btn.querySelector('.mini-countdown-bar');
          if (oldBar) oldBar.remove();
        }
      });
      if (showAllLink && D.MINI_ROUTES) showAllLink.setAttribute('href', D.MINI_ROUTES[key]);
      if (!silent) restart();
    }

    function tick() {
      remainingMs -= 250;
      var barSpan = tabs[current].querySelector('.mini-countdown-bar > span');
      if (barSpan) barSpan.style.width = Math.max(0, Math.min(100, ((INTERVAL - remainingMs) / INTERVAL) * 100)) + '%';
      if (remainingMs <= 0) advance();
    }
    function advance() {
      var idx = keys.indexOf(current);
      setActive(keys[(idx + 1) % keys.length]);
    }
    function restart() { remainingMs = INTERVAL; }
    function startTimer() {
      if (tickHandle) clearInterval(tickHandle);
      tickHandle = setInterval(tick, 250);
    }

    keys.forEach(function (k) { on(tabs[k], 'click', function () { setActive(k); }); });

    var prevBtn = document.querySelector('[aria-label="Previous games"]');
    var nextBtn = document.querySelector('[aria-label="Next games"]');
    function moveRail(direction) {
      var rail = railWrap.querySelector('[id^="games-panel-"]');
      if (!rail) return;
      var card = rail.querySelector('[data-game-card]');
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 12;
      var cardWidth = (card && card.offsetWidth) || 128;
      var visible = Math.max(1, Math.floor((rail.clientWidth + gap) / (cardWidth + gap)));
      var jump = (cardWidth + gap) * visible;
      var maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      if (maxScroll <= 1) return;
      var target = direction > 0
        ? (rail.scrollLeft >= maxScroll - 2 ? 0 : Math.min(maxScroll, rail.scrollLeft + jump))
        : (rail.scrollLeft <= 2 ? maxScroll : Math.max(0, rail.scrollLeft - jump));
      restart();
      rail.scrollTo({ left: target, behavior: 'smooth' });
    }
    on(prevBtn, 'click', function () { moveRail(-1); });
    on(nextBtn, 'click', function () { moveRail(1); });

    restart();
    startTimer();
  }

  /* ============================ home rails (P1) =========================== */
  /* HotGamesRail / SportsPromo / Promotion(home) — index.html only. No shared
     class/aria-label on the chevrons, so scope by structural position: a
     ".rail-head" header whose container also holds exactly one scrollable
     rail (".match-rail" / ".game-rail" / ".promo-grid-desktop" — the live
     sport rail isn't header's immediate sibling since a hero banner sits
     between them, so match by the rail's own class instead of adjacency). */

  function initHomeRails() {
    $all('.rail-head').forEach(function (header) {
      var container = header.parentElement;
      var rail = container ? container.querySelector('.match-rail, .game-rail, .promo-grid-desktop') : null;
      if (!rail) return;
      var buttons = $all('button', header).filter(function (b) { return b.querySelector('svg'); });
      if (buttons.length < 2) return;
      var prevBtn = buttons[buttons.length - 2];
      var nextBtn = buttons[buttons.length - 1];
      on(prevBtn, 'click', function () { rail.scrollBy({ left: -300, behavior: 'smooth' }); });
      on(nextBtn, 'click', function () { rail.scrollBy({ left: 300, behavior: 'smooth' }); });
    });
  }

  /* ============================== mode-tabs =============================== */
  /* Generic ".mode-tabs" active-toggle (deposit.html gateways, withdrawal.html
     Withdraw/Account Management) — CLAUDE.md convention: unified tab class. */

  function initModeTabsGeneric() {
    $all('.mode-tabs').forEach(function (tabs) {
      var buttons = $all(':scope > button', tabs);
      buttons.forEach(function (btn) {
        on(btn, 'click', function () {
          buttons.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
        });
      });
    });
    $all('.payment-tabs').forEach(function (tabs) {
      var buttons = $all(':scope > button', tabs);
      buttons.forEach(function (btn) {
        on(btn, 'click', function () {
          if (btn.style.display === 'none') return;
          buttons.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
        });
      });
    });
  }

  /* ---- deposit.html: gateway -> payment-method count filter + promo cards
     enabling Next + two-step (form -> transfer) reconstruction (P1) ---- */

  function initDepositFlow() {
    if (pageName() !== 'deposit') return;
    var gatewayTabs = document.querySelector('.mode-tabs');
    var paymentTabs = document.querySelector('.payment-tabs');
    if (!gatewayTabs || !paymentTabs) return;
    var gatewayBtns = $all(':scope > button', gatewayTabs);
    var methodBtns = $all(':scope > button', paymentTabs);
    var gateways = D.DEPOSIT_GATEWAYS || [{ methodCount: 4 }, { methodCount: 3 }, { methodCount: 2 }, { methodCount: 1 }];

    gatewayBtns.forEach(function (btn, i) {
      on(btn, 'click', function () {
        var count = (gateways[i] || {}).methodCount || methodBtns.length;
        methodBtns.forEach(function (m, mi) { m.style.display = mi < count ? '' : 'none'; });
        var activeMethod = paymentTabs.querySelector('button.active');
        if (!activeMethod || activeMethod.style.display === 'none') {
          methodBtns.forEach(function (b) { b.classList.remove('active'); });
          methodBtns[0].classList.add('active');
        }
      });
    });

    $all('.promo-card, .crypto-promo').forEach(function (card) {
      on(card, 'click', function () {
        var section = card.closest('section');
        var siblings = section ? $all('.promo-card, .crypto-promo', section) : [card];
        siblings.forEach(function (c) {
          c.classList.remove('selected');
          var dot = c.querySelector('.pay-radio');
          if (dot) dot.innerHTML = '';
        });
        card.classList.add('selected');
        var dot = card.querySelector('.pay-radio');
        if (dot) dot.innerHTML = '<span></span>';
        var actionBtn = section ? section.querySelector('.pay-action') : null;
        if (actionBtn) { actionBtn.classList.add('ready'); actionBtn.disabled = false; }
      });
    });

    on(document.querySelector('.pay-action'), 'click', function (e) {
      var btn = e.currentTarget;
      if (btn.disabled) return;
      /* deposit.vue proceedFromForm():bank 直接進轉帳明細;
         LinePay/USDT 先過 QR 中繼步(掃碼/複製地址)再繼續 */
      var methodId = activeDepositMethodId();
      if (methodId === 'bank') {
        var amountInput = document.querySelector('.pay-field[aria-label="Deposit amount"]');
        showDepositTransferStep(amountInput ? amountInput.value : '₩ 10,000');
      } else {
        showDepositQrStep(methodId);
      }
    });
  }

  function showDepositTransferStep(amountVal) {
    var formCard = document.querySelector('.payment-card');
    var gatewayTabs = document.querySelector('.mode-tabs');
    var paymentTabs = document.querySelector('.payment-tabs');
    if (!formCard) return;
    [gatewayTabs, paymentTabs, formCard].forEach(function (el) { if (el) el.style.display = 'none'; });
    var section = document.createElement('section');
    section.className = 'payment-card transfer';
    section.innerHTML =
      '<div class="transfer-pill">Transfer Details</div>' +
      '<div class="trow"><span class="tlabel">Deposit Amount</span><span class="tamount">' + escapeHtml(amountVal) + '</span></div>' +
      '<div class="trow"><span class="tlabel">Deposit Account</span><span class="tvalue">wururu1234</span></div>' +
      '<p class="tnote">Once the transfer is complete, please click the "Complete" button below. Should you have any questions, please feel free to contact our Customer Service team.</p>' +
      '<p class="tcs"><a href="#" data-cs-open>Customer Service</a></p>' +
      '<button type="button" class="complete" data-deposit-complete><span>Complete</span></button>';
    formCard.parentElement.insertBefore(section, formCard.nextSibling);
    on(section.querySelector('[data-cs-open]'), 'click', function (e) { e.preventDefault(); openCsModal(); });
    on(section.querySelector('[data-deposit-complete]'), 'click', function () {
      showMemberModal({ type: 'success', message: 'Your deposit application has been submitted.' });
    });
  }

  /* =========================== vendor browser (P1) ========================= */
  /* VendorBrowser.vue — hot-games/live/slot/fish/mini-games. Event delegation
     on the shared container so rebuilt markup never needs re-binding. */

  function operationalMedia(kind, i) {
    var list = (D.VENDOR_MEDIA || {})[kind] || (D.VENDOR_MEDIA || {}).slot || [];
    if (!list.length) return { image: '', focalPoint: 'center' };
    var idx = ((i % list.length) + list.length) % list.length;
    return list[idx];
  }
  function buildVendorCard(name, i, kind) {
    var m = operationalMedia(kind, i);
    var isLive = kind === 'live';
    var T = D.T || {};
    return '<button type="button" class="vnd-card">' +
      '<img src="' + m.image + '" alt="" aria-hidden="true" class="vnd-card-media" style="object-position:' + m.focalPoint + ';" loading="lazy">' +
      '<div class="vnd-card-scrim"></div>' +
      '<span class="vnd-card-body">' +
      '<span class="vnd-name">' + escapeHtml(name) + '</span>' +
      (isLive ? '<span class="vnd-card-live-badge"><span class="vnd-card-live-dot"></span>' + escapeHtml(T.liveStudio) + '</span>' : '') +
      '</span></button>';
  }
  function buildGameCard(provider, i, kind) {
    var isLive = kind === 'live';
    var m = operationalMedia(kind, i);
    var T = D.T || {};
    var title = isLive ? (D.LIVE_GAME_NAMES || ['Game'])[i % (D.LIVE_GAME_NAMES || ['Game']).length] : T.gamePlaceholder;
    var favId = favIdFor(provider, i, kind);
    return '<div class="game-listing-card">' +
      '<div class="game-listing-card-media">' +
      '<img src="' + m.image + '" alt="' + escapeHtml(title) + '" class="game-listing-card-img" style="object-position:' + m.focalPoint + ';" loading="lazy">' +
      (isLive ? '<div class="game-listing-card-live-scrim"></div><span class="game-listing-card-live-badge"><span class="vnd-card-live-dot"></span>' + escapeHtml(T.liveDealer) + '</span>' : '') +
      favToggleHtml(favId) +
      '</div><div class="game-listing-card-body"><h3 class="game-listing-card-name">' + escapeHtml(title) + '</h3><p class="game-listing-card-provider">' + escapeHtml(provider) + '</p><button type="button" class="btn-primary btn-sm">' + escapeHtml(T.playNow) + '</button></div></div>';
  }

  function initVendorBrowser() {
    var KIND_MAP = { 'hot-games': 'hot-games', live: 'live', slot: 'slot', fish: 'fish', 'mini-games': 'mini-games' };
    var kind = KIND_MAP[pageName()];
    if (!kind) return;
    var head = document.querySelector('.vnd-head');
    if (!head) return;
    var container = head.parentElement;
    var direct = kind === 'hot-games';
    var vendors = (kind === 'live' ? D.LIVE_VENDORS : D.SLOT_VENDORS) || [];
    var titleEl = head.querySelector('.vnd-title');
    var titleBase = titleEl ? titleEl.textContent.trim() : '';
    var searchWrap = head.querySelector('.vnd-search');
    var searchInput = searchWrap ? searchWrap.querySelector('input') : null;
    var T = D.T || {};
    var MAX_LOADS = 3;
    var state = { provider: null, loads: 0, q: '', tab: 'vendor' };

    function filteredVendors() {
      var s = state.q.trim().toLowerCase();
      return !s ? vendors : vendors.filter(function (v) { return v.toLowerCase().indexOf(s) !== -1; });
    }
    function gamesList() {
      var base = direct ? 30 : 24;
      var total = base + state.loads * 12;
      var list = [];
      var k;
      if (direct) {
        for (k = 0; k < total; k++) list.push({ provider: vendors[k % vendors.length], i: k });
      } else if (state.provider) {
        for (k = 0; k < total; k++) list.push({ provider: state.provider, i: k });
      }
      var s = state.q.trim().toLowerCase();
      return s ? list.filter(function (g) { return g.provider.toLowerCase().indexOf(s) !== -1; }) : list;
    }
    function renderTitle() {
      if (!titleEl) return;
      if (state.provider) {
        titleEl.classList.add('vnd-title-inline');
        titleEl.innerHTML = '<span>' + escapeHtml(titleBase) + '</span><span class="vnd-provider-badge">' + escapeHtml(state.provider) + '</span>';
      } else {
        titleEl.classList.remove('vnd-title-inline');
        titleEl.textContent = titleBase;
      }
    }
    function renderBack() {
      var existing = container.querySelector('.btn-back');
      var showBack = !direct && !!state.provider;
      if (showBack && !existing) {
        var wrap = document.createElement('div');
        wrap.className = 'vnd-back-wrap';
        wrap.innerHTML = '<button type="button" class="btn-back">' + iconSvg('back', '') + '<span>' + escapeHtml(T.back) + '</span></button>';
        container.insertBefore(wrap, head);
      } else if (!showBack && existing) {
        existing.parentElement.remove();
      }
    }
    function updateLoadMore(show) {
      var wrap = container.querySelector('.cms-load-more-wrap');
      if (show && state.loads < MAX_LOADS) {
        if (!wrap) {
          wrap = document.createElement('div');
          wrap.className = 'cms-load-more-wrap';
          wrap.innerHTML = '<button type="button" class="cms-load-more-button">' + escapeHtml(T.loadMore) + '</button>';
          container.appendChild(wrap);
        }
      } else if (wrap) {
        wrap.remove();
      }
    }
    /* 搜尋框 placeholder 隨層級變動(廠商列表層搜的是廠商名稱,
       鑽進特定廠商後才是搜遊戲名稱)。不能沿用「先寫死 zh 字串、靠 applyLocale
       事後掃過去」這個套路 —— 那套機制靠的是 MutationObserver 監聽新增節點,
       但這裡是對「既有」input 元素改 placeholder 屬性(非新增節點),開機後
       (initVendorBrowser 先跑,applyLocale 才跑)第一次沒問題,可是使用者
       點進廠商、按返回等互動觸發的後續重繪就不會再被掃到,語系會卡住。改成
       直接用 D.I18N[currentLocale()] 即時查表(search.vendorName/
       game.placeholder,四語系皆有),每次呼叫都吃當前語系,不依賴事後掃描。 */
    function updateSearchPlaceholder() {
      if (!searchInput) return;
      var showingVendors = !direct && !state.provider;
      var dict = (D.I18N || {})[currentLocale()] || (D.I18N || {}).zh || {};
      searchInput.placeholder = showingVendors
        ? (dict['search.vendorName'] || T.searchVendor)
        : (dict['game.placeholder'] || T.gamePlaceholder);
    }
    function renderGrid() {
      var showingVendors = !direct && !state.provider;
      updateSearchPlaceholder();
      var oldVnd = container.querySelector('.vnd-grid');
      var oldGame = container.querySelector('.game-listing-grid');
      if (showingVendors) {
        if (oldGame) oldGame.remove();
        var grid = oldVnd;
        if (!grid) { grid = document.createElement('div'); grid.className = 'vnd-grid'; container.appendChild(grid); }
        grid.innerHTML = filteredVendors().map(function (v, i) { return buildVendorCard(v, i, kind); }).join('');
        updateLoadMore(false);
      } else {
        if (oldVnd) oldVnd.remove();
        var gGrid = oldGame;
        if (!gGrid) { gGrid = document.createElement('div'); gGrid.className = 'game-listing-grid'; container.appendChild(gGrid); }
        gGrid.innerHTML = gamesList().map(function (g) { return buildGameCard(g.provider, g.i, kind); }).join('');
        updateLoadMore(true);
      }
    }

    /* ---- Vendor / Favorites 頁簽:收藏清單為全站共用 — 任一分頁的 Favorites
       頁簽都顯示同一份清單,而非只顯示本頁 kind 的收藏。沿用共用 .mode-tabs,
       不另創頁簽樣式。 ---- */
    function favoritesGamesList() {
      return favoriteIds()
        .map(parseFavId)
        .filter(function (p) { return p.kind !== 'live' || p.i !== -1; });
    }
    function renderFavorites() {
      var oldVnd = container.querySelector('.vnd-grid');
      if (oldVnd) oldVnd.remove();
      var gGrid = container.querySelector('.game-listing-grid');
      if (!gGrid) { gGrid = document.createElement('div'); gGrid.className = 'game-listing-grid'; container.appendChild(gGrid); }
      var list = favoritesGamesList();
      gGrid.innerHTML = list.length
        ? list.map(function (p) { return buildGameCard(p.provider, p.i, p.kind); }).join('')
        : '<div class="fav-empty">' + escapeHtml(T.noFavorites) + '</div>';
      updateLoadMore(false);
    }
    function renderAll() {
      if (state.tab === 'favorites') {
        var existingBack = container.querySelector('.btn-back');
        if (existingBack) existingBack.parentElement.remove();
        if (searchWrap) searchWrap.style.display = 'none';
        if (titleEl) { titleEl.classList.remove('vnd-title-inline'); titleEl.textContent = titleBase; }
        renderFavorites();
        return;
      }
      if (searchWrap) searchWrap.style.display = '';
      renderBack();
      renderTitle();
      renderGrid();
    }

    var tabsWrap = document.createElement('div');
    tabsWrap.className = 'mode-tabs vnd-tabs';
    tabsWrap.innerHTML =
      '<button type="button" class="active">' + escapeHtml(T.vendor) + '</button>' +
      '<button type="button">' + escapeHtml(T.favorites) + '</button>';
    head.parentNode.insertBefore(tabsWrap, head.nextSibling);
    var tabButtons = $all(':scope > button', tabsWrap);
    tabButtons.forEach(function (btn, ti) {
      on(btn, 'click', function () {
        var tab = ti === 0 ? 'vendor' : 'favorites';
        if (tab === state.tab) return;
        state.tab = tab;
        tabButtons.forEach(function (b, bi) { b.classList.toggle('active', bi === ti); });
        renderAll();
      });
    });
    on(document, 'win100-favorite-change', function () {
      if (state.tab === 'favorites') renderFavorites();
    });

    on(searchInput, 'input', function () { state.q = searchInput.value; renderGrid(); });

    on(container, 'click', function (e) {
      var backBtn = e.target.closest('.btn-back');
      if (backBtn) { state.provider = null; state.loads = 0; renderAll(); return; }
      var loadBtn = e.target.closest('.cms-load-more-button');
      if (loadBtn) { if (state.loads < MAX_LOADS) { state.loads++; renderGrid(); } return; }
      var vCard = e.target.closest('.vnd-card');
      if (vCard && !direct) {
        var nameEl = vCard.querySelector('.vnd-name');
        state.provider = nameEl ? nameEl.textContent.trim() : '';
        state.loads = 0;
        renderAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    /* direct(hot-games.html)頁的初始遊戲卡是靜態烘焙、早於收藏功能存在,
       沒有 heart 按鈕 — 開機時用同一份 buildGameCard 邏輯重繪一次補上;
       其餘頁面初始畫面是廠商格(baked 已經正確,不需重繪),但 placeholder
       仍需補上一次(baked HTML 原本寫死「遊戲名稱」層級的字,非 direct 頁
       開機不會走 renderGrid())。 */
    if (direct) renderGrid();
    else updateSearchPlaceholder();
  }

  /* ============================ about.html tabs =========================== */
  /* about.vue — all 8 panels are v-show (already in the static DOM, just
     hidden), so this is pure show/hide + a FAQ accordion. */

  function initAboutTabs() {
    if (pageName() !== 'about') return;
    /* about.html 分頁沿用共用 .mode-tabs(CLAUDE.md 頁簽規範:唯一允許的頁簽樣式,
       active 狀態一律用 .active class,不得另創底線樣式)。initModeTabsGeneric()
       已對所有 .mode-tabs 掛上「點擊互斥切換 active」的通用邏輯,這裡只需再掛一層
       面板顯示/隱藏(以及自身的 active 管理,涵蓋 ?tab= 深連結這種非點擊觸發的
       初始化路徑,initModeTabsGeneric 的點擊監聽器不會處理這種情形)。 */
    var tabsWrap = document.querySelector('.mode-tabs');
    if (!tabsWrap) return;
    var buttons = $all(':scope > button', tabsWrap);
    var panels = [];
    var node = tabsWrap.nextElementSibling;
    while (node && panels.length < buttons.length) { panels.push(node); node = node.nextElementSibling; }
    if (!buttons.length || panels.length !== buttons.length) return;

    function setActive(i) {
      buttons.forEach(function (b, bi) { b.classList.toggle('active', bi === i); });
      panels.forEach(function (p, pi) { p.style.display = pi === i ? '' : 'none'; });
    }
    buttons.forEach(function (b, i) { on(b, 'click', function () { setActive(i); }); });

    /* Deep link (?tab=faq etc.): panels carry no ids in the static markup, so
       match against the tab keys from about.vue (= lowercased button labels). */
    var qs = new URLSearchParams(location.search);
    var qtab = (qs.get('tab') || '').toLowerCase();
    if (qtab) {
      buttons.forEach(function (b, bi) {
        if ((b.textContent || '').trim().toLowerCase() === qtab) setActive(bi);
      });
    }

    var faqPanel = panels[panels.length - 1];
    $all('.faq-card', faqPanel).forEach(function (card) {
      var btn = card.querySelector('button');
      if (!btn) return;
      on(btn, 'click', function () {
        card.classList.toggle('is-open');
      });
    });
  }

  function initUiKitTabsDemo() {
    if (pageName() !== 'ui-kit') return;
    var tabsWrap = document.querySelector('.mode-tabs');
    if (tabsWrap) {
      var buttons = $all(':scope > button', tabsWrap);
      var panels = [];
      var node = tabsWrap.nextElementSibling;
      while (node && panels.length < buttons.length) { panels.push(node); node = node.nextElementSibling; }
      if (buttons.length && panels.length === buttons.length) {
        buttons.forEach(function (b, i) {
          on(b, 'click', function () {
            buttons.forEach(function (bb, bi) { bb.classList.toggle('active', bi === i); });
            panels.forEach(function (p, pi) { p.style.display = pi === i ? '' : 'none'; });
          });
        });
      }
    }
    $all('.uikit-accordion-panel').forEach(function (panel) {
      var btn = panel.querySelector('.uikit-accordion-header');
      var body = panel.querySelector('.uikit-accordion-body');
      if (!btn || !body) return;
      on(btn, 'click', function () {
        var open = panel.classList.toggle('is-open');
        body.style.display = open ? '' : 'none';
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* 體育串關展開列（目前只有 betting-record.html 有 .rt-parlay-row，
     其餘 record 頁面靜態表格沒有這個 class，$all 拿到空陣列安全跳過）。 */
  function initBetRecordParlayRows() {
    $all('.rt-parlay-toggle').forEach(function (btn) {
      on(btn, 'click', function () {
        var row = btn.closest('.rt-parlay-row');
        var detail = row && row.nextElementSibling;
        if (!detail || !detail.classList.contains('rt-parlay-detail')) return;
        var open = row.classList.toggle('is-open');
        detail.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ============================ promotion detail =========================== */
  /* pages/promotion.vue PROMOS[] + list/detail toggle via ?detail=<id>. The
     "Detail" / "查看詳情" buttons exist in two places: promotion.html's own
     grid (in-page toggle) and the homepage's mini Promotion section, whose
     button navigates cross-page with the same query param (matches
     Promotion.vue's goDetail() -> router.push({path:'/promotion', query})). */

  function findPromoDetailButtons() {
    return $all('button').filter(function (b) {
      var t = (b.textContent || '').trim();
      return t === 'Detail' || t === '查看詳情';
    });
  }
  function promoById(id) {
    return (D.PROMOS || []).filter(function (p) { return p.id === id; })[0];
  }
  function promoByTitle(title) {
    return (D.PROMOS || []).filter(function (p) { return p.title === title; })[0];
  }

  function buildPromoDetailHtml(p) {
    return '' +
      '<section class="promotion-page-section">' +
      '<div class="app-container">' +
      '<div class="promotion-detail-wrap" data-promo-detail>' +
      '<button type="button" class="btn-back btn-back--promo-detail" aria-label="Back" data-promo-back>' +
      iconSvg('back') + '<span>Back</span></button>' +
      '<div class="promotion-detail-body">' +
      '<h2 class="promotion-detail-title">Promotion</h2>' +
      '<div class="promotion-detail-poster-bg">' +
      '<img src="' + p.img + '" alt="" aria-hidden="true" class="operation-promo-poster-media" style="object-position:' + p.focalPoint + ';">' +
      '<div class="operation-promo-poster-scrim"></div>' +
      '<div class="promotion-detail-poster-content">' +
      '<img class="promotion-detail-logo" src="logo.png" alt="WIN100%">' +
      '<div>' +
      '<p class="promotion-detail-eyebrow">Special Offer</p>' +
      '<h3 class="text-gradient-primary promotion-detail-headline">' + escapeHtml(p.headline) + '</h3>' +
      '<p class="promotion-detail-subtitle">' + escapeHtml(p.title) + '</p>' +
      '</div>' +
      '<div class="promotion-detail-grid">' +
      '<div class="promotion-detail-stat-card">' +
      '<div class="promotion-detail-stat-badge">1</div>' +
      '<h4 class="promotion-detail-stat-label">' + escapeHtml(p.primary) + '</h4>' +
      '<strong class="promotion-detail-stat-value">' + escapeHtml(p.primaryRate) + '</strong>' +
      '<span class="promotion-detail-stat-note">Max reward / rollover applies</span>' +
      '</div>' +
      '<div class="promotion-detail-stat-card">' +
      '<div class="promotion-detail-stat-badge">2</div>' +
      '<h4 class="promotion-detail-stat-label">' + escapeHtml(p.secondary) + '</h4>' +
      '<strong class="promotion-detail-stat-value">' + escapeHtml(p.secondaryRate) + '</strong>' +
      '<span class="promotion-detail-stat-note">Max reward / rollover applies</span>' +
      '</div>' +
      '</div>' +
      '<div class="promotion-detail-terms">' +
      '<h4 class="promotion-detail-terms-title">Promotion Terms</h4>' +
      '<ol class="promotion-detail-terms-list">' +
      '<li>Bonus rewards are calculated from eligible deposits and game turnover.</li>' +
      '<li>Cancelled bets, refunds, cashouts, and invalid results are not included.</li>' +
      '<li>Members must keep an active balance and meet rollover requirements.</li>' +
      '<li>Each completed promotion can only be claimed once.</li>' +
      '</ol>' +
      '</div>' +
      '<button class="promotion-detail-claim-btn" type="button">Claim Promotion</button>' +
      '<p class="promotion-detail-disclaimer">win100% reserves the right to adjust, pause, or end this promotion at any time.</p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>';
  }

  function initPromotionDetail() {
    var PROMOS = D.PROMOS || [];
    if (!PROMOS.length) return;

    var listSection = null;
    var heroSection = document.querySelector('.category-hero-media');
    var mount = null;
    var detailRoot = null;

    function backToList() {
      if (window.history && history.replaceState) history.replaceState(null, '', 'promotion.html');
      if (detailRoot) { detailRoot.remove(); detailRoot = null; }
      if (listSection) listSection.style.display = '';
      if (heroSection) heroSection.style.display = '';
    }
    function showDetail(id) {
      if (!listSection || !mount) return;
      var p = promoById(id) || PROMOS[0];
      if (window.history && history.replaceState) history.replaceState(null, '', 'promotion.html?detail=' + encodeURIComponent(p.id));
      listSection.style.display = 'none';
      if (heroSection) heroSection.style.display = 'none';
      if (detailRoot) detailRoot.remove();
      detailRoot = document.createElement('div');
      detailRoot.innerHTML = buildPromoDetailHtml(p);
      mount.insertBefore(detailRoot, listSection);
      on(detailRoot.querySelector('[data-promo-back]'), 'click', backToList);
      window.scrollTo(0, 0);
    }

    if (pageName() === 'promotion') {
      var firstCard = $all('.promotion-page-card, .promo-tile').filter(function (el) { return el.querySelector('h3'); })[0];
      listSection = firstCard ? firstCard.closest('section') : null;
      mount = listSection ? listSection.parentElement : null;
    }

    findPromoDetailButtons().forEach(function (btn) {
      var card = btn.closest('.promotion-page-card, .promo-tile');
      var h3 = card && card.querySelector('h3');
      var promo = h3 && promoByTitle(h3.textContent.trim());
      if (!promo) return;
      on(btn, 'click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (pageName() === 'promotion') showDetail(promo.id);
        else location.href = 'promotion.html?detail=' + encodeURIComponent(promo.id);
      });
    });

    if (pageName() !== 'promotion' || !listSection) return;
    var qs = new URLSearchParams(location.search);
    var initial = qs.get('detail');
    if (initial) showDetail(initial);
  }

  /* ========================== sport.html extras (P1) ======================= */

  function initSportProviderTabs() {
    if (pageName() !== 'sport') return;
    var wrap = document.querySelector('.sport-tabs');
    if (!wrap) return;
    var buttons = $all('button', wrap).filter(function (b) { return b.parentElement === wrap; });
    if (buttons.length !== 3) return;
    function activate(btn) {
      buttons.forEach(function (o) {
        var bar = o.querySelector('.sport-tab-underline');
        if (bar) bar.remove();
        o.classList.remove('is-active');
      });
      btn.classList.add('is-active');
      btn.insertAdjacentHTML('beforeend', '<div class="sport-tab-underline"></div>');
    }
    buttons.forEach(function (b) { on(b, 'click', function () { activate(b); }); });
    var qs = new URLSearchParams(location.search);
    var tab = qs.get('tab');
    if (tab) {
      var match = buttons.filter(function (b) { return b.textContent.trim().indexOf(tab) === 0; })[0];
      if (match) activate(match);
    }
  }

  function initSportLoadMore() {
    if (pageName() !== 'sport') return;
    var matches = D.SPORT_MATCHES || [];
    var grid = document.querySelector('.sport-match-grid');
    var wrap = document.querySelector('.cms-load-more-wrap');
    if (!grid || !matches.length) return;
    var loads = 0;
    var MAX_LOADS = 3;
    var STAR = '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>';
    var RADIO = '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>';
    function card(m) {
      return '<div class="sport-match-card"><div class="match-card-body">' +
        '<div class="match-card-head"><span class="match-card-league">' + escapeHtml(m.league) + '</span>' +
        '<div class="sport-match-actions"><button type="button" class="sport-match-fav"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sport-match-fav-icon">' + STAR + '</svg></button>' +
        '<span class="match-card-live-badge"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="match-card-live-icon">' + RADIO + '</svg>LIVE</span></div></div>' +
        '<div class="match-card-teams">' +
        '<div class="match-card-team"><div class="match-card-team-badge"><span class="match-card-team-code">' + escapeHtml(m.home.abbr) + '</span></div><span class="match-card-team-name">' + escapeHtml(m.home.name) + '</span></div>' +
        '<div class="match-card-score-wrap"><div class="match-card-score">' + escapeHtml(m.score) + '</div><div class="match-card-status">' + escapeHtml(m.time) + '</div></div>' +
        '<div class="match-card-team"><div class="match-card-team-badge"><span class="match-card-team-code">' + escapeHtml(m.away.abbr) + '</span></div><span class="match-card-team-name">' + escapeHtml(m.away.name) + '</span></div>' +
        '</div><button type="button" class="match-card-cta">Place Bet</button></div></div>';
    }
    var btn = wrap ? wrap.querySelector('button') : null;
    on(btn, 'click', function () {
      if (loads >= MAX_LOADS) return;
      loads++;
      grid.insertAdjacentHTML('beforeend', matches.map(card).join(''));
      if (loads >= MAX_LOADS && wrap) wrap.remove();
    });
  }

  /* ======================= member modal + member pages ===================== */

  var memberModalRoot = null;
  function closeMemberModal() { if (memberModalRoot) { memberModalRoot.remove(); memberModalRoot = null; unlockBodyScroll(); } }
  function showMemberModal(opts) {
    closeMemberModal();
    var type = opts.type || 'success';
    var title = opts.title || (type === 'warning' ? 'Warning' : type === 'confirm' ? 'Confirmation' : type === 'danger' ? 'Delete Account?' : 'Success!');
    var message = opts.message != null ? opts.message : (type === 'success' ? 'Profile updated successfully.' : '');
    var confirmText = opts.confirmText || (type === 'confirm' ? 'Yes' : type === 'danger' ? 'Delete' : 'Got It');
    var cancelText = opts.cancelText || (type === 'danger' ? 'Cancel' : 'No');
    var ICON = {
      success: { d: '<path d="M20 6 9 17l-5-5"/>', w: 3 },
      warning: { d: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', w: 2 },
      danger: { d: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/>', w: 2.2 },
      confirm: { d: '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', w: 2.4 },
    };
    var ic = ICON[type] || ICON.success;
    var wrap = document.createElement('div');
    wrap.className = 'mf-overlay';
    wrap.innerHTML =
      '<div class="mf-modal' + (type === 'danger' ? ' mf-modal-danger' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="mf-modal-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + ic.w + '" stroke-linecap="round" stroke-linejoin="round">' + ic.d + '</svg></div>' +
      '<h3 class="mf-modal-title">' + escapeHtml(title) + '</h3>' +
      (type === 'danger'
        ? '<p class="mf-modal-msg">Are you sure you want to remove <strong>' + escapeHtml(opts.subject || 'this bank account') + '</strong>? This action cannot be undone.</p>'
        : (message ? '<p class="mf-modal-msg">' + escapeHtml(message) + '</p>' : '')) +
      '<button type="button" class="mf-modal-btn' + (type === 'danger' ? ' danger-confirm' : '') + '" data-mf-confirm>' + escapeHtml(confirmText) + '</button>' +
      ((type === 'confirm' || type === 'danger') ? '<button type="button" class="mf-modal-btn secondary" data-mf-cancel>' + escapeHtml(cancelText) + '</button>' : '') +
      '</div>';
    document.body.appendChild(wrap);
    memberModalRoot = wrap;
    lockBodyScroll();
    on(wrap, 'click', function (e) { if (e.target === wrap) closeMemberModal(); });
    on(wrap.querySelector('[data-mf-confirm]'), 'click', function () { closeMemberModal(); if (opts.onConfirm) opts.onConfirm(); });
    on(wrap.querySelector('[data-mf-cancel]'), 'click', function () { closeMemberModal(); if (opts.onCancel) opts.onCancel(); });
  }

  /* ---- useMemberPage port: password eye toggle (.absolute buttons, e.g.
     withdrawal.html), quick-amount select, promo radio, legacy status menu -- */

  function initMemberPageBehaviors() {
    var root = document.querySelector('main') || document.body;
    var AMT_RE = /^\d{1,3}(,\d{3})+$/;
    var STATUSES = ['All', 'Pending', 'Approved', 'Rejected'];

    function closeStatusMenus() { $all('.rb-status-menu', root).forEach(function (m) { m.remove(); }); }
    function rowStatus(row) {
      var spans = $all('span', row).map(function (x) { return (x.textContent || '').trim(); });
      return spans.filter(function (t) { return /^(Approved|Pending|Rejected|Completed)$/.test(t); })[0] || '';
    }
    function filterRows(status) {
      $all('table tr', root).forEach(function (tr) {
        if (tr.querySelector('th')) return;
        var st = rowStatus(tr);
        if (!st) return;
        tr.style.display = (status === 'All' || st === status) ? '' : 'none';
      });
    }

    on(root, 'click', function (e) {
      var target = e.target;

      var eye = target.closest('button[type="button"]');
      if (eye && eye.querySelector('svg') && /absolute/.test(eye.className)) {
        var inp = eye.parentElement ? eye.parentElement.querySelector('input') : null;
        if (inp && (inp.type === 'password' || inp.dataset.pw === '1')) {
          e.preventDefault();
          inp.dataset.pw = '1';
          inp.type = inp.type === 'password' ? 'text' : 'password';
          return;
        }
      }

      var opt = target.closest('.rb-status-opt');
      if (opt) {
        var status = opt.getAttribute('data-status');
        var trig = root.querySelector('.rb-status-trigger');
        if (trig) trig.textContent = status;
        filterRows(status);
        closeStatusMenus();
        return;
      }

      /* Status filter trigger: `.rb-select` / [role=combobox] widget (label
         defaults to "All") has no built-in dropdown behavior of its own —
         rebuild that interaction here, reusing the existing STATUSES/filterRows
         logic and the site-wide .dd-panel dropdown look. Only present on
         deposit-record / withdrawal-record / account-record (betting-record
         and profit-loss have no status column, see stores/records.ts). */
      var pSelect = target.closest('.rb-select');
      if (pSelect) {
        e.preventDefault();
        if (root.querySelector('.rb-status-menu')) { closeStatusMenus(); return; }
        var label = pSelect.querySelector('.rb-select-label') || pSelect;
        label.classList.add('rb-status-trigger');
        var menu = document.createElement('div');
        menu.className = 'rb-status-menu dd-panel dd-panel--left';
        STATUSES.forEach(function (s) {
          var o = document.createElement('div');
          o.className = 'rb-status-opt dd-panel-link';
          o.setAttribute('data-status', s);
          o.textContent = s;
          menu.appendChild(o);
        });
        pSelect.style.position = 'relative';
        pSelect.appendChild(menu);
        return;
      }

      var trig2 = target.closest('button');
      if (trig2 && AMT_RE.test((trig2.textContent || '').trim())) {
        var grid = trig2.parentElement;
        $all('button', grid).forEach(function (x) {
          if (AMT_RE.test((x.textContent || '').trim())) {
            x.style.background = '#0f1419'; x.style.color = '#fff'; x.style.border = '1px solid #374151';
          }
        });
        trig2.style.background = '#313E40'; trig2.style.color = '#AAE5D3'; trig2.style.border = '1px solid transparent';
        var amt = (trig2.textContent || '').trim();
        var input = $all('input', root).filter(function (i) { return /₩/.test(i.getAttribute('placeholder') || '') || /₩/.test(i.value || ''); })[0];
        if (input) input.value = '₩ ' + amt;
        return;
      }

      var card = target.closest('.items-start');
      if (card) {
        var radio = card.querySelector('div.w-5.rounded-full.border-2');
        if (radio && card.querySelector('h3')) {
          $all('div.w-5.rounded-full.border-2', root).forEach(function (rr) { rr.style.borderColor = '#4b5563'; rr.innerHTML = ''; });
          radio.style.borderColor = '#98E7D2';
          radio.innerHTML = '<div style="width:10px;height:10px;border-radius:50%;background:#98E7D2"></div>';
        }
      }

      if (!target.closest('.rb-status-menu')) closeStatusMenus();
    });
  }

  /* ---- .mf-eye password toggles (banking-details / change-password) ---- */

  function initMfEyeToggles() {
    $all('.mf-eye').forEach(function (btn) {
      on(btn, 'click', function () {
        var input = btn.previousElementSibling;
        if (input && input.tagName === 'INPUT') input.type = input.type === 'password' ? 'text' : 'password';
      });
    });
  }

  /* ---- account.html + withdrawal.html bank account carousels (P1) ---- */

  function initAccountBankCarousel() {
    if (pageName() !== 'account') return;
    var prevBtn = document.querySelector('[aria-label="Previous bank account"]');
    var nextBtn = document.querySelector('[aria-label="Next bank account"]');
    var deleteBtn = document.querySelector('[aria-label="Delete bank account"]');
    var counter = prevBtn ? prevBtn.nextElementSibling : null;
    var cardIcon = document.querySelector('.lucide-credit-card');
    var numSpan = cardIcon ? cardIcon.parentElement.querySelector('span') : null;
    var buildingIcon = document.querySelector('.lucide-building');
    var bankRow = buildingIcon ? buildingIcon.parentElement : null;
    var bankSpan = bankRow ? bankRow.querySelector('span') : null;
    if (!prevBtn || !nextBtn || !numSpan || !bankSpan) return;

    var accounts = (D.BANK_ACCOUNTS || []).slice();
    var idx = 0;
    function render() {
      if (!accounts.length) return;
      var a = accounts[idx];
      numSpan.textContent = a.num;
      bankSpan.textContent = a.bank;
      if (counter) counter.textContent = (idx + 1) + '/' + accounts.length;
    }
    on(prevBtn, 'click', function () { if (accounts.length) { idx = (idx - 1 + accounts.length) % accounts.length; render(); } });
    on(nextBtn, 'click', function () { if (accounts.length) { idx = (idx + 1) % accounts.length; render(); } });
    on(deleteBtn, 'click', function () {
      var a = accounts[idx];
      showMemberModal({
        type: 'danger',
        subject: a ? a.bank : 'this bank account',
        onConfirm: function () {
          accounts.splice(idx, 1);
          if (idx >= accounts.length) idx = Math.max(0, accounts.length - 1);
          if (!accounts.length && bankRow) {
            var listBlock = bankRow.closest('.space-y-3');
            if (listBlock) listBlock.innerHTML = '<div class="bound-wallet"><div class="coin-empty coin-md">' + iconSvg('card', 'w-8 h-8') + '</div><div>No bank account</div></div><a class="text-primary hover:text-primary-soft text-sm transition-colors reg-add" href="withdrawal.html?tab=management">+ Add New Bank Account</a>';
          } else {
            render();
          }
          showMemberModal({ type: 'success', message: 'Bank account deleted successfully.' });
        },
      });
    });
  }

  /* ---- account.html Crypto Wallet card — synced from D.WALLET_ACCOUNTS
     (same array withdrawal.html?tab=management writes to; capped at 1 entry
     so no carousel, unlike the bank card above) ------------------------- */

  var TRASH_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-sm"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>';
  var COPY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-sm"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
  function initAccountWalletCard() {
    if (pageName() !== 'account') return;
    var body = document.querySelector('[data-account-wallet-body]');
    if (!body) return;
    var wallets = D.WALLET_ACCOUNTS || [];
    function render() {
      if (!wallets.length) {
        body.className = 'bound-wallet';
        body.innerHTML = '<div class="coin-empty coin-md">₿</div><div>Empty wallet list</div>';
        return;
      }
      var w = wallets[0];
      body.className = 'acct-panel-list';
      var qrDict = D.DEPOSIT_QR || {};
      var qrT = qrDict[currentLocale()] || qrDict.en || {};
      var copyLabel = qrT.copy || '複製';
      var copiedLabel = qrT.copied || '已複製';
      body.innerHTML =
        '<div class="acct-panel-row">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="acct-panel-row-icon"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>' +
          '<span>' + escapeHtml(w.type) + '</span>' +
          '<button type="button" class="acct-panel-row-del" data-wallet-del aria-label="Delete wallet">' + TRASH_SVG + '</button>' +
        '</div>' +
        '<div class="acct-panel-row">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="acct-panel-row-icon"><circle cx="12" cy="12" r="9"></circle><path d="M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-4M12 8v8"></path></svg>' +
          '<span>' + escapeHtml(walletMask(w.address)) + '</span>' +
          '<button type="button" class="acct-panel-row-del" data-wallet-copy aria-label="' + escapeHtml(copyLabel) + '">' + COPY_SVG + '</button>' +
        '</div>';
      on(body.querySelector('[data-wallet-copy]'), 'click', function (e) {
        e.stopPropagation();
        var btn = e.currentTarget;
        try { navigator.clipboard.writeText(w.address); } catch (err) { /* clipboard 不可用,占位流程靜默略過 */ }
        btn.innerHTML = iconSvg('check', 'w-4 h-4');
        btn.setAttribute('aria-label', copiedLabel);
        setTimeout(function () {
          btn.innerHTML = COPY_SVG;
          btn.setAttribute('aria-label', copyLabel);
        }, 1500);
      });
      on(body.querySelector('[data-wallet-del]'), 'click', function () {
        showMemberModal({
          type: 'danger',
          subject: w.type,
          onConfirm: function () {
            wallets.splice(0, 1);
            render();
            showMemberModal({ type: 'success', message: 'Wallet deleted successfully.' });
          },
        });
      });
    }
    render();
  }

  /* 提款頁銀行卡輪播與「帳戶管理」共用同一份 D.BANK_ACCOUNTS;
     管理頁新增帳戶後透過這個 api 讓輪播即時反映。 */
  var withdrawalCarouselApi = null;
  function initWithdrawalBankCarousel() {
    if (pageName() !== 'withdrawal') return;
    var prevBtn = document.querySelector('.accts-nav[aria-label="Previous"]');
    var nextBtn = document.querySelector('.accts-nav[aria-label="Next"]');
    var card = document.querySelector('.bound-card');
    var titleSpan = document.querySelector('.accts-title span');
    if (!prevBtn || !nextBtn || !card) return;
    var accounts = D.BANK_ACCOUNTS || [];
    var idx = 0;
    function acctTail(num) {
      var digits = (num || '').replace(/\D/g, '');
      return '＊＊＊＊' + (digits.slice(-4) || '0000');
    }
    function render() {
      var a = accounts[idx];
      if (!a) return;
      var pill = card.querySelector('.bound-pill');
      var val = card.querySelector('.bn-value');
      var name = card.querySelector('.bound-name');
      var dateB = card.querySelector('.bound-date b');
      if (pill) pill.textContent = a.bank;
      if (val) val.textContent = acctTail(a.num);
      if (name) name.textContent = a.holder;
      if (dateB) dateB.textContent = a.bindDate;
      if (titleSpan) titleSpan.textContent = (idx + 1) + ' / ' + accounts.length;
    }
    on(prevBtn, 'click', function () { if (accounts.length) { idx = (idx - 1 + accounts.length) % accounts.length; render(); } });
    on(nextBtn, 'click', function () { if (accounts.length) { idx = (idx + 1) % accounts.length; render(); } });
    withdrawalCarouselApi = { refresh: render };
  }

  /* ---- generic "ready" gate: enable a submit button once inputs are filled -- */

  function bindReadyGate(button, inputs, applyState) {
    if (!button) return function () { return false; };
    function check() {
      var ok = inputs.every(function (i) {
        if (!i) return false;
        if (i.type === 'checkbox') return i.checked;
        return (i.value || '').trim() !== '';
      });
      applyState(ok);
      return ok;
    }
    inputs.forEach(function (i) { if (i) { on(i, 'input', check); on(i, 'change', check); } });
    check();
    return check;
  }

  /* ---- withdrawal.html: main submit + 3 inert (ready-gate only) sub-forms -- */

  function initWithdrawalForms() {
    if (pageName() !== 'withdrawal') return;
    var bankSection = document.querySelector('.payment-card');
    var paymentTabs = document.querySelector('.payment-tabs');
    var modeTabs = document.querySelector('.mode-tabs');
    if (!bankSection || !paymentTabs || !modeTabs) return;

    /* -- Withdraw 分頁:銀行面板(烘焙)submit gate --------------------- */
    var mainSubmit = $all('button', bankSection).filter(function (b) { return /submit-ready|submit-idle/.test(b.className); })[0];
    var bankInputs = $all('input', bankSection);
    var amountEl = bankInputs.filter(function (i) { return /₩\s*10,000/.test(i.getAttribute('placeholder') || ''); })[0];
    var passwordEl = bankInputs.filter(function (i) { return i.type === 'password' || i.dataset.pw === '1'; })[0];
    if (mainSubmit) {
      bindReadyGate(mainSubmit, [amountEl, passwordEl], function (ok) {
        mainSubmit.classList.toggle('submit-ready', ok);
        mainSubmit.classList.toggle('submit-idle', !ok);
        mainSubmit.disabled = !ok;
      });
      on(mainSubmit, 'click', function () {
        if (!amountEl || !passwordEl) return;
        if (!amountEl.value.trim() || !passwordEl.value.trim()) return;
        showMemberModal({ type: 'success', message: 'Withdrawal request submitted successfully.' });
      });
    }

    /* -- Withdraw 分頁:Crypto 面板(withdrawal.vue v-else section,
          v-if 未進 SSG,這裡照原模板客端生成)------------------------- */
    var cryptoSection = document.createElement('section');
    cryptoSection.className = 'payment-card';
    cryptoSection.style.display = 'none';
    cryptoSection.setAttribute('data-crypto-panel', '');
    cryptoSection.innerHTML =
      '<h2 class="pay-section-title">Crypto Wallet</h2>' +
      '<div class="wallet-empty" data-wallet-panel><div class="coin-empty coin-lg">₿</div><div>Empty wallet list</div>' +
      '<button class="add-wallet" data-add-wallet><span style="font-size:20px;line-height:1">+</span>Add wallet</button></div>' +
      '<div class="balance-grid"><span>Central Wallet:</span><strong>0.00</strong><span>Available Amount:</span><strong>0.00</strong></div>' +
      '<h2 class="pay-section-title mt-6">Withdrawal Amount &amp; Password</h2>' +
      '<div class="pay-form-grid mt-6">' +
      '<label>Wallet type:</label><select class="pay-field"><option value="">Please select wallet type</option><option>USDT TRC20</option></select>' +
      '<label>Wallet address:</label><input class="pay-field" placeholder="Please fill in wallet address">' +
      '<label>Withdrawal Amount:</label><input class="pay-field" placeholder="100,000 ~ 20,000,000">' +
      '<label>Transaction Password:</label><input class="pay-field" type="password" placeholder="Please fill in the transaction password">' +
      '</div>' +
      '<button class="pay-action" disabled>Submit</button>';
    bankSection.parentElement.insertBefore(cryptoSection, bankSection.nextSibling);

    /* -- Account Management 分頁(withdrawal.vue v-else 大節)---------- */
    var mgmtSection = document.createElement('section');
    mgmtSection.className = 'mgmt-wrap';
    mgmtSection.style.display = 'none';
    mgmtSection.setAttribute('data-mgmt-panel', '');
    mgmtSection.innerHTML =
      '<div class="payment-tabs">' +
      '<button class="active" data-mgmt-tab="bank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path><path d="M7 15h4"></path></svg><span>Bank Account</span></button>' +
      '<button data-mgmt-tab="crypto"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9.5 8h3.8a2.2 2.2 0 0 1 0 4.4H9.5z"></path><path d="M9.5 12.4h4.2a2.3 2.3 0 0 1 0 4.6H9.5z"></path><path d="M9.5 6v12M11 4.5V6M14 4.5V6M11 18v1.5M14 18v1.5"></path></svg><span>Crypto Wallet</span></button>' +
      '</div>' +
      '<section class="payment-card">' +
      '<div data-mgmt-bank>' +
      '<div class="account-summary"><h2 class="pay-section-title">Registered Withdrawal Accounts <span data-mgmt-count>(0/5)</span></h2>' +
      '<div data-mgmt-list></div></div>' +
      /* 新增入口:表單預設收起,由這顆「+」帶出。沿用本頁既有的
         .add-wallet(提款 Crypto 面板同一顆),不另創樣式;收合用 inline
         style="display:none" 比照上面 [data-mgmt-crypto] 的既有寫法。 */
      '<button class="add-wallet" data-mgmt-add="bank" aria-expanded="false"><span style="font-size:20px;line-height:1">+</span>Add bank account</button>' +
      '<div data-mgmt-bank-form style="display:none">' +
      '<div class="pay-form-grid">' +
      '<label>Select Bank:</label><select class="pay-field"><option value="">Please Select a Bank</option><option>Shinhan Bank</option><option>KB Bank</option></select>' +
      '<label>Name on Card:</label><input class="pay-field" value="T***" disabled>' +
      '<label>Account Number:</label><input class="pay-field" placeholder="Please Enter Account/Card/Phone number">' +
      '<label>Transaction Password:</label><input class="pay-field" type="password" placeholder="Please Fill in the Transaction Password">' +
      '</div>' +
      '<button class="pay-action" disabled>Submit</button>' +
      '</div>' +
      '</div>' +
      '<div data-mgmt-crypto style="display:none">' +
      '<div class="account-summary"><h2 class="pay-section-title">Bound wallet <span data-mgmt-wallet-count>(0/1)</span></h2>' +
      '<div class="bound-wallet" data-mgmt-wallet-list><div class="coin-empty coin-md">₿</div><div>Empty wallet list</div></div></div>' +
      '<button class="add-wallet" data-mgmt-add="crypto" aria-expanded="false"><span style="font-size:20px;line-height:1">+</span>Add wallet</button>' +
      '<div data-mgmt-crypto-form style="display:none">' +
      '<div class="pay-form-grid">' +
      '<label>Wallet type:</label><select class="pay-field"><option value="">Please select wallet type</option><option>USDT TRC20</option></select>' +
      '<label>Wallet address:</label><input class="pay-field" placeholder="Please fill in wallet address">' +
      '<label>Transaction Password:</label><input class="pay-field" type="password" placeholder="Please Fill in the Transaction Password">' +
      '</div>' +
      '<button class="pay-action" disabled>Submit</button>' +
      '</div>' +
      '</div></section>';
    cryptoSection.parentElement.insertBefore(mgmtSection, cryptoSection.nextSibling);

    /* 已登記帳戶清單 = 與輪播同一份 D.BANK_ACCOUNTS(同步鐵則) */
    function acctMask(num) {
      var digits = (num || '').replace(/\D/g, '');
      return '********' + (digits.slice(-4) || '0000');
    }
    function renderMgmtList() {
      var list = mgmtSection.querySelector('[data-mgmt-list]');
      var count = mgmtSection.querySelector('[data-mgmt-count]');
      var accounts = D.BANK_ACCOUNTS || [];
      if (count) count.textContent = '(' + accounts.length + '/5)';
      if (list) {
        list.innerHTML = accounts.map(function (a, idx) {
          return '<div class="registered-card"><div class="bank-logo">' + escapeHtml(a.bank) + '</div>' +
            '<div><strong>' + escapeHtml(a.bank) + '</strong><span>' + acctMask(a.num) + '</span>' +
            '<span>' + escapeHtml(a.bindDate || '') + '</span></div>' +
            '<button type="button" class="registered-card-del" data-mgmt-bank-del="' + idx + '" aria-label="Delete bank account">' + TRASH_SVG + '</button></div>';
        }).join('');
        $all('[data-mgmt-bank-del]', list).forEach(function (btn) {
          on(btn, 'click', function () {
            var idx = Number(btn.getAttribute('data-mgmt-bank-del'));
            var a = accounts[idx];
            showMemberModal({
              type: 'danger',
              subject: a ? a.bank : 'this bank account',
              onConfirm: function () {
                accounts.splice(idx, 1);
                renderMgmtList();
                if (withdrawalCarouselApi) withdrawalCarouselApi.refresh();
                showMemberModal({ type: 'success', message: 'Bank account deleted successfully.' });
              },
            });
          });
        });
      }
    }
    renderMgmtList();

    /* 錢包管理清單:與帳戶頁 Crypto Wallet 卡同一份 D.WALLET_ACCOUNTS;
       walletMask 已上移為檔案層共用函式,見上方 utils)*/
    function renderMgmtWalletList() {
      var wrap = mgmtSection.querySelector('[data-mgmt-wallet-list]');
      var count = mgmtSection.querySelector('[data-mgmt-wallet-count]');
      var wallets = D.WALLET_ACCOUNTS || [];
      if (count) count.textContent = '(' + wallets.length + '/1)';
      if (wrap) {
        if (!wallets.length) {
          wrap.className = 'bound-wallet';
          wrap.innerHTML = '<div class="coin-empty coin-md">₿</div><div>Empty wallet list</div>';
        } else {
          var w = wallets[0];
          wrap.className = 'registered-card';
          wrap.innerHTML = '<div class="bank-logo">₿</div>' +
            '<div><strong>' + escapeHtml(w.type) + '</strong><span>' + escapeHtml(walletMask(w.address)) + '</span>' +
            '<span>' + escapeHtml(w.bindDate || '') + '</span></div>' +
            '<button type="button" class="registered-card-del" data-mgmt-wallet-del aria-label="Delete wallet">' + TRASH_SVG + '</button>';
          on(wrap.querySelector('[data-mgmt-wallet-del]'), 'click', function () {
            showMemberModal({
              type: 'danger',
              subject: w.type,
              onConfirm: function () {
                wallets.splice(0, 1);
                renderMgmtWalletList();
                if (withdrawalWalletApi) withdrawalWalletApi.refresh();
                showMemberModal({ type: 'success', message: 'Wallet deleted successfully.' });
              },
            });
          });
        }
      }
    }
    renderMgmtWalletList();

    /* 提款頁 Crypto 面板(Withdraw 模式)同步同一份 D.WALLET_ACCOUNTS */
    var withdrawalWalletApi = null;
    function renderWithdrawWalletPanel() {
      var box = cryptoSection.querySelector('[data-wallet-panel]');
      if (!box) return;
      var wallets = D.WALLET_ACCOUNTS || [];
      if (!wallets.length) {
        box.className = 'wallet-empty';
        box.innerHTML = '<div class="coin-empty coin-lg">₿</div><div>Empty wallet list</div>' +
          '<button class="add-wallet" data-add-wallet><span style="font-size:20px;line-height:1">+</span>Add wallet</button>';
      } else {
        var w = wallets[0];
        box.className = 'registered-card';
        box.innerHTML = '<div class="bank-logo">₿</div>' +
          '<div><strong>' + escapeHtml(w.type) + '</strong><span>' + escapeHtml(walletMask(w.address)) + '</span>' +
          '<span>' + escapeHtml(w.bindDate || '') + '</span></div>';
      }
    }
    renderWithdrawWalletPanel();
    withdrawalWalletApi = { refresh: renderWithdrawWalletPanel };

    /* gate + submit for the generated panels(select 需選值、input 需非空)*/
    $all('.pay-action', cryptoSection).concat($all('.pay-action', mgmtSection)).forEach(function (btn) {
      var wrap = btn.closest('[data-mgmt-bank], [data-mgmt-crypto]') || cryptoSection;
      var fields = $all('input, select', wrap).filter(function (i) { return !i.disabled; });
      bindReadyGate(btn, fields, function (ok) { btn.classList.toggle('ready', ok); btn.disabled = !ok; });
      on(btn, 'click', function () {
        if (btn.disabled) return;
        var isBankMgmt = btn.closest('[data-mgmt-bank]');
        var isWalletMgmt = btn.closest('[data-mgmt-crypto]');
        if (isBankMgmt) {
          /* 新增銀行帳戶 → 寫回共用陣列,清單與輪播同步刷新 */
          var sel = isBankMgmt.querySelector('select');
          var acctInput = $all('input', isBankMgmt).filter(function (i) { return !i.disabled && i.type !== 'password'; })[0];
          (D.BANK_ACCOUNTS = D.BANK_ACCOUNTS || []).push({
            bank: sel ? sel.value : 'Bank',
            num: acctInput ? acctInput.value : '',
            holder: 'M＊＊＊＊＊＊＊',
            bindDate: new Date().toISOString().slice(0, 10),
          });
          renderMgmtList();
          if (withdrawalCarouselApi) withdrawalCarouselApi.refresh();
          if (sel) sel.value = '';
          if (acctInput) acctInput.value = '';
          var pw = isBankMgmt.querySelector('input[type="password"]');
          if (pw) pw.value = '';
        } else if (isWalletMgmt) {
          /* 新增錢包 → 寫回共用陣列,清單與 Withdraw 面板同步刷新(上限 1 個)*/
          var walletSel = isWalletMgmt.querySelector('select');
          var walletInput = $all('input', isWalletMgmt).filter(function (i) { return !i.disabled && i.type !== 'password'; })[0];
          if (!walletSel || !walletSel.value || !walletInput || !walletInput.value.trim()) return;
          if ((D.WALLET_ACCOUNTS || []).length >= 1) {
            showMemberModal({ type: 'warning', message: 'Only 1 wallet can be bound at a time.' });
            return;
          }
          (D.WALLET_ACCOUNTS = D.WALLET_ACCOUNTS || []).push({
            type: walletSel.value,
            address: walletInput.value,
            bindDate: new Date().toISOString().slice(0, 10),
          });
          renderMgmtWalletList();
          if (withdrawalWalletApi) withdrawalWalletApi.refresh();
          walletSel.value = '';
          walletInput.value = '';
          var walletPw = isWalletMgmt.querySelector('input[type="password"]');
          if (walletPw) walletPw.value = '';
        }
        showMemberModal({ type: 'success', message: 'Your request has been submitted successfully.' });
      });
    });

    /* Bank Card / Crypto Wallet 方式切換(withdrawal.vue method ref)---- */
    var methodBtns = $all(':scope > button', paymentTabs);
    function showMethod(which) {
      methodBtns.forEach(function (b, i) { b.classList.toggle('active', (which === 'bank' ? 0 : 1) === i); });
      bankSection.style.display = which === 'bank' ? '' : 'none';
      cryptoSection.style.display = which === 'crypto' ? '' : 'none';
    }
    methodBtns.forEach(function (b, i) {
      on(b, 'click', function () { showMethod(i === 0 ? 'bank' : 'crypto'); });
    });

    /* Withdraw / Account Management 主分頁(withdrawal.vue tab ref)----- */
    var modeBtns = $all(':scope > button', modeTabs);
    function showMode(which) {
      modeBtns.forEach(function (b, i) { b.classList.toggle('active', (which === 'withdraw' ? 0 : 1) === i); });
      if (which === 'withdraw') {
        paymentTabs.style.display = '';
        mgmtSection.style.display = 'none';
        showMethod(methodBtns[0] && methodBtns[0].classList.contains('active') ? 'bank' : 'crypto');
      } else {
        paymentTabs.style.display = 'none';
        bankSection.style.display = 'none';
        cryptoSection.style.display = 'none';
        mgmtSection.style.display = '';
      }
    }
    modeBtns.forEach(function (b, i) {
      on(b, 'click', function () { showMode(i === 0 ? 'withdraw' : 'management'); });
    });

    /* 管理分頁內層 Bank/Crypto 切換 */
    var mgmtTabBtns = $all('[data-mgmt-tab]', mgmtSection);
    mgmtTabBtns.forEach(function (b) {
      on(b, 'click', function () {
        var which = b.getAttribute('data-mgmt-tab');
        mgmtTabBtns.forEach(function (x) { x.classList.toggle('active', x === b); });
        mgmtSection.querySelector('[data-mgmt-bank]').style.display = which === 'bank' ? '' : 'none';
        mgmtSection.querySelector('[data-mgmt-crypto]').style.display = which === 'crypto' ? '' : 'none';
      });
    });

    /* 管理分頁的「+ 新增」→ 展開/收起該子頁的登記表單 */
    $all('[data-mgmt-add]', mgmtSection).forEach(function (b) {
      on(b, 'click', function () {
        var kind = b.getAttribute('data-mgmt-add');
        var form = mgmtSection.querySelector(kind === 'bank' ? '[data-mgmt-bank-form]' : '[data-mgmt-crypto-form]');
        if (!form) return;
        var open = form.style.display === 'none';
        form.style.display = open ? '' : 'none';
        b.setAttribute('aria-expanded', String(open));
      });
    });

    /* 提款 Crypto 面板的「Add wallet」→ 跳到管理分頁的 Crypto 子頁(委派綁定,
       因為 renderWithdrawWalletPanel() 會重繪這顆按鈕所在的容器)------------ */
    on(cryptoSection, 'click', function (e) {
      if (!e.target.closest('[data-add-wallet]')) return;
      showMode('management');
      var cryptoTab = mgmtSection.querySelector('[data-mgmt-tab="crypto"]');
      if (cryptoTab) cryptoTab.click();
    });

    /* 銀行卡卡面右上角的「+」→ 跳到管理分頁的 Bank 子頁並直接展開新增表單,
       與上面 Crypto「Add wallet」同一套跳轉模式。 */
    on(bankSection, 'click', function (e) {
      if (!e.target.closest('[data-wd-card-add]')) return;
      showMode('management');
      var bankTab = mgmtSection.querySelector('[data-mgmt-tab="bank"]');
      if (bankTab) bankTab.click();
      var addBtn = mgmtSection.querySelector('[data-mgmt-add="bank"]');
      if (addBtn && addBtn.getAttribute('aria-expanded') !== 'true') addBtn.click();
    });

    /* account 頁「+ 新增銀行帳戶」深連結:withdrawal.html?tab=management */
    if (new URLSearchParams(location.search).get('tab') === 'management') {
      showMode('management');
    }
  }

  /* ---- personal-info / change-password / banking-details -- */

  function initPersonalInfoPage() {
    if (pageName() !== 'personal-info') return;
    var btn = $all('button').filter(function (b) { return b.textContent.trim() === 'Submit'; })[0];
    on(btn, 'click', function () { showMemberModal({ type: 'success', message: 'Profile updated successfully.' }); });
  }

  function initChangePasswordPage() {
    if (pageName() !== 'change-password') return;
    var card = document.querySelector('.mf-card');
    if (!card) return;
    var isTxn = /type=txn/.test(location.search);
    var inputs = $all('.mf-input', card);
    var newPw = inputs[0], confirmPw = inputs[1];
    var submitBtn = card.querySelector('.mf-submit');
    if (!newPw || !confirmPw || !submitBtn) return;
    var VISIBLE_ASCII = /^[\x21-\x7E]{5,16}$/;
    bindReadyGate(submitBtn, [newPw, confirmPw], function (ok) { submitBtn.classList.toggle('ready', ok); submitBtn.disabled = !ok; });
    on(submitBtn, 'click', function () {
      if (!newPw.value.trim() || !confirmPw.value.trim()) return;
      var a = newPw.value;
      if (isTxn && !VISIBLE_ASCII.test(a)) { showMemberModal({ type: 'warning', message: 'Use 5-16 visible ASCII characters (letters, numbers, symbols).' }); return; }
      if (!isTxn && (a.length < 5 || a.length > 16)) { showMemberModal({ type: 'warning', message: 'Length must be 5-16 characters.' }); return; }
      if (a !== confirmPw.value) { showMemberModal({ type: 'warning', message: 'The two passwords do not match.' }); return; }
      showMemberModal({ type: 'success', onConfirm: function () { newPw.value = ''; confirmPw.value = ''; submitBtn.classList.remove('ready'); submitBtn.disabled = true; } });
    });
  }

  /* ================================ security.html =========================== */
  /* security.vue's last Security Setting row ("Logout" / "Logout safely") is a
     plain <div> with no @click in the Nuxt source either — but the identical
     action already works from the header member dropdown (data-logout ->
     persistLogin(false) + location.reload(), see bindAccountBarLogout above),
     so wire this row to the same, already-established behaviour instead of
     leaving a row that looks exactly like its four sibling links (same layout,
     cursor-pointer) but does nothing when clicked. */

  function initSecurityPage() {
    if (pageName() !== 'security') return;
    /* scoped to main: the member sidebar nav also links to personal-info.html,
       and querying the whole document would match that one first instead of
       the Security Setting list this function actually needs. */
    var personalInfoLink = document.querySelector('main a[href="personal-info.html"]');
    var list = personalInfoLink && personalInfoLink.parentElement;
    if (!list) return;
    var last = list.lastElementChild;
    if (!last || last.tagName === 'A' || !/Logout/.test(last.textContent || '')) return;
    on(last, 'click', function () { persistLogin(false); location.reload(); });
  }

  /* ============================ data-backoffice hint ======================= */

  /* 客服彈窗:CS 不進內容頁,改跳彈窗;Live Chat / Telegram / Email 三列 */
  var csModalRoot = null;
  function closeCsModal() { if (csModalRoot) { csModalRoot.remove(); csModalRoot = null; unlockBodyScroll(); } }
  function openCsModal() {
    if (csModalRoot) return;
    csModalRoot = document.createElement('div');
    csModalRoot.className = 'cs-modal-overlay';
    var rows = [
      {
        href: '#', strong: 'Live Chat Support', small: '24/7 instant help from our team',
        icon: '<path d="M21 12c0 4.4-4 8-9 8a10 10 0 0 1-3.6-.7L3 21l1.4-4.5A8 8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z"/>'
      },
      {
        href: 'https://t.me/win100kor', strong: 'Telegram Channel', small: 'Promotions & announcements',
        icon: '<path d="M21.05 3.4 2.7 10.5c-1.1.45-1.1 1.1-.2 1.4l4.6 1.45 1.8 5.7c.2.55.4.75.8.75.4 0 .55-.18.75-.4l2.3-2.3 4.7 3.45c.85.5 1.45.25 1.65-.8L21.95 4.6c.3-1.4-.45-2-1.5-1.55Z"/>',
        fill: true
      },
      {
        href: '#', strong: 'Email Us', small: 'support@win100.gg · reply within 24h',
        icon: '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>'
      },
    ];
    csModalRoot.innerHTML =
      '<div class="cs-modal-box">' +
      '<div class="cs-modal-head">' +
      '<div class="cs-modal-head-left">' +
      '<span class="cs-modal-ico"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 16 0v4a3 3 0 0 1-3 3h-2v-7h5M4 12v4a3 3 0 0 0 3 3h2v-7H4"/></svg></span>' +
      '<h3 class="cs-modal-title">Customer Service</h3>' +
      '</div>' +
      '<button type="button" class="cs-modal-close" data-cs-close aria-label="Close">' + iconSvg('x', 'icon-sm') + '</button>' +
      '</div><div class="cs-modal-body">' +
      '<p class="cs-box-title">Select a channel</p>' +
      rows.map(function (r) {
        return '<a href="' + r.href + '"' + (r.href.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '') +
          ' class="cs-opt">' +
          '<span class="cs-opt-ico"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="' + (r.fill ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">' + r.icon + '</svg></span>' +
          '<span class="cs-opt-text"><strong>' + r.strong + '</strong><small>' + r.small + '</small></span>' +
          '<span class="cs-opt-arrow">›</span></a>';
      }).join('') +
      '</div></div>';
    on(csModalRoot, 'click', function (e) { if (e.target === csModalRoot) closeCsModal(); });
    on(csModalRoot.querySelector('[data-cs-close]'), 'click', closeCsModal);
    document.body.appendChild(csModalRoot);
    lockBodyScroll();
  }

  /* 全站通用 [data-cs-open] 觸發器:客服一律走 CS modal,不導頁。事件代理掛在
     document 上,任何頁面、任何時間點插入的 [data-cs-open] 元素(qr-rail Live
     Chat、mobile drawer Customer Service 列等)都會生效,不需個別綁定;既有
     deposit 轉帳步驟裡的區域綁定(showDepositTransferStep)保留不動,兩者並存
     不衝突(openCsModal 本身對已開啟的 modal 是 no-op)。 */
  function initCsOpenTriggers() {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-cs-open]');
      if (trigger) { e.preventDefault(); openCsModal(); }
    });
  }

  /* 右下角客服對話視窗:純前端模擬,無真實客服後端。事件代理掛在 document
     上,對齊 initCsOpenTriggers 的寫法。開一次後只切換顯示/縮小,不重複
     建立節點。使用者送出訊息後,固定延遲顯示一則罐頭回覆,模擬「客服已
     收到、稍後回覆」的效果。 */
  var chatWidgetRoot = null;
  function scrollChatToBottom() {
    var body = chatWidgetRoot && chatWidgetRoot.querySelector('[data-chat-body]');
    if (body) body.scrollTop = body.scrollHeight;
  }
  function appendChatMsg(kind, text) {
    var body = chatWidgetRoot.querySelector('[data-chat-body]');
    var row = document.createElement('div');
    row.className = 'chat-msg chat-msg-' + kind;
    row.innerHTML = (kind === 'bot' ? '<img src="logo.png" class="chat-msg-avatar" alt="">' : '') +
      '<div class="chat-bubble"></div>';
    row.querySelector('.chat-bubble').textContent = text;
    body.appendChild(row);
    scrollChatToBottom();
  }
  function openChatWidget() {
    if (chatWidgetRoot) { chatWidgetRoot.classList.remove('is-minimized'); return; }
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="chat-widget" data-chat-widget>' +
      '<div class="chat-widget-head">' +
      '<img src="logo.png" class="chat-widget-avatar" alt="">' +
      '<div class="chat-widget-head-text"><strong>Live Chat</strong>' +
      '<span class="chat-widget-status"><i></i>Online</span></div>' +
      '<button type="button" class="chat-widget-min" data-chat-min aria-label="Minimize">–</button>' +
      '<button type="button" class="chat-widget-close" data-chat-close aria-label="Close">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '</div>' +
      '<div class="chat-widget-body" data-chat-body></div>' +
      '<form class="chat-widget-form" data-chat-form>' +
      '<input type="text" data-chat-input placeholder="Type a message…" autocomplete="off">' +
      '<button type="submit" aria-label="Send"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 9-18 9 4-9Z"/></svg></button>' +
      '</form></div>';
    chatWidgetRoot = wrap.firstElementChild;
    document.body.appendChild(chatWidgetRoot);
    appendChatMsg('bot', 'Hi there! How can we help? A support agent will reply shortly.');
    on(chatWidgetRoot.querySelector('[data-chat-close]'), 'click', function () { chatWidgetRoot.remove(); chatWidgetRoot = null; });
    on(chatWidgetRoot.querySelector('[data-chat-min]'), 'click', function () { chatWidgetRoot.classList.toggle('is-minimized'); });
    on(chatWidgetRoot.querySelector('[data-chat-form]'), 'submit', function (e) {
      e.preventDefault();
      var input = chatWidgetRoot.querySelector('[data-chat-input]');
      var text = input.value.trim();
      if (!text) return;
      appendChatMsg('user', text);
      input.value = '';
      setTimeout(function () {
        if (chatWidgetRoot) appendChatMsg('bot', 'Thanks for your message — a support agent will reply shortly.');
      }, 700);
    });
  }
  function initChatOpenTriggers() {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-chat-open]');
      if (trigger) { e.preventDefault(); openChatWidget(); }
    });
  }

  function initMemberQuickLinks() {
    $all('aside button').forEach(function (b) {
      var s = b.querySelector('span');
      if (s && s.textContent.trim() === 'Customer Service') {
        on(b, 'click', openCsModal);
      }
    });
    if (pageName() === 'account') {
      $all('button').forEach(function (b) {
        if (b.textContent.trim().indexOf('View More Records') === 0) {
          on(b, 'click', function () { location.href = 'account-record.html'; });
        }
      });
    }
    if (isMemberPage() && pageName() !== 'account' && !document.querySelector('[data-member-back]')) {
      var h1 = document.querySelector('h1');
      if (h1) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-member-back', '');
        btn.className = 'member-back-btn';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg><span>Back</span>';
        on(btn, 'click', function () {
          if (window.history.length > 1) window.history.back();
          else location.href = 'account.html';
        });
        h1.parentElement.insertBefore(btn, h1);
      }
    }
  }

  /* ============================================================
   * 存款非銀行方式的 QR 中繼步驟;QR 一律黑白不套 token,確保掃碼對比度
   * ========================================================== */
  var QR_SIZE = 21;
  var QR_FINDERS = [{ x: 0, y: 0 }, { x: QR_SIZE - 7, y: 0 }, { x: 0, y: QR_SIZE - 7 }];
  function qrIsFinderZone(x, y) {
    return QR_FINDERS.some(function (p) { return x >= p.x && x < p.x + 7 && y >= p.y && y < p.y + 7; });
  }
  function qrSeededModules(seed) {
    var hash = 0, i;
    for (i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    var cells = [];
    for (var y = 0; y < QR_SIZE; y += 1) {
      for (var x = 0; x < QR_SIZE; x += 1) {
        if (qrIsFinderZone(x, y)) continue;
        hash = (hash * 1103515245 + 12345) >>> 0;
        if (((hash >>> 16) & 1) === 1) cells.push({ x: x, y: y });
      }
    }
    return cells;
  }
  function qrSvgHtml(seed, altText) {
    var parts = ['<svg viewBox="-2 -2 25 25" class="deposit-qr-svg" role="img" aria-label="' + escapeHtml(altText) + '">',
      '<rect x="-2" y="-2" width="25" height="25" fill="#ffffff" />'];
    QR_FINDERS.forEach(function (p) {
      parts.push('<rect x="' + p.x + '" y="' + p.y + '" width="7" height="7" fill="#000000" />');
      parts.push('<rect x="' + (p.x + 1) + '" y="' + (p.y + 1) + '" width="5" height="5" fill="#ffffff" />');
      parts.push('<rect x="' + (p.x + 2) + '" y="' + (p.y + 2) + '" width="3" height="3" fill="#000000" />');
    });
    qrSeededModules(seed).forEach(function (c) {
      parts.push('<rect x="' + c.x + '" y="' + c.y + '" width="1" height="1" fill="#000000" />');
    });
    parts.push('</svg>');
    return parts.join('');
  }
  function showDepositQrStep(methodId) {
    var qrData = D.DEPOSIT_QR || {};
    var t8 = qrData[currentLocale()] || qrData.en || {};
    var addr = (qrData.addresses || {})[methodId] || (qrData.addresses || {}).linepay || '';
    var isAddress = methodId === 'trc20' || methodId === 'erc20';
    var formCard = document.querySelector('.payment-card');
    var gatewayTabs = document.querySelector('.mode-tabs');
    var paymentTabs = document.querySelector('.payment-tabs');
    if (!formCard) return;
    [gatewayTabs, paymentTabs, formCard].forEach(function (el) { if (el) el.style.display = 'none'; });
    var section = document.createElement('section');
    section.className = 'payment-card deposit-qr-step';
    section.setAttribute('data-deposit-qr', '');
    section.innerHTML =
      '<div class="transfer-pill">' + escapeHtml(t8.pill || 'Scan to Pay') + '</div>' +
      '<p class="deposit-qr-hint">' + escapeHtml(t8.hint || '') + '</p>' +
      '<div class="deposit-qr-code-wrap"><div class="deposit-qr-code-box">' +
      qrSvgHtml(methodId + '|' + addr, t8.altText || 'Payment QR code') + '</div></div>' +
      '<div class="deposit-qr-field-wrap">' +
      '<label class="deposit-qr-field-label">' + escapeHtml(isAddress ? (t8.addressLabel || 'Payment Address') : (t8.linkLabel || 'Payment Link')) + '</label>' +
      '<div class="deposit-qr-field-row"><input class="pay-field" value="' + escapeHtml(addr) + '" readonly>' +
      '<button type="button" class="btn-ghost btn-md deposit-qr-copy-btn" data-qr-copy>' + escapeHtml(t8.copy || 'Copy') + '</button></div></div>' +
      '<p class="deposit-qr-note">' + escapeHtml(t8.note || '') + '</p>' +
      '<div class="deposit-qr-actions">' +
      '<button type="button" class="btn-back" data-qr-back>' + escapeHtml(t8.back || 'Back') + '</button>' +
      '<button type="button" class="complete" data-qr-next><span>' + escapeHtml(t8.confirm || 'Next') + '</span></button></div>';
    formCard.parentElement.insertBefore(section, formCard.nextSibling);
    on(section.querySelector('[data-qr-copy]'), 'click', function (e) {
      var b = e.currentTarget;
      try { navigator.clipboard.writeText(addr); } catch (err) { /* clipboard 不可用,占位流程靜默略過 */ }
      b.textContent = t8.copied || 'Copied';
      setTimeout(function () { b.textContent = t8.copy || 'Copy'; }, 1500);
    });
    on(section.querySelector('[data-qr-back]'), 'click', function () {
      section.remove();
      [gatewayTabs, paymentTabs, formCard].forEach(function (el) { if (el) el.style.display = ''; });
    });
    on(section.querySelector('[data-qr-next]'), 'click', function () {
      section.remove();
      if (methodId === 'linepay') {
        var amountInput = document.querySelector('.pay-field[aria-label="Deposit amount"]');
        showDepositTransferStep(amountInput ? amountInput.value : '₩ 10,000');
      } else {
        [gatewayTabs, paymentTabs, formCard].forEach(function (el) { if (el) el.style.display = ''; });
        showMemberModal({ type: 'success', message: 'Your deposit application has been submitted.' });
      }
    });
  }
  function activeDepositMethodId() {
    var active = document.querySelector('.payment-tabs button.active');
    var label = active ? active.textContent.trim() : 'Bank Card';
    if (/LinePay/i.test(label)) return 'linepay';
    if (/TRC20/i.test(label)) return 'trc20';
    if (/ERC20/i.test(label)) return 'erc20';
    return 'bank';
  }

  function initBackofficeHint() {
    $all('[data-backoffice]').forEach(function (el) {
      on(el, 'click', function (e) {
        e.preventDefault();
        window.alert((D.T || {}).notAvailable || '此靜態預覽尚未包含此內容');
      });
    });
  }

  /* ======================== auto-refresh countdown badge ==================== */
  /* deposit-record / profit-loss / withdrawal-record 頁的「Auto refresh in
     30 s」倒數徽章。文案改用 D.AUTO_REFRESH_TMPL 逐語系模板(而非 SWEEP_PAIRS
     精確字串比對)——因為數字在句子中間持續變動,且 zh/ko 語序把數字放最前面、
     與 en/th「固定前綴 + 數字」的語序不同,固定前綴/後綴 + 動態數字的 DOM 拆法
     在四語系間無法通用,只能整句模板替換。此站為純靜態展示,無後端可打,
     「刷新」動作以資料表容器 pulse 一下作為可見回饋(復用既有 .animate-pulse,
     不新增樣式;不虛構資料、不打網路請求)。 */
  function findRefreshFlashTarget(label) {
    var node = label;
    while (node && node !== document.body) {
      var sib = node.nextElementSibling;
      if (sib && sib.querySelector && sib.querySelector('.p-datatable')) return sib;
      node = node.parentElement;
    }
    return null;
  }
  function initAutoRefresh() {
    var label = $('[data-refresh-label]');
    if (!label) return;
    var btn = $('[data-refresh-now]');
    var flashTarget = findRefreshFlashTarget(label);
    var counter = 30;
    var timer = null;

    function render() {
      var tmpl = (D.AUTO_REFRESH_TMPL || {})[currentLocale()] || (D.AUTO_REFRESH_TMPL || {}).en || 'Auto refresh in {n} s';
      label.textContent = tmpl.replace('{n}', counter);
    }
    function doRefresh() {
      if (!flashTarget) return;
      flashTarget.classList.remove('animate-pulse');
      void flashTarget.offsetWidth; /* force reflow so re-triggering restarts the animation from frame 0 */
      flashTarget.classList.add('animate-pulse');
      setTimeout(function () { flashTarget.classList.remove('animate-pulse'); }, 2000);
    }
    function restartTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () {
        counter -= 1;
        if (counter <= 0) {
          doRefresh();
          counter = 30;
        }
        render();
      }, 1000);
    }

    render();
    restartTimer();
    on(btn, 'click', function () {
      doRefresh();
      counter = 30;
      render();
      restartTimer();
    });
  }

  /* ============================ date range filter ======================== */
  /* Record pages (betting/deposit/withdrawal/account-record, profit-loss)
     ship a single "rb-daterange-input" field plus a "rb-daterange-btn"
     dropdown button and Confirm button, kept as one field rather than split
     into two native <input type=date>. This builds a small vanilla
     range-calendar popup anchored under the input and wires Confirm to
     hide/show <tbody> rows by their first YYYY-MM-DD cell. Rows with no
     parseable date (profit-loss.html's game-type aggregates) are always left
     visible — Confirm is then a graceful no-op there. */

  function drpParseRange(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})\s*~\s*(\d{4})-(\d{2})-(\d{2})$/.exec((v || '').trim());
    if (!m) return null;
    var start = new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0, 0);
    var end = new Date(+m[4], +m[5] - 1, +m[6], 23, 59, 59, 999);
    if (end < start) { var t = start; start = end; end = t; }
    return { start: start, end: end };
  }

  function drpRowDate(tr) {
    var cells = tr.children;
    for (var i = 0; i < cells.length; i++) {
      var m = /\d{4}-\d{2}-\d{2}/.exec(cells[i].textContent || '');
      if (m) return new Date(m[0] + 'T00:00:00');
    }
    return null;
  }

  function drpApplyFilter(table, rawValue) {
    if (!table) return;
    var range = drpParseRange(rawValue);
    $all('tbody tr', table).forEach(function (tr) {
      var d = drpRowDate(tr);
      if (!d) { tr.style.display = ''; return; } /* dateless row: always visible */
      tr.style.display = (!range || (d >= range.start && d <= range.end)) ? '' : 'none';
    });
  }

  function drpFindToolbar(input) {
    var node = input.parentElement;
    while (node && node !== document.body) {
      if (node.classList && node.classList.contains('rb-toolbar')) return node;
      node = node.parentElement;
    }
    return input.parentElement;
  }

  function drpFindConfirmBtn(toolbar) {
    return $all('button.btn-primary', toolbar).filter(function (b) {
      return /confirm|確認/i.test((b.textContent || '').trim());
    })[0] || $('button.btn-primary', toolbar);
  }

  function drpFindTable(toolbar) {
    var scope = (toolbar && toolbar.parentElement) || document;
    return $('table', scope) || document.querySelector('table');
  }

  var DRP_WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  function initDateRangeFilter() {
    var input = $('input.rb-daterange-input');
    if (!input) return;

    var toolbar = drpFindToolbar(input);
    var dropdownBtn = $('button.rb-daterange-btn', toolbar) || document.querySelector('button.rb-daterange-btn');
    var confirmBtn = drpFindConfirmBtn(toolbar);
    var table = drpFindTable(toolbar);

    input.readOnly = true;

    var today = new Date();
    var viewYear = today.getFullYear();
    var viewMonth = today.getMonth();
    var selStart = null;
    var selEnd = null;

    var pop = document.createElement('div');
    pop.className = 'drp-pop';
    pop.style.display = 'none';
    pop.setAttribute('role', 'dialog');
    document.body.appendChild(pop);

    function sameDay(a, b) {
      return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
    function pad2(n) { return n < 10 ? '0' + n : '' + n; }
    function fmt(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

    function render() {
      var cells = [];
      var first = new Date(viewYear, viewMonth, 1);
      var offset = first.getDay();
      var total = new Date(viewYear, viewMonth + 1, 0).getDate();
      for (var i = 0; i < offset; i++) cells.push(null);
      for (var d = 1; d <= total; d++) cells.push(new Date(viewYear, viewMonth, d));

      var rangeStart = selStart && selEnd ? (selStart < selEnd ? selStart : selEnd) : selStart;
      var rangeEnd = selStart && selEnd ? (selStart < selEnd ? selEnd : selStart) : null;

      var html = '<div class="drp-head">' +
        '<button type="button" class="drp-nav" data-drp-nav="-1" aria-label="Prev">‹</button>' +
        '<span class="drp-label">' + viewYear + ' / ' + pad2(viewMonth + 1) + '</span>' +
        '<button type="button" class="drp-nav" data-drp-nav="1" aria-label="Next">›</button>' +
        '<button type="button" class="drp-clear" data-drp-clear aria-label="Clear">✕</button>' +
        '</div><div class="drp-week">' +
        DRP_WEEKDAYS.map(function (w) { return '<span>' + w + '</span>'; }).join('') +
        '</div><div class="drp-grid">' +
        cells.map(function (c) {
          if (!c) return '<span class="drp-day is-empty"></span>';
          var cls = 'drp-day';
          if (rangeStart && sameDay(c, rangeStart)) cls += ' is-start';
          if (rangeEnd && sameDay(c, rangeEnd)) cls += ' is-end';
          if (rangeStart && rangeEnd && c > rangeStart && c < rangeEnd) cls += ' is-in-range';
          if (!rangeEnd && rangeStart && sameDay(c, rangeStart)) cls += ' is-end';
          return '<button type="button" class="' + cls + '" data-drp-day="' + fmt(c) + '">' + c.getDate() + '</button>';
        }).join('') +
        '</div>';
      pop.innerHTML = html;
    }

    function position() {
      var r = input.getBoundingClientRect();
      pop.style.left = (r.left + window.scrollX) + 'px';
      pop.style.top = (r.bottom + window.scrollY + 6) + 'px';
    }

    function open() {
      var range = drpParseRange(input.value);
      if (range) { viewYear = range.start.getFullYear(); viewMonth = range.start.getMonth(); }
      render();
      position();
      pop.style.display = 'block';
      document.addEventListener('mousedown', onOutside, true);
      document.addEventListener('keydown', onKey, true);
      window.addEventListener('scroll', position, true);
      window.addEventListener('resize', position);
    }
    function close() {
      pop.style.display = 'none';
      document.removeEventListener('mousedown', onOutside, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
    }
    function isOpen() { return pop.style.display !== 'none'; }
    function toggle() { if (isOpen()) close(); else open(); }
    function onOutside(e) {
      if (pop.contains(e.target) || e.target === input || e.target === dropdownBtn) return;
      close();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    on(pop, 'click', function (e) {
      var nav = e.target.closest && e.target.closest('[data-drp-nav]');
      if (nav) {
        var dir = +nav.getAttribute('data-drp-nav');
        viewMonth += dir;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        else if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        render();
        return;
      }
      if (e.target.closest && e.target.closest('[data-drp-clear]')) {
        selStart = null; selEnd = null;
        input.value = '';
        drpApplyFilter(table, '');
        render();
        return;
      }
      var dayBtn = e.target.closest && e.target.closest('[data-drp-day]');
      if (dayBtn) {
        var picked = new Date(dayBtn.getAttribute('data-drp-day') + 'T00:00:00');
        if (!selStart || (selStart && selEnd)) {
          selStart = picked;
          selEnd = null;
          render();
        } else {
          selEnd = picked;
          var s = selStart, en = selEnd;
          if (en < s) { var t = s; s = en; en = t; }
          selStart = s; selEnd = en;
          input.value = fmt(s) + ' ~ ' + fmt(en);
          render();
          close();
        }
      }
    });

    on(input, 'click', function (e) { e.preventDefault(); toggle(); });
    on(dropdownBtn, 'click', function (e) { e.preventDefault(); e.stopPropagation(); toggle(); });
    on(confirmBtn, 'click', function (e) {
      e.preventDefault();
      drpApplyFilter(table, input.value);
    });
  }

  /* =================================== boot ================================ */

  ready(function () {
    initFavorites();
    initTheme();
    applyMemberHeaderAccountBar();
    initNavDropdowns();
    initLocaleSwitcher();
    initHeaderMobileMenus();
    initMobileBottomNav();
    initAuthTriggers();
    initBanner();
    initMiniGamesGrid();
    initHomeRails();
    initModeTabsGeneric();
    initDepositFlow();
    initVendorBrowser();
    initAboutTabs();
    initUiKitTabsDemo();
    initBetRecordParlayRows();
    initPromotionDetail();
    initSportProviderTabs();
    initSportLoadMore();
    initMemberPageBehaviors();
    initMfEyeToggles();
    initAccountBankCarousel();
    initAccountWalletCard();
    initWithdrawalBankCarousel();
    initWithdrawalForms();
    initPersonalInfoPage();
    initChangePasswordPage();
    initSecurityPage();
    initBackofficeHint();
    initMemberQuickLinks();
    initCsOpenTriggers();
    initChatOpenTriggers();
    initAutoRefresh();
    initDateRangeFilter();
    initPublicConfigSync();
    initStudioSectionsSync();
    /* 開機套用已存語系(zh 基準時仍需把 about/FAQ 英文內文換成中文),
       並掛上 observer 讓其後動態產生的節點自動套用當前語系 */
    applyLocale(currentLocale(), false);
    initLocaleObserver();
  });
})();
