# 設計 Token 清單（階段一草案，待確認命名後才進入階段二）

範圍：`v1.5/site`、`v2/site`、`v3/site`（`v3/site-mobile` 沿用同一份，不重複列）、
`v4/site`、`v5/site`、`v6/site` 的 CSS。`studio/` 是設計後台工具，不是交付的
前台頁面，這次沒有掃描；若需要也一併處理再說。

## 重要發現（會影響做法，需要你確認）

1. **v3／v4／v5／v6 其實已經有一套完整的手寫 token 系統**，透過 CSS variable
   （`:root` 結構 token ＋ `:root[data-skin="x"]` 換膚 token）運作，命名一致、
   換膚機制清楚。這幾版「階段一」的工作主要是把既有 token **原封不動搬進
   Tailwind 的 `@theme`**（改成 Tailwind 認得的命名空間前綴，例如
   `--bg` → `--color-bg`），而不是重新設計一套新命名。
   已經是 token 的值（例如 `var(--radius-lg)`）不算「重複出現的寫死值」，
   下面清單裡我只列「還沒被收進 token、但重複出現的寫死值」跟「進階寫法
   （color-mix 陰影等）需要新命名」的部分。

2. **v2 的 CSS 不是手寫的**。`v2/site/assets/css/app.css` 檔頭註解寫明是
   「合併自舊有 app.css + primevue.css + global.css 三檔」，內容含大量
   Tailwind v3 編譯輸出的內部變數（`--tw-translate-x`、`--tw-gradient-*`…）
   與 PrimeVue 的變數命名（`--p-content-border-radius`、
   `--p-form-field-border-radius`…）。這其實違反 CLAUDE.md「不得含 Tailwind
   編譯輸出／PrimeVue 殘留」的鐵則，但那是原 repo 既有狀態，不是這次造成的。
   **這對這次任務的影響**：v2 沒有語意化的既有 token 可以直接搬，階段一只能
   先從「畫面上重複出現的寫死數值」反推 token，且效度不如其他版本可靠
   （很多值可能是 PrimeVue 預設值的殘留，不一定是刻意設計）。要不要先把 v2
   排在最後、或用比較保守的方式處理，想聽你的意見。

3. v1.5 完全沒有 token 系統，全部寫死數值，階段一等於要從零建一套。

## 各版本 Token 草案

### v3（最完整，示範用）
結構 token 已有 `--space-1~16`（4px 基準）、`--radius-xs/sm/control/card/…`、
`--type-*`（字級）、`--weight-*`（字重）；Tailwind 對應：

| 原 token | 新 @theme 變數 | 生成的 utility |
|---|---|---|
| `--space-4: 16px` | `--spacing-4: 16px`（Tailwind 內建 `--spacing` 是單一倍數，v3 這套跟 Tailwind 預設剛好都是 4px 基準，可以直接對齊 Tailwind 原生 spacing scale，不用整套重新定義） | `p-4`／`gap-4`／... |
| `--radius-card: 12px` | `--radius-card: 12px` | `rounded-card` |
| `--type-section-title: 22px` | `--text-section-title: 22px` | `text-section-title` |
| `--weight-bold: 700` | `--font-weight-bold: 700`（跟 Tailwind 內建同名同值，可省略，直接用內建 `font-bold`） | `font-bold` |
| 各 skin 的 `--bg`／`--accent`… | `--color-bg`／`--color-accent`…（每個 skin 一份 `:root[data-skin="x"]` 覆寫，機制不變） | `bg-bg`／`text-accent`... |
| `--shadow-card`（已是 color-mix 進階寫法） | `--shadow-card`（原樣搬，Tailwind `--shadow-*` 命名空間本來就吃這個名字） | `shadow-card` |
| `--control-active-shadow`／`--badge-highlight-shadow` | 原樣搬（已是具名 token，示範了你要的模式） | `shadow-control-active`／`shadow-badge-highlight` |

### v4／v5／v6（同一套架構，各自換色）
既有 token：`--bg/-soft/-panel`、`--header-grad`或`--header-bg`、`--line/-hi`、
`--text/-mid/-dim/-on-header`、`--accent`系列（v4 叫 `--gold`，v5/v6 叫
`--accent`）、`--badge`、`--jackpot-a/-b`、`--radius-lg/md/sm`、
`--shadow-card`、`--shadow-gold`(v4)/`--shadow-accent`(v5/v6)。

**發現的重複寫死值（需要新 token）**：
- v4 的 `#3a2604`（CTA 按鈕上的深棕文字色，跟金色 CTA 搭配）在 `main.css`
  裡重複寫死 **17 次**，從沒被收進 `:root`。提議新增 `--color-ink-on-accent:
  #3a2604;`。
- `section-variants.css` 裡每版都有 10 組（v2~v10）「進階卡片陰影」變體，
  例如：
  ```
  --shadow-variant-3: 0 0 0 1px color-mix(in oklch, var(--color-red) 15%, transparent),
                      0 16px 30px color-mix(in oklch, var(--color-red) 12%, transparent);
  ```
  這組是 studio 的「版位視覺變體」展示用途（data-variant="v2"~"v10"），
  跟你範例的寫法完全同一種模式。是否要在階段一就收進 token，還是等階段三
  真的用到 section-variants 那幾頁時再處理？想先問你，因為這 10 組變體
  目前只有 studio 在切換展示，一般訪客瀏覽的頁面不會用到。

### v1.5（從零建）
沒有既有 token，從重複值反推：
- 圓角：`8px`(×33)、`10px`(×20)、`999px`(×16, 全圓角)、`16px`(×12) →
  提議 `--radius-sm/md/pill/lg`。
- 字級：`14px`(×52)、`12px`(×23)、`13px`(×14) 為主，符合 Tailwind 內建
  `text-sm`(14px，注意 Tailwind 預設 sm=14px≈0.875rem)/`text-xs`(12px)。
- 顏色：`#fff`(×93)、`#000`(×10)、`#e11d48`(強調紅，×4) 等，需要逐一確認
  語意命名（哪個是「品牌主色」、哪個只是「純白背景」）。
- 陰影多為一次性的（`0 25px 50px -12px rgba(0,0,0,.25)` 出現 3 次），可以
  收成 `--shadow-modal` 之類。

### v2（需要你先決定要不要照一般流程做）
可靠的重複值（排除疑似 PrimeVue/Tailwind 殘留的部分後）：
- 圓角：`0.5rem`(×34)、`10px`(×30)、`9999px`(×29, 全圓角)、`4px`(×20)。
- 陰影：`0 14px 34px rgb(var(--c-scrim) / .24)`(×6，已用 `--c-scrim` 這個
  自訂變數，不是 PrimeVue 的，可沿用) 等。
- 字重集中在 600/700/800，字級集中在 14/15/13px。

## 待你確認的問題
1. Tailwind `@theme` 命名空間對照表（上面 v3 那張表的模式）是否同意？
   同意的話會套用到其餘版本。
2. v2 要不要照一般流程做，還是先跳過、排到最後、或用不同做法？
3. section-variants.css 那 10 組 studio 專用的陰影變體，階段一要不要收
   進 token？
4. 各版本色彩 token 的語意命名（例如 v1.5 的 `#e11d48` 該叫
   `--color-danger` 還是 `--color-brand`）我需要逐一列出色票給你指認，
   還是我先按上下文猜一輪命名，你再挑錯的改？
