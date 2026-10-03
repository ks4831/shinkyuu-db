/* ──────────────────────────────────────────────────────────────
   経穴名の文字照合（候補抽出・監査の共通ロジック）
   - ここでの一致は「候補」を出すためだけに使う。出題判定（role）は
     src/data/acupointOccurrences.json の人手レビューが正本。
   - 定義: docs/acupoint-occurrence-definition.md
   ────────────────────────────────────────────────────────────── */

/** 全角/半角・異体字の最小限の正規化（兪/俞は公式本文で混在する） */
export function normalizeText(s) {
  return String(s ?? '').normalize('NFKC').replace(/俞/g, '兪')
}

/** 経穴名を含む別語（この範囲内の一致は経穴として扱わない） */
const BLOCKING_WORDS = {
  腕骨: ['上腕骨'],
}

/**
 * text 中に term が「経穴名として」現れるか。
 * - 直後が「兪」の一致は別穴（関元→関元兪、気海→気海兪 など）なので除外
 * - BLOCKING_WORDS の語の一部としての一致は除外
 */
export function containsTerm(text, term) {
  const t = normalizeText(text)
  const blockers = BLOCKING_WORDS[term] ?? []
  let from = 0
  for (;;) {
    const i = t.indexOf(term, from)
    if (i < 0) return false
    from = i + 1
    if (t[i + term.length] === '兪' && !term.endsWith('兪')) continue
    const blocked = blockers.some((w) => {
      const off = w.indexOf(term)
      return off >= 0 && t.slice(i - off, i - off + w.length) === w
    })
    if (blocked) continue
    return true
  }
}

/** 経穴マスタ1件の照合語（正式名＋別名） */
export function masterTerms(a) {
  return [a.name, ...(a.aliases ?? [])]
}

/** 過去問1問の公式本文（問題文＋選択肢） */
export function officialText(q) {
  return [q.questionText, ...(q.choices ?? [])].join('\n')
}

/** 公式本文に明示されているマスタ経穴（slug 配列） */
export function namedMasterSlugs(q, acupoints) {
  const text = officialText(q)
  return acupoints.filter((a) => masterTerms(a).some((t) => containsTerm(text, t))).map((a) => a.slug)
}

/** 経穴関連の設問かを判定するキーワード（名称が書かれない出題を拾うため） */
const KEYWORD_RE = /穴|兪|募|井|滎|榮|経脈|経絡/
const ACUPOINT_SUBJECT = 'meridians-acupoints'

/**
 * レビュー対象の候補か。名称一致だけでは名前なし出題（implicit）を落とすので、
 * キーワード・科目でも拾う。解説は当サイト作成文だが候補拾いには使う。
 * @param q 過去問JSONの1問
 * @param subject 分析CSVの subject（正規id）
 */
export function isCandidate(q, subject, acupoints) {
  if (namedMasterSlugs(q, acupoints).length > 0) return true
  if (subject === ACUPOINT_SUBJECT) return true
  if (KEYWORD_RE.test(normalizeText(officialText(q)))) return true
  const exp = q.explanation ?? ''
  return acupoints.some((a) => masterTerms(a).some((t) => containsTerm(exp, t)))
}
