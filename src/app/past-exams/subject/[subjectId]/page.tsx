import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSubject, subjects } from '@/lib/data'
import { loadPastExamQuestionsBySubject, pastExamPracticeRangeLabel } from '@/lib/pastExams'
import PastExamRunner from '@/components/pastExams/PastExamRunner'

export function generateStaticParams() {
  return subjects.map((s) => ({ subjectId: s.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string }>
}): Promise<Metadata> {
  const { subjectId } = await params
  const subject = getSubject(subjectId)
  if (!subject) return {}
  return {
    title: `${subject.name}の過去問｜鍼灸国家試験 頻出分析DB`,
    description: `${subject.name}の鍼灸国家試験過去問（${pastExamPracticeRangeLabel()}）を科目別にまとめて演習できます。`,
  }
}

export default async function PastExamSubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  // 既存の科目定義（subjects）に存在しないsubjectIdは404（/past-exams/theme/[themeId] と同じ方針）
  const subject = getSubject(subjectId)
  if (!subject) notFound()

  const questions = loadPastExamQuestionsBySubject(subjectId)

  return (
    <main>
      <div className="mx-auto max-w-md px-4 pt-6">
        <nav className="text-xs text-gray-400">
          <Link href="/" className="hover:text-green-600">ホーム</Link>
          <span className="mx-1">/</span>
          <Link href="/past-exams?tab=subject" className="hover:text-green-600">過去問</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-600">{subject.name}</span>
        </nav>
      </div>

      {questions.length === 0 ? (
        // 実在する科目だが演習可能な過去問がまだ無いケース（404にはしない）
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-gray-600">
            「{subject.name}」の現在収録されている過去問はありません。
          </p>
          <Link
            href="/past-exams?tab=subject"
            className="mt-4 inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            科目一覧へ戻る
          </Link>
        </div>
      ) : (
        <PastExamRunner mode="subject" subjectId={subject.id} subjectName={subject.name} questions={questions} />
      )}
    </main>
  )
}
