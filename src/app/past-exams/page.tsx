import type { Metadata } from 'next'
import Link from 'next/link'
import { pastExamCoverage } from '@/lib/pastExams'

export const metadata: Metadata = {
  title: '過去問｜実際の国家試験問題を解く',
  description: '第29〜34回 はり師・きゅう師国家試験の過去問を、公式資料にもとづいて出題形式のまま解ける過去問演習。',
}

export default function PastExamsPage() {
  const coverage = pastExamCoverage()
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/" className="hover:text-green-600">ホーム</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">過去問</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900">過去問</h1>
      <p className="mt-1 text-xs text-gray-500">実際の国家試験問題を解く</p>

      <div className="mt-5 space-y-2.5">
        {coverage.map((r) =>
          r.available ? (
            <Link
              key={r.round}
              href={`/past-exams/${r.round}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-green-300 bg-white p-4 hover:bg-green-50"
            >
              <span>
                <span className="block text-sm font-bold text-gray-900">第{r.round}回</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {r.year}年・{r.playable} / {r.totalPerRound}問
                </span>
              </span>
              <span className="flex-shrink-0 text-gray-300" aria-hidden="true">›</span>
            </Link>
          ) : (
            <div
              key={r.round}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <span className="text-sm font-bold text-gray-400">第{r.round}回</span>
              <span className="text-xs text-gray-400">準備中</span>
            </div>
          ),
        )}
      </div>
    </main>
  )
}
