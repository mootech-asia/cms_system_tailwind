'use strict';
const fs = require('fs');
const path = require('path');
const store = require('./dict-store');

const files = {
  'v1.5': path.join(__dirname, '../../v1.5/site/assets/js/data.js'),
  v2: path.join(__dirname, '../../v2/site/assets/js/data.js'),
};

let failed = false;

for (const [ver, filePath] of Object.entries(files)) {
  const text = fs.readFileSync(filePath, 'utf8');
  const loaded = store.load(text, 'var I18N = {');
  console.log(ver, '語系:', loaded.presentLocales.join(','), '| en key 數:', loaded.byLocale.en ? loaded.byLocale.en.size : 'N/A');

  // round-trip
  const roundTrip = store.apply(text, loaded, {});
  if (roundTrip !== text) {
    failed = true;
    console.error(ver, 'FAIL: round-trip 不一致');
  } else {
    console.log(ver, 'OK: round-trip 一致');
  }

  // 挑一個真實存在的 key 測試替換(用每個版本各自第一個 en key)
  const sampleKey = loaded.byLocale.en.keys().next().value;
  const updates = {};
  updates[sampleKey] = { en: '__TEST__' };
  const preferQuote = ver === 'v2' ? 'double' : 'single';
  const updated = store.apply(text, loaded, updates, preferQuote);
  if (!updated.includes("'" + sampleKey + "': '__TEST__'") && !updated.includes('"' + sampleKey + '": "__TEST__"')) {
    failed = true;
    console.error(ver, 'FAIL:', sampleKey, '替換未生效');
  } else {
    console.log(ver, 'OK:', sampleKey, '替換生效');
  }
}

if (failed) {
  console.error('\n有測試失敗');
  process.exit(1);
} else {
  console.log('\n全部測試通過');
}
