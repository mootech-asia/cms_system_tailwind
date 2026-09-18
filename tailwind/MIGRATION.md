# Tailwind v4 遷移方法論手冊

> 這份文件是方法論參考手冊：把 `TOKENS.md`（Phase 1 逐版 token 決策）
> 與 `PHASE3-HANDOFF.md`（Phase 1-4 逐 session 交接紀錄，含完整過程
> 敘事與逐頁 pixelmatch 數字）裡分散的決策、陷阱、SOP 抽出來，整理成
> 一份不依時間順序、可直接查表的「怎麼做／踩過什麼坑」手冊。
>
> - 要看**某個版本的完整過程、逐頁驗收數字、PR 討論脈絡** → 讀
>   `PHASE3-HANDOFF.md` 或 PR #4。
> - 要看**這套方法論本身、或準備開始新版本/新專案的遷移** → 讀這份。
> - Phase 1 的 token 命名細節/各版 skin 清單仍以 `TOKENS.md` 為準，
>   這份文件只抽取「規則」，不重複每個版本的完整色票。

> **⚠️ 方法論修正（2026-09）**：Phase 3 原本的做法——HTML 保留語意化
> class（`.ap-btn-wide`、`.dp-method-tabs` 這類），CSS 從舊站逐字搬到
> `pages/*.css`，只是把「手寫 CSS」換成「Tailwind build 出來的手寫
> CSS」——**不是工程師 Lewis 當初核定的方向**（見 commit `dc55414`）。
> 真正要交接給工程師維護的形態是 **HTML 直接寫 Tailwind utility
> class**（`flex items-center gap-2 text-sm` 這種），語意化 class 只
> 保留在還沒轉換的舊頁面上。Phase 3 已完成的頁面／PR #1-4 的內容全部
> 屬於這個錯誤方向，需要重新轉換。Phase 1（token/`@theme`）、Phase 2
> （斷點策略）、下面「已知陷阱總表」A/C-M 項這些跟 class 命名無關的
> 建置層規則仍然有效、不用重做；**Phase 3 的 SOP 本身作廢，改看下面
> 新增的「Phase 3.5：Utility Class 優先轉換 SOP」**。

## 目錄

1. [專案定位與適用範圍](#專案定位與適用範圍)
2. [整體架構](#整體架構)
3. [Phase 1：Token 與 `@theme` 建置規則](#phase-1token-與-theme-建置規則)
4. [Phase 2：斷點策略](#phase-2斷點策略)
5. [Phase 3：逐頁轉換 SOP（已作廢，見下）](#phase-3逐頁轉換-sop)
5.5 [Phase 3.5：Utility Class 優先轉換 SOP](#phase-35utility-class-優先轉換-sop)
6. [已知陷阱總表（依類別）](#已知陷阱總表依類別)
7. [測試基建](#測試基建)
8. [工具腳本](#工具腳本)
9. [Phase 4：`@apply`／格式化決策](#phase-4apply格式化決策)
10. [新版本啟動檢查清單](#新版本啟動檢查清單)

---

## 專案定位與適用範圍

把手寫 CSS（`--xxx` 變數 + 語意化 class、無框架殘留）的靜態站，逐版
逐頁轉換成 Tailwind CSS v4 build（`@tailwindcss/vite`），前提與紅線：

- **視覺/功能/內容/console 錯誤數必須跟原始頁面 100% 一致**——這是
  「換一套建置管線」不是「重新設計」。任何看起來像是改進的順手優化
  都不做。
- **CSS 復用優先**（CLAUDE.md 鐵則 1）：新增前先確認既有
  `pages/*.css` 有沒有可套用的定義，"zero new CSS" 是常態，不是例外。
- **main.css 逐字搬移**：搬移到 `pages/*.css` 的規則，選擇器/屬性/
  數值/順序都跟原始 main.css 逐字一致，只換變數命名空間（見下）。
  這個原則貫穿全專案，也是後面很多驗收方法（逐字 diff、class 集合
  核對）能成立的前提。
- **禁止分派 subagent**（CLAUDE.md 鐵則 2）：調查/批次修改/逐頁驗證/
  截圖比對一律主對話親自做。

## 整體架構

```
tailwind/
├── src/vN/{pc,mobile}/
│   ├── theme.css        # entry：@import "tailwindcss"（或 source(none)）
│   │                     # + @theme static token + :root 別名橋接 + skin 覆寫
│   ├── shell.css         # 全站共用殼層（header/footer/modal/…）
│   └── pages/*.css       # 逐頁專屬 class，一頁一檔（或多頁共用一檔）
├── vN/site/               # build 產物：桌機版靜態站（跟原站 vN/site/ 平行）
├── vN/site-mobile/        # build 產物：手機版靜態站
├── vite.config.js         # rollup input：每版 pc/mobile 各一個 entry
└── scripts/               # convert_page.py／pixelmatch_*.mjs／auth_seed.mjs／publish.mjs
```

- **每版 PC/手機各自獨立 `theme.css`**（鐵則 6）：不共用、不互相
  `@import`，即使目前色彩/圓角數值相同也要各自宣告一份——原因見下面
  「Vite CSS 去重陷阱」。
- 桌機/手機用**兩份平行部署**（`site/` + `site-mobile/`），不是同一份
  HTML 靠 `@media` 切版——這是延續原始 v3 的既有部署慣例，即使原站
  只有一份響應式 `site/`（如 v1.5/v4/v5/v6），轉換產物仍建立兩份。
- `vite.config.js` 的 rollup entry key 不能用 `.`（Rollup 拿它當副
  檔名分隔符，`v1.5-pc` 會被截斷成 `v1`），版本號含小數點的用底線
  代替（`v1_5-pc`），`scripts/publish.mjs` 再轉回資料夾名。
- `convert_page.py` 負責幫每頁 HTML 把 `<link>` 換成
  `tailwind.css`，`scripts/publish.mjs` 負責把 Vite 輸出的 hash
  檔名複製成固定檔名放進 `vN/site*/assets/css/tailwind.css`。

## Phase 1：Token 與 `@theme` 建置規則

1. **命名空間對照**：
   - 顏色 `--c-XXX`/`--xxx` → `--color-XXX`（進 `@theme`，生成
     `bg-xxx`/`text-xxx` 等 utility）
   - 圓角/陰影/字級同理進 `@theme`：`--radius-*`／`--shadow-*`／
     `--text-*`
   - **版面/元件尺寸不進 `@theme`**（`--sidebar-w`、`--header-h`
     這類），維持一般 CSS variable，用 `w-(--sidebar-w)` 語法取值——
     這些不是「顏色/字級」語意，硬塞進 `@theme` 只是徒增 utility
     產出但用不到。
   - 漸層等非法 `<color>` 值（`--g-XXX`）維持原名不進 `@theme`，留在
     `:root`。
2. **`@theme static { ... }`，不是 `@theme { ... }`**：Tailwind v4
   的 `@theme` 預設會被 tree-shaking——如果當下沒有任何頁面用到某
   token 對應的 utility（例如 `bg-navy`），build 時會把這個 token
   從輸出 CSS 直接刪掉。Phase 1 這種「先建好全部 token、頁面轉換在
   後面階段」的順序一定會踩到（token 建好時還沒有任何頁面用它）。
   **全部 `@theme` 區塊一律用 `@theme static`**，強制保留所有宣告。
3. **舊變數名 → 新變數名的別名橋接**：`@theme` 只認 `--color-*` 這類
   規定命名空間，但 main.css 原始的 `var(--xxx)` 大量散落在要逐字
   搬移的規則裡。做法：
   - `@theme static` 裡只放 `--color-xxx: 原始值`（給 Tailwind 用）。
   - `:root` 裡另外宣告 `--xxx: var(--color-xxx)` 別名橋接。
   - **`pages/*.css`／`shell.css` 這些逐字搬移的規則一律用 `--xxx`
     （原始名），不要用 `--color-xxx`**——這條是本專案吃過最貴的
     教訓之一，獨立成一節，見下面陷阱總表「局部換色變數被
     `--color-*` 命名空間繞過」。
4. **多 skin／換膚站台的兩層 token 結構**（v3/v2/v5/v6 都有）：
   - 第一層「原色調色盤」：`--bg`/`--accent`/`--line` 等，數量少
     （約 20 個上下）。
   - 第二層「語意/元件狀態」token：`--control-bg`、
     `--gradient-primary`、`--table-header-bg` 等，每個 skin 各
     50 個左右，main.css/components.css 大量直接引用——**Phase 1
     第一輪很容易只搬到第一層就以為做完**，v3 就是先漏了整層才回頭
     補（見 TOKENS.md bug 4）。核對方法：不要用「字串頻率統計」猜
     token 清單，直接逐字比對 `design-system/tokens.css` +
     `skins/*.css` 原始檔案，缺什麼一目了然。
   - 换皮機制統一用 `:root[data-skin="x"]`／`:root[data-theme="x"]`
     覆寫層（attribute selector 優先權自然蓋過 `:root`），`<html
     data-skin="...">` 切換屬性即可整站換皮，不需要 JS 重新套用
     class。
5. **色彩存值慣例要逐字保留，不要「標準化」**：v2 的顏色存成
   `R G B` 三個十進位數字（不是 hex），main.css 全站用
   `rgb(var(--c-x) / 1)` 取值（原始 `tailwind.config.ts` 的
   alpha-value 寫法）。這個存值格式**逐字保留**，不要「順手」轉成
   hex 或現代 `oklch()`——一旦轉換格式，main.css 裡上百處
   `rgb(var(--c-x) / N)` 都要跟著改，改一次就多一次漏改風險，而且
   毫無必要（Tailwind v4 對任何合法 CSS 色彩值都能用 `color-mix()`
   處理透明度修飾符，`--color-*` 別名包一層 `rgb(var(--c-x))` 即可，
   不需要改變數存值本身）。
6. **死碼/未使用 token 的判定**：不要看到「這個變數目前沒被
   main.css 引用」就直接刪除——先確認它是不是給一個這個靜態站根本
   不存在的建置管線用的（例如 v2 的 PrimeVue color ramp 是給
   `nuxt.config.ts` 用的，不是這個 repo 的消費者）。決定：保留在
   `:root`（維持原始檔案的完整性，成本只是幾個惰性 custom
   property），但不進 `@theme` 別名層（避免產生一批用不到的
   utility class）。
7. **PC/mobile 兩份 `theme.css` 必須至少有一個真的不同的 token**：
   如果兩邊內容逐 byte 相同，Vite 會把它們去重成一個實體檔案，
   `vite.config.js` 兩個 entry key 只會產生一個 dist 檔案，
   `publish.mjs` 就會少複製一份，造成 `site-mobile/` 建置後缺 CSS。
   每個新版本開工時就該先確認兩邊有沒有裝置差異值（哪怕只是
   `--header-h` 手機/桌機不同），不要假設「目前還沒發現差異」就讓
   兩份檔案完全一致。

## Phase 2：斷點策略

原始站台分兩種架構，策略不同：

### Mobile-first（v1.5／v2）

base 規則本來就是手機版，`@media(min-width:...)` 疊加桌機覆寫。

- **兩邊 bundle 都各自完整保留 base + 所有 media query，不手動攤平**。
  桌機 bundle 服務的視窗必定 ≥ 斷點值，`min-width` 自然全部命中；
  手機 bundle 服務 < 斷點值，`min-width` 覆寫自然不命中。**完全不用
  手動改任何數值，只需要 token 命名空間替換**。
- 這個結論务必先驗證再套用全部頁面：挑一頁對照 `pc/pages/x.css` 跟
  `mobile/pages/x.css` 是否 100% byte 相同，相同就代表這個策略在
  這個版本成立。

### Desktop-first（v3／v4／v5／v6）

base 規則是桌機版，`@media(max-width:...)` 覆寫手機。

- 手機 bundle 只服務到某個寬度以下（例如 `<720px`），把最外層的
  `max-width` 覆寫**攤平**成無條件 base 規則；真正巢狀的內部斷點
  （例如 `max-width:520px`/`400px`）維持真的 `@media` 區塊。桌機
  bundle 保留原始站台**全部** media query 不變。
- 手機專屬、重複出現超過一次的斷點數值，抽成 `--mobile-*` 變數，
  宣告在 `mobile/theme.css` 的 `:root`（桌機版沒有這些變數）。
- **攤平時最容易犯的錯**（見陷阱總表）：
  1. 選擇器是 `.祖先 .目標` 這種 scoped 寫法時，攤平後**必須保留
     祖先 scope**，不能把縮小後的樣式直接寫進 `.目標` 的全域基礎
     規則——這樣會波及所有用到 `.目標` 但不在該祖先底下的地方。
  2. 手動合併「base 規則 + 斷點覆寫」成一條規則時，要逐一核對覆寫
     區塊列出的**每一個**屬性都有對應改到，不能只改「看起來主要」
     的那幾個。
  3. main.css 裡跟目標元件「物理位置不相鄰」的段落（沒有獨立章節
     標題、夾在兩個看似不相關的區塊中間）容易被整段跳過。

## Phase 3：逐頁轉換 SOP

1. `grep -oE 'class="[^"]*"' <頁面>.html | tr ' "' '\n\n' | sort -u`
   取得該頁實際用到的 class 清單；同時檢查 `site.js`/`data.js` 有
   沒有動態插入的 class（不會出現在靜態 grep 結果裡）。
2. 對照 main.css 對應章節，**逐一核對每個 class 是否真的被該頁
   使用**——章節標題不完全精確，常有死代碼或其實是別頁在用。
3. 檢查是否已經在 `shell.css`／`pages/index.css`／其他已完成頁面的
   CSS 裡有 100% 符合的定義——鐵則 1，很可能「零新增 CSS」。
4. 新增 `pc/pages/<page>.css` + `mobile/pages/<page>.css`（找不到
   才新增），在兩邊 `theme.css` 的 `@import` chain 加入。**`@import`
   順序要對齊原始 `<link>` 順序**——同一個 class 兩邊都有定義、
   優先權又相同時，後載入的贏，順序反過來會導致視覺跟原站行為相反
   （見陷阱總表「CSS 載入順序」）。
5. 用 `python3 tailwind/scripts/convert_page.py <src> <dst>` 轉換
   HTML（PC＋mobile 各一次）。**轉換完務必 `diff` 比對轉換前後
   `<body>` 內容逐字相同**（見陷阱總表 `convert_page.py` 的
   `</head>` bug）。
6. `cd tailwind && npm run build`。
7. 啟動兩個測試伺服器，用 `pixelmatch_compare.mjs` 比對 PC＋手機，
   用 diff 圖＋crop 工具定位問題（遇到大範圍重影/整頁位移，先懷疑
   陷阱總表裡的 Preflight 回歸模式）。
8. 互動測試：用 `pixelmatch_interact.mjs` 對按鈕/表單/彈窗/tab 等
   互動點做點擊比對，確認轉換版行為跟原始版一致、console 錯誤數
   一致。會員限定頁記得先確認 `auth_seed.mjs` 有沒有對應版本的
   entry（見陷阱總表「登入導向陷阱」）。
9. **順便重新驗證前面已完成的頁面沒有回歸**（尤其改到
   shell.css/theme.css 這類共用檔案時）。
10. commit（繁體中文說明，動機為主）、push、更新 PR 的標題/內容
    （進度表＋pixelmatch 數字表格＋過程中發現的問題）。

## Phase 3.5：Utility Class 優先轉換 SOP

取代上面的 Phase 3。差異只在「HTML 要不要保留語意化 class」，Phase 1
（token/`@theme`）跟 Phase 2（斷點策略）不變、繼續共用。

### 核心原則

- HTML 的 `class` 屬性改寫成 Tailwind utility class 組合（`flex
  items-center gap-2 p-[14px_6px] text-[14px]` 這種），不再新增/沿用
  `.ap-tx-row` 這類語意化 class 名稱去對應手寫 CSS 規則。
- **重複三次以上的 utility class 組合也不要抽成 `@apply` 自訂 class
  或共用元件**（CLAUDE.md 鐵則 5）——直接複製貼上。
- 顏色/陰影/圓角/間距一律用 `TOKENS.md` 定義好的 token（`text-positive`、
  `border-line-hi`、`rounded-lg` 這類，theme.css 裡有 `--color-*`
  映射的才有對應 utility 名稱），數值對不到既有 token 的才用任意值
  語法（`text-[#ff6b6b]`、`p-[14px_6px]`）。
- **`@source` 是「整頁」粒度的開關，不是「單一 class」粒度**：
  `source(none)` 關掉自動掃描後，只有明確列在 `@source` 的檔案會被
  掃描產生 utility CSS。這代表**不能在一個頁面裡只轉換其中一個元件
  就上 `@source`**——沒上 `@source` 的頁面，新寫的 utility class 完全
  不會有對應樣式（等於直接壞掉）；上了 `@source` 又只轉換一部分，
  該頁其餘還沒轉換的語意化 class 全部暴露在下面「N. Utility class
  與既有語意 class 同名碰撞」的風險裡。**每頁必須一次轉換完、通過
  驗收才能把該頁加進 `@source` 清單**，不能拆元件分批上線同一頁。

### 逐頁 SOP

1. 跟 Phase 3 步驟 1-2 一樣，先列出該頁實際用到的語意化 class 清單，
   並找出 `site.js`/`mobile.js` 裡有沒有用這些 class 當 querySelector
   目標做互動綁定（見下面「O. JS 互動邏輯綁定樣式 class」）——這點
   Phase 3（維持語意 class）不需要處理，Phase 3.5 一定要處理。
2. 對照 main.css 抓出每個語意化 class 的**最終 cascade 後的值**（不是
   第一條規則的值——同 class 常常在檔案後段有 skin/場景專屬的覆寫，
   例如 `.ap-amt.neg` 在 2917 行是 `#ef4444`、3628 行才是實際生效的
   `#ff6b6b`，只看第一條會抄錯顏色）。
3. 逐一把語意化 class 換成 utility class：
   - 純色/字重/字級/間距/圓角有對應 token 就用具名 utility；沒有就用
     `[]` 任意值，數值/單位跟 main.css 逐字一致。
   - `background: linear-gradient(...)` 或其他 CSS 變數形式的漸層，
     要寫 `bg-[image:var(--x)]`，不能只寫 `bg-[var(--x)]`（會被當成
     `background-color` 解析，渲染成透明/無效果）。
   - `!important` 用 `xxx!` 後綴（如 `font-semibold!`）；任意屬性
     + `!important` 用 `[text-shadow:none]!`。
   - **原規則有 `font: inherit`（表單元件/按鈕常見）時，該元素的
     line-height 會繼承父層算出來的具體值，不是 Tailwind Preflight
     的 `line-height: normal`**——必須額外加顯式 `leading-[Npx]`，
     否則元件會被撐高/壓扁幾 px，肉眼不容易發現，要靠下面第 5 步的
     全頁 pixelmatch 抓出來。
   - **切勿使用 Tailwind 內建的數字間距 utility（`mt-3`、`p-4`
     這類 rem 為底的 class）**：本專案 `<html>` 根字級是 **14px**，
     不是瀏覽器預設的 16px，`mt-3` 算出來是 10.5px 不是 12px，跟
     main.css 寫死的 px 值對不上。一律用 `[px]` 任意值。
4. `cd tailwind && npm run build`。
5. Pixelmatch 比對該頁**所有斷點**（不是只測自己剛好在改的那個），
   0% 才算過；有落差先用 `getComputedStyle` 量測可疑元素的
   width/height/padding/margin/gap，逐屬性排查，不要只憑肉眼看
   diff 圖猜原因（很多落差是疊加的，肉眼會誤判成單一原因）。
6. **互動測試逐一實測，不能只測視覺**：凡是原本語意 class 被 JS
   當 querySelector 目標的元件，轉換後用 Playwright 實際點擊/操作，
   確認行為（導頁/toggle/彈窗/計算）跟轉換前一致——見下面「O」，這
   是本次轉換發現最容易漏測、後果最重的一類問題。
7. 確認頁面上**沒有殘留任何舊語意化 class**（`grep` 該頁，清單應為
   空），才把該頁加進對應 `theme.css` 的 `@source` 清單。
8. commit、push，commit message 記錄本頁踩到的坑（尤其是巧合同名碰撞
   跟哪個既有 class 撞名），方便之後排查同類問題。

## 已知陷阱總表（依類別）

### A. Tailwind Preflight 回歸（跟原站「沒有全站 reset」的假設衝突）

原站手寫 CSS 通常沒有 `*{margin:0}` 這類全站 reset，大量元素靠瀏覽器
UA 預設值撐間距/字重/對齊；Tailwind Preflight 把這些預設值改掉或
歸零，造成「整頁高度對不上」「文字位置差幾 px」「圖示+文字排成兩行」
這類看起來莫名其妙的視覺差異。**在 `@layer base` 裡逐條還原**（利用
`@import "tailwindcss"` 之後宣告、同層後宣告贏，main.css 逐字搬過來
的顯式宣告仍會照常覆寫，不會壞事）：

| Preflight 改動 | 現象 | 修法 |
|---|---|---|
| `body` 沒設 `line-height`，繼承 `html{line-height:1.5}` | 沒設 line-height 的元素被撐高 | `body { line-height: normal; }`（僅原站 body 本身也吃瀏覽器預設 `normal` 時適用；若原站 body 有寫死具體值則不需要這條，但要處理下一條） |
| `button/input/select/textarea` 的 `font: inherit` 讓表單元件繼承 `body` 具體的 `line-height` | 表單元件被撐高 | `button, input, select, textarea { line-height: normal; }` |
| `*{margin:0}` 把 `p`/`h1`~`h6` 的 UA 預設 margin 歸零 | 卡片高度累積少 20-30px，內容整頁位移 | 在 `@layer base` 還原 Chrome UA 預設值（`p{margin:1em 0}`、`h1{margin:.67em 0}`…`h6{margin:2.33em 0}`，margin 用 em 跟著元素自己的 font-size 走） |
| `h1~h6{font-weight:inherit}` | 沒有顯式 font-weight 的標題變細 | `h1,h2,h3,h4,h5,h6{font-weight:bold}` |
| `svg,video{display:block}` | 圖示緊接文字的 inline 排版斷成兩行 | `svg{display:inline}`（不影響已用 flex 對齊的圖示） |
| `*{margin:0}` 把 `input[type=checkbox/radio]` 的 UA 預設 margin 歸零 | 選項貼齊文字，可用寬度變大、換行點位移 | 用這個環境實測的 Chromium 預設值還原（例：`margin:3px 3px 0px 5px`） |

**教訓**：新版本一開始就把這整組已知清單搬進 `@layer base`，不要
假設「這版目前看起來沒事」——很多情況要點開被 `hidden` 屬性藏起來的
分頁/彈窗才會顯形，靜態截圖測不到。

### B. `source(none)`／巧合同名 utility（系統性問題）

Tailwind v4 沒加 `source(none)` 時，`@import "tailwindcss"` 預設
自動掃描**整個 vite 專案根目錄**（不是只掃該 entry 自己的頁面）找
class 使用紀錄。原站遺留的死重量 class（Vue→靜態站轉換殘留、原站
瀏覽器直接忽略）只要剛好符合合法 Tailwind utility 語法（`text-xs`／
`flex`／`gap-1`／`outline`／`text-right`／`container`…），就會被
自動產生成真正有效的樣式，覆蓋掉手寫 CSS 的意圖——因為 Tailwind
`@import` 展開的 `@layer theme, base, components, utilities;`
宣告順序讓 `utilities` 優先權高於 `components`，**cascade layer
比的是宣告順序，不是 specificity/source order**，手寫規則的
specificity 再高都贏不了。

**排查方法（正確版，見下面「陷阱」）**：對目標版本暫時套用
`source(none)`、重新 build，比較修正前後編譯輸出裡「獨立 class
選擇器」（正則 `(?:^|[}])\.classname\{`，排除複合/巢狀選擇器）的
差集，抓出被移除的 class，逐一比對是否以**獨立 token**形式出現在
該版本自己的 HTML `class="..."`／`site.js` 動態插入的 class 裡。

**陷阱**：不要用「HTML 用到但手寫 CSS 沒定義」這種靜態差集比對法——
只要一個 class 名稱以任何形式（哪怕是複合選擇器的後半段，例如
`.ap-btn-wide.outline` 裡的 `outline`）出現在手寫 CSS 檔案文字裡，
就會被誤判成「已定義」而排除掉，但複合選擇器只在元素同時有兩個
class 時才生效，跟 Tailwind 生成的**獨立** `.outline{...}` 規則是
完全不同的東西。這個陷阱曾經讓一輪排查漏掉真正的洩漏案例。

**修法**：`@import "tailwindcss";` 改成
`@import "tailwindcss" source(none);`，並在旁邊寫技術性註解記錄
具體案例（不是敘述型註解）。

**另一種修法（不修改 import，適用於只有單一巧合 class 的情況）**：
在 `@layer utilities` 重新宣告同一條規則，靠同層內源碼順序贏（排在
Tailwind 自動產生的工具 class 之後即可）。兩種修法不衝突，
`source(none)` 上線後前者會變成「不需要但也沒事」。

**這個問題不是逐版獨立的**——同一批版本共用一個 vite 專案根目錄，
排查一版時務必用「修正前後編譯輸出直接比對」而不是肉眼掃 diff 圖：
案例中一顆 1px 外框在整頁 pixelmatch 百分比上幾乎看不出變化（例如
某頁面修正前後從 11104px 變 11107px），必須直接確認編譯輸出裡有沒有
殘留該獨立規則才可靠。

### C. 局部換色變數被 `--color-*` 命名空間繞過

見上面 Phase 1 第 3 點。有「套在某個容器上、局部覆寫 `--bg`/`--text`
等變數值」機制的頁面（例如 `.content-light` 淺色主題區塊），
component/page CSS **必須用原始 `--xxx` 變數名**，不能用
`--color-xxx`——後者是 `@theme` 的全域命名空間，不會被局部覆寫影響，
即使預設情況下透過 `:root` 別名橋接也能正確顯示，一旦套用局部覆寫
就會整段失效（例如標題文字變成看不見的深色、輸入框標籤消失）。
只有 `theme.css` 的 `@theme` 區塊本身跟 `:root` 別名橋接該用
`--color-xxx`，其餘任何手寫 CSS 規則都跟原始碼一樣用 `--xxx`。

### D. CSS 相對路徑在巢狀目錄下被重新計算

main.css 裡的 `url(../xxx.svg)` 逐字搬進 `pages/` 子目錄的新檔案
時，Vite 在把 `@import` 內容內聯進最終 bundle 時，會依「來源檔案
相對於 entry theme.css 的目錄深度」重新計算 url()——`pages/` 這層
多出的深度會讓算出來的路徑少一層 `../`。**逐字照抄 main.css 的
url() 是錯的**，要換算成新檔案的實際存放深度，抄完後找一個真的會
觸發該分支的頁面驗證（例如強制圖片 404 走 fallback），不能只看
build 的「unresolved, left unchanged」警告字面上「看起來合理」。

### E. 手機斷點攤平時的 ancestor scope 遺失

見 Phase 2 desktop-first 一節。攤平前先確認要攤平的選擇器是「純
class」還是「`.祖先 .目標`」，後者攤平後必須保留祖先 scope。改完用
`grep` 確認這個 class 有沒有在其他跟這次改動無關的地方被用到，數量
異常多就要懷疑是不是誤傷了範圍。

### F. 逐段抄錄漏抄「物理位置不相鄰」的段落

main.css 有些小段落用行內註解取代章節標題、或直接接在無關章節中間，
逐段閱讀時容易被跳過。**不能只憑「章節標題」切分抄錄範圍**——抄完
一個 `pages/*.css` 後，額外跑一次「main.css 出現的所有 class 名稱
vs. 我寫的檔案是否都出現過」的機械式核對（寫小 script 抓兩邊
`.class-name` 集合做差集），比單靠人工逐段閱讀更可靠。

### G. `convert_page.py` 的 `</head>` replace-all 陷阱

Python 的 `content.replace('</head>', ...)` 預設取代**全部**符合的
字串。如果某頁把一份完整迷你 HTML（含字面 `</head>`）當字串塞進
`<iframe srcdoc>` 或 JS 模板，這個字面 `</head>` 也會被誤判成插入點，
把 `<link>` 插進 JS 字串裡，破壞內容也違反「內容逐字保留」。**只
取代第一個**（真正的）`</head>`，字面出現超過一次時印警告。逐頁 SOP
第 5 步跑完轉換後，務必用 `diff` 比對轉換前後 `<body>` 內容是否
逐字相同，不能只看 build 有沒有報錯。

### H. 會員限定頁的登入導向陷阱

有 `initAuthGuard()` 機制的版本（v4/v5/v6，不是所有版本都有），未
登入時會把整個瀏覽器 top-level 導向首頁。測試腳本如果沒有處理登入
態，直接 `page.goto()` 這些頁面時兩邊（原始／轉換版）都被靜默導回
首頁——pixelmatch 比對到的其實是兩份首頁，**數字好看但完全沒測到
真正的頁面內容**。修法：`auth_seed.mjs` 在呼叫測試頁面前，檢查該頁
是否在該版本的 `MEMBER_PAGES` 清單裡，是的話先用
`context.addInitScript()` 寫入登入用的 localStorage。**新增一個
版本時，`SEEDS` 物件、`MEMBER_PAGES` 清單是清單型設定，容易漏加
不是漏改**——寫完 `initAuthGuard` 比對後第一件事就該去確認
`auth_seed.mjs` 有沒有對應版本的 entry，不要等會員頁 diff 異常才
回頭查（曾經因為漏加，導致 12 個毫不相干的頁面全部卡在同一組
diff 數字，一度誤判成別的系統性 bug）。任何版本新增會員限定頁時，
測試前務必先確認 `page.goto()` 後的 `page.url()` 有沒有被導走，不要
只看 diff 百分比多低就信了。

### I. 檔案位置/命名慣例要跟既有版本核對，不要憑記憶

新版本開工前，先 `ls` 看一眼其他已完成版本的 `src/vN/pc/` 目錄結構
（例如 `shell.css` 該跟 `pages/` 同層還是子目錄），不要假設。

### J. `Read` 工具分段讀取長檔案時可能漏掉檔尾

用 `offset`+`limit` 分段讀取 main.css 這類長檔案，讀到接近檔尾的
最後一段時，務必額外確認這次讀取範圍有沒有精確涵蓋到檔案的最後
一行（讀完後檢查回傳內容的最後一行是否就是用 `wc -l` 量到的檔案
總行數），不要假設「offset+limit 夠大」就一定涵蓋到底。

### K. 手動合併「base + 覆寫」規則時漏改屬性

把「base 規則」跟「斷點覆寫」手動合併成攤平後的單一規則時，要逐一
核對覆寫區塊列出的**每一個**屬性都有對應改到，不能只改看起來主要
的那幾個。比對完務必看 pixelmatch 的 `orig height`/`new height` 是
否完全相等，高度只要有落差幾 px 就代表某個屬性沒改對。

### L. CSS 載入順序決定同優先權規則的勝負

`@import` 順序要對齊原始 `<link>` 順序。同一個 class 兩邊都有定義、
優先權又相同時，後載入的贏——順序反過來會讓視覺行為變成跟原站
相反（例如 `display:inline-flex` 變成 `display:block`，margin
collapse 行為跟著改變）。這對「main.css 系」跟「共用 UI 元件系」
兩批檔案的載入順序都適用，新增檔案時先確認原站兩個 `<link>` 的
先後順序。

### M. CSS 註解裡的字面 `*/` 會提早關閉註解

寫技術註解時如果提到類似 `bg-*/text-*` 這種寫法，CSS 語法會把中間的
`*/` 當成註解結束符號，導致後面一大段文字被誤判成 CSS 語法、整份
檔案解析錯亂。新增註解時避免連續打出 `*/`。

### N. Utility class 名稱與既有語意化 class 同名碰撞（Phase 3.5 專屬，跟 B 是同一種病但觸發方式不同）

B 項是「舊 HTML 裡的語意化 class 剛好符合 utility 語法，被自動掃描
生成」；Phase 3.5 反過來——**是我們主動在新 HTML 上使用 Tailwind
自己的 utility class 名稱（`grid`、`flex`、`hidden`、`block`、
`container` 這類極常見的單字），而舊版某個共用 CSS 檔案剛好也定義了
一個同名的語意化 class**。例如 `pages/index.css` 裡首頁遊戲卡片格線
用的 `.grid { grid-template-columns: repeat(auto-fill, ...); gap:
var(--rail-gap); padding: 10px 0 16px; margin: -10px 0 -16px; }`，
跟 account-overview.html 新轉換的 Recent Transactions 表格列使用
Tailwind 內建的 `grid` utility 撞名。因為兩條規則的 layer 優先權不同
（Tailwind utility 在較晚的 layer、舊語意 class 若屬於 base layer 或
沒包 layer 則規則各自獨立比較），**结果是逐屬性各自比較**：凡是新
utility class 有明確設定的屬性（本例的 `grid-template-columns`、
`padding`）會照常生效，但凡是新 markup **沒有主動設定**的屬性（本例
的 `gap`、`margin`），舊語意 class 的值就會直接洩漏過來，产生視覺
上看起來「差一點點但抓不到原因」的落差。

**排查方法**：pixelmatch 抓到落差但 class 看起來明明正確時，用
`getComputedStyle` 把該元素每個可疑屬性（尤其是沒在新 class 裡明確
寫到的：`gap`/`margin`/`padding`/`grid-template-columns`/`display`
相關屬性）都印出來，跟原始版本同一屬性比對，抓出「新 class 沒設但
computed 值不是初始值」的屬性，就是被同名舊規則洩漏。

**修法**：優先在新的 utility class 上明確補齊該屬性的正確值（本例
補上 `gap-0 m-0`），不要去改共用的舊語意化 class 名稱——除非確認
該舊 class 只有極少數地方用到、改名成本低（例如未來可考慮把
`pages/index.css` 的 `.grid` 改名成 `.cat-grid` 從根源消除風險，
但這類共用 class 改名影響面通常較大，需要另外排期處理，不要在轉換
單一頁面時順手做)。

**教訓**：Tailwind 的 utility 名稱清一色是英文常見單字（`grid`／
`flex`／`hidden`／`block`／`container`／`relative`／`absolute`／
`static`／`fixed`／`sticky`／`border`／`rounded`／`shadow`……），每版
舊 CSS 幾乎一定存在同名的語意化 class。**每次要在新頁面用到這類
「裸字」utility class 之前，先 `grep` 該版本全部 CSS 檔案（不只是
該頁自己的 `pages/<page>.css`，共用的 `shell.css`／其他
`pages/*.css` 都要查）有沒有同名的既有規則**，有的話比照本項排查
computed style。

### O. JS 互動邏輯綁定樣式 class，轉換後直接失效

`site.js`/`mobile.js` 裡大量用 `document.querySelector('.ap-btn-wide
.ap-grad')`、`document.querySelector('.ap-view-more')` 這類**選樣式
class 當互動綁定目標**的寫法。轉換成 utility class 後，這些原本的
語意化 class 從 HTML 上消失，對應的點擊/toggle/表單邏輯會**靜默
失效**——不會報錯，畫面看起來完全正常（pixelmatch 甚至可能是 0%），
但按鈕點下去沒有反應。這類迴歸**純視覺驗收完全抓不到**，只能靠逐一
實際觸發互動點才能發現（account-overview.html 的 Quick Actions
Deposit/Withdraw 按鈕、Recent Transactions 的 View More Records
連結都踩過這個坑）。

**修法**：比照專案既有的 `data-action="..."` 慣例（`site.js` 裡
`open-signin`／`goto-manage-bank`／`toggle-pw` 等大量既有案例），
在要轉換 class 的元素上額外加一個語意穩定、不受樣式變動影響的
`data-action` 屬性，並把 JS 裡的 `querySelector('.xxx')` 改成
`querySelector('[data-action="xxx"]')`。**兩邊裝置共用同一份
`site.js` 時（`site-mobile/*.html` 常用 `../site/assets/js/site.js`），
桌機版 HTML 即使還沒轉換 utility class，也要同步補上一樣的
`data-action` 屬性**（純新增屬性，不影響桌機樣式），否則改一邊的
selector 會讓另一邊（還沒轉換的那份 HTML）失效。

**流程要求**：轉換一個元件前，**先 grep 該元件的語意化 class 有沒有
出現在任何 `.js` 檔案的 `querySelector`/`classList`/`closest` 呼叫
裡**（不是只 grep HTML/CSS），有的話一併規劃 `data-action` 替換，
不要等 pixelmatch 過了才交付，因為視覺驗收看不出這類問題。

## 測試基建

- 原始站台伺服器：`cd <repo 根目錄> && python3 -m http.server 8901
  --bind 127.0.0.1 &`
- 轉換版伺服器：`cd tailwind && python3 -m http.server 8902 --bind
  127.0.0.1 &`（新 session 開始時這兩個 server 不會在跑，且偶爾
  background process 會在對話中途消失，重跑即可）
- Playwright + Chromium，執行檔路徑固定
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`，記得帶
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` 環境變數，不要跑
  `playwright install`（容器已預裝）。
- `node scripts/pixelmatch_compare.mjs <version> <page-name>
  [width]`：PC(1440)+手機(390) 視覺比對。
- `node scripts/pixelmatch_interact.mjs <version> <page-name>
  <step-label> <selector> [width]`：點擊互動測試。
- `scripts/auth_seed.mjs`：兩支腳本都會呼叫，依版本的
  `SEEDS[version].memberPages` 清單決定要不要先寫入登入態。
- pixelmatch `threshold: 0.1`，雜訊上限參考各版本已驗收頁面的紀錄
  （通常 PC < 1%，手機因為動畫/跑馬燈/GIF 這類動態內容可能到
  3~5%）。
- `probe` 階段量 `document.body.scrollHeight` 前務必先等 `<img>`
  全部 `complete`，否則大圖片還沒載完時量到的高度不準。
- 判斷「大範圍紅色 diff 是不是真 bug」：先 crop 出可疑區域比對，或
  用 `getBoundingClientRect()` 逐元素比對 orig/new 的 top/height，
  找出第一個開始偏移的元素——比盯著整張 diff 圖猜有效率很多。
- **環境限制**：測試環境對外部資源（如 pexels.com 縮圖）與部分頁面
  的懶載入/動態內容渲染，可能跟建立原始驗收數字時的環境不一致，
  導致手機寬度全頁 pixelmatch 在某些 session 裡不可靠（用完全未
  改動的 git HEAD 已提交產物重測也一樣，可以確認是環境問題還是
  改動造成的迴歸）。遇到這種情況，改用「編譯輸出前後直接比對」或
  「隔離最小 HTML 片段截圖」作為替代驗證手段，不要因為 pixelmatch
  數字異常就誤判成程式碼問題，也不要略過驗證直接假設沒問題。

## 工具腳本

| 腳本 | 用途 |
|---|---|
| `scripts/convert_page.py` | HTML `<link>` 骨架轉換（`</head>` 只取代第一個） |
| `scripts/pixelmatch_compare.mjs` | PC/手機視覺比對 |
| `scripts/pixelmatch_interact.mjs` | 點擊互動比對 |
| `scripts/auth_seed.mjs` | 會員頁登入態注入 |
| `scripts/publish.mjs` | build 產物搬到各版本 `site`/`site-mobile` 目錄 |
| `vite.config.js` | build entry 設定，新版本比照既有格式加 entry |
| `.prettierrc.json` | `prettier --write "src/**/*.css"` 統一格式（只動空白/引號，不動語意；不含 HTML，風險考量見 Phase 4） |

## Phase 4：`@apply`／格式化決策

- **`@apply`：不主動重構套用**。這個專案的核心方法論是「main.css
  逐字搬移」，任何用 `@apply` 把多條原始規則合併成一條新宣告，都會
  破壞「跟原始 main.css 逐字對應」這個貫穿全專案、支撐上面很多陷阱
  排查方法（逐字 diff、class 集合核對）的特性。除非要新增全新
  （非搬移自 main.css）的共用元件，且該元件恰好是一長串重複出現的
  utility 組合，否則不評估引入。
- **Prettier：全六版 CSS 統一格式化，不含 HTML**。`.prettierrc.json`
  在 Phase 1 就設定好但長期沒真的執行；`prettier --write` 只改
  空白/斷行/引號風格，不改任何選擇器/屬性值，套用後編譯輸出逐 byte
  比對修正前後完全一致，是安全操作。**HTML 不格式化**——HTML 是
  `convert_page.py` 從原始站台逐字轉換來的，Prettier 的 HTML
  格式化可能改變標籤間空白（影響 inline 元素排版）、屬性順序，
  風險遠高於 CSS，且 `prettier-plugin-tailwindcss` 排序的是
  Tailwind utility class 組合，這個專案的 HTML class 都是原站語意
  class，排序沒有意義。

## 新版本啟動檢查清單

開始一個新版本（`vN+1`）的轉換前，依序確認：

- [ ] 原始站台是 mobile-first 還是 desktop-first？（決定套用 Phase 2
      哪一套斷點策略）
- [ ] 有沒有多組 skin／換膚機制？逐字核對 `tokens.css` +
      `skins/*.css` 原始檔（不要用字串頻率統計猜），確認「原色
      調色盤」跟「語意/元件狀態」兩層都收全。
- [ ] 色彩存值格式是 hex／`rgb()`／`R G B` 三數字？逐字保留，不要
      標準化。
- [ ] 有沒有 `initAuthGuard()` 這類登入導向機制？有的話立刻在
      `auth_seed.mjs` 的 `SEEDS` 加一筆 entry，列出 `MEMBER_PAGES`。
- [ ] 有沒有局部覆寫 `--bg`/`--text` 等變數值的機制（例如淺色主題
      區塊）？有的話 component/page CSS 一律用 `--xxx` 原始變數名。
- [ ] `src/vN/{pc,mobile}/` 目錄結構跟既有版本核對一致（`shell.css`
      位置、`pages/` 命名）。
- [ ] PC/mobile 兩份 `theme.css` 是否至少有一個真的不同的 token
      （避免 Vite 去重造成 `site-mobile/` 缺 CSS）。
- [ ] `@theme` 區塊用 `@theme static`。
- [ ] 六個 Preflight 回歸（陷阱 A）一開始就整套搬進 `@layer base`，
      不要假設「這版看起來沒事」。
- [ ] `vite.config.js` 加對應 entry key，`vN-pc`/`vN-mobile`
      （含小數點的版本號用底線代替）。
- [ ] 全部頁面轉換完成後，比照「已知陷阱 B」的方法對 `source(none)`
      系統性問題做一次複查，不要假設「這版應該沒事」。
- [ ] 全部頁面轉換完成後，跑一次 `prettier --write "src/vN/**/*.css"`
      統一格式，確認編譯輸出跟格式化前 byte-identical。
