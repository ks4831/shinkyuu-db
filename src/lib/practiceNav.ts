/* ──────────────────────────────────────────────────────────────
   演習の前後移動（過去問の PastExamRunner で使用）
   - 問題の中身を知らない純粋な状態管理。模擬試験（mockSession.ts）と違い、
     回答は1問1回で確定し変更できない（回答ごとに学習記録・途中経過を保存するため）。
   - 回答済みの問題は常に先頭から連続する（未回答の問題を飛ばして先へは進めない）。
     年度別・科目別過去問の「続きから解く」は、この連続を前提に保存・復元している。
   - choices[i] は回答した選択肢。途中再開で、選択肢を保存していなかった旧データの
     問題は null（results[i] の正誤だけが入る）。
   - 状態は毎回新しいオブジェクトを返す（React の state にそのまま入れる）。
   ────────────────────────────────────────────────────────────── */

export type PracticeNav = {
  index: number
  /** 回答した選択肢（未回答・選択肢の記録がない再開分は null） */
  choices: (number | null)[]
  /** 回答する前の選択（別の問題へ移っても残す） */
  drafts: (number | null)[]
  /** 正誤（未回答は null） */
  results: (boolean | null)[]
}

/**
 * total 問の演習を始める。途中再開では priorResults（前回までの正誤・先頭から順）と
 * priorChoices（そのとき選んだ選択肢。記録がなければ null）を渡し、その次の問題から始める。
 */
export function createPracticeNav(
  total: number,
  priorResults: boolean[] = [],
  priorChoices: (number | null)[] = [],
): PracticeNav {
  const results: (boolean | null)[] = Array(total).fill(null)
  const choices: (number | null)[] = Array(total).fill(null)
  priorResults.slice(0, total).forEach((r, i) => {
    results[i] = r
    choices[i] = priorChoices[i] ?? null
  })
  const s: PracticeNav = { index: 0, choices, drafts: Array(total).fill(null), results }
  return { ...s, index: Math.max(0, Math.min(firstUnanswered(s), total - 1)) }
}

export function isAnswered(s: PracticeNav, index: number): boolean {
  return s.results[index] !== null && s.results[index] !== undefined
}

/** 今の問題で選択肢を選ぶ（回答済みなら何もしない） */
export function selectDraft(s: PracticeNav, choice: number): PracticeNav {
  if (isAnswered(s, s.index)) return s
  const drafts = [...s.drafts]
  drafts[s.index] = choice
  return { ...s, drafts }
}

/** 今の問題の選択を回答として確定する。正誤の判定は呼び出し側（問題の中身を知る側）で行う */
export function recordAnswer(s: PracticeNav, correct: boolean): PracticeNav {
  const choice = s.drafts[s.index]
  if (choice === null || isAnswered(s, s.index)) return s
  const choices = [...s.choices]
  const results = [...s.results]
  choices[s.index] = choice
  results[s.index] = correct
  return { ...s, choices, results }
}

/** 画面に表示する選択（回答済みは回答した選択肢、未回答は回答前の選択） */
export function shownChoice(s: PracticeNav, index: number): number | null {
  return isAnswered(s, index) ? s.choices[index] : s.drafts[index]
}

/** 最初の未回答の問題（全問回答済みなら問題数） */
export function firstUnanswered(s: PracticeNav): number {
  const i = s.results.findIndex((r) => r === null)
  return i === -1 ? s.results.length : i
}

/** 指定の問題へ移動する。最初の未回答の問題より先へは行けない */
export function goTo(s: PracticeNav, index: number): PracticeNav {
  if (index < 0 || index >= s.results.length || index === s.index || index > firstUnanswered(s)) return s
  return { ...s, index }
}

export const canGoPrev = (s: PracticeNav) => s.index > 0
/** 次の問題へ進めるのは、今の問題に回答済みのときだけ（最後の問題では false） */
export const canGoNext = (s: PracticeNav) => s.index < s.results.length - 1 && isAnswered(s, s.index)
export const goPrev = (s: PracticeNav) => goTo(s, s.index - 1)
export const goNext = (s: PracticeNav) => (canGoNext(s) ? goTo(s, s.index + 1) : s)

/** 最後の問題に回答済み（＝全問回答済み。「結果を見る」を出す） */
export const canFinish = (s: PracticeNav) =>
  s.results.length > 0 && s.index === s.results.length - 1 && isAnswered(s, s.index)

/** 回答済みの正誤（出題順。先頭から連続しているので添字は出題順と一致する） */
export function answeredResults(s: PracticeNav): boolean[] {
  return s.results.slice(0, firstUnanswered(s)) as boolean[]
}

export function answeredCount(s: PracticeNav): number {
  return firstUnanswered(s)
}
