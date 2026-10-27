/* ──────────────────────────────────────────────────────────────
   模擬試験の解答セッション（前後の移動・回答の保持と変更・未回答の確認）
   - 問題の中身を知らない純粋な状態管理。オリジナル模擬試験②（40問）と、
     今後の総合模擬試験①（180問）で共通に使う。
   - answers[i] は確定した最新の回答（未回答は null）。採点には answers だけを使う。
   - drafts[i] は確定前の選択。editing[i] は回答済みの問題を変更中かどうか。
   - 状態は毎回新しいオブジェクトを返す（React の state にそのまま入れる）。
   ────────────────────────────────────────────────────────────── */

export type MockSession = {
  /** 出題順の問題ID（移動しても順序は変えない） */
  order: string[]
  index: number
  answers: (number | null)[]
  drafts: (number | null)[]
  editing: boolean[]
}

export function createMockSession(questionIds: string[]): MockSession {
  const n = questionIds.length
  return {
    order: [...questionIds],
    index: 0,
    answers: Array(n).fill(null),
    drafts: Array(n).fill(null),
    editing: Array(n).fill(false),
  }
}

/** 今の問題で選択肢を選ぶ（回答済みで変更中でなければ何もしない） */
export function selectChoice(s: MockSession, choice: number): MockSession {
  if (isLocked(s, s.index)) return s
  const drafts = [...s.drafts]
  drafts[s.index] = choice
  return { ...s, drafts }
}

/** 今の問題の選択を回答として確定する（変更中なら最新の選択で上書き） */
export function confirmAnswer(s: MockSession): MockSession {
  const choice = s.drafts[s.index]
  if (choice === null || isLocked(s, s.index)) return s
  const answers = [...s.answers]
  const editing = [...s.editing]
  answers[s.index] = choice
  editing[s.index] = false
  return { ...s, answers, editing }
}

/** 回答済みの問題の回答を変更し始める（確定するまで元の回答が有効） */
export function startEditing(s: MockSession): MockSession {
  if (s.answers[s.index] === null) return s
  const editing = [...s.editing]
  const drafts = [...s.drafts]
  editing[s.index] = true
  drafts[s.index] = s.answers[s.index]
  return { ...s, editing, drafts }
}

/** 指定の問題へ移動する。離れる問題の未確定の変更は取り消す（確定済みの回答は残る） */
export function goTo(s: MockSession, index: number): MockSession {
  if (index < 0 || index >= s.order.length || index === s.index) return s
  const editing = [...s.editing]
  const drafts = [...s.drafts]
  if (editing[s.index]) {
    editing[s.index] = false
    drafts[s.index] = s.answers[s.index]
  }
  return { ...s, index, editing, drafts }
}

export const canGoPrev = (s: MockSession) => s.index > 0
export const canGoNext = (s: MockSession) => s.index < s.order.length - 1
export const goPrev = (s: MockSession) => goTo(s, s.index - 1)
export const goNext = (s: MockSession) => goTo(s, s.index + 1)

/** 回答済みで、変更中でない（＝正誤と解説を表示する）問題か */
export function isLocked(s: MockSession, index: number): boolean {
  return s.answers[index] !== null && !s.editing[index]
}

/** 画面に表示する選択（変更中・未回答は drafts、確定済みは answers） */
export function shownChoice(s: MockSession, index: number): number | null {
  return isLocked(s, index) ? s.answers[index] : s.drafts[index]
}

export function unansweredIndexes(s: MockSession): number[] {
  return s.answers.flatMap((a, i) => (a === null ? [i] : []))
}

export function answeredCount(s: MockSession): number {
  return s.answers.filter((a) => a !== null).length
}
