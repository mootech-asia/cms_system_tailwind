// 一次性工具:從目前 v4/v5/v6 的 i18n.js 內容,反推出 master.json(翻譯主檔)。
// 之後不會再執行這支腳本——master.json 建好之後,改文字一律直接編輯 master.json,
// 再跑 sync.js 套用回各版本,不會再回頭「反推」。
'use strict';
const fs = require('fs');
const path = require('path');
const store = require('./flat-store');

const VERSIONS = ['v4', 'v5', 'v6'];
const BRAND = { v4: 'Bet100', v5: 'IGNITE100', v6: 'APEX100' };

const parsedByVersion = {};
for (const v of VERSIONS) {
  const filePath = path.join(__dirname, '../../' + v + '/site/assets/js/i18n.js');
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = store.load(text);
  const map = {};
  for (const e of parsed.entries) {
    map[e.key] = {
      zh: e.locales.zh.value,
      en: e.locales.en.value,
      ko: e.locales.ko.value,
      th: e.locales.th.value,
    };
  }
  parsedByVersion[v] = map;
}

// 把品牌名稱字面值替換成 {{BRAND}} 佔位符,方便偵測「內容其實相同、只差品牌名稱」的 entry。
function templatize(value, version) {
  const brand = BRAND[version];
  if (!brand) return value;
  return value.split(brand).join('{{BRAND}}');
}

const allKeys = new Set();
for (const v of VERSIONS) Object.keys(parsedByVersion[v]).forEach((k) => allKeys.add(k));

const entries = {};
for (const key of Array.from(allKeys).sort()) {
  const targets = {};
  const templated = {};
  for (const v of VERSIONS) {
    if (parsedByVersion[v][key]) {
      targets[v] = key; // v4/v5/v6 key 命名慣例相同,target key 直接等於 master key
      templated[v] = {
        zh: templatize(parsedByVersion[v][key].zh, v),
        en: templatize(parsedByVersion[v][key].en, v),
        ko: templatize(parsedByVersion[v][key].ko, v),
        th: templatize(parsedByVersion[v][key].th, v),
      };
    }
  }
  const versionsHaving = Object.keys(targets);
  // 以第一個擁有此 key 的版本內容(套用品牌樣板後)作為 canonical 基準值,
  // 其餘版本若套用樣板後仍不同,記錄為該版本、該語系的 override。
  const base = templated[versionsHaving[0]];
  const overrides = {};
  for (const v of versionsHaving) {
    const diffLocales = {};
    let hasDiff = false;
    for (const locale of ['zh', 'en', 'ko', 'th']) {
      if (templated[v][locale] !== base[locale]) {
        diffLocales[locale] = parsedByVersion[v][key][locale]; // override 存「還原品牌名稱後」的真實值,不存樣板
        hasDiff = true;
      }
    }
    if (hasDiff) overrides[v] = diffLocales;
  }
  const entry = { targets, zh: base.zh, en: base.en, ko: base.ko, th: base.th };
  if (Object.keys(overrides).length) entry.overrides = overrides;
  entries[key] = entry;
}

const master = {
  $schema: '本檔案是全版本共用翻譯主檔。改文字只改這裡,改完執行 `node shared/i18n/sync.js` 套用回各版本的 i18n.js;不要直接改各版本 i18n.js 裡由 sync 產生的 entry。',
  brand: BRAND,
  entries,
};

fs.writeFileSync(path.join(__dirname, 'master.json'), JSON.stringify(master, null, 2) + '\n', 'utf8');
console.log('master.json 已產生,共', Object.keys(entries).length, '個 key');
console.log('其中含 overrides 的 key 數:', Object.values(entries).filter((e) => e.overrides).length);
