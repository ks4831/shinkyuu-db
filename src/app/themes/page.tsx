import Link from 'next/link'
import { themes, subjects } from '@/lib/data'
import { getThemeExamStats } from '@/lib/themeStats'
import ThemesSearch, { type ThemeExamStatsLite } from '@/components/ThemesSearch'

export default function ThemesPage() {
  // 出題実績の正本：src/data/raw/exam-*.csv を themeId で集計した実データ
  // （Theme Master の theme.count/examRounds/latestRound は手動値のため、ここでは使用しない）
  const examStats: Record<string, ThemeExamStatsLite> = {}
  for (const t of themes) {
    const s = getThemeExamStats(t.id)
    examStats[t.id] = { examRounds: s.examRounds, latestRound: s.latestRound }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          ← トップに戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">テーマ検索</h1>
        <p className="text-sm text-gray-500 mt-1">
          キーワード・科目・重要度で絞り込みできます。全{themes.length}件収録。
        </p>
      </div>

      <ThemesSearch themes={themes} subjects={subjects} examStats={examStats} />
    </main>
  )
}
