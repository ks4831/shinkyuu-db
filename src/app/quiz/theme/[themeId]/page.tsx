import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QuizSession from '@/components/quiz/QuizSession'
import { themeIdsWithQuiz, quizCountByTheme } from '@/lib/quiz'
import { getTheme } from '@/lib/data'

export function generateStaticParams() {
  return themeIdsWithQuiz().map((themeId) => ({ themeId }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ themeId: string }>
}): Promise<Metadata> {
  const { themeId } = await params
  const theme = getTheme(themeId)
  if (!theme) return {}
  return {
    title: `${theme.name}クイズ｜鍼灸国家試験 テーマ別演習`,
    description: `「${theme.name}」の演習問題。1問1画面で解説・覚えるポイント・間違えやすい点つき。`,
  }
}

export default async function ThemeQuizPage({
  params,
}: {
  params: Promise<{ themeId: string }>
}) {
  const { themeId } = await params
  const theme = getTheme(themeId)
  if (!theme || quizCountByTheme(themeId) === 0) notFound()

  return (
    <main>
      <QuizSession
        mode="theme"
        themeId={themeId}
        title={theme.name}
        count={Math.min(10, quizCountByTheme(themeId))}
        retryHref={`/quiz/theme/${themeId}`}
      />
    </main>
  )
}
