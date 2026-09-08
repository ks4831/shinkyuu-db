import type { Metadata } from 'next'
import ExamAnalysis from '@/components/analysis/ExamAnalysis'

export const metadata: Metadata = {
  title: '第31回 出題分析',
  description:
    '第31回鍼灸国家試験（2023年）の出題傾向を統一テーマ（themeId）基準で分析。頻出テーマ・科目別・出題数ランキング。',
}

export default function Exam31AnalysisPage() {
  return <ExamAnalysis round={31} />
}
