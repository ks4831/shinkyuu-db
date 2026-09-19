import type { Metadata } from 'next'
import { themes } from '@/lib/data'
import { themeExamStatsRecord } from '@/lib/themeStats'
import Favorites from './Favorites'

export const metadata: Metadata = {
  title: '復習リスト',
  description: '「あとで復習」に登録した鍼灸国家試験テーマの一覧。いつでも確認・削除が可能。',
}

export default function Page() {
  // 出題実績の正本：src/data/raw/exam-*.csv を themeId で集計した実データ
  // （Theme Master の theme.count/latestRound は手動値のため、ここでは使用しない）
  const examStats = themeExamStatsRecord(themes.map(t => t.id))
  return <Favorites examStats={examStats} />
}
