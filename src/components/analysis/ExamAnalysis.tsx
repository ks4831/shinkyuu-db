import Link from 'next/link'
import { themesForRound, subjectCountsForRounds } from '@/lib/analysisThemes'
import { getTheme } from '@/lib/data'
import { quizCountByTheme } from '@/lib/quiz'
import type { Importance } from '@/lib/types'

const ROUND_YEAR: Record<number, string> = {
  29: '2021', 30: '2022', 31: '2023', 32: '2024', 33: '2025', 34: '2026',
}

const FREQ_STYLE: Record<Importance, { bg: string; border: string; text: string; bar: string; label: string }> = {
  S: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500', label: 'この回8問以上' },
  A: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500', label: 'この回5〜7問' },
  B: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500', label: 'この回3〜4問' },
  C: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', bar: 'bg-gray-400', label: 'この回1〜2問' },
}

const pct = (n: number, total: number) => (n / total * 100).toFixed(1)

const COMPARE_LINKS = [
  { href: '/analysis/compare/recent-3-years', title: '直近3年（第32〜34回）比較', sub: '3年間の出題傾向トレンド' },
  { href: '/analysis/compare/recent-4-years', title: '直近4年（第31〜34回）比較', sub: '4年間の出題傾向トレンド' },
  { href: '/analysis/compare/recent-5-years', title: '直近5年（第30〜34回）比較', sub: '5年間の出題傾向トレンド' },
  { href: '/analysis/compare/recent-6-years', title: '直近6年（第29〜34回）比較', sub: '6年間の出題傾向トレンド' },
]

export default function ExamAnalysis({ round }: { round: number }) {
  const rows = themesForRound(round)
  const total = rows.reduce((s, r) => s + r.count, 0) || 180
  const maxCount = rows[0]?.count ?? 1
  const subjectList = subjectCountsForRounds([round])
  const maxSubject = subjectList[0]?.count ?? 1

  const byTier: Record<Importance, typeof rows> = { S: [], A: [], B: [], C: [] }
  for (const r of rows) byTier[r.freqTier].push(r)

  // 鍼灸専門科目（はり理論 + きゅう理論 + 経絡経穴概論）
  const specialtyCount = subjectList
    .filter(s => ['はり理論', 'きゅう理論', '経絡経穴概論'].includes(s.name))
    .reduce((n, s) => n + s.count, 0)

  // 学習優先順位：この回の頻出上位5テーマ（themes[].studyPoint を根拠に）
  const priorities = rows.slice(0, 5).map(r => ({
    row: r,
    studyPoint: getTheme(r.themeId)?.studyPoint ?? '',
  }))

  const RankRow = ({ r, i }: { r: (typeof rows)[number]; i: number }) => {
    const style = FREQ_STYLE[r.freqTier]
    const w = Math.round((r.count / maxCount) * 100)
    return (
      <Link href={`/themes/${r.themeId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            i === 0 ? 'bg-yellow-400 text-yellow-900'
              : i === 1 ? 'bg-gray-300 text-gray-700'
              : i === 2 ? 'bg-orange-300 text-orange-800'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {i + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm text-gray-800">{r.name}</span>
            <span className="text-xs text-gray-400">{r.subjectShort}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${w}%` }} />
          </div>
        </div>
        <div className="text-right flex-shrink-0 w-16">
          <p className="text-base font-bold text-green-700">{r.count}問</p>
          <p className="text-xs text-gray-400">{pct(r.count, total)}%</p>
        </div>
      </Link>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <nav className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <span className="text-gray-700">第{round}回 出題分析</span>
      </nav>

      {/* 概要 */}
      <section>
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-2">出題傾向分析</p>
        <h1 className="text-2xl font-bold text-gray-900">
          第{round}回 鍼灸国家試験<span className="text-green-600"> 出題分析</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {ROUND_YEAR[round]}年実施 / 出題基準2020年版 / 180問体制
        </p>
        <p className="mt-2 text-xs text-gray-400">
          集計は統一テーマ（themeId）基準。テーマ名をタップすると詳細と演習問題へ。
        </p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '総問題数', value: `${total}問`, sub: 'AM 90 + PM 90' },
            { label: '出題テーマ数', value: `${rows.length}種`, sub: 'themeId 基準' },
            { label: '科目数', value: `${subjectList.length}科目`, sub: '全14科目出題' },
            { label: '8問以上テーマ', value: `${byTier.S.length}種`, sub: 'この回の頻出' },
          ].map(s => (
            <div key={s.label} className="bg-green-50 rounded-xl border border-green-100 px-4 py-3 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-black text-green-700 mt-0.5">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 頻出テーマ ランキング */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">頻出テーマ ランキング</h2>
        <p className="text-sm text-gray-500 mb-4">第{round}回の出題数（＝実問題数）による順位。全{rows.length}テーマ。</p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {rows.slice(0, 10).map((r, i) => <RankRow key={r.themeId} r={r} i={i} />)}
        </div>
        {rows.length > 10 && (
          <details className="mt-2">
            <summary className="cursor-pointer select-none text-sm text-green-600 hover:text-green-800 font-semibold px-1 py-2 list-none">
              ▶ 11位以降を見る（{rows.length - 10}テーマ）
            </summary>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mt-1 overflow-hidden">
              {rows.slice(10).map((r, i) => <RankRow key={r.themeId} r={r} i={i + 10} />)}
            </div>
          </details>
        )}
      </section>

      {/* 出題数別分類（頻出度。学習重要度とは別軸） */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">出題数別テーマ分類</h2>
        <p className="text-sm text-gray-500 mb-4">
          第{round}回でそのテーマが何問出たかによる区分。テーマ詳細ページの「学習優先度（S/A/B/C）」とは別軸です。
        </p>
        <div className="space-y-4">
          {(['S', 'A', 'B', 'C'] as Importance[]).map(tier => {
            const list = byTier[tier]
            if (list.length === 0) return null
            const style = FREQ_STYLE[tier]
            const sum = list.reduce((s, t) => s + t.count, 0)
            return (
              <div key={tier} className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-xl font-black ${style.text}`}>{tier}</span>
                  <span className="text-sm text-gray-600">{style.label}</span>
                  <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">{list.length}テーマ / {sum}問</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.map(t => (
                    <Link
                      key={t.themeId}
                      href={`/themes/${t.themeId}`}
                      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-white border ${style.border} ${style.text} hover:shadow-sm transition-shadow`}
                    >
                      {t.name}
                      <span className="font-bold text-xs">{t.count}問</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 科目別出題割合（14科目・Ver.7.2.1で確定） */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">科目別出題割合</h2>
        <p className="text-sm text-gray-500 mb-4">出題基準（令和2年版）の14科目別。第{round}回。</p>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          {subjectList.map(({ name, count }) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-32 flex-shrink-0 text-right leading-snug">{name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full bg-green-500" style={{ width: `${Math.round((count / maxSubject) * 100)}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-700 w-8 text-right flex-shrink-0">{count}</span>
              <span className="text-xs text-gray-400 w-10 flex-shrink-0">{pct(count, total)}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* 第XX回の特徴 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">第{round}回の特徴</h2>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            <strong className="text-green-700">鍼灸専門科目（はり理論＋きゅう理論＋経絡経穴概論）</strong>
            は{specialtyCount}問（{pct(specialtyCount, total)}%）。はり理論・きゅう理論は各10問（Q161〜170／Q171〜180）に固定され、
            経絡経穴概論20問（Q107〜126）・東洋医学臨床論34問（Q127〜160）と合わせた東洋医学系が合否を分けます。
          </p>
          <p>
            この回で最も出題が多かったのは
            <strong className="text-green-700">「{rows[0]?.name}」（{rows[0]?.subjectName}・{rows[0]?.count}問）</strong>、
            次いで「{rows[1]?.name}」（{rows[1]?.count}問）・「{rows[2]?.name}」（{rows[2]?.count}問）。
            8問以上出題されたテーマは{byTier.S.length}種でした。
          </p>
        </div>
      </section>

      {/* 学習優先順位（この回の頻出上位5テーマ・themes[].studyPoint を根拠に） */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">来年受験者への学習優先順位</h2>
        <p className="text-sm text-gray-500 mb-4">第{round}回で出題数が多かったテーマ順。各テーマの学習ポイントは詳細ページに。</p>
        <div className="space-y-3">
          {priorities.map(({ row: r, studyPoint }, idx) => (
            <div key={r.themeId} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link href={`/themes/${r.themeId}`} className="font-semibold text-sm text-gray-800 hover:text-green-700">
                      {r.name}
                    </Link>
                    <span className="text-xs text-gray-400">{r.subjectShort}</span>
                    <span className="text-xs font-bold text-green-600">{r.count}問</span>
                    {quizCountByTheme(r.themeId) > 0 && (
                      <Link href={`/quiz/theme/${r.themeId}`} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        問題を解く（{quizCountByTheme(r.themeId)}）
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{studyPoint}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 比較リンク */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">他の回と比較する</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COMPARE_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="bg-white border border-green-100 rounded-xl p-5 hover:border-green-300 hover:shadow-sm transition-all">
              <p className="text-sm font-semibold text-gray-800">{l.title}</p>
              <p className="text-xs text-gray-400 mt-1">{l.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-sm flex-wrap">
        <Link href="/" className="text-green-600 hover:underline">← トップに戻る</Link>
        <Link href="/themes" className="text-green-600 hover:underline">テーマ一覧を見る →</Link>
      </div>
    </main>
  )
}
