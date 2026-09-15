# 設計 Token 清單（階段一）

範圍：`v1.5/site`、`v2/site`、`v3/site`+`v3/site-mobile`、`v4/site`、`v5/site`、
`v6/site` 的 CSS。`studio/` 不在這次掃描範圍內。

## 結構（鐵則 6：PC／手機各自獨立檔案）

```
tailwind/src/vN/pc/theme.css       # 桌機版 @theme + 換膚 + reset/hover CSS
tailwind/src/vN/mobile/theme.css   # 手機版，獨立宣告，不 import/引用 pc/ 那份
```
`vite.config.js` 的 rollup input 用 `vN-pc`／`vN-mobile` 當 entry key，
`scripts/publish.mjs` 依 key 拆到 `tailwind/vN/site/assets/css/tailwind.css`
（桌機）與 `tailwind/vN/site-mobile/assets/css/tailwind.css`（手機）——沿用
v3 原本 site/ 與 site-mobile/ 平行部署、CSS 互不相依的既有慣例。

**已完成並跑過 build 驗證**：v3、v4（各自 pc/mobile 共 4 份檔案）。
**尚未開始**：v5、v6（架構跟 v4 完全一樣，色票已抓好，見下方）、v1.5（從零建）。
**延後**：v2（原因見下方）。

## 4 個問題的決定（你已授權我按目標自行判斷，結果如下）

1. **`@theme` 命名空間對照表**：採用，已套用到 v3/v4（顏色 `--color-*`、
   圓角 `--radius-*`、陰影 `--shadow-*`、字級 `--text-*`；版面/元件尺寸
   如 `--sidebar-w`、`--header-h` 不放進 `@theme`，因為那些不是「設計系統
   刻度」，維持一般 CSS variable，用 Tailwind 的 `w-(--sidebar-w)` 語法取值）。
2. **v2 排最後**：v2 的 CSS 是舊 Tailwind 編譯輸出＋PrimeVue 殘留（非手寫），
   沒有語意化 token 可以直接搬，風險/工時都比其他版本高。決定：v3/v4/v5/v6/
   v1.5 做完、命名慣例跟轉換流程都成熟之後，最後再處理 v2，屆時能認出更多
   「這其實是哪個常見元件」的樣式，降低猜錯的風險。
3. **studio 專用的 10 組進階陰影變體**：延後到階段三，真的轉換到
   `section-variants.css` 對應的 studio 展示頁時再建——現在建是純粹的預先
   猜測，一般訪客頁面用不到，避免做白工。
4. **色彩語意命名**：由我按上下文推斷命名，不逐一列色票等你指認（v3/v4/v5/v6
   的顏色 token 名稱本來就已經語意化——`--accent`、`--badge`、`--line`
   這種——階段一的工作主要是套 `--color-` 前綴，不是重新命名；真正需要
   我推斷命名的只有 v1.5，等做到 v1.5 時你可以再挑錯）。

## v3（已完成，示範用）

`tailwind/src/v3/pc/theme.css`／`tailwind/src/v3/mobile/theme.css`。

結構 token 沿用 `design-system/tokens.css`：`--space-1~16`（4px 基準，
跟 Tailwind 原生 spacing scale剛好對齊，不需要在 `@theme` 裡重新定義）、
`--radius-xs/sm/control/card/…`、`--text-*`（原 `--type-*` 改名）。顏色 6 個
skin（blue／white／night-esports-green／cosmic-spectrum-purple／
curated-collection／jade-jackpot）逐字對照原 `skins/*.css`。

進階陰影 token 範例（你要的 color-mix 模式）：
```css
--shadow-control-active:
  0 0 0 3px color-mix(in oklch, var(--color-accent) 14%, transparent),
  0 0 16px color-mix(in oklch, var(--color-accent) 55%, transparent);
--shadow-badge-highlight: 0 0 6px color-mix(in oklch, var(--color-accent) 50%, transparent);
```

手機版：`site-mobile/assets/mobile.css` 目前沒有另外覆寫色彩/圓角/陰影，
`mobile/theme.css` 依鐵則 6 獨立宣告一份相同數值，另外新增 4 個手機專屬
結構常數（`--mobile-quicknav-icon`、`--mobile-header-gap` 等，來自
mobile.css 裡重複出現的尺寸）。

## v4（已完成，示範用）

`tailwind/src/v4/pc/theme.css`／`tailwind/src/v4/mobile/theme.css`。

v4 原本沒有字級 token（`main.css` 字級都是寫死 px），依重複頻率整理出一組
刻度 `--text-3xs`(10.5px) ~ `--text-2xl`(22px)，半 px 級距是原設計本來就有
的、不是誤差。新增一個之前沒被收進 token、但重複寫死 17 次的顏色：
`--color-ink-on-gold: #3a2604`（金色 CTA 上的深棕字）。

手機版：`main.css` 的 `@media (max-width:1080/720/520px)` 三段斷點內色彩
沒有另外覆寫，`mobile/theme.css` 依鐵則 6 獨立宣告一份相同顏色/圓角/陰影，
新增 5 個手機專屬結構常數（quick-rail 收窄尺寸、hero 高度/內距等，來自
斷點內重複出現的值）。

**待辦**：v4 的 `live.html` 試點頁（在 `main` 分支，命名法定案前做的）還在用
舊的 `--bg`／`--gold-hi` 這類變數名，跟現在 `--color-bg`／`--color-gold-hi`
的命名不一致，等階段三真的重做 v4 頁面時要一併同步，先記錄在這裡。

## v5／v6（架構相同，尚未寫成檔案，色票已備妥）

跟 v4 同一套架構（`--bg/-soft/-panel`、`--accent`系列、`--badge`、
`--jackpot-a/-b`、`--radius-lg/md/sm`、`--shadow-card`/`--shadow-accent`），
v5（烈焰賭場/橙色）、v6（巔峰盤口/綠色）各 6 個 skin 只換 `--accent`系列跟
`--jackpot-a/-b`，`--bg`/`--text`/`--line` 等深色骨架 6 個 skin 共用不變。
下一步比照 v4 直接建檔案。

## v1.5（尚未開始）

沒有既有 token，從重複值頻率反推：
- 圓角：`8px`(×33)、`10px`(×20)、`999px`(×16)、`16px`(×12)。
- 字級：`14px`(×52)、`12px`(×23)、`13px`(×14) 為主，對齊 Tailwind 內建
  `text-sm`(14px)/`text-xs`(12px)。
- 顏色：`#fff`(×93)、`#000`(×10)、`#e11d48`(強調紅，×4) 等，由我依上下文
  推斷語意命名（見上方問題 4 的決定）。

## v2（延後，原因見上方問題 2）
