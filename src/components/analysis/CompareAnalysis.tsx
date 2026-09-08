import Link from 'next/link'
import { rankThemes, subjectCountsForRounds } from '@/lib/analysisThemes'
import { getTheme } from '@/lib/data'
import { quizCountByTheme } from '@/lib/quiz'

const ROUND_META: Record<number, { year: string; bar: string; text: string }> = {
  29: { year: '2021', bar: 'bg-teal-400', text: 'text-teal-700' },
  30: { year: '2022', bar: 'bg-rose-400', text: 'text-rose-700' },
  31: { year: '2023', bar: 'bg-amber-400', text: 'text-amber-700' },
  32: { year: '2024', bar: 'bg-purple-400', text: 'text-purple-700' },
  33: { year: '2025', bar: 'bg-blue-400', text: 'text-blue-700' },
  34: { year: '2026', bar: 'bg-green-500', text: 'text-green-700' },
}

const pct = (n: number, total: number) => (total === 0 ? '0.0' : (n / total * 100).toFixed(1))

export default function CompareAnalysis({ rounds }: { rounds: number[] }) {
  const sorted = [...rounds].sort((a, b) => a - b)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const nY = sorted.length

  // 合算ランキング（themeId 基準）
  const combined = rankThemes(sorted)
  const totalQ = combined.reduce((s, r) => s + r.count, 0)
  const top20 = combined.slice(0, 20)
  const maxTotal = top20[0]?.count ?? 1
  const maxSingle = Math.max(1, ...top20.flatMap(r => sorted.map(rd => r.byRound[rd] ?? 0)))

  // 各回の TOP20 themeId 集合
  const perRoundTop = new Map(sorted.map(rd => [rd, new Set(rankThemes([rd]).slice(0, 20).map(r => r.themeId))]))
  const alwaysTop = top20.filter(r => sorted.every(rd => perRoundTop.get(rd)!.has(r.themeId)))

  // 単調増加 / 単調減少（差 first→last が ±2 以上）
  const trend = combined
    .map(r => {
      const seq = sorted.map(rd => r.byRound[rd] ?? 0)
      const diff = seq[seq.length - 1] - seq[0]
      let inc = true, dec = true
      for (let i = 1; i < seq.length; i++) { if (seq[i] < seq[i - 1]) inc = false; if (seq[i] > seq[i - 1]) dec = false }
      return { r, seq, diff, inc, dec }
    })
  const increasing = trend.filter(t => t.inc && t.diff >= 2).sort((a, b) => b.diff - a.diff).slice(0, 8)
  const decreasing = trend.filter(t => t.dec && t.diff <= -2).sort((a, b) => a.diff - b.diff).slice(0, 8)

  // 科目別 N年比較（officialMedium・14科目で安定）
  const subPerRound = new Map(sorted.map(rd => [rd, new Map(subjectCountsForRounds([rd]).map(s => [s.name, s.count]))]))
  const subjectNames = [...new Set(sorted.flatMap(rd => [...subPerRound.get(rd)!.keys()]))]
  const subjectRows = subjectNames
    .map(name => ({ name, byRound: Object.fromEntries(sorted.map(rd => [rd, subPerRound.get(rd)!.get(name) ?? 0])) as Record<number, number> }))
    .sort((a, b) => sorted.reduce((s, rd) => s + b.byRound[rd], 0) - sorted.reduce((s, rd) => s + a.byRound[rd], 0))
  const maxSub = Math.max(1, ...subjectRows.flatMap(s => sorted.map(rd => s.byRound[rd])))
  const roundTotals = Object.fromEntries(sorted.map(rd => [rd, subjectCountsForRounds([rd]).reduce((s, x) => s + x.count, 0)])) as Record<number, number>

  const Trail = ({ seq }: { seq: number[] }) => (
    <div className="mt-1 flex items-center gap-1 text-xs flex-wrap">
      {seq.map((n, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">→</span>}
          <span className={`font-semibold ${ROUND_META[sorted[i]].text}`}>{n}問</span>
        </span>
      ))}
    </div>
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <span className="text-gray-700">直近{nY}年（第{first}〜{last}回）比較</span>
      </nav>

      <section>
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-2">{nY}年トレンド分析</p>
        <h1 className="text-2xl font-bold text-gray-900">
          直近{nY}年（第{first}〜{last}回）<span className="text-green-600"> 出題傾向比較</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {sorted.map(rd => `第${rd}回（${ROUND_META[rd].year}年）`).join('・')} / 各180問 / 出題基準2020年版
        </p>
        <p className="mt-2 text-xs text-gray-400">
          集計は統一テーマ（themeId）基準。テーマ名をタップすると詳細と演習問題へ。
        </p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '分析総問数', value: `${totalQ}問`, sub: `${nY}回分合計` },
            { label: `${nY}回連続上位テーマ`, value: `${alwaysTop.length}種`, sub: `全回TOP20入り` },
            { label: '増加傾向テーマ', value: `${increasing.length}種`, sub: `第${first}→${last}回で増加` },
            { label: '減少傾向テーマ', value: `${decreasing.length}種`, sub: `第${first}→${last}回で減少` },
          ].map(s => (
            <div key={s.label} className="bg-green-50 rounded-xl border border-green-100 px-4 py-3 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-black text-green-700 mt-0.5">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 合算 頻出テーマ TOP20 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">直近{nY}年合算 頻出テーマ TOP20</h2>
        <p className="text-sm text-gray-500 mb-4">第{first}〜{last}回の合計問数（＝実出題数）による順位。各回の内訳も表示。</p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {top20.map((r, i) => (
            <div key={r.themeId} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-300 text-orange-800' : 'bg-gray-100 text-gray-500'
                }`}>{i + 1}</span>
                <Link href={`/themes/${r.themeId}`} className="flex-1 min-w-0 group">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-800 group-hover:text-green-700">{r.name}</span>
                    <span className="text-xs text-gray-400">{r.subjectShort}</span>
                    {alwaysTop.some(x => x.themeId === r.themeId) && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full font-semibold">{nY}回連続</span>
                    )}
                  </div>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-green-600" style={{ width: `${Math.round((r.count / maxTotal) * 100)}%` }} />
                  </div>
                </Link>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-green-700">{r.count}問</p>
                  <p className="text-xs text-gray-400">{r.yearCount}/{nY}年</p>
                </div>
              </div>
              <div className="mt-2 ml-10 space-y-0.5">
                {sorted.map(rd => {
                  const n = r.byRound[rd] ?? 0
                  return (
                    <div key={rd} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-9 flex-shrink-0">{rd}回</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${ROUND_META[rd].bar}`} style={{ width: `${Math.round((n / maxSingle) * 100)}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${ROUND_META[rd].text} w-8 text-right flex-shrink-0`}>{n}問</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 連続上位テーマ */}
      {alwaysTop.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-1">{nY}回連続 TOP20 テーマ（{alwaysTop.length}種）</h2>
          <p className="text-sm text-gray-500 mb-4">第{first}〜{last}回すべてでトップ20に入った安定頻出テーマ。</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alwaysTop.map(r => (
              <Link key={r.themeId} href={`/themes/${r.themeId}`} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-green-300 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-800">{r.name}</p>
                  <span className="flex-shrink-0 text-xs text-gray-400">{r.subjectShort}</span>
                </div>
                <Trail seq={sorted.map(rd => r.byRound[rd] ?? 0)} />
                <p className="mt-1 text-xs text-gray-400">合計{r.count}問 / 直近3回{r.recent3}問</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 増加・減少傾向 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">増加・減少傾向テーマ</h2>
        <p className="text-sm text-gray-500 mb-4">第{first}回から第{last}回にかけて一貫して問数が増加／減少しているテーマ（差±2以上）。</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-green-700 mb-3">▲ 増加傾向（上位{increasing.length}）</p>
            {increasing.length === 0 ? <p className="text-sm text-gray-400 italic">該当なし</p> : (
              <div className="space-y-2">
                {increasing.map(({ r, seq, diff }) => (
                  <Link key={r.themeId} href={`/themes/${r.themeId}`} className="block bg-white rounded-lg border border-gray-100 px-3 py-2.5 hover:border-green-300">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{r.name}</p>
                      <span className="flex-shrink-0 text-sm font-black text-green-600 ml-1">+{diff}</span>
                    </div>
                    <Trail seq={seq} />
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-red-600 mb-3">▼ 減少傾向（上位{decreasing.length}）</p>
            {decreasing.length === 0 ? <p className="text-sm text-gray-400 italic">該当なし</p> : (
              <div className="space-y-2">
                {decreasing.map(({ r, seq, diff }) => (
                  <Link key={r.themeId} href={`/themes/${r.themeId}`} className="block bg-white rounded-lg border border-gray-100 px-3 py-2.5 hover:border-red-200">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{r.name}</p>
                      <span className="flex-shrink-0 text-sm font-black text-red-500 ml-1">{diff}</span>
                    </div>
                    <Trail seq={seq} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 科目別 N年比較 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">科目別出題割合 {nY}年比較</h2>
        <p className="text-sm text-gray-500 mb-3">令和2年版出題基準の14科目別。各回の問数を並べて比較。</p>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          {subjectRows.map(s => {
            const t34 = s.byRound[last] - s.byRound[sorted[sorted.length - 2]]
            const tl = t34 > 0 ? `+${t34}` : t34 < 0 ? `${t34}` : '±0'
            const tc = t34 > 0 ? 'text-green-600' : t34 < 0 ? 'text-red-500' : 'text-gray-400'
            return (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 leading-snug">{s.name}</span>
                  <span className={`text-xs font-bold ${tc}`}>前回比 {tl}</span>
                </div>
                {sorted.map(rd => (
                  <div key={rd} className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-400 w-9 flex-shrink-0">{rd}回</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${ROUND_META[rd].bar}`} style={{ width: `${Math.round((s.byRound[rd] / maxSub) * 100)}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${ROUND_META[rd].text} w-16 text-right flex-shrink-0`}>
                      {s.byRound[rd]}問 <span className="text-gray-300 font-normal">{pct(s.byRound[rd], roundTotals[rd])}%</span>
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </section>

      {/* 学習優先順位 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">第35回受験者への学習優先順位</h2>
        <p className="text-sm text-gray-500 mb-4">直近{nY}年の合算出題数が多いテーマ順。学習ポイントは各詳細ページに。</p>
        <div className="space-y-3">
          {combined.slice(0, 6).map((r, i) => (
            <div key={r.themeId} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link href={`/themes/${r.themeId}`} className="font-semibold text-sm text-gray-800 hover:text-green-700">{r.name}</Link>
                    <span className="text-xs text-gray-400">{r.subjectShort}</span>
                    <span className="text-xs font-bold text-green-600">{nY}年で{r.count}問</span>
                    {quizCountByTheme(r.themeId) > 0 && (
                      <Link href={`/quiz/theme/${r.themeId}`} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">問題を解く（{quizCountByTheme(r.themeId)}）</Link>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{getTheme(r.themeId)?.studyPoint ?? ''}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 各回の詳細分析 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">各回の詳細分析</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sorted.map(rd => (
            <Link key={rd} href={`/analysis/exam-${rd}`} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-green-300 hover:shadow-sm transition-all">
              <p className="text-sm font-semibold text-gray-800">第{rd}回 分析</p>
              <p className="text-xs text-gray-400 mt-1">{ROUND_META[rd].year}年実施</p>
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
