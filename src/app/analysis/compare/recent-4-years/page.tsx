import type { Metadata } from 'next'
import CompareAnalysis from '@/components/analysis/CompareAnalysis'

export const metadata: Metadata = {
  title: '直近4年（第31〜34回）出題傾向比較',
  description:
    '第31〜34回の鍼灸国家試験を統一テーマ（themeId）基準で4年横断比較。連続頻出テーマ・増減トレンド・科目別推移。',
}

export default function ComparePage() {
  return <CompareAnalysis rounds={[31, 32, 33, 34]} />
}
