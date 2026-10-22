'use client'

/* ──────────────────────────────────────────────────────────────
   科目別過去問（/past-exams/subject/[subjectId]）の「学習セッション」LocalStorage管理
   - 年度別の shinkyuu_pastexam_session_v1（pastExamSession.ts）とは別キー。年度別の記録には触れない
   - 回答履歴ログ shinkyuu_pastexam_history_v1 とも別。こちらは「どの科目をどこまで進めたか」だけを持つ
   - 科目別の出題順は「年度 → 問題番号」の固定順（ランダムではない）。ただし問題データの更新で
     科目に問題が増減しても途中の記録が壊れないよう、開始時の出題順（questionId の列）を一緒に保存し、
     再開時はその順を基準に並べ直す（resolveSubjectSession）
   - 個人情報は保存しない。端末内のみ。SSR / プライベートモード / 壊れたJSONでもクラッシュさせない
   ────────────────────────────────────────────────────────────── */

export const PAST_EXAM_SUBJECT_SESSION_KEY = 'shinkyuu_pastexam_subject_session_v1'

export type SubjectSessionAnswer = {
  questionId: string
  correct: boolean
}

export type PastExamSubjectSession = {
  subjectId: string
  /** 開始時の出題順（questionId）。再開時の並び順の基準 */
  order: string[]
  /** 回答済み設問（出題順・questionIdの重複なし） */
  answers: SubjectSessionAnswer[]
  /** 最後の問題まで回答し結果画面に到達したか */
  completed: boolean
  updatedAt: number
}

type SessionMap = Record<string, PastExamSubjectSession>

const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

function isValidAnswer(a: unknown): a is SubjectSessionAnswer {
  if (!a || typeof a !== 'object') return false
  const o = a as Record<string, unknown>
  return typeof o.questionId === 'string' && typeof o.correct === 'boolean'
}

function isValidSession(s: unknown, subjectId: string): s is PastExamSubjectSession {
  if (!s || typeof s !== 'object') return false
  const o = s as Record<string, unknown>
  return (
    o.subjectId === subjectId &&
    isStrList(o.order) &&
    Array.isArray(o.answers) &&
    o.answers.every(isValidAnswer) &&
    typeof o.completed === 'boolean' &&
    typeof o.updatedAt === 'number'
  )
}

function readAll(): SessionMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(PAST_EXAM_SUBJECT_SESSION_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as SessionMap
  } catch {
    return {}
  }
}

function writeAll(map: SessionMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PAST_EXAM_SUBJECT_SESSION_KEY, JSON.stringify(map))
  } catch {
    /* 保存できない環境では黙って無視 */
  }
}

/** 指定科目の保存済みセッション。形が合わなければ null（不正データは無いものとして扱い、消さない） */
export function getPastExamSubjectSession(subjectId: string): PastExamSubjectSession | null {
  const s = readAll()[subjectId]
  return isValidSession(s, subjectId) ? s : null
}

/**
 * 1問に回答が確定した時点で呼ぶ。order は現在の出題順（questionId の列）。
 * 同じ questionId があれば置き換え（二重に数えない）、なければ追記する。
 * ユーザーの回答操作からのみ呼ばれ、状態の復元経路からは呼ばない。
 */
export function savePastExamSubjectProgress(subjectId: string, order: string[], answer: SubjectSessionAnswer): void {
  const map = readAll()
  const current = isValidSession(map[subjectId], subjectId) ? map[subjectId] : null
  const answers = (current?.answers ?? []).filter((a) => a.questionId !== answer.questionId)
  answers.push(answer)
  map[subjectId] = { subjectId, order, answers, completed: false, updatedAt: Date.now() }
  writeAll(map)
}

/** 最後の問題まで回答し結果画面に進んだ時点で呼ぶ */
export function markPastExamSubjectSessionCompleted(subjectId: string): void {
  const map = readAll()
  const current = map[subjectId]
  if (!isValidSession(current, subjectId)) return
  map[subjectId] = { ...current, completed: true, updatedAt: Date.now() }
  writeAll(map)
}

/**
 * 「最初から解く」「もう一度解く」で呼ぶ。その科目のセッションだけを削除する。
 * 年度別のセッション・回答履歴（shinkyuu_pastexam_history_v1）には触れない。
 */
export function resetPastExamSubjectSession(subjectId: string): void {
  const map = readAll()
  if (!(subjectId in map)) return
  delete map[subjectId]
  writeAll(map)
}

/* ── 再開時の並べ直し ──────────────────────────────────────── */

export type ResolvedSubjectSession = {
  /** 再開に使う出題順。保存時の順から、いまのデータにない問題を除き、新しく増えた問題を末尾に足したもの */
  order: string[]
  /** 回答済み（order の先頭から連続）。いまのデータにない問題の回答は数えない（保存データからは消さない） */
  answers: SubjectSessionAnswer[]
  status: 'in-progress' | 'completed'
}

/**
 * 保存済みセッションを、いまの問題データ（currentIds＝現在の出題順）に合わせて解釈する。
 * 回答済みの問題が出題順の先頭から連続していない（壊れた・編集された）場合は null。
 * 書き込みは一切しない。
 */
export function resolveSubjectSession(s: PastExamSubjectSession, currentIds: string[]): ResolvedSubjectSession | null {
  if (currentIds.length === 0) return null
  const current = new Set(currentIds)
  const kept = s.order.filter((id, i) => current.has(id) && s.order.indexOf(id) === i)
  const keptSet = new Set(kept)
  const order = [...kept, ...currentIds.filter((id) => !keptSet.has(id))]
  const byId = new Map<string, SubjectSessionAnswer>()
  for (const a of s.answers) if (current.has(a.questionId)) byId.set(a.questionId, a)
  const n = byId.size
  if (n === 0) return null
  const answers: SubjectSessionAnswer[] = []
  for (let i = 0; i < n; i++) {
    const a = byId.get(order[i])
    if (!a) return null
    answers.push(a)
  }
  return { order, answers, status: n === order.length ? 'completed' : 'in-progress' }
}

/* ── HOME・科目一覧向けの読み取り専用サマリー ──────────────────
   問題データを読み込まずに、保存済みセッションと科目ごとの現在の問題数だけから出す。 */

export type PastExamSubjectSessionSummary = {
  subjectId: string
  status: 'in-progress' | 'completed'
  answered: number
  correct: number
  total: number
  updatedAt: number
}

/**
 * 1科目分を要約する。保存時の出題順に含まれる回答だけを数える。
 * 問題データが更新されて数が合わない場合も、回答数は total を超えない。
 */
export function summarizeSubjectSession(s: PastExamSubjectSession, total: number): PastExamSubjectSessionSummary | null {
  if (total <= 0) return null
  const inOrder = new Set(s.order)
  const seen = new Set<string>()
  const answers = s.answers.filter((a) => inOrder.has(a.questionId) && !seen.has(a.questionId) && seen.add(a.questionId))
  if (answers.length === 0) return null
  const answered = Math.min(answers.length, total)
  return {
    subjectId: s.subjectId,
    status: answered >= total ? 'completed' : 'in-progress',
    answered,
    correct: Math.min(answers.filter((a) => a.correct).length, answered),
    total,
    updatedAt: s.updatedAt,
  }
}

/** 保存済みの全科目のサマリー（新しく学習した順）。totals は科目ごとの現在の問題数 */
export function listSubjectSessionSummaries(totals: Record<string, number>): PastExamSubjectSessionSummary[] {
  const list: PastExamSubjectSessionSummary[] = []
  for (const subjectId of Object.keys(totals)) {
    const s = getPastExamSubjectSession(subjectId)
    const summary = s ? summarizeSubjectSession(s, totals[subjectId]) : null
    if (summary) list.push(summary)
  }
  return list.sort((a, b) => b.updatedAt - a.updatedAt)
}
