// 解析/寫回 v3 i18n.js 的 `TRANSLATIONS.<locale>.nav.<key>` 巢狀翻譯資料。
// 目前只鎖定 nav 命名空間(master.json 目前跟 v3 對應的 15 個 key 都落在這裡),
// 且只做「更新既有 key」,不做新增——這 15 個 key 在 v3 原本就存在。
// 結構: const TRANSLATIONS = Object.freeze({ zh: Object.freeze({ nav: Object.freeze({ Lobby: '大廳', ... }), ... }), en: ..., ko: ..., th: ... });
'use strict';

const LOCALES = ['zh', 'en', 'ko', 'th'];

function isSpace(ch) {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
}

function skipTrivia(text, i) {
  for (;;) {
    while (i < text.length && isSpace(text[i])) i++;
    if (text[i] === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    break;
  }
  return i;
}

function parseJsString(text, i) {
  const quote = text[i];
  if (quote !== "'" && quote !== '"') {
    throw new Error('expected string literal at index ' + i + ', got: ' + JSON.stringify(text.slice(i, i + 20)));
  }
  let j = i + 1;
  let value = '';
  while (text[j] !== quote) {
    if (j >= text.length) throw new Error('unterminated string literal starting at ' + i);
    if (text[j] === '\\') {
      value += decodeEscape(text[j + 1]);
      j += 2;
    } else {
      value += text[j];
      j += 1;
    }
  }
  j += 1;
  return { value, end: j };
}

function decodeEscape(ch) {
  if (ch === 'n') return '\n';
  if (ch === 't') return '\t';
  return ch;
}

// 從 fromIdx 開始找 `<literalIdent>: Object.freeze({`,回傳大括號內容的 [openIdx, closeIdx]
// (closeIdx 指向對應的 `}`),用大括號深度比對並跳過字串,避免字串內容干擾。
function findFreezeBlock(text, label, fromIdx) {
  const marker = label + ': Object.freeze({';
  const markerIdx = text.indexOf(marker, fromIdx);
  if (markerIdx === -1) throw new Error('找不到區塊: ' + marker);
  const openIdx = markerIdx + marker.length - 1; // 指向 '{'
  let depth = 0;
  let i = openIdx;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === '"') {
      i = parseJsString(text, i).end - 1;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) throw new Error('區塊 ' + label + ' 大括號不平衡');
  return { openIdx, closeIdx: i, afterIdx: i + 1 };
}

// 解析一個「單層 key: 'value',」物件內容(key 可為裸識別字或加引號字串),
// 回傳 { byKey: Map<key, {start,end,value}> }。
function parseLeafPairs(text, openIdx, closeIdx) {
  const byKey = new Map();
  let i = skipTrivia(text, openIdx + 1);
  while (i < closeIdx) {
    let key;
    if (text[i] === "'" || text[i] === '"') {
      key = parseJsString(text, i);
      i = skipTrivia(text, key.end);
      key = key.value;
    } else {
      const start = i;
      while (/[A-Za-z0-9_]/.test(text[i])) i++;
      key = text.slice(start, i);
      i = skipTrivia(text, i);
    }
    if (text[i] !== ':') throw new Error('key ' + key + ' 後預期 : ,在索引 ' + i);
    i = skipTrivia(text, i + 1);
    const val = parseJsString(text, i);
    byKey.set(key, { start: i, end: val.end, value: val.value });
    i = skipTrivia(text, val.end);
    if (text[i] === ',') i = skipTrivia(text, i + 1);
  }
  return byKey;
}

// 載入指定命名空間(目前只用得到 'nav')在四個語系底下的 leaf key-value。
function loadNamespace(text, namespace) {
  const transIdx = text.indexOf('const TRANSLATIONS = Object.freeze({');
  if (transIdx === -1) throw new Error('找不到 TRANSLATIONS 宣告');
  const byLocale = {};
  let cursor = transIdx;
  for (const locale of LOCALES) {
    const localeBlock = findFreezeBlock(text, locale, cursor);
    const nsBlock = findFreezeBlock(text, namespace, localeBlock.openIdx);
    if (nsBlock.openIdx > localeBlock.closeIdx) {
      throw new Error('命名空間 ' + namespace + ' 不在 ' + locale + ' 區塊內(可能該語系沒有這個命名空間)');
    }
    byLocale[locale] = parseLeafPairs(text, nsBlock.openIdx, nsBlock.closeIdx);
    cursor = localeBlock.afterIdx;
  }
  return byLocale;
}

function encodeJsString(value) {
  if (value.indexOf("'") !== -1 && value.indexOf('"') === -1) {
    return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

// updates: { key: { zh, en, ko, th } } (皆須為已存在的 key,不支援新增)
function applyNamespaceUpdates(text, namespace, updates) {
  const byLocale = loadNamespace(text, namespace);
  const replacements = [];
  for (const [key, values] of Object.entries(updates)) {
    for (const locale of LOCALES) {
      if (!(locale in values)) continue;
      const field = byLocale[locale].get(key);
      if (!field) throw new Error('v3 ' + namespace + '.' + key + ' (' + locale + ') 不存在,無法就地替換(此工具不支援新增 v3 key)');
      replacements.push({ start: field.start, end: field.end, text: encodeJsString(values[locale]) });
    }
  }
  replacements.sort((a, b) => b.start - a.start);
  let out = text;
  for (const r of replacements) out = out.slice(0, r.start) + r.text + out.slice(r.end);
  return out;
}

module.exports = { loadNamespace, applyNamespaceUpdates, LOCALES };
