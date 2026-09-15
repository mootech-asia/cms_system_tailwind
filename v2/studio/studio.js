/* CMS_Studio_v2 — 靜態版行為層(vanilla,無框架、無 build)。
 *
 * 1:1 復刻原 Nuxt 設計後台(frontend/app/pages/studio/index.vue):換膚、選變體、
 * 拖拉排序、顯示開關、站名、公開皮膚/語言、全站 chrome、即時預覽。
 *
 * 編輯對象是一份 draft,持久化到 localStorage['win100-studio-draft'](DraftConfig,
 * 對應 utils/studio-draft.ts),同時作為傳給右側預覽 iframe 的通道 —— 前台
 * assets/js/site.js 讀這份 draft 對首頁 [data-studio-block] 區塊做即時排序/顯示。
 * 「套用到本站」才把 skin/站名/公開皮膚/公開語言/chrome 寫回
 * localStorage['win100-public-config'](site.js 既有合約,前台開機 + storage 事件套用);
 * 儲存 API 為占位(見 rebuild-plan §2-12)。
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------ 資料來源 */
  var D = window.WIN100_DATA || {};
  var THEME_KEYS = D.THEME_KEYS || ['win100'];
  var THEME_LABELS = D.THEME_LABELS || {};

  var DRAFT_KEY = 'win100-studio-draft';
  var PUBLIC_KEY = 'win100-public-config';
  var LOCALE_KEY = 'win100-locale';
  var DEFAULT_SITE = 'CMS_Frontend_v2';

  /* 前台可切換語言(composables/useLocale.ts APP_LOCALES) */
  var APP_LOCALES = [
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'th', label: 'ภาษาไทย' },
    { code: 'zh', label: '中文' },
  ];

  /* 區塊登錄表 label(config/blocks.ts)。每個區塊固定提供 v1–v10 變體。 */
  var BLOCK_LABELS = {
    'home-banner': '首頁 Banner 輪播',
    'home-ticker': '中獎跑馬燈',
    'home-live-sport': 'Live Sport 即時賽事',
    'home-hot-games': 'Hot Games 熱門遊戲',
    'home-mini-games': '遊戲速覽(Mini/Slot/Live)',
    'home-promotion': '促銷區',
    'category-hero': '類別頁 Hero 橫幅',
    'member-card': '會員銀行卡',
    'site-header': '全站頂部導覽',
    'site-footer': '全站頁尾',
  };
  var VARIANT_KEYS = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10'];
  /* 可加入頁面的區塊(chrome 的 site-* 由「全站 CHROME」獨立控制) */
  var ADDABLE = Object.keys(BLOCK_LABELS).filter(function (k) { return k.indexOf('site-') !== 0; });

  /* 切換頁面清單(home = 首頁區塊草稿;其餘為前台真實頁) */
  var PREVIEW_PAGES = [
    { key: 'home', file: 'index.html' },
    { key: 'hot-games', file: 'hot-games.html' },
    { key: 'live', file: 'live.html' },
    { key: 'slot', file: 'slot.html' },
    { key: 'fish', file: 'fish.html' },
    { key: 'mini-games', file: 'mini-games.html' },
    { key: 'sport', file: 'sport.html' },
    { key: 'promotion', file: 'promotion.html' },
    { key: 'about', file: 'about.html' },
  ];

  /* ------------------------------------------------------------ 小工具 */
  function $(id) { return document.getElementById(id); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function themeLabel(k) { return THEME_LABELS[k] || k; }
  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }

  /* ------------------------------------------------------------ 草稿模型 */
  /* site store 預設值(stores/site.ts state) */
  function defaultDraft() {
    return {
      siteName: DEFAULT_SITE,
      skin: 'win100',
      publicSkins: THEME_KEYS.slice(),
      knownSkins: THEME_KEYS.slice(),
      /* 中文預設對玩家隱藏(對照 site.js 的 DEFAULT_PUBLIC_LOCALES),
         尚未套用過設定的全新草稿要跟前台實際預設值一致,操作者仍可在
         下方「前台可見語言」勾回中文。 */
      publicLocales: APP_LOCALES.map(function (l) { return l.code; }).filter(function (c) { return c !== 'zh'; }),
      showSkinButton: true,
      chrome: { header: 'v1', footer: 'v1' },
      pages: {
        home: {
          sections: [
            { id: 'banner', block: 'home-banner' },
            { id: 'ticker', block: 'home-ticker' },
            { id: 'live-sport', block: 'home-live-sport' },
            { id: 'hot-games', block: 'home-hot-games' },
            { id: 'mini-games', block: 'home-mini-games' },
            { id: 'promotion', block: 'home-promotion' },
          ],
        },
      },
    };
  }

  /* 起始草稿 = 預設值,疊上目前已套用的 public-config(site store 開機會吃這份);
     不做跨 session 草稿還原(draft 只是 preview 通道),與原設計後台一致。 */
  function buildInitialDraft() {
    var d = defaultDraft();
    var pub = readJSON(PUBLIC_KEY);
    if (pub) {
      if (pub.siteName && String(pub.siteName).trim()) d.siteName = String(pub.siteName).trim();
      if (pub.skin && THEME_KEYS.indexOf(pub.skin) !== -1) d.skin = pub.skin;
      if (Array.isArray(pub.publicSkins)) {
        /* 新增皮膚預設前台可見:pub.knownSkins 是上次套用時存在的皮膚清單,
           THEME_KEYS 裡不在其中的一律視為「新皮膚」補進可見清單,不然舊的
           publicSkins 快照永遠不會自動長出後來新增的皮膚(需要手動勾選)。 */
        var known = Array.isArray(pub.knownSkins) ? pub.knownSkins : pub.publicSkins;
        var visible = pub.publicSkins.slice();
        THEME_KEYS.forEach(function (k) {
          if (known.indexOf(k) === -1 && visible.indexOf(k) === -1) visible.push(k);
        });
        d.publicSkins = visible;
      }
      if (Array.isArray(pub.publicLocales) && pub.publicLocales.length) d.publicLocales = pub.publicLocales.slice();
      if (typeof pub.showSkinButton === 'boolean') d.showSkinButton = pub.showSkinButton;
      if (pub.chrome) {
        d.chrome = { header: pub.chrome.header || 'v1', footer: pub.chrome.footer || 'v1' };
      }
    }
    return d;
  }

  var draft = buildInitialDraft();
  var currentPage = 'home';
  var previewWidth = 'desktop';
  var previewLocale = (function () {
    var saved = null;
    try { saved = localStorage.getItem(LOCALE_KEY); } catch (e) {}
    return APP_LOCALES.some(function (l) { return l.code === saved; }) ? saved : 'en';
  })();

  function persistDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) {}
  }
  function sectionsOf(pageKey) {
    return (draft.pages[pageKey] && draft.pages[pageKey].sections) || [];
  }

  /* ------------------------------------------------------------ DOM refs */
  var frame = $('st-frame');
  var shell = document.querySelector('.st-shell');

  /* --------------------------------------------- 即時套到預覽 iframe(同源) */
  /* 複刻 site.js applyTheme:設 data-theme + 換 themes/<key>.css link */
  function applySkinToFrame(skin) {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.documentElement) return;
      doc.documentElement.setAttribute('data-theme', skin);
      var link = doc.getElementById('win100-skin-link');
      if (!link) {
        link = doc.createElement('link');
        link.id = 'win100-skin-link';
        link.rel = 'stylesheet';
        doc.head.appendChild(link);
      }
      link.setAttribute('href', 'themes/' + skin + '.css');
    } catch (e) {}
  }
  function applySiteNameToFrame(name) {
    try { if (frame.contentDocument) frame.contentDocument.title = name || DEFAULT_SITE; } catch (e) {}
  }
  /* 請前台 site.js 依 draft 對首頁 [data-studio-block] 區塊重排/顯示(同源直呼) */
  function syncFrameSections() {
    try {
      var w = frame.contentWindow;
      if (w && typeof w.__win100ApplyStudioSections === 'function') w.__win100ApplyStudioSections();
    } catch (e) {}
  }

  /* 切頁/首次載入後,前台可能還在跑 initTheme/initPublicConfigSync;短時間輪詢重套,
     確保預覽 = 目前草稿而非頁面自存皮膚。 */
  var reapplyTimer = null;
  function scheduleApply() {
    if (reapplyTimer) clearInterval(reapplyTimer);
    var n = 0;
    reapplyTimer = setInterval(function () {
      applySkinToFrame(draft.skin);
      applySiteNameToFrame(draft.siteName);
      syncFrameSections();
      if (++n >= 24) { clearInterval(reapplyTimer); reapplyTimer = null; }
    }, 150);
  }

  /* ------------------------------------------------------------ 摘要文字 */
  function localeLabel(code) {
    var m = APP_LOCALES.filter(function (l) { return l.code === code; })[0];
    return m ? m.label : code;
  }
  function publicSkinSummary() {
    return draft.publicSkins.length > 1 ? '前台顯示 ' + draft.publicSkins.length + ' 種' : '前台 skin 選擇藏起來';
  }
  function publicLocaleSummary() {
    return draft.publicLocales.length > 1 ? '前台顯示 ' + draft.publicLocales.length + ' 種語言' : '前台語言切換藏起來';
  }
  function skinButtonSummary() {
    return draft.showSkinButton !== false ? '切換按鈕顯示中' : '切換按鈕已隱藏';
  }
  function updateSummaries() {
    $('st-summary-site').textContent = (draft.siteName || '未命名') + ' ・ ' + localeLabel(previewLocale);
    $('st-summary-locales').textContent = publicLocaleSummary();
    $('st-summary-skin').textContent = themeLabel(draft.skin) + ' ・ ' + publicSkinSummary() + ' ・ ' + skinButtonSummary();
    $('st-summary-chrome').textContent = 'header:' + draft.chrome.header + ' / footer:' + draft.chrome.footer;
    $('st-summary-sections').textContent = currentPage + ' ・ ' + sectionsOf(currentPage).length + ' 個區塊';
  }

  /* ------------------------------------------------------------ 收合分組 */
  function initGroups() {
    document.querySelectorAll('[data-group-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-group-toggle');
        var body = document.querySelector('[data-group-body="' + key + '"]');
        var chevron = btn.querySelector('.collapse-chevron');
        var open = body.hasAttribute('hidden');
        if (open) body.removeAttribute('hidden'); else body.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', String(open));
        if (chevron) chevron.classList.toggle('is-open', open);
      });
    });
  }

  /* ------------------------------------------------------------ 站點名稱 */
  function initSiteName() {
    var input = $('st-sitename');
    input.value = draft.siteName;
    input.addEventListener('input', function () {
      draft.siteName = input.value;
      persistDraft();
      applySiteNameToFrame(draft.siteName);
      updateSummaries();
    });
  }

  /* ------------------------------------------------------------ 預覽語言 */
  function renderPreviewLocales() {
    var wrap = $('st-preview-locales');
    wrap.innerHTML = APP_LOCALES.map(function (l) {
      return '<button type="button" class="seg-btn' + (previewLocale === l.code ? ' active' : '') +
        '" data-preview-locale="' + l.code + '">' + escapeHtml(l.label) + '</button>';
    }).join('');
    wrap.querySelectorAll('[data-preview-locale]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        previewLocale = btn.getAttribute('data-preview-locale');
        try { localStorage.setItem(LOCALE_KEY, previewLocale); } catch (e) {}
        renderPreviewLocales();
        updateSummaries();
        reloadPreview(); /* 重載讓前台以新語言重新初始化 */
      });
    });
  }

  /* ------------------------------------------------------------ 皮膚 */
  function renderSkins() {
    var wrap = $('st-skins');
    wrap.innerHTML = THEME_KEYS.map(function (k) {
      return '<button type="button" class="seg-btn' + (draft.skin === k ? ' active' : '') +
        '" data-skin="' + k + '">' + escapeHtml(themeLabel(k)) + '</button>';
    }).join('');
    wrap.querySelectorAll('[data-skin]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        draft.skin = btn.getAttribute('data-skin');
        persistDraft();
        renderSkins();
        applySkinToFrame(draft.skin);
        updateSummaries();
      });
    });
  }
  function renderPublicSkins() {
    var wrap = $('st-public-skins');
    wrap.innerHTML = THEME_KEYS.map(function (k) {
      var on = draft.publicSkins.indexOf(k) !== -1;
      return '<button type="button" role="checkbox" aria-checked="' + on + '" class="seg-btn' +
        (on ? ' active' : '') + '" data-public-skin="' + k + '">' +
        (on ? '✓ ' : '') + escapeHtml(themeLabel(k)) + '</button>';
    }).join('');
    wrap.querySelectorAll('[data-public-skin]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.getAttribute('data-public-skin');
        var set = {};
        draft.publicSkins.forEach(function (x) { set[x] = true; });
        if (set[k]) delete set[k]; else set[k] = true;
        draft.publicSkins = THEME_KEYS.filter(function (x) { return set[x]; });
        persistDraft();
        renderPublicSkins();
        updateSummaries();
      });
    });
  }
  function renderPublicLocales() {
    var wrap = $('st-public-locales');
    wrap.innerHTML = APP_LOCALES.map(function (l) {
      var on = draft.publicLocales.indexOf(l.code) !== -1;
      return '<button type="button" role="checkbox" aria-checked="' + on + '" class="seg-btn' +
        (on ? ' active' : '') + '" data-public-locale="' + l.code + '">' +
        (on ? '✓ ' : '') + escapeHtml(l.label) + '</button>';
    }).join('');
    wrap.querySelectorAll('[data-public-locale]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-public-locale');
        var has = draft.publicLocales.indexOf(code) !== -1;
        if (has && draft.publicLocales.length <= 1) return; /* 至少保留 1 個語言 */
        var set = {};
        draft.publicLocales.forEach(function (x) { set[x] = true; });
        if (has) delete set[code]; else set[code] = true;
        draft.publicLocales = APP_LOCALES.map(function (l) { return l.code; }).filter(function (x) { return set[x]; });
        persistDraft();
        renderPublicLocales();
        updateSummaries();
      });
    });
  }

  function renderSkinButtonSwitch() {
    var btn = $('st-skin-button-switch');
    if (!btn) return;
    var on = draft.showSkinButton !== false;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-checked', String(on));
    btn.title = on ? '顯示中' : '已隱藏';
  }
  function initSkinButtonToggle() {
    var btn = $('st-skin-button-switch');
    if (!btn) return;
    btn.addEventListener('click', function () {
      draft.showSkinButton = draft.showSkinButton === false;
      persistDraft();
      renderSkinButtonSwitch();
      updateSummaries();
    });
  }

  /* ------------------------------------------------------------ 全站 CHROME */
  function renderChrome() {
    var wrap = $('st-chrome');
    wrap.innerHTML = ['header', 'footer'].map(function (part) {
      var chips = VARIANT_KEYS.map(function (vk) {
        return '<button type="button" class="seg-btn-sm' + (draft.chrome[part] === vk ? ' active' : '') +
          '" data-chrome="' + part + '" data-variant="' + vk + '">' + vk + '</button>';
      }).join('');
      return '<div class="st-section-card" style="margin-bottom:8px">' +
        '<span class="st-section-name">' + escapeHtml(BLOCK_LABELS['site-' + part]) + '</span>' +
        '<div class="variant-grid st-mt-sm">' + chips + '</div></div>';
    }).join('');
    wrap.querySelectorAll('[data-chrome]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        draft.chrome[btn.getAttribute('data-chrome')] = btn.getAttribute('data-variant');
        persistDraft();
        renderChrome();
        updateSummaries();
        syncFrameSections();
      });
    });
  }

  /* ------------------------------------------------------------ 頁面區塊 */
  function renderPageSelect() {
    var sel = $('st-page');
    sel.innerHTML = PREVIEW_PAGES.map(function (p) {
      return '<option value="' + p.key + '"' + (p.key === currentPage ? ' selected' : '') + '>' + escapeHtml(p.key) + '</option>';
    }).join('');
    sel.addEventListener('change', function () {
      currentPage = sel.value;
      renderSections();
      updateSummaries();
      updatePreviewLabel();
      reloadPreview();
    });
  }
  function renderAddSelect() {
    var sel = $('st-add-pick');
    sel.innerHTML = '<option value="">從區塊庫新增…</option>' + ADDABLE.map(function (k) {
      return '<option value="' + k + '">' + escapeHtml(BLOCK_LABELS[k]) + '</option>';
    }).join('');
    sel.addEventListener('change', function () { $('st-add-btn').disabled = !sel.value; });
    $('st-add-btn').addEventListener('click', function () {
      var block = sel.value;
      if (!block) return;
      if (!draft.pages[currentPage]) draft.pages[currentPage] = { sections: [] };
      var id = block + '-' + Date.now().toString(36);
      draft.pages[currentPage].sections.push({ id: id, block: block, variant: 'v1' });
      sel.value = '';
      $('st-add-btn').disabled = true;
      afterSectionChange();
    });
  }

  function renderSections() {
    var list = $('st-sections');
    var sections = sectionsOf(currentPage);
    if (!sections.length) {
      list.innerHTML = '<li class="st-section-empty">此頁尚無可調區塊(內容頁 v1)。</li>';
      return;
    }
    list.innerHTML = sections.map(function (s, i) {
      var label = BLOCK_LABELS[s.block] || s.block;
      var off = s.enabled === false;
      var chips = VARIANT_KEYS.map(function (vk) {
        return '<button type="button" class="seg-btn-sm' + ((s.variant || 'v1') === vk ? ' active' : '') +
          '" data-act="variant" data-idx="' + i + '" data-variant="' + vk + '">' + vk + '</button>';
      }).join('');
      return '<li class="st-section-card" draggable="true" data-idx="' + i + '">' +
        '<div class="st-section-row1">' +
          '<span class="st-drag" title="拖拉排序" aria-hidden="true">⠿</span>' +
          '<span class="st-section-name' + (off ? ' is-off' : '') + '">' + escapeHtml(label) + '</span>' +
          '<button type="button" role="switch" aria-checked="' + (!off) + '" class="st-switch' + (off ? '' : ' is-on') +
            '" data-act="toggle" data-idx="' + i + '" title="' + (off ? '已隱藏' : '顯示中') + '"><span class="st-switch-knob"></span></button>' +
          '<button type="button" class="icon-btn-sm st-icon-danger" data-act="remove" data-idx="' + i + '" title="移除區塊">✕</button>' +
        '</div>' +
        '<div class="variant-grid st-mt-sm">' + chips + '</div>' +
        '<div class="st-section-row3">' +
          '<button type="button" class="icon-btn-sm" data-act="up" data-idx="' + i + '" title="上移"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button type="button" class="icon-btn-sm" data-act="down" data-idx="' + i + '" title="下移"' + (i === sections.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '</div>' +
      '</li>';
    }).join('');
  }

  /* 區塊變更後統一收尾:持久化 + 重繪列表 + 更新摘要 + 通知預覽重排 */
  function afterSectionChange() {
    persistDraft();
    renderSections();
    updateSummaries();
    syncFrameSections();
  }

  function moveSection(from, to) {
    var list = sectionsOf(currentPage);
    if (to < 0 || to >= list.length || !list[from]) return;
    var s = list.splice(from, 1)[0];
    list.splice(to, 0, s);
  }

  var dragIdx = null;
  var overIdx = null;
  function clearDragMarks() {
    $('st-sections').querySelectorAll('.st-section-card').forEach(function (li) { li.classList.remove('is-over'); });
  }
  function onDrop() {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) moveSection(dragIdx, overIdx);
    dragIdx = null; overIdx = null;
    afterSectionChange();
  }

  function initSectionListEvents() {
    var list = $('st-sections');

    /* 點擊操作(事件委派) */
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      var i = parseInt(btn.getAttribute('data-idx'), 10);
      var sections = sectionsOf(currentPage);
      var s = sections[i];
      if (!s && act !== 'up' && act !== 'down') return;
      if (act === 'toggle') { s.enabled = s.enabled === false; afterSectionChange(); }
      else if (act === 'remove') { sections.splice(i, 1); afterSectionChange(); }
      else if (act === 'variant') { s.variant = btn.getAttribute('data-variant'); afterSectionChange(); }
      else if (act === 'up') { moveSection(i, i - 1); afterSectionChange(); }
      else if (act === 'down') { moveSection(i, i + 1); afterSectionChange(); }
    });

    /* 拖拉排序(事件委派) */
    list.addEventListener('dragstart', function (e) {
      var li = e.target.closest('.st-section-card');
      if (!li) return;
      dragIdx = parseInt(li.getAttribute('data-idx'), 10);
      try { e.dataTransfer.effectAllowed = 'move'; } catch (err) {}
    });
    list.addEventListener('dragover', function (e) {
      var li = e.target.closest('.st-section-card');
      if (!li) return;
      e.preventDefault();
      overIdx = parseInt(li.getAttribute('data-idx'), 10);
      clearDragMarks();
      if (dragIdx !== null && dragIdx !== overIdx) li.classList.add('is-over');
    });
    list.addEventListener('drop', function (e) { e.preventDefault(); onDrop(); });
    list.addEventListener('dragend', function () { clearDragMarks(); onDrop(); });
  }

  /* ------------------------------------------------------------ 預覽 */
  function fileFor(pageKey) {
    var p = PREVIEW_PAGES.filter(function (x) { return x.key === pageKey; })[0];
    return p ? p.file : 'index.html';
  }
  function updatePreviewLabel() {
    $('st-preview-label').textContent = '即時預覽 — ' + currentPage + '(iframe 真實視口)';
  }
  function applyPreviewWidth() {
    frame.style.width = (previewWidth === 'mobile') ? 'min(390px, 100%)' : '100%';
  }
  function reloadPreview() {
    frame.src = '../site/' + fileFor(currentPage) + '?r=' + Date.now();
    scheduleApply();
  }
  function initPreviewControls() {
    applyPreviewWidth();
    document.querySelectorAll('[data-width]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        previewWidth = btn.getAttribute('data-width');
        document.querySelectorAll('[data-width]').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-width') === previewWidth);
        });
        applyPreviewWidth();
      });
    });
  }

  /* ------------------------------------------------------------ 手機面板切換 */
  function initPaneSwitch() {
    document.querySelectorAll('[data-pane-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pane = btn.getAttribute('data-pane-btn');
        shell.setAttribute('data-pane', pane);
        document.querySelectorAll('[data-pane-btn]').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-pane-btn') === pane);
        });
      });
    });
  }

  /* ------------------------------------------------------------ 套用 / 重設 */
  function applyToSite() {
    /* buildPublicConfig(store):siteName / skin / publicSkins / publicLocales / chrome / 首頁區塊變體 */
    var cfg = {
      siteName: (draft.siteName && draft.siteName.trim()) || DEFAULT_SITE,
      skin: draft.skin,
      publicSkins: draft.publicSkins.slice(),
      knownSkins: THEME_KEYS.slice(),
      publicLocales: draft.publicLocales.slice(),
      showSkinButton: draft.showSkinButton !== false,
      chrome: { header: draft.chrome.header, footer: draft.chrome.footer },
      homeVariants: sectionsOf('home').map(function (s) {
        return { id: s.id, block: s.block, variant: s.variant || 'v1', enabled: s.enabled !== false };
      }),
    };
    try { localStorage.setItem(PUBLIC_KEY, JSON.stringify(cfg)); } catch (e) {}
    var tag = $('st-applied');
    tag.removeAttribute('hidden');
    setTimeout(function () { tag.setAttribute('hidden', ''); }, 2500);
  }
  function resetDraft() {
    draft = buildInitialDraft();
    currentPage = 'home';
    persistDraft();
    renderAll();
    applySkinToFrame(draft.skin);
    applySiteNameToFrame(draft.siteName);
    reloadPreview();
  }

  /* ------------------------------------------------------------ 初始 render */
  function renderAll() {
    $('st-sitename').value = draft.siteName;
    renderPreviewLocales();
    renderSkins();
    renderPublicSkins();
    renderPublicLocales();
    renderSkinButtonSwitch();
    renderChrome();
    renderSections();
    updateSummaries();
    updatePreviewLabel();
  }

  /* ------------------------------------------------------------ init */
  persistDraft(); /* 首次即寫入 draft,讓預覽 iframe 一載入就能讀到 */
  initGroups();
  initSiteName();
  initSkinButtonToggle();
  initSectionListEvents();
  renderPageSelect();
  renderAddSelect();
  initPreviewControls();
  initPaneSwitch();
  renderAll();

  $('st-apply').addEventListener('click', applyToSite);
  $('st-reset').addEventListener('click', resetDraft);

  /* 每次 iframe 載入(含切頁)後,把當前草稿皮膚/站名/區塊覆蓋上去 */
  frame.addEventListener('load', function () {
    applySkinToFrame(draft.skin);
    applySiteNameToFrame(draft.siteName);
    syncFrameSections();
  });

  scheduleApply(); /* 首次 iframe 載入也套用當前草稿 */
})();
