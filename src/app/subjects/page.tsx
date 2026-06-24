import type { Metadata } from 'next'
import Link from 'next/link'
import { subjects, themes } from '@/lib/data'

export const metadata: Metadata = {
  title: '科目一覧',
}

const importanceOrder = { S: 0, A: 1, B: 2, C: 3 } as const

export default function SubjectsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          ← トップに戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">科目一覧</h1>
        <p className="text-sm text-gray-500 mt-1">
          14科目から出題テーマを探せます。各科目カードをタップして詳細を確認。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(subject => {
          const subjectThemes = themes.filter(t => t.subject === subject.id)
          const sCount = subjectThemes.filter(t => t.importance === 'S').length
          const aCount = subjectThemes.filter(t => t.importance === 'A').length
          const topTheme = [...subjectThemes].sort(
            (a, b) =>
              importanceOrder[a.importance] - importanceOrder[b.importance] ||
              b.count - a.count
          )[0]

          return (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className={`block bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
                subjectThemes.length > 0
                  ? 'border-gray-100 hover:border-green-200'
                  : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="font-bold text-gray-800 leading-snug">{subject.name}</h2>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {subject.description}
                  </p>
                </div>
                {subjectThemes.length > 0 && (
                  <span className="ml-2 flex-shrink-0 text-xs text-green-600 font-semibold bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                    {subjectThemes.length}件
                  </span>
                )}
              </div>

              {subjectThemes.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <div className="flex gap-3 text-xs text-gray-500">
                    {sCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                        S×{sCount}
                      </span>
                    )}
                    {aCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                        A×{aCount}
                      </span>
                    )}
                  </div>
                  {topTheme && (
                    <p className="text-xs text-gray-400">
                      最頻出: <span className="font-medium text-gray-600">{topTheme.name}</span>（{topTheme.count}回出題）
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-gray-300">データ準備中</p>
              )}
            </Link>
          )
        })}
      </div>
    </main>
  )
}
