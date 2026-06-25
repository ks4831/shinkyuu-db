import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { subjects, getSubject, getThemesBySubject } from '@/lib/data'
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

const allRounds = [29, 30, 31, 32, 33, 34]

const IMP_BAR: Record<string, string> = {
  S: 'bg-red-400',
  A: 'bg-orange-400',
  B: 'bg-blue-400',
  C: 'bg-gray-300',
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
  const sorted = [...subjectThemes].sort((a, b) => b.count - a.count || (a.importance > b.importance ? 1 : -1))
  const top10 = sorted.slice(0, 10)

  const sCount = subjectThemes.filter(t => t.importance === 'S').length
  const aCount = subjectThemes.filter(t => t.importance === 'A').length
  const bCount = subjectThemes.filter(t => t.importance === 'B').length
  const cCount = subjectThemes.filter(t => t.importance === 'C').length
  const total = subjectThemes.length || 1

  const impDist = [
    { key: 'S', count: sCount, label: 'S 最重要' },
    { key: 'A', count: aCount, label: 'A 重要' },
    { key: 'B', count: bCount, label: 'B 標準' },
    { key: 'C', count: cCount, label: 'C 参考' },
  ]

  const sThemes = subjectThemes.filter(t => t.importance === 'S')
  const aThemes = subjectThemes.filter(t => t.importance === 'A')
  const priorityThemes = [...sThemes, ...aThemes].slice(0, 5)

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

      {subjectThemes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>このカテゴリのテーマデータは準備中です</p>
        </div>
      ) : (
        <>
          {/* Importance distribution bar */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <h2 className="font-bold text-gray-800 mb-4">重要度分布</h2>
            <div className="flex h-5 rounded-full overflow-hidden gap-px mb-3">
              {impDist.map(({ key, count }) =>
                count > 0 ? (
                  <div
                    key={key}
                    className={`${IMP_BAR[key]} transition-all`}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                ) : null
              )}
            </div>
            <div className="flex gap-4 flex-wrap text-xs">
              {impDist.map(({ key, count, label }) =>
                count > 0 ? (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${IMP_BAR[key]}`} />
                    <span className="text-gray-600">{label}</span>
                    <span className="font-bold text-gray-800">{count}件</span>
                    <span className="text-gray-400">({Math.round((count / total) * 100)}%)</span>
                  </span>
                ) : null
              )}
            </div>
          </section>

          {/* Study priority */}
          {priorityThemes.length > 0 && (
            <section className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-4">
              <h2 className="font-bold text-green-800 mb-3">📊 第35回 学習優先テーマ</h2>
              <div className="space-y-2">
                {priorityThemes.map((t, i) => (
                  <Link
                    key={t.id}
                    href={`/themes/${t.id}`}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-green-100 hover:border-green-300 transition-all"
                  >
                    <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-semibold text-sm text-gray-800">{t.name}</span>
                    <ImportanceBadge importance={t.importance} showLabel={false} />
                    <span className="text-xs text-gray-400">{t.count}回出題</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* TOP10 ranking */}
          {top10.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h2 className="font-bold text-gray-800 mb-4">
                出題回数 TOP{Math.min(10, top10.length)}
                <span className="text-xs text-gray-400 font-normal ml-2">第29〜34回 合算</span>
              </h2>
              <div className="space-y-2">
                {top10.map((t, i) => {
                  const maxCount = top10[0].count || 1
                  return (
                    <Link
                      key={t.id}
                      href={`/themes/${t.id}`}
                      className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-3 py-2.5 transition-colors group"
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-gray-300 text-white' :
                        i === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-800 group-hover:text-green-700 transition-colors">
                            {t.name}
                          </span>
                          <ImportanceBadge importance={t.importance} showLabel={false} />
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-green-400 h-1.5 rounded-full"
                            style={{ width: `${(t.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-green-700 flex-shrink-0">{t.count}回</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* All themes */}
          <section>
            <h2 className="font-bold text-gray-800 mb-3">テーマ一覧（全{subjectThemes.length}件）</h2>
            <div className="space-y-3">
              {sorted.map(theme => (
                <Link
                  key={theme.id}
                  href={`/themes/${theme.id}`}
                  className="block bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-800">{theme.name}</h3>
                        <ImportanceBadge importance={theme.importance} />
                      </div>
                      {theme.officialLarge && (
                        <p className="text-xs text-gray-400 mt-1">
                          {theme.officialLarge}
                          {theme.officialMedium && ` › ${theme.officialMedium}`}
                          {theme.officialSmall && ` › ${theme.officialSmall}`}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">
                        {theme.studyPoint}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-bold text-green-700">{theme.count}回</p>
                      <p className="text-xs text-gray-400">出題</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1.5 flex-wrap">
                    {allRounds.map(round => {
                      const hit = theme.examRounds.includes(round)
                      return (
                        <span
                          key={round}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            hit ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-50 text-gray-300'
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
          </section>
        </>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100">
        <Link href="/subjects" className="text-sm text-green-600 hover:underline">
          ← 科目一覧に戻る
        </Link>
      </div>
    </main>
  )
}
