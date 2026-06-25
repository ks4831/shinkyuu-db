import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { themes, getTheme, getSubject } from '@/lib/data'
import { getLearningGuide } from '@/lib/learning'
import ImportanceBadge from '@/components/ImportanceBadge'
import StudyActions from '@/components/StudyActions'
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
const ROUND_YEAR: Record<number, number> = {
  29: 2021, 30: 2022, 31: 2023, 32: 2024, 33: 2025, 34: 2026,
}

const IMP_PRIORITY: Record<string, { label: string; color: string; advice: string }> = {
  S: { label: '最優先', color: 'text-red-700 bg-red-50 border-red-200', advice: '第35回でも高確率で出題が見込まれます。必ず押さえてください。' },
  A: { label: '優先',   color: 'text-orange-700 bg-orange-50 border-orange-200', advice: '出題頻度が高く、学習コストパフォーマンスが高いテーマです。' },
  B: { label: '標準',   color: 'text-blue-700 bg-blue-50 border-blue-200', advice: '余裕があれば優先して学習しましょう。複合問題での出題もあります。' },
  C: { label: '参考',   color: 'text-gray-600 bg-gray-50 border-gray-200', advice: '出題頻度は低めですが、関連テーマとまとめて学ぶと効率的です。' },
}

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

  const priority = IMP_PRIORITY[theme.importance]
  const isRecent = theme.examRounds.includes(33) || theme.examRounds.includes(34)
  const streak = (() => {
    let s = 0
    for (let i = allRounds.length - 1; i >= 0; i--) {
      if (theme.examRounds.includes(allRounds[i])) s++
      else break
    }
    return s
  })()

  const guide = getLearningGuide(theme.id)

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

      {/* Header */}
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

      {/* 学習管理ボタン */}
      <StudyActions themeId={theme.id} />

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
          <p className="text-xs text-gray-400">{ROUND_YEAR[theme.latestRound]}年</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">重要度</p>
          <p className="text-2xl font-bold text-green-700">{theme.importance}</p>
          <p className="text-xs text-gray-400">{importanceLabel(theme.importance)}</p>
        </div>
      </div>

      {/* Year-by-year visualization */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <h2 className="font-bold text-gray-800 mb-4">年度別出題推移（第29〜34回）</h2>
        <div className="grid grid-cols-6 gap-2">
          {allRounds.map(round => {
            const hit = theme.examRounds.includes(round)
            return (
              <div key={round} className="flex flex-col items-center gap-1">
                <div className="w-full h-16 flex items-end justify-center">
                  <div
                    className={`w-8 rounded-t-md transition-all ${
                      hit ? 'bg-green-400 h-full' : 'bg-gray-100 h-3'
                    }`}
                  />
                </div>
                <span className={`text-xs font-semibold ${hit ? 'text-green-700' : 'text-gray-300'}`}>
                  {hit ? '✓' : '—'}
                </span>
                <span className="text-xs text-gray-500">第{round}回</span>
                <span className="text-xs text-gray-400">{ROUND_YEAR[round]}</span>
              </div>
            )
          })}
        </div>
        {streak >= 2 && (
          <p className="mt-3 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg inline-block">
            直近{streak}回連続出題中
          </p>
        )}
      </section>

      {/* Study priority recommendation */}
      <section className={`rounded-2xl border p-5 mb-4 ${priority.color}`}>
        <h2 className="font-bold mb-2">📊 第35回に向けた学習優先度</h2>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-2xl font-black`}>{theme.importance}</span>
          <div>
            <p className="font-semibold text-sm">{priority.label}</p>
            <p className="text-xs opacity-80">{importanceLabel(theme.importance)}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed">{priority.advice}</p>
        {isRecent && (
          <p className="mt-2 text-xs font-semibold">
            ✓ 直近2年（第33・34回）でも出題されており、継続学習が推奨されます。
          </p>
        )}
        {!isRecent && theme.count >= 4 && (
          <p className="mt-2 text-xs font-semibold opacity-80">
            ⚠ 最近は出題が途絶えていますが、高頻度テーマのため復活に注意。
          </p>
        )}
      </section>

      {/* 学習ガイド（ある場合のみ） */}
      {guide && (
        <>
          {/* 3分で覚える要点 */}
          <section className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-4">
            <h2 className="font-bold text-green-800 mb-3">⚡ 3分で覚える要点</h2>
            <ul className="space-y-2">
              {guide.quickSummary.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 国家試験で狙われるポイント */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <h2 className="font-bold text-gray-800 mb-3">🎯 国家試験で狙われるポイント</h2>
            <ul className="space-y-2">
              {guide.examFocus.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-500 mt-0.5 flex-shrink-0">▶</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 間違えやすいポイント */}
          <section className="bg-red-50 rounded-2xl border border-red-100 p-5 mb-4">
            <h2 className="font-bold text-red-800 mb-3">⚠ 間違えやすいポイント</h2>
            <ul className="space-y-2">
              {guide.commonMistakes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 暗記のコツ */}
          <section className="bg-blue-50 rounded-2xl border border-blue-100 p-5 mb-4">
            <h2 className="font-bold text-blue-800 mb-3">💡 暗記のコツ</h2>
            <ul className="space-y-2">
              {guide.memoryTips.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-400 mt-0.5 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* おすすめ学習順 */}
          {guide.recommendedOrder.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h2 className="font-bold text-gray-800 mb-3">📖 おすすめ学習順</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {guide.recommendedOrder.map((id, i) => {
                  const t = themes.find(th => th.id === id)
                  if (!t) return null
                  const isThis = id === theme.id
                  return (
                    <span key={id} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-gray-300 text-xs">→</span>}
                      {isThis ? (
                        <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                          {t.name}（今ここ）
                        </span>
                      ) : (
                        <Link
                          href={`/themes/${t.id}`}
                          className="text-xs bg-gray-50 text-gray-700 border border-gray-200 hover:border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-full transition-colors"
                        >
                          {t.name}
                        </Link>
                      )}
                    </span>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Study point */}
      <section className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-4">
        <h2 className="font-bold text-green-800 mb-3">💡 学習ポイント</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{theme.studyPoint}</p>
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
          <Link href={`/subjects/${subject.id}`} className="text-sm text-green-600 hover:underline">
            ← {subject.name}の一覧に戻る
          </Link>
        )}
        <Link href="/themes" className="text-sm text-green-600 hover:underline">
          テーマ一覧に戻る
        </Link>
        <Link href="/study" className="text-sm text-green-600 hover:underline">
          学習モード →
        </Link>
        <Link href="/study/dashboard" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          ダッシュボード →
        </Link>
      </div>
    </main>
  )
}
