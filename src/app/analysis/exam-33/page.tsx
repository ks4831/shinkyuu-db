import type { Metadata } from 'next'
import ExamAnalysis from '@/components/analysis/ExamAnalysis'

export const metadata: Metadata = {
  title: '第33回 出題分析',
  description:
    '第33回鍼灸国家試験（2025年）の出題傾向を統一テーマ（themeId）基準で分析。頻出テーマ・科目別・学習優先順位ガイド付き。',
}

export default function Exam33AnalysisPage() {
  return <ExamAnalysis round={33} />
}
