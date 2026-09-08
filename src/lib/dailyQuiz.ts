'use client'

/* ──────────────────────────────────────────────────────────────
   「今日の10問」の LocalStorage 管理（端末内のみ・個人情報なし）
   - 日付判定は Asia/Tokyo 固定（国家試験受験生向け）
   - 既存キー（quiz history / weak / review / dashboard）は一切変更しない。
     本モジュールのキーを新規追加するだけ。
   ────────────────────────────────────────────────────────────── */
import { ALL_QUESTIONS, type QuizQuestion } from './quiz'
import { getWeakIds, getReviewIds, getHistory } from './quizStorage'
import { selectDailyQuestionIds, DAILY_COUNT } from './dailySelect'

export const DAILY_STATE_KEY = 'shinkyuu_daily_quiz_v1'
export const DAILY_HISTORY_KEY = 'shinkyuu_daily_history_v1'
export const DAILY_STREAK_KEY = 'shinkyuu_daily_streak_v1'
export { DAILY_COUNT }

/* ── Asia/Tokyo 日付 ─────────────────────────────────────── */

const TOKYO_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Asia/Tokyo の YYYY-MM-DD */
export function tokyoDateKey(d: Date = new Date()): string {
  // en-CA は "YYYY-MM-DD" 形式
  return TOKYO_FMT.format(d)
}

/** Asia/Tokyo で n 日前（負なら未来）の YYYY-MM-DD */
export function tokyoDateKeyOffset(days: number, base: Date = new Date()): string {
  return tokyoDateKey(new Date(base.getTime() + days * 86400000))
}

/* ── 汎用 read/write ─────────────────────────────────────── */

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event('shinkyuu-quiz-change'))
  } catch {
    /* private mode 等では黙って無視 */
  }
}

/* ── 型 ─────────────────────────────────────────────────── */

export type DailyState = {
  date: string
  questionIds: string[]
  /** 各問の結果。null=未回答 / true=正解 / false=不正解 */
  answers: (boolean | null)[]
  currentIndex: number
  completed: boolean
}

export type DailyStreak = {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string
}

export type DailyHistoryEntry = {
  date: string
  correct: number
  total: number
  completed: boolean
}

const EMPTY_STREAK: DailyStreak = { currentStreak: 0, longestStreak: 0, lastCompletedDate: '' }

/* ── 選定 ─────────────────────────────────────────────────
   themeExamCount はサーバーコンポーネントから注入する（fs を使うため）。
   window に載せておき、client から参照する。 */
function getThemeExamCount(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  const w = window as unknown as { __SHINKYUU_THEME_EXAM_COUNT__?: Record<string, number> }
  return w.__SHINKYUU_THEME_EXAM_COUNT__ ?? {}
}

export function setThemeExamCount(map: Record<string, number>) {
  if (typeof window === 'undefined') return
  ;(window as unknown as { __SHINKYUU_THEME_EXAM_COUNT__?: Record<string, number> }).__SHINKYUU_THEME_EXAM_COUNT__ = map
}

function generateForToday(): DailyState {
  const date = tokyoDateKey()
  const recent = getHistory()
    .attempts.slice(-30)
    .reverse()
    .map((a) => a.qid)
  const weakIds = [...new Set([...getWeakIds(), ...getReviewIds()])]
  const ids = selectDailyQuestionIds({
    all: ALL_QUESTIONS,
    themeExamCount: getThemeExamCount(),
    seed: date,
    weakIds,
    recentQids: recent,
  })
  return { date, questionIds: ids, answers: ids.map(() => null), currentIndex: 0, completed: false }
}

/** 今日の DailyState を返す（無ければ生成して保存） */
export function getOrCreateDailyState(): DailyState {
  const today = tokyoDateKey()
  const cur = read<DailyState | null>(DAILY_STATE_KEY, null)
  if (cur && cur.date === today && Array.isArray(cur.questionIds) && cur.questionIds.length === DAILY_COUNT) {
    return {
      ...cur,
      answers: Array.isArray(cur.answers) && cur.answers.length === DAILY_COUNT ? cur.answers : cur.questionIds.map(() => null),
      currentIndex: typeof cur.currentIndex === 'number' ? cur.currentIndex : 0,
      completed: Boolean(cur.completed),
    }
  }
  // 日付が変わった or 未生成：前日分を履歴へ退避してから新規生成
  if (cur && cur.date !== today) archiveDailyState(cur)
  const next = generateForToday()
  write(DAILY_STATE_KEY, next)
  return next
}

/** 生成済みの当日 state を読むだけ（無ければ null） */
export function peekDailyState(): DailyState | null {
  const cur = read<DailyState | null>(DAILY_STATE_KEY, null)
  return cur && cur.date === tokyoDateKey() ? cur : null
}

/** 今日の10問の QuizQuestion（保存された並び順で） */
export function resolveDailyQuestions(state: DailyState): QuizQuestion[] {
  const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]))
  return state.questionIds.map((id) => byId.get(id)).filter((q): q is QuizQuestion => Boolean(q))
}

/* ── 回答の記録 ─────────────────────────────────────────── */

/** index 番目の問題の結果を保存し、currentIndex を進める */
export function recordDailyAnswer(index: number, correct: boolean) {
  const state = getOrCreateDailyState()
  if (index < 0 || index >= DAILY_COUNT) return
  state.answers[index] = correct
  state.currentIndex = Math.max(state.currentIndex, index + 1)
  write(DAILY_STATE_KEY, state)
}

/** 10問すべて回答済みなら completed にし、streak / 履歴を更新する（1日1回のみ加算） */
export function finalizeDailyIfComplete(): DailyState {
  const state = getOrCreateDailyState()
  const allAnswered = state.answers.every((a) => a === true || a === false)
  if (!allAnswered || state.completed) return state

  state.completed = true
  write(DAILY_STATE_KEY, state)

  const correct = state.answers.filter((a) => a === true).length
  updateStreakOnComplete(state.date)
  upsertDailyHistory({ date: state.date, correct, total: DAILY_COUNT, completed: true })
  return state
}

/* ── streak ─────────────────────────────────────────────── */

export function getDailyStreak(): DailyStreak {
  const s = read<DailyStreak>(DAILY_STREAK_KEY, EMPTY_STREAK)
  return {
    currentStreak: Number(s.currentStreak) || 0,
    longestStreak: Number(s.longestStreak) || 0,
    lastCompletedDate: typeof s.lastCompletedDate === 'string' ? s.lastCompletedDate : '',
  }
}

/** 「今日完了」時に呼ぶ。同じ日に複数回呼んでも二重加算しない */
function updateStreakOnComplete(completedDate: string) {
  const s = getDailyStreak()
  if (s.lastCompletedDate === completedDate) return // 同日 → 何もしない

  const yesterday = tokyoDateKeyOffset(-1, new Date(`${completedDate}T12:00:00+09:00`))
  const next: DailyStreak = { ...s }
  next.currentStreak = s.lastCompletedDate === yesterday ? s.currentStreak + 1 : 1
  next.longestStreak = Math.max(s.longestStreak, next.currentStreak)
  next.lastCompletedDate = completedDate
  write(DAILY_STREAK_KEY, next)
}

/** 表示用：最後の完了が「今日」でも「昨日」でもなければ current は 0 とみなす */
export function displayStreak(): { current: number; longest: number; completedToday: boolean } {
  const s = getDailyStreak()
  const today = tokyoDateKey()
  const yesterday = tokyoDateKeyOffset(-1)
  const alive = s.lastCompletedDate === today || s.lastCompletedDate === yesterday
  return {
    current: alive ? s.currentStreak : 0,
    longest: s.longestStreak,
    completedToday: s.lastCompletedDate === today,
  }
}

/* ── 履歴（直近30日）─────────────────────────────────────── */

export function getDailyHistory(): DailyHistoryEntry[] {
  const list = read<DailyHistoryEntry[]>(DAILY_HISTORY_KEY, [])
  return Array.isArray(list) ? [...list].sort((a, b) => (a.date < b.date ? 1 : -1)) : []
}

function upsertDailyHistory(entry: DailyHistoryEntry) {
  const list = getDailyHistory().filter((e) => e.date !== entry.date)
  list.push(entry)
  list.sort((a, b) => (a.date < b.date ? 1 : -1))
  write(DAILY_HISTORY_KEY, list.slice(0, 60))
}

/** 日付が変わったとき、未完了でも「解いた分」を履歴に残す */
function archiveDailyState(prev: DailyState) {
  const answered = prev.answers.filter((a) => a === true || a === false).length
  if (answered === 0) return
  const correct = prev.answers.filter((a) => a === true).length
  upsertDailyHistory({ date: prev.date, correct, total: DAILY_COUNT, completed: Boolean(prev.completed) })
}

/** 直近 n 日の完了状況（カレンダー用・古い順） */
export function recentDays(n = 7): { date: string; completed: boolean; answered: boolean }[] {
  const hist = new Map(getDailyHistory().map((e) => [e.date, e]))
  const peek = peekDailyState()
  const out: { date: string; completed: boolean; answered: boolean }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const date = tokyoDateKeyOffset(-i)
    let completed = hist.get(date)?.completed ?? false
    let answered = (hist.get(date)?.correct ?? 0) + 0 > 0 || (hist.get(date)?.total ?? 0) > 0
    if (peek && peek.date === date) {
      completed = peek.completed
      answered = peek.answers.some((a) => a === true || a === false)
    }
    out.push({ date, completed, answered })
  }
  return out
}
