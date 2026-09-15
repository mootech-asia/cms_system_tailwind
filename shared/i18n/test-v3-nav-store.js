'use strict';
const fs = require('fs');
const path = require('path');
const store = require('./v3-nav-store');

const filePath = path.join(__dirname, '../../v3/site/assets/js/i18n.js');
const text = fs.readFileSync(filePath, 'utf8');

let failed = false;

const nav = store.loadNamespace(text, 'nav');
console.log('nav 命名空間 key 數 (zh):', nav.zh.size);
if (nav.zh.get('Lobby').value !== '大廳' || nav.en.get('Lobby').value !== 'Lobby') {
  failed = true;
  console.error('FAIL: Lobby 值不符預期');
} else {
  console.log('OK: Lobby 值正確');
}

// round-trip: 空更新應輸出完全相同的文字
const roundTrip = store.applyNamespaceUpdates(text, 'nav', {});
if (roundTrip !== text) {
  failed = true;
  console.error('FAIL: round-trip 不一致');
} else {
  console.log('OK: round-trip 一致');
}

// 更新一個 key
const updated = store.applyNamespaceUpdates(text, 'nav', {
  Lobby: { zh: '測試大廳', en: 'Test Lobby', ko: '테스트 로비', th: 'ล็อบบี้ทดสอบ' },
});
if (!updated.includes("Lobby: '測試大廳'") || !updated.includes("Lobby: 'Test Lobby'")) {
  failed = true;
  console.error('FAIL: Lobby 更新未生效');
} else {
  console.log('OK: Lobby 更新生效');
}
// 確認除了 Lobby 的 4 個值以外,其餘完全沒變
let diffCount = 0;
for (let i = 0; i < Math.max(updated.length, text.length); i++) {
  if (updated[i] !== text[i]) diffCount++;
}
console.log('字元層級差異數(僅供參考,非精確 diff):', diffCount);

fs.writeFileSync('/tmp/claude-0/-home-user-cms-system/3769dd5a-2fd5-5100-acc7-c0c9a9b64917/scratchpad/v3_updated_test.js', updated);

if (failed) {
  console.error('\n有測試失敗');
  process.exit(1);
} else {
  console.log('\n全部測試通過');
}
