import type { Metadata } from 'next'
import CompareAnalysis from '@/components/analysis/CompareAnalysis'

export const metadata: Metadata = {
  title: '第33回 vs 第34回 出題傾向比較',
  description:
    '第33回と第34回の鍼灸国家試験を統一テーマ（themeId）基準で比較。頻出テーマの増減・科目別の変化。',
}

export default function ComparePage() {
  return <CompareAnalysis rounds={[33, 34]} />
}
