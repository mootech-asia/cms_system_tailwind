// 解析/寫回「locale -> { 'key': 'value', ... }」兩層字典結構,例如:
//   var I18N = { zh: { 'nav.lobby': '大廳', ... }, ko: { ... }, en: { ... } };
// v1.5(assets/js/data.js 的 I18N)、v2(assets/js/data.js 的 I18N)都是這個形狀,
// 差別只在語系清單不同(v1.5 沒有 th)、key 用單引號或雙引號——都由本模組自動判斷。
// 只支援就地替換既有 key,不支援新增(跟 v3-nav-store.js 一致的保守策略)。
'use strict';

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

// 用大括號深度比對(跳過字串內容)找出 declPrefix(例如 'var I18N = {')
// 之後對應的結尾 '}',回傳 [openIdx, closeIdx]。
function findBraceBlock(text, declPrefix, fromIdx) {
  const declIdx = text.indexOf(declPrefix, fromIdx || 0);
  if (declIdx === -1) throw new Error('找不到宣告: ' + declPrefix);
  const openIdx = declIdx + declPrefix.length - 1; // 指向 '{'
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
  if (depth !== 0) throw new Error(declPrefix + ' 大括號不平衡');
  return { openIdx, closeIdx: i };
}

// 解析單層 'key': 'value', 物件內容,回傳 Map<key, {start,end,value}>。
function parseLeafPairs(text, openIdx, closeIdx) {
  const byKey = new Map();
  let i = skipTrivia(text, openIdx + 1);
  while (i < closeIdx) {
    if (text[i] !== "'" && text[i] !== '"') {
      throw new Error('預期 key 字串,在索引 ' + i + ' 遇到: ' + JSON.stringify(text.slice(i, i + 30)));
    }
    const keyLit = parseJsString(text, i);
    const key = keyLit.value;
    i = skipTrivia(text, keyLit.end);
    if (text[i] !== ':') throw new Error('key ' + key + ' 後預期 : ,在索引 ' + i);
    i = skipTrivia(text, i + 1);
    const val = parseJsString(text, i);
    byKey.set(key, { start: i, end: val.end, value: val.value });
    i = skipTrivia(text, val.end);
    if (text[i] === ',') i = skipTrivia(text, i + 1);
  }
  return byKey;
}

// 載入 declPrefix(例如 'var I18N = {')底下所有語系的 leaf key-value。
// 回傳 { byLocale: {locale: Map}, presentLocales: string[] }。
function load(text, declPrefix) {
  const block = findBraceBlock(text, declPrefix);
  const byLocale = {};
  const presentLocales = [];
  let i = skipTrivia(text, block.openIdx + 1);
  while (i < block.closeIdx) {
    let locale;
    if (text[i] === "'" || text[i] === '"') {
      // 語系名稱用引號包住,例如 "zh": { ... }(v2 data.js 的寫法)。
      const lit = parseJsString(text, i);
      locale = lit.value;
      i = lit.end;
    } else {
      // 語系名稱是裸識別字,例如 zh: { ... }(v1.5 data.js 的寫法)。
      const identStart = i;
      while (/[A-Za-z0-9_]/.test(text[i])) i++;
      locale = text.slice(identStart, i);
    }
    i = skipTrivia(text, i);
    if (text[i] !== ':') throw new Error('語系 ' + locale + ' 後預期 : ,在索引 ' + i);
    i = skipTrivia(text, i + 1);
    if (text[i] !== '{') throw new Error('語系 ' + locale + ' 值預期 { ,在索引 ' + i);
    const localeBlock = findBraceBlock(text, '', i); // 直接從 i(就是 '{')找對應結尾
    byLocale[locale] = parseLeafPairs(text, i, localeBlock.closeIdx);
    presentLocales.push(locale);
    i = localeBlock.closeIdx + 1;
    i = skipTrivia(text, i);
    if (text[i] === ',') i = skipTrivia(text, i + 1);
  }
  return { block, byLocale, presentLocales };
}

// preferQuote: 'single' | 'double' ——沒有引號衝突時優先採用哪種引號,
// 讓輸出跟檔案原本的慣例一致(v1.5 用單引號、v2 用雙引號)。
function encodeJsString(value, preferQuote) {
  const preferDouble = preferQuote === 'double';
  if (preferDouble) {
    if (value.indexOf('"') === -1) return '"' + value.replace(/\\/g, '\\\\') + '"';
    return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }
  if (value.indexOf("'") !== -1 && value.indexOf('"') === -1) {
    return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

// updates: { key: { zh, en, ko, th } } ——只更新 loaded.presentLocales 裡有的語系,
// 其餘語系(例如 v1.5 沒有 th)直接忽略,不會報錯。key 必須已存在,不支援新增。
function apply(text, loaded, updates, preferQuote) {
  const replacements = [];
  for (const [key, values] of Object.entries(updates)) {
    for (const locale of loaded.presentLocales) {
      if (!(locale in values)) continue;
      const field = loaded.byLocale[locale].get(key);
      if (!field) throw new Error(locale + '.' + key + ' 不存在,無法就地替換(此工具不支援新增 key)');
      replacements.push({ start: field.start, end: field.end, text: encodeJsString(values[locale], preferQuote) });
    }
  }
  replacements.sort((a, b) => b.start - a.start);
  let out = text;
  for (const r of replacements) out = out.slice(0, r.start) + r.text + out.slice(r.end);
  return out;
}

module.exports = { load, apply };
