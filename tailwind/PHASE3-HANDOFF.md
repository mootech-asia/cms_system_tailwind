# Phase 3 交接文件（v1.5 進行中）

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
- 最新 commit：`928b599`（v1.5 建殼層＋完成 index.html）

## 五階段總進度

| 階段 | 狀態 |
|---|---|
| Phase 1（設計 token） | v1.5/v3/v4/v5/v6 已完成；v2 延後（PR #1，未合併） |
| Phase 2（斷點策略） | 已定案（PR #3，未合併） |
| Phase 3（逐頁轉換） | v3：**23/23 完成**；v1.5：**1/21**（index.html）；v4/v5/v6：0/22；v2：0（卡在自己的 Phase 1） |
| Phase 4（`@apply`/格式檢查） | 未開始 |
| Phase 5（`MIGRATION.md`） | 未開始 |

**下一步就是繼續 v1.5 剩下的 20 頁**，見下方「v1.5 下一步」。

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
  原本還有 `.banner-dots`/`.banner-dot`（實際只有 `promotion-list.html`
  用）、`.game-type-section`/`.game-type-grid`/`.game-type-item`、
  `.home-promotion`/`.home-promotion-grid`/`.home-promotion-card`
  （全站 grep 沒有任何 HTML 使用，main.css 裡的死代碼）——依鐵則 1
  沒有搬移，避免檔案累贅。
- `tailwind/src/v1.5/{pc,mobile}/theme.css`：接上 `@import "./shell.css"`
  + `@import "./pages/index.css"`，並且在 `@layer base` 補了三個
  修正（見下方「兩個影響全站的 bug」）。
- **21 頁 HTML 全部完成 `<link>` 骨架轉換**（`tailwind/v1.5/site/*.html`
  + `tailwind/v1.5/site-mobile/*.html` 各 21 份，用
  `tailwind/scripts/convert_page.py` 轉換——這支腳本這次已經搬進
  repo 永久保留，見下方「工具腳本」）。只有 `index.html` 真正建好
  對應 CSS 並通過 pixelmatch/互動測試驗收，其餘 20 頁目前只有
  shell.css 覆蓋的共用元件會正確顯示，頁面專屬內容還沒有樣式。
- `assets/`（images/fonts/js）已經完整複製進
  `tailwind/v1.5/site/assets/` 與 `tailwind/v1.5/site-mobile/assets/`
  （來源就是 `v1.5/site/assets/`，兩邊 byte-identical），
  `assets/css/main.css` 舊檔已刪除（不再需要，只留 build 產物
  `assets/css/tailwind.css`）。

## 兩個影響全站（不只 v1.5）的 Preflight 回歸 bug（已修正，务必了解）

這兩個 bug 是這次除錯花最多力氣才找到的，之後做 v4/v5/v6 時如果遇到
「截圖整頁高度對不上」、「文字位置差幾 px 但看起來莫名其妙」，**先
懷疑這兩個模式**：

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

3. （較小、v1.5 專屬）`html[lang='en'] body` 少了原始碼裡「英文介面
   不用韓文 Nanum Gothic fallback」的覆寫規則，已在 shell.css 補上
   `html[lang='en'] body { font-family: 'Pretendard', Arial,
   Helvetica, sans-serif; }`（`--font-display` token 本身維持含
   Nanum Gothic 的完整 fallback 鏈給非英文語系用，不改 token 本身，
   只加例外覆寫）。

**如果之後在 v4/v5/v6（也是手寫 CSS、沒有全站 reset 的站台）發現
類似「整頁高度對不上」的情況，直接檢查是不是同一類 margin/line-height
問題**，不用從頭排查。

## v1.5 下一步：main.css 章節與 21 頁的對照表

main.css 每個章節都有清楚的分節註解，直接對應頁面（跟组件，不是嚴格
一一對應，處理時務必先用 `grep -oE 'class="[^"]*"'` 核對該頁實際用到
哪些 class，再決定要不要搬、要不要當死代碼跳過——**index.html 就發現
了三組死代碼**，其他頁大概率也有）：

| main.css 行號 | 章節 | 對應頁面 |
|---|---|---|
| 889-1507 | 首頁 Banner | `index.html`（**已完成**） |
| 1761-2094 | 帳戶總覽 | `account.html` |
| 2165-2477 | 儲值頁 | `deposit.html` |
| 2478-2660 | 提款頁 | `withdrawal.html` |
| 2661-2770 | 轉帳明細 | `transaction-info.html` |
| 2771-3008 | **會員中心紀錄類頁面共用**（原文：bettingRecord/depositRecord/withdrawalRecord/withdrawalDetail/accountsRecord/profitAndLoss 共用） | `betting-record.html`、`deposit-record.html`、`withdrawal-record.html`、`withdrawal-detail.html`、`account-record.html`、`profit-loss.html`（**6 頁共用一份 CSS，很可能複數頁是零/少量新增，比照 v3 的「零新增 CSS」模式優先驗證**） |
| 3157-3237 | 個人資料 | `personal-info.html` |
| 3238-3323 | 安全中心 | `security.html` |
| 3324-3371 | 密碼變更 | `change-password.html` |
| 3372-3557 | 結帳/銀行資料 | `banking-details.html` |
| 3623-3748 | about.html | `about.html` |
| 3749-3847 | GameFilter（共用） | `game-type.html`／`game-list.html` 共用 |
| 3848-3989 | 遊戲/廠商卡片 | `game-type.html`／`game-list.html` |
| 3990-4092 | promotion-list.html | `promotion-list.html`（**`.banner-dots`/`.banner-dot` 要搬來這裡**，index.html 沒用到但這頁會用到） |
| 4093-4127 | promotion-detail.html | `promotion-detail.html` |
| 4128-4159 | sports.html（第三方遊戲開啟橋接頁，內容應該很少） | `sports.html` |

建議下一頁從 `account.html` 或 `betting-record.html`（記錄家族 6 頁
一次核對完，效率最高）開始。

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
6. `cd tailwind && npm run build`。
7. 啟動兩個測試伺服器（見下方「測試基建」），pixelmatch 比對 PC＋
   手機，用 diff 圖＋crop 工具定位問題（**遇到大範圍重影/整頁位移，
   先懷疑上面兩個 Preflight bug 的模式**，不要急著假設是別的問題）。
8. 互動測試（該頁按鈕/表單/彈窗/tab 等所有互動點，比對原始版跟
   轉換版行為一致、console 錯誤數一致）。
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
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
- pixelmatch 測試腳本模式（沿用 v3 建立的寫法，這次 v1.5 用的版本在
  `/tmp/claude-0/.../scratchpad/shot_v15_index.mjs`——**這個路徑是
  上一個 session 的 scratchpad，新 session 不會有**，需要重新寫一份
  類似的腳本，重點：
  - `probe` 階段量 `document.body.scrollHeight` 之前，**務必先等
    `<img>` 全部 `complete`**（`Promise.all(imgs.map(img =>
    img.complete ? ... : new Promise(res => img.onload = img.onerror
    = res)))`），不然大圖片還沒載入完成時量到的高度不準，會誤判成
    假的視覺差異（這次真的踩到這個坑，浪費不少時間排查）。
  - 兩個 case：PC（`http://localhost:8901/v1.5/site/<page>` vs
    `http://localhost:8902/v1.5/site/<page>`，1440 寬）、手機
    （`http://localhost:8901/v1.5/site/<page>` **同一份原始響應式
    HTML** 縮到 390 寬 vs `http://localhost:8902/v1.5/site-mobile/<page>`
    ，390 寬）。
  - pixelmatch `threshold: 0.1`，可接受的雜訊上限參考 v3 已驗收頁面
    的最高紀錄（手機 3.6%），v1.5 因為有跑馬燈 animation／即時時鐘／
    促銷彈窗圖片這類動態內容，雜訊基準可能略高（這次 index.html 手機
    4.776% 判定為可接受，因為 crop 比對後確認差異只在圖片次像素雜訊
    跟 animation 時序，不是結構性問題）。
  - 判斷「大範圍紅色 diff 是不是真 bug」的方法：先用
    `getBoundingClientRect()` 逐元素比對 orig/new 的 top/height，
    找出第一個開始出現偏移的元素，通常比盯著 diff 圖片猜有效率
    很多。

## 工具腳本（已進 repo，可直接用）

- `tailwind/scripts/convert_page.py`：HTML `<link>` 骨架轉換（見上）。
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

- **v4**：`tailwind/v4/site/live.html` 是很早期（命名法定案前）的
  試點頁，用了舊的 `--bg`/`--gold-hi` 變數名，跟現在的
  `--color-bg`/`--color-gold-hi` 不一致，之後真正開始 v4 的 Phase 3
  時要重做這頁，不能當作已完成。
- **v5/v6**：完全沒開始 Phase 3。
- **v2**：CSS 是舊版 Tailwind 編譯輸出＋PrimeVue 殘留（非手寫），
  沒有語意化 token 可以直接搬，需要先做自己的 Phase 1 token 工作，
  故意留到最後處理。

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
