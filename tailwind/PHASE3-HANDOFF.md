# Phase 3 交接文件（v1.5／v4／v5／v6 已完成，下一步 v2 逐頁轉換）

> 給接手這個任務的新 session 看的交接文件。這份文件本身會被 commit
> 進 repo，新 session 一開始就能讀到。閱讀順序建議：先看 repo 根目錄
> `CLAUDE.md`（工作守則，鐵則必守），再看 `tailwind/TOKENS.md`
> （Phase 1 token 決策），最後看這份文件（Phase 3 現況＋下一步）。

## 目前所在位置

- repo：`mootech-asia/cms_system_tailwind`
- 分支：`phase-3-page-conversion`（直接在這個分支上繼續 commit＋push，
  不用開新分支）
- PR：#4 <https://github.com/mootech-asia/cms_system_tailwind/pull/4>
  （base 設在 `phase-1-design-tokens`，因為依賴它還沒合併的 token
  修正；每完成一頁/一個里程碑就更新這個 PR 的標題與內容，不開新 PR）
- **v1.5 全 21 頁已完成**；**v4 全 22 頁已完成**；**v5 全 22 頁
  已完成**；**v6 全 22 頁已完成**。

## 五階段總進度

| 階段 | 狀態 |
|---|---|
| Phase 1（設計 token） | v1.5/v2/v3/v4/v5/v6 **全部完成**（PR #1，未合併；v2 原本「延後」的前提是誤判，已補完，見 `TOKENS.md`） |
| Phase 2（斷點策略） | 已定案（PR #3，未合併） |
| Phase 3（逐頁轉換） | v3：**23/23 完成**；v1.5：**21/21 完成**；v4：**22/22 完成**；v5：**22/22 完成**；v6：**22/22 完成**；v2：0（尚未開始，Phase 1 token 已就緒） |
| Phase 4（`@apply`/格式檢查） | 未開始 |
| Phase 5（`MIGRATION.md`） | 未開始 |

**下一步是 v2 的 Phase 3（逐頁轉換）**。v2 的 Phase 1 token 已補完
（`tailwind/src/v2/{pc,mobile}/theme.css`，見 `TOKENS.md`「v2」章節）：
先前判斷「v2 是舊 Tailwind 編譯輸出＋PrimeVue 殘留、非手寫」是誤判，
只看了未被任何頁面載入的死檔案 `app.css`；實際載入的 `main.css` +
`themes/*.css` 架構跟其他版本一樣乾淨（手寫語意化 class + 人類可讀
`:root` token），可以直接沿用下方「逐頁 SOP」「測試基建」開工，流程
跟 v1.5/v3/v4/v5/v6 相同。v2 有 5 組換皮（`aurora`/`cosmic-pink`/
`fashion-blue`/`noir`/`rose-graphite`，透過 `:root[data-theme='x']`
切換）、色彩存值是「R G B」三個十進位數字（不是 hex，main.css 全站
用 `rgb(var(--c-x) / 1)` 取值，逐字保留這個慣例，不要改寫成別的格式）。
開工前務必先看下方 v4/v5/v6 三節「過程中新發現的問題」——尤其是 v5
那節的「區域覆寫變數 vs 全域 --color-\* token」陷阱，跟 v6 那節的
「手機斷點攤平時漏掉選擇器的 ancestor scope」陷阱，這兩類是目前踩過
最貴的坑，不要重踩一次；另外 v2 的 pc/mobile theme.css 一開工就已經
補了 `--sidebar-w`/`--mobile-nav-h` 兩個結構常數避免編譯輸出逐 byte
相同（Vite 會把完全相同的兩個 CSS entry 去重成一個檔案，害
`site-mobile/` 建置後缺 CSS），之後每寫一版新的 pages/*.css 都要留意
這件事還成立。

## 本 repo 的核心任務性質

把 `v1.5`/`v2`/`v3`/`v4`/`v5`/`v6` 六個版本的手寫 CSS 站台，逐版逐頁
轉換成 Tailwind CSS v4 build（`tailwind/` 目錄下），**視覺/功能/內容/
console 錯誤數必須跟原始頁面 100% 一致**（這是視覺原型轉換，不是
重新設計）。原始站台在 repo 根目錄（`v1.5/site/`、`v3/site/`+
`v3/site-mobile/`…），轉換產物在 `tailwind/v1.5/site/`、
`tailwind/v3/site/`… 底下，兩邊平行存在，互不影響。

驗收標準（CLAUDE.md 已寫，這裡強調）：
- 視覺：轉換前後同斷點截圖 pixel-diff 逼近 0（只容許字體抗鋸齒/動畫
  時序級雜訊）
- 功能：頁面所有互動點逐一重新觸發比對
- 內容：文字/資料逐字保留
- console：錯誤/警告數量不能變多

**鐵則 2（本 repo 專屬）：所有調查/修改/驗證都由主對話親自執行，
禁止分派 subagent**，除非使用者當次明確要求。

## v1.5 架構決策（跟 v3 不同，務必先理解）

v1.5 原始站台是**單一響應式 `main.css`**（mobile-first base +
`@media(min-width:1280px)` 桌機覆寫），不像 v3 桌機/手機原本就是兩份
不同原始檔。採用的策略：

- **兩邊 bundle 都各自完整保留 base 規則 + 所有 media query 區塊，
  不手動攤平合併**。桌機 bundle（`tailwind/v1.5/site/`）服務視窗
  必定 ≥1280px 的情境，`min-width` query 自然全部命中，等同攤平後的
  桌機最終樣式；手機 bundle（`tailwind/v1.5/site-mobile/`）服務
  <1280px 情境，`min-width:1280px` 桌機覆寫自然不命中。內部再細分的
  `max-width` 覆寫（如 quick-rail/chat-widget 更窄尺寸）兩邊都保留，
  不影響渲染。**這樣完全不用手動改任何數值，只需要 token 命名空間
  替換。**
- 即使原始站台只有一份 `v1.5/site/`，轉換產物仍然跟 v3 一樣建立
  `tailwind/v1.5/site/` + `tailwind/v1.5/site-mobile/` 兩個平行部署
  （這是 Phase 1 階段就在 `tailwind/TOKENS.md` 裡定案的既定架構，
  `vite.config.js`/`scripts/publish.mjs` 也已經照這個假設建好，不是
  這次隨意決定的）。
- token 命名空間替換規則（跟 main.css 原始變數名的對照）：
  - `--c-XXX` → `--color-XXX`（例：`--c-navy` → `--color-navy`）
  - `--g-XXX`（漸層，非法 `<color>` 值）→ 維持原名不變，仍在
    `theme.css` 的 `:root` 裡（不進 `@theme`）
  - `--header-h-mobile`/`--header-h-desktop` → 兩邊都改成同一個
    `--header-h`（各自 bundle 裡各自宣告不同值：手機 64px／桌機
    132px，已經在 Phase 1 建好）
  - `--radius-card` 等其餘結構 token 名稱不變

## v1.5 已經完成的部分

- `tailwind/src/v1.5/{pc,mobile}/shell.css`（新建）：逐字搬移
  `v1.5/site/assets/css/main.css` 第 73-145、146-535、536-624、
  625-692、693-874、875-888、1508-1760、2095-2164、3009-3156、
  3558-3622、4160-4365、4366-4454 行 —— Header（含 mobile
  menu/desktop nav）、Footer、Mobile bottom nav、浮動客服快捷列＋
  客服選單彈窗＋Live Chat 對話視窗、共用 page 容器 `.page-shell`、
  會員中心殼（UserNavbar 手機頂列＋UserSidebar）、全站彈窗
  AlertModal、日期範圍選擇器 DateRangePicker、共用漸層邊框工具
  class＋返回連結＋載入更多＋空狀態、Login/註冊彈窗、首頁進站廣告
  彈窗 PromotionModal。
- `tailwind/src/v1.5/{pc,mobile}/pages/index.css`（新建）：逐字搬移
  main.css 第 889-1507 行 —— 首頁 Banner/Marquee/HotGame/Live
  Casino-Live Sports/Slot Games 橫向捲動/促銷卡片。**注意**：這段裡
  原本還有 `.game-type-section`/`.game-type-grid`/`.game-type-item`、
  `.home-promotion`/`.home-promotion-grid`/`.home-promotion-card`
  （全站 grep 沒有任何 HTML 使用，main.css 裡的死代碼）——依鐵則 1
  沒有搬移，避免檔案累贅；`.banner-dots`/`.banner-dot` 實際是
  `promotion-list.html` 在用（index.html 單張 banner 不需要），已經
  搬到 `pages/promotion-list.css`；`.gf-marquee-desktop`／
  `.game-type-page .home-marquee` 覆寫屬於 `game-type.html`，搬到
  `pages/game-filter.css`。
- `tailwind/src/v1.5/{pc,mobile}/theme.css`：`@import` chain 依序接上
  `shell.css` → `pages/index.css` → `pages/record.css` →
  `pages/account.css` → `pages/pay.css` → `pages/banking-details.css`
  → `pages/withdrawal.css` → `pages/transaction-info.css` →
  `pages/personal-info.css` → `pages/security.css` →
  `pages/change-password.css` → `pages/about.css` →
  `pages/game-filter.css` → `pages/promotion-list.css` →
  `pages/promotion-detail.css` → `pages/sports.css`，並且在
  `@layer base` 補了四個修正（見下方「四個影響全站的 Preflight 回歸
  bug」）。
- **v1.5 全 21 頁已完成逐頁轉換**（`tailwind/v1.5/site/*.html` +
  `tailwind/v1.5/site-mobile/*.html` 各 21 份，`<link>` 骨架轉換用
  `tailwind/scripts/convert_page.py`——這支腳本已經搬進 repo 永久
  保留，見下方「工具腳本」），全部通過 pixelmatch 視覺比對＋互動
  測試驗收，逐頁 pixelmatch 數字見下方「v1.5 完成總表」。
- `assets/`（images/fonts/js）已經完整複製進
  `tailwind/v1.5/site/assets/` 與 `tailwind/v1.5/site-mobile/assets/`
  （來源就是 `v1.5/site/assets/`，兩邊 byte-identical），
  `assets/css/main.css` 舊檔已刪除（不再需要，只留 build 產物
  `assets/css/tailwind.css`）。

## 四個影響全站（不只 v1.5）的 Preflight 回歸 bug（已修正，务必了解）

這幾個 bug 是這次除錯花最多力氣才找到的，之後做 v4/v5/v6 時如果遇到
「截圖整頁高度對不上」、「文字位置差幾 px 但看起來莫名其妙」、「圖示
+文字排版斷成兩行」，**先懷疑這幾個模式**：

1. **`body` 沒設 `line-height`**：原始 main.css 完全沒設
   line-height，吃瀏覽器預設 `normal`。Tailwind Preflight 在 `html`
   設 `line-height:1.5`，`body` 沒有自己覆寫就會繼承，撐高所有沒有
   另外設 line-height 的文字元素（按鈕、段落…），首頁截圖比對一度
   全頁 +44px 才連回這裡。**修法**：`@layer base { body { ...
   line-height: normal; } }`（已加進兩邊 theme.css）。

2. **`<p>`/`<h1>`-`<h6>` 的 UA 預設 margin 被 Preflight 歸零**：原始
   main.css 沒有 `*{margin:0}` 這種全站 reset，大量標籤（例如
   `.slot-strip-name`/`.slot-strip-brand` 是 `<p>`，`.hot-game-name`
   是 `<h3>`）靠瀏覽器 UA 預設 `margin:1em 0`（h1-h6 各自倍率不同）
   撐間距，main.css 常常只覆寫其中一個方向（例如只設
   `margin-top:8px`，`margin-bottom` 保持 UA 預設）或完全不覆寫。
   Tailwind Preflight 的 `*{margin:0}` 把這些全部歸零，造成卡片高度
   累積少了 20-30px，殃及後面所有內容整頁位移。**修法**：在
   `@layer base` 還原 UA 預設值（因為本檔案在 `@import "tailwindcss"`
   之後宣告，同層後宣告贏，main.css 逐字搬過來的顯式 margin 宣告仍
   會照常覆寫這裡，不會壞事）：
   ```css
   p { margin: 1em 0; }
   h1 { margin: 0.67em 0; }
   h2 { margin: 0.83em 0; }
   h3 { margin: 1em 0; }
   h4 { margin: 1.33em 0; }
   h5 { margin: 1.67em 0; }
   h6 { margin: 2.33em 0; }
   ```
   （已加進兩邊 theme.css。这些是 Chrome UA 樣式表的標準值，margin
   用 em 是跟著該元素**自己**套用的 font-size 走，不是寫死 px。）

3. **`<h1>`-`<h6>` 的 UA 預設 `font-weight:bold` 被 Preflight 重置成
   `inherit`**：main.css 大量標題標籤（例如 `.user-navbar-title` 是
   `<h1>`）沒有顯式 `font-weight`，靠瀏覽器 UA 預設值撐粗體；
   Preflight 把 `h1,h2,h3,h4,h5,h6 { font-weight: inherit; }`，沒有
   顯式覆寫的標題會變回一般字重（betting-record 等會員中心紀錄頁的
   手機頂列標題就踩到這個）。**修法**：在 `@layer base` 補上
   `h1, h2, h3, h4, h5, h6 { font-weight: bold; }`（同上，同層後宣告
   贏，main.css 逐字搬過來的顯式 font-weight 宣告仍會照常覆寫）。

4. **`<svg>` 的 UA 預設 `display:inline` 被 Preflight 重置成
   `block`**：main.css 沒有全域 svg 規則，圖示常常直接緊接文字構成
   inline 排版（不靠 flex 對齊，例如 deposit.html 的
   `.pay-method-tab` 圖示+「LinePay」文字），文字置中全部算在同一行
   裡；Preflight 的 `svg,video { display: block; ... }` 讓圖示斷成
   獨立一行、文字被推到另一行。**修法**：`@layer base` 補上
   `svg { display: inline; }`（不影響已經用 flex 對齊圖示的元件，
   flex item 不論本身 display 是 inline 還是 block，都會被父層 flex
   context blockify，版面不變）。

**如果之後在 v4/v5/v6（也是手寫 CSS、沒有全站 reset 的站台）發現
類似「整頁高度對不上」「圖示文字排版跑掉」的情況，直接檢查是不是同一
類 margin/line-height/font-weight/svg-display 問題**，不用從頭排查。

## 一個 `convert_page.py` 腳本本身的 bug（已修正）

`convert_page.py` 原本用 Python 的 `content.replace('</head>', ...)`
（預設取代**全部**符合的字串，不是只取代第一個）尋找要插入
`<link rel="stylesheet">` 的位置。`sports.html` 用第三方遊戲開啟橋接
頁把一份完整迷你 HTML（含字面 `</head>`）當字串塞進 iframe 的
`srcdoc` 屬性，這個字面 `</head>` 也被腳本誤判成插入點，把
`tailwind.css` 的 `<link>` 插進那段 JS 字串裡，破壞了 iframe 內容、
也違反「內容逐字保留」的驗收標準。已修正成只替換**第一個**（真正的）
`</head>`，字面出現超過一次時印警告訊息。**逐頁 SOP 第 5 步跑完
`convert_page.py` 後，務必用 `diff` 比對轉換前後的 `<body>` 內容是否
逐字相同**（這次就是這樣抓到的），不能只看 build 有沒有報錯。

## v1.5 完成總表（main.css 章節 → 頁面 → pixelmatch 結果）

main.css 每個章節都有清楚的分節註解，但**不是嚴格一一對應頁面**——
處理時務必先用 `grep -oE 'class="[^"]*"'` 核對該頁實際用到哪些
class，再決定要不要搬、要不要當死代碼跳過（也要檢查 `site.js`/
`data.js` 有沒有動態插入的 class，這些不會出現在靜態 grep 結果裡）。
這次逐頁對照下來，共發現/處理了：
- **5 組死代碼**（main.css 有定義但全站沒有任何頁面使用）：
  `index.html` 的 `.game-type-section`/`.home-promotion` 系列、
  `banking-details.html` 章節的 `.bd-add-fab`/`.bd-select*`、
  `change-password.html` 的 `.cp-error`/`.cp-field.has-error`。
- **3 處「HTML 本來就同時掛兩個 class，其中一個跟 shell.css 既有
  `.no-scrollbar` 重複」**，依鐵則 1 不重複搬移：`about.html` 的
  `.about-tabs::-webkit-scrollbar`、`promotion-list.html` 的
  `.promotion-categories::-webkit-scrollbar`。
- **2 處章節位置跟實際頁面歸屬不一致**：首頁 Banner 章節裡的
  `.banner-dots`/`.banner-dot` 其實是 `promotion-list.html` 在用
  （index.html 單張 banner 不需要）；`.gf-marquee-desktop`／
  `.game-type-page .home-marquee` 覆寫也在首頁 Banner 章節裡，但屬於
  `game-type.html`。
- **1 處跨章節依賴**：`withdrawal.html` 的帳戶管理分頁重用
  `banking-details.html` 章節的 `.bd-account-*` 卡片元件，所以
  `banking-details.html` 提前於 `withdrawal.html` 處理。

| main.css 行號 | 章節 | 對應頁面 | pixelmatch（PC／手機） |
|---|---|---|---|
| 889-1507 | 首頁 Banner | `index.html` | 2.18%／4.95%（跑馬燈+促銷彈窗GIF+即時時鐘） |
| 1761-2094 | 帳戶總覽 | `account.html` | 0.002%／0.000% |
| 2165-2477 | 儲值頁 | `deposit.html` | 0.002%／0.006% |
| 2478-2660 | 提款頁 | `withdrawal.html` | 0.000%／0.000% |
| 2661-2770 | 轉帳明細 | `transaction-info.html` | 0.000%／0.154%（客服按鈕動畫） |
| 2771-3008 | 會員中心紀錄類頁面共用 | `betting-record.html`、`deposit-record.html`、`withdrawal-record.html`、`withdrawal-detail.html`、`account-record.html`、`profit-loss.html` | 全部 0.000%~0.011% |
| 3157-3237 | 個人資料 | `personal-info.html` | 0.000%／0.125% |
| 3238-3323 | 安全中心 | `security.html` | 0.000%／0.007% |
| 3324-3371 | 密碼變更 | `change-password.html` | 0.000%／0.006% |
| 3372-3557 | 結帳/銀行資料 | `banking-details.html` | 0.000%／0.011% |
| 3623-3748 | about.html | `about.html` | 0.442%／0.129%（footer-marquee 跑馬燈） |
| 3749-3847 | GameFilter（共用） | `game-type.html`／`game-list.html` | 見下 |
| 3848-3989 | 遊戲/廠商卡片 | `game-type.html`／`game-list.html` | game-type 0.75%／0.16%（即時時鐘+跑馬燈）；game-list 0.000%／0.000% |
| 3990-4092 | promotion-list.html | `promotion-list.html` | 0.106%／0.136%（footer-marquee） |
| 4093-4127 | promotion-detail.html | `promotion-detail.html` | 0.000%~0.73%／0.16%（footer-marquee） |
| 4128-4159 | sports.html | `sports.html` | 0.29%~0.91%／0.000% |

全部數字都低於 v3 已驗收頁面的雜訊上限（手機 3.6%），較高的幾個都
已個別 crop 比對確認差異只在跑馬燈/即時時鐘/彈窗 GIF 動畫時序，不是
結構性問題（詳見各自的 commit message）。

## v4 架構決策

原始站台 `main.css` 是**桌機優先＋`max-width` 斷點**（跟 v1.5 的
mobile-first 相反，PC/手機本來就是分開的 `site/`+`site-mobile/`，
跟 v3 同構）。沿用 Phase 2 已定案策略：

- 手機 bundle 只服務 `<720px`，把 `max-width:1080px`/
  `max-width:720px` 的覆寫**攤平**成無條件 base 規則；真正巢狀的
  內部斷點（`max-width:520px`/`400px`/`900px`）維持真的 `@media`
  區塊。桌機 bundle 保留原始站台**全部** media query 不變（服務到
  0，測試斷點固定 1440px）。
- 手機專屬、重複出現超過一次的斷點數值（quick-rail 收窄尺寸、hero
  高度/內距、`.about-wrap`/`.uikit-wrap` 側留白收窄值）抽成
  `--mobile-*` 變數，宣告在 `mobile/theme.css` 的 `:root`（桌機版
  沒有這些變數，因為用不到）。

`tailwind/src/v4/{pc,mobile}/` 目錄結構：

- `shell.css`：Header/QuickRail/MobileTabbar/Footer/VendorMarquee/
  LangSwitch/MobileMenu/AuthModal/CsModal/ChatWidget。
- `pages/cards.css`：遊戲/賽事卡片共用元件（`.game-tile*`/
  `.match-card*`/`.rail-arrow`）。
- `pages/index.css`、`pages/section-variants.css`：首頁專屬。
- `pages/listing.css`：6 個電子遊戲/真人/體育清單頁共用
  （`.listing-*`）。
- `pages/promotion.css`：`.promo-*`。
- `pages/member-shell.css`：會員中心殼層＋銀行卡/儲值/提款/交易
  紀錄共用元件（`.member-*`/`.bank-row*`/`.pay-*`/`.wd-*`/
  `.record-*`/`.rt-parlay-*`/`.form-*`），覆蓋 `account.html`、
  `deposit.html`、`withdrawal.html`、6 個紀錄頁、
  `change-password.html`。
- `pages/account.css`、`pages/personal-info.css`、
  `pages/security.css`、`pages/about.css`、`pages/ui-kit.css`：
  各頁專屬的少量剩餘 class。

## v4 過程中新發現的問題（在 v1.5 的 4 個基礎上）

上面「四個影響全站的 Preflight 回歸 bug」（body line-height、
p/h1-h6 margin、h1-h6 font-weight、svg display）**同樣適用 v4**，
但 v4 一開始只補了下面第 5 點（v4 專屬），漏掉了 1.5 已知的那 4 個，
因為 v4 預設可見畫面剛好沒有明顯受影響的元素，**直到
`withdrawal.html` 的加密錢包分頁——藏在 `hidden` 屬性後面才顯形**
（互動測試才會點開，靜態截圖測不到）。已於 v4 收尾時全部補齊並對
所有已完成頁面回歸測試。**教訓：新版本一開始就要把已知的全站
Preflight 回歸清單整套搬過去，不要假設「這版目前看起來沒事」。**

5. **表單控制項（`button`/`input`/`select`/`textarea`）UA 預設
   `line-height:normal` 被 Preflight 的 `font:inherit` 改成繼承
   `body` 的 `line-height`**（v4 專屬，其他版本 body 沒設具體
   line-height 所以不會踩到）：v4 的 `main.css` 對 body 設了具體的
   `line-height:1.5`（不是 v1.5 那種吃瀏覽器預設 `normal` 的情況），
   表單元件繼承後被撐高（例如 `.header-lang-trigger` 33px 變
   36.75px）。**修法**：`@layer base` 補
   `button, input, select, textarea { line-height: normal; }`。

6. **`input[type=radio]`/`checkbox` 的 UA 預設 margin 被 Preflight
   歸零**（`deposit.html` 優惠選項單選鈕）：main.css 沒有對這兩種
   input 設 margin，UA 預設值（這個環境的 Chromium 實測
   `margin:3px 3px 0px 5px`）被 `*{margin:0}` 歸零，單選鈕貼齊旁邊
   文字，撐大文字可用寬度、換行點跟著位移（互動測試一度量到 4.5%
   diff，點開加密錢包分頁才會顯形）。**修法**：`@layer base` 補
   `input[type="checkbox"], input[type="radio"] { margin: 3px 3px
   0px 5px; }`。

7. **少數頁面內嵌 `style="...var(--gold)"` 這類舊變數名稱失效**：
   顏色 token 搬進 `@theme` 後全部改用 `--color-*` 命名空間生成
   Tailwind utility，但 `deposit.html`/`account.html`/
   `ui-kit.html`/4 個紀錄頁的 inline style 仍直接寫舊名稱
   （`--gold`/`--text`/`--bg` 等）——依規定 body 逐字保留不能改字，
   不能去改 HTML。**修法**：在 `:root` 補上舊名別名回新變數
   （`--gold: var(--color-gold)` 等），換膚時仍會正確重新解析。
   **如果之後版本也有這種 inline `var(--舊名)` 殘留，同樣用別名
   解法，不要動 HTML。**

8. **測試腳本沒有處理會員限定頁登入態**：`deposit.html`/
   `withdrawal.html` 等 12 個頁面（完整清單見
   `v4/site/assets/js/site.js` 的 `MEMBER_PAGES`）是會員限定頁，
   `initAuthGuard` 在未登入時會把整個瀏覽器 top-level 導向
   `index.html`（studio iframe 預覽時因為 `window!==window.top` 會
   跳過這個導向，設計後台預覽不受影響）。Playwright 直接
   `page.goto()` 這些頁面時，因為沒有登入態，兩邊（原始／轉換版）
   都被靜默導回 `index.html`——pixelmatch 比對到的其實是兩份
   `index.html`，**數字好看但完全沒測到真正的頁面內容**（這是這次
   debug 花最多力氣才發現的陷阱：`deposit.html`/`withdrawal.html`
   一開始的 pixelmatch 數字全部正常，是因為兩邊比較的都是
   index.html）。**修法**：新增 `tailwind/scripts/auth_seed.mjs`，
   兩支 pixelmatch 腳本呼叫測試頁面前都會檢查該頁是否在
   `MEMBER_PAGES` 清單裡，是的話先用 `context.addInitScript()` 寫入
   登入用的 localStorage（`cms-v4-auth`）。**之後 v5/v6 如果也有
   類似的會員限定頁登入導向機制，先確認 key 名稱/清單，在
   `auth_seed.mjs` 的 `SEEDS` 物件裡加一個對應版本的 entry 即可**
   （不用整支重寫）。**任何版本新增會員限定頁時，測試前務必先確認
   `page.goto()` 後的 `page.url()` 有沒有被導走，不要只看 diff
   百分比多低就信了。**

## v4 完成總表（22/22，PC／手機 pixelmatch，已含上述修正後回歸）

| 頁面 | PC | 手機 | 備註 |
|---|---|---|---|
| index.html | 0.096% | 0.145% | |
| hot-games/slot/fish/mini-games/live.html | 0.100~0.160% | 0.151~0.171% | 6 個清單頁共用 listing.css |
| sport.html | 0.066% | 0.145% | |
| promotion.html | 0.000% | 0.017% | |
| account.html | 0.039% | 0.743% | 會員卡片標題列文字 kerning + footer 雜訊 |
| deposit.html | 0.064% | 0.412% | 互動：channel切換0.151%／金額選擇0.178% |
| withdrawal.html | 0.055% | 0.003% | 互動：帳戶管理tab 0.177%／加密錢包分頁 0.000% |
| betting/deposit/withdrawal-record、withdrawal-detail、account-record、profit-loss | 0.009~0.078% | 0.034~0.603% | 記錄家族 6 頁共用 member-shell.css，zero new CSS；betting-record 串關展開互動 0.188% |
| personal-info.html | 0.075% | 0.497% | |
| security.html | 0.069% | 0.547% | |
| change-password.html | 0.069% | 0.453% | zero new CSS（form-* 已在 member-shell.css） |
| about.html | 0.103% | 0.332% | 互動：分頁切換0.146%／FAQ展開0.151% |
| ui-kit.html | 0.014% | 0.271% | 展示元件全部重用既有 CSS，zero new component CSS |

全部數字遠低於雜訊上限，console 錯誤數量兩邊一致。

## v5 架構決策

跟 v4 同構：`main.css` 桌機優先＋`max-width` 斷點，原始站台單一
`site/`（無獨立 `site-mobile/`），沿用同一套「手機 bundle 攤平
1080/720px 覆寫，900/520/400px 等維持真的巢狀 @media」策略。差異：

- v5 的 `max-width` 斷點覆寫**集中寫在 main.css 檔尾一個大的
  RESPONSIVE 區塊**，不像 v4 大多是緊跟在元件規則後面就地覆寫——
  要花更多力氣把每條覆寫歸類回正確的元件屬於哪個 pages/*.css。
- `tailwind/src/v5/{pc,mobile}/pages/index.css` 比 v4 多了
  `.jackpot-panel`（累積獎金 widget）、`.hero-signup`（首頁 hero
  內嵌快速註冊卡）、`.content-light`（見下方問題 1）、
  `.testimonial-card`、`.spotlight-block`、`.bottom-promo-stack`
  （APP 推廣條 + 加入提示條，桌機/平板專屬，手機用
  `.mobile-tabbar` 頂替）。
- main.css 有一組 `.feature-carousel`/`.feature-card`/
  `.feature-vendor-chip` 樣式與對應的 `initFeatureCarousel()`/
  `initVendorSelect()`，但全站 grep 沒有任何頁面掛出 JS 找的
  `id="featureCarousel"` 掛載點——是死代碼，依鐵則 1 不搬移。

## v5 過程中新發現的問題（在 v4 的基礎上，新增/更新）

上面 v4 那節列的 6 個問題（含全站 Preflight 回歸、auth_seed 登入態
陷阱）在 v5 開工前就直接補進 theme.css/auth_seed.mjs 了，沒有重踩。
這次新踩到的是：

11. **區域覆寫變數（`--bg`/`--text` 等）vs 全域 `--color-*`
    token 搞混，範圍比 v4 的彈窗大很多**：v5 有 `.content-light`
    這種「套在 `<main>` 上、局部覆寫 `--bg`/`--bg-soft`/`--text`/
    `--line` 等變數值」的淺色主題機制，套用範圍橫跨 slot/live/
    hot-games/fish/sport/mini-games/promotion/about/ui-kit
    共 9 個頁面（不只 v4 那種侷限在小彈窗框裡的
    `.auth-modal-box`/`.cs-modal-box`/`.chat-widget`）。一開始比照
    v4 把 shell.css/pages/*.css 裡所有顏色用途都寫成
    `var(--color-xxx)`（`@theme` 的全域命名空間），這樣寫在語法上
    沒錯、預設情況下也能正確顯示（因為 `:root` 有
    `--xxx: var(--color-xxx)` 別名橋接），但 `--color-xxx` 是全域
    token、**不會**被 `.content-light` 的區域覆寫影響，只有原始
    main.css 用的 `--xxx`（純變數、會被區域覆寫）才會正確跟著換色。
    index.html 首頁截圖一度整頁 18% diff（`PREMIER ONLINE GAMBLING
    DESTINATION` 標題整段變成看不見的深色、hero-signup 輸入框
    標籤消失）才連回這裡。**修法／教訓**：component/page CSS 一律
    使用 main.css 原始的 `--xxx` 變數名，**不要**用 `--color-xxx`；
    只有 `theme.css` 的 `@theme` 區塊本身（`@theme` 語法強制要求
    `--color-*` 前綴才能生成 Tailwind utility）跟 `:root` 的別名
    橋接（`--xxx: var(--color-xxx)`）該用 `--color-xxx`，其餘任何
    手寫 CSS 規則都跟原始碼一樣用 `--xxx`。這樣預設情況透過別名正確
    解析、換膚時跟著變、又不會擋掉任何區域覆寫。**這是這次除錯耗
    最多力氣才找到的問題，v6 如果也有類似的區域換色機制，直接照這個
    原則寫，不要重踩一次。**
12. **手動合併「base 規則 + 斷點覆寫」成單一規則時，漏改其中一個
    被覆寫的屬性值**：`.acct-hero` 手機斷點把 `flex-direction`
    改成 `column`（直向堆疊）時，原始 `main.css` 同時也把 `gap`
    從 20px 改成 14px；手動合併成攤平後的單一規則時，只加了
    `flex-direction`/`text-align`，忘記把 `gap` 一併改成 14px，
    手機版卡片內距因此多了 12px（account.html Mobile 一度 9.6%
    diff，且高度不對）。**教訓**：手動合併 base+覆寫成單一規則時，
    要逐一核對覆寫區塊裡列出的**每一個**屬性都有對應改到，不能只改
    「看起來主要」的那幾個；比對完務必看 pixelmatch 的
    `orig height`/`new height` 是否完全相等，高度只要有落差幾 px
    就代表某個屬性沒改對。
13. **`Read` 工具的 `offset`+`limit` 分段讀取，剛好卡在檔案最後
    一行前漏讀**：抄錄 main.css UI Kit 那節（檔案最後一段）時，
    一次 `Read(offset=1159, limit=230)` 只讀到第 1388 行，檔案其實
    有 1389 行，最後一行 `.uikit-grid { ... }` 因此被漏抄。
    ui-kit.html 的 game-tile 展示卡沒有其他寬度來源、完全依賴
    `.uikit-grid` 的 `grid-template-columns` 撐出 grid track
    寬度，缺了這條規則後在 flex 版面退化成撐滿整行寬度（PC 一度
    64% diff、高度多了 1000px+）。**教訓**：用 `Read` 分段讀取
    main.css 這類長檔案時，讀到接近檔尾的最後一段，**務必額外確認
    這次讀取範圍有沒有精確涵蓋到檔案的最後一行**（例如讀完後檢查
    回傳內容的最後一行是否就是用 `wc -l` 量到的檔案總行數），不要
    假設「offset+limit 夠大」就一定涵蓋到底。

## v5 完成總表（22/22，PC／手機 pixelmatch，已含上述修正後回歸）

| 頁面 | PC | 手機 | 備註 |
|---|---|---|---|
| index.html | 0.018~0.051% | 0.024% | 互動：語系切換0.406%／漢堡選單0.014% |
| hot-games/slot/fish/mini-games/live.html | 0.074~0.138% | 0.156~0.197% | 6 個清單頁共用 listing.css；slot 收藏切換互動 0.134% |
| sport.html | 0.024% | 0.054% | |
| promotion.html | 0.000~0.058% | 0.015~0.022% | |
| account.html | 0.066~0.081% | 0.103% | 曾因手機斷點合併漏改 gap 一度 9.6%，已修正 |
| deposit.html | 0.062% | 0.000% | 互動：通道切換0.144%／金額選擇0.146% |
| withdrawal.html | 0.053% | 0.063% | 互動：帳戶管理tab 0.161% |
| betting/deposit/withdrawal-record、withdrawal-detail、account-record、profit-loss | 0.076~0.104% | 0.000~0.129% | 記錄家族 6 頁共用 member-shell.css，zero new CSS；betting-record 串關展開互動 0.146% |
| personal-info.html | 0.073% | 0.000% | |
| security.html | 0.066% | 0.129% | |
| change-password.html | 0.000% | 0.084% | zero new CSS |
| about.html | 0.000% | 0.000% | 互動：FAQ展開 0.146% |
| ui-kit.html | 0.059% | 0.046% | 曾因漏抄 .uikit-grid 一度 64%，已修正 |

全部數字遠低於雜訊上限，console 錯誤數量兩邊一致。

## v6 架構決策

跟 v4/v5 同構（桌機優先＋`max-width` 斷點，原始站台單一 `site/`），
但視覺／版面改版幅度是三個版本中最大的一次（「巔峰盤口 Apex」風格，
深邃墨綠 header/內容、亮綠主 CTA），連帶架構也變了：

- **拿掉 v4/v5 的每頁 `.member-sidebar`**，改成 `.v6-sidebar`——
  一個橫跨所有頁面（含首頁、清單頁）常駐的左側欄，取代原本「站內
  導覽」與「會員選單」兩套並存的設計。`.member-shell` 因此從
  v4/v5 的兩欄 grid（`220px minmax(0,1fr)`）改成單欄
  （`minmax(0,1fr)`），不再有自己的側欄。
- **拿掉 v4 的 `.quick-rail`／v5 的側邊快捷列**，改成單顆
  `.v6-chat-fab` 客服浮動鈕。
- 新增 `.v6-betslip`（右側佔位欄，純裝飾、`<=1320px` 隱藏）、
  `.v6-sidebar` 在 `<=1080px` 變成離屏抽屜（左滑入）、在
  `<=720px` 再變成貼底 bottom sheet（跟 `.mobile-tabbar` 共用同一
  斷點）。
- token 新增 `--header-h`（`.v6-shell` 橫跨滿版寬度常駐條的高度，
  sidebar/betslip 的 sticky 定位要扣掉這個高度）。
- 同樣有 `.feature-carousel`/`.feature-card`/`.feature-vendor-chip`
  死代碼（JS 找 `#featureCarousel` 掛載點，全站沒有任何頁面有），
  依鐵則 1 不搬移。
- `pages/index.css` 除了 hero 輪播控制項／快捷圖示格／跑馬燈資訊條／
  雙欄 hero／`.content-light`／促銷橫幅／`.jackpot-panel`／12 欄
  可編輯版位（`.grid12`）之外，main.css 裡在 `.grid12` 之後、
  `.promo-card`（優惠活動卡，屬於 promotion.css）之前還夾了一段
  「熱血開賭／得獎名單／品牌短文／玩家評價」（`.home-extra`／
  `.testimonial-card`／`.spotlight-block`），物理位置不連續、容易
  漏抄，見下方問題 15。

## v6 過程中新發現的問題（在 v4/v5 的基礎上，新增/更新）

前面 v4/v5 兩節列的問題（全站 Preflight 回歸、auth_seed 登入態、
`--color-*` vs `--xxx`、手動合併漏改屬性、`Read` 分段漏讀檔尾）在
v6 開工前就直接補進 theme.css/auth_seed.mjs 了，但 v6 又踩到幾個
**新的**、且更貴的坑：

14. **`auth_seed.mjs` 忘記幫新版本加一筆 `SEEDS` 設定**：`v4`/`v5`
    寫完後 `SEEDS` 物件只有這兩個 key，開始寫 v6 頁面轉換時完全忘記
    补上 `v6: { authKey: 'cms-v6-auth', ... }`。後果比 v4 當初發現
    時更隱蔽：因為所有 12 個會員限定頁（account/deposit/
    withdrawal/各類紀錄/personal-info/security/change-password）
    在未登入時會被 `initAuthGuard()` 導回 `index.html`，測試腳本量到
    的其實都是「index.html 對比 index.html」，而 index.html 本身當時
    **剛好也有另一個真的 bug**（問題 15），兩個問題的診斷結果混在
    一起、數字看起來完全不合理（12 個毫不相干的頁面全部卡在同一組
    5.6~7.2% diff、同一個「新版矮 72px」的高度落差），一度以為是
    v6-sidebar 或 mobile-tabbar 的系統性大 bug。**教訓**：每次新增
    一個版本，`auth_seed.mjs` 的 `SEEDS` 物件、`MEMBER_PAGES`
    清單是清單型設定，最容易漏加而不是漏改，寫完 `initAuthGuard`
    比對後第一件事就該去確認 `auth_seed.mjs` 有沒有對應的版本 key，
    不要等會員頁 diff 異常才回頭查。
15. **手機斷點「攤平」時，把 scope 在特定祖先底下的覆寫，錯寫成
    覆寫全域基礎規則**：main.css 檔尾 RESPONSIVE 區塊裡，
    `@media (max-width: 720px)` 內有兩條這樣的規則：
    `.header-auth .btn-accent { padding: 7px 10px; font-size: 11px; }`
    跟 `.header-auth .header-nav-link { padding: 6px 2px; font-size: 12px; }`
    ——這兩條**只**縮小 header 內登入/註冊捷徑鈕跟使用者導覽連結，
    不影響其餘用到 `.btn-accent`／`.header-nav-link` 的地方。手機版
    攤平時漏看了 `.header-auth` 這個 ancestor scope，直接把縮小後的
    `padding`/`font-size` 寫進 `.btn-accent`／`.header-nav-link`
    **全域基礎規則**，等於手機版全站所有用 `.btn-accent` 的地方
    （帳戶頁「DEPOSIT NOW」/「REQUEST WITHDRAWAL」、儲值/提款/改密碼
    表單送出鈕等）都被跟著縮小、变窄。窄到某些按鈕文字（如
    "REQUEST WITHDRAWAL"）從一行擠成兩行，卡片高度、以下所有內容
    整段往上位移，account/change-password/deposit/withdrawal 四頁
    手機版一度 4.8~7.2% diff。**教訓**：手機斷點攤平時，先確認
    要攤平的選擇器是「純 class」還是「`.祖先 .目標`」這種 scoped
    寫法——後者攤平後**必須保留祖先 scope**，不能直接改寫目標
    class 的全域基礎規則；改完用 `grep` 找一下這個 class 還有沒有
    在其他跟這次改動無關的地方被用到，數量異常多的話就要懷疑是不是
    誤傷了範圍。
16. **main.css 裡跟目標元件「物理位置不相鄰」的一段，整段漏抄**：
    首頁 `.grid12`（12 欄可編輯版位）結束後，main.css 先接了
    `.game-tile-fav`（屬於 cards.css，已收錄），再接一段沒有獨立
    章節標題、只有行內註解「首頁 grid12 之後新增的『熱血開賭／得獎
    名單／品牌短文／玩家評價』區塊」的 `.home-extra`／
    `.testimonial-card`／`.spotlight-block`，然後才進到有明確章節
    標題「── 優惠活動卡 ──」的 `.promo-card`（屬於 promotion.css）。
    比對 main.css 全部章節標題逐段抄錄 index.css 時，這段夾在兩個
    「看起來都不屬於首頁」的區塊中間、且本身沒有章節標題，直接被
    跳過。結果首頁「PREMIER ONLINE GAMBLING DESTINATION」品牌短文、
    「HEAR FROM OUR PLAYERS」玩家評價 rail、`.home-extra` 的
    直向排列間距全部使用瀏覽器預設樣式，index.html PC 一度 2.26%
    diff、手機 3.84% diff，且高度都差 35~72px。同一批遺漏也連帶
    讓 `.grid12 > [data-span]` 的 `@media(max-width:1080px)`「中寬度
    以下滿版堆疊」覆寫、`.hero-title`/`.hero-promo .hero-title em`
    的 720px／520px 縮小字級、`.notice-links` 的 520px 縮小間距
    一併漏攤平進手機版（這幾條物理位置在 main.css 檔尾 RESPONSIVE
    區塊，寫 index.css/shell.css 當下沒有意識到要回頭核對）。
    **教訓**：不能只憑「章節標題」切分抄錄範圍——main.css 有些
    小段落用行內註解取代章節標題、或直接接在無關章節中間；抄完
    一個 pages/*.css 後，額外跑一次「main.css 出現的所有 class
    名稱 vs 我寫的檔案是否都出現過」的機械式核對（可以寫小 script
    抓兩邊 `.class-name` 集合做差集），比單靠人工逐段閱讀更可靠，
    這次就是靠這個核對抓到 `.home-extra` 等一整段遺漏。

## v6 完成總表（22/22，PC／手機 pixelmatch，已含上述修正後回歸）

| 頁面 | PC | 手機 | 備註 |
|---|---|---|---|
| index.html | 0.160% | 0.124% | 曾因問題 14/15/16 三個 bug 疊加一度 2.26%/3.84%，已修正；殘留雜訊主要來自跑馬燈/廠商 marquee 動畫擷取時機；互動：漢堡側欄開啟 0.701% |
| hot-games/slot/fish/mini-games/live.html | 0.067~0.134% | 0.165~0.188% | 6 個清單頁共用 listing.css |
| sport.html | 0.025% | 0.054% | |
| promotion.html | 0.004% | 0.015% | |
| account.html | 0.090% | 0.000% | 曾因問題 14/15 疊加一度 6.3%，已修正 |
| deposit.html | 0.084% | 0.000% | 同上 |
| withdrawal.html | 0.070% | 0.059% | 同上 |
| change-password.html | 0.012% | 0.081% | 同上 |
| betting/deposit/withdrawal-record、withdrawal-detail、account-record、profit-loss | 0.079~0.114% | 0.000~0.078% | 記錄家族 6 頁共用 member-shell.css |
| personal-info.html | 0.112% | 0.088% | |
| security.html | 0.092% | 0.082% | |
| about.html | 0.014% | 0.000% | |
| ui-kit.html | 0.021% | 0.043% | |

全部數字遠低於雜訊上限，console 錯誤數量兩邊一致（僅環境層級的
外部資源連線失敗，orig/new 兩邊一致，非本次轉換引入）。

## 逐頁 SOP（沿用 v3 建立的方法論，適用所有版本）

1. `grep -oE 'class="[^"]*"' <頁面>.html | tr ' "' '\n\n' | sort -u`
   取得該頁實際用到的 class 清單。
2. 對照 main.css 對應章節的規則，**逐一核對每個 class 是否真的被該
   頁使用**——main.css 章節標題不完全精確（常有死代碼或其實是別頁在
   用），不要照單全收。也要檢查 `site.js`/`data.js` 有沒有動態插入的
   HTML/class（JS 字串拼接模板），這些不會出現在靜態 HTML 的 grep
   結果裡。
3. 檢查是否已經在 `shell.css`/`pages/index.css`/其他已完成頁面的
   CSS 裡有 100% 符合的 class——鐵則 1，複用優先，很可能「零新增
   CSS」。
4. 新增 `pc/pages/<page>.css` + `mobile/pages/<page>.css`（token 替換
   規則同上），在兩邊 `theme.css` 的 `@import` chain 加入（v1.5 沒有
   v3 那種 `ui-components.css` 排序問題，直接照順序加在
   `@import "./pages/index.css";` 後面即可）。
5. 用 `python3 tailwind/scripts/convert_page.py <src> <dst>` 轉換該頁
   HTML（PC＋mobile 各一次，來源都是同一份 `v1.5/site/<page>.html`）。
   **轉換完務必 `diff` 比對轉換前後的 `<body>` 內容逐字相同**（見上
   「convert_page.py 腳本本身的 bug」，這支腳本用字面 `</head>` 字串
   比對，遇到頁面把整份 HTML 當字串塞進 JS/iframe srcdoc 時可能誤判，
   目前已修正成只取代第一個，但養成習慣每頁都 diff 一次比較保險）。
6. `cd tailwind && npm run build`。
7. 啟動兩個測試伺服器（見下方「測試基建」），用
   `tailwind/scripts/pixelmatch_compare.mjs` 比對 PC＋手機，用 diff
   圖＋crop 工具定位問題（**遇到大範圍重影/整頁位移，先懷疑上面四個
   Preflight bug 的模式**，不要急著假設是別的問題）。
8. 互動測試：用 `tailwind/scripts/pixelmatch_interact.mjs` 對該頁
   按鈕/表單/彈窗/tab 等互動點做點擊比對，確認轉換版行為跟原始版
   一致、console 錯誤數一致（需要連續兩次點擊才能到達的狀態，例如
   「先切分頁再展開手風琴」，直接寫一支一次性的 Playwright 腳本，
   模式照抄 `pixelmatch_interact.mjs`）。
9. **順便重新驗證前面已完成的頁面沒有回歸**（尤其如果這次改到
   shell.css/theme.css 共用檔案）。
10. commit（繁體中文說明，動機為主）、push、更新 PR #4 的標題/內容
    （進度表＋pixelmatch 數字表格＋過程中發現的問題）。

## 測試基建

- 原始站台伺服器：`cd /home/user/cms_system_tailwind && python3 -m
  http.server 8901 --bind 127.0.0.1 &`
- 轉換版伺服器：`cd /home/user/cms_system_tailwind/tailwind &&
  python3 -m http.server 8902 --bind 127.0.0.1 &`
  （**新 session 一開始這兩個伺服器不會在跑，要自己啟動**；且經觀察
  這兩個 background process 有時候會在對話中途消失，重跑就好）
- 瀏覽器：Playwright + Chromium，執行檔路徑固定是
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`（跑 pixelmatch
  腳本時記得帶 `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` 環境變數，
  且不要跑 `playwright install`，執行檔已經在容器裡預裝好了）。
- pixelmatch 測試腳本**已經轉正進 repo**（這次 v1.5 收尾時把上一輪
  scratchpad 版本整理進來，之後 v4/v5/v6 直接用，不用重寫）：
  - `cd tailwind && npm install`（`pixelmatch`/`pngjs`/`playwright`
    已加進 `package.json` devDependencies）。
  - `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node
    scripts/pixelmatch_compare.mjs <version> <page-name> [width]`——
    PC+手機視覺比對，例如
    `node scripts/pixelmatch_compare.mjs v1.5 betting-record`；頁名
    可以帶查詢字串，例如
    `node scripts/pixelmatch_compare.mjs v1.5 "transaction-info.html?type=withdrawal&amount=50000"`。
  - `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node
    scripts/pixelmatch_interact.mjs <version> <page-name> <step-label>
    <selector> [width]`——點擊互動測試，例如
    `node scripts/pixelmatch_interact.mjs v1.5 deposit method-linepay '[data-dp-method-btn="linepay"]' 1440`。
  - 截圖/diff 圖輸出到 `tailwind/.pixelmatch-out/`（已加進
    `.gitignore`，不進版控）。
  - `scripts/auth_seed.mjs`：兩支 pixelmatch 腳本內部都會呼叫，若
    測試頁面在該版本的 `SEEDS[version].memberPages` 清單裡，會先
    寫入登入用的 localStorage，避免會員限定頁被 `initAuthGuard`
    導回首頁（見上「v4 過程中新發現的問題」第 8 點）。新版本如果有
    類似機制，在這支腳本的 `SEEDS` 物件裡加一個 entry 即可。
  - 腳本內部重點（沿用 v3 建立的寫法，繼續維持）：
    - `probe` 階段量 `document.body.scrollHeight` 之前，**務必先等
      `<img>` 全部 `complete`**，不然大圖片還沒載入完成時量到的高度
      不準，會誤判成假的視覺差異。
    - PC 固定 1440 寬比對 `<version>/site`；手機固定 390 寬，原始站台
      一樣連 `<version>/site`（同一份響應式 HTML 縮到 390 寬），轉換版
      連 `<version>/site-mobile`。
    - pixelmatch `threshold: 0.1`，可接受的雜訊上限參考 v3 已驗收頁面
      的最高紀錄（手機 3.6%）；v1.5 因為有跑馬燈 animation／即時時鐘／
      促銷彈窗 GIF 這類動態內容，雜訊基準可能到 5% 左右，見上面
      「v1.5 完成總表」逐頁數字。
    - 判斷「大範圍紅色 diff 是不是真 bug」的方法：先 crop 出可疑區域
      比對（比盯著整張 diff 圖猜有效率很多），或用
      `getBoundingClientRect()` 逐元素比對 orig/new 的 top/height，
      找出第一個開始出現偏移的元素。
    - 需要連續點擊兩個以上步驟才能重現的互動（例如「先切到 FAQ 分頁
      再展開手風琴」），`pixelmatch_interact.mjs` 只支援單一點擊，
      複製一份改成連續 `click` 即可，不用改動主腳本。

## 工具腳本（已進 repo，可直接用）

- `tailwind/scripts/convert_page.py`：HTML `<link>` 骨架轉換（見上，
  含 `</head>` 只取代第一個的修正）。
- `tailwind/scripts/pixelmatch_compare.mjs`／
  `tailwind/scripts/pixelmatch_interact.mjs`／
  `tailwind/scripts/auth_seed.mjs`：見上「測試基建」。
- `tailwind/scripts/publish.mjs`：build 產物搬到各版本 `site`/
  `site-mobile` 目錄（既有，不用動）。
- `tailwind/vite.config.js`：build entry 設定（v1.5 的 `v1_5-pc`/
  `v1_5-mobile` entry 已經在裡面，不用改，新版本要加時照抄格式）。

## v3 現況摘要（已完成，僅供參考）

23/23 頁全部完成，PC＋手機都做完，過程中發現並修正兩個影響已上線
頁面的全站級 bug（頭像 box-shadow 系列選擇器搬漏最後一批覆寫、
`.grid[hidden]` 在 Tailwind Preflight 下排版位移，跟這次 v1.5 發現的
問題是**同一類「Preflight vs 原始站台假設」衝突**，只是具體表現不同）。
詳見 PR #4 的完整說明與 git log。

## 其餘版本現況

- **v2**：Phase 1 token 已完成（見 `TOKENS.md`「v2」章節），Phase 3
  逐頁轉換尚未開始，是目前唯一還沒開始頁面轉換的版本。原本以為 v2
  的 CSS 是舊版 Tailwind 編譯輸出＋PrimeVue 殘留（非手寫）而故意排到
  最後，後來查證是誤判——那份判斷依據的 `app.css` 其實沒有被任何頁面
  載入，真正使用的 `main.css`＋`themes/*.css` 架構跟其他版本一樣乾淨。

## 環境須知

- 這個 repo（`cms_system_tailwind`）跟另一個 repo（`cms_system`，
  純手寫 HTML+CSS+JS 靜態站，**明確禁止 Tailwind 殘留**）是完全獨立
  的兩個專案，只是 CLAUDE.md 內容幾乎相同（因為 `cms_system_tailwind`
  本來就是從 `cms_system` fork 出來做 Tailwind 遷移實驗的）。新
  session 如果環境裡同時看得到兩個 repo，**先確認自己在哪個 repo
  工作**，不要弄混。
- GitHub MCP 工具的 repo 存取範圍預設可能只包含 `cms_system`，如果
  新 session 需要對 `cms_system_tailwind` 操作 PR/issue，記得先呼叫
  `add_repo`（owner: mootech-asia, repo: cms_system_tailwind, access:
  push）把它加進 session scope。本機 git clone 已經存在於
  `/home/user/cms_system_tailwind`，不需要重新 clone。
