import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 純 CSS 編譯用途：每個版本一份 src/vN/input.css，各自獨立的 @theme（token 不
// 互通）。build 輸出到 dist/，再由 scripts/publish.mjs 複製成固定檔名放進
// 對應 vN/site/assets/css/tailwind.css——靜態頁面用一般 <link> 引用，瀏覽端
// 不需要 Vite/Node，Vite 只是編譯期工具。
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        v4: resolve(__dirname, 'src/v4/input.css'),
      },
    },
  },
});
