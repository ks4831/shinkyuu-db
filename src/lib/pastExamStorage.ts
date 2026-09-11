'use client'

/* ──────────────────────────────────────────────────────────────
   過去問演習の解答履歴 LocalStorage 管理
   - 既存の学習クイズ（shinkyuu_quiz_*, shinkyuu_daily_*）とは完全に別キー。
   - 個人情報は保存しない。端末内のみ。SSR / プライベートモードでも壊れない。
   ────────────────────────────────────────────────────────────── */

export const PAST_EXAM_HISTORY_KEY = 'shinkyuu_pastexam_history_v1'

export type PastExamAttempt = {
  questionId: string
  examRound: number
  correct: boolean
  /** 解答日時（epoch ms） */
  answeredAt: number
}

function read(): PastExamAttempt[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PAST_EXAM_HISTORY_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? (list as PastExamAttempt[]) : []
  } catch {
    return []
  }
}

function write(list: PastExamAttempt[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PAST_EXAM_HISTORY_KEY, JSON.stringify(list))
  } catch {
    /* 保存できない環境では黙って無視 */
  }
}

export function recordPastExamAttempt(a: Omit<PastExamAttempt, 'answeredAt'>) {
  const list = read()
  list.push({ ...a, answeredAt: Date.now() })
  write(list)
}

export function getPastExamHistory(): PastExamAttempt[] {
  return read()
}
