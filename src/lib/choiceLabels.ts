/* ──────────────────────────────────────────────────────────────
   選択肢ラベルの共通定義と、解説中の「位置による選択肢参照」の検出。
   - 過去問：公式の順のまま ①〜④ で表示する（並べ替えない）
   - 予想問題：A〜E で表示し、毎回シャッフルする
     → 予想問題の解説は位置（①・2・Bなど）で選択肢を指してはいけない。
        選択肢の内容（「…」の引用・疾患名など）で書く。
   検出関数は scripts/audit-data.mjs から使う。正答判定には関与しない。
   ────────────────────────────────────────────────────────────── */

export const PAST_EXAM_CHOICE_LABELS = ['①', '②', '③', '④'] as const
export const QUIZ_CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E'] as const

export type ChoiceRefHit = { match: string; index: number }

/* 位置で選択肢を指す既知のパターン（誤検知を避けるため、記号の前は文頭・句読点・括弧に限る） */
const BOUNDARY = '(?:^|[。、，,；;：:\\s（(「])'
const POSITIONAL_PATTERNS: RegExp[] = [
  // 「選択肢3」「選択肢B」「選択肢②」
  /選択肢\s*[1-5１-５A-EＡ-Ｅ①-⑤]/g,
  // 「②は」「③では」「④の」（丸数字の直後が助詞）／「②無痛性血尿は」（丸数字＋短い語句＋は）
  /[①-⑤](?=\s*(?:は|では|が|も|の|＝|=|：|:)|[^①-⑤。、\n]{1,20}?(?:は|では))/g,
  // 「2は心」「3は萎縮」（文頭・句読点の直後の算用数字＋助詞）
  new RegExp(BOUNDARY + '[1-5１-５](?=\\s*(?:は|では|が|も|の説明|の所見))', 'g'),
  // 「Bが正しい」「Cは誤り」「Aは」（文頭・句読点の直後の英字1文字＋助詞）
  new RegExp(BOUNDARY + '[A-EＡ-Ｅ](?=\\s*(?:は|では|が正し|が誤|が正解|も))', 'g'),
]

/** 位置で選択肢を指していると思われる箇所（予想問題では ERROR、過去問では ①〜④ 以外を ERROR にする） */
export function findPositionalChoiceRefs(text: string): ChoiceRefHit[] {
  const hits: ChoiceRefHit[] = []
  for (const re of POSITIONAL_PATTERNS) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      hits.push({ match: m[0].replace(/^[。、，,；;：:\s（(「]/, ''), index: m.index })
    }
  }
  return hits.sort((a, b) => a.index - b.index)
}

/** 「…」の選択肢 という形で引用した語句（予想問題の解説で、選択肢本文の部分文字列であるべきもの） */
export function findQuotedChoicePhrases(text: string): string[] {
  const out: string[] = []
  const re = /「([^「」]+)」の選択肢/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) out.push(m[1])
  return out
}

/** 解説が「公式正答は③…」「正答は②」と書いている番号（過去問の正答との照合用） */
export function findStatedAnswerLabels(text: string): number[] {
  const out: number[] = []
  const re = /(?:公式正答|正答|正解)は\s*([①-④])/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) out.push(PAST_EXAM_CHOICE_LABELS.indexOf(m[1] as (typeof PAST_EXAM_CHOICE_LABELS)[number]))
  return out
}
