---
name: cms-scaffold
description: "Use this skill when starting a new CMS preview version in this repo (a new vN/site + vN/studio pair), when porting this repo's pattern to a brand-new project, or when doing an i18n/language-leak audit across versions. Triggers include: '新增一版', '做新的一套系統', '仿照這個架構', '中文/其他語言殘留稽核', 'new version', 'scaffold a new CMS', 'audit residual language'. Encodes the architecture, i18n conventions, git workflow, and audit methodology accumulated while building v1.5–v6 of this repo, so a new version starts from proven decisions instead of rediscovering them."
---

# CMS 預覽站架構經驗值

這份技能把打造 `cms_system`(v1.5–v6)過程中踩過的坑、驗證過可行的架構,整理成
下次做新版本/新專案時可以直接照用的操作手冊。**不是**一鍵生成整套系統的腳本——
視覺設計、業主文案、產品邏輯每次都需要真人來回確認,這份技能省的是「架構要怎麼
搭、i18n 要怎麼做才不會漏翻」這類已經驗證過的技術決策,不用每次重新試錯。

## 適用情境

1. 在本 repo 新增一個版本(例如 v7):複製既有版本的架構起手,而不是從零設計。
2. 把這套「免建置靜態站 + 設計後台即時預覽」的架構搬去做全新專案。
3. 對既有版本做「畫面上不該出現 XX 語言」的殘留稽核(不限中文,任何語言都適用)。

## 一、目錄與檔案架構(已驗證可行)

```
<project>/
├── index.html              # 統一首頁,列出所有版本的入口(前台 + 設計後台連結)
└── vN/
    ├── site/                # 前台——必須能整包獨立部署給客戶,不依賴任何專案外資源
    │   ├── index.html, account.html, deposit.html, withdrawal.html, ...
    │   └── assets/
    │       ├── css/main.css        # 手寫 CSS,用 CSS variable/token,不用任何框架編譯輸出
    │       └── js/
    │           ├── site.js          # 行為層:header/footer/sidebar 共用 chrome、彈窗、表單邏輯
    │           └── i18n.js 或 data.js  # 翻譯資料 + applyLocale()
    └── studio/               # 設計後台——非必要,但若做,以 iframe 指向 ../site/index.html
        ├── index.html
        └── studio.js         # 修改設定 → 寫入 localStorage → iframe 內的 site 讀到即時反映
```

**鐵則(從 CLAUDE.md 沿用,新專案一樣適用)**:
- `site/` 必須完全獨立、免建置、可單獨出貨——不要讓它在執行期跨資料夾讀取
  `studio/` 或任何工具腳本目錄的檔案(見下方「多版本共用內容」一節的獨立性原則)。
- 新增內容前先檢查既有 CSS token/共用 class 有沒有可套用的,不要為了省事另外疊加
  等價樣式。
- 程式碼註解只寫技術上必要的說明,不寫「業主要求」「業主 2026-xx-xx」這類敘述型/
  歷程型註解——那是 commit message 該做的事。
- studio 與 site 用 localStorage 同步設定,同源即可跨資料夾讀取,改動路徑時要同步
  檢查 studio 內的 `<link>`/`<script>`/iframe `src`。

## 二、i18n 系統:兩種做法的實測比較

這個 repo 裡實際存在兩種語系切換機制,經過完整稽核後,**強烈建議新版本一律採用
方案 A**,方案 B 只在維護既有版本時才需要知道。

### 方案 A(推薦):`data-i18n` 屬性 + key 對照表

```html
<span data-i18n="nav.lobby">Lobby</span>
<input data-i18n-placeholder="search.placeholder" placeholder="Search" />
<button data-i18n-aria="nav.menuLabel" aria-label="Menu">…</button>
```

```js
// i18n.js
var STRINGS = {
  'nav.lobby': { zh: '大廳', en: 'Lobby', ko: '로비', th: 'ล็อบบี้' },
  // ...
};
function t(key) { return (STRINGS[key] || {})[currentLocale()] || key; }
function applyLocale() {
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
  document.querySelectorAll('[data-i18n-html]').forEach(el => el.innerHTML = t(el.getAttribute('data-i18n-html')));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'))));
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))));
}
```

**為什麼推薦**:每個要翻譯的節點都「主動宣告」自己對應哪個 key,新增內容時
少加 `data-i18n` 就是唯一的失敗模式,而且很好稽核(直接 grep 沒有這個屬性但
有原文語言字元的節點)。這份 repo 裡 v1.5、v3、v4、v5、v6 都是這個做法,稽核
起來又快又準。

**常見漏洞(稽核時務必檢查)**:
- 動態產生的 HTML(JS 樣板字串插入的 header/彈窗/表格列)常常忘記加
  `data-i18n`,或者用 `tr(key, fallback)` 時 fallback 寫死原文語言、key 卻沒有
  對應的翻譯資料(畫面上會一直顯示 fallback)。
- 一個文字在頁面上出現兩次(例如球隊名稱在主要區塊 + 賠率按鈕各出現一次),
  容易只有一處掛了 `data-i18n`,另一處是純文字複製貼上。
- 預設語系是 fallback 語言(通常是英文)時,「有 fallback 資料」不等於
  「這個語言真的有掛 key」——一定要用瀏覽器實際渲染確認,不能只憑原始碼裡
  有沒有中文字元判斷。

### 方案 B(不建議新專案採用,僅供維護參考):精確字串比對換字

```js
// 靜態 HTML 直接烘焙成某個語言的原文(例如中文)當基準,
// applyLocale(target) 時建立「來源語言字串 -> 目標語言字串」的 map,
// 用 TreeWalker 掃過整棵 DOM tree,文字節點 trim 後精確比對 map 就地替換。
function swapInTree(root, map) {
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  // ...文字節點逐一比對 map 替換...
  // 屬性也要比照辦理:至少要涵蓋 placeholder / aria-label / title / alt,
  // 漏掉任何一個屬性,那個屬性就永遠不會被翻譯。
}
```

**為什麼不建議**:這是這次稽核花最多力氣的地方。它有兩個結構性弱點,新專案
不該重蹈覆轍:
1. **屬性覆蓋容易漏**——原本的實作只處理文字節點跟 `input/textarea` 的
   `placeholder`,`aria-label`/`title`/`alt` 完全沒被掃到,導致登出按鈕、
   皮膚切換按鈕、圖片替代文字在任何語言下都不會被翻譯。
2. **複合文字節點會斷掉比對**——如果可翻譯的字跟動態內容(球員名字、賠率
   數字、遊戲名稱)寫在同一個文字節點裡(例如 `於 Gates of Olympus`、
   `加碼 1.2`),trim 後的整串文字不會跟字典裡單獨的「於」「加碼」精確相等,
   換字就會失敗、原文語言外露。修法是把可翻譯的字獨立包成 `<span>` 跟動態
   內容分開,讓文字節點可以精確比對。

如果維護到用這種機制的既有版本,稽核時除了看「這個字有沒有翻譯資料」,
還要額外檢查上面兩類結構性漏洞。

## 三、多版本共用內容:翻譯主檔工具

如果新專案也是「多個版本高度相似、只有品牌名稱/少數文案不同」的架構(像
`cms_system` 的 v4/v5/v6),不要每個版本各自維護一份翻譯資料——參考本 repo
`shared/i18n/` 底下的做法:

- `master.json`:單一翻譯主檔,每個 key 記錄 `targets`(各版本對應的 key 名)、
  canonical 的 zh/en/ko/th 值、`{{BRAND}}` 佔位符(處理各版本品牌名稱不同)、
  `overrides`(處理**刻意**的版本間文案差異,不是拿來蓋掉翻譯錯誤)。
- 各版本自己的資料格式不同(扁平字串表 vs 巢狀命名空間 vs locale-keyed 字典)
  就寫對應的 parser/writer(`flat-store.js`/`v3-nav-store.js`/`dict-store.js`
  三種範例都在 `shared/i18n/`,可以直接參考複製一份改)。**一律用字元掃描
  parser,不要用單一大正規表示式硬吃整個物件**——長字串(尤其含跳脫引號的
  多句文案)很容易讓正規表示式引擎退化或誤判邊界,這次至少踩過兩次。
- `sync.js` 只做「就地替換既有 key、在區塊結尾新增 master 有但版本檔案沒有的
  key」,不重新排版、不動註解、不動未被 master 涵蓋的內容——把 diff 範圍
  控制到最小,才敢放心批次套用到多個版本。
- **這個資料夾本身不能被任何版本在執行期讀取**(不能有 `<script src="../../shared/...">`
  這種跨版本相依),否則單獨出貨某一版就會壞掉。純粹是編輯期工具。

## 四、殘留語言稽核方法論(不限中文,任何語言都適用)

**核心教訓:不能只 grep 原始碼裡有沒有目標語言字元,要用瀏覽器實際渲染。**
`data-i18n="xxx"` 標記完整、但 `xxx` 對應到的翻譯資料本身沒填或有 bug 的頁面,
grep 原始碼看不出來也不會被抓到——一定要跑起來看畫面實際輸出什麼字。

用 Playwright 對每個版本、每個頁面實際載入,擷取 `document.body.innerText`
以及 `placeholder`/`aria-label`/`title`/`alt` 屬性,用目標語言的 Unicode 區間
正規表示式(例如 CJK 是 `/[一-鿿]+/g`)偵測殘留,而不是比對原始碼:

```js
const CJK = /[一-鿿]+/g; // 依實際要排除的語言換成對應 Unicode 區間
await page.goto(url, { waitUntil: 'networkidle' });
const leaks = await page.evaluate(() => {
  function chunks(text) { /* 用上面的正規表示式抓出所有殘留片段 */ }
  const bodyChinese = chunks(document.body.innerText || '');
  const attrChinese = [];
  document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(el => {
    ['placeholder','aria-label','title','alt'].forEach(attr => {
      const v = el.getAttribute(attr);
      if (v && /[一-鿿]/.test(v)) attrChinese.push(`${attr}="${v}"`);
    });
  });
  return { bodyChinese, attrChinese };
});
```

需要登入態才能看到的頁面(會員中心),先訪問首頁建立 origin,再用
`page.evaluate` 寫入該版本的登入用 localStorage key,才不會被導回首頁。

**稽核時要特別注意的死角**:
- 預設 `hidden` 的分頁/手風琴內容(例如「關於我們」頁面裡的多個分頁面板)
  不會出現在初次載入的 `innerText` 裡,但使用者點開分頁還是看得到——這類
  內容要嘛額外模擬點擊展開後再擷取一次,要嘛在報告裡明確列為「未覆蓋、
  需要另外決定範圍」,不要誤報成「已確認乾淨」。
- 分頁標題(`<title>`)、`favicon`、專案根目錄的選版/導覽頁,很容易被排除在
  「vN/site 逐頁稽核」範圍外而被忽略,但使用者體感上一樣算「畫面上看到殘留
  語言」——瀏覽器分頁列這種地方一定要一併檢查。
- 開發用的元件展示/參考頁(例如 `ui-kit.html`)通常不會真的出貨給客戶看,
  是否要一起翻譯屬於範圍決策,不要自作主張排除或自作主張全部翻,跟業主
  確認範圍後再動手。

## 五、工作流程慣例

- 逐頁把關,不留到最後才修:每個頁面/區塊改完就要有明確的驗收標準(視覺
  pixel-diff、功能互動點逐一比對、文字內容逐字保留、console 錯誤數不變多),
  缺一項不算過。
- git:功能分支開發 → push → fast-forward merge 回預設分支 → push,一輪做完
  就做,不用每輪都等使用者確認才繼續(除非使用者要求)。
- commit message 聚焦「為什麼改」而非「改了什麼」,用專案慣用語言撰寫
  (這個 repo 是繁體中文)。
- 大範圍批次修改(跨多個檔案的同類型 fix)寫 Python/Node 腳本做,每次都要
  `node --check`(JS)/HTML parse 驗證語法,並且先 dry-run 或小範圍驗證再
  批次套用,不要憑印象手改幾十個檔案。
