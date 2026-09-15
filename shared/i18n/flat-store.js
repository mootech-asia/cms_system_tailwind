// 解析/寫回 v4、v5、v6 三版 i18n.js 共用的扁平字串表(`var STRINGS = { 'key.path': { zh, en, ko, th }, ... };`)。
// 純字元掃描,不用正規表示式比對整個物件,避免長字串在複雜交替群組上的退化(catastrophic backtracking)。
'use strict';

const LOCALES = ['zh', 'en', 'ko', 'th'];

function isSpace(ch) {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
}

function skipTrivia(text, i) {
  // 跳過空白與單行註解(// ...到行尾),回傳下一個有意義字元的索引。
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
  let raw = quote;
  let value = '';
  while (text[j] !== quote) {
    if (j >= text.length) throw new Error('unterminated string literal starting at ' + i);
    if (text[j] === '\\') {
      raw += text[j] + text[j + 1];
      value += decodeEscape(text[j + 1]);
      j += 2;
    } else {
      raw += text[j];
      value += text[j];
      j += 1;
    }
  }
  raw += quote;
  j += 1;
  return { value, end: j, raw };
}

function decodeEscape(ch) {
  if (ch === 'n') return '\n';
  if (ch === 't') return '\t';
  return ch; // \', \", \\ 等直接取跳脫後的字元本身
}

// 找出 `var STRINGS = {` 開頭、對應的 `};` 結尾(用大括號深度比對,並跳過字串內容,
// 避免字串裡的 { 或 } 干擾深度計算)。
function findBlock(text) {
  const declIdx = text.indexOf('var STRINGS = {');
  if (declIdx === -1) throw new Error('找不到 var STRINGS = { 宣告');
  const openIdx = text.indexOf('{', declIdx);
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
  if (depth !== 0) throw new Error('STRINGS 物件大括號不平衡');
  return { openIdx, closeIdx: i }; // text[openIdx] === '{', text[closeIdx] === '}'(對應的結尾)
}

// 解析區塊內容,回傳每個 entry 的 { key, locales: { zh:{start,end,raw}, ... }, entryStart, entryEnd }
// entryStart/entryEnd 涵蓋整個 `'key': { ... }` (不含結尾逗號)。
function parseEntries(text, openIdx, closeIdx) {
  const entries = [];
  let i = skipTrivia(text, openIdx + 1);
  while (i < closeIdx) {
    if (text[i] !== "'" && text[i] !== '"') {
      throw new Error('預期 entry key 字串,但在索引 ' + i + ' 遇到: ' + JSON.stringify(text.slice(i, i + 30)));
    }
    const entryStart = i;
    const keyLit = parseJsString(text, i);
    const key = keyLit.value;
    i = skipTrivia(text, keyLit.end);
    if (text[i] !== ':') throw new Error('key 後預期 : ,在索引 ' + i);
    i = skipTrivia(text, i + 1);
    if (text[i] !== '{') throw new Error('value 預期 { ,在索引 ' + i);
    const valueOpen = i;
    i = skipTrivia(text, i + 1);
    const locales = {};
    while (text[i] !== '}') {
      const identStart = i;
      while (/[a-zA-Z]/.test(text[i])) i++;
      const ident = text.slice(identStart, i);
      i = skipTrivia(text, i);
      if (text[i] !== ':') throw new Error('欄位 ' + ident + ' 後預期 : ,在索引 ' + i);
      i = skipTrivia(text, i + 1);
      const strLit = parseJsString(text, i);
      locales[ident] = { start: i, end: strLit.end, value: strLit.value };
      i = skipTrivia(text, strLit.end);
      if (text[i] === ',') i = skipTrivia(text, i + 1);
    }
    const valueClose = i; // text[valueClose] === '}'
    i = valueClose + 1;
    const entryEnd = i;
    i = skipTrivia(text, i);
    if (text[i] === ',') i = skipTrivia(text, i + 1);
    entries.push({ key, locales, entryStart, entryEnd });
  }
  return entries;
}

function encodeJsString(value) {
  if (value.indexOf("'") !== -1 && value.indexOf('"') === -1) {
    return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

// 讀取檔案,回傳 { text, block:{openIdx,closeIdx}, entries, byKey }
function load(text) {
  const block = findBlock(text);
  const entries = parseEntries(text, block.openIdx, block.closeIdx);
  const byKey = new Map();
  for (const e of entries) byKey.set(e.key, e);
  return { text, block, entries, byKey };
}

// 套用一組 { key: {zh,en,ko,th} } 更新:
// - key 已存在:原地替換每個 locale 的字串字面值(保留原本單行/多行排版、縮排、註解、其餘 key 順序)
// - key 不存在:在區塊結尾(closeIdx 前)新增一行單行格式的 entry
// 回傳新的檔案文字。
function apply(parsed, updates) {
  const { text, block, byKey } = parsed;
  // 先處理「已存在」的 key:蒐集所有要替換的字串片段,依索引排序後由後往前替換,
  // 這樣前面替換不會影響後面尚未處理片段的索引。
  const replacements = [];
  const newKeys = [];
  for (const [key, values] of Object.entries(updates)) {
    const entry = byKey.get(key);
    if (!entry) {
      newKeys.push([key, values]);
      continue;
    }
    for (const locale of LOCALES) {
      if (!(locale in values)) continue;
      const field = entry.locales[locale];
      if (!field) throw new Error('entry ' + key + ' 缺少 ' + locale + ' 欄位,無法就地替換');
      const newLiteral = encodeJsString(values[locale]);
      replacements.push({ start: field.start, end: field.end, text: newLiteral });
    }
  }
  replacements.sort((a, b) => b.start - a.start);
  let out = text;
  for (const r of replacements) {
    out = out.slice(0, r.start) + r.text + out.slice(r.end);
  }
  if (newKeys.length) {
    const lines = newKeys.map(([key, values]) => {
      const parts = LOCALES.map((l) => l + ': ' + encodeJsString(values[l] != null ? values[l] : ''));
      return "    '" + key + "': { " + parts.join(', ') + ' },';
    });
    const insertText = lines.join('\n') + '\n';
    // closeIdx 在原始 text 中的位置不受前面替換影響(替換只改變字串內容長度,
    // 但我們是用「原始 text 的 closeIdx」插入到「經過原地替換後的 out」——
    // 由於所有替換都在 closeIdx 之前且不改變 closeIdx 之後的文字,原始 closeIdx
    // 在 out 中對應的位置需要用 out 自身重新定位:直接找最後一個 entry 結尾或用
    // closeIdx 減去尚未發生的偏移。因為 replacements 全部在 block 內、closeIdx 之前,
    // 且逐一替換操作都同步反映在 out 上,故此時 out 的長度已包含這些變動;
    // closeIdx 對應到 out 中的位置 = closeIdx + (out.length - text.length)。
    const shift = out.length - text.length;
    const insertAt = block.closeIdx + shift;
    out = out.slice(0, insertAt) + insertText + out.slice(insertAt);
  }
  return out;
}

module.exports = { load, apply, LOCALES, encodeJsString };
