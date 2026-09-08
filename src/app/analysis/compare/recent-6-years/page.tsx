import type { Metadata } from 'next'
import CompareAnalysis from '@/components/analysis/CompareAnalysis'

export const metadata: Metadata = {
  title: '直近6年（第29〜34回）出題傾向比較',
  description:
    '第29〜34回の鍼灸国家試験を統一テーマ（themeId）基準で6年横断比較。6年連続頻出テーマ・増減トレンド・科目別推移。',
}

export default function ComparePage() {
  return <CompareAnalysis rounds={[29, 30, 31, 32, 33, 34]} />
}
