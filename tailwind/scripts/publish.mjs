// vite build 對純 CSS entry 會把輸出當 asset 處理，檔名帶 hash
// （dist/assets/<key>-<hash>.css）；這裡按 entry key 對應回
// tailwind/<key>/site/assets/css/tailwind.css 固定檔名，方便靜態頁面
// 用不變的 <link href> 引用，不用每次 build 都去改 HTML。
import { readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distAssets = join(root, 'dist', 'assets');
const entries = readdirSync(distAssets).filter((f) => f.endsWith('.css'));

for (const file of entries) {
  const m = file.match(/^(.+)-[A-Za-z0-9_-]{8}\.css$/);
  if (!m) { console.warn('跳過（檔名格式不符預期）：', file); continue; }
  const version = m[1];
  const destDir = join(root, version, 'site', 'assets', 'css');
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, 'tailwind.css');
  copyFileSync(join(distAssets, file), dest);
  console.log(`${file} -> ${version}/site/assets/css/tailwind.css`);
}
