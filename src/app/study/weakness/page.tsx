import type { Metadata } from 'next'
import { themes } from '@/lib/data'
import { themeExamStatsRecord } from '@/lib/themeStats'
import Weakness from './Weakness'

export const metadata: Metadata = {
  title: '苦手テーマ',
  description: '苦手に登録した鍼灸国家試験テーマを重点的に復習。間違えやすいポイントと暗記のコツを確認。',
}

export default function Page() {
  // 出題実績の正本：src/data/raw/exam-*.csv を themeId で集計した実データ
  // （Theme Master の theme.count/latestRound は手動値のため、ここでは使用しない）
  const examStats = themeExamStatsRecord(themes.map(t => t.id))
  return <Weakness examStats={examStats} />
}
