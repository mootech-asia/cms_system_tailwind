# 設計 Token 清單（階段一，完成 v1.5/v3/v4/v5/v6，v2 延後）

範圍：`v1.5/site`、`v2/site`、`v3/site`+`v3/site-mobile`、`v4/site`、`v5/site`、
`v6/site` 的 CSS。`studio/` 不在這次掃描範圍內。

## 結構（鐵則 6：PC／手機各自獨立檔案）

```
tailwind/src/vN/pc/theme.css       # 桌機版 @theme + 換膚 + reset/hover CSS
tailwind/src/vN/mobile/theme.css   # 手機版，獨立宣告，不 import/引用 pc/ 那份
```
`vite.config.js` 的 rollup input 用 `vN-pc`／`vN-mobile` 當 entry key（v1.5
因為檔名不能有 `.`，entry key 用 `v1_5-pc`/`v1_5-mobile`，`publish.mjs`
會轉回 `v1.5` 資料夾名），分別輸出到 `tailwind/vN/site/assets/css/
tailwind.css`（桌機）與 `tailwind/vN/site-mobile/assets/css/tailwind.css`
（手機）——沿用 v3 原本 site/ 與 site-mobile/ 平行部署的既有慣例。

**已完成並跑過 `npm run build` 驗證**：v1.5、v3、v4、v5、v6（各自 pc/mobile
共 10 份檔案）。
**延後**：v2（原因見下方）。

## 過程中發現並修正的 3 個真實 bug

1. **CSS 註解裡的字面 `*/` 會提早關閉註解**：寫技術註解時提到
   「`bg-*/text-*`」這種寫法，CSS 語法把中間的 `*/` 當成註解結束符號，
   導致後面一大段文字被誤判成 CSS 語法、整份檔案解析錯亂。已修正全部
   出現處，往後新增註解要避免連續打出 `*/`。
2. **Tailwind v4 的 `@theme` 預設會被 tree-shaking**：如果沒有任何頁面
   實際用到某個 token 對應的 utility class（例如 `bg-navy`），Tailwind
   build 時會直接把這個 token 從輸出的 CSS 裡刪掉——階段一這個時間點
   還沒有任何頁面用到這些 class，會整批消失。改用 `@theme static { ... }`
   （Tailwind v4 的語法，強制保留所有宣告，不管有沒有頁面用到）解決，
   全部 10 份檔案都已套用。utility class 本身（`.text-danger` 這種）
   仍然是等真的有頁面用到才會生成，這是正常、預期的行為，不影響 token
   本身的完整性。
3. **v1.5「完全沒有 token 系統」是我先前的誤判**：只做了字串頻率統計，
   沒有真的去看 `main.css` 開頭——v1.5 其實有一份完整、語意化的 `:root`
   token（`--c-navy`、`--c-pink`、`--c-danger` 這種，命名已經很清楚），
   跟 v3~v6 一樣是「搬遷改命名空間」而不是「從零命名」，比原本以為的
   簡單很多，這裡更正。

## 4 個問題的最終決定（已套用到全部 5 個版本）

1. **`@theme` 命名空間對照表**：採用，全部套用（顏色 `--color-*`、圓角
   `--radius-*`、陰影 `--shadow-*`、字級 `--text-*`；版面/元件尺寸如
   `--sidebar-w`、`--header-h` 不放進 `@theme`，維持一般 CSS variable，
   用 `w-(--sidebar-w)` 語法取值）。
2. **v2 排最後**：v2 的 CSS 是舊 Tailwind 編譯輸出＋PrimeVue 殘留（非
   手寫），沒有語意化 token 可以直接搬。決定：其餘版本命名慣例成熟後
   最後處理。
3. **studio 專用的 10 組進階陰影變體**：延後到階段三真的轉換
   `section-variants.css` 對應頁面時再建。
4. **色彩語意命名**：v3/v4/v5/v6/v1.5 的顏色原本就有語意化名稱，套
   `--color-` 前綴即可，不需要重新命名；v4 唯一新增的是先前漏收的
   `--color-ink-on-gold`（CTA 深棕字，main.css 裡寫死 17 次）。

## v3（完成，示範用）

`tailwind/src/v3/{pc,mobile}/theme.css`。結構 token 沿用
`design-system/tokens.css`：`--space-1~16`（4px 基準，跟 Tailwind 原生
spacing scale 對齊，不重新定義）、`--radius-xs/sm/control/card/…`、
`--text-*`（原 `--type-*` 改名）。顏色 6 個 skin 逐字對照原 `skins/*.css`。

進階陰影 token（你要的 color-mix 模式）：
```css
--shadow-control-active:
  0 0 0 3px color-mix(in oklch, var(--color-accent) 14%, transparent),
  0 0 16px color-mix(in oklch, var(--color-accent) 55%, transparent);
--shadow-badge-highlight: 0 0 6px color-mix(in oklch, var(--color-accent) 50%, transparent);
```

手機版：`site-mobile/assets/mobile.css` 沒有另外覆寫色彩/圓角/陰影，
`mobile/theme.css` 依鐵則 6 獨立宣告一份相同數值，新增 4 個手機專屬結構
常數（`--mobile-quicknav-icon`、`--mobile-header-gap` 等）。

## v4（完成，示範用）

`tailwind/src/v4/{pc,mobile}/theme.css`。原本沒有字級 token（字級都寫死
px），依重複頻率整理出刻度 `--text-3xs`(10.5px) ~ `--text-2xl`(22px)。
新增 `--color-ink-on-gold: #3a2604`（金色 CTA 深棕字，原本寫死 17 次）。

手機版：`main.css` 的 `@media (max-width:1080/720/520px)` 三段斷點色彩
沒有另外覆寫，獨立宣告一份相同顏色/圓角/陰影，新增 5 個手機專屬結構常數
（quick-rail 收窄尺寸、hero 高度/內距等）。

**待辦**：v4 的 `live.html` 試點頁（`main` 分支，命名法定案前做的）還在用
舊的 `--bg`／`--gold-hi` 變數名，跟現在 `--color-bg`／`--color-gold-hi`
不一致，階段三重做 v4 頁面時一併同步。

## v5／v6（完成）

`tailwind/src/v5/{pc,mobile}/theme.css`、`tailwind/src/v6/{pc,mobile}/
theme.css`。跟 v4 同一套架構（`--bg/-soft/-panel`、`--accent`系列、
`--badge`、`--jackpot-a/-b`），字級刻度沿用 v4 已建好的同一組命名（分佈
相近，不重複發明）。v5（烈焰賭場/橙色）、v6（巔峰盤口/綠色）各 6 個 skin
只換 `--accent`系列跟 `--jackpot-a/-b`，深色骨架全 skin 共用不變，6 個
skin 色票在 v5/v6 之間逐字相同。v6 比 v4/v5 多一個 `--header-h: 62px`
（`.v6-shell` 橫跨滿版寬度常駐條的高度，sidebar/betslip 定位要用到）。

## v1.5（完成）

`tailwind/src/v1.5/{pc,mobile}/theme.css`。**沒有 skin 換膚機制**（單一
品牌色，跟 v2~v6 不同）。原本就有完整 `:root` token，逐字沿用只改命名
空間：`--c-navy(-2/-soft/-active)`、`--c-pink(-hover)`、`--c-orange`、
`--c-danger`、`--c-gold`、`--c-border(-soft)` 等全部保留語意，改成
`--color-*` 前綴。

v1.5 是 **mobile-first** 寫法（base 規則本來就是手機版，用
`@media(min-width:1280px)` 加桌機覆寫，跟 v3~v6 的 desktop-first相反）——
唯一目前確認的裝置差異值是 header 高度：手機 `--header-h: 64px`、桌機
`--header-h: 132px`，兩邊各自宣告在對應的 theme.css 裡。其餘頁面級的
mobile/desktop 差異等階段三逐頁轉換時再各自發現、各自收 token，不在這
階段先猜。

## v2（延後，原因見上方問題 2）
