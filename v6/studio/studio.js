// CMS_Studio_v6 — 靜態版行為層（vanilla，無框架、無 build）。
// 左側是「草稿」狀態；每次操作（切 skin／切區塊／改站名）都會透過
// window.__cmsV6StudioApply 直接呼叫 iframe（同源）內 site.js 的核心套用函式，
// 立即反映在右側預覽，不需等按下「套用到本站」。
// 「套用到本站」只負責把草稿寫進 localStorage，讓離開設計後台、直接瀏覽 ../site/
// 時也套用同一份設定；同源（同一個網域）localStorage 才會共用，不受 studio/
// 與 site/ 資料夾路徑影響。
(function () {
  'use strict';

  var SECTIONS_KEY = 'cms-v6-studio-sections';
  var SITENAME_KEY = 'cms-v6-studio-sitename';
  var SKIN_KEY = 'cms-v6-studio-skin';
  var LAYOUT_KEY = 'cms-v6-studio-layout';
  var LOCALES_KEY = 'cms-v6-studio-locales';

  /* 跟 site 端 assets/js/i18n.js 的 LOCALES 是各自獨立的一份設定(studio
     不載入 i18n.js),id 需保持一致。中文預設對玩家隱藏,可在此重新勾選。 */
  var LOCALES = [
    { id: 'zh', label: '中文' },
    { id: 'en', label: 'English' },
    { id: 'ko', label: '한국어' },
    { id: 'th', label: 'ไทย' },
  ];
  var DEFAULT_VISIBLE_LOCALES = LOCALES.map(function (l) { return l.id; }).filter(function (id) { return id !== 'zh'; });
  function normalizeLocales(ids) {
    var known = LOCALES.map(function (l) { return l.id; });
    var filtered = Array.isArray(ids) ? ids.filter(function (id) { return known.indexOf(id) !== -1; }) : [];
    return filtered.length ? filtered : DEFAULT_VISIBLE_LOCALES.slice();
  }

  var SKINS = [
    { id: 'apex-classic', label: '巔峰經典（預設）', dot: 'linear-gradient(135deg,#33d17e,#0e8a4c)' },
    { id: 'neon-emerald', label: '霓虹翡翠', dot: 'linear-gradient(135deg,#34d399,#0a7a49)' },
    { id: 'royal-crimson', label: '帝王緋紅', dot: 'linear-gradient(135deg,#f87171,#a31515)' },
    { id: 'sapphire-noir', label: '尊爵藍鑽', dot: 'linear-gradient(135deg,#60a5fa,#1741a6)' },
    { id: 'violet-jackpot', label: '紫幻獎金', dot: 'linear-gradient(135deg,#c4b5fd,#6d28d9)' },
    { id: 'gold-noir', label: '尊爵金鑲黑', dot: 'linear-gradient(135deg,#f0c550,#9c780f)' },
    { id: 'emerald-tide', label: '翡翠潮汐', dot: 'linear-gradient(135deg,#1fd9a4,#1a3fd6)' }
  ];
  var DEFAULT_SKIN = 'apex-classic';
  function findSkin(id) { for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === id) return SKINS[i]; return null; }

  var SECTIONS = [
    { key: 'poker-games', label: '撲克遊戲及錦標賽' },
    { key: 'hottest-casino', label: '熱門賭場遊戲' },
    { key: 'explore-more', label: '探索更多' },
  ];
  function sectionLabel(key) { for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i].label; return key; }
  /* 12 欄版位系統:span 3~12 決定模組跨幾欄,陣列順序決定排列順序（跟
     site.js 的 applyLayout 用 appendChild 依序搬移 DOM 節點一致）。首頁
     改版對齊參考設計後,三個 rail 皆滿版橫向捲動、依序疊放,預設值都是
     span 12。variant 對應 assets/css/section-variants.css 的 10 種區塊
     版式,v1 = 不覆寫現況。 */
  var DEFAULT_LAYOUT = [
    { key: 'poker-games', span: 12, variant: 'v1' },
    { key: 'hottest-casino', span: 12, variant: 'v1' },
    { key: 'explore-more', span: 12, variant: 'v1' },
  ];
  function cloneLayout(layout) { return layout.map(function (item) { return { key: item.key, span: item.span, variant: item.variant || 'v1' }; }); }

  /* 區塊變體:10 種可選版式,實際樣式定義在 site 端的
     assets/css/section-variants.css。short 是 chip 格內顯示的短字,
     label 是完整名稱(用於 title 提示),排列方式仿照 v2/v3 設計後台的
     variant-grid/variant-card 選取器 —— 一列可見的按鈕格,點哪個亮哪個,
     不用下拉選單藏起其餘 9 個選項。 */
  var VARIANTS = [
    { id: 'v1', short: '現況', label: '現況' },
    { id: 'v2', short: '糖果', label: '圓潤糖果' },
    { id: 'v3', short: '競技', label: '銳利競技' },
    { id: 'v4', short: '金屬', label: '金屬質感' },
    { id: 'v5', short: '票根', label: '復古票根' },
    { id: 'v6', short: '夜店', label: '霓虹夜店' },
    { id: 'v7', short: '工業', label: '工業風格' },
    { id: 'v8', short: '尊爵', label: '奢華尊爵' },
    { id: 'v9', short: '通風', label: '極簡通風' },
    { id: 'v10', short: '疊層', label: '卡片疊層' },
  ];

  var PAGES = [
    { path: 'index.html', label: '首頁' },
    { path: 'hot-games.html', label: '熱門遊戲' },
    { path: 'slot.html', label: '老虎機' },
    { path: 'live.html', label: '真人娛樂' },
    { path: 'fish.html', label: '捕魚達人' },
    { path: 'sport.html', label: '體育' },
    { path: 'mini-games.html', label: '迷你遊戲' },
    { path: 'promotion.html', label: '優惠活動' },
    { path: 'account.html', label: '會員 - 帳戶總覽' },
    { path: 'deposit.html', label: '會員 - 儲值' },
    { path: 'withdrawal.html', label: '會員 - 提款' },
    { path: 'betting-record.html', label: '會員 - 投注紀錄' },
    { path: 'deposit-record.html', label: '會員 - 儲值紀錄' },
    { path: 'withdrawal-record.html', label: '會員 - 提款紀錄' },
    { path: 'account-record.html', label: '會員 - 帳戶紀錄' },
    { path: 'profit-loss.html', label: '會員 - 損益報表' },
    { path: 'personal-info.html', label: '會員 - 個人資料' },
    { path: 'security.html', label: '會員 - 安全中心' },
    { path: 'change-password.html', label: '會員 - 修改密碼' },
    { path: 'about.html', label: '關於我們' },
    { path: 'ui-kit.html', label: 'UI Kit' },
  ];

  // ---- 草稿狀態：即時反映到 iframe 預覽；按「套用」才額外寫進 localStorage ----
  var draft = { sections: {}, sitename: '', skin: DEFAULT_SKIN, layout: cloneLayout(DEFAULT_LAYOUT), locales: DEFAULT_VISIBLE_LOCALES.slice() };

  function loadApplied() {
    var sections = {};
    try { sections = JSON.parse(localStorage.getItem(SECTIONS_KEY)) || {}; } catch (e) {}
    var sitename = '';
    try { sitename = localStorage.getItem(SITENAME_KEY) || ''; } catch (e) {}
    var skin = DEFAULT_SKIN;
    try { skin = findSkin(localStorage.getItem(SKIN_KEY)) ? localStorage.getItem(SKIN_KEY) : DEFAULT_SKIN; } catch (e) {}
    var layout = cloneLayout(DEFAULT_LAYOUT);
    try {
      var raw = JSON.parse(localStorage.getItem(LAYOUT_KEY));
      if (Array.isArray(raw) && raw.length) layout = raw;
    } catch (e) {}
    var locales;
    try { locales = normalizeLocales(JSON.parse(localStorage.getItem(LOCALES_KEY))); } catch (e) { locales = DEFAULT_VISIBLE_LOCALES.slice(); }
    return { sections: sections, sitename: sitename, skin: skin, layout: layout, locales: locales };
  }

  function isApplied() {
    try { return !!localStorage.getItem(SECTIONS_KEY) || !!localStorage.getItem(SITENAME_KEY) || !!localStorage.getItem(SKIN_KEY) || !!localStorage.getItem(LAYOUT_KEY) || !!localStorage.getItem(LOCALES_KEY); } catch (e) { return false; }
  }

  /* 即時預覽：直接呼叫 iframe（同源）內 site.js 暴露的核心套用函式，
     不經過 localStorage、不需重整分頁。iframe 尚未載入完成時安靜跳過，
     交給 frame 的 load 事件補一次。 */
  function liveApply() {
    var frame = document.getElementById('st-frame');
    var win = frame && frame.contentWindow;
    if (win && win.__cmsV6StudioApply) {
      try { win.__cmsV6StudioApply({ sections: draft.sections, sitename: draft.sitename, skin: draft.skin, layout: draft.layout, locales: draft.locales }); } catch (e) {}
      // 換頁後 iframe 是全新的 document,__cmsV6StudioApply 裡也會在 editMode 開著時
      // 重掛拖曳把手,但首頁區塊面板只在首頁才有意義,其他頁面呼叫也無害(找不到 .grid12 就跳過)。
      if (win.__cmsV6StudioSetEditMode) { try { win.__cmsV6StudioSetEditMode(true); } catch (e) {} }
    }
  }

  /* 直接在右側 iframe 預覽拖曳模組排序:iframe 內(site.js)完成 DOM
     reorder 後用 postMessage 回報最新順序,這裡更新 draft.layout 並重繪
     左側清單面板,讓兩種操作方式（清單拖曳／預覽拖曳）保持同一份狀態。 */
  function initReorderListener() {
    window.addEventListener('message', function (e) {
      var frame = document.getElementById('st-frame');
      if (!frame || e.source !== frame.contentWindow) return;
      var data = e.data;
      if (!data || data.type !== 'cms-v6-studio-reorder' || !Array.isArray(data.layout)) return;
      draft.layout = data.layout;
      renderSections();
    });
  }

  function renderSkins() {
    var wrap = document.getElementById('st-skins');
    wrap.innerHTML = '';
    SKINS.forEach(function (s) {
      var on = draft.skin === s.id;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seg-btn st-skin-btn' + (on ? ' active' : '');
      btn.setAttribute('data-skin-option', s.id);
      btn.innerHTML = '<span class="st-skin-dot" style="background:' + s.dot + '"></span>' + s.label;
      wrap.appendChild(btn);
    });
    document.getElementById('st-summary-skin').textContent = (findSkin(draft.skin) || SKINS[0]).label;
    Array.prototype.slice.call(wrap.querySelectorAll('[data-skin-option]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        draft.skin = btn.getAttribute('data-skin-option');
        document.documentElement.setAttribute('data-skin', draft.skin); // studio 自己的 chrome 也跟著換膚
        renderSkins();
        liveApply();
      });
    });
  }

  /* 前台可見語言：跟 skin 選取格同一套 seg-btn chip 陣列,點哪個切哪個
     顯示/隱藏。至少保留一種語言,避免操作者一次關光導致前台語言選單
     空白。 */
  function renderLocales() {
    var wrap = document.getElementById('st-locales');
    wrap.innerHTML = '';
    LOCALES.forEach(function (l) {
      var on = draft.locales.indexOf(l.id) !== -1;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seg-btn st-skin-btn' + (on ? ' active' : '');
      btn.setAttribute('data-locale-option', l.id);
      btn.textContent = l.label;
      wrap.appendChild(btn);
    });
    document.getElementById('st-summary-locales').textContent = draft.locales.length + ' / ' + LOCALES.length + ' 個語言';
    Array.prototype.slice.call(wrap.querySelectorAll('[data-locale-option]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-locale-option');
        var idx = draft.locales.indexOf(id);
        if (idx === -1) draft.locales.push(id);
        else {
          if (draft.locales.length <= 1) return; // 至少保留一種語言
          draft.locales.splice(idx, 1);
        }
        renderLocales();
        liveApply();
      });
    });
  }

  var SPAN_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var dragKey = null; // 目前被拖曳的模組 key,drop 時用來找出來源/目標 index

  function moveLayoutItem(fromKey, toKey) {
    if (fromKey === toKey) return;
    var from = -1, to = -1;
    for (var i = 0; i < draft.layout.length; i++) {
      if (draft.layout[i].key === fromKey) from = i;
      if (draft.layout[i].key === toKey) to = i;
    }
    if (from === -1 || to === -1) return;
    var moved = draft.layout.splice(from, 1)[0];
    draft.layout.splice(to, 0, moved);
  }

  /* 每個模組一行:上排是拖曳把手（原生 HTML5 drag&drop,依 draft.layout
     陣列順序重新排列）、名稱、顯示/隱藏開關;中排是跨欄數 <select>
     （3~12,對應 12 欄版位系統）;下排是變體選取格(variant-grid,仿 v2
     設計後台 5 欄 chip 陣列與 v3 的 variant-card——10 個按鈕平鋪出來,
     點哪個亮哪個,不用下拉選單把其餘選項藏起來)。渲染順序＝draft.layout
     順序,這樣排版跟畫面所見一致。 */
  function renderSections() {
    var ul = document.getElementById('st-sections');
    ul.innerHTML = '';
    draft.layout.forEach(function (item) {
      var key = item.key;
      var on = draft.sections[key] !== false;
      var variant = item.variant || 'v1';
      var li = document.createElement('li');
      li.className = 'st-section-row';
      li.draggable = true;
      li.setAttribute('data-section-key', key);
      li.innerHTML =
        '<div class="st-section-row-top">' +
        '<span class="st-drag-handle" aria-hidden="true" title="拖曳排序"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg></span>' +
        '<span class="st-section-name">' + sectionLabel(key) + '</span>' +
        '<button type="button" role="switch" class="st-switch' + (on ? ' is-on' : '') + '" aria-checked="' + on + '" data-section-switch="' + key + '"><span class="st-switch-knob"></span></button>' +
        '</div>' +
        '<div class="st-section-row-bottom">' +
        '<select class="st-span-select" aria-label="' + sectionLabel(key) + ' 寬度" data-span-select="' + key + '">' +
        SPAN_OPTIONS.map(function (n) { return '<option value="' + n + '"' + (item.span === n ? ' selected' : '') + '>' + n + ' / 12</option>'; }).join('') +
        '</select>' +
        '</div>' +
        '<div class="st-variant-grid" role="radiogroup" aria-label="' + sectionLabel(key) + ' 變體">' +
        VARIANTS.map(function (v) {
          var sel = variant === v.id;
          return '<button type="button" role="radio" aria-checked="' + sel + '" class="st-variant-chip' + (sel ? ' active' : '') +
            '" title="' + v.label + '" data-variant-chip="' + v.id + '" data-section-key="' + key + '">' + v.short + '</button>';
        }).join('') +
        '</div>';
      ul.appendChild(li);
    });
    document.getElementById('st-summary-sections').textContent = draft.layout.filter(function (item) { return draft.sections[item.key] !== false; }).length + ' / ' + draft.layout.length + ' 個顯示中';

    Array.prototype.slice.call(ul.querySelectorAll('[data-section-switch]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-section-switch');
        var next = draft.sections[key] === false; // 目前是 false（關）→ 打開；否則關掉
        draft.sections[key] = next;
        renderSections();
        liveApply();
      });
    });
    Array.prototype.slice.call(ul.querySelectorAll('[data-span-select]')).forEach(function (sel) {
      sel.addEventListener('change', function () {
        var key = sel.getAttribute('data-span-select');
        for (var i = 0; i < draft.layout.length; i++) {
          if (draft.layout[i].key === key) { draft.layout[i].span = Number(sel.value); break; }
        }
        liveApply();
      });
    });
    Array.prototype.slice.call(ul.querySelectorAll('[data-variant-chip]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-section-key');
        var vId = btn.getAttribute('data-variant-chip');
        for (var i = 0; i < draft.layout.length; i++) {
          if (draft.layout[i].key === key) { draft.layout[i].variant = vId; break; }
        }
        renderSections();
        liveApply();
      });
    });
    Array.prototype.slice.call(ul.querySelectorAll('.st-section-row')).forEach(function (row) {
      row.addEventListener('dragstart', function (e) {
        dragKey = row.getAttribute('data-section-key');
        row.classList.add('is-dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', dragKey); } catch (e2) {}
        }
      });
      row.addEventListener('dragend', function () { row.classList.remove('is-dragging'); dragKey = null; });
      row.addEventListener('dragover', function (e) { e.preventDefault(); row.classList.add('is-drop-target'); });
      row.addEventListener('dragleave', function () { row.classList.remove('is-drop-target'); });
      row.addEventListener('drop', function (e) {
        e.preventDefault();
        row.classList.remove('is-drop-target');
        var targetKey = row.getAttribute('data-section-key');
        if (dragKey) moveLayoutItem(dragKey, targetKey);
        renderSections();
        liveApply();
      });
    });
  }

  function renderPageSelect() {
    var sel = document.getElementById('st-page');
    sel.innerHTML = PAGES.map(function (p) { return '<option value="' + p.path + '">' + p.label + '</option>'; }).join('');
    sel.addEventListener('change', function () {
      var page = PAGES.filter(function (p) { return p.path === sel.value; })[0];
      document.getElementById('st-frame').src = '../site/' + sel.value;
      document.getElementById('st-preview-label').textContent = '即時預覽 — ' + (page ? page.label : sel.value) + '（iframe 真實視口）';
      document.getElementById('st-summary-pages').textContent = page ? page.label : sel.value;
    });
  }

  function initCollapse() {
    Array.prototype.slice.call(document.querySelectorAll('[data-group-toggle]')).forEach(function (head) {
      var body = document.querySelector('[data-group-body="' + head.getAttribute('data-group-toggle') + '"]');
      var chevron = head.querySelector('.collapse-chevron');
      head.addEventListener('click', function () {
        var isOpen = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', String(!isOpen));
        body.hidden = isOpen;
        if (chevron) chevron.classList.toggle('is-open', !isOpen);
      });
    });
  }

  function initPaneSwitch() {
    var shell = document.querySelector('.st-shell');
    Array.prototype.slice.call(document.querySelectorAll('[data-pane-btn]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pane = btn.getAttribute('data-pane-btn');
        shell.setAttribute('data-pane', pane);
        Array.prototype.slice.call(document.querySelectorAll('[data-pane-btn]')).forEach(function (b) { b.classList.toggle('active', b === btn); });
      });
    });
  }

  function initWidthToggle() {
    var stage = document.getElementById('st-preview-stage');
    Array.prototype.slice.call(document.querySelectorAll('[data-width]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        stage.classList.toggle('is-mobile', btn.getAttribute('data-width') === 'mobile');
        Array.prototype.slice.call(document.querySelectorAll('[data-width]')).forEach(function (b) { b.classList.toggle('active', b === btn); });
      });
    });
  }

  function initApplyReset() {
    var applied = document.getElementById('st-applied');
    function refreshAppliedTag() { applied.hidden = !isApplied(); }
    refreshAppliedTag();

    document.getElementById('st-apply').addEventListener('click', function () {
      try {
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(draft.sections));
        if (draft.sitename) localStorage.setItem(SITENAME_KEY, draft.sitename);
        else localStorage.removeItem(SITENAME_KEY);
        localStorage.setItem(SKIN_KEY, draft.skin);
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(draft.layout));
        localStorage.setItem(LOCALES_KEY, JSON.stringify(draft.locales));
      } catch (e) {}
      refreshAppliedTag();
      liveApply(); // 預覽本來就已即時反映草稿，這裡只是連同「已套用」狀態一起確認
    });

    document.getElementById('st-reset').addEventListener('click', function () {
      try { localStorage.removeItem(SECTIONS_KEY); localStorage.removeItem(SITENAME_KEY); localStorage.removeItem(SKIN_KEY); localStorage.removeItem(LAYOUT_KEY); localStorage.removeItem(LOCALES_KEY); } catch (e) {}
      var loaded = loadApplied();
      draft = { sections: loaded.sections, sitename: loaded.sitename, skin: loaded.skin, layout: loaded.layout, locales: loaded.locales };
      document.documentElement.setAttribute('data-skin', draft.skin);
      document.getElementById('st-sitename').value = draft.sitename;
      document.getElementById('st-summary-site').textContent = draft.sitename || 'CMS_Frontend_v6';
      renderSections();
      renderSkins();
      renderLocales();
      refreshAppliedTag();
      liveApply();
    });
  }

  function initSiteName() {
    var input = document.getElementById('st-sitename');
    input.value = draft.sitename;
    input.addEventListener('input', function () {
      draft.sitename = input.value;
      document.getElementById('st-summary-site').textContent = draft.sitename || 'CMS_Frontend_v6';
      liveApply();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var loaded = loadApplied();
    draft = { sections: loaded.sections, sitename: loaded.sitename, skin: loaded.skin, layout: loaded.layout, locales: loaded.locales };
    document.documentElement.setAttribute('data-skin', draft.skin); // studio 自己的 chrome 也跟著換膚
    renderSections();
    renderSkins();
    renderLocales();
    renderPageSelect();
    initCollapse();
    initPaneSwitch();
    initWidthToggle();
    initApplyReset();
    initSiteName();
    initReorderListener();
    // iframe 換頁（含首次載入）後都要重新即時套用一次草稿，否則新頁面會是預設樣式
    document.getElementById('st-frame').addEventListener('load', liveApply);
    liveApply();
  });
})();
