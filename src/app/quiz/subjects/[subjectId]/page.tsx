import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QuizSession from '@/components/quiz/QuizSession'
import { subjectQuestionCounts, subjectFullName } from '@/lib/quiz'

export function generateStaticParams() {
  return subjectQuestionCounts().map((s) => ({ subjectId: s.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string }>
}): Promise<Metadata> {
  const { subjectId } = await params
  const name = subjectFullName(subjectId)
  return {
    title: `${name}クイズ｜鍼灸国家試験 科目別対策`,
    description: `${name}の出題傾向に基づくオリジナル問題を10問。1問1画面で解説・図解つき。`,
  }
}

export default async function SubjectQuizPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  const valid = subjectQuestionCounts().some((s) => s.id === subjectId)
  if (!valid) notFound()

  const name = subjectFullName(subjectId)
  return (
    <main>
      <QuizSession
        mode="subject"
        subjectId={subjectId}
        title={name}
        retryHref={`/quiz/subjects/${subjectId}`}
      />
    </main>
  )
}
