import type { Metadata } from 'next'
import Link from 'next/link'
import { loadPastExamQuestions } from '@/lib/pastExams'
import PastExamRunner from '@/components/pastExams/PastExamRunner'

export const metadata: Metadata = {
  title: '第34回 過去問｜はり師・きゅう師国家試験',
  description: '第34回 はり師・きゅう師国家試験の過去問を、公式資料にもとづいて出題形式のまま解ける過去問演習（パイロット10問）。',
}

export default function PastExam34Page() {
  const questions = loadPastExamQuestions(34)
  return (
    <main>
      <div className="mx-auto max-w-md px-4 pt-6">
        <nav className="text-xs text-gray-400">
          <Link href="/" className="hover:text-green-600">ホーム</Link>
          <span className="mx-1">/</span>
          <Link href="/past-exams" className="hover:text-green-600">過去問</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-600">第34回</span>
        </nav>
      </div>
      <PastExamRunner round={34} questions={questions} />
    </main>
  )
}
