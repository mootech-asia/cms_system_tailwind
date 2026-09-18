// 逐頁 SOP 用的互動測試腳本：對 orig/new 兩邊做同樣的點擊，比對點擊後
// 的畫面與 console 錯誤數（見 tailwind/PHASE3-HANDOFF.md）。
//
// 用法: node pixelmatch_interact.mjs <version> <page-name> <step-label> <selector> [width]
//   selector 是要點擊的 CSS selector；width 預設 1440（傳 <1000 的值
//   會改用 <version>/site-mobile 當轉換版來源）。
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedAuthIfNeeded } from './auth_seed.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [version, page_name, stepLabel, selector, widthArg] = process.argv.slice(2);
if (!version || !page_name || !stepLabel || !selector) {
  console.error('usage: node pixelmatch_interact.mjs <version> <page-name> <step-label> <selector> [width]');
  process.exit(1);
}
const width = widthArg ? parseInt(widthArg, 10) : 1440;
const OUT_DIR = path.join(__dirname, '..', '.pixelmatch-out');
fs.mkdirSync(OUT_DIR, { recursive: true });

const isMobile = width < 1000;
const pathSeg = isMobile ? 'site-mobile' : 'site';
const suffix = page_name.includes('.html') ? page_name : `${page_name}.html`;
const urlA = `http://127.0.0.1:8901/${version}/site/${suffix}`;
const urlB = `http://127.0.0.1:8902/${version}/${pathSeg}/${suffix}`;

async function run(browser, url) {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
  await seedAuthIfNeeded(ctx, version, page_name);
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await p.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(300);
  await p.click(selector, { timeout: 5000 });
  await p.waitForTimeout(300);
  return { p, ctx, errs };
}

// 見 pixelmatch_compare.mjs 同一組旗標的說明：關掉 Chromium 背景遙測
// 連線，避免這個環境的出口代理讓 networkidle 卡住。
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--disable-background-networking', '--disable-sync', '--disable-translate', '--no-first-run', '--disable-features=OptimizationHints'],
});
let A, B;
try {
  A = await run(browser, urlA);
} catch (e) {
  console.error(`orig click failed: ${e.message}`);
}
try {
  B = await run(browser, urlB);
} catch (e) {
  console.error(`new click failed: ${e.message}`);
}

const safeName = page_name.replace(/[?&=]/g, '_');
const fileA = `${OUT_DIR}/${safeName}_${stepLabel}_orig.png`;
const fileB = `${OUT_DIR}/${safeName}_${stepLabel}_new.png`;
if (A) await A.p.screenshot({ path: fileA });
if (B) await B.p.screenshot({ path: fileB });

if (A && B) {
  const imgA = PNG.sync.read(fs.readFileSync(fileA));
  const imgB = PNG.sync.read(fs.readFileSync(fileB));
  const w = Math.max(imgA.width, imgB.width);
  const h = Math.max(imgA.height, imgB.height);
  function pad(img) {
    if (img.width === w && img.height === h) return img;
    const out = new PNG({ width: w, height: h });
    PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
    return out;
  }
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(pad(imgA).data, pad(imgB).data, diff.data, w, h, { threshold: 0.1 });
  fs.writeFileSync(`${OUT_DIR}/${safeName}_${stepLabel}_diff.png`, PNG.sync.write(diff));
  console.log(`[${version}/${page_name}/${stepLabel}] click "${selector}" width=${width} -> diff ${n}px / ${((n / (w * h)) * 100).toFixed(3)}%`);
  console.log(`  orig console errors: ${A.errs.length}`, A.errs);
  console.log(`  new  console errors: ${B.errs.length}`, B.errs);
}

if (A) await A.ctx.close();
if (B) await B.ctx.close();
await browser.close();
