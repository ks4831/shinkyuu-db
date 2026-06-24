import type { Metadata } from 'next'
import Link from 'next/link'
import {
  loadAllExamQuestions,
  aggregateByTheme,
  calcImportanceByCount,
} from '@/lib/examQuestions'
import ImportanceBadge from '@/components/ImportanceBadge'
import type { Importance } from '@/lib/types'

export const metadata: Metadata = {
  title: '直近3年（第32〜34回）出題傾向比較',
  description:
    '第32回（2024年）・第33回（2025年）・第34回（2026年）の鍼灸国家試験を3年横断比較。3年連続頻出テーマ・増減トレンド・科目別推移を分析し、第35回受験者への学習指針を提示。',
}

const THEME_LABELS: Record<string, string> = {
  'acupuncture-technique':     '刺鍼・灸法・作用機序',
  'meridians-acupoints':       '経絡経穴',
  'neurology':                 '神経疾患',
  'orthopedics':               '整形外科疾患',
  'rehabilitation':            'リハビリテーション',
  'tcm-clinical':              '弁証論治',
  'tcm-fundamentals':          '東洋医学基礎理論',
  'general-pathology':         '病理学総論',
  'cardiology':                '循環器疾患',
  'nervous-system':            '神経系解剖',
  'oncology':                  '腫瘍・悪性疾患',
  'pulmonology':               '呼吸器疾患',
  'gastroenterology':          '消化器疾患',
  'hari-kyu-law':              'あはき法',
  'endocrinology':             '内分泌疾患',
  'health-policy':             '健康政策',
  'neurophysiology':           '神経生理学',
  'nephrology':                '腎疾患',
  'hematology':                '血液疾患',
  'dermatology':               '皮膚疾患',
  'infectious-disease':        '感染症',
  'tcm-diagnosis':             '四診法',
  'musculoskeletal-system':    '筋骨格系解剖',
  'circulatory-system':        '循環系解剖',
  'reproductive-system':       '生殖系解剖',
  'endocrine-system':          '内分泌系解剖',
  'histology':                 '組織学',
  'visceral-anatomy':          '内臓解剖',
  'cardiovascular-physiology': '循環生理',
  'respiratory-physiology':    '呼吸生理',
  'metabolic-physiology':      '代謝生理',
  'renal-physiology':          '腎生理',
  'endocrine-physiology':      '内分泌生理',
  'reproductive-physiology':   '生殖生理',
  'gynecology':                '婦人科疾患',
  'clinical-general':          '臨床医学総論',
  'urology':                   '泌尿器疾患',
  'welfare-law':               '福祉法規',
  'social-security':           '社会保障制度',
  'maternal-child-health':     '母子保健',
  'infectious-disease-control':'感染症対策',
  'school-health':             '学校保健',
  'epidemiology':              '疫学',
  'medical-ethics':            '医の倫理',
  'medical-personnel-law':     '医療職の法規',
  'health-insurance-law':      '医療保険法規',
  'mental-health-law':         '精神保健法規',
}

function lbl(theme: string): string {
  return THEME_LABELS[theme] ?? theme
}

function pct(n: number, total: number): string {
  if (total === 0) return '0.0'
  return (n / total * 100).toFixed(1)
}

const RANK_COLORS = [
  'bg-yellow-400 text-yellow-900',
  'bg-gray-300 text-gray-700',
  'bg-orange-300 text-orange-800',
]

export default function Recent3YearsPage() {
  const allQ = loadAllExamQuestions()
  const q32 = allQ.filter(q => q.examRound === 32)
  const q33 = allQ.filter(q => q.examRound === 33)
  const q34 = allQ.filter(q => q.examRound === 34)
  const total32 = q32.length   // 180
  const total33 = q33.length   // 180
  const total34 = q34.length   // 180

  // ── 各回のテーマ集計 ─────────────────────────────
  const agg32 = aggregateByTheme(q32)
  const agg33 = aggregateByTheme(q33)
  const agg34 = aggregateByTheme(q34)

  const map32 = new Map(agg32.map(t => [t.normalizedTheme, t.count]))
  const map33 = new Map(agg33.map(t => [t.normalizedTheme, t.count]))
  const map34 = new Map(agg34.map(t => [t.normalizedTheme, t.count]))

  const top20_32 = new Set(agg32.slice(0, 20).map(t => t.normalizedTheme))
  const top20_33 = new Set(agg33.slice(0, 20).map(t => t.normalizedTheme))
  const top20_34 = new Set(agg34.slice(0, 20).map(t => t.normalizedTheme))

  // ── 3年合算ランキング TOP20 ─────────────────────
  const recent3Y = [...q32, ...q33, ...q34]
  const aggTotal = aggregateByTheme(recent3Y)
  const top20Total = aggTotal.slice(0, 20).map(t => ({
    theme: t.normalizedTheme,
    label: lbl(t.normalizedTheme),
    total: t.count,
    c32: map32.get(t.normalizedTheme) ?? 0,
    c33: map33.get(t.normalizedTheme) ?? 0,
    c34: map34.get(t.normalizedTheme) ?? 0,
    importance: calcImportanceByCount(
      Math.max(
        map32.get(t.normalizedTheme) ?? 0,
        map33.get(t.normalizedTheme) ?? 0,
        map34.get(t.normalizedTheme) ?? 0,
      )
    ) as Importance,
  }))
  const maxTotal = top20Total[0]?.total ?? 1
  const maxSingle = Math.max(...top20Total.map(t => Math.max(t.c32, t.c33, t.c34)), 1)

  // ── 3年連続上位テーマ ──────────────────────────
  const tripleTop = top20Total.filter(
    t => top20_32.has(t.theme) && top20_33.has(t.theme) && top20_34.has(t.theme)
  )

  // ── トレンド分析 ────────────────────────────────
  const allThemes = new Set([...map32.keys(), ...map33.keys(), ...map34.keys()])
  const trendList = Array.from(allThemes).map(theme => ({
    theme,
    c32: map32.get(theme) ?? 0,
    c33: map33.get(theme) ?? 0,
    c34: map34.get(theme) ?? 0,
    diff3234: (map34.get(theme) ?? 0) - (map32.get(theme) ?? 0),
    diff3334: (map34.get(theme) ?? 0) - (map33.get(theme) ?? 0),
  }))

  // 増加傾向: 32→33→34で増加しているか、34が32より大幅増
  const increasing = trendList
    .filter(t => t.c34 > t.c33 && t.c33 >= t.c32 && t.diff3234 >= 2)
    .sort((a, b) => b.diff3234 - a.diff3234)
    .slice(0, 8)

  // 減少傾向: 32→33→34で減少しているか、34が32より大幅減
  const decreasing = trendList
    .filter(t => t.c34 < t.c33 && t.c33 <= t.c32 && t.diff3234 <= -2)
    .sort((a, b) => a.diff3234 - b.diff3234)
    .slice(0, 8)

  // ── 科目別3年比較 ──────────────────────────────
  const subMap32 = new Map<string, number>()
  const subMap33 = new Map<string, number>()
  const subMap34 = new Map<string, number>()
  for (const q of q32) { const k = q.officialMedium ?? q.subject; subMap32.set(k, (subMap32.get(k) ?? 0) + 1) }
  for (const q of q33) { const k = q.officialMedium ?? q.subject; subMap33.set(k, (subMap33.get(k) ?? 0) + 1) }
  for (const q of q34) { const k = q.officialMedium ?? q.subject; subMap34.set(k, (subMap34.get(k) ?? 0) + 1) }

  const allSubs = new Set([...subMap32.keys(), ...subMap33.keys(), ...subMap34.keys()])
  const subjectList = Array.from(allSubs)
    .map(name => ({
      name,
      c32: subMap32.get(name) ?? 0,
      c33: subMap33.get(name) ?? 0,
      c34: subMap34.get(name) ?? 0,
    }))
    .sort((a, b) => (b.c32 + b.c33 + b.c34) - (a.c32 + a.c33 + a.c34))
  const maxSub = Math.max(...subjectList.map(s => Math.max(s.c32, s.c33, s.c34)), 1)

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <span className="text-gray-700">直近3年（第32〜34回）比較</span>
      </nav>

      {/* ── ヘッダー ─────────────────────────────── */}
      <section>
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-2">
          3-YEAR TREND ANALYSIS
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          直近3年（第32〜34回）
          <span className="text-green-600"> 出題傾向比較</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          2024年（第32回）・2025年（第33回）・2026年（第34回）実施 / 各180問 / 出題基準2020年版
        </p>

        {/* 凡例チップ */}
        <div className="mt-3 flex items-center gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-purple-400" />
            <span className="text-gray-600">第32回（2024年）</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-400" />
            <span className="text-gray-600">第33回（2025年）</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-gray-600">第34回（2026年）</span>
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '分析総問数',       value: `${total32 + total33 + total34}問`, sub: '3回分合計' },
            { label: '3年連続上位テーマ', value: `${tripleTop.length}種`,           sub: '3回全てTOP20' },
            { label: '増加傾向テーマ',   value: `${increasing.length}種`,           sub: '32→34で増加' },
            { label: '減少傾向テーマ',   value: `${decreasing.length}種`,           sub: '32→34で減少' },
          ].map(s => (
            <div
              key={s.label}
              className="bg-green-50 rounded-xl border border-green-100 px-4 py-3 text-center"
            >
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-black text-green-700 mt-0.5">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 1. 3年合算 TOP20 ────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">直近3年合算 頻出テーマ TOP20</h2>
        <p className="text-sm text-gray-500 mb-4">
          第32〜34回の合計問数によるランキング。各年の内訳も表示。
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {top20Total.map((t, i) => {
            const barTotal = Math.round((t.total / maxTotal) * 100)
            const bar32 = Math.round((t.c32 / maxSingle) * 100)
            const bar33 = Math.round((t.c33 / maxSingle) * 100)
            const bar34 = Math.round((t.c34 / maxSingle) * 100)
            return (
              <div key={t.theme} className="px-4 py-3">
                {/* ヘッダー行 */}
                <div className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      RANK_COLORS[i] ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-800">{t.label}</span>
                      <ImportanceBadge importance={t.importance} showLabel={false} />
                      {tripleTop.some(x => x.theme === t.theme) && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full font-semibold">
                          3年連続
                        </span>
                      )}
                    </div>
                    {/* 合算バー */}
                    <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-green-600" style={{ width: `${barTotal}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-green-700">{t.total}問</p>
                    <p className="text-xs text-gray-400">3年合算</p>
                  </div>
                </div>
                {/* 年別バー */}
                <div className="mt-2 ml-10 space-y-0.5">
                  {[
                    { year: '32回', bar: bar32, count: t.c32, color: 'bg-purple-400', text: 'text-purple-700' },
                    { year: '33回', bar: bar33, count: t.c33, color: 'bg-blue-400',   text: 'text-blue-700' },
                    { year: '34回', bar: bar34, count: t.c34, color: 'bg-green-500',  text: 'text-green-700' },
                  ].map(row => (
                    <div key={row.year} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-8 flex-shrink-0">{row.year}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${row.bar}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${row.text} w-8 text-right flex-shrink-0`}>
                        {row.count}問
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 2. 3年連続上位テーマ ────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">3年連続 TOP20 テーマ</h2>
        <p className="text-sm text-gray-500 mb-4">
          第32・33・34回すべてでトップ20にランクインした安定頻出テーマ（{tripleTop.length}種）
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tripleTop.map(t => {
            const trend =
              t.c34 > t.c33 && t.c33 >= t.c32
                ? { label: '増加傾向', cls: 'text-green-600 bg-green-50 border-green-200' }
                : t.c34 < t.c33 && t.c33 <= t.c32
                ? { label: '減少傾向', cls: 'text-red-500 bg-red-50 border-red-200' }
                : { label: '安定', cls: 'text-blue-600 bg-blue-50 border-blue-200' }
            return (
              <div key={t.theme} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800">{t.label}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{t.theme}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <ImportanceBadge importance={t.importance} showLabel={false} />
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${trend.cls}`}>
                      {trend.label}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded">{t.c32}問</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{t.c33}問</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">{t.c34}問</span>
                  <span className="text-gray-400 ml-1">合計{t.total}問</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 3 & 4. 増加・減少傾向 ───────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">増加・減少傾向テーマ</h2>
        <p className="text-sm text-gray-500 mb-4">
          第32回から第34回にかけて一貫して問数が増加または減少しているテーマ
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 増加傾向 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-700">増加傾向テーマ（上位8）</p>
            </div>
            {increasing.length === 0 ? (
              <p className="text-sm text-gray-400 italic">該当なし</p>
            ) : (
              <div className="space-y-2">
                {increasing.map(t => (
                  <div
                    key={t.theme}
                    className="bg-white rounded-lg border border-gray-100 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{lbl(t.theme)}</p>
                      <span className="flex-shrink-0 text-sm font-black text-green-600 ml-1">
                        +{t.diff3234}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      <span className="text-purple-600 font-semibold">{t.c32}問</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-blue-600 font-semibold">{t.c33}問</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-green-600 font-semibold">{t.c34}問</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 減少傾向 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-600">減少傾向テーマ（上位8）</p>
            </div>
            {decreasing.length === 0 ? (
              <p className="text-sm text-gray-400 italic">該当なし</p>
            ) : (
              <div className="space-y-2">
                {decreasing.map(t => (
                  <div
                    key={t.theme}
                    className="bg-white rounded-lg border border-gray-100 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{lbl(t.theme)}</p>
                      <span className="flex-shrink-0 text-sm font-black text-red-500 ml-1">
                        {t.diff3234}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      <span className="text-purple-600 font-semibold">{t.c32}問</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-blue-600 font-semibold">{t.c33}問</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-red-500 font-semibold">{t.c34}問</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. 科目別3年比較 ────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">科目別出題割合 3年比較</h2>
        <p className="text-sm text-gray-500 mb-3">
          各科目の出題数を3年並べて比較（紫＝32回 / 青＝33回 / 緑＝34回）
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          {subjectList.map(({ name, c32, c33, c34 }) => {
            const b32 = Math.round((c32 / maxSub) * 100)
            const b33 = Math.round((c33 / maxSub) * 100)
            const b34 = Math.round((c34 / maxSub) * 100)
            const trend34 = c34 - c33
            const trendLabel = trend34 > 0 ? `+${trend34}` : trend34 < 0 ? `${trend34}` : '±0'
            const trendColor = trend34 > 0 ? 'text-green-600' : trend34 < 0 ? 'text-red-500' : 'text-gray-400'
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 leading-snug">{name}</span>
                  <span className={`text-xs font-bold ${trendColor}`}>33→34: {trendLabel}</span>
                </div>
                {[
                  { bar: b32, count: c32, total: total32, color: 'bg-purple-400', text: 'text-purple-600', yr: '32回' },
                  { bar: b33, count: c33, total: total33, color: 'bg-blue-400',   text: 'text-blue-600',   yr: '33回' },
                  { bar: b34, count: c34, total: total34, color: 'bg-green-500',  text: 'text-green-600',  yr: '34回' },
                ].map(row => (
                  <div key={row.yr} className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-400 w-8 flex-shrink-0">{row.yr}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${row.bar}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${row.text} w-16 text-right flex-shrink-0`}>
                      {row.count}問 <span className="text-gray-300 font-normal">{pct(row.count, row.total)}%</span>
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 6. 考察・第35回への学習優先順位 ─────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">第35回受験者への学習優先順位</h2>
        <div className="space-y-4">

          <div className="bg-green-50 border border-green-100 rounded-xl p-5">
            <p className="text-sm font-bold text-green-700 mb-2">3年間の傾向まとめ</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>刺鍼・灸法・作用機序（acupuncture-technique）</strong>は3回連続1位を維持し、
              問数も一貫して増加しています（第32回35問・第33回以降さらに増加）。
              <strong>経絡経穴（meridians-acupoints）</strong>は3年間で2位を安定して確保し、
              特定穴・骨度法・経穴部位問題が毎回多数出題されています。
              <strong>整形外科・神経疾患・リハビリ</strong>は3年通じて上位を維持し、
              西洋医学臨床知識の基礎として必須の領域です。
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                rank: 1,
                imp: 'S' as Importance,
                title: '刺鍼・灸法・作用機序',
                guide: '3年連続1位・増加傾向。鍼の補瀉手技・禁忌・適応に加え、内因性オピオイド（βエンドルフィン・エンケファリン）・CGRP・下行性疼痛抑制系・施灸の炎症反応（ブラジキニン→コルチゾール）まで神経科学的機序を体系化する。きゅう理論（艾の品質・灸法の種類・輻射熱）も確実に押さえる。',
              },
              {
                rank: 2,
                imp: 'S' as Importance,
                title: '経絡経穴',
                guide: '3年連続2位。特定穴16種（原穴・郄穴・絡穴・八会穴・五兪穴・下合穴・八脈交会穴・募穴・背兪穴）を一覧で整理し、各穴の部位を骨度法と解剖学的ランドマークで取穴できるようにする。循経感伝現象・奇穴・流注方向の知識も毎回出題される。',
              },
              {
                rank: 3,
                imp: 'S' as Importance,
                title: '整形外科疾患 + 神経疾患',
                guide: '両テーマ合わせて3年間で最多クラスの出題数。神経根鑑別（L4/L5/S1・C6/C7）、徒手検査（トーマス・アイヒホッフ・SLR・モーレイ・エデン等）、末梢神経麻痺の変形（猿手・鷲手・下垂指・下垂手）、パーキンソン病の4大症状、手根管症候群・TOS・ドケルバンの鑑別を確実に習得する。',
              },
              {
                rank: 4,
                imp: 'A' as Importance,
                title: '弁証論治 + 東洋医学基礎理論',
                guide: '3年間安定して高い出題数。症例問題（証→治法→取穴の一貫推論）が増加傾向。八綱弁証・気血津液・臓腑弁証・六淫病因の知識を症例に当てはめる演習が必須。難経69難（虚則補其母）など配穴法の応用問題にも備える。',
              },
              {
                rank: 5,
                imp: 'A' as Importance,
                title: 'リハビリテーション医学',
                guide: '3年連続TOP5を維持。ブルンストロームステージ（Ⅰ〜Ⅵ）、脊髄損傷の障害型（中心性・前脊髄動脈症候群）、正常歩行の相（立脚60%・遊脚40%・二重支持期）、HDS-RとMMSEの評価項目の差、各職種（PT/OT/ST/MSW）の業務範囲を整理する。',
              },
              {
                rank: 6,
                imp: 'B' as Importance,
                title: '病理学総論 + あはき法',
                guide: '病理学は3年通じて安定出題（炎症分類・アレルギー型・腫瘍の発がん要因）。あはき法は法定事項（期限の数字：返納5日・届出10日・再交付30日）と施術所規制（面積基準・広告規制・名称規制）を暗記で確実に得点する。',
              },
            ].map(item => (
              <div key={item.rank} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                    {item.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-gray-800">{item.title}</span>
                      <ImportanceBadge importance={item.imp} showLabel={false} />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.guide}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 第35回への総括 */}
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-sm font-bold text-yellow-400 mb-3">第35回受験者への総括メッセージ</p>
            <ul className="space-y-2.5 text-sm text-gray-200 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">①</span>
                <span>
                  <strong className="text-white">3年連続上位テーマは「捨て問」にしない。</strong>
                  {tripleTop.length}種のテーマが3年連続でトップ20入り。これらは第35回でも高確率で出題される。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">②</span>
                <span>
                  <strong className="text-white">増加傾向テーマに比重を置く。</strong>
                  3年で一貫して増加しているテーマは出題者の重点シフトを示す。特に作用機序・弁証論治の深化問題は今後も増えると見込まれる。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">③</span>
                <span>
                  <strong className="text-white">減少傾向テーマは基礎だけ押さえる。</strong>
                  出題数が減っているテーマは深追いせず、基本事項の確認にとどめる。その分を増加傾向テーマの深堀りに充てる。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">④</span>
                <span>
                  <strong className="text-white">症例問題への対応力を鍛える。</strong>
                  3年間を通じて、症例を提示した上で診断・徒手検査・治療穴・弁証・治法を問う形式が主流となっている。個別知識の暗記だけでなく、臨床推論の演習が不可欠。
                </span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── ナビゲーション ───────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">各回の詳細分析</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/analysis/exam-32', label: '第32回 詳細分析', sub: '2024年実施', color: 'border-purple-100 hover:border-purple-300', badge: 'bg-purple-100 text-purple-700' },
            { href: '/analysis/exam-33', label: '第33回 詳細分析', sub: '2025年実施', color: 'border-blue-100 hover:border-blue-300', badge: 'bg-blue-100 text-blue-700' },
            { href: '/analysis/exam-34', label: '第34回 詳細分析', sub: '2026年実施 / 最新', color: 'border-green-100 hover:border-green-300', badge: 'bg-green-100 text-green-700' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`bg-white border rounded-xl p-5 text-center hover:shadow-sm transition-all ${item.color}`}
            >
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${item.badge}`}>
                分析を見る →
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-3">
          <Link
            href="/analysis/compare/33-vs-34"
            className="block bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">第33回 vs 第34回 2年比較</p>
            <p className="text-xs text-gray-400 mt-1">最新2年間の詳細な増減分析</p>
            <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              比較を見る →
            </span>
          </Link>
        </div>
      </section>

      {/* フッターナビ */}
      <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
        <Link href="/" className="text-green-600 hover:underline">← トップに戻る</Link>
        <Link href="/themes" className="text-green-600 hover:underline">テーマ一覧を見る →</Link>
      </div>
    </main>
  )
}
