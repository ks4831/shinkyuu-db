import type { Metadata } from 'next'
import QuizSession from '@/components/quiz/QuizSession'

export const metadata: Metadata = {
  title: '10問ランダムクイズ｜鍼灸国家試験対策',
  description: '鍼灸国家試験の全範囲からランダムに10問。1問1画面で、解説・覚えるポイント・図解つき。',
}

export default function RandomQuizPage() {
  return (
    <main>
      <QuizSession mode="random" title="10問ランダム" retryHref="/quiz/random" />
    </main>
  )
}
