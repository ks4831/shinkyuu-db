// 分析ページ共通のテーマ集計。Ver.7.2.3 で /analysis/* を themeId 正本へ統一。
// - 集計キー = ExamQuestion.themeId（Ver.7.2.2 で全1,080問へ付与）
// - 表示名   = themes[].name（旧 normalizedTheme ラベルは使用しない）
// - importance（学習優先度）と frequency（実出題数）は明確に分離する
import { loadAllExamQuestions, aggregateByThemeId, calcImportanceByCount } from './examQuestions'
import { themes, subjects } from './data'
import type { Importance, ExamQuestion } from './types'

const ALL: ExamQuestion[] = loadAllExamQuestions()
const themeById = new Map(themes.map(t => [t.id, t]))
const subjectName = (id: string) => subjects.find(s => s.id === id)?.name ?? id
const subjectShort = (id: string) => subjects.find(s => s.id === id)?.shortName ?? id

export type AnalysisThemeRow = {
  themeId: string
  name: string
  subjectId: string
  subjectName: string
  subjectShort: string
  /** スコープ内の出題数（＝frequency） */
  count: number
  /** スコープ内で出題された回のリスト（昇順） */
  rounds: number[]
  /** 出題された回数（≠count） */
  yearCount: number
  /** 回ごとの出題数 */
  byRound: Record<number, number>
  /** 直近3回（第32〜34回）の出題数 */
  recent3: number
  /** 出題数から算出した頻出ランク（S=8+/A=5-7/B=3-4/C=1-2）。学習重要度とは別物 */
  freqTier: Importance
  /** themes[].importance（学習優先度）。頻出ランクとは別軸 */
  learningImportance: Importance
}

function toRow(themeId: string, count: number, byRound: Record<number, number>): AnalysisThemeRow {
  const t = themeById.get(themeId)
  const rounds = Object.keys(byRound).map(Number).filter(r => byRound[r] > 0).sort((a, b) => a - b)
  return {
    themeId,
    name: t?.name ?? themeId,
    subjectId: t?.subject ?? '',
    subjectName: t ? subjectName(t.subject) : '',
    subjectShort: t ? subjectShort(t.subject) : '',
    count,
    rounds,
    yearCount: rounds.length,
    byRound,
    recent3: (byRound[32] ?? 0) + (byRound[33] ?? 0) + (byRound[34] ?? 0),
    freqTier: calcImportanceByCount(count) as Importance,
    learningImportance: (t?.importance ?? 'C') as Importance,
  }
}

/** 指定した回の集合でテーマを集計し、出題数降順で返す */
export function rankThemes(rounds: number[]): AnalysisThemeRow[] {
  const set = new Set(rounds)
  const stats = aggregateByThemeId(ALL.filter(q => set.has(q.examRound)))
  return [...stats.values()]
    .map(s => toRow(s.themeId, s.count, s.byRound))
    .sort((a, b) => b.count - a.count || b.yearCount - a.yearCount || a.name.localeCompare(b.name, 'ja'))
}

/** 1回分のテーマ集計（出題数降順） */
export function themesForRound(round: number): AnalysisThemeRow[] {
  return rankThemes([round])
}

/** 第29〜34回 6年通算のテーマ集計 */
export const SIX_ROUNDS = [29, 30, 31, 32, 33, 34] as const
export function sixYearThemes(): AnalysisThemeRow[] {
  return rankThemes([...SIX_ROUNDS])
}

/** themeId → 6年通算行 の索引（トレンド分析用） */
export function sixYearThemeIndex(): Map<string, AnalysisThemeRow> {
  return new Map(sixYearThemes().map(r => [r.themeId, r]))
}

/** 科目別の出題数集計（officialMedium ベース・Ver.7.2.1 の14科目で安定） */
export function subjectCountsForRounds(rounds: number[]): { name: string; count: number }[] {
  const set = new Set(rounds)
  const m = new Map<string, number>()
  for (const q of ALL) {
    if (!set.has(q.examRound)) continue
    const k = q.officialMedium ?? q.subject
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}
