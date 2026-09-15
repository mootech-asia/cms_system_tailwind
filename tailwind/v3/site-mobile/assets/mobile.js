/* 手機版首頁分頁區：熱門遊戲/小遊戲/老虎機/真人/捕魚 5 個分頁各自的
   精簡版遊戲 grid。刻意不去改 ../site/assets/js/site.js，所以這裡自己
   組一份跟 gameCardHTML() 同樣結構的 .gcard 卡片（含收藏愛心，點擊交由
   site.js 既有的 .gcard-fav 全域委派處理，見下方 gcardHeartSvg 註解）：
   - 圖片路徑不用在這裡另外補前綴——index.html 裡 data.js 載入後那段
     inline script 已經把 CMS_DATA 每一筆 g.image 統一補好 ../site/
     前綴，這裡直接用就是正確路徑（重複補會變成 ../site/../site/...）。
   - resolveGameFromCard() 是用 title/provider/圖檔檔名比對，不看路徑
     前綴，所以開啟遊戲 modal 等既有委派事件不用重寫就能用。
   - 各分頁對應的遊戲清單比照桌機版 CATEGORY_PARAMS 的分類方式
     (Hot Games=slots+live+originals前10、Mini Games=originals、
     Slots=slots、Live=live、Fish 沿用桌機版同樣的 placeholder 用
     slots 頂替——桌機版本來就沒有獨立的 fish 資料來源)。體育不在
     這裡面，維持連到獨立頁面，因為賽事不是遊戲卡片 grid。
   - 這支 script 放在 body 最後、../site/assets/js/site.js 之後，執行時
     DOM 已經解析完成，同步塞資料即可，不用等 DOMContentLoaded。 */
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 讀取跟桌機版(site.js useFavorites)同一把 lobby_favs_v1 key，這裡
     的卡片自己也有收藏愛心(見下方 cardHTML 的 favHtml)，"Favorite" 這個
     tag 篩選的是本分頁清單裡、當下已收藏的遊戲。favIds 在
     cms:favorites-changed 事件觸發時會重新讀取並重繪，見檔案最下方。 */
  var FAV_KEY = 'lobby_favs_v1';
  var favIds = (function () {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
    catch (e) { return new Set(); }
  })();
  var HEART_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path ' +
    'd="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z" ' +
    'fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  /* 收藏愛心的 on/off 兩態，跟 site.js gcardHeartSvg() 同一份 path data。
     這裡只負責初始渲染狀態；點擊後的切換交給 site.js 既有的全域委派
     （.gcard-fav 這個 class 名稱一樣，site.js 的 onDocumentClick 認得
     出來，不用在這裡另外綁 click/寫 toggleFav，兩邊共用同一把
     lobby_favs_v1，resolveGameFromCard() 靠 title/provider/圖檔名比對
     也能認出這是同一款遊戲）。 */
  function gcardHeartSvg(isFav) {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path ' +
      'd="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z" ' +
      'fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function cardHTML(g) {
    var tagHtml = g.tag
      ? '<span class="gcard-tag' + (g.tag === 'Hot' ? ' hot' : '') + (g.tag === 'New' ? ' new' : '') + '">' + esc(g.tag) + '</span>'
      : '';
    var playersHtml = g.category === 'live'
      ? '<div class="gcard-players"><span class="live-dot"></span>' + Number(g.players || 0).toLocaleString() + ' playing</div>'
      : '';
    var fav = favIds.has(g.id);
    var favHtml = '<button type="button" class="gcard-fav' + (fav ? ' on' : '') + '" aria-label="' + (fav ? 'Remove favorite' : 'Add favorite') + '">' + gcardHeartSvg(fav) + '</button>';
    return '<article class="gcard" data-provider="' + esc(g.provider) + '" data-gid="' + esc(g.id) + '" style="cursor:pointer">' +
      '<div class="gcard-art">' +
        '<img class="gcard-art-image" src="' + esc(g.image) + '" alt="" loading="lazy" decoding="async">' +
        tagHtml + favHtml + playersHtml +
      '</div>' +
      '<div class="gcard-meta"><div class="gcard-title">' + esc(g.title) + '</div><div class="gcard-provider">' + esc(g.provider) + '</div></div>' +
    '</article>';
  }

  /* 廠商篩選頁籤：每個分頁各自依實際出現的廠商動態產生(不是列出全部
     PROVIDERS，只列這個分頁遊戲清單裡真的有出現的那幾家)，插在該分頁
     .grid 前面。"All" 之後加一個 "Favorite" tag(比照桌機版 .cv-tab 的
     Favorites 頁籤，heart icon + 數量)，點擊只是篩選同一個 .grid 內
     已經渲染好的卡片顯示/隱藏(data-provider／data-gid 比對)，不用重新
     渲染或重打 API。 */
  function providerFilterHTML(games) {
    var seen = {};
    var providers = [];
    var favCount = 0;
    games.forEach(function (g) {
      if (!seen[g.provider]) { seen[g.provider] = true; providers.push(g.provider); }
      if (favIds.has(g.id)) favCount++;
    });
    var favChip = '<button type="button" class="m-provider-chip m-provider-chip-fav" data-provider="favorite">' +
      HEART_SVG + 'Favorite' + (favCount > 0 ? '<span class="m-provider-chip-count">' + favCount + '</span>' : '') + '</button>';
    var chips = '<button type="button" class="m-provider-chip active" data-provider="all">All</button>' + favChip +
      providers.map(function (p) {
        return '<button type="button" class="m-provider-chip" data-provider="' + esc(p) + '">' + esc(p) + '</button>';
      }).join('');
    return '<div class="m-provider-filter" role="tablist">' + chips + '</div>';
  }

  var data = window.CMS_DATA;
  var pages = document.querySelectorAll('.m-tabpage');
  if (!data || !pages.length) return;
  var TAB_GAMES = {
    'Hot Games': data.GAMES.slots.concat(data.GAMES.live, data.GAMES.originals).slice(0, 10),
    'Mini Games': data.GAMES.originals,
    'Slots': data.GAMES.slots,
    'Live': data.GAMES.live,
    'Fish': data.GAMES.slots
  };
  Array.prototype.forEach.call(pages, function (page) {
    var games = TAB_GAMES[page.getAttribute('data-tab')];
    var grid = page.querySelector('.grid');
    if (!games || !grid) return;
    grid.insertAdjacentHTML('beforebegin', providerFilterHTML(games));
    grid.innerHTML = games.map(cardHTML).join('');
  });

  document.addEventListener('click', function (e) {
    var chip = e.target.closest ? e.target.closest('.m-provider-chip') : null;
    if (!chip) return;
    var bar = chip.parentElement;
    var grid = bar.nextElementSibling;
    if (!grid || !grid.classList.contains('grid')) return;
    Array.prototype.forEach.call(bar.querySelectorAll('.m-provider-chip'), function (b) {
      b.classList.toggle('active', b === chip);
    });
    var provider = chip.getAttribute('data-provider');
    Array.prototype.forEach.call(grid.querySelectorAll('.gcard'), function (card) {
      var show = provider === 'all' ? true
        : provider === 'favorite' ? favIds.has(card.getAttribute('data-gid'))
        : card.getAttribute('data-provider') === provider;
      card.style.display = show ? '' : 'none';
    });
  });

  /* 收藏在別處被切換(同一款遊戲可能同時出現在多個分頁，或桌機版
     gcard-fav)時重新讀 favIds 並各自重繪：每個分頁只更新自己的
     Favorite 數量徽章、卡片愛心 on/off 狀態，以及(若當下正篩在
     Favorite)重新套用篩選——分頁之間各自獨立，不會互相污染。 */
  document.addEventListener('cms:favorites-changed', function () {
    try { favIds = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
    catch (e) { favIds = new Set(); }
    Array.prototype.forEach.call(pages, function (page) {
      var grid = page.querySelector('.grid');
      var bar = page.querySelector('.m-provider-filter');
      if (!grid || !bar) return;
      var favCount = 0;
      Array.prototype.forEach.call(grid.querySelectorAll('.gcard'), function (card) {
        var on = favIds.has(card.getAttribute('data-gid'));
        if (on) favCount++;
        var favBtn = card.querySelector('.gcard-fav');
        if (favBtn) {
          favBtn.classList.toggle('on', on);
          favBtn.innerHTML = gcardHeartSvg(on);
          favBtn.setAttribute('aria-label', on ? 'Remove favorite' : 'Add favorite');
        }
      });
      var favChip = bar.querySelector('.m-provider-chip-fav');
      if (!favChip) return;
      var countEl = favChip.querySelector('.m-provider-chip-count');
      if (favCount > 0) {
        if (countEl) countEl.textContent = favCount;
        else favChip.insertAdjacentHTML('beforeend', '<span class="m-provider-chip-count">' + favCount + '</span>');
      } else if (countEl) {
        countEl.remove();
      }
      if (favChip.classList.contains('active')) {
        Array.prototype.forEach.call(grid.querySelectorAll('.gcard'), function (card) {
          card.style.display = favIds.has(card.getAttribute('data-gid')) ? '' : 'none';
        });
      }
    });
  });
})();

/* 首頁分頁籤：點圖示切換 .m-tabpanel-scroller 對應分頁，並跟左右滑動
   手勢雙向同步——scroll-snap 讓原生觸控滑動就有分頁吸附效果，這裡只
   負責兩件事：點圖示時捲到對應分頁、滑動停下時回頭同步哪個圖示要顯示
   成 active。 */
(function () {
  var scroller = document.querySelector('.m-tabpanel-scroller');
  var tabBtns = document.querySelectorAll('.m-quicknav-item[data-tab]');
  if (!scroller || !tabBtns.length) return;
  var pages = Array.prototype.slice.call(scroller.querySelectorAll('.m-tabpage'));
  var programmatic = false;
  var programmaticTimer = null;

  function setActive(tabName) {
    Array.prototype.forEach.call(tabBtns, function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
  }

  Array.prototype.forEach.call(tabBtns, function (btn) {
    btn.addEventListener('click', function () {
      var tabName = btn.getAttribute('data-tab');
      var idx = -1;
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].getAttribute('data-tab') === tabName) { idx = i; break; }
      }
      if (idx === -1) return;
      /* 點擊當下到 smooth-scroll 動畫結束這段期間，捲動事件都算程式
         觸發，下面滑動同步那段邏輯要跳過，不然動畫還在跑的中途值會
         回頭把這裡剛設好的 active 蓋掉(連續快速點兩個圖示時尤其明顯，
         active 會停在上一個分頁)。 */
      programmatic = true;
      if (programmaticTimer) clearTimeout(programmaticTimer);
      programmaticTimer = setTimeout(function () { programmatic = false; }, 500);
      scroller.scrollTo({ left: idx * scroller.clientWidth, behavior: 'smooth' });
      setActive(tabName);
    });
  });

  var scrollTimer = null;
  scroller.addEventListener('scroll', function () {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      if (programmatic) return;
      var idx = Math.round(scroller.scrollLeft / scroller.clientWidth);
      var page = pages[idx];
      if (page) setActive(page.getAttribute('data-tab'));
    }, 120);
  }, { passive: true });
})();

/* 首頁 hero + 跑馬燈：在 .m-tabpage（各分頁自己的可捲動清單）往下捲
   時收合隱藏，讓 .m-tabpanel-wrap（flex:1）自動撐大多露出遊戲；往上
   捲或回到頂端附近時恢復顯示。實際收合/展開的 CSS 在 mobile.css
   （.m-home-body.m-scrolled .hero / .promo-ribbon），這裡只負責量測
   展開高度、判斷捲動方向、切換 .m-scrolled class。 */
(function () {
  var body = document.querySelector('.m-home-body');
  var hero = body ? body.querySelector('.hero') : null;
  var ribbon = body ? body.querySelector('.promo-ribbon') : null;
  if (!body || (!hero && !ribbon)) return;

  /* max-height 用實際量到的高度（而非固定猜測值）當展開值，才能在
     不同機型寬度（hero 是 aspect-ratio，寬度變高度就變）或文案長度
     下都精準收合到 0，不會裁切或留白；resize（例如轉橫向）只在目前
     是展開狀態才重新量測，避免收合動畫中途被覆寫成錯誤高度。 */
  /* 設 --collapse-h 這個變數餵給 mobile.css 的 max-height:var(...)，
     不要直接寫 el.style.maxHeight——inline style 設的 max-height
     specificity 會蓋過 .m-scrolled 那條收合規則，永遠收合不了。 */
  function pin(el) { if (el) el.style.setProperty('--collapse-h', el.scrollHeight + 'px'); }
  function pinIfExpanded() { if (!body.classList.contains('m-scrolled')) { pin(hero); pin(ribbon); } }
  pin(hero); pin(ribbon);
  window.addEventListener('resize', pinIfExpanded);

  var COLLAPSE_AT = 40;   /* 捲動超過這個距離才收合，避免一碰就跳 */
  var EXPAND_NEAR_TOP = 4; /* 幾乎回到頂端才恢復顯示 */
  var lastTop = new WeakMap();

  /* 收合/展開 hero 都會讓 .m-tabpanel-wrap（flex:1）跟著縮/長，連帶讓
     .m-tabpage 的可捲動範圍跟著變大/變小——瀏覽器在動畫「過程中」會
     持續把 scrollTop 夾回有效範圍內、或用 scroll anchoring 試著讓同一
     塊內容留在畫面上，這兩種調整本身都會各自觸發 scroll 事件，若不
     擋住就會跟自己的收合/展開動畫互相觸發、來回閃爍或看起來一直在跳。
     解法：動畫開始前先把 .m-tabpanel-wrap 的高度釘住（蓋掉 flex:1，
     讓它在整段動畫期間完全不跟著變動，.m-tabpage 的可捲動範圍自然
     也不會被牽動），等 hero／跑馬燈的 max-height transition 真的跑完
     （transitionend，另外保留較寬鬆的逾時當保底，例如動畫被瀏覽器
     停用時 transitionend 不會觸發）才放開，讓可捲動範圍只在動畫結束
     那一刻「一次到位」地變化，不會在過程中被反覆牽動。 */
  var locked = false;
  var lockTimer = null;
  var activePage = null; /* 最近一次收到 scroll 事件（或分頁切換）的那一頁 */

  var tabpanelWrap = document.querySelector('.m-tabpanel-wrap');
  function freezeTabpanelHeight() {
    if (!tabpanelWrap) return;
    /* 只蓋掉 flex-grow 沒用——flex:1 展開後 flex-basis 是 0%、
       flex-shrink 是 1，flex 演算法還是會把它縮回 flex-basis，
       explicit height 完全不起作用。要用 flex:none（一次歸零
       grow/shrink、basis 改回 auto）才能讓 height 真正定住。 */
    tabpanelWrap.style.height = tabpanelWrap.getBoundingClientRect().height + 'px';
    tabpanelWrap.style.flex = 'none';
  }
  function releaseTabpanelHeight() {
    if (!tabpanelWrap) return;
    tabpanelWrap.style.height = '';
    tabpanelWrap.style.flex = '';
  }

  /* releaseTabpanelHeight() 本身（放開釘住的高度、讓 flex:1 一次到位
     地生效）會觸發一次 scrollTop 調整——這跟凍結高度前想擋住的副作用
     是同一種，只是延後到這裡才發生一次。這筆調整不是使用者做的，不
     該拿來判斷收合/展開，也不該讓它把同一時間使用者自己真正做出的
     捲動事件也一起吃掉。

     早期做法是設一個 awaitingRelease 旗標，等「下一筆 scroll 事件」
     來了就當成是這次放開造成的、直接吃掉；沒想到使用者若剛好在這
     之後幾乎同時真的做出捲動（例如快速下拉又立刻反悔往上捲回頂
     端），這筆真正的事件會被誤判成放開的雜訊而整個吃掉，導致使用
     者明明已經捲回頂端、hero 卻沒有跟著展開（機率性重現，跟兩個
     事件抵達的先後順序有關）。

     改成不被動等事件：放開高度後用兩次 requestAnimationFrame 確保
     瀏覽器真的把這次 layout 變動／夾動處理完、下一次繪製也已反映
     出新的 scrollTop，這時候直接自己讀一次「現在真正的位置」來校正
     lastTop，不需要靠事件通知、也就不用再猜哪一筆事件是雜訊。lock
     只在這兩個影格內維持，之後任何 scroll 事件（不論是不是這次放開
     造成的）都直接照 syncForPage() 正常邏輯處理，不會再被整筆吃掉。 */
  function unlock() {
    if (lockTimer) { clearTimeout(lockTimer); lockTimer = null; }
    /* 使用者在鎖定期間（收合動畫進行中）有可能真的把分頁捲回頂端、
       或繼續往下捲更深，這個意圖不能漏接，但一定要用「放開釘住高度
       之前」讀到的 scrollTop 判斷——放開的當下本身就會讓可捲動範圍
       跟著變化（凍結時鎖住的是收合前的舊高度，放開才變成收合後的
       新高度），之後夾回來的數字已經是被這次變化污染過的結果，不能
       代表使用者真正停在哪裡（這正是先前「收合完一放手又自己彈開」
       的成因：污染後的數字剛好落到 <= EXPAND_NEAR_TOP，被誤判成使用
       者回到頂端）。 */
    var y = activePage ? activePage.scrollTop : null;
    var reversed = false;
    if (y != null) {
      if (y <= EXPAND_NEAR_TOP) reversed = setScrolled(false);
      else if (y > COLLAPSE_AT) reversed = setScrolled(true);
    }
    /* 判斷結果跟現在的狀態不同，setScrolled() 已經重新凍結一次高度、
       排了新一輪鎖定/解鎖去跑「反悔」那個方向的轉場，這一輪的釘住
       高度不用再放開（新一輪會接手），也不用再等這一輪的收尾。 */
    if (reversed) return;
    releaseTabpanelHeight();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        locked = false;
        if (activePage) lastTop.set(activePage, activePage.scrollTop);
      });
    });
  }
  function setScrolled(next) {
    if (body.classList.contains('m-scrolled') === next) return false;
    freezeTabpanelHeight();
    body.classList.toggle('m-scrolled', next);
    locked = true;
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = setTimeout(unlock, 700);
    return true;
  }
  [hero, ribbon].forEach(function (el) {
    if (!el) return;
    el.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'max-height') unlock();
    });
  });

  /* 在頂端往下拉（iOS/Android 常見的橡皮筋 overscroll）放開手指回彈時，
     scrollTop 會在同一串動畫裡快速衝過 COLLAPSE_AT 再彈回 0——若立刻
     收合，使用者會看到「拉開又馬上彈回收合」的閃爍。真正的往下捲會
     持續停在門檻之上，回彈只是一瞬間，所以收合前先排一個小延遲，
     時間到再確認當下是否還在門檻之上，不是的話就當作只是回彈雜訊，
     取消這次收合。 */
  var pendingCollapseTimer = null;
  function cancelPendingCollapse() {
    if (pendingCollapseTimer) { clearTimeout(pendingCollapseTimer); pendingCollapseTimer = null; }
  }
  function schedulePendingCollapse(page) {
    if (pendingCollapseTimer) return;
    pendingCollapseTimer = setTimeout(function () {
      pendingCollapseTimer = null;
      if (page.scrollTop > COLLAPSE_AT) setScrolled(true);
    }, 120);
  }

  function syncForPage(page) {
    activePage = page;
    var y = page.scrollTop;
    /* 第一次看到這個分頁時當作「本來就在頂端」（prev=0），而不是拿
       目前值當基準——否則第一筆事件永遠判斷不出「往下捲」。 */
    var prev = lastTop.has(page) ? lastTop.get(page) : 0;
    /* 這裡「往上捲要立刻生效」也不能無條件跳過 locked：放開釘住高度
       那一刻自己造成的 scrollTop 變小，跟使用者真的往上捲，兩者從
       數值上完全分不出來，若讓往上捲的判斷繞過 locked，等於連自己
       放開高度的雜訊也一起放行，又會誤判成「使用者往上捲」而錯誤
       展開。使用者鎖著這段期間如果真的往上捲到底，靠的是 unlock()
       解鎖當下的重新校正（見上面），不是靠這裡繞過鎖定。

       「y < prev 就展開」原本是想讓使用者一開始往上捲就馬上有反應、
       不用等真的捲回頂端，但條件本身完全沒管「現在人在哪裡」——真人
       用手指捲動（慣性滑行減速、放開瞬間的手震）本來就不是嚴格單調
       遞增，即使還深在清單中間（例如 scrollTop 540），只要中途出現
       任何一次比上一筆讀數小一點點的取樣，就會被判成「使用者往上
       捲」而在深處整個展開——這正是 hero 會在使用者根本沒捲回頂端
       附近時、無預警自己彈開一次的成因。加上「還在收合門檻附近
       （<= COLLAPSE_AT）」這個條件，只有使用者真的已經捲回接近頂端
       時，往上的小動作才會立刻觸發展開；還深在清單裡的雜訊不受影響。 */
    if (!locked) {
      if (y <= EXPAND_NEAR_TOP || (y < prev && y <= COLLAPSE_AT)) { cancelPendingCollapse(); setScrolled(false); }
      else if (y > prev && y > COLLAPSE_AT) schedulePendingCollapse(page);
    }
    lastTop.set(page, y);
  }

  /* 切到「本來就捲很深」的分頁要立刻收合——這顆分頁的 scrollTop 從
     離開時就沒再變過，跟 lastTop 快取值一定相等，syncForPage() 的
     方向比較永遠不會觸發，若不在切換當下主動判斷一次，會誤把它當
     成不用收合，讓 hero 疊在已經捲到一半的內容上面。

     但反過來——切到一顆「目前在頂端」的新分頁——不能因此強制展開：
     使用者可能才剛把 hero 收合、正連續切好幾個分類籤瀏覽，每切一顆
     全新分頁都自動彈開 hero 再收合一次，會變成一直閃爍跳動，跟使用
     者「往下拉才要收合」的操作完全無關。展開與否只交給使用者在目前
     分頁上真正做出的捲動手勢（見 syncForPage()），分頁切換本身維持
     現狀就好。 */
  function resyncForPage(page) {
    activePage = page;
    var y = page.scrollTop;
    cancelPendingCollapse();
    if (y > COLLAPSE_AT) setScrolled(true);
    lastTop.set(page, y);
  }

  /* .m-tabpage 的 scroll 事件不會冒泡，只能在 capture 階段抓；每個
     分頁各自獨立捲動位置，用 WeakMap 各自追蹤，避免切換分頁時互相
     誤判方向。 */
  document.addEventListener('scroll', function (e) {
    var page = e.target;
    if (!page || !page.classList || !page.classList.contains('m-tabpage')) return;
    syncForPage(page);
  }, true);

  /* 切換分頁籤（點圖示或左右滑動，見上面那段 IIFE）後，比照新分頁
     「目前」的捲動位置重新同步收合狀態，不沿用切換前那個分頁殘留
     的收合狀態。這裡是獨立的 IIFE，重新查一次 DOM，不共用上面那段
     的區域變數。 */
  var scroller = document.querySelector('.m-tabpanel-scroller');
  if (scroller) {
    var pages = scroller.querySelectorAll('.m-tabpage');
    var syncTimer = null;
    scroller.addEventListener('scroll', function () {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(function () {
        var idx = Math.round(scroller.scrollLeft / scroller.clientWidth);
        var page = pages[idx];
        if (page) resyncForPage(page);
      }, 130);
    }, { passive: true });
  }
})();

/* 補救 site.js 內部（例如促銷卡 PROMO_ART 那組 4 張圖）直接把裸路徑
   assets/mock/... 組進 inline style="background-image:url(...)" 的
   地方——這些字串是 site.js 內部組出來的，不是走 CMS_DATA，前面那段
   patch CMS_DATA.image 的 script 補不到。這裡改成通用做法：不管是
   page load 當下就在 DOM 上的，還是之後(cat-tabs 切換等)才動態塞進來
   的，只要 style 屬性裡出現沒補過前綴的 assets/ 路徑就補上 ../site/，
   不用逐一去 site.js 裡面找是哪一段程式碼組的字串。 */
(function () {
  function fixOne(el) {
    var raw = el.getAttribute && el.getAttribute('style');
    if (!raw) return;
    var fixed = raw.replace(/url\((["']?)assets\//g, 'url($1../site/assets/');
    if (fixed !== raw) el.setAttribute('style', fixed);
  }
  function fixIn(root) {
    fixOne(root);
    var els = root.querySelectorAll ? root.querySelectorAll('[style*="assets/"]') : [];
    Array.prototype.forEach.call(els, fixOne);
  }
  fixIn(document);
  if (window.MutationObserver) {
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (node) {
          if (node.nodeType === 1) fixIn(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
})();

/* 手機版遊戲詳情 modal 的登入前狀態：未登入時在 .modal-body 後面補一段
   「請先登入才能開始遊玩」+ 登入/註冊按鈕，取代先前拿掉的
   Demo/Play for real(那兩顆按鈕本來就沒有真正的遊玩流程可接，桌機版
   維持拿掉後乾淨結束，不加這段——只有手機版需要)。判斷登入狀態沿用
   site-mobile/personal-info.html 同一把 cms_v3_logged_out 旗標；圖示
   /按鈕沿用既有的 .wd-compact-empty／.wd-empty-action(withdrawal 管理
   頁「尚未設定」提示同款)，不新增等價樣式。openGameModal() 每次開新
   遊戲都會整個換掉 .modal 的 innerHTML，所以用 MutationObserver 監看，
   換掉後才有機會補這段；另外監看 signin modal 的 style 變化，登入/
   註冊成功關掉那個 modal 時，背後開著的遊戲 modal 也會跟著重新判斷。 */
(function () {
  var gameModalEl = document.getElementById('cms-modal-game');
  if (!gameModalEl) return;
  var STORAGE_KEY = 'cms_v3_logged_out';
  var GATE_CLASS = 'gm-mobile-gate';
  var GATE_HTML = '<div class="wd-compact-empty"><span class="wd-empty-symbol" aria-hidden="true">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><circle cx="12" cy="9" r="3.5"></circle><path d="M5 20a7 7 0 0 1 14 0"></path></svg>' +
    '</span><span>請先登入才能開始遊玩</span></div>' +
    '<button type="button" class="wd-empty-action" data-action="open-signin" style="margin:0 20px 20px">' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"></path></svg> 登入 / 註冊' +
    '</button>';
  function isLoggedOut() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }
  function syncGate() {
    var body = gameModalEl.querySelector('.modal-body');
    if (!body) return;
    var existing = gameModalEl.querySelector('.' + GATE_CLASS);
    if (isLoggedOut()) {
      if (!existing) {
        var wrap = document.createElement('div');
        wrap.className = GATE_CLASS;
        wrap.innerHTML = GATE_HTML;
        body.insertAdjacentElement('afterend', wrap);
      }
    } else if (existing) {
      existing.remove();
    }
  }
  if (window.MutationObserver) {
    new MutationObserver(syncGate).observe(gameModalEl, { childList: true, subtree: true });
    var signinModal = document.getElementById('cms-modal-signin');
    if (signinModal) new MutationObserver(syncGate).observe(signinModal, { attributes: true, attributeFilter: ['style'] });
  }
})();
