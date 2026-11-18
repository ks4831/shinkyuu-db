/* ──────────────────────────────────────────────────────────────
   年度別過去問の「午前・午後」の区分と、結果画面の成績集計（クライアント・サーバー共通）

   区分の根拠（2026-11-18 確認・docs/past-exam-rights-memo.md にも記録）
   - 公式の問題PDFは各回とも午前・午後の2冊（docs/exams/XX/mondai_XX_harikyu_am.pdf / _pm.pdf）。
     表紙は「XX B 午前」「XX B 午後」、注意事項1は午前「試験問題は90問」、
     午後「試験問題は問題91〜180の90問」（第29〜34回の12冊すべてで目視確認）。
   - 収録データ（src/data/pastExams/exam-XX.json）の各問の sourceUrl は、その問題を転記した
     公式PDF（_am.pdf / _pm.pdf）を指している。区分はこの sourceUrl から決める
     （問題番号だけから90問ずつと決めつけない）。
   - 区分が読み取れない問題が1問でもある回・午前か午後が0問の回・問題番号が午前→午後の順に
     並ばない回では区分を使わず、従来どおり全問演習だけにする（splitPastExamParts が null）。
   ────────────────────────────────────────────────────────────── */

export type PastExamPart = 'am' | 'pm'
/** 年度別演習の範囲。all＝全問（従来の演習） */
export type PastExamScope = PastExamPart | 'all'

export const PAST_EXAM_PARTS: PastExamPart[] = ['am', 'pm']
export const PAST_EXAM_PART_LABEL: Record<PastExamPart, string> = { am: '午前', pm: '午後' }

/** 公式PDFのURL（…_am.pdf／…_pm.pdf）から区分を読む。読めなければ undefined */
export function pastExamPartFromSourceUrl(sourceUrl: string | undefined): PastExamPart | undefined {
  const m = /_(am|pm)\.pdf$/.exec(sourceUrl ?? '')
  return m ? (m[1] as PastExamPart) : undefined
}

export function isPastExamPart(v: unknown): v is PastExamPart {
  return v === 'am' || v === 'pm'
}

/** 区分ごとの範囲（HOME・一覧で問題データを読まずに進み具合を出すため、サーバー側で算出して渡す） */
export type PastExamPartRange = {
  part: PastExamPart
  count: number
  firstNumber: number
  lastNumber: number
}

type PartTagged = { questionNumber: number; part?: PastExamPart }

/**
 * 問題番号順の問題を午前・午後に分ける。区分が確認できない場合は null
 * （そのときは午前・午後の選択肢を出さない）。
 */
export function splitPastExamParts<T extends PartTagged>(questions: T[]): Record<PastExamPart, T[]> | null {
  if (questions.length === 0) return null
  if (questions.some((q) => !isPastExamPart(q.part))) return null
  const am = questions.filter((q) => q.part === 'am')
  const pm = questions.filter((q) => q.part === 'pm')
  if (am.length === 0 || pm.length === 0) return null
  // 午前の最後の問題より、午後の最初の問題の番号が後ろであること（混ざっていない）
  const amMax = Math.max(...am.map((q) => q.questionNumber))
  const pmMin = Math.min(...pm.map((q) => q.questionNumber))
  if (amMax >= pmMin) return null
  return { am, pm }
}

export function pastExamPartRanges<T extends PartTagged>(questions: T[]): PastExamPartRange[] | null {
  const split = splitPastExamParts(questions)
  if (!split) return null
  return PAST_EXAM_PARTS.map((part) => {
    const nums = split[part].map((q) => q.questionNumber)
    return { part, count: nums.length, firstNumber: Math.min(...nums), lastNumber: Math.max(...nums) }
  })
}

/* ── 成績の集計 ──────────────────────────────────────────────
   正答率＝正解数 ÷ 出題数（その範囲の全問題数）。未回答は得点なし（国家試験と同じ数え方）。
   全問に回答した場合は従来の「正解数 ÷ 問題数」と同じ値になる。
   未回答がある場合だけ、参考として「回答した問題の中での正答率」も出す。
   丸めは従来どおり Math.round（整数％）。 */
export type PastExamScore = {
  total: number
  answered: number
  correct: number
  wrong: number
  unanswered: number
  /** 正解数 ÷ 出題数（％・整数） */
  pct: number
  /** 正解数 ÷ 回答数（％・整数）。回答0問なら null */
  answeredPct: number | null
}

/** results は出題順の正誤（未回答は null／undefined） */
export function scorePastExam(results: readonly (boolean | null | undefined)[]): PastExamScore {
  const total = results.length
  const correct = results.filter((r) => r === true).length
  const wrong = results.filter((r) => r === false).length
  const answered = correct + wrong
  return {
    total,
    answered,
    correct,
    wrong,
    unanswered: total - answered,
    pct: total ? Math.round((correct / total) * 100) : 0,
    answeredPct: answered ? Math.round((correct / answered) * 100) : null,
  }
}
