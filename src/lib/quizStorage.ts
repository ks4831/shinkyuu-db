'use client'

/* ──────────────────────────────────────────────────────────────
   クイズ学習データの LocalStorage 管理
   - 個人情報は保存しない。端末内のみ。
   - すべて try/catch でガードし、SSR / プライベートモードでも壊れない
   ────────────────────────────────────────────────────────────── */

export const QUIZ_HISTORY_KEY = 'shinkyuu_quiz_history_v1'
export const QUIZ_WEAK_KEY = 'shinkyuu_quiz_weak_v1'
export const QUIZ_REVIEW_KEY = 'shinkyuu_quiz_review_v1'
export const QUIZ_DAILY_GOAL = 10

/** 1問ぶんの解答記録 */
export type AttemptLog = {
  qid: string
  subject: string
  correct: boolean
  /** 解答日時（epoch ms） */
  at: number
}

export type QuizHistory = {
  attempts: AttemptLog[]
  /** 直近に学習した日付 (YYYY-MM-DD) の配列。連続日数の算出に使う */
  studyDays: string[]
}

/** 苦手・復習は「問題ごとの連続正解数」で管理する */
export type WeakEntry = {
  qid: string
  subject: string
  /** 直近の連続正解数（2でリストから外れる） */
  streak: number
  addedAt: number
}

const EMPTY_HISTORY: QuizHistory = { attempts: [], studyDays: [] }

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
    // 同一タブ内の購読者に通知
    window.dispatchEvent(new Event('shinkyuu-quiz-change'))
  } catch {
    /* 保存できない環境では黙って無視 */
  }
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/* ── 履歴 ─────────────────────────────────────────────── */

export function getHistory(): QuizHistory {
  const h = read<QuizHistory>(QUIZ_HISTORY_KEY, EMPTY_HISTORY)
  return {
    attempts: Array.isArray(h.attempts) ? h.attempts : [],
    studyDays: Array.isArray(h.studyDays) ? h.studyDays : [],
  }
}

export function recordAttempt(log: Omit<AttemptLog, 'at'>) {
  const h = getHistory()
  const now = Date.now()
  h.attempts.push({ ...log, at: now })
  // 履歴が肥大化しないよう直近2000件に制限
  if (h.attempts.length > 2000) h.attempts = h.attempts.slice(-2000)
  const tk = todayKey()
  if (!h.studyDays.includes(tk)) h.studyDays.push(tk)
  write(QUIZ_HISTORY_KEY, h)

  updateWeakness(log.qid, log.subject, log.correct)
}

/* ── 集計 ─────────────────────────────────────────────── */

export type LearningStats = {
  totalAnswered: number
  totalCorrect: number
  accuracy: number // 0-100
  todayCount: number
  todayGoal: number
  weekCount: number // 直近7日間に解いた問題数
  streakDays: number
  reviewCount: number
  weakCount: number
  bySubject: { subject: string; answered: number; correct: number; accuracy: number }[]
}

export function computeStreak(studyDays: string[]): number {
  if (studyDays.length === 0) return 0
  const set = new Set(studyDays)
  let streak = 0
  const d = new Date()
  // 今日やっていなければ昨日起点で数える（連続が途切れていない猶予）
  if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1)
  for (;;) {
    if (set.has(todayKey(d))) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

export function getStats(): LearningStats {
  const h = getHistory()
  const weak = getWeakEntries()
  const review = getReviewIds()
  const total = h.attempts.length
  const correct = h.attempts.filter((a) => a.correct).length
  const tk = todayKey()
  const today = h.attempts.filter((a) => todayKey(new Date(a.at)) === tk).length
  const weekSince = Date.now() - 7 * 86_400_000
  const week = h.attempts.filter((a) => a.at >= weekSince).length

  const subjMap = new Map<string, { answered: number; correct: number }>()
  for (const a of h.attempts) {
    const s = subjMap.get(a.subject) ?? { answered: 0, correct: 0 }
    s.answered++
    if (a.correct) s.correct++
    subjMap.set(a.subject, s)
  }

  return {
    totalAnswered: total,
    totalCorrect: correct,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    todayCount: today,
    todayGoal: QUIZ_DAILY_GOAL,
    weekCount: week,
    streakDays: computeStreak(h.studyDays),
    reviewCount: review.length,
    weakCount: weak.length,
    bySubject: [...subjMap.entries()]
      .map(([subject, v]) => ({
        subject,
        answered: v.answered,
        correct: v.correct,
        accuracy: v.answered ? Math.round((v.correct / v.answered) * 100) : 0,
      }))
      .sort((a, b) => b.answered - a.answered),
  }
}

/* ── 苦手（自動登録・自動解除） ───────────────────────── */

export function getWeakEntries(): WeakEntry[] {
  const list = read<WeakEntry[]>(QUIZ_WEAK_KEY, [])
  return Array.isArray(list) ? list : []
}

export function getWeakIds(): string[] {
  return getWeakEntries().map((w) => w.qid)
}

function updateWeakness(qid: string, subject: string, correct: boolean) {
  const list = getWeakEntries()
  const idx = list.findIndex((w) => w.qid === qid)

  if (!correct) {
    if (idx === -1) {
      list.push({ qid, subject, streak: 0, addedAt: Date.now() })
    } else {
      list[idx].streak = 0
    }
    write(QUIZ_WEAK_KEY, list)
    return
  }

  // 正解した場合：連続正解2で苦手から外す
  if (idx !== -1) {
    list[idx].streak += 1
    if (list[idx].streak >= 2) list.splice(idx, 1)
    write(QUIZ_WEAK_KEY, list)
  }
}

export function removeWeak(qid: string) {
  const list = getWeakEntries().filter((w) => w.qid !== qid)
  write(QUIZ_WEAK_KEY, list)
}

/* ── 復習リスト（手動登録） ───────────────────────────── */

export function getReviewIds(): string[] {
  const list = read<string[]>(QUIZ_REVIEW_KEY, [])
  return Array.isArray(list) ? list : []
}

export function isInReview(qid: string): boolean {
  return getReviewIds().includes(qid)
}

export function addReview(qid: string) {
  const list = getReviewIds()
  if (!list.includes(qid)) {
    list.push(qid)
    write(QUIZ_REVIEW_KEY, list)
  }
}

export function removeReview(qid: string) {
  write(QUIZ_REVIEW_KEY, getReviewIds().filter((id) => id !== qid))
}

export function toggleReview(qid: string): boolean {
  if (isInReview(qid)) {
    removeReview(qid)
    return false
  }
  addReview(qid)
  return true
}
