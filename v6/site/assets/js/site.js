// CMS_Frontend_v6 — 純靜態站 vanilla JS 行為層（無框架、無 build）。
(function () {
  'use strict';

  function safe(fn) { try { fn(); } catch (e) { /* 避免單一功能失敗拖垮整頁 */ } }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
  /* 遊戲卡圖片載入失敗（404／網路錯誤）時的墊底畫面：把壞掉的 <img>
     藏起來，在 .game-tile-art 補一個沿用 --text-dim 配色的圖示墊底，
     不用另外準備圖檔。error 事件不會冒泡，只能在 capture 階段抓。 */
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.nodeName !== 'IMG' || img.hidden) return;
    var art = img.closest('.game-tile-art');
    if (!art) return;
    img.hidden = true;
    if (art.querySelector('.game-tile-art-fallback')) return;
    art.insertAdjacentHTML('beforeend',
      '<span class="game-tile-art-fallback" aria-hidden="true">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">' +
          '<rect x="3" y="5" width="18" height="14" rx="2"></rect>' +
          '<circle cx="9" cy="10.5" r="1.6" fill="currentColor" stroke="none"></circle>' +
          '<path d="M4 17.5 9 12l3 3 3-3.5 5 5.5"></path>' +
          '<path d="M3 3l18 18"></path>' +
        '</svg>' +
      '</span>');
  }, true);

  /* studio（設計後台）套用首頁區塊顯示/站點名稱/skin：與 studio.js 共用同一把
     localStorage key,同源即可跨資料夾（../site/、../studio/）讀取,不受路徑影響。
     每個 applyStudioXxx 拆成「核心套用函式（接參數，可重複呼叫）」與「讀
     localStorage 的載入包裝」，讓 studio 開著 iframe 即時操作時可直接呼叫
     window.__cmsV6StudioApply 核心函式立即反映，不必等按下「套用到本站」、
     也不必整頁重整。 */
  var ORIGINAL_TITLE = document.title;
  var STUDIO_SECTIONS_KEY = 'cms-v6-studio-sections';
  var STUDIO_SITENAME_KEY = 'cms-v6-studio-sitename';
  var STUDIO_SKIN_KEY = 'cms-v6-studio-skin';
  var STUDIO_LAYOUT_KEY = 'cms-v6-studio-layout';

  function applySections(map) {
    Array.prototype.slice.call(document.querySelectorAll('[data-section]')).forEach(function (el) {
      var name = el.getAttribute('data-section');
      el.style.display = (map && map[name] === false) ? 'none' : '';
    });
  }
  function applySiteName(name) {
    document.title = name ? ORIGINAL_TITLE.replace(/^CMS_Frontend_v6/, name) : ORIGINAL_TITLE;
  }
  function applySkin(skinId) {
    document.documentElement.setAttribute('data-skin', skinId || 'apex-classic');
  }
  /* 首頁 12 欄版位:layout 是 [{key,span,variant}] 陣列,依陣列順序把對應
     [data-section] 元素依序 appendChild 回 .grid12(對已存在文件中的節點
     appendChild 等同於搬移到新位置,藉此同時做到「重新排序」),並更新
     data-span 決定跨欄數、data-variant 決定套用哪一種區塊變體(見
     assets/css/section-variants.css,v1 = 不覆寫,維持現況版面)。跟 studio
     的拖曳排序／寬度選單／變體選單共用這份格式。 */
  function applyLayout(layout) {
    var grid = document.querySelector('.grid12');
    if (!grid || !Array.isArray(layout)) return;
    layout.forEach(function (item) {
      var el = grid.querySelector('[data-section="' + item.key + '"]');
      if (!el) return;
      el.setAttribute('data-span', item.span || 3);
      el.setAttribute('data-variant', item.variant || 'v1');
      grid.appendChild(el);
    });
  }

  function applyStudioSections() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(STUDIO_SECTIONS_KEY)); } catch (e) { raw = null; }
    if (raw) applySections(raw);
  }
  function applyStudioSiteName() {
    var name;
    try { name = localStorage.getItem(STUDIO_SITENAME_KEY); } catch (e) { name = null; }
    if (name) applySiteName(name);
  }
  function applyStudioSkin() {
    var id;
    try { id = localStorage.getItem(STUDIO_SKIN_KEY); } catch (e) { id = null; }
    if (id) applySkin(id);
  }
  function applyStudioLayout() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(STUDIO_LAYOUT_KEY)); } catch (e) { raw = null; }
    if (raw) applyLayout(raw);
  }

  /* 12 欄版位的「直接在預覽畫面拖曳排序」:只有 studio 呼叫過
     __cmsV6StudioSetEditMode(true) 才會啟用,一般訪客直接開 index.html
     不會出現任何拖曳 UI／行為。每個模組左上角疊一個把手,只有從把手
     mousedown 才把該模組設成 draggable,放開/拖曳結束都還原,避免拖到
     模組內部的按鈕、輪播箭頭等既有互動。drop 完成後直接在 iframe 內
     appendChild 重新排序(同 applyLayout 的做法),再把最新順序透過
     postMessage 回報給同源的 studio 父頁,讓左側清單／localStorage 保持
     同步。 */
  var gridEditModeOn = false;
  function currentGridLayout() {
    var grid = document.querySelector('.grid12');
    if (!grid) return [];
    return Array.prototype.slice.call(grid.querySelectorAll('[data-section]')).map(function (el) {
      return { key: el.getAttribute('data-section'), span: Number(el.getAttribute('data-span')) || 3, variant: el.getAttribute('data-variant') || 'v1' };
    });
  }
  function notifyStudioReorder() {
    try { window.parent.postMessage({ type: 'cms-v6-studio-reorder', layout: currentGridLayout() }, location.origin); } catch (e) {}
  }
  function initGrid12DragEdit() {
    var grid = document.querySelector('.grid12');
    if (!grid) return;
    var dragEl = null;
    Array.prototype.slice.call(grid.querySelectorAll('[data-section]')).forEach(function (el) {
      if (el.querySelector('.grid12-drag-handle')) return; // 重複呼叫時不要疊加把手
      var handle = document.createElement('span');
      handle.className = 'grid12-drag-handle';
      handle.setAttribute('aria-hidden', 'true');
      handle.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>';
      el.style.position = el.style.position || 'relative';
      el.appendChild(handle);
      on(handle, 'mousedown', function () { el.setAttribute('draggable', 'true'); });
      on(el, 'dragstart', function (e) {
        dragEl = el;
        el.classList.add('grid12-dragging');
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      });
      on(el, 'dragend', function () {
        el.classList.remove('grid12-dragging');
        el.removeAttribute('draggable');
        dragEl = null;
        Array.prototype.slice.call(grid.querySelectorAll('[data-section]')).forEach(function (o) { o.classList.remove('grid12-drop-target'); });
      });
      on(el, 'dragover', function (e) { e.preventDefault(); if (dragEl && dragEl !== el) el.classList.add('grid12-drop-target'); });
      on(el, 'dragleave', function () { el.classList.remove('grid12-drop-target'); });
      on(el, 'drop', function (e) {
        e.preventDefault();
        el.classList.remove('grid12-drop-target');
        if (!dragEl || dragEl === el) return;
        grid.insertBefore(dragEl, el);
        notifyStudioReorder();
      });
    });
  }
  window.__cmsV6StudioSetEditMode = function (on) {
    gridEditModeOn = !!on;
    document.documentElement.classList.toggle('cms-v6-grid-edit', gridEditModeOn);
    if (gridEditModeOn) safe(initGrid12DragEdit);
  };

  /* studio 父頁（同源）在 iframe load 後或任何控制項變動時直接呼叫這個函式，
     即時把草稿反映到畫面上，不經過 localStorage、不需重整。 */
  window.__cmsV6StudioApply = function (draft) {
    if (!draft) return;
    if (draft.sections) applySections(draft.sections);
    if ('sitename' in draft) applySiteName(draft.sitename);
    if (draft.skin) applySkin(draft.skin);
    if (draft.layout) applyLayout(draft.layout);
    if (draft.locales && window.CMS_I18N) window.CMS_I18N.setVisibleLocales(draft.locales);
    if (gridEditModeOn) safe(initGrid12DragEdit); // layout 套用後可能重新排過 DOM,把手要重新確保存在
  };

  function initFeatureCarousel() {
    var carousel = document.getElementById('featureCarousel');
    if (!carousel) return;
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.feature-card'));
    var len = slides.length;
    if (!len) return;
    var idx = 0;
    setInterval(function () {
      idx = (idx + 1) % len;
      slides.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
    }, 5000);
  }

  function initVendorSelect() {
    var rails = Array.prototype.slice.call(document.querySelectorAll('.vendor-rail'));
    rails.forEach(function (rail) {
      var card = rail.closest('.feature-card');
      var bg = card ? card.querySelector('.feature-card-bg') : null;
      var chips = Array.prototype.slice.call(rail.querySelectorAll('.feature-vendor-chip'));
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (c) { c.classList.toggle('active', c === chip); });
          if (bg && chip.dataset.bg) bg.style.backgroundImage = 'url(' + chip.dataset.bg + ')';
        });
      });
    });
  }

  function initRails() {
    var rails = Array.prototype.slice.call(document.querySelectorAll('.tile-grid.rail'));
    rails.forEach(function (rail) {
      var panel = rail.closest('.panel');
      var prevBtn = panel ? panel.querySelector('.rail-arrow-prev') : null;
      var nextBtn = panel ? panel.querySelector('.rail-arrow-next') : null;

      function updateArrows() {
        var maxScroll = rail.scrollWidth - rail.clientWidth;
        if (prevBtn) prevBtn.disabled = rail.scrollLeft <= 4;
        if (nextBtn) nextBtn.disabled = maxScroll <= 4 || rail.scrollLeft >= maxScroll - 4;
      }
      if (prevBtn) prevBtn.addEventListener('click', function () { rail.scrollBy({ left: -rail.clientWidth * 0.9, behavior: 'smooth' }); });
      if (nextBtn) nextBtn.addEventListener('click', function () { rail.scrollBy({ left: rail.clientWidth * 0.9, behavior: 'smooth' }); });
      rail.addEventListener('scroll', updateArrows);
      window.addEventListener('resize', updateArrows);
      updateArrows();

      // 滑鼠可直接按住拖曳橫向捲動（觸控裝置原生滑動已可用，這裡補上桌機滑鼠操作）。
      var dragging = false;
      var startX = 0;
      var startScroll = 0;
      rail.addEventListener('mousedown', function (e) {
        dragging = true;
        rail.classList.add('dragging');
        startX = e.pageX;
        startScroll = rail.scrollLeft;
      });
      window.addEventListener('mouseup', function () {
        if (!dragging) return;
        dragging = false;
        rail.classList.remove('dragging');
      });
      window.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        e.preventDefault();
        rail.scrollLeft = startScroll - (e.pageX - startX);
      });
    });
  }

  /* 收藏：以 localStorage 保存，事件代理掛在 document 上,
     讓 tab 切換重繪卡片後仍然有效。 */
  var FAV_KEY = 'cms-v6-favorites';
  function favIds() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }
  function saveFavIds(ids) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(ids)); } catch (e) {}
  }
  function initFavorites() {
    var ids = favIds();
    Array.prototype.slice.call(document.querySelectorAll('.game-tile-fav')).forEach(function (btn) {
      var on = ids.indexOf(btn.getAttribute('data-fav-id')) !== -1;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.game-tile-fav');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var id = btn.getAttribute('data-fav-id');
      if (!id) return;
      var list = favIds();
      var idx = list.indexOf(id);
      if (idx === -1) list.push(id); else list.splice(idx, 1);
      saveFavIds(list);
      btn.classList.toggle('is-active', idx === -1);
      btn.setAttribute('aria-pressed', String(idx === -1));
      updateListingVisibility();
    });
  }

  /* 分類頁「廠商 / 收藏」頁簽 + 搜尋 + 顯示更多,統一計算每張卡片的顯示狀態,
     避免三種機制各自寫 hidden 互相覆蓋。搜尋有關鍵字時不受顯示更多的筆數
     上限限制（符合條件全部列出）；沒有 #listingLoadMore 按鈕的頁面（如運動
     賽事）視為沒有上限。 */
  function updateListingVisibility() {
    var grid = document.getElementById('listingGrid');
    if (!grid) return;
    var active = document.querySelector('.listing-tab.active');
    var mode = active ? active.getAttribute('data-listing-tab') : 'all';
    var ids = favIds();
    var searchWrap = document.querySelector('.listing-search');
    var input = searchWrap ? searchWrap.querySelector('input') : null;
    var q = input ? (input.value || '').trim().toLowerCase() : '';
    var loadMoreBtn = document.getElementById('listingLoadMore');
    var limit = loadMoreBtn ? (parseInt(grid.getAttribute('data-visible'), 10) || 20) : Infinity;
    var matched = 0;
    var shown = 0;
    var sportChip = document.querySelector('.sport-chip.active');
    var sport = sportChip ? sportChip.getAttribute('data-sport') : null;
    /* .game-tile 用卡片名稱比對;.match-card（體育賽事）沒有單一名稱欄位,
       改比對 data-search（聯賽+雙方隊伍）。 */
    Array.prototype.slice.call(grid.querySelectorAll('.game-tile, .match-card')).forEach(function (card) {
      var isGameTile = card.classList.contains('game-tile');
      var name = isGameTile
        ? ((card.querySelector('.game-tile-name') || {}).textContent || '')
        : (card.getAttribute('data-search') || '');
      var matchesSearch = !q || name.toLowerCase().indexOf(q) !== -1;
      var matchesFav = true;
      if (isGameTile && mode === 'fav') {
        var favBtn = card.querySelector('.game-tile-fav');
        var id = favBtn ? favBtn.getAttribute('data-fav-id') : '';
        matchesFav = ids.indexOf(id) !== -1;
      }
      var matchesSport = !sport || sport === 'all' || card.getAttribute('data-sport') === sport;
      var show = false;
      if (matchesSearch && matchesFav && matchesSport) {
        matched++;
        show = q ? true : matched <= limit;
      }
      card.hidden = !show;
      if (show) shown++;
    });
    var empty = document.getElementById('listingEmpty');
    if (empty) empty.hidden = shown !== 0;
    if (loadMoreBtn) loadMoreBtn.hidden = !!q || matched <= limit;
  }
  /* 體育頁球類篩選捷徑列:目前只有 sport.html 的賽事卡帶 data-sport,
     切到沒有對應賽事的球類（如拳擊/排球/UFC）比照參考站行為顯示
     #listingEmpty 的「找不到符合的賽事」,不硬湊假資料。 */
  function initSportChips() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.sport-chip'));
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.toggle('active', c === chip); });
        updateListingVisibility();
      });
    });
  }
  function initListingTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.listing-tab'));
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        var grid = document.getElementById('listingGrid');
        if (grid) grid.setAttribute('data-visible', '20');
        updateListingVisibility();
      });
    });
    updateListingVisibility();
  }

  /* 分類頁搜尋：即時過濾卡片名稱（前台靜態站無後端,純前端比對）。 */
  function initListingSearch() {
    var wrap = document.querySelector('.listing-search');
    var grid = document.getElementById('listingGrid');
    if (!wrap || !grid) return;
    var input = wrap.querySelector('input');
    var btn = wrap.querySelector('button');
    input.addEventListener('input', updateListingVisibility);
    if (btn) btn.addEventListener('click', updateListingVisibility);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') updateListingVisibility(); });
  }

  /* 分類頁「顯示更多」：預設先顯示 20 筆,每次點擊再多顯示 20 筆,全部顯示後按鈕隱藏。 */
  function initListingLoadMore() {
    var btn = document.getElementById('listingLoadMore');
    var grid = document.getElementById('listingGrid');
    if (!btn || !grid) return;
    btn.addEventListener('click', function () {
      var limit = parseInt(grid.getAttribute('data-visible'), 10) || 20;
      grid.setAttribute('data-visible', String(limit + 20));
      updateListingVisibility();
    });
    updateListingVisibility();
  }

  /* ── 登入機制:前端模擬,無真實後端驗證 ──
     登入狀態存 localStorage（同源跨頁、跨 ../site/ ../studio/ 資料夾共用），
     任何非空用戶名即視為登入成功。header-auth 依狀態動態渲染,取代原本
     「首頁固定訪客態、會員頁固定登入態」的寫死版面;會員限定頁在未登入
     時直接導回首頁。 */
  var AUTH_KEY = 'cms-v6-auth';
  var DEFAULT_BALANCE = '₩1,000,000,000';
  var DEFAULT_POINTS = '0.00';
  var MEMBER_PAGES = ['account.html', 'deposit.html', 'withdrawal.html', 'betting-record.html',
    'deposit-record.html', 'withdrawal-record.html', 'withdrawal-detail.html', 'account-record.html', 'profit-loss.html',
    'personal-info.html', 'security.html', 'change-password.html'];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
  }
  function currentPage() { return location.pathname.split('/').pop() || 'index.html'; }
  /* i18n.js 需在 site.js 之前載入,見各頁 <head>；tr() 只是薄包裝,
     萬一漏載入也不會整頁壞掉,退回原始中文。 */
  function tr(key, fallback) { return window.CMS_I18N ? window.CMS_I18N.t(key) : fallback; }
  function loadAuth() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch (e) { return null; }
  }
  function saveAuth(user) {
    try { if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user)); else localStorage.removeItem(AUTH_KEY); } catch (e) {}
  }
  function isLoggedIn() { return !!loadAuth(); }

  /* 訪客態只留「立即註冊／登錄」兩顆按鈕（比照參考站 JOIN／LOGIN 的
     極簡配置），不再像舊版把用戶名/密碼輸入框直接攤在 header 上——
     點「登錄」一律開登入彈窗,帳密輸入收斂到彈窗內完成。JOIN 是實心
     主要按鈕、LOGIN 是純文字連結,視覺層級對齊參考站。 */
  function guestAuthHtml() {
    return '<span class="header-auth-badge-wrap"><button type="button" class="btn-accent" data-auth-open="register">' + tr('auth.registerNow', '立即註冊') + '</button><span class="header-auth-badge" aria-hidden="true"></span></span>' +
      '<button type="button" class="btn-accent ghost" data-auth-open="login">' + tr('auth.login', '登錄') + '</button>';
  }
  function memberAuthHtml(user) {
    return '<a href="account.html" class="header-nav-link header-nav-link-user" style="gap:8px">' + USER_ICON + '<span>' + escapeHtml(user.name) + '</span></a>' +
      '<span class="header-forgot">' + tr('auth.balancePrefix', '餘額：') + escapeHtml(user.balance) + '</span>' +
      '<span class="header-forgot">' + tr('auth.pointsPrefix', '點數：') + escapeHtml(user.points || DEFAULT_POINTS) + '</span>' +
      '<button type="button" class="btn-accent quiet" data-logout>' + tr('auth.logout', '登出') + '</button>';
  }
  /* 依登入狀態重繪 header-auth,取代原本每頁寫死的訪客/會員版面。
     訪客態的「登錄／立即註冊」一律開對應的登入彈窗完成帳密輸入。 */
  function renderHeaderAuth() {
    var bar = document.querySelector('.header-auth');
    if (!bar) return;
    var user = loadAuth();
    bar.innerHTML = user ? memberAuthHtml(user) : guestAuthHtml();
    if (!user) {
      on(bar.querySelector('[data-auth-open="login"]'), 'click', function () { openAuthModal('login'); });
      on(bar.querySelector('[data-auth-open="register"]'), 'click', function () { openAuthModal('register'); });
    }
  }
  // header-auth 是常駐可見的動態區塊,換語系時要立即重繪；其餘彈窗/選單
  // 本來就是每次開啟才重新產生 HTML,下次開啟自然是當前語系,不需另外處理。
  on(document, 'cms-v6:locale-changed', function () {
    renderHeaderAuth();
    if (currentPage() === 'withdrawal.html') renderWithdrawalUI();
  });
  /* 未輸入帳號時的預設示範名稱,跟各頁登入態的靜態版面(如 account.html
     的 .acct-name)沿用同一個 demo 帳號名 meqomcao,不用「會員」這種
     通用字樣佔位。 */
  function doLogin(name) {
    saveAuth({ name: name || 'meqomcao', balance: DEFAULT_BALANCE, points: DEFAULT_POINTS });
    renderHeaderAuth();
  }
  function doLogout() {
    saveAuth(null);
    if (MEMBER_PAGES.indexOf(currentPage()) !== -1) { location.href = 'index.html'; return; }
    renderHeaderAuth();
  }
  /* 會員限定頁在未登入時直接導回首頁;訪客可瀏覽的頁面不受影響。
     在 studio 的 iframe 預覽中略過此導向,否則設計後台無法預覽會員頁。 */
  function initAuthGuard() {
    if (window !== window.top) return;
    if (MEMBER_PAGES.indexOf(currentPage()) !== -1 && !isLoggedIn()) location.href = 'index.html';
  }
  /* 個人資料頁的「暱稱」要跟 header 顯示的登入名稱同一個來源(loadAuth().name),
     不能各自寫死一份,否則登入名稱一改兩處就對不上。 */
  function initPersonalInfoNickname() {
    var el = document.querySelector('[data-pi-nickname]');
    if (!el) return;
    var user = loadAuth();
    if (user && user.name) el.textContent = user.name;
  }
  /* 登出按鈕散落在會員頁 header／安全中心／手機選單,事件代理掛在
     document,手機選單是點擊 hamburger 後才動態插入 DOM,逐一綁定會
     抓不到後來才出現的登出按鈕。 */
  function initMemberLogout() {
    on(document, 'click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-logout]');
      if (!btn) return;
      doLogout();
    });
  }

  /* 全螢幕/遮罩型 overlay 開啟時鎖住背景捲動。計數器管理,避免多個
     overlay 疊開時互相解鎖;實際捲動的是 document.scrollingElement(=<html>),
     只鎖 body 蓋不住。 */
  var scrollLockCount = 0;
  function lockScroll() {
    if (scrollLockCount === 0) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
    scrollLockCount++;
  }
  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }

  var USER_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

  /* 漢堡鈕在側欄選單開啟時要變成 X,關閉時要換回三線 icon;innerHTML
     直接整顆換掉,不額外疊 class 控制顯示/隱藏兩組 svg。 */
  var HAMBURGER_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  var CLOSE_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  /* header 漢堡鍵（現在跟 logo 同排、橫跨滿版寬度的常駐 header 裡）開關
     所有斷點共用同一個 .is-sidebar-open 狀態：
     - 桌機寬度：.v6-sidebar 本身（常駐 224px、position:sticky）完全
       不動、不覆蓋主內容,只是側欄裡的登入/註冊捷徑＋促銷卡
       （.v6-sidebar-mobile-extra）用動畫展開/收起,不需要鎖背景捲動。
     - 中寬度以下（見 CSS 的 max-width:1080px）：側欄本身是離屏抽屜,
       展開時滑入蓋住整個畫面（含 header）,才需要鎖住背景捲動。 */
  function isDesktopSidebar() {
    return window.matchMedia('(min-width: 1081px)').matches;
  }
  function setSidebarOpen(open) {
    var shell = document.querySelector('.v6-shell');
    var trigger = document.querySelector('.header-menu-trigger');
    if (!shell) return;
    shell.classList.toggle('is-sidebar-open', open);
    if (!isDesktopSidebar()) {
      if (open) lockScroll(); else unlockScroll();
    }
    if (trigger) {
      trigger.innerHTML = open ? CLOSE_ICON : HAMBURGER_ICON;
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }
  function toggleSidebar() {
    var shell = document.querySelector('.v6-shell');
    setSidebarOpen(!(shell && shell.classList.contains('is-sidebar-open')));
  }
  function initSidebar() {
    var shell = document.querySelector('.v6-shell');
    if (!shell) return;
    Array.prototype.slice.call(shell.querySelectorAll('[data-sidebar-close]')).forEach(function (el) {
      on(el, 'click', function () { setSidebarOpen(false); });
    });
    Array.prototype.slice.call(shell.querySelectorAll('.v6-sidebar-link')).forEach(function (a) {
      on(a, 'click', function () { setSidebarOpen(false); });
    });
    /* 側欄收合成選單時（見 CSS max-width:1080px）才會露出的登入/註冊
     捷徑，點擊開啟跟 header 登入/註冊鈕同一個 .auth-modal，不是另外
     做一套。 */
    on(shell.querySelector('[data-mobile-login]'), 'click', function (e) { e.preventDefault(); openAuthModal('login'); });
    on(shell.querySelector('[data-mobile-register]'), 'click', function (e) { e.preventDefault(); openAuthModal('register'); });
    renderSidebarAuth();
    /* 展開後的「遊戲分類」／「My Account」分類群組,標題可點擊收合/展開
       （比照參考站 Casino／Sport 群組的 accordion 做法),彼此獨立、
       預設都展開。 */
    Array.prototype.slice.call(shell.querySelectorAll('[data-sidebar-group-toggle]')).forEach(function (btn) {
      on(btn, 'click', function () {
        var group = btn.closest('[data-sidebar-group]');
        if (!group) return;
        var open = group.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }
  /* 已登入時側欄選單裡的登入/註冊捷徑沒有意義（帳戶相關功能已經在
     下方「My Account」區塊），直接藏起來，不重複顯示。 */
  function renderSidebarAuth() {
    var wrap = document.querySelector('[data-sidebar-auth]');
    if (wrap) wrap.style.display = isLoggedIn() ? 'none' : '';
  }
  /* 首頁 hero 輪播：固定 interval 換頁 + 手動箭頭/圓點,沒有 slide 就
     直接跳過（分類頁 hero 只有單一版面，不需要輪播控制項）。 */
  function initHeroCarousel() {
    var root = document.querySelector('[data-hero-carousel]');
    if (!root) return;
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    if (slides.length < 2) return;
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    var idx = 0;
    var timer = null;
    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('active', n === idx); });
      dots.forEach(function (d, n) { d.classList.toggle('active', n === idx); });
    }
    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () { show(idx + 1); }, 6000);
    }
    on(root.querySelector('[data-hero-prev]'), 'click', function () { show(idx - 1); restart(); });
    on(root.querySelector('[data-hero-next]'), 'click', function () { show(idx + 1); restart(); });
    dots.forEach(function (d, n) { on(d, 'click', function () { show(n); restart(); }); });
    restart();
  }
  /* header 漢堡鍵與底部 tabbar「選單」鍵現在開的是同一顆 .v6-sidebar
     （側欄在中寬度以下收合成選單／手機寬度改成下方彈出，見 CSS），
     不再各自維護一份選單內容。 */
  function initHeaderMobileMenu() {
    on(document.querySelector('.header-menu-trigger'), 'click', toggleSidebar);
    Array.prototype.slice.call(document.querySelectorAll('.mobile-tabbar-menu')).forEach(function (btn) {
      on(btn, 'click', toggleSidebar);
    });
  }

  /* ── 登入／註冊彈窗:前端模擬,不檢查密碼是否正確,送出即視為登入成功
     （與 header 上的即時登入共用 doLogin）。 ── */
  var authModalRoot = null;
  function closeAuthModal() { if (authModalRoot) { authModalRoot.remove(); authModalRoot = null; unlockScroll(); } }
  function authModalBodyHtml(mode) {
    var isRegister = mode === 'register';
    return (
      '<div class="auth-modal-tabs">' +
      '<button type="button" class="auth-modal-tab' + (isRegister ? '' : ' active') + '" data-auth-switch="login">' + tr('auth.login', '登錄') + '</button>' +
      '<button type="button" class="auth-modal-tab' + (isRegister ? ' active' : '') + '" data-auth-switch="register">' + tr('auth.register', '註冊') + '</button>' +
      '</div>' +
      '<div class="form-field"><label class="form-label">' + tr('auth.usernameLabel', '用戶名') + '</label><input type="text" class="form-input" placeholder="' + tr('auth.usernameInputPlaceholder', '請輸入用戶名') + '" data-auth-username></div>' +
      '<div class="form-field"><label class="form-label">' + tr('auth.passwordLabel', '密碼') + '</label><input type="password" class="form-input" placeholder="' + tr('auth.passwordInputPlaceholder', '請輸入密碼') + '"></div>' +
      (isRegister ? '<div class="form-field"><label class="form-label">' + tr('auth.confirmPasswordLabel', '確認密碼') + '</label><input type="password" class="form-input" placeholder="' + tr('auth.confirmPasswordPlaceholder', '請再次輸入密碼') + '"></div>' : '') +
      '<a href="#" class="btn-accent auth-modal-submit" data-auth-submit>' + (isRegister ? tr('auth.register', '註冊') : tr('auth.login', '登錄')) + '</a>'
    );
  }
  function openAuthModal(mode) {
    closeAuthModal();
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="auth-modal-overlay" data-auth-overlay>' +
      '<div class="auth-modal-box">' +
      '<div class="auth-modal-head"><h3 class="auth-modal-title" data-auth-title></h3>' +
      '<button type="button" class="auth-modal-close" aria-label="' + tr('cs.chatClose', '關閉') + '" data-auth-close><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="auth-modal-body" data-auth-body></div>' +
      '</div></div>';
    authModalRoot = wrap.firstElementChild;
    document.body.appendChild(authModalRoot);
    lockScroll();
    on(authModalRoot, 'click', function (e) { if (e.target === authModalRoot) closeAuthModal(); });
    on(authModalRoot.querySelector('[data-auth-close]'), 'click', closeAuthModal);
    function render(m) {
      authModalRoot.querySelector('[data-auth-title]').textContent = m === 'register' ? tr('auth.register', '註冊') : tr('auth.login', '登錄');
      var body = authModalRoot.querySelector('[data-auth-body]');
      body.innerHTML = authModalBodyHtml(m);
      Array.prototype.slice.call(body.querySelectorAll('[data-auth-switch]')).forEach(function (tab) {
        on(tab, 'click', function () { render(tab.getAttribute('data-auth-switch')); });
      });
      on(body.querySelector('[data-auth-submit]'), 'click', function (e) {
        e.preventDefault();
        var nameInput = body.querySelector('[data-auth-username]');
        doLogin(nameInput && nameInput.value);
        closeAuthModal();
      });
    }
    render(mode || 'login');
  }

  /* ── 客服彈窗 ── */
  var csModalRoot = null;
  function closeCsModal() { if (csModalRoot) { csModalRoot.remove(); csModalRoot = null; unlockScroll(); } }
  function openCsModal() {
    if (csModalRoot) return;
    var rows = [
      { icon: '<path d="M21 12c0 4.4-4 8-9 8a10 10 0 0 1-3.6-.7L3 21l1.4-4.5A8 8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z"/>', title: tr('cs.liveChatTitle', '線上客服'), desc: tr('cs.liveChatDesc', '24 小時即時支援') },
      { icon: '<path d="m22 2-7 20-4-9-9-4Z"/>', title: tr('cs.telegramTitle', 'Telegram 頻道'), desc: tr('cs.telegramDesc', '最新活動與公告') },
      { icon: '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>', title: tr('cs.emailTitle', 'Email 信箱'), desc: 'support@bet100.gg' },
    ];
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="cs-modal-overlay" data-cs-overlay>' +
      '<div class="cs-modal-box">' +
      '<div class="cs-modal-head"><h3 class="cs-modal-title">' + tr('cs.title', '聯絡客服') + '</h3>' +
      '<button type="button" class="cs-modal-close" aria-label="' + tr('cs.chatClose', '關閉') + '" data-cs-close><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="cs-modal-body">' +
      rows.map(function (r) {
        return '<a href="#" class="cs-opt"><span class="cs-opt-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + r.icon + '</svg></span>' +
          '<span class="cs-opt-text"><strong>' + r.title + '</strong><small>' + r.desc + '</small></span></a>';
      }).join('') +
      '</div></div></div>';
    csModalRoot = wrap.firstElementChild;
    document.body.appendChild(csModalRoot);
    lockScroll();
    on(csModalRoot, 'click', function (e) { if (e.target === csModalRoot) closeCsModal(); });
    on(csModalRoot.querySelector('[data-cs-close]'), 'click', closeCsModal);
  }
  function initCsTriggers() {
    /* [data-cs-open]：任何元素只要掛這個屬性都能開客服彈窗（首頁公告列
       「線上客服」連結即用此屬性),不綁定特定 class。quick-rail 的「線上
       客服」則改開右下角對話視窗(chat widget),兩者是不同入口。 */
    Array.prototype.slice.call(document.querySelectorAll('[data-cs-open]')).forEach(function (btn) {
      on(btn, 'click', function (e) { e.preventDefault(); openCsModal(); });
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-chat-open]')).forEach(function (btn) {
      on(btn, 'click', function (e) { e.preventDefault(); openChatWidget(); });
    });
  }

  /* 右下角客服對話視窗:純前端模擬,無真實客服後端。開一次後只切換顯示/
     縮小,不重複建立節點。使用者送出訊息後,固定延遲顯示一則罐頭回覆,
     模擬「客服已收到、稍後回覆」的效果。 */
  var chatWidgetRoot = null;
  function scrollChatToBottom() {
    var body = chatWidgetRoot && chatWidgetRoot.querySelector('[data-chat-body]');
    if (body) body.scrollTop = body.scrollHeight;
  }
  function appendChatMsg(kind, text) {
    var body = chatWidgetRoot.querySelector('[data-chat-body]');
    var row = document.createElement('div');
    row.className = 'chat-msg chat-msg-' + kind;
    row.innerHTML = (kind === 'bot' ? '<svg class="chat-msg-avatar" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 2.5 21h19L12 2.5Z" fill="#17b866"/><path d="M12 10.5 7.6 21h8.8L12 10.5Z" fill="#0a1917" fill-opacity=".35"/></svg>' : '') +
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
      '<svg class="chat-widget-avatar" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 2.5 21h19L12 2.5Z" fill="#17b866"/><path d="M12 10.5 7.6 21h8.8L12 10.5Z" fill="#0a1917" fill-opacity=".35"/></svg>' +
      '<div class="chat-widget-head-text"><strong>' + tr('cs.liveChatTitle', '線上客服') + '</strong>' +
      '<span class="chat-widget-status"><i></i>' + tr('cs.chatOnline', '線上') + '</span></div>' +
      '<button type="button" class="chat-widget-min" data-chat-min aria-label="' + tr('cs.chatMinimize', '縮小') + '">–</button>' +
      '<button type="button" class="chat-widget-close" data-chat-close aria-label="' + tr('cs.chatClose', '關閉') + '">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '</div>' +
      '<div class="chat-widget-body" data-chat-body></div>' +
      '<form class="chat-widget-form" data-chat-form>' +
      '<input type="text" data-chat-input placeholder="' + tr('cs.chatPlaceholder', '輸入訊息…') + '" autocomplete="off">' +
      '<button type="submit" aria-label="' + tr('cs.chatSend', '傳送') + '"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 9-18 9 4-9Z"/></svg></button>' +
      '</form></div>';
    chatWidgetRoot = wrap.firstElementChild;
    document.body.appendChild(chatWidgetRoot);
    appendChatMsg('bot', tr('cs.chatGreeting', '您好，有什麼能為您服務的嗎？客服人員將盡快為您回覆。'));
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
        if (chatWidgetRoot) appendChatMsg('bot', tr('cs.chatAutoReply', '感謝您的訊息，客服人員將盡快回覆，請稍候。'));
      }, 700);
    });
  }

  /* 關於我們頁：頁籤切換 + FAQ 手風琴。支援 ?tab= 帶入指定分頁,
     讓其他頁面（如首頁公告列「常見問題」）可以直接連到對應分頁。 */
  function initAboutTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.about-tab'));
    if (!tabs.length) return;
    function activate(tab) {
      tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
      var target = tab.getAttribute('data-about-tab');
      Array.prototype.slice.call(document.querySelectorAll('.about-panel')).forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-about-panel') !== target;
      });
    }
    tabs.forEach(function (tab) { on(tab, 'click', function () { activate(tab); }); });
    var wanted = new URLSearchParams(location.search).get('tab');
    var match = wanted && tabs.filter(function (t) { return t.getAttribute('data-about-tab') === wanted; })[0];
    if (match) activate(match);
  }
  function initFaqAccordion() {
    Array.prototype.slice.call(document.querySelectorAll('.faq-trigger')).forEach(function (btn) {
      on(btn, 'click', function () { btn.closest('.faq-card').classList.toggle('open'); });
    });
  }

  /* 體育串關展開列（目前只有 betting-record.html 有 .rt-parlay-toggle，
     其餘頁面 querySelectorAll 拿到空集合安全跳過）。展開/收合純粹是
     .rt-parlay-row 切 open class，子表顯示交給 CSS 的相鄰兄弟選擇器
     （.rt-parlay-row.open + .rt-parlay-detail），比照 .faq-card 寫法。 */
  function initBetRecordParlayRows() {
    Array.prototype.slice.call(document.querySelectorAll('.rt-parlay-toggle')).forEach(function (btn) {
      on(btn, 'click', function () {
        var row = btn.closest('.rt-parlay-row');
        if (!row) return;
        var open = row.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* 儲值／提款頁：付款方式頁籤 + 金額快選按鈕。兩頁共用同一套 class
     （pay-tabs/pay-amount-grid/pay-field），金額輸入框在標記中緊接於金額
     grid 之後，用 nextElementSibling 取得對應欄位。 */
  function initPayTabs() {
    Array.prototype.slice.call(document.querySelectorAll('.pay-tabs')).forEach(function (group) {
      var tabs = Array.prototype.slice.call(group.querySelectorAll('.pay-tab'));
      tabs.forEach(function (tab) {
        on(tab, 'click', function () {
          tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        });
      });
    });
  }
  function initPayAmount() {
    Array.prototype.slice.call(document.querySelectorAll('.pay-amount-grid')).forEach(function (grid) {
      var btns = Array.prototype.slice.call(grid.querySelectorAll('.pay-amount-btn'));
      var field = grid.nextElementSibling;
      if (!field || !field.classList.contains('pay-field')) field = null;
      btns.forEach(function (btn) {
        on(btn, 'click', function () {
          btns.forEach(function (b) { b.classList.toggle('selected', b === btn); });
          if (field) field.value = '₩ ' + btn.textContent.trim();
        });
      });
    });
  }

  /* 通用結果/表單彈窗:外殼沿用 .auth-modal-* class(純容器樣式,登入彈窗與
     這裡的儲值/提款流程共用,不含 auth 專屬邏輯)。 */
  var payModalRoot = null;
  function closePayModal() { if (payModalRoot) { payModalRoot.remove(); payModalRoot = null; unlockScroll(); } }
  function openPayModal(title, bodyHtml) {
    closePayModal();
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="auth-modal-overlay" data-pay-overlay>' +
      '<div class="auth-modal-box">' +
      '<div class="auth-modal-head"><h3 class="auth-modal-title">' + title + '</h3>' +
      '<button type="button" class="auth-modal-close" aria-label="' + tr('cs.chatClose', '關閉') + '" data-pay-close><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="auth-modal-body">' + bodyHtml + '</div>' +
      '</div></div>';
    payModalRoot = wrap.firstElementChild;
    document.body.appendChild(payModalRoot);
    lockScroll();
    on(payModalRoot, 'click', function (e) { if (e.target === payModalRoot) closePayModal(); });
    on(payModalRoot.querySelector('[data-pay-close]'), 'click', closePayModal);
    return payModalRoot;
  }
  function simplePayModal(title, message) {
    var root = openPayModal(title, '<p class="about-text">' + message + '</p><button type="button" class="btn-accent" style="width:100%">' + tr('common.confirm', '確定') + '</button>');
    on(root.querySelector('.auth-modal-body .btn-accent'), 'click', closePayModal);
    return root;
  }

  /* 儲值送出流程:銀行卡先給轉帳資訊、LinePay/USDT 先給收款位址,使用者按
     「已完成」才算成功——純前端模擬,不接真實金流。 */
  var PAY_ADDR = { linepay: 'https://line.example/pay/8f3c1a92b7d4e05f', trc20: 'TXk9YmR2pQ7sN3vB1cE6hK8jL0tUw', erc20: '0x8f3c1a92b7d4e05fA1cE6hK8jL0tUw12' };
  function payMethodId(root) {
    var act = (root || document).querySelector('.pay-tabs .pay-tab.active');
    var label = act ? act.textContent.trim() : tr('pay.bankCard', '銀行卡');
    if (/LinePay/i.test(label)) return 'linepay';
    if (/TRC20/i.test(label)) return 'trc20';
    if (/ERC20/i.test(label)) return 'erc20';
    return 'bank';
  }
  function depositSuccessModal() {
    simplePayModal(tr('dp.successTitle', '儲值成功'), tr('dp.successMessage', '您的儲值申請已送出，請至「儲值紀錄」查看處理進度。'));
  }
  /* 示意用 QR Code:固定 seed 產生,只求視覺像 QR(三個定位角 + 隨機模組),
     不編碼真實內容,純介面展示。 */
  function fakeQrModules() {
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
  function depositStepModal(methodId, amountVal) {
    var isBank = methodId === 'bank';
    var body;
    if (isBank) {
      body =
        '<div class="bank-row"><span>' + escapeHtml(tr('dp.receivingBank', '收款銀行')) + '</span><strong style="margin-left:auto">國民銀行</strong></div>' +
        '<div class="bank-row"><span>' + escapeHtml(tr('dp.receivingAccount', '收款帳號')) + '</span><strong class="mono" style="margin-left:auto">881-234-567890</strong></div>' +
        '<div class="bank-row"><span>' + escapeHtml(tr('dp.depositAmountLabel', '儲值金額')) + '</span><strong style="margin-left:auto">' + escapeHtml(amountVal) + '</strong></div>' +
        '<p class="pay-note">' + escapeHtml(tr('dp.transferNote', '完成轉帳後請點擊下方按鈕，系統將盡快為您確認入帳。')) + '</p>' +
        '<button type="button" class="btn-accent" style="width:100%" data-pay-done>' + escapeHtml(tr('dp.transferDoneBtn', '我已完成轉帳')) + '</button>';
    } else {
      var addr = PAY_ADDR[methodId] || PAY_ADDR.linepay;
      var addrLabel = methodId === 'linepay' ? tr('dp.paymentUrl', '付款網址') : tr('dp.receivingAddress', '收款地址');
      body =
        '<p class="about-text">' + escapeHtml(tr('dp.scanPayDesc', '請使用手機掃描下方 QR Code，或複製{label}完成付款。').replace('{label}', addrLabel)) + '</p>' +
        '<div style="text-align:center;margin-bottom:14px"><svg width="176" height="176" viewBox="0 0 29 29" shape-rendering="crispEdges" role="img" aria-label="' + tr('pay.qrCodeLabel', '付款 QR Code') + '"><rect width="29" height="29" fill="#fff"></rect>' + fakeQrModules() + '</svg></div>' +
        '<label class="member-panel-title" style="font-size:12.5px;margin-bottom:6px;display:block">' + escapeHtml(addrLabel) + '</label>' +
        '<div style="display:flex;gap:8px">' +
        '<input class="pay-field" style="width:auto;flex:1" value="' + escapeHtml(addr) + '" readonly />' +
        '<button type="button" class="btn-accent" style="padding:0 16px" data-pay-copy>' + escapeHtml(tr('dp.copy', '複製')) + '</button>' +
        '</div>' +
        '<p class="pay-note">' + escapeHtml(tr('dp.qrDemoNote', '此為示意用 QR Code 與{label}，僅供介面展示。').replace('{label}', addrLabel)) + '</p>' +
        '<button type="button" class="btn-accent" style="width:100%" data-pay-done>' + escapeHtml(tr('dp.paymentDoneBtn', '我已完成付款')) + '</button>';
    }
    var root = openPayModal(isBank ? tr('dp.transferInfoTitle', '轉帳資訊') : tr('dp.scanPayTitle', '掃碼付款'), body);
    var copyBtn = root.querySelector('[data-pay-copy]');
    if (copyBtn) on(copyBtn, 'click', function () {
      try { navigator.clipboard.writeText(PAY_ADDR[methodId] || ''); } catch (e) {}
      var original = copyBtn.textContent; copyBtn.textContent = tr('dp.copied', '已複製');
      setTimeout(function () { copyBtn.textContent = original; }, 1500);
    });
    on(root.querySelector('[data-pay-done]'), 'click', depositSuccessModal);
  }

  /* 提款帳戶管理:localStorage 模擬已綁定的收款帳戶清單。分成「銀行帳戶」
     /「加密錢包」兩大分組(bank / trc20+erc20),提款頁籤依目前選的分組決定
     卡片輪播內容與送出按鈕是否可按,呼應真實產品「先綁定收款帳戶才能
     提款」的流程;帳戶管理頁籤則依分組各自算「已登記提款帳戶 (N/5)」
     上限。 */
  var WD_ACCOUNTS_KEY = 'cms-v6-withdraw-accounts';
  /* 銀行帳戶上限 5 筆,加密錢包只能綁 1 筆(對照 v2 WALLET_ACCOUNTS 的
     (0/1) 上限,跟銀行帳戶的 (0/5) 不是同一個數字) */
  var WD_ACCOUNT_CAP = { bank: 5, crypto: 1 };
  var WD_TYPE_LABEL = { bank: tr('pay.bankCard', '銀行卡'), trc20: 'USDT-TRC20', erc20: 'USDT-ERC20' };
  var WD_TYPE_ICON = {
    bank: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    trc20: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    erc20: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  };
  var wdMethodGroup = 'bank';
  var wdManageGroup = 'bank';
  var wdCarouselIndex = 0;

  function wdGroupOf(type) { return type === 'bank' ? 'bank' : 'crypto'; }
  function loadWdAccounts() {
    var list;
    try { list = JSON.parse(localStorage.getItem(WD_ACCOUNTS_KEY)); } catch (e) { list = null; }
    if (!Array.isArray(list)) {
      // 預設帶 3 筆銀行卡示範資料,對齊此頁原本的示意設計,避免剛上線就是空清單。
      list = [
        { type: 'bank', bankName: 'KB Bank', holder: '', account: '********1234', boundAt: '2025-08-14' },
        { type: 'bank', bankName: 'Shinhan Bank', holder: '', account: '********5678', boundAt: '2025-09-05' },
        { type: 'bank', bankName: 'Woori Bank', holder: '', account: '********9012', boundAt: '2025-10-02' },
      ];
      try { localStorage.setItem(WD_ACCOUNTS_KEY, JSON.stringify(list)); } catch (e2) {}
    }
    return list;
  }
  function saveWdAccounts(list) {
    try { localStorage.setItem(WD_ACCOUNTS_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function wdMaskAccount(v) {
    v = (v || '').replace(/\s+/g, '');
    if (v.length <= 4) return v;
    return '********' + v.slice(-4);
  }
  function wdAccountBadgeText(acc) {
    return acc.type === 'bank' ? (acc.bankName || tr('pay.bankCard', '銀行卡')) : WD_TYPE_LABEL[acc.type];
  }
  function wdAccountNameText(acc) {
    return acc.type === 'bank' ? (acc.bankName || tr('pay.bankCard', '銀行卡')) : WD_TYPE_LABEL[acc.type];
  }
  function wdAccountNumberText(acc) {
    return acc.type === 'bank' ? wdMaskAccount(acc.account) : (acc.account || '');
  }
  function wdAccountCardHtml(acc, idx, withRemove) {
    return (
      '<div class="wd-account-card">' +
      '<div class="wd-account-badge">' + escapeHtml(wdAccountBadgeText(acc)) + '</div>' +
      '<div class="wd-account-info">' +
      '<span class="wd-account-name">' + escapeHtml(wdAccountNameText(acc)) + '</span>' +
      '<span class="wd-account-number">' + escapeHtml(wdAccountNumberText(acc)) + '</span>' +
      (acc.boundAt ? '<span class="wd-account-date">' + escapeHtml(acc.boundAt) + '</span>' : '') +
      '</div>' +
      (withRemove ? '<button type="button" class="auth-modal-close wd-account-remove" aria-label="' + tr('common.delete', '刪除') + '" data-wd-remove="' + idx + '"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>' : '') +
      '</div>'
    );
  }
  function wdIndexedAccounts(group) {
    // 帶著原始陣列 index 一起濾出同分組帳戶,刪除時才能對回原陣列位置。
    return loadWdAccounts().map(function (acc, idx) { return { acc: acc, idx: idx }; })
      .filter(function (pair) { return wdGroupOf(pair.acc.type) === group; });
  }

  /* 帳戶管理頁籤:卡片清單 + 數量上限 + 新增按鈕。 */
  function renderWdAccountCards() {
    var box = document.querySelector('[data-wd-account-cards]');
    var countEl = document.querySelector('[data-wd-account-count]');
    var addBtn = document.querySelector('[data-wd-show-add-form]');
    var addBtnLabel = document.querySelector('[data-wd-add-btn-label]');
    if (!box) return;
    var pairs = wdIndexedAccounts(wdManageGroup);
    var cap = WD_ACCOUNT_CAP[wdManageGroup];
    var groupLabel = wdManageGroup === 'bank' ? tr('wd.manageBankAccount', '銀行帳戶') : tr('wd.cryptoWalletAddressLabel', '加密錢包地址');
    if (countEl) countEl.innerHTML = tr('wd.registeredAccounts', '已登記提款帳戶') + ' <b>(' + pairs.length + '/' + cap + ')</b>';
    box.innerHTML = pairs.length
      ? pairs.map(function (pair) { return wdAccountCardHtml(pair.acc, pair.idx, true); }).join('')
      : '<p class="pay-note">' + tr('wd.noAccountBoundOfGroup', '尚未綁定任何{group}。').replace('{group}', groupLabel) + '</p>';
    if (addBtnLabel) addBtnLabel.textContent = wdManageGroup === 'bank' ? tr('wd.addBankAccount', '新增銀行帳戶') : tr('wd.addCryptoWallet', '新增加密錢包地址');
    if (addBtn) addBtn.disabled = pairs.length >= cap;
  }

  /* 提款頁籤:目前分組帳戶的單卡輪播。導覽列只顯示分組標籤+頁數(不夾帳戶
     內容),底下另用 .bank-row 顯示目前這筆帳戶的名稱/帳號,兩者分開對照
     畫面示例的排法(標籤列跟帳戶內容是各自獨立的兩塊)。 */
  function renderWdCarousel() {
    var wrap = document.querySelector('[data-wd-carousel-wrap]');
    var submitBtn = document.querySelector('.pay-submit');
    if (!wrap || currentPage() !== 'withdrawal.html') return;
    var pairs = wdIndexedAccounts(wdMethodGroup);
    var groupLabel = wdMethodGroup === 'bank' ? tr('wd.myBankAccounts', '我的銀行帳戶') : tr('wd.myCryptoWallets', '我的加密錢包');
    if (!pairs.length) {
      var emptyGroupLabel = wdMethodGroup === 'bank' ? tr('wd.groupBank', '銀行') : tr('wd.groupCrypto', '加密錢包');
      var linkHtml = '<button type="button" class="wd-account-add-btn" data-wd-goto-accounts style="margin-top:6px">' + escapeHtml(tr('wd.gotoAccounts', '前往「帳戶管理」新增')) + '</button>';
      wrap.innerHTML = '<p class="pay-note">' + tr('wd.noWithdrawAccountOfGroup', '尚未綁定{group}提款帳戶,請先至{link}').replace('{group}', escapeHtml(emptyGroupLabel)).replace('{link}', linkHtml) + '</p>';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }
    if (wdCarouselIndex >= pairs.length) wdCarouselIndex = 0;
    var cur = pairs[wdCarouselIndex].acc;
    var multi = pairs.length > 1;
    wrap.innerHTML =
      '<div class="wd-carousel-box"><div class="wd-carousel">' +
      (multi ? '<button type="button" class="wd-carousel-arrow" data-wd-prev' + (wdCarouselIndex === 0 ? ' disabled' : '') + ' aria-label="' + escapeHtml(tr('common.prev', '上一筆')) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' : '') +
      '<span class="wd-carousel-label">' + escapeHtml(groupLabel) + (multi ? ' <b>' + (wdCarouselIndex + 1) + '/' + pairs.length + '</b>' : '') + '</span>' +
      (multi ? '<button type="button" class="wd-carousel-arrow" data-wd-next' + (wdCarouselIndex === pairs.length - 1 ? ' disabled' : '') + ' aria-label="' + escapeHtml(tr('common.next2', '下一筆')) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>' : '') +
      '</div>' +
      '<div class="bank-row" style="border-bottom:0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (WD_TYPE_ICON[cur.type] || WD_TYPE_ICON.bank) + '</svg> <span>' + escapeHtml(wdAccountNameText(cur)) + ' ' + escapeHtml(wdAccountNumberText(cur)) + '</span></div>' +
      '</div>';
    if (submitBtn) submitBtn.disabled = false;
  }
  function renderWithdrawalUI() {
    renderWdAccountCards();
    renderWdCarousel();
  }

  /* 提款頁頂層「提款／帳戶管理」頁籤,做法同 initAboutTabs:切換 active +
     顯示對應 data-wd-panel。 */
  function initWithdrawalTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-wd-tab]'));
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      on(tab, 'click', function () {
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        var target = tab.getAttribute('data-wd-tab');
        Array.prototype.slice.call(document.querySelectorAll('[data-wd-panel]')).forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-wd-panel') !== target;
        });
      });
    });
    // 提款頁籤內「前往帳戶管理」→ 直接跳到「帳戶管理」頁籤,沿用同一顆分頁按鈕的點擊邏輯。
    on(document, 'click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-wd-goto-accounts]');
      if (!btn) return;
      var accountsTab = document.querySelector('[data-wd-tab="accounts"]');
      if (accountsTab) accountsTab.click();
    });
    renderWithdrawalUI();
  }

  /* 提款分頁的銀行卡／加密錢包欄位差異:對照 v2 真實原始碼(initWithdrawalForms
     的 cryptoSection),加密錢包提款是完全獨立的表單——沒有金額快選按鈕、
     金額範圍是 100,000~20,000,000(銀行卡是 10,000~9,000,000),且要另外
     填錢包類型／錢包地址,不是沿用銀行卡流水區塊。 */
  function wdSyncMethodFields() {
    var isBank = wdMethodGroup === 'bank';
    Array.prototype.slice.call(document.querySelectorAll('[data-wd-panel="withdraw"] [data-wd-bank-fields]')).forEach(function (el) { el.hidden = !isBank; });
    Array.prototype.slice.call(document.querySelectorAll('[data-wd-panel="withdraw"] [data-wd-crypto-fields]')).forEach(function (el) { el.hidden = isBank; });
    var amountInput = document.querySelector('[data-wd-amount-input]');
    if (amountInput) amountInput.value = isBank ? '₩ 10,000' : '';
  }

  /* 提款頁籤的「銀行卡／加密錢包」分組切換:換組後輪播重置回第一筆。 */
  function initWithdrawalMethodToggle() {
    var btns = Array.prototype.slice.call(document.querySelectorAll('[data-wd-method] [data-wd-method-btn]'));
    if (!btns.length) return;
    btns.forEach(function (btn) {
      on(btn, 'click', function () {
        btns.forEach(function (b) { b.classList.toggle('active', b === btn); });
        wdMethodGroup = btn.getAttribute('data-wd-method-btn');
        wdCarouselIndex = 0;
        renderWdCarousel();
        wdSyncMethodFields();
      });
    });
    on(document, 'click', function (e) {
      var prev = e.target.closest && e.target.closest('[data-wd-prev]');
      var next = e.target.closest && e.target.closest('[data-wd-next]');
      if (prev && !prev.disabled) { wdCarouselIndex--; renderWdCarousel(); }
      if (next && !next.disabled) { wdCarouselIndex++; renderWdCarousel(); }
    });
    wdSyncMethodFields();
  }

  function initWdRefreshRow() {
    var btn = document.querySelector('[data-refresh-profile]');
    if (!btn) return;
    on(btn, 'click', function () {
      var svg = btn.querySelector('svg');
      svg.style.transition = 'transform 1s linear';
      svg.style.transform = 'rotate(360deg)';
      setTimeout(function () { svg.style.transform = 'rotate(0deg)'; }, 1000);
    });
  }

  /* 提款密碼顯示/隱藏切換,對照登入密碼欄目前站上都沒有這個功能——
     這裡先補這一處,其餘密碼欄不在這次異動範圍內。 */
  var EYE_PATH = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/>';
  var EYE_OFF_PATH = '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.4 18.4 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="m1 1 22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>';
  function initWdPasswordToggle() {
    var toggleBtn = document.querySelector('[data-toggle-pwd]');
    if (!toggleBtn) return;
    var input = document.querySelector('[data-wd-password]');
    var icon = document.querySelector('[data-pwd-icon]');
    on(toggleBtn, 'click', function () {
      var isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      icon.innerHTML = isPwd ? EYE_OFF_PATH : EYE_PATH;
    });
  }

  /* 帳戶管理頁籤的「銀行帳戶／加密錢包」分組切換:同步過濾新增表單裡的
     幣別頁籤(銀行分組只留「銀行卡」、加密分組只留 TRC20/ERC20),並收合
     表單、避免切分組時表單殘留另一組的欄位。 */
  function wdSyncAddTypeVisibility() {
    var typeBtns = Array.prototype.slice.call(document.querySelectorAll('[data-wd-add-type] [data-wd-type]'));
    var firstVisible = null;
    typeBtns.forEach(function (btn) {
      var type = btn.getAttribute('data-wd-type');
      var show = wdGroupOf(type) === wdManageGroup;
      btn.hidden = !show;
      if (show && !firstVisible) firstVisible = btn;
    });
    if (firstVisible) {
      typeBtns.forEach(function (b) { b.classList.toggle('active', b === firstVisible); });
      var bankFields = document.querySelector('[data-wd-fields="bank"]');
      var cryptoFields = document.querySelector('[data-wd-fields="crypto"]');
      var type = firstVisible.getAttribute('data-wd-type');
      if (bankFields) bankFields.hidden = type !== 'bank';
      if (cryptoFields) cryptoFields.hidden = type === 'bank';
    }
  }
  function initWithdrawalManageToggle() {
    var btns = Array.prototype.slice.call(document.querySelectorAll('[data-wd-manage] [data-wd-manage-btn]'));
    if (!btns.length) return;
    btns.forEach(function (btn) {
      on(btn, 'click', function () {
        btns.forEach(function (b) { b.classList.toggle('active', b === btn); });
        wdManageGroup = btn.getAttribute('data-wd-manage-btn');
        var form = document.querySelector('[data-wd-add-form]');
        if (form) form.hidden = true;
        wdSyncAddTypeVisibility();
        renderWdAccountCards();
      });
    });
    wdSyncAddTypeVisibility();
  }

  function initWithdrawalAccountForm() {
    var typeBtns = Array.prototype.slice.call(document.querySelectorAll('[data-wd-add-type] .pay-tab'));
    if (!typeBtns.length) return;
    var bankFields = document.querySelector('[data-wd-fields="bank"]');
    var cryptoFields = document.querySelector('[data-wd-fields="crypto"]');
    typeBtns.forEach(function (btn) {
      on(btn, 'click', function () {
        var type = btn.getAttribute('data-wd-type');
        typeBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
        if (bankFields) bankFields.hidden = type !== 'bank';
        if (cryptoFields) cryptoFields.hidden = type === 'bank';
      });
    });
    var showFormBtn = document.querySelector('[data-wd-show-add-form]');
    var form = document.querySelector('[data-wd-add-form]');
    if (showFormBtn && form) {
      on(showFormBtn, 'click', function () {
        if (showFormBtn.disabled) { simplePayModal(tr('common.notice', '提示'), tr('wd.capReached', '已達提款帳戶數量上限（{cap} 筆），請先刪除不需要的帳戶。').replace('{cap}', WD_ACCOUNT_CAP[wdManageGroup])); return; }
        form.hidden = !form.hidden;
      });
    }
    var submitBtn = document.querySelector('[data-wd-add-submit]');
    if (!submitBtn) return;
    on(submitBtn, 'click', function () {
      if (wdIndexedAccounts(wdManageGroup).length >= WD_ACCOUNT_CAP[wdManageGroup]) { simplePayModal(tr('common.notice', '提示'), tr('wd.capReached', '已達提款帳戶數量上限（{cap} 筆），請先刪除不需要的帳戶。').replace('{cap}', WD_ACCOUNT_CAP[wdManageGroup])); return; }
      var activeBtn = document.querySelector('[data-wd-add-type] .pay-tab.active');
      var type = activeBtn ? activeBtn.getAttribute('data-wd-type') : 'bank';
      var acc = { type: type, boundAt: new Date().toISOString().slice(0, 10) };
      if (type === 'bank') {
        var bankName = (document.querySelector('[data-wd-field="bankName"]') || {}).value || '';
        var holder = (document.querySelector('[data-wd-field="holder"]') || {}).value || '';
        var account = (document.querySelector('[data-wd-field="account"]') || {}).value || '';
        if (!bankName.trim() || !holder.trim() || !account.trim()) { simplePayModal(tr('common.notice', '提示'), tr('wd.addBankFieldsError', '請完整填寫銀行名稱、收款人姓名與銀行卡號。')); return; }
        acc.bankName = bankName.trim(); acc.holder = holder.trim(); acc.account = account.trim();
      } else {
        var address = (document.querySelector('[data-wd-field="address"]') || {}).value || '';
        if (!address.trim()) { simplePayModal(tr('common.notice', '提示'), tr('wd.addWalletFieldsError', '請填寫收款錢包地址。')); return; }
        acc.account = address.trim();
      }
      var fundPassword = (document.querySelector('[data-wd-field="fundPassword"]') || {}).value || '';
      if (!fundPassword.trim()) { simplePayModal(tr('common.notice', '提示'), tr('wd.addFundPasswordError', '請輸入交易密碼。')); return; }
      var accounts = loadWdAccounts();
      accounts.push(acc);
      saveWdAccounts(accounts);
      Array.prototype.slice.call(document.querySelectorAll('[data-wd-add-type] input, [data-wd-fields] input, [data-wd-add-form] input[type="password"]')).forEach(function (i) { i.value = ''; });
      if (form) form.hidden = true;
      renderWithdrawalUI();
      simplePayModal(tr('wd.addSuccessTitle', '新增成功'), tr('wd.addSuccessMessage', '提款帳戶已新增，可於「提款」頁籤選用。'));
    });
    on(document, 'click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-wd-remove]');
      if (!btn) return;
      var idx = Number(btn.getAttribute('data-wd-remove'));
      var accounts = loadWdAccounts();
      accounts.splice(idx, 1);
      saveWdAccounts(accounts);
      renderWithdrawalUI();
    });
  }

  /* 儲值頁的「通道 A/B/C/D」:純前端示意用的付款通道分組,純前端展示不
     接真實金流,不同通道底下都給同一套付款方式,只切換 active 樣式。 */
  function initChannelTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-channel-tabs] [data-channel]'));
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      on(tab, 'click', function () {
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
      });
    });
  }

  /* 儲值／提款頁的「確認」送出按鈕:依目前頁面分流,兩者共用同一顆
     .pay-submit,行為完全不同,用 currentPage() 判斷比另外掛 data 屬性省事。 */
  function initPaySubmitHandlers() {
    var btn = document.querySelector('.pay-submit');
    if (!btn) return;
    var page = currentPage();
    on(btn, 'click', function () {
      if (btn.disabled) return;
      if (page === 'withdrawal.html') {
        if (wdMethodGroup === 'crypto') {
          var walletType = document.querySelector('[data-wd-wallet-type-select]');
          var walletAddr = document.querySelector('[data-wd-wallet-address-input]');
          if (walletType && !walletType.value) { walletType.focus(); simplePayModal(tr('common.notice', '提示'), tr('wd.selectWalletTypeError', '請先選擇錢包類型。')); return; }
          if (walletAddr && !walletAddr.value.trim()) { walletAddr.focus(); simplePayModal(tr('common.notice', '提示'), tr('wd.walletAddressError', '請先填寫收款錢包地址。')); return; }
        }
        var pwField = document.querySelector('[data-wd-panel="withdraw"] .pay-field[type="password"]');
        if (pwField && !pwField.value.trim()) { pwField.focus(); simplePayModal(tr('common.notice', '提示'), tr('wd.withdrawPasswordError', '請先輸入提款密碼。')); return; }
        simplePayModal(tr('wd.withdrawSuccessTitle', '提款成功'), tr('wd.withdrawSuccessMessage', '您的提款申請已送出，將於 1–24 小時內處理完成，請至「提款紀錄」查看進度。'));
      } else if (page === 'deposit.html') {
        depositStepModal(payMethodId(), (document.querySelector('.pay-field') || {}).value || '');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    safe(initAuthGuard);
    safe(renderHeaderAuth);
    safe(initPersonalInfoNickname);
    safe(initFeatureCarousel);
    safe(initVendorSelect);
    safe(initRails);
    safe(initFavorites);
    safe(initListingTabs);
    safe(initSportChips);
    safe(initListingSearch);
    safe(initListingLoadMore);
    safe(initMemberLogout);
    safe(initHeaderMobileMenu);
    safe(initSidebar);
    safe(initHeroCarousel);
    safe(initCsTriggers);
    safe(initAboutTabs);
    safe(initFaqAccordion);
    safe(initBetRecordParlayRows);
    safe(initChannelTabs);
    safe(initPayTabs);
    safe(initPayAmount);
    safe(initWithdrawalTabs);
    safe(initWithdrawalMethodToggle);
    safe(initWithdrawalManageToggle);
    safe(initWdRefreshRow);
    safe(initWdPasswordToggle);
    safe(initWithdrawalAccountForm);
    safe(initPaySubmitHandlers);
    safe(applyStudioSections);
    safe(applyStudioSiteName);
    safe(applyStudioSkin);
    safe(applyStudioLayout);
  });
})();
