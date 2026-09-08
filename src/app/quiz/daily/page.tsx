import type { Metadata } from 'next'
import Link from 'next/link'
import { loadAllExamQuestions, aggregateByThemeId } from '@/lib/examQuestions'
import DailyQuizClient from '@/components/quiz/DailyQuizClient'

export const metadata: Metadata = {
  title: '今日の10問｜鍼灸国家試験 デイリー学習',
  description:
    '国家試験の頻出テーマと全14科目から、毎日ちがう10問。連続学習日数を伸ばしながら国試対策。1問1画面・解説つき。',
}

// themeId → 過去6年の国家試験出題数（今日の10問の「頻出40%」枠に使用）
function themeExamCount(): Record<string, number> {
  const stats = aggregateByThemeId(loadAllExamQuestions())
  const m: Record<string, number> = {}
  for (const s of stats.values()) m[s.themeId] = s.count
  return m
}

export default function DailyQuizPage() {
  return (
    <main>
      <DailyQuizClient themeExamCount={themeExamCount()} />
    </main>
  )
}
