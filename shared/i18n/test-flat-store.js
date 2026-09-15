'use strict';
const fs = require('fs');
const path = require('path');
const store = require('./flat-store');

const files = {
  v4: '../../v4/site/assets/js/i18n.js',
  v5: '../../v5/site/assets/js/i18n.js',
  v6: '../../v6/site/assets/js/i18n.js',
};

let failed = false;

for (const [ver, rel] of Object.entries(files)) {
  const filePath = path.join(__dirname, rel);
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = store.load(text);
  console.log(ver, 'entries parsed:', parsed.entries.length);

  // round-trip: 不做任何更新,輸出應與原文字完全一致
  const roundTrip = store.apply(parsed, {});
  if (roundTrip !== text) {
    failed = true;
    console.error(ver, 'FAIL: round-trip 不一致 (無更新時輸出應等於原文)');
    for (let i = 0; i < Math.min(roundTrip.length, text.length); i++) {
      if (roundTrip[i] !== text[i]) {
        console.error('  第一個差異位置', i, JSON.stringify(text.slice(Math.max(0, i - 30), i + 30)), 'vs', JSON.stringify(roundTrip.slice(Math.max(0, i - 30), i + 30)));
        break;
      }
    }
  } else {
    console.log(ver, 'OK: round-trip 一致');
  }

  // 更新既有 key + 新增一個 key
  const firstKey = parsed.entries[0].key;
  const updated = store.apply(parsed, {
    [firstKey]: { zh: '測試值', en: 'TEST VALUE' },
    '__test.newKey__': { zh: '新', en: 'New', ko: '새로운', th: 'ใหม่' },
  });
  if (!updated.includes("'__test.newKey__': { zh: '新', en: 'New', ko: '새로운', th: 'ใหม่' },")) {
    failed = true;
    console.error(ver, 'FAIL: 新增 key 沒有正確附加');
  } else {
    console.log(ver, 'OK: 新增 key 正確附加');
  }
  if (!updated.includes("zh: '測試值'") || !updated.includes("en: 'TEST VALUE'")) {
    failed = true;
    console.error(ver, 'FAIL: 既有 key 沒有正確替換');
  } else {
    console.log(ver, 'OK: 既有 key 正確替換');
  }
  // 確認更新後的內容仍是合法 JS(寫到暫存檔用 node --check 驗證由外層 shell 處理)
  fs.writeFileSync('/tmp/claude-0/-home-user-cms-system/3769dd5a-2fd5-5100-acc7-c0c9a9b64917/scratchpad/' + ver + '_updated_test.js', updated);
}

if (failed) {
  console.error('\n有測試失敗');
  process.exit(1);
} else {
  console.log('\n全部測試通過');
}
