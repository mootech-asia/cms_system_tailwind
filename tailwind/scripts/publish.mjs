// vite build 對純 CSS entry 會把輸出當 asset 處理，檔名帶 hash
// （dist/assets/<key>-<hash>.css）。entry key 格式固定是 `<version>-pc`
// 或 `<version>-mobile`（見 vite.config.js），這裡拆開對應到：
//   <version>-pc     -> tailwind/<version>/site/assets/css/tailwind.css
//   <version>-mobile -> tailwind/<version>/site-mobile/assets/css/tailwind.css
// （沿用 v3 site/ 與 site-mobile/ 平行部署、CSS 各自獨立的既有慣例，
// 不是兩份疊在同一個 tailwind.css 裡）。靜態頁面用不變的 <link href>
// 引用，不用每次 build 都去改 HTML。
import { readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distAssets = join(root, 'dist', 'assets');
const entries = readdirSync(distAssets).filter((f) => f.endsWith('.css'));

const DEVICE_DIR = { pc: 'site', mobile: 'site-mobile' };

for (const file of entries) {
  const m = file.match(/^(.+)-(pc|mobile)-[A-Za-z0-9_-]{8}\.css$/);
  if (!m) { console.warn('跳過（檔名格式不符預期，entry key 要用 <version>-pc/-mobile）：', file); continue; }
  const [, version, device] = m;
  const destDir = join(root, version, DEVICE_DIR[device], 'assets', 'css');
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, 'tailwind.css');
  copyFileSync(join(distAssets, file), dest);
  console.log(`${file} -> ${version}/${DEVICE_DIR[device]}/assets/css/tailwind.css`);
}
