import { themes } from '@/lib/data'
import { themeExamStatsRecord } from '@/lib/themeStats'
import StudyClient from './StudyClient'

export default function StudyPage() {
  // 出題実績の正本：src/data/raw/exam-*.csv を themeId で集計した実データ
  // （Theme Master の theme.count/examRounds/latestRound は手動値のため、ここでは使用しない）
  const examStats = themeExamStatsRecord(themes.map(t => t.id))
  return <StudyClient themes={themes} examStats={examStats} />
}
