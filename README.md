# cms_system

CMS 生成系統的統一預覽 repo。整合 `cms_system_v1.5`、`cms_system_v2`、`cms_system_v3`、
`cms_system_v4`、`cms_system_v5` 五個交付版型，依版本號排序。除 v1.5 外，每個版本都是完全
獨立、免建置的純 HTML+CSS+JS 靜態站，不依賴任何前端框架（無 Vue／Nuxt／Tailwind／PrimeVue
殘留）。

## 目錄結構

```
cms_system/
├── index.html       # 統一首頁，各版型入口（依版本號排序：v1.5 → v2 → v3 → v4 → v5）
├── v1.5/
│   ├── site/         # WIN10096 前台（純 HTML+CSS+JS,對照 Nuxt/ 真實原始碼與正式站截圖手刻）
│   ├── Nuxt/          # 對照用真實 Nuxt 專案原始碼(cms-customer-frontend-theme-purple)
│   └── temp/          # 上一版手刻靜態站封存(備查用,非對外內容)
├── v2/
│   ├── site/         # WIN100 前台（純 HTML+CSS+JS，可換膚）
│   └── studio/        # 設計後台（純 HTML+CSS+JS，iframe 預覽 site/，localStorage 同步）
├── v3/
│   ├── site/         # Gaming Lobby 前台（純 HTML+CSS+JS）
│   ├── studio/        # 設計後台（同上）
│   └── site-mobile/   # 手機版大廳（獨立頁面；沿用 site/ 的 assets，其餘頁面轉址回 site/）
├── v4/
│   ├── site/         # 紅金喜慶前台（純 HTML+CSS+JS）
│   └── studio/        # 設計後台（同上）
└── v5/
    ├── site/         # IGNITE100 烈焰賭場前台（純 HTML+CSS+JS，參考深色賭場站型視覺）
    └── studio/        # 設計後台（同上）
```

## 開發規範

見 [`CLAUDE.md`](./CLAUDE.md)。

## GitHub Pages

https://mootech-asia.github.io/cms_system/
