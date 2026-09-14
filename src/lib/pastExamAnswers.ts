/* ──────────────────────────────────────────────────────────────
   過去問（/past-exams）の正答判定共通ヘルパー。
   - 通常：answerIndex（単一正解）
   - 例外：answerIndexes（公式に複数の正答が認められている問題。
     例：第32回問157＝公式正答「2,4」。②を選んでも④を選んでも正解になる、
     単一選択UIのままの問題。チェックボックス化はしない）
   採点・正答表示のロジックをUIコンポーネントに散らさないための単一の入口。
   ────────────────────────────────────────────────────────────── */

export type PastExamAnswerSource = {
  answerIndex?: number
  answerIndexes?: number[]
}

const CIRCLED = ['①', '②', '③', '④']

/** 正答として認められる選択肢インデックス（0-3）の一覧。answerIndexes優先 */
export function getAcceptedAnswerIndexes(q: PastExamAnswerSource): number[] {
  if (q.answerIndexes && q.answerIndexes.length > 0) return q.answerIndexes
  if (typeof q.answerIndex === 'number') return [q.answerIndex]
  return []
}

/** 単一選択UIで選んだ1つの選択肢が正答として認められるか */
export function isPastExamAnswerCorrect(q: PastExamAnswerSource, selectedIndex: number): boolean {
  return getAcceptedAnswerIndexes(q).includes(selectedIndex)
}

/** 正答表示用の文字列（例：「②」単一正解／「②・④」複数正解許容） */
export function formatAcceptedAnswers(q: PastExamAnswerSource): string {
  return getAcceptedAnswerIndexes(q)
    .map((i) => CIRCLED[i] ?? '')
    .join('・')
}
