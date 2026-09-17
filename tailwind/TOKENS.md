# 設計 Token 清單（階段一，v1.5/v2/v3/v4/v5/v6 全部完成）

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

**已完成並跑過 `npm run build` 驗證**：v1.5、v2、v3、v4、v5、v6（各自
pc/mobile 共 12 份檔案）。

## 過程中發現並修正的 4 個真實 bug

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
4. **v3 token 層漏了一整層「語意/元件狀態」token，並且誤植了 skin 名稱**：
   階段三開始搬 `main.css`/`design-system/components.css` 的 CSS 時，
   逐字比對 v3 的 `design-system/tokens.css` + `skins/*.css` 十份原始檔
   才發現先前只搬了「原色調色盤」（`--bg`/`--accent`/`--line` 等約 21
   個變數），漏掉 `skins/*.css` 裡另一整層「語意/元件狀態」token
   （`--control-bg`、`--gradient-primary`、`--shadow-primary`、
   `--table-header-bg`、`--secondary-button-*`、`--focus-ring` 等，每個
   skin 約 50 個變數，main.css/components.css 大量直接引用）；同時
   `skins/curated-collection.css` 其實是 obsidian-copper／arctic-cyan／
   crimson-noir／midnight-gold／sage-atelier 這 5 個 skin 共用同一語意
   層的檔案，`data-skin` 屬性值裡完全沒有「curated-collection」這個
   名稱——先前誤把檔名當成 skin 名稱，做出一個永遠不會被套用的假
   skin，同時漏掉真正存在的 5 個 skin。修正做法見下方「v3」章節。
   v1.5/v4/v5/v6 逐一核對過，skin 檔案只覆寫十幾個變數（單層結構），
   沒有這個問題。

## 4 個問題的最終決定（已套用到全部 5 個版本）

1. **`@theme` 命名空間對照表**：採用，全部套用（顏色 `--color-*`、圓角
   `--radius-*`、陰影 `--shadow-*`、字級 `--text-*`；版面/元件尺寸如
   `--sidebar-w`、`--header-h` 不放進 `@theme`，維持一般 CSS variable，
   用 `w-(--sidebar-w)` 語法取值）。
2. **v2 排最後**（後來證實是誤判，見下方 v2 章節開頭的更正）：原本
   認為 v2 的 CSS 是舊 Tailwind 編譯輸出＋PrimeVue 殘留（非手寫），
   沒有語意化 token 可以直接搬，決定其餘版本命名慣例成熟後最後處理。
3. **studio 專用的 10 組進階陰影變體**：延後到階段三真的轉換
   `section-variants.css` 對應頁面時再建。
4. **色彩語意命名**：v3/v4/v5/v6/v1.5 的顏色原本就有語意化名稱，套
   `--color-` 前綴即可，不需要重新命名；v4 唯一新增的是先前漏收的
   `--color-ink-on-gold`（CTA 深棕字，main.css 裡寫死 17 次）。

## v3（完成，已依上方 bug 4 修正）

`tailwind/src/v3/{pc,mobile}/theme.css`。架構跟其他版本不同（見 bug 4）：
不是單純把每個變數改名成 Tailwind 命名空間，而是「原始 tokens.css +
skins/*.css 逐字搬移（變數名稱、數值都不改）＋ 另外新增一層 Tailwind
別名（`--color-*`/`--text-*`/`--shadow-*` 只用 `var(--原名)` 參照，
宣告一次、換膚自動連動，不必每個 skin 各寫一份）」。這樣階段三搬移
main.css/components.css 的 CSS 時可以完全不改動變數參照名稱，逐字
搬移即可，避免改名漏改造成視覺跑掉。

結構 token（`--type-*`/`--weight-*`/`--space-*`/`--radius-*` 等）逐字
沿用 `design-system/tokens.css` 原名；`--radius-*` 剛好已符合 Tailwind
命名慣例，直接在 `@theme` 定值一次即可。

顏色/陰影/元件狀態：v3 實際有 **10 組 skin**（不是先前誤記的 6 組）——
blue（預設）、white、night-esports-green、cosmic-spectrum-purple、
jade-jackpot 各自獨立一份完整語意層；obsidian-copper／arctic-cyan／
crimson-noir／midnight-gold／sage-atelier 這 5 組共用同一語意層
（對照原檔 `skins/curated-collection.css` 的 `:is()` 選擇器結構），
個別只提供調色盤。全部 10 組逐字核對 `skins/*.css` 原始檔重建，不再
依賴頻率分析猜測。

進階陰影 token（你要的 color-mix 模式，原名 `--control-active-shadow`/
`--badge-highlight-shadow`，`@theme` 裡建立 `--shadow-control-active`/
`--shadow-badge-highlight` 別名）：
```css
--control-active-shadow:
  0 0 0 3px color-mix(in oklch, var(--accent) 14%, transparent),
  0 0 16px color-mix(in oklch, var(--accent) 55%, transparent),
  0 0 20px color-mix(in oklch, var(--accent) 18%, transparent) inset;
--badge-highlight-shadow: 0 0 6px color-mix(in oklch, var(--accent) 50%, transparent);
```

手機版：`site-mobile/` 的 `<link>` 直接指向 `../site/assets/css/skins/*.css`
（跟桌機共用同一批 skin 原始檔），色彩/圓角/陰影數值完全相同，依鐵則 6
仍在 `mobile/theme.css` 獨立宣告一份相同內容，另外新增 4 個手機專屬結構
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

## v2（完成——原本「延後」的前提是誤判，更正如下）

**先前判斷「v2 是舊 Tailwind 編譯輸出＋PrimeVue 殘留、非手寫」是誤判，
根源是只看了 `v2/site/assets/css/app.css`（6056 行、內含大量
`--tw-*` 內部變數與 PrimeVue class 的合併檔）就下的結論，沒有先確認
這個檔案有沒有真的被任何頁面載入。全站 22 個 HTML 逐一 grep 後確認
`app.css` 從未被任何 `<link>` 引用——是一份完全沒有消費者的死檔案。**
實際載入、逐頁使用的是 `v2/site/assets/css/main.css`（2789 行，
`*, ::after, ::before` 開頭那段是 Tailwind v3 風格的 preflight reset，
但component 規則本身是手寫的語意化 class，如 `.site-header`／
`.sidebar-nav`／`.btn-primary`／`.seg-btn`）+ `v2/site/themes/win100.css`
（R3 標註的「全站視覺參數唯一來源」，人類可讀、有分類註解的
`:root` token）+ 5 個換皮檔（`aurora`/`cosmic-pink`/`fashion-blue`/
`noir`/`rose-graphite`，各自 `:root[data-theme='x']` 覆寫層），架構
乾淨程度其實跟 v1.5/v3/v4/v5/v6 沒有差別，只是色彩存值慣例不同（見
下方）。`app.css`／PrimeVue 相關內容 Phase 1/3 全部不搬移，依鐵則 1
（CSS 復用優先、禁止搬移死代碼）處理。

### 色彩存值慣例（v2 特有，其餘版本沒有這個模式）

win100.css 開頭原始註解就講明：色彩一律存成「R G B」三個十進位數字
（不是 hex／不是完整 `rgb()` 字串），因為原本的 `tailwind.config.ts`
用 `rgb(var(--c-x) / <alpha-value>)` 包起來，這樣 `bg-primary/10`、
`border-primary/25` 這類透明度寫法才能在建置期正確套用——main.css
全站沿用同一招，所有顏色屬性都寫成 `rgb(var(--c-x) / 1)`。這個
repo 依「component/page CSS 逐字搬移，不改變數參照名稱」的鐵律，
**逐字保留這個存值慣例**：`--c-primary: 152 231 210;` 原封不動抄進
`theme.css` 的 `:root`，之後 Phase 3 搬 main.css 進 pages/*.css 時
`rgb(var(--c-x) / 1)` 這種寫法完全不用改。`--color-*` 別名（給
Tailwind utility 命名空間、之後才可能用到 `bg-primary` 這類 utility）
用 `rgb(var(--c-x))` 包一層即可，Tailwind v4 對任何合法 CSS 色彩值
都能用 `color-mix()` 處理透明度修飾符，不需要沿用舊的 slash-alpha
寫法。

### 死碼/未使用 token 判定

比對 `main.css` 全部 `var(--x)` 引用與 `win100.css` 定義的 63 個
變數，只有 39 個被實際使用；未使用的 24 個裡，21 個是專門給
`nuxt.config.ts` 的 PrimeVue preset 讀的色彩 ramp（`--c-primary-50~950`
扣掉被用到的例外、`--c-surface-0~900` 扣掉被用到的例外），原始
註解也明講「PrimeVue ramp...與 nuxt.config.ts Win100 preset 一併
調整」——這是給一個這個靜態站完全不存在的 Vue/PrimeVue 建置管線用
的，不是這個 repo 的消費者。**決定**：這些 ramp 值仍然逐字保留在
`:root`／`:root[data-theme=...]`（維持「單一視覺參數來源」原始檔的
完整性，成本也只是幾個惰性 custom property），但**不**進 `@theme`
別名層，避免產生一批`bg-primary-50`~`bg-primary-950` 這種永遠用不到
的 utility class。例外：`--c-surface-600`／`--c-surface-700`／
`--c-surface-950` 這三個 ramp 值 main.css 有直接引用（特定面板色階），
照樣進 `@theme` 別名層。`--ls-tight`／`--ls-numeric`／`--shadow-mint`
main.css 也沒有引用，同樣只留在 `:root` 不進 `@theme`。

### 結構常數（PC/手機各自收斂，鐵則 6）

跟其他版本一樣，`--header-h`／`--sidebar-w` 這類版面尺寸不放進
`@theme`（維持一般 CSS variable，用 `w-(--sidebar-w)` 語法取值）。
v2 目前找到的裝置差異只有一組：`.sidebar-nav`（常駐側欄，
`min-width:768px` 才 `display:block`）寬度跟 `.main-content` 的
`margin-left` 都是同一個 `16rem`，抽成 `--sidebar-w`，收在 pc/theme.css；
`.mobile-bottom-nav-grid`（底部導覽列，`min-width:768px` 隱藏，跟側欄
二擇一互斥顯示）的 `height: 4rem`，抽成 `--mobile-nav-h`，收在
mobile/theme.css。header 本身高度是寫死的 `4rem`，桌機/手機同值、
沒有另外覆寫，不需要收 token；其餘頁面級 mobile/desktop 差異留到
Phase 3 逐頁轉換時再各自發現、各自收（跟 v1.5 當初的決定一致）。
**這一步順帶讓 pc/mobile 兩份 theme.css 的編譯輸出不再逐 byte 相同
——完全相同的兩份 CSS entry 內容，Vite 會被去重成一個實體檔案，
`vite.config.js` 裡兩個 entry key 只會產生一個 dist 檔案，
`publish.mjs` 就會少複製一份，造成 `site-mobile/` 建置後缺 CSS。
每個版本的 pc/mobile theme.css 開工時就該先確認兩邊有沒有至少一個
真的不同的 token，不要假設「目前還沒發現差異」就可以讓兩份檔案內容
完全一致。**

### Tailwind 別名層小結

顏色：`--color-primary`／`-soft`／`-faint`／`on-primary`／`accent`／
`bg`／`surface`／`surface-2`／`border`／`border-soft`／`text`／
`text-2`／`text-3`／`text-4`／`danger`／`scrim`／`success`／`gold`／
`card-face-1~3`／`card-border`／`surface-600`／`surface-700`／
`surface-950`，共 25 個，逐字比對 main.css 使用情形後精確收錄
（見上方死碼判定）。

字級/字距/行高：main.css 的 `--fs-*`／`--ls-*`／`--lh-*` 命名不符合
Tailwind 的 `--text-*`／`--tracking-*`／`--leading-*` 命名空間，
比照顏色 token 的作法加一層別名（`--text-display: var(--fs-display)`
等），原始 `--fs-*` 名稱維持不變、main.css 逐字搬移時不用改。
`--radius-ui` 剛好已符合 Tailwind `--radius-*` 命名慣例，直接在
`@theme static` 定值一次即可，不需要分兩層。

### 換皮機制

跟 v3 同構：`:root`（win100，預設）+ `:root[data-theme='x']`
（5 組覆寫層，attribute selector 優先權更高會蓋掉 `:root` 的值），
`<html data-theme="...">` 切換屬性即可整站換皮。5 組覆寫層只重寫
顏色/漸層相關的 21 個變數（不含 `--c-card-face-*`／`--c-card-border`
這組「全站唯一保留、刻意不隨皮膚變動」的銀行卡例外），字級/字距/
行高/圓角完全沿用 win100 的值，逐字核對 5 份原始 `themes/*.css`
重建，變數名稱、數值都不改。
