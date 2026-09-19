import type { Metadata } from 'next'
import { themes } from '@/lib/data'
import { themeExamStatsRecord } from '@/lib/themeStats'
import Checklist from './Checklist'

export const metadata: Metadata = {
  title: '学習チェックリスト',
  description: '鍼灸国家試験の重要度S・Aテーマをチェックリストで管理。覚えたテーマにチェックをつけて進捗を確認。',
}

export default function Page() {
  // 出題実績の正本：src/data/raw/exam-*.csv を themeId で集計した実データ
  // （Theme Master の theme.count/latestRound は手動値のため、ここでは使用しない）
  const examStats = themeExamStatsRecord(themes.map(t => t.id))
  return <Checklist examStats={examStats} />
}
