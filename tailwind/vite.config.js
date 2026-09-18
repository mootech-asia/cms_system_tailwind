import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 純 CSS 編譯用途：每個版本各兩份獨立 @theme（src/vN/pc/theme.css、
// src/vN/mobile/theme.css，鐵則 6：手機/桌機不共用同一份定義，尚未建立
// 手機版的版本先不加進 input，之後補上再加）。build 輸出到 dist/，再由
// scripts/publish.mjs 依 entry key（例如 v4-pc）複製成固定檔名放進對應
// vN/site/assets/css/tailwind.css——靜態頁面用一般 <link> 引用，瀏覽端
// 不需要 Vite/Node，Vite 只是編譯期工具。
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        // entry key 不能用 "." （Rollup 拿它當副檔名分隔符，"v1.5-pc" 會被
        // 截斷成 "v1"），用底線代替，publish.mjs 再轉回 "v1.5" 資料夾名。
        'v1_5-pc': resolve(__dirname, 'src/v1.5/pc/theme.css'),
        'v1_5-mobile': resolve(__dirname, 'src/v1.5/mobile/theme.css'),
        'v3-pc': resolve(__dirname, 'src/v3/pc/theme.css'),
        'v3-mobile': resolve(__dirname, 'src/v3/mobile/theme.css'),
        'v4-pc': resolve(__dirname, 'src/v4/pc/theme.css'),
        'v4-mobile': resolve(__dirname, 'src/v4/mobile/theme.css'),
        'v5-pc': resolve(__dirname, 'src/v5/pc/theme.css'),
        'v5-mobile': resolve(__dirname, 'src/v5/mobile/theme.css'),
        'v6-pc': resolve(__dirname, 'src/v6/pc/theme.css'),
        'v6-mobile': resolve(__dirname, 'src/v6/mobile/theme.css'),
        'v2-pc': resolve(__dirname, 'src/v2/pc/theme.css'),
        'v2-mobile': resolve(__dirname, 'src/v2/mobile/theme.css'),
      },
    },
  },
});
