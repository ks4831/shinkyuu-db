// Hiragana U+3041-U+3096, Katakana U+30A1-U+30F6
export function toKatakana(str: string): string {
  return str.replace(/[ぁ-ゖ]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60))
}

export function toHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

export function normalizeSearch(str: string): string {
  return toHiragana(str.trim().toLowerCase())
}

export function kanaIncludes(haystack: string, needle: string): boolean {
  if (!needle) return true
  return normalizeSearch(haystack).includes(normalizeSearch(needle))
}

// Common kana readings → kanji keywords for theme name matching
export const KANA_KEYWORD_MAP: [string, string][] = [
  ['げんけつ',         '原穴'],
  ['げきけつ',         '郄穴'],
  ['ぼけつ',           '募穴'],
  ['ごゆけつ',         '五兪穴'],
  ['らくけつ',         '絡穴'],
  ['はちかいけつ',     '八会穴'],
  ['はちみゃく',       '八脈交会穴'],
  ['しんけい',         '神経'],
  ['しんけいしっかん', '神経疾患'],
  ['ろくいん',         '六淫'],
  ['ごぎょう',         '五行'],
  ['いんよう',         '陰陽'],
  ['きけつ',           '気血津液'],
  ['べんしょう',       '弁証'],
  ['りはびり',         'リハビリ'],
  ['けいらく',         '経絡'],
  ['けいけつ',         '経穴'],
  ['しさん',           '四診'],
  ['はりりろん',       'はり理論'],
  ['きゅうりろん',     'きゅう理論'],
  ['とうようがく',     '東洋医学'],
  ['しんきゅう',       '鍼灸'],
  ['かいぼう',         '解剖'],
  ['せいり',           '生理'],
  ['びょうり',         '病理'],
  ['めんえき',         '免疫'],
  ['のうりょく',       '脳'],
  ['ほけん',           '保健'],
  ['えいせい',         '衛生'],
  ['ほうき',           '法規'],
  ['あはきほう',       'あはき法'],
  ['じゅうにけいみゃく', '十二経脈'],
  ['きけい',           '奇経'],
  ['さんしょうけい',   '三焦経'],
  ['かんけい',         '肝経'],
  ['しんけいみゃく',   '心経'],
  ['たいいんけい',     '太陰経'],
]

export function expandSearchQuery(query: string): string[] {
  const q = normalizeSearch(query)
  if (!q) return [query]
  const results: string[] = [query]
  for (const [kana, kanji] of KANA_KEYWORD_MAP) {
    if (normalizeSearch(kana).startsWith(q)) {
      results.push(kanji)
    }
  }
  return [...new Set(results)]
}
