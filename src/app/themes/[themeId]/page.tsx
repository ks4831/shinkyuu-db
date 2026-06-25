import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { themes, getTheme, getSubject, getThemesBySubject } from '@/lib/data'
import { getLearningGuide } from '@/lib/learning'
import ImportanceBadge from '@/components/ImportanceBadge'
import StudyActions from '@/components/StudyActions'
import { importanceLabel } from '@/lib/utils'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shinkyuu-db.vercel.app'

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
  const subject = getSubject(theme.subject)
  const title = `${theme.name}｜国家試験での出題傾向・重要ポイント`
  const description = `【鍼灸国家試験】${theme.name}の出題傾向と学習ポイントを徹底解説。第29〜34回の分析データ・重要度${theme.importance}（${importanceLabel(theme.importance)}）・試験対策まとめ。${subject ? subject.name + '科目。' : ''}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/themes/${themeId}`,
      type: 'article',
    },
  }
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

  const sameSubjectThemes = subject
    ? getThemesBySubject(subject.id).filter(t => t.id !== theme.id).slice(0, 6)
    : []

  const sThemes = themes
    .filter(t => t.importance === 'S' && t.id !== theme.id)
    .slice(0, 6)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav aria-label="パンくず" className="flex items-center gap-2 text-sm text-gray-400 mb-5 flex-wrap">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span aria-hidden>›</span>
        <Link href="/themes/library" className="hover:text-green-600 transition-colors">テーマ辞典</Link>
        <span aria-hidden>›</span>
        {subject && (
          <>
            <Link href={`/subjects/${subject.id}`} className="hover:text-green-600 transition-colors">
              {subject.name}
            </Link>
            <span aria-hidden>›</span>
          </>
        )}
        <span className="text-gray-700">{theme.name}</span>
      </nav>

      {/* Header */}
      <div id="overview" className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100 p-6 mb-5">
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

      {/* 目次 */}
      <nav aria-label="目次" className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 mb-5 text-sm">
        <p className="font-semibold text-gray-600 mb-2 text-xs tracking-wider uppercase">目次</p>
        <ul className="space-y-1 text-gray-600">
          <li><a href="#overview" className="hover:text-green-600 transition-colors">▸ 出題データ・統計</a></li>
          {guide?.whyImportant && <li><a href="#why-important" className="hover:text-green-600 transition-colors">▸ なぜ重要か</a></li>}
          {guide?.keyPoints && <li><a href="#key-points" className="hover:text-green-600 transition-colors">▸ ここだけ覚える</a></li>}
          {guide && <li><a href="#exam-focus" className="hover:text-green-600 transition-colors">▸ 試験で狙われるポイント</a></li>}
          {guide && <li><a href="#common-mistakes" className="hover:text-green-600 transition-colors">▸ 間違えやすいポイント</a></li>}
          {guide && <li><a href="#memory-tips" className="hover:text-green-600 transition-colors">▸ 暗記のコツ</a></li>}
          {guide && <li><a href="#study-order" className="hover:text-green-600 transition-colors">▸ おすすめ学習順</a></li>}
          <li><a href="#related" className="hover:text-green-600 transition-colors">▸ 関連リンク</a></li>
        </ul>
      </nav>

      {/* 学習管理ボタン */}
      <StudyActions themeId={theme.id} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
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
      <section id="priority" className={`rounded-2xl border p-5 mb-4 ${priority.color}`}>
        <h2 className="font-bold mb-2">📊 第35回に向けた学習優先度</h2>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl font-black">{theme.importance}</span>
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

      {/* なぜ重要か */}
      {guide?.whyImportant && (
        <section id="why-important" className="bg-amber-50 rounded-2xl border border-amber-100 p-5 mb-4">
          <h2 className="font-bold text-amber-800 mb-2">なぜ国家試験で重要なのか</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{guide.whyImportant}</p>
          {guide.reviewTiming && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg">
              ⏰ おすすめ復習タイミング：{guide.reviewTiming}
            </p>
          )}
        </section>
      )}

      {/* ここだけ覚える */}
      {guide?.keyPoints && (
        <section id="key-points" className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 mb-4 text-white shadow-md">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold tracking-wider">MUST</span>
            ここだけ覚える
          </h2>
          <ul className="space-y-2">
            {guide.keyPoints.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="bg-white/30 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 学習ガイド */}
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
          <section id="exam-focus" className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <h2 className="font-bold text-gray-800 mb-3">🎯 国家試験で狙われるポイント</h2>
            {guide.examTargets && guide.examTargets.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {guide.examTargets.map((tag, i) => (
                  <span key={i} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
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
          <section id="common-mistakes" className="bg-red-50 rounded-2xl border border-red-100 p-5 mb-4">
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
          <section id="memory-tips" className="bg-blue-50 rounded-2xl border border-blue-100 p-5 mb-4">
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
            <section id="study-order" className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
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

      {/* 学習ポイント */}
      <section className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-4">
        <h2 className="font-bold text-green-800 mb-3">💡 学習ポイント</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{theme.studyPoint}</p>
      </section>

      {/* 公式分類 */}
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

      {/* 関連リンク */}
      <section id="related" className="space-y-4 mb-4">
        {/* 関連テーマ */}
        {relatedThemes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
          </div>
        )}

        {/* 同じ科目のテーマ */}
        {sameSubjectThemes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-3">
              📚 同じ科目のテーマ
              {subject && <span className="text-xs font-normal text-gray-400 ml-2">（{subject.name}）</span>}
            </h2>
            <div className="flex flex-wrap gap-2">
              {sameSubjectThemes.map(t => (
                <Link
                  key={t.id}
                  href={`/themes/${t.id}`}
                  className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 hover:border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-xl text-sm text-gray-700 transition-all"
                >
                  {t.name}
                  <ImportanceBadge importance={t.importance} showLabel={false} />
                </Link>
              ))}
            </div>
            {subject && (
              <Link href={`/subjects/${subject.id}`} className="mt-3 inline-block text-xs text-green-600 hover:underline">
                {subject.name}の全テーマを見る →
              </Link>
            )}
          </div>
        )}

        {/* 重要度Sテーマ */}
        {theme.importance !== 'S' && sThemes.length > 0 && (
          <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
            <h2 className="font-bold text-red-800 mb-3">⭐ 重要度Sの最重要テーマ</h2>
            <div className="flex flex-wrap gap-2">
              {sThemes.map(t => (
                <Link
                  key={t.id}
                  href={`/themes/${t.id}`}
                  className="flex items-center gap-1.5 bg-white border border-red-100 hover:border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-xl text-sm text-gray-700 transition-all"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Meta */}
      <section className="text-xs text-gray-400 space-y-1 p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
        <p>出題基準: {theme.blueprintVersion}年版 / 問題数体制: {theme.questionCountMode}問</p>
        <p>ソース信頼度: {theme.sourceReliability}</p>
      </section>

      {/* フッターナビ */}
      <div className="flex gap-4 flex-wrap items-center pt-2 border-t border-gray-100">
        <Link href="/themes/library" className="text-sm text-green-600 hover:underline font-semibold">
          ← テーマ辞典トップ
        </Link>
        {subject && (
          <Link href={`/subjects/${subject.id}`} className="text-sm text-green-600 hover:underline">
            {subject.name}一覧
          </Link>
        )}
        <Link href="/themes" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          テーマ検索
        </Link>
        <Link href="/study" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          学習モード
        </Link>
        <Link href="/study/dashboard" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          ダッシュボード
        </Link>
      </div>
    </main>
  )
}
