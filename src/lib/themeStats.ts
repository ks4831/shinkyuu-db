// fs を使うためサーバー専用（Server Component / generateStaticParams からのみ import 可）
import { loadAllExamQuestions, aggregateByThemeId, type ThemeIdStat } from './examQuestions'
import { ALL_QUESTIONS } from './quiz'
import { themes } from './data'

/* ──────────────────────────────────────────────────────────────
   統一テーマ Master（themes[]）と国家試験1,080問・オリジナルクイズ（ALL_QUESTIONS.length 問）を
   themeId で接続した集計。ビルド時に一度だけ構築してキャッシュする。
   - ExamQuestion.themeId  … src/data/raw/exam-*.csv の themeId 列
   - QuizQuestion.themeId  … src/data/quizQuestions.ts の themeId
   ────────────────────────────────────────────────────────────── */

const examStats: Map<string, ThemeIdStat> = aggregateByThemeId(loadAllExamQuestions())

const quizByTheme: Map<string, number> = (() => {
  const m = new Map<string, number>()
  for (const q of ALL_QUESTIONS) {
    if (!q.themeId) continue
    m.set(q.themeId, (m.get(q.themeId) ?? 0) + 1)
  }
  return m
})()

const EMPTY: ThemeIdStat = {
  themeId: '', count: 0, examRounds: [], byRound: {}, latestRound: 0, recent3Count: 0,
}

/** テーマ1件の国家試験出題統計（themeId 基準・実データ算出） */
export function getThemeExamStats(themeId: string): ThemeIdStat {
  return examStats.get(themeId) ?? { ...EMPTY, themeId }
}

/** テーマ1件に紐づくクイズ数 */
export function getThemeQuizCount(themeId: string): number {
  return quizByTheme.get(themeId) ?? 0
}

/** 科目内テーマを出題数（themeId 実データ）降順で返す */
export function getRankedThemesBySubject(subjectId: string) {
  return themes
    .filter(t => t.subject === subjectId)
    .map(t => ({ theme: t, stats: getThemeExamStats(t.id), quizCount: getThemeQuizCount(t.id) }))
    .sort((a, b) =>
      b.stats.count - a.stats.count ||
      b.stats.examRounds.length - a.stats.examRounds.length ||
      (a.theme.importance > b.theme.importance ? 1 : -1),
    )
}

/** 出題実績が1問もないテーマ（学習用テーマ）の id 一覧 */
export function studyOnlyThemeIds(): string[] {
  return themes.filter(t => getThemeExamStats(t.id).count === 0).map(t => t.id)
}

/** テーマの出題実績（正本：src/data/raw/exam-*.csv を themeId で集計した実データ）。
 *  Theme Master の theme.count/examRounds/latestRound（手動値）はユーザー向け表示に使用しない。
 *  Client Component へ props で渡す用の最小形（count・byRound・recent3Count は含めない）。 */
export type ThemeExamStatsLite = {
  examRounds: number[]
  latestRound: number
}

/**
 * themeId一覧に対応する実出題統計をまとめて構築する（Server Component → Client Component への
 * props受け渡し用）。CSVの独自集計は行わず、getThemeExamStats() をそのまま利用するだけ。
 */
export function themeExamStatsRecord(themeIds: string[]): Record<string, ThemeExamStatsLite> {
  const record: Record<string, ThemeExamStatsLite> = {}
  for (const id of themeIds) {
    const s = getThemeExamStats(id)
    record[id] = { examRounds: s.examRounds, latestRound: s.latestRound }
  }
  return record
}

export { examStats as _examStats, quizByTheme as _quizByTheme }
