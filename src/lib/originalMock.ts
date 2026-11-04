/* ──────────────────────────────────────────────────────────────
   オリジナル模擬試験（サイト独自の問題）の型・採点・結果の保存
   - 国家試験の過去問（pastExam*）・予想問題（quiz*）とは別の問題・別のキー。
     既存の学習記録の集計には混ぜない。
   - 保存するのは模擬試験ごとの直近の結果だけ。個人情報は保存しない。
   ────────────────────────────────────────────────────────────── */

import { parseMockSession, type MockSession } from './mockSession'

/**
 * 結果の保存キー。問題数を変えるたびに新しいキーへ保存し、前の版の結果は**読むだけで、書き込み・削除はしない**。
 * - v1：模擬試験②が40問だったときの結果（2026-10-27〜）
 * - v2：58問だったときの結果（2026-11-02〜）
 * - v3：68問だったときの結果（2026-11-02〜）
 * - v4：80問だったときの結果（2026-11-03〜）
 * - v5：100問化以降の結果（2026-11-03〜）。新しい結果はここにだけ保存する
 */
export const ORIGINAL_MOCK_RESULT_KEY = 'shinkyuu_original_mock_results_v5'
/** 前の版の保存キー（新しい順） */
export const ORIGINAL_MOCK_LEGACY_RESULT_KEYS = [
  'shinkyuu_original_mock_results_v4',
  'shinkyuu_original_mock_results_v3',
  'shinkyuu_original_mock_results_v2',
  'shinkyuu_original_mock_results_v1',
] as const

/**
 * 見直し用の記録の保存キー。直近の全問の結果について「まちがえた問題で選んだ選択肢」だけを持つ。
 * 成績（v1〜v5）とは別のキーで、成績の読み書きには影響しない。
 */
export const ORIGINAL_MOCK_REVIEW_KEY = 'shinkyuu_original_mock_review_v1'

/**
 * 科目別に解いた結果の保存キー。科目ごとの直近の結果を持つ。全問の成績（v1〜v5）とは別のキーで、互いに上書きしない。
 */
export const ORIGINAL_MOCK_SUBJECT_RESULT_KEY = 'shinkyuu_original_mock_subject_results_v1'

/**
 * 解答途中の自動保存のキー。全問と科目ごとに別々の枠を持ち、採点すると消す。成績のキーには触れない。
 */
export const ORIGINAL_MOCK_PROGRESS_KEY = 'shinkyuu_original_mock_progress_v1'

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

/** 現在の版の直近の結果（v5） */
export function getOriginalMockResult(mockId: string): OriginalMockResult | null {
  return toResult(mockId, readAll(ORIGINAL_MOCK_RESULT_KEY)[mockId])
}

/** 前の版（80問・68問・58問・40問）の結果。読むだけ。新しい版から順に、壊れていないものだけを返す */
export function getLegacyOriginalMockResults(mockId: string): OriginalMockResult[] {
  return ORIGINAL_MOCK_LEGACY_RESULT_KEYS.map((k) => toResult(mockId, readAll(k)[mockId])).filter((r): r is OriginalMockResult => r !== null)
}

/** 全問を解き終えたときだけ保存する（苦手だけの再挑戦は保存しない）。保存先は v5 だけ */
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

/** 問題ID → 選んだ選択肢（0〜3）。まちがえた問題のうち回答したものだけ */
export type OriginalMockSelections = Record<string, number>

/** 直近の結果の見直し用記録を保存する。成績のキー（v1〜v5）には触れない */
export function saveOriginalMockReview(mockId: string, completedAt: number, selected: OriginalMockSelections) {
  if (typeof window === 'undefined') return
  try {
    const all = readAll(ORIGINAL_MOCK_REVIEW_KEY)
    all[mockId] = { completedAt, selected }
    window.localStorage.setItem(ORIGINAL_MOCK_REVIEW_KEY, JSON.stringify(all))
  } catch {
    /* 保存できない環境では黙って無視 */
  }
}

/** その結果（completedAt で対応づける）の見直し用記録。無い・壊れている・別の回の記録なら null */
export function getOriginalMockReview(mockId: string, completedAt: number): OriginalMockSelections | null {
  const v = readAll(ORIGINAL_MOCK_REVIEW_KEY)[mockId]
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const r = v as Record<string, unknown>
  if (r.completedAt !== completedAt) return null
  const selected = r.selected
  if (!selected || typeof selected !== 'object' || Array.isArray(selected)) return null
  const ok = Object.values(selected).every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 3)
  return ok ? (selected as OriginalMockSelections) : null
}

export type SubjectQuestions = { subject: string; questions: OriginalMockQuestion[] }

/** 科目ごとの問題（科目は最初に出てくる順、科目内は元データの順） */
export function questionsBySubject(questions: OriginalMockQuestion[]): SubjectQuestions[] {
  const rows: SubjectQuestions[] = []
  for (const q of questions) {
    let row = rows.find((r) => r.subject === q.subject)
    if (!row) rows.push((row = { subject: q.subject, questions: [] }))
    row.questions.push(q)
  }
  return rows
}

/**
 * 問題の内容の指紋。問題文・選択肢・正答が変わると値が変わり、古い途中データ・見直し用の記録を使わないようにする
 * （選択の番号が別の選択肢を指してしまうのを防ぐ）。解説だけの修正では変わらない。改ざん検知の用途ではない。
 */
export function questionsFingerprint(questions: OriginalMockQuestion[]): string {
  const text = JSON.stringify(questions.map((q) => [q.id, q.questionText, q.choices, q.answerIndex]))
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `${questions.length}-${(h >>> 0).toString(16)}`
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

export type OriginalMockSubjectResult = OriginalMockResult & {
  subject: string
  fingerprint: string
  /** まちがえた問題で選んだ選択肢（未回答の問題は含まない） */
  selected: OriginalMockSelections
}

/** 科目の直近の結果。壊れている・今の問題と合わないときは null */
export function getOriginalMockSubjectResult(mockId: string, subject: string, questions: OriginalMockQuestion[]): OriginalMockSubjectResult | null {
  const raw = asRecord(asRecord(readAll(ORIGINAL_MOCK_SUBJECT_RESULT_KEY)[mockId])[subject])
  const base = toResult(mockId, raw)
  if (!base || raw.fingerprint !== questionsFingerprint(questions)) return null
  const ids = new Set(questions.map((q) => q.id))
  if (base.total !== questions.length || base.correct !== base.total - base.wrongIds.length || !base.wrongIds.every((id) => ids.has(id))) return null
  const selected = raw.selected
  if (!selected || typeof selected !== 'object' || Array.isArray(selected)) return null
  const entries = Object.entries(selected)
  if (!entries.every(([id, n]) => base.wrongIds.includes(id) && typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 3)) return null
  return { ...base, subject, fingerprint: raw.fingerprint as string, selected: selected as OriginalMockSelections }
}

/** 科目の結果を保存する。保存先は科目別のキーだけで、全問の成績（v1〜v5）・見直しの記録には触れない */
export function saveOriginalMockSubjectResult(result: OriginalMockSubjectResult) {
  if (typeof window === 'undefined') return
  try {
    const all = readAll(ORIGINAL_MOCK_SUBJECT_RESULT_KEY)
    all[result.mockId] = { ...asRecord(all[result.mockId]), [result.subject]: result }
    window.localStorage.setItem(ORIGINAL_MOCK_SUBJECT_RESULT_KEY, JSON.stringify(all))
  } catch {
    /* 保存できない環境では黙って無視 */
  }
}

/** 途中データの枠。subject が null なら全問、文字列ならその科目 */
const progressSlot = (mockId: string, subject: string | null) => (subject === null ? `${mockId}/full` : `${mockId}/subject/${subject}`)

/** 途中経過を保存する。保存できたら true（保存できない環境では false） */
export function saveOriginalMockProgress(mockId: string, subject: string | null, questions: OriginalMockQuestion[], session: MockSession): boolean {
  if (typeof window === 'undefined') return false
  try {
    const all = readAll(ORIGINAL_MOCK_PROGRESS_KEY)
    all[progressSlot(mockId, subject)] = { fingerprint: questionsFingerprint(questions), savedAt: Date.now(), session }
    window.localStorage.setItem(ORIGINAL_MOCK_PROGRESS_KEY, JSON.stringify(all))
    return true
  } catch {
    return false
  }
}

/** 途中経過を読む。壊れている・今の問題と合わないときは null（画面は「途中データなし」として扱う） */
export function getOriginalMockProgress(mockId: string, subject: string | null, questions: OriginalMockQuestion[]): MockSession | null {
  const raw = asRecord(readAll(ORIGINAL_MOCK_PROGRESS_KEY)[progressSlot(mockId, subject)])
  if (raw.fingerprint !== questionsFingerprint(questions)) return null
  return parseMockSession(raw.session, questions.map((q) => q.id))
}

/** 採点が済んだ枠の途中経過を消す（ほかの枠には触れない） */
export function clearOriginalMockProgress(mockId: string, subject: string | null) {
  if (typeof window === 'undefined') return
  try {
    const all = readAll(ORIGINAL_MOCK_PROGRESS_KEY)
    delete all[progressSlot(mockId, subject)]
    window.localStorage.setItem(ORIGINAL_MOCK_PROGRESS_KEY, JSON.stringify(all))
  } catch {
    /* 保存できない環境では黙って無視 */
  }
}
