/*
 * CMS_Studio_v3 — framework-free vanilla JS design studio. Heavy styling
 * is reused verbatim from ../site/assets/css/design-system/design-studio.css.
 *
 * Wiring contract to the flat front-end (../site/assets/js/site.js):
 *   - skin / theme       -> localStorage cms_skin / cms_theme      (restoreSkin)
 *   - design modules     -> localStorage cms-v3:design-modules     (site.js applySavedDesign -> data-ui-* + --ui-* vars, variants.css)
 *   - visible skins      -> localStorage cms-v3:visible-skins      (site.js filters the topbar skin menu)
 *   - visible locales    -> localStorage cms-v3:visible-locales    (site.js filters the sidebar language menu)
 *   - home composition   -> localStorage cms-v3:lobby-layout       (persist-only: flat home is one baked composition, see report)
 *   - hero banners       -> localStorage cms-v3:hero-banners       (site.js applySavedBanners -> --hero-image/--hero-position vars, slide/dot count synced)
 * Live preview reflects skin + design-module + chrome + hero-banner changes
 * instantly by applying the same attributes/vars directly onto the
 * same-origin preview iframe (chrome/banners via site.js's own appliers).
 */
(function () {
  'use strict';

  /* ============================================================
   * Registry data (adapted for framework-free vanilla JS,
   * mediaSpecs.js, siteFactory.js, skins/index.js)
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
  var DEFAULT_SKIN = 'blue';
  var DEFAULT_SITE_NAME = 'CMS_Frontend_v3';

  var MODULES = [
    { id: 'game-card', label: 'Game Cards', category: 'Content', description: 'Artwork, metadata, status, and hover treatment.' },
    { id: 'promotion-card', label: 'Promotion Cards', category: 'Content', description: 'Campaign artwork, offer copy, and calls to action.' },
    { id: 'spotlight', label: 'Spotlight Game Cards', category: 'Content', description: 'Featured game cards with a badge, copy, and call to action.' },
    { id: 'banner', label: 'Hero & Banners', category: 'Content', description: 'Primary campaign and feature media containers.' },
    { id: 'ticker', label: 'Ticker & Marquee', category: 'Content', description: 'Announcements, values, and real-time information.' },
    { id: 'button', label: 'Buttons', category: 'Controls', description: 'Primary, secondary, quiet, and destructive commands.' },
    { id: 'tabs', label: 'Tabs & Filters', category: 'Controls', description: 'Page tabs, category tabs, provider tags, and filters.' },
    { id: 'form', label: 'Form Controls', category: 'Controls', description: 'Inputs, selects, date controls, and field groups.' },
    { id: 'tag', label: 'Tags & Badges', category: 'Controls', description: 'Status, tier, count, and game metadata labels.' },
    { id: 'table', label: 'Tables', category: 'Data', description: 'Record tables, leaderboard rows, and totals.' },
    { id: 'profile', label: 'Profile & Member', category: 'Data', description: 'Member identity, progress, balance, and rollover.' },
    { id: 'panel', label: 'Panels & Cards', category: 'Structure', description: 'Account panels, dashboards, and framed tools.' },
    { id: 'navigation', label: 'Navigation', category: 'Structure', description: 'Sidebar entries and primary navigation states.' },
    { id: 'section-title', label: 'Titles & Sections', category: 'Structure', description: 'Page titles, section headings, and count hierarchy.' },
    { id: 'modal', label: 'Dialogs & Modals', category: 'Structure', description: 'Focused tasks, confirmations, and overlays.' }
  ];

  // Variant visual tokens — the exact set makeDesignStyle() emits as --ui-* vars.
  var VARIANTS = [
    { id: 'v1', name: 'Foundation', character: 'Balanced / familiar', tokens: { radius: 'var(--radius-card)', border: '1px solid var(--line)', surface: 'var(--bg-card)', shadow: 'none', inset: 'none', backdrop: 'none', clip: 'none', space: '16px', gap: '12px', weight: 'var(--weight-semibold)', hover: 'translateY(-1px)' } },
    { id: 'v2', name: 'Ticket Burst', character: 'Event / ticketed', tokens: { radius: '10px', border: '1px dashed color-mix(in oklch, var(--accent) 62%, var(--line-hi))', surface: 'linear-gradient(135deg, color-mix(in oklch, var(--accent) 16%, var(--bg-card)) 0 28%, var(--bg-card) 28% 72%, color-mix(in oklch, var(--accent-2) 14%, var(--bg-card)) 72% 100%)', shadow: '0 12px 0 color-mix(in oklch, var(--accent) 18%, transparent)', inset: 'inset 0 0 0 1px color-mix(in oklch, var(--text) 8%, transparent)', backdrop: 'none', clip: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)', space: '18px', gap: '14px', weight: 'var(--weight-bold)', hover: 'translateY(-4px) rotate(-.3deg)', motif: '"TICKET"', motifSize: '46px', motifOpacity: '.14' } },
    { id: 'v3', name: 'Machine Bay', character: 'Machine / dimensional', tokens: { radius: '22px 22px 8px 8px', border: '2px solid color-mix(in oklch, var(--text) 18%, var(--line-hi))', surface: 'linear-gradient(180deg, color-mix(in oklch, var(--bg-card-hi) 82%, var(--accent) 18%), var(--bg-card) 42%, color-mix(in oklch, var(--bg-elev) 78%, black 22%))', shadow: '0 18px 36px rgba(0, 0, 0, .28)', inset: 'inset 0 6px 0 color-mix(in oklch, var(--accent) 32%, transparent), inset 0 -10px 0 color-mix(in oklch, black 18%, transparent)', backdrop: 'none', clip: 'none', space: '20px', gap: '14px', weight: 'var(--weight-bold)', hover: 'translateY(-5px) scale(1.015)', motif: '"777"', motifSize: '58px', motifOpacity: '.18' } },
    { id: 'v4', name: 'Cash Glass', character: 'Cash / glass', tokens: { radius: '18px', border: '1px solid color-mix(in oklch, var(--accent-2) 24%, transparent)', surface: 'linear-gradient(145deg, color-mix(in oklch, var(--bg-card) 68%, transparent), color-mix(in oklch, var(--accent) 10%, transparent))', shadow: '0 20px 46px rgba(0, 0, 0, .20)', inset: 'inset 0 1px 0 color-mix(in oklch, white 18%, transparent), inset 0 -1px 0 color-mix(in oklch, var(--accent) 16%, transparent)', backdrop: 'blur(20px) saturate(1.18)', clip: 'none', space: '20px', gap: '16px', weight: 'var(--weight-semibold)', hover: 'translateY(-4px)', motif: '"$"', motifSize: '76px', motifOpacity: '.12' } },
    { id: 'v5', name: 'Lightning Cut', character: 'Lightning / sharp', tokens: { radius: '2px', border: '1px solid color-mix(in oklch, var(--accent) 72%, var(--line-hi))', surface: 'linear-gradient(110deg, color-mix(in oklch, var(--accent) 18%, var(--bg-elev)) 0 44%, var(--bg-elev) 44% 58%, color-mix(in oklch, var(--accent-2) 18%, var(--bg-elev)) 58% 100%)', shadow: '0 0 0 1px color-mix(in oklch, var(--accent) 20%, transparent), 0 18px 28px color-mix(in oklch, var(--accent) 16%, transparent)', inset: 'inset 6px 0 0 var(--accent), inset -1px 0 0 color-mix(in oklch, var(--accent-2) 40%, transparent)', backdrop: 'none', clip: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, calc(100% - 10px) 100%, 18px 100%, 0 calc(100% - 18px))', space: '18px', gap: '10px', weight: 'var(--weight-bold)', hover: 'translateX(5px)', motif: '"ZAP"', motifSize: '44px', motifOpacity: '.18' } },
    { id: 'v6', name: 'Jackpot Stage', character: 'Stage / jackpot', tokens: { radius: '26px 26px 14px 14px', border: '1px solid color-mix(in oklch, var(--accent) 42%, var(--line-hi))', surface: 'radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--accent) 24%, transparent), transparent 42%), linear-gradient(180deg, var(--bg-card-hi), var(--bg-card))', shadow: '0 24px 56px rgba(0, 0, 0, .30)', inset: 'inset 0 2px 0 color-mix(in oklch, var(--accent-2) 38%, transparent), inset 0 -8px 0 color-mix(in oklch, black 10%, transparent)', backdrop: 'none', clip: 'none', space: '22px', gap: '16px', weight: 'var(--weight-bold)', hover: 'translateY(-6px)', motif: '"JACKPOT"', motifSize: '38px', motifOpacity: '.16' } },
    { id: 'v7', name: 'Trading Dense', character: 'Dense / data', tokens: { radius: '3px', border: '1px solid color-mix(in oklch, var(--line-hi) 82%, transparent)', surface: 'repeating-linear-gradient(90deg, transparent 0 18px, color-mix(in oklch, var(--line) 54%, transparent) 18px 19px), repeating-linear-gradient(0deg, transparent 0 22px, color-mix(in oklch, var(--line) 48%, transparent) 22px 23px), var(--bg-card)', shadow: 'inset 0 0 0 1px color-mix(in oklch, var(--accent) 12%, transparent)', inset: 'none', backdrop: 'none', clip: 'none', space: '9px', gap: '6px', weight: 'var(--weight-medium)', hover: 'translateY(-1px) scale(.995)', motif: '"01"', motifSize: '34px', motifOpacity: '.12' } },
    { id: 'v8', name: 'Luxe Magazine', character: 'Luxe / editorial', tokens: { radius: '0px', border: '1px solid color-mix(in oklch, var(--text) 16%, transparent)', surface: 'linear-gradient(90deg, transparent 0 12%, color-mix(in oklch, var(--bg-card) 72%, transparent) 12% 100%)', shadow: 'none', inset: 'inset 0 4px 0 var(--accent), inset 0 -1px 0 color-mix(in oklch, var(--text) 9%, transparent)', backdrop: 'none', clip: 'none', space: '28px', gap: '20px', weight: 'var(--weight-bold)', hover: 'translateY(-3px)', motif: '"VIP"', motifSize: '52px', motifOpacity: '.10' } },
    { id: 'v9', name: 'Ledger Note', character: 'Ledger / finance', tokens: { radius: '8px', border: '1px solid color-mix(in oklch, var(--accent-2) 34%, var(--line-hi))', surface: 'radial-gradient(circle at 12% 50%, color-mix(in oklch, var(--accent) 10%, transparent) 0 18%, transparent 19%), repeating-linear-gradient(0deg, transparent 0 28px, color-mix(in oklch, var(--line) 76%, transparent) 28px 29px), var(--bg-card)', shadow: '0 10px 0 color-mix(in oklch, var(--bg-elev) 78%, transparent)', inset: 'inset 0 1px 0 color-mix(in oklch, var(--text) 8%, transparent), inset 0 0 0 5px color-mix(in oklch, var(--accent) 5%, transparent)', backdrop: 'none', clip: 'none', space: '16px', gap: '12px', weight: 'var(--weight-semibold)', hover: 'translateY(-2px)', motif: '"$"', motifSize: '58px', motifOpacity: '.11' } },
    { id: 'v10', name: 'Signal Rail', character: 'Directional / assertive', tokens: { radius: '12px 4px 4px 12px', border: '1px solid color-mix(in oklch, var(--accent) 46%, var(--line))', surface: 'linear-gradient(90deg, color-mix(in oklch, var(--accent) 18%, var(--bg-card)) 0 18%, var(--bg-card) 18% 100%)', shadow: '0 12px 24px color-mix(in oklch, var(--accent) 12%, transparent)', inset: 'inset 7px 0 0 var(--accent), inset -1px 0 0 color-mix(in oklch, var(--accent-2) 32%, transparent)', backdrop: 'none', clip: 'none', space: '18px', gap: '12px', weight: 'var(--weight-bold)', hover: 'translateX(5px)', motif: '">>"', motifSize: '42px', motifOpacity: '.16' } }
  ];
  var VARIANT_BY_ID = {};
  VARIANTS.forEach(function (v) { VARIANT_BY_ID[v.id] = v; });
  var DEFAULT_MODULES = {};
  MODULES.forEach(function (m) { DEFAULT_MODULES[m.id] = 'v1'; });

  var MEDIA_SPECS = {
    'game-card': { assetKey: 'game', label: 'Game artwork', width: 720, height: 720, ratio: '1:1', formats: 'WEBP / JPG / PNG', maxSize: '2 MB', note: 'Keep the main subject inside the center 80% safe area.' },
    'promotion-card': { assetKey: 'promo', label: 'Promotion artwork', width: 1600, height: 400, ratio: '4:1', formats: 'WEBP / JPG / PNG', maxSize: '3 MB', note: 'Keep the focal object inside the center 70%; the card displays the complete panorama.' },
    banner: { assetKey: 'hero', label: 'Hero banner', width: 2400, height: 525, ratio: '32:7', formats: 'WEBP / JPG / PNG', maxSize: '4 MB', note: 'Reserve the left 50% for copy and keep key subjects inside the right 35% safe area.' },
    profile: { assetKey: 'avatar', label: 'Profile avatar', width: 512, height: 512, ratio: '1:1', formats: 'WEBP / JPG / PNG', maxSize: '1 MB', note: 'Use a centered portrait with comfortable space around the face.' },
    navigation: { assetKey: 'logo', label: 'Brand logo', width: 640, height: 160, ratio: '4:1', formats: 'Transparent WEBP / PNG', maxSize: '1 MB', note: 'Use transparent artwork with no built-in background or shadow.' }
  };

  var DEFAULT_LOBBY_ORDER = ['live-sport', 'featured-games', 'recently-played', 'slots', 'live-casino', 'top-wins', 'promotions', 'providers'];
  var LOBBY_SECTION_LABELS = {
    'featured-games': 'Featured Games', 'recently-played': 'Recently played', slots: 'Slots', 'live-casino': 'Live Casino',
    'top-wins': 'Top wins', 'live-sport': 'Live sport', promotions: 'Promotions', providers: 'Providers'
  };
  // Sections with an unambiguous 1:1 module mapping only — verified against each
  // block's real markup (.gcard rails / .leaderboard / .promo-card /
  // .providers-marquee / .spotlight-card). live-sport (tournament cards) and
  // the 4 account panels have no matching module in MODULES, so they're
  // deliberately not offered a variant chip.
  var PER_SECTION_MODULE = {
    'live-casino': 'game-card', 'recently-played': 'game-card', slots: 'game-card', 'top-wins': 'table',
    promotions: 'promotion-card', providers: 'ticker', 'featured-games': 'spotlight'
  };

  /* Top-of-page blocks (hero banner / ticker / rewards card) sit above the
     cat-tabs, outside the reorderable lobby-section-list — a separate small
     order+visibility list, same interaction pattern as Home composition. */
  var DEFAULT_TOP_BLOCK_ORDER = ['hero-banner', 'ticker', 'rewards-banner'];
  var TOP_BLOCK_LABELS = { 'hero-banner': 'Hero banner', ticker: 'Ticker', 'rewards-banner': 'Rewards card' };
  var TOP_BLOCK_SELECTOR = { 'hero-banner': '.hero', ticker: '.promo-ribbon', 'rewards-banner': '.rewards-wrap' };

  var DEFAULT_ACCOUNT_SECTIONS = ['account-quick-actions', 'account-banking-details', 'account-crypto-wallet', 'account-recent-transactions'];
  var ACCOUNT_SECTION_LABELS = {
    'account-quick-actions': 'Quick Actions', 'account-banking-details': 'Banking Details',
    'account-crypto-wallet': 'Crypto Wallet', 'account-recent-transactions': 'Recent Transactions'
  };

  var LOCALE_FLAGS = {
    zh: '<svg width="18" height="12" viewBox="0 0 30 20"><rect width="30" height="20" fill="#de2910"/><polygon points="5.000,2.000 5.674,4.073 7.853,4.073 6.090,5.354 6.763,7.427 5.000,6.146 3.237,7.427 3.910,5.354 2.147,4.073 4.326,4.073" fill="#ffde00"/><polygon points="9.143,2.514 9.620,1.966 9.246,1.343 9.914,1.628 10.391,1.080 10.328,1.803 10.996,2.088 10.288,2.251 10.224,2.975 9.851,2.352" fill="#ffde00"/><polygon points="11.010,4.141 11.662,3.821 11.560,3.102 12.065,3.624 12.718,3.304 12.378,3.946 12.884,4.467 12.168,4.343 11.829,4.985 11.726,4.266" fill="#ffde00"/><polygon points="11.038,6.725 11.765,6.699 11.964,6.001 12.213,6.683 12.939,6.657 12.367,7.105 12.616,7.787 12.014,7.382 11.442,7.830 11.641,7.131" fill="#ffde00"/><polygon points="9.219,8.375 9.899,8.632 10.353,8.064 10.319,8.790 10.999,9.046 10.298,9.239 10.265,9.964 9.865,9.357 9.165,9.550 9.618,8.982" fill="#ffde00"/></svg>',
    en: '<svg width="18" height="12" viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0 0 60 40M60 0 0 40" stroke="#fff" stroke-width="6"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="10"/><path d="M30 0v40M0 20h60" stroke="#C8102E" stroke-width="6"/></svg>',
    ko: '<svg width="18" height="12" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="8" fill="#cd2e3a"/><path d="M22 20a8 8 0 0 1 16 0 4 4 0 0 1-8 0 4 4 0 0 0-8 0Z" fill="#0047a0"/><g stroke="#000" stroke-width="1.4"><path d="M11 11l4 6M13 9l4 6M15 7l4 6"/><path d="M41 23l4 6M43 21l4 6M45 19l4 6"/><path d="M45 11l-4 6M47 13l-4 6M49 15l-4 6"/><path d="M11 29l4-6M13 31l4-6M15 33l4-6"/></g></svg>',
    th: '<svg width="18" height="12" viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><rect width="30" height="4" fill="#a51931"/><rect y="16" width="30" height="4" fill="#a51931"/><rect y="4" width="30" height="3.33" fill="#f4f5f8"/><rect y="12.67" width="30" height="3.33" fill="#f4f5f8"/><rect y="7.33" width="30" height="5.34" fill="#2d2a4a"/></svg>'
  };

  /* 完整對照 repo 根目錄現行 20 個純 HTML 前台頁（見 CLAUDE.md activeCat/catTab
     對照表），不只列 Lobby 分流頁——頁面切換器要能預覽任何一頁。 */
  var PAGES = [
    { label: 'Lobby', file: 'index.html' },
    { label: 'Hot Games', file: 'hot-games.html' },
    { label: 'Mini Games', file: 'mini-games.html' },
    { label: 'Slots', file: 'slots.html' },
    { label: 'Live', file: 'live.html' },
    { label: 'Fish', file: 'fish.html' },
    { label: 'Sports', file: 'sports.html' },
    { label: 'Promotion', file: 'promotion.html' },
    { label: 'Promotion Detail', file: 'promotion-detail.html?id=first-deposit' },
    { label: 'Account Overview', file: 'account-overview.html' },
    { label: 'Deposit', file: 'deposit.html' },
    { label: 'Withdrawal', file: 'withdrawal.html' },
    { label: 'Personal Info', file: 'personal-info.html' },
    { label: 'Security Center', file: 'security-center.html' },
    { label: 'Customer Service', file: 'customer-service.html' },
    { label: 'Support', file: 'support.html' },
    { label: 'Betting Record', file: 'betting-record.html' },
    { label: 'Deposit Record', file: 'deposit-record.html' },
    { label: 'Withdrawal Record', file: 'withdrawal-record.html' },
    { label: 'Profit And Loss', file: 'profit-loss.html' },
    { label: 'Account Record', file: 'account-record.html' }
  ];

  var STORAGE = {
    skin: 'cms_skin', theme: 'cms_theme',
    modules: 'cms-v3:design-modules',
    visibleSkins: 'cms-v3:visible-skins',
    visibleLocales: 'cms-v3:visible-locales',
    lobbyLayout: 'cms-v3:lobby-layout',
    legacyOrder: 'cms-v3:lobby-section-order',
    accountSections: 'cms-v3:account-sections',
    heroBanners: 'cms-v3:hero-banners',
    chrome: 'cms-v3:chrome',
    locale: 'cms-v3:locale',
    sectionVariants: 'cms-v3:section-variants',
    siteName: 'cms-v3:site-name',
    showSkinButton: 'cms-v3:show-skin-button',
    topBlockLayout: 'cms-v3:top-block-layout'
  };
  var MAX_BANNER_BYTES = 300 * 1024;

  /* ============================================================
   * i18n — reuse the front-end dictionary (window.CMS_I18N) exactly like the
   * original studio used useLocale().t(). Falls back en -> zh -> literal.
   * ========================================================== */
  var I18N = window.CMS_I18N || { LANGS: { zh: { label: '中文', htmlLang: 'zh-Hant' } }, TRANSLATIONS: { zh: {} } };
  var LANGS = I18N.LANGS || { zh: { label: '中文', htmlLang: 'zh-Hant' } };
  var TRANS = I18N.TRANSLATIONS || {};
  function readLocale() {
    try { var s = localStorage.getItem(STORAGE.locale); return LANGS[s] ? s : 'en'; } catch (e) { return 'en'; }
  }
  var LOCALE = readLocale();
  function resolvePath(root, path) {
    var parts = Array.isArray(path) ? path : String(path).split('.');
    var cur = root;
    for (var i = 0; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  }
  function t(path, fallback, vars) {
    var v = resolvePath(TRANS[LOCALE], path);
    if (v == null) v = resolvePath(TRANS.en, path);
    if (v == null) v = resolvePath(TRANS.zh, path);
    if (v == null || typeof v !== 'string') v = (fallback != null ? fallback : (Array.isArray(path) ? path.join('.') : path));
    if (vars && typeof v === 'string') {
      v = v.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : '{' + k + '}'; });
    }
    return v;
  }
  function ts(key, fallback, vars) { return t('studio.' + key, fallback, vars); }

  /* ============================================================
   * Utilities
   * ========================================================== */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function findSkin(id) { for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === id) return SKINS[i]; return null; }

  function normalizeModules(value) {
    value = value || {};
    var out = {};
    MODULES.forEach(function (m) { out[m.id] = VARIANT_BY_ID[value[m.id]] ? value[m.id] : 'v1'; });
    return out;
  }
  function normalizeVisibleSkins(ids) {
    ids = Array.isArray(ids) ? ids : [];
    var set = {}; ids.forEach(function (i) { set[i] = 1; });
    var out = SKINS.map(function (s) { return s.id; }).filter(function (id) { return set[id]; });
    return out.length ? out : SKINS.map(function (s) { return s.id; });
  }
  /* 陣列篩空/失效時落回的預設值:中文預設隱藏(defaultVisibleLocales),
     與 site.js 的 visibleLocaleKeys() 未設定時的行為一致。 */
  function defaultVisibleLocales() {
    return Object.keys(LANGS).filter(function (id) { return id !== 'zh'; });
  }
  function normalizeVisibleLocales(ids) {
    ids = Array.isArray(ids) ? ids : [];
    var set = {}; ids.forEach(function (i) { set[i] = 1; });
    var out = Object.keys(LANGS).filter(function (id) { return set[id]; });
    return out.length ? out : defaultVisibleLocales();
  }
  function normalizeOrderAgainst(order, universe) {
    var input = Array.isArray(order) ? order : [];
    var known = input.filter(function (id) { return universe.indexOf(id) >= 0; });
    universe.forEach(function (id) { if (known.indexOf(id) < 0) known.push(id); });
    var seen = {}, out = [];
    known.forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.push(id); } });
    return out;
  }
  function normalizeHiddenAgainst(hidden, universe) {
    var input = Array.isArray(hidden) ? hidden : [];
    var seen = {}, out = [];
    input.forEach(function (id) { if (universe.indexOf(id) >= 0 && !seen[id]) { seen[id] = 1; out.push(id); } });
    return out;
  }
  function normalizeOrder(order) { return normalizeOrderAgainst(order, DEFAULT_LOBBY_ORDER); }
  function normalizeHidden(hidden) { return normalizeHiddenAgainst(hidden, DEFAULT_LOBBY_ORDER); }
  function normalizeTopBlockOrder(order) { return normalizeOrderAgainst(order, DEFAULT_TOP_BLOCK_ORDER); }
  function normalizeTopBlockHidden(hidden) { return normalizeHiddenAgainst(hidden, DEFAULT_TOP_BLOCK_ORDER); }
  function normalizeAccountHidden(hidden) {
    var input = Array.isArray(hidden) ? hidden : [];
    var seen = {}, out = [];
    input.forEach(function (id) { if (DEFAULT_ACCOUNT_SECTIONS.indexOf(id) >= 0 && !seen[id]) { seen[id] = 1; out.push(id); } });
    return out;
  }
  function defaultBanners() {
    var slides = (window.CMS_DATA && window.CMS_DATA.HERO_SLIDES) || [];
    if (!slides.length) return [{ id: 'default-1', label: 'Banner 1', image: '../site/assets/mock/hero-1.webp', position: 'center', mobilePosition: 'center' }];
    return slides.map(function (slide, i) {
      return {
        id: 'default-' + (i + 1),
        label: String(slide.title || ('Banner ' + (i + 1))).replace(/\n/g, ' '),
        image: slide.image,
        position: slide.position || 'center',
        mobilePosition: slide.mobilePosition || slide.position || 'center'
      };
    });
  }
  function normalizeBanners(value) {
    var list = Array.isArray(value) ? value : [];
    var out = list.filter(function (b) { return b && typeof b.image === 'string' && b.image; }).map(function (b, i) {
      return {
        id: (typeof b.id === 'string' && b.id) ? b.id : ('banner-' + (i + 1)),
        label: (typeof b.label === 'string' && b.label) ? b.label : ('Banner ' + (i + 1)),
        image: b.image,
        position: (typeof b.position === 'string' && b.position) ? b.position : 'center',
        mobilePosition: (typeof b.mobilePosition === 'string' && b.mobilePosition) ? b.mobilePosition : (b.position || 'center')
      };
    });
    return out.length ? out : defaultBanners();
  }

  /* ============================================================
   * makeDesignStyle — same --ui-* var map the design registry produces.
   * ========================================================== */
  function moduleVariantStyle(moduleId, variantId) {
    var variant = VARIANT_BY_ID[variantId] || VARIANT_BY_ID.v1;
    var tokens = variant.tokens;
    var style = {};
    Object.keys(tokens).forEach(function (tk) { style['--ui-' + moduleId + '-' + tk] = tokens[tk]; });
    var stack = [tokens.shadow, tokens.inset].filter(function (x) { return x && x !== 'none'; });
    style['--ui-' + moduleId + '-shadow-stack'] = stack.join(', ') || 'none';
    return style;
  }
  function makeDesignStyle(modules) {
    var style = {};
    MODULES.forEach(function (m) {
      var partial = moduleVariantStyle(m.id, modules[m.id]);
      Object.keys(partial).forEach(function (k) { style[k] = partial[k]; });
    });
    return style;
  }

  /* Site-wide chrome (header/footer) share the v1..v10 variant vocabulary. */
  var CHROME_PARTS = ['header', 'footer'];
  var CHROME_KEYS = VARIANTS.map(function (v) { return v.id; });
  function normalizeChrome(value) {
    var v = value || {};
    function pick(x) { return CHROME_KEYS.indexOf(x) >= 0 ? x : 'v1'; }
    return { header: pick(v.header), footer: pick(v.footer) };
  }

  /* Per-section variant overrides: same v1-v10 vocabulary, keyed by the
     PER_SECTION_MODULE slugs only — an absent key means "inherit the
     section's module-wide pick" (distinct from an explicit "v1"). */
  function normalizeSectionVariants(value) {
    var input = (value && typeof value === 'object') ? value : {};
    var out = {};
    Object.keys(PER_SECTION_MODULE).forEach(function (slug) {
      if (CHROME_KEYS.indexOf(input[slug]) >= 0) out[slug] = input[slug];
    });
    return out;
  }

  /* ============================================================
   * State (draft + applied snapshot)
   * ========================================================== */
  var savedSkinId = (function () { var id = null; try { id = localStorage.getItem(STORAGE.skin); } catch (e) {} return findSkin(id) ? id : DEFAULT_SKIN; })();
  var savedModules = (function () { var raw = readJSON(STORAGE.modules); return normalizeModules(raw && raw.modules); })();
  var savedVisibleSkins = (function () { var raw = readJSON(STORAGE.visibleSkins); return normalizeVisibleSkins(raw || SKINS.map(function (s) { return s.id; })); })();
  var savedVisibleLocales = (function () { var raw = readJSON(STORAGE.visibleLocales); return normalizeVisibleLocales(raw || defaultVisibleLocales()); })();
  var savedLayout = (function () { var raw = readJSON(STORAGE.lobbyLayout); return { order: normalizeOrder(raw && raw.order), hidden: normalizeHidden(raw && raw.hidden) }; })();
  var savedAccountHidden = (function () { var raw = readJSON(STORAGE.accountSections); return normalizeAccountHidden(raw && raw.hidden); })();
  var savedBanners = (function () { var raw = readJSON(STORAGE.heroBanners); return normalizeBanners(raw); })();
  var savedChrome = (function () { var raw = readJSON(STORAGE.chrome); return normalizeChrome(raw && (raw.chrome || raw)); })();
  var savedSectionVariants = (function () { return normalizeSectionVariants(readJSON(STORAGE.sectionVariants)); })();
  var savedSiteName = (function () { try { return localStorage.getItem(STORAGE.siteName) || DEFAULT_SITE_NAME; } catch (e) { return DEFAULT_SITE_NAME; } })();
  var savedShowSkinButton = (function () { var raw = readJSON(STORAGE.showSkinButton); return raw === false ? false : true; })();
  var savedTopBlockLayout = (function () { var raw = readJSON(STORAGE.topBlockLayout); return { order: normalizeTopBlockOrder(raw && raw.order), hidden: normalizeTopBlockHidden(raw && raw.hidden) }; })();

  var draft = {
    modules: normalizeModules(savedModules),
    skin: savedSkinId,
    visibleSkinIds: savedVisibleSkins.slice(),
    visibleLocaleIds: savedVisibleLocales.slice(),
    layoutOrder: savedLayout.order.slice(),
    hiddenSections: savedLayout.hidden.slice(),
    accountHiddenSections: savedAccountHidden.slice(),
    banners: savedBanners.slice(),
    chrome: normalizeChrome(savedChrome),
    sectionVariants: normalizeSectionVariants(savedSectionVariants),
    siteName: savedSiteName,
    showSkinButton: savedShowSkinButton,
    topBlockOrder: savedTopBlockLayout.order.slice(),
    topBlockHidden: savedTopBlockLayout.hidden.slice()
  };
  var applied = {
    modules: normalizeModules(savedModules),
    skin: savedSkinId,
    visibleSkinIds: savedVisibleSkins.slice(),
    visibleLocaleIds: savedVisibleLocales.slice(),
    layout: { order: savedLayout.order.slice(), hidden: savedLayout.hidden.slice() },
    accountHiddenSections: savedAccountHidden.slice(),
    banners: savedBanners.slice(),
    chrome: normalizeChrome(savedChrome),
    sectionVariants: normalizeSectionVariants(savedSectionVariants),
    siteName: savedSiteName,
    showSkinButton: savedShowSkinButton,
    topBlockLayout: { order: savedTopBlockLayout.order.slice(), hidden: savedTopBlockLayout.hidden.slice() }
  };

  var selectedModuleId = MODULES[0].id;
  var deviceMode = 'desktop';
  var factoryGroupOpen = { siteName: true, previewSkin: true, frontendLocales: false, frontendSkins: false, topBlocks: false, homeComposition: false, accountComposition: false, chrome: false };
  var layoutDragId = null;
  var topBlockDragId = null;
  var noticeTimer = null;

  function moduleLabel(m) { return t(['studio', 'modules', m.id, 'label'], m.label); }
  function moduleDescription(m) { return t(['studio', 'modules', m.id, 'description'], m.description); }
  function variantName(v) { return t(['studio', 'variantCopy', v.id, 'name'], v.name); }
  function variantCharacter(v) { return t(['studio', 'variantCopy', v.id, 'character'], v.character); }
  function categoryLabel(cat) { return t(['studio', 'categories', cat], cat); }
  function layoutLabel(id) { return t(['lobby', 'sections', id], LOBBY_SECTION_LABELS[id] || id); }
  function accountSectionLabel(id) { return ACCOUNT_SECTION_LABELS[id] || id; }
  function topBlockLabel(id) { return TOP_BLOCK_LABELS[id] || id; }
  function localeLabel(id) { return (LANGS[id] && LANGS[id].label) || id; }
  function skinTheme(id) { var s = findSkin(id); return s ? s.theme : 'dark'; }
  function isVisibleSkin(id) { return draft.visibleSkinIds.indexOf(id) >= 0; }
  function isOnlyVisibleSkin(id) { return isVisibleSkin(id) && draft.visibleSkinIds.length <= 1; }
  function isVisibleLocale(id) { return draft.visibleLocaleIds.indexOf(id) >= 0; }
  function isOnlyVisibleLocale(id) { return isVisibleLocale(id) && draft.visibleLocaleIds.length <= 1; }

  function sameArray(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function isDirty() {
    return JSON.stringify(draft.modules) !== JSON.stringify(applied.modules)
      || draft.skin !== applied.skin
      || !sameArray(normalizeVisibleSkins(draft.visibleSkinIds), normalizeVisibleSkins(applied.visibleSkinIds))
      || !sameArray(normalizeVisibleLocales(draft.visibleLocaleIds), normalizeVisibleLocales(applied.visibleLocaleIds))
      || JSON.stringify({ order: draft.layoutOrder, hidden: draft.hiddenSections }) !== JSON.stringify(applied.layout)
      || !sameArray(normalizeAccountHidden(draft.accountHiddenSections), applied.accountHiddenSections)
      || JSON.stringify(draft.banners) !== JSON.stringify(applied.banners)
      || JSON.stringify(normalizeChrome(draft.chrome)) !== JSON.stringify(normalizeChrome(applied.chrome))
      || JSON.stringify(normalizeSectionVariants(draft.sectionVariants)) !== JSON.stringify(normalizeSectionVariants(applied.sectionVariants))
      || (draft.siteName || DEFAULT_SITE_NAME) !== (applied.siteName || DEFAULT_SITE_NAME)
      || (draft.showSkinButton !== false) !== (applied.showSkinButton !== false)
      || JSON.stringify({ order: normalizeTopBlockOrder(draft.topBlockOrder), hidden: normalizeTopBlockHidden(draft.topBlockHidden) }) !== JSON.stringify(applied.topBlockLayout);
  }

  /* ============================================================
   * Icons
   * ========================================================== */
  var CHEV_DOWN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="studio-factory-caret"><path d="m6 9 6 6 6-6"/></svg>';
  var CHECK_SM = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>';
  var CHECK_LG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  var UPLOAD_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>';
  var GRIP_ICON = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="4" cy="3" r="1"/><circle cx="10" cy="3" r="1"/><circle cx="4" cy="7" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="4" cy="11" r="1"/><circle cx="10" cy="11" r="1"/></svg>';
  var X_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  /* ============================================================
   * Render: full DesignStudio markup
   * ========================================================== */
  function moduleGroups() {
    var cats = [];
    MODULES.forEach(function (m) { if (cats.indexOf(m.category) < 0) cats.push(m.category); });
    return cats.map(function (cat) {
      return { category: cat, label: categoryLabel(cat), items: MODULES.filter(function (m) { return m.category === cat; }) };
    });
  }
  function moduleIndex(id) {
    for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === id) return String(i + 1).replace(/^(\d)$/, '0$1');
    return '00';
  }

  function headerHTML() {
    return '<header class="studio-header">' +
        '<a class="studio-back" href="../site/index.html">← ' + esc(ts('viewSite', 'View site')) + '</a>' +
        '<h1 class="studio-title">' + esc(ts('title', 'Design Studio')) + ' <span class="studio-title-sub">/studio</span></h1>' +
      '</header>';
  }

  function factoryGroupHTML(key, title, badge, bodyHTML, extraClass) {
    var open = factoryGroupOpen[key];
    return '<div class="studio-factory-group' + (open ? ' open' : '') + (extraClass ? ' ' + extraClass : '') + '">' +
        '<button type="button" class="studio-factory-group-head" data-factory-group="' + key + '" aria-expanded="' + open + '">' +
          '<span class="studio-factory-group-text">' +
            '<span class="studio-factory-group-title">' + esc(title) + '</span>' +
            '<span class="studio-factory-group-badge">' + esc(badge) + '</span>' +
          '</span>' +
          CHEV_DOWN +
        '</button>' +
        '<div class="studio-factory-group-body">' + bodyHTML + '</div>' +
      '</div>';
  }

  function skinPickerHTML() {
    var options = SKINS.map(function (skin) {
      var sel = draft.skin === skin.id;
      return '<button type="button" class="studio-skin-pill' + (sel ? ' active' : '') + '" role="radio" aria-checked="' + sel + '" data-skin-option="' + skin.id + '">' +
        esc(skin.label) +
      '</button>';
    }).join('');
    return '<div class="studio-skin-pill-grid" role="radiogroup">' + options + '</div>';
  }

  function siteNameGroupHTML() {
    var localeOptions = Object.keys(LANGS).map(function (id) {
      var sel = id === LOCALE;
      return '<button type="button" class="studio-skin-pill' + (sel ? ' active' : '') + '" role="radio" aria-checked="' + sel + '" data-studio-locale="' + id + '">' +
        esc(LANGS[id].label) +
      '</button>';
    }).join('');
    return '<div class="studio-chrome-field">' +
        '<span>' + esc(ts('siteNameLabel', 'Site name')) + '</span>' +
        '<input id="st-sitename" class="studio-select studio-text-input" type="text" value="' + esc(draft.siteName || '') + '" placeholder="' + esc(ts('siteNamePlaceholder', 'Site name (browser tab)')) + '" />' +
      '</div>' +
      '<div class="studio-chrome-field">' +
        '<span>' + esc(ts('previewLanguage', 'Preview language')) + '</span>' +
        '<div class="studio-skin-pill-grid" role="radiogroup" aria-label="' + esc(ts('previewLanguage', 'Preview language')) + '">' + localeOptions + '</div>' +
      '</div>';
  }

  function localeListHTML() {
    var rows = Object.keys(LANGS).map(function (id) {
      var vis = isVisibleLocale(id), locked = isOnlyVisibleLocale(id);
      return '<label class="studio-skin-pill studio-skin-pill-checkbox' + (vis ? ' active' : '') + (locked ? ' locked' : '') + '">' +
        '<input class="studio-skin-pill-input" type="checkbox" data-locale-toggle="' + id + '"' + (vis ? ' checked' : '') + (locked ? ' disabled' : '') + ' />' +
        (vis ? '✓ ' : '') + esc(localeLabel(id)) +
      '</label>';
    }).join('');
    return '<div class="studio-front-skin-control"><small class="studio-factory-group-sub">' + esc(ts('frontendLocalesSub', '')) + '</small>' +
      '<div class="studio-skin-pill-grid">' + rows + '</div></div>';
  }

  function skinButtonToggleHTML() {
    var on = draft.showSkinButton !== false;
    return '<ul class="studio-layout-list">' +
        '<li class="studio-layout-item studio-layout-item-static">' +
          '<span class="studio-layout-name">' + esc(ts('skinButtonVisible', 'Skin switch button')) + '</span>' +
          '<button class="studio-visibility-toggle" type="button" role="switch" aria-checked="' + on + '" data-skin-button-toggle><span></span></button>' +
        '</li>' +
      '</ul>';
  }
  function skinListHTML() {
    var rows = SKINS.map(function (skin) {
      var vis = isVisibleSkin(skin.id), locked = isOnlyVisibleSkin(skin.id);
      return '<label class="studio-skin-pill studio-skin-pill-checkbox' + (vis ? ' active' : '') + (locked ? ' locked' : '') + '">' +
        '<input class="studio-skin-pill-input" type="checkbox" data-skin-toggle="' + skin.id + '"' + (vis ? ' checked' : '') + (locked ? ' disabled' : '') + ' />' +
        (vis ? '✓ ' : '') + esc(skin.label) +
      '</label>';
    }).join('');
    return '<div class="studio-front-skin-control"><small class="studio-factory-group-sub">' + esc(ts('frontendSkinsSub', '')) + '</small>' +
      skinButtonToggleHTML() +
      '<div class="studio-skin-pill-grid">' + rows + '</div></div>';
  }

  function sectionVariantSelectHTML(id) {
    var moduleId = PER_SECTION_MODULE[id];
    if (!moduleId) return '';
    var current = draft.sectionVariants[id] || '';
    var options = '<option value="">' + esc(ts('sectionVariantInherit', 'Inherit')) + '</option>' +
      VARIANTS.map(function (v) {
        return '<option value="' + v.id + '"' + (current === v.id ? ' selected' : '') + '>' + esc(variantName(v)) + '</option>';
      }).join('');
    // Own row under name/toggle/move (grid-column: 2 / -1) rather than a 5th
    // horizontal slot — the 340px sidebar has no room to squeeze a select in
    // sideways without truncating the (often CJK) section name.
    return '<div class="studio-layout-variant-row">' +
        '<span class="studio-layout-variant-label">' + esc(ts('sectionVariantLabel', 'Variant')) + '</span>' +
        '<select class="studio-select" data-section-variant="' + id + '">' + options + '</select>' +
      '</div>';
  }
  function layoutListHTML() {
    var items = draft.layoutOrder.map(function (id, index) {
      var hidden = draft.hiddenSections.indexOf(id) >= 0;
      return '<li class="studio-layout-item' + (hidden ? ' is-hidden' : '') + '" draggable="true" data-layout-id="' + id + '">' +
        '<span class="studio-layout-grip" aria-hidden="true">' + GRIP_ICON + '</span>' +
        '<span class="studio-layout-name">' + esc(layoutLabel(id)) + '</span>' +
        '<button class="studio-visibility-toggle" type="button" role="switch" aria-checked="' + (!hidden) + '" data-layout-toggle="' + id + '"><span></span></button>' +
        '<span class="studio-layout-move">' +
          '<button type="button" data-layout-move="up" data-index="' + index + '"' + (index === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button type="button" data-layout-move="down" data-index="' + index + '"' + (index === draft.layoutOrder.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '</span>' +
        sectionVariantSelectHTML(id) +
      '</li>';
    }).join('');
    return '<div class="studio-factory-group-actions"><button class="studio-text-button" type="button" data-act="reset-layout">' + esc(ts('resetLayout', 'Reset layout')) + '</button></div>' +
      '<ul class="studio-layout-list">' + items + '</ul>';
  }

  function topBlockListHTML() {
    var items = draft.topBlockOrder.map(function (id, index) {
      var hidden = draft.topBlockHidden.indexOf(id) >= 0;
      return '<li class="studio-layout-item' + (hidden ? ' is-hidden' : '') + '" draggable="true" data-top-block-id="' + id + '">' +
        '<span class="studio-layout-grip" aria-hidden="true">' + GRIP_ICON + '</span>' +
        '<span class="studio-layout-name">' + esc(topBlockLabel(id)) + '</span>' +
        '<button class="studio-visibility-toggle" type="button" role="switch" aria-checked="' + (!hidden) + '" data-top-block-toggle="' + id + '"><span></span></button>' +
        '<span class="studio-layout-move">' +
          '<button type="button" data-top-block-move="up" data-index="' + index + '"' + (index === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button type="button" data-top-block-move="down" data-index="' + index + '"' + (index === draft.topBlockOrder.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '</span>' +
      '</li>';
    }).join('');
    return '<ul class="studio-layout-list">' + items + '</ul>';
  }

  function accountListHTML() {
    var items = DEFAULT_ACCOUNT_SECTIONS.map(function (id) {
      var hidden = draft.accountHiddenSections.indexOf(id) >= 0;
      return '<li class="studio-layout-item studio-layout-item-static' + (hidden ? ' is-hidden' : '') + '">' +
        '<span class="studio-layout-name">' + esc(accountSectionLabel(id)) + '</span>' +
        '<button class="studio-visibility-toggle" type="button" role="switch" aria-checked="' + (!hidden) + '" data-account-toggle="' + id + '"><span></span></button>' +
      '</li>';
    }).join('');
    return '<ul class="studio-layout-list">' + items + '</ul>';
  }

  function chromeChipsHTML(part) {
    return CHROME_KEYS.map(function (vk) {
      var sel = draft.chrome[part] === vk;
      return '<button type="button" role="radio" aria-checked="' + sel + '" class="studio-chrome-chip' + (sel ? ' active' : '') + '" data-chrome-part="' + part + '" data-chrome-variant="' + vk + '">' + esc(vk.toUpperCase()) + '</button>';
    }).join('');
  }
  function chromeSectionHTML() {
    var labels = { header: ts('chromeHeader', 'Header'), footer: ts('chromeFooter', 'Footer') };
    return '<small class="studio-factory-group-sub">' + esc(ts('chromeSub', '')) + '</small>' +
      CHROME_PARTS.map(function (part) {
        return '<div class="studio-chrome-field">' +
            '<span>' + esc(labels[part]) + '</span>' +
            '<div class="studio-chrome-grid" role="radiogroup" aria-label="' + esc(labels[part]) + '">' + chromeChipsHTML(part) + '</div>' +
          '</div>';
      }).join('');
  }

  function factorySectionHTML() {
    var visibleLayoutCount = draft.layoutOrder.length - draft.hiddenSections.length;
    var visibleTopBlockCount = draft.topBlockOrder.length - draft.topBlockHidden.length;
    var visibleAccountCount = DEFAULT_ACCOUNT_SECTIONS.length - draft.accountHiddenSections.length;
    var dirty = isDirty();
    return '<section class="studio-factory-section">' +
        '<div class="studio-draft-actions">' +
          '<button class="studio-button quiet" type="button" data-act="reset-draft"' + (dirty ? '' : ' disabled') + '>' + esc(ts('resetDraft', 'Reset draft')) + '</button>' +
          '<button class="studio-button quiet" type="button" data-act="apply"' + (dirty ? '' : ' disabled') + '>' + esc(ts('apply', 'Apply')) + '</button>' +
        '</div>' +
        factoryGroupHTML('siteName', ts('siteNameGroup', 'Site name / Preview language'), (draft.siteName || DEFAULT_SITE_NAME) + ' ・ ' + ((LANGS[LOCALE] && LANGS[LOCALE].label) || LOCALE), siteNameGroupHTML()) +
        factoryGroupHTML('previewSkin', ts('previewSkin', 'Preview skin'), (findSkin(draft.skin) || SKINS[0]).label, skinPickerHTML(), 'studio-desktop-hide') +
        factoryGroupHTML('frontendLocales', ts('frontendLocales', 'Frontend locales'), ts('visibleLocaleCount', '{visible} / {total} visible', { visible: draft.visibleLocaleIds.length, total: Object.keys(LANGS).length }), localeListHTML()) +
        factoryGroupHTML('frontendSkins', ts('frontendSkins', 'Frontend skins'), ts('visibleSkinCount', '{visible} / {total} visible', { visible: draft.visibleSkinIds.length, total: SKINS.length }), skinListHTML()) +
        factoryGroupHTML('topBlocks', ts('topBlocks', 'Top blocks'), ts('visibleCount', '{visible} / {total} shown', { visible: visibleTopBlockCount, total: draft.topBlockOrder.length }), topBlockListHTML()) +
        factoryGroupHTML('homeComposition', ts('homeComposition', 'Home composition'), ts('visibleCount', '{visible} / {total} shown', { visible: visibleLayoutCount, total: draft.layoutOrder.length }), layoutListHTML()) +
        factoryGroupHTML('accountComposition', ts('accountComposition', 'Account overview panels'), ts('visibleCount', '{visible} / {total} shown', { visible: visibleAccountCount, total: DEFAULT_ACCOUNT_SECTIONS.length }), accountListHTML()) +
        factoryGroupHTML('chrome', ts('chromeTitle', 'Site chrome (header / footer)'), draft.chrome.header.toUpperCase() + ' / ' + draft.chrome.footer.toUpperCase(), chromeSectionHTML()) +
      '</section>';
  }

  function moduleLibraryHTML() {
    var groups = moduleGroups().map(function (group) {
      var buttons = group.items.map(function (m) {
        var variant = VARIANT_BY_ID[draft.modules[m.id]] || VARIANT_BY_ID.v1;
        return '<button type="button" class="studio-module-button' + (selectedModuleId === m.id ? ' active' : '') + '" data-module="' + m.id + '">' +
          '<span class="studio-module-index">' + moduleIndex(m.id) + '</span>' +
          '<span class="studio-module-copy"><strong>' + esc(moduleLabel(m)) + '</strong><small>' + esc(variantName(variant)) + '</small></span>' +
          '<span class="studio-module-code">' + esc(draft.modules[m.id].toUpperCase()) + '</span>' +
        '</button>';
      }).join('');
      return '<div class="studio-module-group"><h2>' + esc(group.label) + '</h2>' + buttons + '</div>';
    }).join('');
    return '<div class="studio-panel-head"><div>' +
        '<span>' + esc(ts('moduleLibrary', 'Module library')) + '</span>' +
        '<small>' + esc(ts('moduleCount', '{count} modules', { count: MODULES.length })) + '</small>' +
      '</div><button class="studio-text-button" type="button" data-act="foundation">' + esc(ts('setFoundation', 'Set foundation')) + '</button></div>' + groups;
  }

  function mediaUploadHTML(spec) {
    var recommended = spec.width + ' × ' + spec.height + ' px';
    var actionLabel = spec.assetKey === 'hero' ? ts('upload.addBanner', 'Add banner') : ts('upload.uploadImage', 'Upload image');
    var label = t(['studio', 'upload', 'labels', spec.assetKey], spec.label);
    var note = t(['studio', 'upload', 'notes', spec.assetKey], spec.note);
    return '<section class="studio-media-upload" data-media-key="' + spec.assetKey + '">' +
        '<div class="studio-media-upload-head"><div>' +
          '<span class="studio-media-label">' + esc(label) + '</span>' +
          '<strong class="studio-media-size">' + esc(ts('upload.recommended', 'Recommended')) + ' ' + esc(recommended) + '</strong>' +
        '</div>' +
        '<button class="studio-button studio-media-button" type="button" data-media-upload="' + spec.assetKey + '">' + UPLOAD_ICON + ' ' + esc(actionLabel) + '</button>' +
        '<input class="studio-file-input" type="file" accept="image/webp,image/jpeg,image/png,image/avif" data-media-input="' + spec.assetKey + '" /></div>' +
        '<div class="studio-media-spec-grid">' +
          '<span><small>' + esc(ts('upload.aspectRatio', 'Aspect ratio')) + '</small><strong>' + esc(spec.ratio) + '</strong></span>' +
          '<span><small>' + esc(ts('upload.fileFormats', 'File formats')) + '</small><strong>' + esc(spec.formats) + '</strong></span>' +
          '<span><small>' + esc(ts('upload.maximumSize', 'Maximum size')) + '</small><strong>' + esc(spec.maxSize) + '</strong></span>' +
          '<span data-media-actual hidden><small>' + esc(ts('upload.uploadedImage', 'Uploaded image')) + '</small><strong></strong></span>' +
        '</div>' +
        '<p class="studio-media-note">' + esc(note) + '</p>' +
      '</section>';
  }

  function bannerLibraryHTML() {
    var items = draft.banners.map(function (banner) {
      return '<div class="studio-banner-item" data-banner-id="' + esc(banner.id) + '">' +
        '<span class="studio-banner-thumb"><img src="' + esc(banner.image) + '" alt="' + esc(banner.label) + '" style="object-position:' + esc(banner.position) + '" /></span>' +
        '<strong>' + esc(banner.label) + '</strong>' +
        '<div class="studio-banner-actions">' +
          '<button type="button" class="studio-icon-button" data-banner-replace="' + esc(banner.id) + '" title="' + esc(ts('upload.replace', 'Replace image')) + '" aria-label="' + esc(ts('upload.replace', 'Replace image')) + '">' + UPLOAD_ICON + '</button>' +
          '<button type="button" class="studio-icon-button studio-icon-button-danger" data-banner-delete="' + esc(banner.id) + '" title="' + esc(ts('upload.removeBanner', 'Remove banner')) + '" aria-label="' + esc(ts('upload.removeBanner', 'Remove banner')) + '"' + (draft.banners.length <= 1 ? ' disabled' : '') + '>' + X_ICON + '</button>' +
        '</div>' +
        '<input type="text" class="studio-banner-url-input" data-banner-url="' + esc(banner.id) + '" placeholder="' + esc(ts('upload.pasteUrl', 'Or paste an image URL')) + '" />' +
      '</div>';
    }).join('');
    return '<section class="studio-banner-library">' +
        '<header><div><span>' + esc(ts('bannerSet', 'Banner set')) + '</span><small>' + esc(ts('available', '{count} available', { count: draft.banners.length })) + '</small></div>' +
        '<small>' + esc(ts('selectArtwork', '')) + '</small></header>' +
        '<div class="studio-banner-add">' +
          '<button type="button" class="studio-button quiet" data-banner-add>' + UPLOAD_ICON + ' ' + esc(ts('upload.addBanner', 'Add banner')) + '</button>' +
          '<input type="text" class="studio-banner-url-input" data-banner-add-url placeholder="' + esc(ts('upload.pasteUrl', 'Or paste an image URL')) + '" />' +
        '</div>' +
        '<input class="studio-file-input" type="file" accept="image/*" data-banner-file />' +
        '<div class="studio-banner-list">' + items + '</div>' +
      '</section>';
  }

  function editorHTML() {
    var m = null;
    for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === selectedModuleId) { m = MODULES[i]; break; }
    if (!m) m = MODULES[0];
    var spec = MEDIA_SPECS[selectedModuleId] || null;
    var mediaHTML = '';
    var bannerHTML = selectedModuleId === 'banner' ? bannerLibraryHTML() : '';
    var variantCards = VARIANTS.map(function (v) {
      var sel = draft.modules[selectedModuleId] === v.id;
      return '<button type="button" role="radio" class="studio-variant-card' + (sel ? ' active' : '') + '" aria-checked="' + sel + '" data-variant="' + v.id + '">' +
        '<span class="studio-variant-topline"><span>' + esc(v.id.toUpperCase()) + '</span>' + (sel ? CHECK_LG : '') + '</span>' +
        '<strong>' + esc(variantName(v)) + '</strong>' +
        '<small>' + esc(variantCharacter(v)) + '</small>' +
      '</button>';
    }).join('');
    return '<main class="studio-editor">' +
        '<div class="studio-editor-head"><div>' +
          '<div class="studio-eyebrow">' + esc(ts('selectedModule', 'Selected module')) + '</div>' +
          '<h2>' + esc(moduleLabel(m)) + '</h2>' +
          '<p>' + esc(moduleDescription(m)) + '</p>' +
        '</div></div>' +
        mediaHTML + bannerHTML +
        '<div class="studio-variant-grid" role="radiogroup">' + variantCards + '</div>' +
      '</main>';
  }

  function render() {
    var root = $('design-studio');
    root.innerHTML = headerHTML() +
      '<div class="studio-notice" id="st-notice" role="status" style="display:none"></div>' +
      '<div class="studio-workspace">' +
        '<aside class="studio-module-panel">' + factorySectionHTML() + moduleLibraryHTML() + '</aside>' +
        editorHTML() +
      '</div>';
    applyDraftToFrame();
  }

  function showNotice(message) {
    var el = $('st-notice');
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? '' : 'none';
    if (noticeTimer) clearTimeout(noticeTimer);
    if (message) noticeTimer = setTimeout(function () { el.textContent = ''; el.style.display = 'none'; }, 2600);
  }

  /* ============================================================
   * Live preview — apply skin + design modules directly onto the
   * same-origin iframe (variants.css does the visual work).
   * ========================================================== */
  var frame = null;
  function applyStudioChrome() {
    // Theme the studio's own chrome to match the draft skin.
    var s = findSkin(draft.skin) || SKINS[0];
    document.documentElement.setAttribute('data-skin', s.id);
    document.documentElement.setAttribute('data-theme', s.theme);
  }
  function applyDraftToFrame() {
    applyStudioChrome();
    if (!frame) return;
    var doc;
    try { doc = frame.contentDocument; } catch (e) { return; }
    if (!doc || !doc.documentElement) return;
    try { doc.title = draft.siteName || DEFAULT_SITE_NAME; } catch (e) {}
    var root = doc.documentElement;
    var s = findSkin(draft.skin) || SKINS[0];
    root.setAttribute('data-skin', s.id);
    root.setAttribute('data-theme', s.theme);
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-2');
    root.style.removeProperty('--accent-3');
    MODULES.forEach(function (m) { root.setAttribute('data-ui-' + m.id, draft.modules[m.id]); });
    var style = makeDesignStyle(draft.modules);
    Object.keys(style).forEach(function (k) { root.style.setProperty(k, style[k]); });
    var lobbyOrder = normalizeOrder(draft.layoutOrder);
    lobbyOrder.forEach(function (slug) {
      var sec = doc.querySelector('.lobby-section[data-section="' + slug + '"]');
      if (sec) sec.style.display = (draft.hiddenSections.indexOf(slug) >= 0) ? 'none' : '';
    });
    var lobbyList = doc.querySelector('.lobby-section-list');
    if (lobbyList) {
      lobbyOrder.forEach(function (slug) {
        var sec = doc.querySelector('.lobby-section[data-section="' + slug + '"]');
        var item = sec && sec.closest('.lobby-sort-item');
        if (item) lobbyList.appendChild(item);
      });
    }
    DEFAULT_ACCOUNT_SECTIONS.forEach(function (id) {
      var sec = doc.querySelector('[data-section="' + id + '"]');
      if (sec) sec.style.display = (draft.accountHiddenSections.indexOf(id) >= 0) ? 'none' : '';
    });
    var skinWraps = doc.querySelectorAll('.tb-skin-wrap');
    for (var si = 0; si < skinWraps.length; si++) skinWraps[si].style.display = (draft.showSkinButton === false) ? 'none' : '';
    var topBlockOrder = normalizeTopBlockOrder(draft.topBlockOrder);
    var catTabsEl = doc.querySelector('.cat-tabs');
    topBlockOrder.forEach(function (slug) {
      var el = doc.querySelector(TOP_BLOCK_SELECTOR[slug]);
      if (!el) return;
      el.style.display = (draft.topBlockHidden.indexOf(slug) >= 0) ? 'none' : '';
      if (catTabsEl && el.parentNode) el.parentNode.insertBefore(el, catTabsEl);
    });
    // Reflect the draft chrome + hero banners + per-section variants instantly
    // through the front-end's own appliers (site.js window.__cmsApplyChrome /
    // __cmsApplyHeroBanners / __cmsApplySectionVariants); no persistence until
    // "Apply".
    try {
      var win = frame.contentWindow;
      if (win && typeof win.__cmsApplyChrome === 'function') win.__cmsApplyChrome(normalizeChrome(draft.chrome));
      if (win && typeof win.__cmsApplyHeroBanners === 'function') win.__cmsApplyHeroBanners(normalizeBanners(draft.banners));
      if (win && typeof win.__cmsApplySectionVariants === 'function') win.__cmsApplySectionVariants(normalizeSectionVariants(draft.sectionVariants));
    } catch (e) {}
  }
  // The front-end pulls external art; its own 'load' fires late, so poll briefly
  // to reassert the draft after navigation/reload, winning any boot-time race.
  var reapplyTimer = null;
  function scheduleApply() {
    if (reapplyTimer) clearInterval(reapplyTimer);
    var n = 0;
    reapplyTimer = setInterval(function () {
      applyDraftToFrame();
      if (++n >= 24) { clearInterval(reapplyTimer); reapplyTimer = null; }
    }, 150);
  }

  /* ============================================================
   * Apply / Reset / Foundation / Import / Export
   * ========================================================== */
  function applyDraft() {
    var s = findSkin(draft.skin) || SKINS[0];
    var savedSkinIds = normalizeVisibleSkins(draft.visibleSkinIds);
    var nextSkin = savedSkinIds.indexOf(draft.skin) >= 0 ? draft.skin : savedSkinIds[0];
    draft.skin = nextSkin;
    s = findSkin(nextSkin) || SKINS[0];
    try {
      localStorage.setItem(STORAGE.skin, s.id);
      localStorage.setItem(STORAGE.theme, s.theme);
      localStorage.setItem(STORAGE.modules, JSON.stringify({ version: 1, modules: normalizeModules(draft.modules), updatedAt: new Date().toISOString() }));
      localStorage.setItem(STORAGE.visibleSkins, JSON.stringify(savedSkinIds));
      localStorage.setItem(STORAGE.visibleLocales, JSON.stringify(normalizeVisibleLocales(draft.visibleLocaleIds)));
      var layout = { order: normalizeOrder(draft.layoutOrder), hidden: normalizeHidden(draft.hiddenSections) };
      localStorage.setItem(STORAGE.lobbyLayout, JSON.stringify({ version: 1, order: layout.order, hidden: layout.hidden }));
      localStorage.setItem(STORAGE.legacyOrder, JSON.stringify(layout.order));
      localStorage.setItem(STORAGE.accountSections, JSON.stringify({ version: 1, hidden: normalizeAccountHidden(draft.accountHiddenSections) }));
      localStorage.setItem(STORAGE.heroBanners, JSON.stringify(normalizeBanners(draft.banners)));
      localStorage.setItem(STORAGE.chrome, JSON.stringify({ version: 1, chrome: normalizeChrome(draft.chrome), updatedAt: new Date().toISOString() }));
      localStorage.setItem(STORAGE.sectionVariants, JSON.stringify(normalizeSectionVariants(draft.sectionVariants)));
      localStorage.setItem(STORAGE.siteName, draft.siteName || DEFAULT_SITE_NAME);
      localStorage.setItem(STORAGE.showSkinButton, JSON.stringify(draft.showSkinButton !== false));
      var topBlockLayout = { order: normalizeTopBlockOrder(draft.topBlockOrder), hidden: normalizeTopBlockHidden(draft.topBlockHidden) };
      localStorage.setItem(STORAGE.topBlockLayout, JSON.stringify({ version: 1, order: topBlockLayout.order, hidden: topBlockLayout.hidden }));
    } catch (e) {}
    applied.modules = normalizeModules(draft.modules);
    applied.skin = nextSkin;
    applied.visibleSkinIds = savedSkinIds.slice();
    applied.visibleLocaleIds = normalizeVisibleLocales(draft.visibleLocaleIds).slice();
    applied.layout = { order: normalizeOrder(draft.layoutOrder), hidden: normalizeHidden(draft.hiddenSections) };
    applied.accountHiddenSections = normalizeAccountHidden(draft.accountHiddenSections);
    applied.banners = normalizeBanners(draft.banners).slice();
    applied.chrome = normalizeChrome(draft.chrome);
    applied.sectionVariants = normalizeSectionVariants(draft.sectionVariants);
    applied.siteName = draft.siteName || DEFAULT_SITE_NAME;
    applied.showSkinButton = draft.showSkinButton !== false;
    applied.topBlockLayout = { order: normalizeTopBlockOrder(draft.topBlockOrder), hidden: normalizeTopBlockHidden(draft.topBlockHidden) };
    render();
    reloadFrame();
    showNotice(ts('noticeApplied', 'Applied to the site.'));
  }
  function resetDraft() {
    draft.modules = normalizeModules(applied.modules);
    draft.skin = applied.skin;
    draft.visibleSkinIds = applied.visibleSkinIds.slice();
    draft.visibleLocaleIds = applied.visibleLocaleIds.slice();
    draft.layoutOrder = applied.layout.order.slice();
    draft.hiddenSections = applied.layout.hidden.slice();
    draft.accountHiddenSections = applied.accountHiddenSections.slice();
    draft.banners = applied.banners.slice();
    draft.chrome = normalizeChrome(applied.chrome);
    draft.sectionVariants = normalizeSectionVariants(applied.sectionVariants);
    draft.siteName = applied.siteName;
    draft.showSkinButton = applied.showSkinButton !== false;
    draft.topBlockOrder = applied.topBlockLayout.order.slice();
    draft.topBlockHidden = applied.topBlockLayout.hidden.slice();
    render();
    showNotice(ts('noticeReset', 'Draft reset.'));
  }
  function restoreFoundation() {
    draft.modules = normalizeModules(DEFAULT_MODULES);
    draft.layoutOrder = DEFAULT_LOBBY_ORDER.slice();
    draft.hiddenSections = [];
    draft.accountHiddenSections = [];
    draft.sectionVariants = {};
    render();
    showNotice(ts('noticeFoundation', 'All modules set to Foundation.'));
  }
  function exportConfig() {
    var payload = JSON.stringify({
      schema: 'cms-v3-site-factory', version: 1, exportedAt: new Date().toISOString(),
      skin: draft.skin, visibleSkins: normalizeVisibleSkins(draft.visibleSkinIds),
      layout: { order: normalizeOrder(draft.layoutOrder), hidden: normalizeHidden(draft.hiddenSections) },
      banners: normalizeBanners(draft.banners), modules: normalizeModules(draft.modules),
      chrome: normalizeChrome(draft.chrome), sectionVariants: normalizeSectionVariants(draft.sectionVariants),
      siteName: draft.siteName || DEFAULT_SITE_NAME, showSkinButton: draft.showSkinButton !== false
    }, null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url; link.download = 'cms-v3-site-factory.json';
    link.click();
    URL.revokeObjectURL(url);
    showNotice(ts('noticeExported', 'Design configuration exported.'));
  }
  function importConfig(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(reader.result);
        draft.modules = normalizeModules(payload.modules || payload);
        if (findSkin(payload.skin)) draft.skin = payload.skin;
        if (payload.visibleSkins) draft.visibleSkinIds = normalizeVisibleSkins(payload.visibleSkins);
        if (payload.layout) {
          draft.layoutOrder = normalizeOrder(payload.layout.order);
          draft.hiddenSections = normalizeHidden(payload.layout.hidden);
        }
        if (payload.banners) draft.banners = normalizeBanners(payload.banners);
        if (payload.chrome) draft.chrome = normalizeChrome(payload.chrome);
        if (payload.sectionVariants) draft.sectionVariants = normalizeSectionVariants(payload.sectionVariants);
        if (payload.siteName && String(payload.siteName).trim()) draft.siteName = String(payload.siteName).trim();
        if (typeof payload.showSkinButton === 'boolean') draft.showSkinButton = payload.showSkinButton;
        render();
        showNotice(ts('noticeImported', 'Configuration imported as a draft.'));
      } catch (e) {
        showNotice(ts('noticeImportFailed', 'Import failed.'));
      }
    };
    reader.onerror = function () { showNotice(ts('noticeImportFailed', 'Import failed.')); };
    reader.readAsText(file);
  }

  /* ============================================================
   * Banner + media helpers
   * ========================================================== */
  var pendingBannerId = null;
  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }
  function addBanner(image, label) {
    draft.banners = draft.banners.concat([{ id: 'banner-' + Date.now(), label: label || ts('bannerSet', 'Banner set'), image: image, position: 'center', mobilePosition: 'center' }]);
    render();
  }
  function replaceBannerImage(id, image) {
    draft.banners = draft.banners.map(function (b) { return b.id === id ? { id: b.id, label: b.label, image: image, position: b.position, mobilePosition: b.mobilePosition } : b; });
    render();
  }
  function deleteBanner(id) {
    if (draft.banners.length <= 1) return;
    draft.banners = draft.banners.filter(function (b) { return b.id !== id; });
    render();
  }
  function handleBannerFile(file) {
    if (!file) return;
    if (file.size > MAX_BANNER_BYTES) { showNotice(ts('upload.tooLarge', 'Image is too large.')); pendingBannerId = null; return; }
    readFileAsDataUrl(file).then(function (dataUrl) {
      if (pendingBannerId) replaceBannerImage(pendingBannerId, dataUrl);
      else addBanner(dataUrl, file.name.replace(/\.[^.]+$/, ''));
    }).catch(function () {}).then(function () { pendingBannerId = null; });
  }

  /* ============================================================
   * Layout reorder
   * ========================================================== */
  function moveLayout(from, to) {
    if (to < 0 || to >= draft.layoutOrder.length || from === to) return;
    var next = draft.layoutOrder.slice();
    var moved = next.splice(from, 1)[0];
    next.splice(to, 0, moved);
    draft.layoutOrder = next;
    render();
  }
  function toggleLayoutSection(id) {
    draft.hiddenSections = draft.hiddenSections.indexOf(id) >= 0
      ? draft.hiddenSections.filter(function (x) { return x !== id; })
      : draft.hiddenSections.concat([id]);
    render();
  }
  function toggleAccountSection(id) {
    draft.accountHiddenSections = draft.accountHiddenSections.indexOf(id) >= 0
      ? draft.accountHiddenSections.filter(function (x) { return x !== id; })
      : draft.accountHiddenSections.concat([id]);
    render();
  }
  function moveTopBlock(from, to) {
    if (to < 0 || to >= draft.topBlockOrder.length || from === to) return;
    var next = draft.topBlockOrder.slice();
    var moved = next.splice(from, 1)[0];
    next.splice(to, 0, moved);
    draft.topBlockOrder = next;
    render();
  }
  function toggleTopBlockSection(id) {
    draft.topBlockHidden = draft.topBlockHidden.indexOf(id) >= 0
      ? draft.topBlockHidden.filter(function (x) { return x !== id; })
      : draft.topBlockHidden.concat([id]);
    render();
  }

  /* ============================================================
   * Event delegation
   * ========================================================== */
  function onStudioClick(e) {
    var el = e.target;
    var act = el.closest('[data-act]');
    if (act) {
      var name = act.getAttribute('data-act');
      if (name === 'apply') return applyDraft();
      if (name === 'reset-draft') return resetDraft();
      if (name === 'foundation') return restoreFoundation();
      if (name === 'reset-layout') { draft.layoutOrder = DEFAULT_LOBBY_ORDER.slice(); draft.hiddenSections = []; render(); return; }
      if (name === 'view-site') { window.location.assign('../site/index.html'); return; }
    }

    var groupHead = el.closest('[data-factory-group]');
    if (groupHead) { var key = groupHead.getAttribute('data-factory-group'); factoryGroupOpen[key] = !factoryGroupOpen[key]; render(); return; }

    var moduleBtn = el.closest('[data-module]');
    if (moduleBtn) { selectedModuleId = moduleBtn.getAttribute('data-module'); render(); return; }

    var variantBtn = el.closest('[data-variant]');
    if (variantBtn) { draft.modules[selectedModuleId] = variantBtn.getAttribute('data-variant'); render(); return; }

    var chromeBtn = el.closest('[data-chrome-part]');
    if (chromeBtn) { draft.chrome[chromeBtn.getAttribute('data-chrome-part')] = chromeBtn.getAttribute('data-chrome-variant'); render(); return; }

    var skinOption = el.closest('[data-skin-option]');
    if (skinOption) { draft.skin = skinOption.getAttribute('data-skin-option'); render(); return; }

    var studioLocale = el.closest('[data-studio-locale]');
    if (studioLocale) { setStudioLocale(studioLocale.getAttribute('data-studio-locale')); return; }

    var layoutMove = el.closest('[data-layout-move]');
    if (layoutMove) {
      var index = parseInt(layoutMove.getAttribute('data-index'), 10);
      moveLayout(index, layoutMove.getAttribute('data-layout-move') === 'up' ? index - 1 : index + 1);
      return;
    }
    var layoutToggle = el.closest('[data-layout-toggle]');
    if (layoutToggle) { toggleLayoutSection(layoutToggle.getAttribute('data-layout-toggle')); return; }

    var accountToggle = el.closest('[data-account-toggle]');
    if (accountToggle) { toggleAccountSection(accountToggle.getAttribute('data-account-toggle')); return; }

    var topBlockMove = el.closest('[data-top-block-move]');
    if (topBlockMove) {
      var tIndex = parseInt(topBlockMove.getAttribute('data-index'), 10);
      moveTopBlock(tIndex, topBlockMove.getAttribute('data-top-block-move') === 'up' ? tIndex - 1 : tIndex + 1);
      return;
    }
    var topBlockToggle = el.closest('[data-top-block-toggle]');
    if (topBlockToggle) { toggleTopBlockSection(topBlockToggle.getAttribute('data-top-block-toggle')); return; }

    var skinButtonToggle = el.closest('[data-skin-button-toggle]');
    if (skinButtonToggle) { draft.showSkinButton = draft.showSkinButton === false; render(); return; }

    var bannerAdd = el.closest('[data-banner-add]');
    if (bannerAdd) { pendingBannerId = null; var bf = document.querySelector('[data-banner-file]'); if (bf) bf.click(); return; }
    var bannerReplace = el.closest('[data-banner-replace]');
    if (bannerReplace) { pendingBannerId = bannerReplace.getAttribute('data-banner-replace'); var bf2 = document.querySelector('[data-banner-file]'); if (bf2) bf2.click(); return; }
    var bannerDelete = el.closest('[data-banner-delete]');
    if (bannerDelete) { deleteBanner(bannerDelete.getAttribute('data-banner-delete')); return; }
    var mediaUpload = el.closest('[data-media-upload]');
    if (mediaUpload) { var key = mediaUpload.getAttribute('data-media-upload'); var mi = document.querySelector('[data-media-input="' + key + '"]'); if (mi) mi.click(); return; }
  }

  function onStudioChange(e) {
    var el = e.target;
    if (el.id === 'st-sitename') { draft.siteName = el.value; render(); return; }
    var sectionVariant = el.closest('[data-section-variant]');
    if (sectionVariant) {
      var slug = sectionVariant.getAttribute('data-section-variant');
      var next = normalizeSectionVariants(draft.sectionVariants);
      if (el.value) next[slug] = el.value; else delete next[slug];
      draft.sectionVariants = next;
      render();
      return;
    }
    var localeToggle = el.closest('[data-locale-toggle]');
    if (localeToggle) {
      var lid = localeToggle.getAttribute('data-locale-toggle');
      if (isOnlyVisibleLocale(lid)) { render(); return; }
      draft.visibleLocaleIds = isVisibleLocale(lid) ? draft.visibleLocaleIds.filter(function (x) { return x !== lid; }) : draft.visibleLocaleIds.concat([lid]);
      draft.visibleLocaleIds = normalizeVisibleLocales(draft.visibleLocaleIds);
      render();
      return;
    }
    var skinToggle = el.closest('[data-skin-toggle]');
    if (skinToggle) {
      var sid = skinToggle.getAttribute('data-skin-toggle');
      if (isOnlyVisibleSkin(sid)) { render(); return; }
      draft.visibleSkinIds = isVisibleSkin(sid) ? draft.visibleSkinIds.filter(function (x) { return x !== sid; }) : draft.visibleSkinIds.concat([sid]);
      draft.visibleSkinIds = normalizeVisibleSkins(draft.visibleSkinIds);
      render();
      return;
    }
    var bannerFile = el.closest('[data-banner-file]');
    if (bannerFile) { if (el.files && el.files[0]) handleBannerFile(el.files[0]); el.value = ''; return; }
    var mediaInput = el.closest('[data-media-input]');
    if (mediaInput) { handleMediaFile(el); return; }
  }

  function handleMediaFile(input) {
    var file = input.files && input.files[0];
    if (!file) { input.value = ''; return; }
    var url = URL.createObjectURL(file);
    var image = new Image();
    image.onload = function () {
      var section = input.closest('.studio-media-upload');
      var actual = section ? section.querySelector('[data-media-actual]') : null;
      if (actual) {
        actual.hidden = false;
        var spec = MEDIA_SPECS[selectedModuleId];
        var below = spec && (image.naturalWidth < spec.width || image.naturalHeight < spec.height);
        actual.classList.toggle('warning', !!below);
        actual.querySelector('strong').textContent = image.naturalWidth + ' × ' + image.naturalHeight + ' px';
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = function () { URL.revokeObjectURL(url); };
    image.src = url;
    input.value = '';
  }

  function onStudioKeydown(e) {
    if (e.key === 'Enter') {
      var addUrl = e.target.closest('[data-banner-add-url]');
      if (addUrl) { e.preventDefault(); var v = addUrl.value.trim(); if (v) { addBanner(v, ''); } return; }
      var urlInput = e.target.closest('[data-banner-url]');
      if (urlInput) { e.preventDefault(); var v2 = urlInput.value.trim(); if (v2) { replaceBannerImage(urlInput.getAttribute('data-banner-url'), v2); } return; }
    }
  }

  function onStudioDragstart(e) {
    var item = e.target.closest('[data-layout-id]');
    if (item) { layoutDragId = item.getAttribute('data-layout-id'); return; }
    var topItem = e.target.closest('[data-top-block-id]');
    if (topItem) topBlockDragId = topItem.getAttribute('data-top-block-id');
  }
  function onStudioDragover(e) {
    if (e.target.closest('[data-layout-id]') || e.target.closest('[data-top-block-id]')) e.preventDefault();
  }
  function onStudioDrop(e) {
    var item = e.target.closest('[data-layout-id]');
    if (item && layoutDragId) {
      e.preventDefault();
      var from = draft.layoutOrder.indexOf(layoutDragId);
      var to = draft.layoutOrder.indexOf(item.getAttribute('data-layout-id'));
      if (from >= 0 && to >= 0) moveLayout(from, to);
      layoutDragId = null;
      return;
    }
    var topItem = e.target.closest('[data-top-block-id]');
    if (topItem && topBlockDragId) {
      e.preventDefault();
      var tFrom = draft.topBlockOrder.indexOf(topBlockDragId);
      var tTo = draft.topBlockOrder.indexOf(topItem.getAttribute('data-top-block-id'));
      if (tFrom >= 0 && tTo >= 0) moveTopBlock(tFrom, tTo);
      topBlockDragId = null;
    }
  }

  function setStudioLocale(loc) {
    if (!LANGS[loc] || loc === LOCALE) return;
    try { localStorage.setItem(STORAGE.locale, loc); } catch (e) {}
    location.reload();
  }

  /* ============================================================
   * Preview shell controls (StudioApp): collapse, device, refresh, page
   * ========================================================== */
  function reloadFrame() {
    if (!frame) return;
    var current = frame.getAttribute('src');
    frame.setAttribute('src', current);
    scheduleApply();
  }
  function setDevice(mode) {
    deviceMode = mode;
    var viewport = $('st-viewport');
    if (viewport) viewport.classList.toggle('mobile', mode === 'mobile');
    $('st-device-desktop').classList.toggle('active', mode === 'desktop');
    $('st-device-mobile').classList.toggle('active', mode === 'mobile');
  }
  /* Preview page switcher — the iframe defaulted to a hardcoded ../site/index.html
     with no way to preview any other page; PAGES already listed the front-end's
     pages but nothing rendered or wired it (dead code). Reusing it here mirrors
     the v2 factory studio's page selector. */
  function currentPageFile() {
    if (!frame) return PAGES[0].file;
    var src = frame.getAttribute('src') || '';
    var file = src.split('/').pop().split('?')[0].split('#')[0];
    return file || PAGES[0].file;
  }
  function renderPageSelect() {
    var sel = $('st-page-select');
    if (!sel) return;
    var current = currentPageFile();
    sel.innerHTML = PAGES.map(function (p) {
      var sel2 = p.file.split('?')[0] === current;
      return '<option value="' + esc(p.file) + '"' + (sel2 ? ' selected' : '') + '>' + esc(ts('page.' + p.file, p.label)) + '</option>';
    }).join('');
  }
  function initShell() {
    frame = $('st-frame');

    // Topbar labels
    $('st-device-desktop').textContent = ts('previewDesktop', 'Desktop');
    $('st-device-mobile').textContent = ts('previewMobile390', 'Mobile 390');

    $('st-device-desktop').addEventListener('click', function () { setDevice('desktop'); });
    $('st-device-mobile').addEventListener('click', function () { setDevice('mobile'); });

    renderPageSelect();
    var pageSel = $('st-page-select');
    if (pageSel) pageSel.addEventListener('change', function () {
      frame.setAttribute('src', '../site/' + pageSel.value);
    });

    frame.addEventListener('load', function () { applyDraftToFrame(); renderPageSelect(); });

    document.addEventListener('click', onStudioClick);
    document.addEventListener('change', onStudioChange);
    document.addEventListener('keydown', onStudioKeydown);
    document.addEventListener('dragstart', onStudioDragstart);
    document.addEventListener('dragover', onStudioDragover);
    document.addEventListener('drop', onStudioDrop);

    // The front-end's own skin switcher (inside the iframe) writes straight to
    // STORAGE.skin/theme, bypassing draft/applied — without this, that choice
    // would look "unsaved" and get clobbered the next time anything re-runs
    // applyDraftToFrame() (which always paints draft.skin over the iframe).
    window.addEventListener('storage', function (e) {
      if (e.key !== STORAGE.skin || !e.newValue || !findSkin(e.newValue) || e.newValue === draft.skin) return;
      draft.skin = e.newValue;
      applied.skin = e.newValue;
      render();
    });
  }

  /* ============================================================
   * Boot
   * ========================================================== */
  document.documentElement.lang = (LANGS[LOCALE] && LANGS[LOCALE].htmlLang) || 'en';
  initShell();
  render();
  scheduleApply();
})();
