// 逐頁 SOP 用的 PC/手機 pixelmatch 比對腳本（見 tailwind/PHASE3-HANDOFF.md）。
// 前提：兩個測試伺服器已啟動（repo 根目錄 8901 服務原始站台、tailwind/
// 目錄 8902 服務轉換版），且 chromium 執行檔存在於下面寫死的路徑
// （這個環境固定路徑，見 PHASE3-HANDOFF.md「測試基建」）。
//
// 用法: node pixelmatch_compare.mjs <version> <page-name> [width]
//   version: v1.5 / v3 / v4 / v5 / v6（對應 <version>/site、<version>/site-mobile）
//   page-name: 檔名（可省略 .html，也可以帶查詢字串，例如
//              'transaction-info.html?type=withdrawal&amount=50000'）
//   width: 只測單一寬度時傳入（例如 1440 或 390）；省略則 PC(1440)+手機(390) 都測
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [version, page_name, widthArg] = process.argv.slice(2);
if (!version || !page_name) {
  console.error('usage: node pixelmatch_compare.mjs <version> <page-name> [width]');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, '..', '.pixelmatch-out');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function waitImages(page) {
  await page.evaluate(() => {
    const imgs = Array.from(document.images);
    return Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            })
      )
    );
  });
}

async function shoot(browser, url, width, outfile) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMsgs.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => consoleMsgs.push(`pageerror: ${err.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await waitImages(page);
  await page.waitForTimeout(300);
  const height = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(100);
  await page.screenshot({ path: outfile, fullPage: true });
  await ctx.close();
  return { height, consoleMsgs };
}

function compare(fileA, fileB, diffOut) {
  const imgA = PNG.sync.read(fs.readFileSync(fileA));
  const imgB = PNG.sync.read(fs.readFileSync(fileB));
  const width = Math.max(imgA.width, imgB.width);
  const height = Math.max(imgA.height, imgB.height);

  function pad(img) {
    if (img.width === width && img.height === height) return img;
    const out = new PNG({ width, height });
    PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
    return out;
  }
  const a = pad(imgA);
  const b = pad(imgB);
  const diff = new PNG({ width, height });
  const numDiff = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.1 });
  fs.writeFileSync(diffOut, PNG.sync.write(diff));
  const pct = (numDiff / (width * height)) * 100;
  return { numDiff, pct, width, height, origSize: [imgA.width, imgA.height], newSize: [imgB.width, imgB.height] };
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

const suffix = page_name.includes('.html') ? page_name : `${page_name}.html`;
const allCases = [
  {
    label: 'PC',
    urlA: `http://127.0.0.1:8901/${version}/site/${suffix}`,
    urlB: `http://127.0.0.1:8902/${version}/site/${suffix}`,
    width: 1440,
  },
  {
    label: 'Mobile',
    urlA: `http://127.0.0.1:8901/${version}/site/${suffix}`,
    urlB: `http://127.0.0.1:8902/${version}/site-mobile/${suffix}`,
    width: 390,
  },
];
const cases = widthArg ? allCases.filter((c) => String(c.width) === String(widthArg)) : allCases;

const safeName = page_name.replace(/[?&=]/g, '_');
for (const c of cases) {
  const fileA = `${OUT_DIR}/${safeName}_${c.label}_orig.png`;
  const fileB = `${OUT_DIR}/${safeName}_${c.label}_new.png`;
  const diffOut = `${OUT_DIR}/${safeName}_${c.label}_diff.png`;
  const rA = await shoot(browser, c.urlA, c.width, fileA);
  const rB = await shoot(browser, c.urlB, c.width, fileB);
  const cmp = compare(fileA, fileB, diffOut);
  console.log(`\n=== ${version}/${page_name} ${c.label} (width=${c.width}) ===`);
  console.log(`  orig height=${rA.height}, new height=${rB.height}`);
  console.log(`  orig console msgs: ${rA.consoleMsgs.length}`, rA.consoleMsgs);
  console.log(`  new  console msgs: ${rB.consoleMsgs.length}`, rB.consoleMsgs);
  console.log(`  diff: ${cmp.numDiff} px / ${cmp.pct.toFixed(3)}% (canvas ${cmp.width}x${cmp.height}, orig ${cmp.origSize}, new ${cmp.newSize})`);
}

await browser.close();
