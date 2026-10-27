/* ──────────────────────────────────────────────────────────────
   オリジナル模擬試験（サイト独自の問題）の型・採点・結果の保存
   - 国家試験の過去問（pastExam*）・予想問題（quiz*）とは別の問題・別のキー。
     既存の学習記録の集計には混ぜない。
   - 保存するのは模擬試験ごとの直近の結果だけ。個人情報は保存しない。
   ────────────────────────────────────────────────────────────── */

export const ORIGINAL_MOCK_RESULT_KEY = 'shinkyuu_original_mock_results_v1'

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

function readAll(): Record<string, OriginalMockResult> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(ORIGINAL_MOCK_RESULT_KEY)
    const obj = raw ? JSON.parse(raw) : {}
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}
  } catch {
    return {}
  }
}

export function getOriginalMockResult(mockId: string): OriginalMockResult | null {
  return readAll()[mockId] ?? null
}

/** 全問を解き終えたときだけ保存する（苦手だけの再挑戦は保存しない） */
export function saveOriginalMockResult(result: OriginalMockResult) {
  if (typeof window === 'undefined') return
  try {
    const all = readAll()
    all[result.mockId] = result
    window.localStorage.setItem(ORIGINAL_MOCK_RESULT_KEY, JSON.stringify(all))
  } catch {
    /* 保存できない環境では黙って無視 */
  }
}
