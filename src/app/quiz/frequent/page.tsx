import type { Metadata } from 'next'
import QuizSession from '@/components/quiz/QuizSession'

export const metadata: Metadata = {
  title: '頻出問題クイズ｜鍼灸国家試験の重要ポイント',
  description: '重要度の高いテーマ（特定穴・五行・蔵象など）を優先して10問。頻出領域から効率よく対策。',
}

export default function FrequentQuizPage() {
  return (
    <main>
      <QuizSession mode="frequent" title="頻出問題" retryHref="/quiz/frequent" />
    </main>
  )
}
