import type { Metadata } from 'next'
import Link from 'next/link'
import { subjectQuestionCounts } from '@/lib/quiz'

export const metadata: Metadata = {
  title: '科目別クイズ｜鍼灸国家試験',
  description: '科目を選んで、その科目の問題だけ10問。経絡経穴概論・東洋医学概論・解剖学・生理学・病理学ほか。',
}

export default function QuizSubjectsPage() {
  const subjects = subjectQuestionCounts()
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/quiz" className="hover:text-green-600">クイズ</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">科目別</span>
      </nav>
      <h1 className="text-2xl font-bold text-gray-900">科目を選ぶ</h1>
      <p className="mt-1 text-sm text-gray-500">選んだ科目から最大10問を出題します。</p>

      <div className="mt-4 space-y-2.5">
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/quiz/subjects/${s.id}`}
            className="flex items-center justify-between rounded-2xl border-2 border-gray-200 bg-white px-4 py-4 transition-colors hover:border-green-400"
          >
            <span className="font-bold text-gray-900">{s.name}</span>
            <span className="text-xs font-semibold text-green-700">{s.count}問 ›</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
