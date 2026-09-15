# cms_system — 工作守則

## 專案定位
本 repo 是 `mootech-asia/cms_system` 的獨立複本，用來把 v1.5~v6 的視覺原型
重新編譯成 Tailwind CSS v4 架構，交接給工程師維護，不是重新設計。repo 根目錄
的 `v1.5/`～`v6/`、`index.html` 等是複製當下的完整快照，做為轉換對照基準，
**不得修改或刪除**；`tailwind/` 資料夾是本次轉換工程的新專案（Vite +
`@tailwindcss/vite`，設定透過 CSS 內 `@theme` 完成，不用 `tailwind.config.js`，
不需要 PostCSS/autoprefixer）。

**鐵則例外（推翻原本「不得含 Tailwind 編譯輸出」的限制）**：這條規則原本是
給 `v1.5/`～`v6/` 這種免建置純手寫 CSS 站用的，對 `tailwind/` 資料夾**不適用
——`tailwind/` 下容許、且預期會有 Tailwind 編譯輸出（`vN/site/assets/css/
tailwind.css` 等 build 產物）**。`v1.5/`～`v6/` 本身仍然維持原本定位不變，
不得在那幾個資料夾內新增任何框架殘留；只有 `tailwind/` 底下不受此限。

## 目錄結構
```
cms_system/
├── index.html          # 統一首頁：四個入口（v2/v3 各自的前台 + 設計後台）
├── v2/
│   ├── site/            # 前台
│   └── studio/           # 設計後台（iframe 預覽 ../site/，localStorage 同步換膚）
└── v3/
    ├── site/
    └── studio/
```
`site/` 與 `studio/` 是同層級的獨立資料夾；設計後台透過相對路徑跨資料夾讀取
`../site/assets/...`、`../site/themes/...`，iframe 指向 `../site/index.html`。
localStorage 為同源同步（不受資料夾路徑影響），改動路徑時務必同步檢查 studio
內的 `<link>`／`<script>`／iframe `src`。

## 鐵則（必守，不得因後續任務忘記而破例）

1. **CSS 復用優先**：新增內容前一律先檢查既有 CSS 樣式庫（`site/assets/css/`
   下的 token／共用元件 class）是否已有可套用的定義；只有確認找不到才能新增
   新樣式。禁止為了省事另外疊加等價樣式，避免檔案累贅。

2. **禁止分派 subagent**：本 repo 所有調查、批次修改、逐頁驗證、e2e、截圖比對
   等工作一律由主對話親自執行，**不得分派給 subagent**，除非使用者在該次對話
   中明確表示要使用 subagent。

3. **禁止業主要求類敘述型註解**：程式碼註解只寫技術上必要的說明（隱藏的限制、
   不明顯的行為、bug 的因應方式），禁止寫入「業主要求」「業主指示」「業主
   2026-xx-xx」之類的敘述型/歷程型註解。這類資訊屬於 commit message 或對話
   紀錄，不進原始碼。

4. **手機/桌機共用同一套 CSS，禁止改手機順手改壞桌機**：每個版本 `site/` 的
   手機版與桌機版是同一套 CSS（靠 `@media` 斷點切版，沒有獨立 mobile.css）
   ——這是指 `site/` 自己內部的 RWD 斷點，跟 v3 另外獨立部署的
   `v3/site-mobile/`（有自己的 CSS 拷貝）是兩回事，不要混淆。改動前務必：
   - 動手改之前，先 grep 該 class 目前有幾處規則（基礎規則 vs. 既有 `@media`
     覆寫），確認自己要動的是共用層還是手機專屬層。
   - 手機專屬的樣式一律包進對應的 `@media (max-width: 768px)` 區塊內，禁止
     直接修改沒有被 media query 包住的基礎規則——基礎規則是桌機/手機共用的
     底，改了就是兩邊一起變。
   - 禁止為了手機微調去改 `tokens.css` 的全域變數值（該檔案零 media query，
     改了必定桌機同步受影響）。要做手機專屬效果，新增手機 media query 內的
     覆寫，不動 token 本身。
   - 涉及整體版面架構（側邊欄收合、底部導覽列出現與否）的斷點固定用
     768px，且 `layout.css` 的 `.shell-mobile-nav` 與對應 CSS 檔的
     `.mobile-nav` 必須同步檢查、同步修改，不可只改一邊（此 repo 已因兩者
     斷點不同步發生過 769~900px 跑版的事故，見 main.css 內註解）。
   - 改完務必用 `git diff` 檢查：本次改動是否全部落在對應的 `@media` 區塊
     縮排內。若有任何一行改動落在 media query 外（基礎規則層級），代表
     桌機會被波及，必須停下確認是否為刻意變更。
   - 改動頁面收工前，桌機寬度與手機寬度兩種斷點都要重新截圖檢視，不能只
     驗證自己正在修的那一邊。

## 驗收標準（逐頁把關，不得留到最後才修）

每頁遷移/淨化完成才能視為該頁完成，標準如下，缺一不可：

- **視覺**：轉換前後同斷點（桌機/手機）截圖跑 pixel-diff，差異需逼近 0
  （只容許字體抗鋸齒級雜訊）。
- **功能**：轉換前列出頁面所有互動點（按鈕/tab/輪播/表單/modal/收藏/換膚/
  換語言/studio 控制項）與預期行為，轉換後逐一重新觸發比對，缺一項不算過。
- **內容**：文字/資料/複製內容逐字保留，不做任何順手改寫。
- **console**：轉換前後瀏覽器 console 錯誤/警告數量不能變多。

## 慣例
- 溝通與 commit 說明以繁體中文為主（commit message 可英文，聚焦動機）。
- 分支：直接於 `main` 開發（除非另有指示）。
- `v1.5/`～`v6/`：樣式只用既有 token/共用 class，禁任意值色碼、禁 Tailwind/
  框架殘留（原始快照維持不變）。`tailwind/`：就是要用 Tailwind，顏色/陰影/
  圓角/間距一律引用 `tailwind/TOKENS.md` 定義好的 token，不寫死任意值。
