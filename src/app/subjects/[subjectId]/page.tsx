import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { subjects, getSubject, getThemesBySubject, themes } from '@/lib/data'
import ImportanceBadge from '@/components/ImportanceBadge'

export function generateStaticParams() {
  return subjects.map(s => ({ subjectId: s.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string }>
}): Promise<Metadata> {
  const { subjectId } = await params
  const subject = getSubject(subjectId)
  if (!subject) return {}
  return { title: subject.name }
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  const subject = getSubject(subjectId)
  if (!subject) notFound()

  const subjectThemes = getThemesBySubject(subjectId)
  const sCount = subjectThemes.filter(t => t.importance === 'S').length
  const aCount = subjectThemes.filter(t => t.importance === 'A').length
  const bCount = subjectThemes.filter(t => t.importance === 'B').length
  const cCount = subjectThemes.filter(t => t.importance === 'C').length
  const allRounds = [29, 30, 31, 32, 33, 34]

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <Link href="/subjects" className="hover:text-green-600 transition-colors">科目一覧</Link>
        <span>›</span>
        <span className="text-gray-700">{subject.name}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{subject.description}</p>

        {subjectThemes.length > 0 && (
          <div className="mt-4 flex gap-4 flex-wrap text-sm">
            <span className="text-gray-500">収録テーマ: <strong className="text-gray-800">{subjectThemes.length}件</strong></span>
            {sCount > 0 && <span className="text-red-600 font-medium">S×{sCount}</span>}
            {aCount > 0 && <span className="text-orange-600 font-medium">A×{aCount}</span>}
            {bCount > 0 && <span className="text-blue-600 font-medium">B×{bCount}</span>}
            {cCount > 0 && <span className="text-gray-500 font-medium">C×{cCount}</span>}
          </div>
        )}
      </div>

      {/* Theme list */}
      {subjectThemes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>このカテゴリのテーマデータは準備中です</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjectThemes.map(theme => (
            <Link
              key={theme.id}
              href={`/themes/${theme.id}`}
              className="block bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-gray-800">{theme.name}</h2>
                    <ImportanceBadge importance={theme.importance} />
                  </div>

                  {/* Official classification */}
                  {theme.officialLarge && (
                    <p className="text-xs text-gray-400 mt-1">
                      {theme.officialLarge}
                      {theme.officialMedium && ` › ${theme.officialMedium}`}
                      {theme.officialSmall && ` › ${theme.officialSmall}`}
                    </p>
                  )}

                  {/* Study point preview */}
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">
                    {theme.studyPoint}
                  </p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-green-700">{theme.count}回</p>
                  <p className="text-xs text-gray-400">出題</p>
                </div>
              </div>

              {/* Rounds heatmap */}
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {allRounds.map(round => {
                  const hit = theme.examRounds.includes(round)
                  return (
                    <span
                      key={round}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        hit
                          ? 'bg-green-100 text-green-700 font-semibold'
                          : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      第{round}回
                    </span>
                  )
                })}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Link to other subjects */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <Link
          href="/subjects"
          className="text-sm text-green-600 hover:underline"
        >
          ← 科目一覧に戻る
        </Link>
      </div>
    </main>
  )
}
