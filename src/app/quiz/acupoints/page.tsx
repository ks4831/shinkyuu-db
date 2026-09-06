import type { Metadata } from 'next'
import QuizSession from '@/components/quiz/QuizSession'

export const metadata: Metadata = {
  title: '経穴クイズ｜経絡経穴概論の国家試験対策',
  description: '特定穴・五兪穴・八会穴・四総穴など、経穴の問題を10問。回答後に位置の図解つき。',
}

export default function AcupointQuizPage() {
  return (
    <main>
      <QuizSession mode="acupoints" title="経穴クイズ" retryHref="/quiz/acupoints" />
    </main>
  )
}
