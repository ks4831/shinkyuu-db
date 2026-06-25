import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { subjects, getSubject, getThemesBySubject, getTheme } from '@/lib/data'
import { getSubjectGuide } from '@/lib/subjectGuides'
import ImportanceBadge from '@/components/ImportanceBadge'
import SubjectSearch from '@/components/SubjectSearch'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shinkyuu-db.vercel.app'

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
  const title = `${subject.name}｜鍼灸国家試験 完全攻略ガイド`
  const description = `【鍼灸国家試験】${subject.name}の頻出テーマランキング・学習ロードマップ・第35回予想を完全収録。出題回数・重要度分析・よく間違えるポイントまで徹底解説。`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/subjects/${subjectId}`,
      type: 'article',
    },
  }
}

const allRounds = [29, 30, 31, 32, 33, 34]

const IMP_BAR: Record<string, string> = {
  S: 'bg-red-400',
  A: 'bg-orange-400',
  B: 'bg-blue-400',
  C: 'bg-gray-300',
}

const LIKELIHOOD_STYLE: Record<string, { color: string; label: string }> = {
  high:   { color: 'bg-red-100 text-red-700 border-red-200',    label: '出題確率 高' },
  medium: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: '出題確率 中' },
  low:    { color: 'bg-gray-100 text-gray-600 border-gray-200',  label: '出題確率 低' },
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
  const top20 = sorted.slice(0, 20)

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
  const priorityThemes = [...sThemes, ...aThemes]

  const guide = getSubjectGuide(subjectId)

  const hasToc = subjectThemes.length > 0

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav aria-label="パンくず" className="flex items-center gap-2 text-sm text-gray-400 mb-5 flex-wrap">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span aria-hidden>›</span>
        <Link href="/subjects" className="hover:text-green-600 transition-colors">科目一覧</Link>
        <span aria-hidden>›</span>
        <span className="text-gray-700">{subject.name}</span>
      </nav>

      {/* ヘッダー */}
      <div id="overview" className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100 p-6 mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
        {guide ? (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{guide.overview}</p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">{subject.description}</p>
        )}
        {subjectThemes.length > 0 && (
          <div className="mt-4 flex items-center gap-4 flex-wrap text-sm">
            <span className="text-gray-500">収録テーマ: <strong className="text-gray-800">{subjectThemes.length}件</strong></span>
            {sCount > 0 && <span className="text-red-600 font-semibold">S×{sCount}</span>}
            {aCount > 0 && <span className="text-orange-600 font-semibold">A×{aCount}</span>}
            {bCount > 0 && <span className="text-blue-600 font-semibold">B×{bCount}</span>}
            {cCount > 0 && <span className="text-gray-400 font-semibold">C×{cCount}</span>}
            {guide && (
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                目安: {guide.studyHours}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 目次 */}
      {hasToc && (
        <nav aria-label="目次" className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 mb-5 text-sm">
          <p className="font-semibold text-gray-600 mb-2 text-xs tracking-wider uppercase">目次</p>
          <ul className="space-y-1 text-gray-600 columns-2 gap-x-8">
            <li><a href="#overview" className="hover:text-green-600 transition-colors">▸ 科目概要</a></li>
            <li><a href="#stats" className="hover:text-green-600 transition-colors">▸ 出題統計・重要度分布</a></li>
            {guide && <li><a href="#roadmap" className="hover:text-green-600 transition-colors">▸ 学習ロードマップ</a></li>}
            {priorityThemes.length > 0 && <li><a href="#priority" className="hover:text-green-600 transition-colors">▸ 学習優先テーマ</a></li>}
            {top20.length > 0 && <li><a href="#ranking" className="hover:text-green-600 transition-colors">▸ 頻出ランキングTOP{Math.min(20, top20.length)}</a></li>}
            {guide?.commonConfusions && guide.commonConfusions.length > 0 && (
              <li><a href="#confusions" className="hover:text-green-600 transition-colors">▸ よく間違えるポイント</a></li>
            )}
            {guide?.nextExamPredictions && guide.nextExamPredictions.length > 0 && (
              <li><a href="#predictions" className="hover:text-green-600 transition-colors">▸ 第35回予想テーマ</a></li>
            )}
            <li><a href="#all-themes" className="hover:text-green-600 transition-colors">▸ テーマ一覧（検索）</a></li>
          </ul>
        </nav>
      )}

      {subjectThemes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>このカテゴリのテーマデータは準備中です</p>
        </div>
      ) : (
        <>
          {/* 出題統計 */}
          <section id="stats" className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <h2 className="font-bold text-gray-800 mb-4">出題統計・重要度分布</h2>

            {/* 重要度分布バー */}
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
            <div className="flex gap-4 flex-wrap text-xs mb-5">
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

            {/* 年度別出題推移 */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">年度別・収録テーマ出題数推移</h3>
            <div className="grid grid-cols-6 gap-2">
              {allRounds.map(round => {
                const hitCount = subjectThemes.filter(t => t.examRounds.includes(round)).length
                const maxPossible = subjectThemes.length
                return (
                  <div key={round} className="flex flex-col items-center gap-1">
                    <div className="w-full h-20 flex items-end justify-center">
                      <div
                        className="w-8 rounded-t-md bg-green-400 transition-all"
                        style={{ height: maxPossible > 0 ? `${Math.max(8, (hitCount / maxPossible) * 80)}px` : '8px' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-green-700">{hitCount}</span>
                    <span className="text-xs text-gray-500">第{round}回</span>
                  </div>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400">各年度でこの科目から出題されたテーマ数（収録テーマ中）</p>
          </section>

          {/* 学習ロードマップ */}
          {guide && guide.roadmap.length > 0 && (
            <section id="roadmap" className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-4">
              <h2 className="font-bold text-green-800 mb-1">🗺 初学者向け学習ロードマップ</h2>
              <p className="text-xs text-green-600 mb-4">この順番で学習すると理解が積み上がります</p>
              <div className="space-y-2">
                {guide.roadmap.map((step, i) => {
                  const theme = step.themeId ? subjectThemes.find(t => t.id === step.themeId) : null
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <span className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-black flex items-center justify-center">
                          {i + 1}
                        </span>
                        {i < guide.roadmap.length - 1 && (
                          <div className="w-0.5 h-4 bg-green-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        {theme ? (
                          <Link
                            href={`/themes/${theme.id}`}
                            className="flex items-center gap-2 font-semibold text-sm text-gray-800 hover:text-green-700 transition-colors"
                          >
                            {step.name}
                            <ImportanceBadge importance={theme.importance} showLabel={false} />
                          </Link>
                        ) : (
                          <span className="font-semibold text-sm text-gray-800">{step.name}</span>
                        )}
                        {step.note && (
                          <p className="text-xs text-gray-500 mt-0.5">{step.note}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* 学習優先テーマ */}
          {priorityThemes.length > 0 && (
            <section id="priority" className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h2 className="font-bold text-gray-800 mb-3">⭐ 第35回 学習優先テーマ（S・A級）</h2>
              <div className="space-y-2">
                {priorityThemes.map((t, i) => (
                  <Link
                    key={t.id}
                    href={`/themes/${t.id}`}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100 hover:border-green-300 hover:bg-green-50 transition-all"
                  >
                    <span className={`w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0 ${
                      t.importance === 'S' ? 'bg-red-500' : 'bg-orange-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 font-semibold text-sm text-gray-800">{t.name}</span>
                    <ImportanceBadge importance={t.importance} showLabel={false} />
                    <span className="text-xs text-gray-400">{t.count}回出題</span>
                    <span className="text-xs text-gray-300">第{t.latestRound}回</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* TOP20ランキング */}
          {top20.length > 0 && (
            <section id="ranking" className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h2 className="font-bold text-gray-800 mb-4">
                出題回数 TOP{Math.min(20, top20.length)}
                <span className="text-xs text-gray-400 font-normal ml-2">第29〜34回 合算</span>
              </h2>
              <div className="space-y-2">
                {top20.map((t, i) => {
                  const maxCount = top20[0].count || 1
                  return (
                    <Link
                      key={t.id}
                      href={`/themes/${t.id}`}
                      className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-3 py-2.5 transition-colors group"
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        i === 0 ? 'bg-yellow-400 text-yellow-900' :
                        i === 1 ? 'bg-gray-300 text-gray-700' :
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
                          <span className="text-xs text-gray-400 ml-auto">直近第{t.latestRound}回</span>
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

          {/* よく間違えるポイント */}
          {guide && guide.commonConfusions.length > 0 && (
            <section id="confusions" className="bg-red-50 rounded-2xl border border-red-100 p-5 mb-4">
              <h2 className="font-bold text-red-800 mb-4">⚠ よく間違えるポイント</h2>
              <div className="space-y-4">
                {guide.commonConfusions.map((c, i) => (
                  <div key={i} className="bg-white rounded-xl border border-red-100 p-4">
                    <p className="font-semibold text-sm text-red-700 mb-1.5">✗ {c.title}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 第35回予想テーマ */}
          {guide && guide.nextExamPredictions.length > 0 && (
            <section id="predictions" className="bg-amber-50 rounded-2xl border border-amber-100 p-5 mb-4">
              <h2 className="font-bold text-amber-800 mb-1">🔮 第35回 狙われそうなテーマ</h2>
              <p className="text-xs text-amber-600 mb-4">過去4年の出題推移・出題頻度・未出テーマをもとにした予測です</p>
              <div className="space-y-3">
                {guide.nextExamPredictions.map((p, i) => {
                  const style = LIKELIHOOD_STYLE[p.likelihood]
                  return (
                    <div key={i} className="bg-white rounded-xl border border-amber-100 p-4">
                      <div className="flex items-start gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex-shrink-0 ${style.color}`}>
                          {style.label}
                        </span>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.reason}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* テーマ一覧（科目内検索付き） */}
          <SubjectSearch themes={sorted} subjectName={subject.name} />
        </>
      )}

      {/* フッターナビ */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4">
        <Link href="/subjects" className="text-sm text-green-600 hover:underline font-semibold">
          ← 科目一覧に戻る
        </Link>
        <Link href="/themes/library" className="text-sm text-green-600 hover:underline">
          テーマ辞典
        </Link>
        <Link href="/study/dashboard" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          学習ダッシュボード
        </Link>
        <Link href="/themes" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          テーマ検索
        </Link>
      </div>
    </main>
  )
}
