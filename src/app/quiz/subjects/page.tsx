import type { Metadata } from 'next'
import Link from 'next/link'
import { subjectQuestionCounts } from '@/lib/quiz'

export const metadata: Metadata = {
  title: '科目別クイズ｜鍼灸国家試験',
  description: '国家試験14科目すべてから、科目を選んで問題演習。1問1画面で解説・図解つき。',
}

export default function QuizSubjectsPage() {
  const subjects = subjectQuestionCounts()
  const totalQ = subjects.reduce((n, s) => n + s.count, 0)
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/quiz" className="hover:text-green-600">予想問題</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">科目別</span>
      </nav>
      <h1 className="text-2xl font-bold text-gray-900">科目を選ぶ</h1>
      <p className="mt-1 text-sm text-gray-500">
        国家試験{subjects.length}科目すべてに問題があります（全{totalQ}問）。選んだ科目から最大10問を出題。
      </p>

      <div className="mt-4 space-y-2.5">
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/quiz/subjects/${s.id}`}
            className="flex items-center justify-between gap-3 rounded-2xl border-2 border-gray-200 bg-white px-4 py-4 transition-colors hover:border-green-400"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-gray-900">{s.name}</span>
              <span className="block text-xs text-gray-400">{s.themeCount}テーマ</span>
            </span>
            <span className="flex-shrink-0 text-xs font-semibold text-green-700">{s.count}問 ›</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
