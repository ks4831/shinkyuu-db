import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { themes, getTheme, getSubject } from '@/lib/data'
import ImportanceBadge from '@/components/ImportanceBadge'
import { importanceLabel } from '@/lib/utils'

export function generateStaticParams() {
  return themes.map(t => ({ themeId: t.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ themeId: string }>
}): Promise<Metadata> {
  const { themeId } = await params
  const theme = getTheme(themeId)
  if (!theme) return {}
  return { title: theme.name }
}

const allRounds = [29, 30, 31, 32, 33, 34]

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ themeId: string }>
}) {
  const { themeId } = await params
  const theme = getTheme(themeId)
  if (!theme) notFound()

  const subject = getSubject(theme.subject)
  const relatedThemes = theme.relatedThemes
    .map(id => getTheme(id))
    .filter(Boolean)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        {subject && (
          <>
            <Link href={`/subjects/${subject.id}`} className="hover:text-green-600 transition-colors">
              {subject.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="text-gray-700">{theme.name}</span>
      </div>

      {/* Theme header */}
      <div className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100 p-6 mb-6">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{theme.name}</h1>
          <ImportanceBadge importance={theme.importance} />
        </div>

        {subject && (
          <Link
            href={`/subjects/${subject.id}`}
            className="inline-flex items-center gap-1 mt-2 text-xs text-green-700 bg-green-100 border border-green-200 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
          >
            📚 {subject.name}
          </Link>
        )}

        {theme.aliases && theme.aliases.length > 0 && (
          <p className="mt-2 text-xs text-gray-400">
            別名: {theme.aliases.join(' / ')}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">出題回数</p>
          <p className="text-2xl font-bold text-green-700">{theme.count}</p>
          <p className="text-xs text-gray-400">/ 6回</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">直近出題</p>
          <p className="text-2xl font-bold text-green-700">第{theme.latestRound}回</p>
          <p className="text-xs text-gray-400">{theme.latestRound + 1992}年</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">重要度</p>
          <p className="text-2xl font-bold text-green-700">{theme.importance}</p>
          <p className="text-xs text-gray-400">{importanceLabel(theme.importance)}</p>
        </div>
      </div>

      {/* Round heatmap */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <h2 className="font-bold text-gray-800 mb-3">出題年度</h2>
        <div className="flex gap-2 flex-wrap">
          {allRounds.map(round => {
            const hit = theme.examRounds.includes(round)
            return (
              <div
                key={round}
                className={`flex flex-col items-center px-3 py-2 rounded-xl text-sm ${
                  hit
                    ? 'bg-green-100 text-green-800 font-semibold'
                    : 'bg-gray-50 text-gray-300'
                }`}
              >
                <span className="text-xs">第{round}回</span>
                <span className="text-xs">{round + 1992}年</span>
                <span className="mt-1">{hit ? '✓' : '—'}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Official classification */}
      {theme.officialLarge && (
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">公式出題基準上の分類</h2>
          <p className="text-xs text-gray-400 mb-2">2020年版出題基準（第29〜34回適用）</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-12 flex-shrink-0">大項目</span>
              <span className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                {theme.officialLarge}
              </span>
            </div>
            {theme.officialMedium && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-12 flex-shrink-0">中項目</span>
                <span className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                  {theme.officialMedium}
                </span>
              </div>
            )}
            {theme.officialSmall && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-12 flex-shrink-0">小項目</span>
                <span className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                  {theme.officialSmall}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Study point */}
      <section className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-4">
        <h2 className="font-bold text-green-800 mb-3">💡 学習ポイント</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{theme.studyPoint}</p>
      </section>

      {/* Related themes */}
      {relatedThemes.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">🔗 関連テーマ</h2>
          <div className="flex flex-wrap gap-2">
            {relatedThemes.map(rt => rt && (
              <Link
                key={rt.id}
                href={`/themes/${rt.id}`}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 hover:border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-xl text-sm text-gray-700 transition-all"
              >
                {rt.name}
                <ImportanceBadge importance={rt.importance} showLabel={false} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Meta */}
      <section className="text-xs text-gray-400 space-y-1 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p>出題基準: {theme.blueprintVersion}年版 / 問題数体制: {theme.questionCountMode}問</p>
        <p>ソース信頼度: {theme.sourceReliability}</p>
      </section>

      <div className="mt-8 flex gap-4 flex-wrap">
        {subject && (
          <Link
            href={`/subjects/${subject.id}`}
            className="text-sm text-green-600 hover:underline"
          >
            ← {subject.name}の一覧に戻る
          </Link>
        )}
        <Link href="/themes" className="text-sm text-green-600 hover:underline">
          テーマ一覧に戻る
        </Link>
      </div>
    </main>
  )
}
