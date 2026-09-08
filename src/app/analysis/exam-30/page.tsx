import type { Metadata } from 'next'
import ExamAnalysis from '@/components/analysis/ExamAnalysis'

export const metadata: Metadata = {
  title: '第30回 出題分析',
  description:
    '第30回鍼灸国家試験（2022年）の出題傾向を統一テーマ（themeId）基準で分析。頻出テーマ・科目別・出題数ランキング。',
}

export default function Exam30AnalysisPage() {
  return <ExamAnalysis round={30} />
}
