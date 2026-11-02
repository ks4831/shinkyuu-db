/* ──────────────────────────────────────────────────────────────
   オリジナル模擬試験（サイト独自の問題）の型・採点・結果の保存
   - 国家試験の過去問（pastExam*）・予想問題（quiz*）とは別の問題・別のキー。
     既存の学習記録の集計には混ぜない。
   - 保存するのは模擬試験ごとの直近の結果だけ。個人情報は保存しない。
   ────────────────────────────────────────────────────────────── */

/**
 * 結果の保存キー。
 * - v1：模擬試験②が40問だったときの結果（2026-10-27〜）。**読むだけで、書き込み・削除はしない**（40問版の成績として残す）
 * - v2：2026-11 の58問化以降の結果。新しい結果はここにだけ保存する（v1 を上書きしない）
 */
export const ORIGINAL_MOCK_LEGACY_RESULT_KEY = 'shinkyuu_original_mock_results_v1'
export const ORIGINAL_MOCK_RESULT_KEY = 'shinkyuu_original_mock_results_v2'

export type OriginalMockQuestion = {
  /** om02-01 のように、模擬試験の番号と問題番号から作る（過去問・予想問題のIDと重ならない） */
  id: string
  workId: string
  questionNumber: number
  subject: string
  field: string
  questionText: string
  choices: string[]
  answerIndex: number
  /** 選択肢ごとの解説（choices と同じ順） */
  choiceNotes: string[]
  point: string
  sources: string[]
}

export type OriginalMockData = {
  mockId: string
  title: string
  status: string
  questions: OriginalMockQuestion[]
}

export type OriginalMockAnswer = { questionId: string; selected: number; correct: boolean }

export type SubjectScore = { subject: string; correct: number; total: number }

export function isOriginalMockCorrect(q: OriginalMockQuestion, selected: number): boolean {
  return selected === q.answerIndex
}

/** 科目ごとの正答数（科目は出題順に並べる） */
export function scoreBySubject(questions: OriginalMockQuestion[], answers: OriginalMockAnswer[]): SubjectScore[] {
  const byId = new Map(answers.map((a) => [a.questionId, a]))
  const rows: SubjectScore[] = []
  for (const q of questions) {
    let row = rows.find((r) => r.subject === q.subject)
    if (!row) rows.push((row = { subject: q.subject, correct: 0, total: 0 }))
    row.total++
    if (byId.get(q.id)?.correct) row.correct++
  }
  return rows
}

export type OriginalMockResult = {
  mockId: string
  correct: number
  total: number
  wrongIds: string[]
  /** 完了日時（epoch ms） */
  completedAt: number
}

/** 保存データ1件の形を確かめる。壊れていれば null（画面は「結果なし」として扱う） */
function toResult(mockId: string, v: unknown): OriginalMockResult | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const r = v as Record<string, unknown>
  const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0
  if (!isCount(r.correct) || !isCount(r.total) || r.total === 0 || r.correct > r.total) return null
  if (!Array.isArray(r.wrongIds) || !r.wrongIds.every((x) => typeof x === 'string')) return null
  return {
    mockId,
    correct: r.correct,
    total: r.total,
    wrongIds: r.wrongIds as string[],
    completedAt: typeof r.completedAt === 'number' ? r.completedAt : 0,
  }
}

function readAll(key: string): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(key)
    const obj = raw ? JSON.parse(raw) : {}
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}
  } catch {
    return {}
  }
}

/** 58問化以降の直近の結果（v2） */
export function getOriginalMockResult(mockId: string): OriginalMockResult | null {
  return toResult(mockId, readAll(ORIGINAL_MOCK_RESULT_KEY)[mockId])
}

/** 58問化より前（40問のとき）の結果（v1。読むだけ） */
export function getLegacyOriginalMockResult(mockId: string): OriginalMockResult | null {
  return toResult(mockId, readAll(ORIGINAL_MOCK_LEGACY_RESULT_KEY)[mockId])
}

/** 全問を解き終えたときだけ保存する（苦手だけの再挑戦は保存しない）。保存先は v2 だけ */
export function saveOriginalMockResult(result: OriginalMockResult) {
  if (typeof window === 'undefined') return
  try {
    const all = readAll(ORIGINAL_MOCK_RESULT_KEY)
    all[result.mockId] = result
    window.localStorage.setItem(ORIGINAL_MOCK_RESULT_KEY, JSON.stringify(all))
  } catch {
    /* 保存できない環境では黙って無視 */
  }
}
