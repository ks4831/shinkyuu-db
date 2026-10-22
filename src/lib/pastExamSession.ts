'use client'

/* ──────────────────────────────────────────────────────────────
   過去問演習の「学習セッション」LocalStorage管理
   - src/lib/pastExamStorage.ts の shinkyuu_pastexam_history_v1（回答履歴ログ・
     questionId単位で追記のみ）とは役割が異なる別キー。あちらは将来の苦手復習・
     成績機能向けの生ログとして保護し、今回は一切変更しない。
   - こちらは「今どの年度をどこまで進めているか」という現在の学習セッション状態を
     年度（examRound）単位で保持し、「続きから再開」を実現するためだけに使う。
   - 個人情報は保存しない。端末内のみ。SSR / プライベートモード / 壊れたJSONでも
     ページ全体をクラッシュさせない。
   ────────────────────────────────────────────────────────────── */

export const PAST_EXAM_SESSION_KEY = 'shinkyuu_pastexam_session_v1'

export type PastExamSessionAnswer = {
  questionId: string
  questionNumber: number
  correct: boolean
}

export type PastExamSession = {
  examRound: number
  /** 回答済み設問（回答順・questionIdの重複なし） */
  answers: PastExamSessionAnswer[]
  /** Q最終問まで回答し結果画面に到達したか */
  completed: boolean
  updatedAt: number
}

type SessionMap = Record<string, PastExamSession>

function isValidAnswer(a: unknown): a is PastExamSessionAnswer {
  if (!a || typeof a !== 'object') return false
  const o = a as Record<string, unknown>
  return (
    typeof o.questionId === 'string' &&
    typeof o.questionNumber === 'number' &&
    typeof o.correct === 'boolean'
  )
}

function isValidSession(s: unknown, round: number): s is PastExamSession {
  if (!s || typeof s !== 'object') return false
  const o = s as Record<string, unknown>
  return (
    o.examRound === round &&
    Array.isArray(o.answers) &&
    o.answers.every(isValidAnswer) &&
    typeof o.completed === 'boolean' &&
    typeof o.updatedAt === 'number'
  )
}

function readAll(): SessionMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(PAST_EXAM_SESSION_KEY)
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
    window.localStorage.setItem(PAST_EXAM_SESSION_KEY, JSON.stringify(map))
  } catch {
    /* 保存できない環境では黙って無視 */
  }
}

/**
 * 指定回の保存済みセッションを取得する。
 * 壊れたJSON・旧schema・回が一致しない等、少しでも形が合わなければ null を返す
 * （不正データはそのセッションが無いものとして安全に無視する）。
 */
export function getPastExamSession(round: number): PastExamSession | null {
  const map = readAll()
  const s = map[String(round)]
  return isValidSession(s, round) ? s : null
}

/**
 * 1問に回答が確定した時点で呼ぶ（「次の問題へ」を待たない）。
 * 同一questionIdが既にあれば上書き（二重追加防止）、無ければ追記する。
 * ユーザーの実際の回答操作からのみ呼ばれ、状態復元経路からは呼ばない。
 */
export function savePastExamProgress(round: number, answer: PastExamSessionAnswer): void {
  const map = readAll()
  const current = isValidSession(map[String(round)], round)
    ? map[String(round)]
    : { examRound: round, answers: [], completed: false, updatedAt: 0 }
  const answers = current.answers.filter((a) => a.questionId !== answer.questionId)
  answers.push(answer)
  map[String(round)] = { examRound: round, answers, completed: false, updatedAt: Date.now() }
  writeAll(map)
}

/** 最終問まで到達し結果画面に進んだ時点で呼ぶ。以後「続きから」の対象から外れる */
export function markPastExamSessionCompleted(round: number): void {
  const map = readAll()
  const current = isValidSession(map[String(round)], round)
    ? map[String(round)]
    : { examRound: round, answers: [], completed: false, updatedAt: 0 }
  map[String(round)] = { ...current, completed: true, updatedAt: Date.now() }
  writeAll(map)
}

/**
 * 「最初から解く」「もう一度解く」時に呼ぶ。その年度のセッションのみ削除する。
 * shinkyuu_pastexam_history_v1（回答履歴）には一切触れない。
 */
export function resetPastExamSession(round: number): void {
  const map = readAll()
  delete map[String(round)]
  writeAll(map)
}

/* ── HOME・過去問一覧向けの読み取り専用サマリー ──────────────────
   問題データ（1回180問）を読み込まずに、保存済みセッションだけから
   「何問目まで進んだか」「次はどの問題か」を出す。書き込みは一切しない。
   収録データは各回とも問1から連番（scripts/test-pastexam-resume.mts で検査）なので、
   回答済みの問題番号が 1..n の連番であることを、Runner の「先頭からの連続一致」
   （questionId 照合）と同じ条件として扱う。 */

export type PastExamSessionSummary = {
  examRound: number
  /** in-progress＝途中（続きから解ける）／completed＝全問回答済み */
  status: 'in-progress' | 'completed'
  answered: number
  correct: number
  total: number
  /** 次に解く問題番号（未回答の最初の問題）。completed では total + 1 */
  nextQuestionNumber: number
  updatedAt: number
}

/**
 * 1回分のセッションを要約する。形が合わない（連番でない・収録数を超える等）場合は
 * Runner 側でも再開対象にならないため null を返す。
 * completed フラグが立っていなくても全問回答済みなら completed として扱う
 * （最終問に回答したあと「結果を見る」を押さずに閉じた場合）。
 */
export function summarizePastExamSession(s: PastExamSession, total: number): PastExamSessionSummary | null {
  if (total <= 0) return null
  const numbers = s.answers.map((a) => a.questionNumber).sort((a, b) => a - b)
  if (numbers.length === 0 || numbers.length > total) return null
  if (!numbers.every((n, i) => n === i + 1)) return null
  const completed = numbers.length === total
  if (s.completed && !completed) return null
  return {
    examRound: s.examRound,
    status: completed ? 'completed' : 'in-progress',
    answered: numbers.length,
    correct: s.answers.filter((a) => a.correct).length,
    total,
    nextQuestionNumber: numbers.length + 1,
    updatedAt: s.updatedAt,
  }
}

/** 保存済みの全回のサマリー（新しく学習した順）。totals は回ごとの演習可能数 */
export function listPastExamSessionSummaries(totals: Record<number, number>): PastExamSessionSummary[] {
  const list: PastExamSessionSummary[] = []
  for (const key of Object.keys(totals)) {
    const round = Number(key)
    const s = getPastExamSession(round)
    const summary = s ? summarizePastExamSession(s, totals[round]) : null
    if (summary) list.push(summary)
  }
  return list.sort((a, b) => b.updatedAt - a.updatedAt)
}
