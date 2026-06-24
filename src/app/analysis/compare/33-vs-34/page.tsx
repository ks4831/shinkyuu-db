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
  title: '第33回 vs 第34回 出題傾向比較',
  description:
    '第33回（2025年）と第34回（2026年）の鍼灸国家試験を比較。共通頻出テーマ・増減ランキング・科目別変化を分析し、第35回受験者への学習指針を提示。',
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

function label(theme: string): string {
  return THEME_LABELS[theme] ?? theme
}

function pct(count: number, total: number): string {
  return (count / total * 100).toFixed(1)
}

const RANK_COLORS = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-700', 'bg-orange-300 text-orange-800']

export default function Compare33vs34Page() {
  const allQ = loadAllExamQuestions()
  const q33 = allQ.filter(q => q.examRound === 33)
  const q34 = allQ.filter(q => q.examRound === 34)
  const total33 = q33.length
  const total34 = q34.length

  // テーマ集計
  const agg33 = aggregateByTheme(q33)
  const agg34 = aggregateByTheme(q34)

  const map33 = new Map(agg33.map(t => [t.normalizedTheme, t.count]))
  const map34 = new Map(agg34.map(t => [t.normalizedTheme, t.count]))

  const top20_33 = new Set(agg33.slice(0, 20).map(t => t.normalizedTheme))
  const top20_34 = new Set(agg34.slice(0, 20).map(t => t.normalizedTheme))

  // ── 共通TOP20テーマ ──────────────────────────────
  const commonThemes = agg34
    .filter(t => top20_33.has(t.normalizedTheme) && top20_34.has(t.normalizedTheme))
    .map(t => ({
      theme: t.normalizedTheme,
      count33: map33.get(t.normalizedTheme) ?? 0,
      count34: t.count,
      imp34: calcImportanceByCount(t.count) as Importance,
    }))
    .sort((a, b) => b.count34 - a.count34)

  // ── 第33回のみ上位だったテーマ ─────────────────────
  const only33Themes = agg33
    .slice(0, 20)
    .filter(t => !top20_34.has(t.normalizedTheme))
    .map(t => ({
      theme: t.normalizedTheme,
      count33: t.count,
      count34: map34.get(t.normalizedTheme) ?? 0,
      imp33: calcImportanceByCount(t.count) as Importance,
    }))

  // ── 第34回のみ上位だったテーマ ─────────────────────
  const only34Themes = agg34
    .slice(0, 20)
    .filter(t => !top20_33.has(t.normalizedTheme))
    .map(t => ({
      theme: t.normalizedTheme,
      count34: t.count,
      count33: map33.get(t.normalizedTheme) ?? 0,
      imp34: calcImportanceByCount(t.count) as Importance,
    }))

  // ── テーマ増減ランキング ─────────────────────────
  const allThemes = new Set([...map33.keys(), ...map34.keys()])
  const diffList = Array.from(allThemes)
    .map(theme => ({
      theme,
      count33: map33.get(theme) ?? 0,
      count34: map34.get(theme) ?? 0,
      diff: (map34.get(theme) ?? 0) - (map33.get(theme) ?? 0),
    }))
    .filter(t => t.diff !== 0)
    .sort((a, b) => b.diff - a.diff)

  const increased = diffList.filter(t => t.diff > 0).slice(0, 8)
  const decreased = diffList.filter(t => t.diff < 0).slice(0, 8)

  // ── 科目別集計 ───────────────────────────────────
  const subMap33 = new Map<string, number>()
  const subMap34 = new Map<string, number>()
  for (const q of q33) {
    const k = q.officialMedium ?? q.subject
    subMap33.set(k, (subMap33.get(k) ?? 0) + 1)
  }
  for (const q of q34) {
    const k = q.officialMedium ?? q.subject
    subMap34.set(k, (subMap34.get(k) ?? 0) + 1)
  }

  const allSubjects = new Set([...subMap33.keys(), ...subMap34.keys()])
  const subjectList = Array.from(allSubjects)
    .map(name => ({
      name,
      count33: subMap33.get(name) ?? 0,
      count34: subMap34.get(name) ?? 0,
      diff: (subMap34.get(name) ?? 0) - (subMap33.get(name) ?? 0),
    }))
    .sort((a, b) => b.count34 - a.count34)

  const maxSubjectCount = Math.max(
    ...subjectList.map(s => Math.max(s.count33, s.count34))
  )

  const maxCommonCount = Math.max(...commonThemes.map(t => Math.max(t.count33, t.count34)), 1)

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
        <Link href="/" className="hover:text-green-600 transition-colors">
          トップ
        </Link>
        <span>›</span>
        <Link href="/analysis/exam-33" className="hover:text-green-600 transition-colors">
          第33回分析
        </Link>
        <span>›</span>
        <span className="text-gray-700">第33回 vs 第34回 比較</span>
      </nav>

      {/* ── ヘッダー ─────────────────────────────── */}
      <section>
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-2">
          COMPARATIVE ANALYSIS
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          第33回 vs 第34回
          <span className="text-green-600"> 出題傾向比較</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          2025年（第33回）・2026年（第34回）実施 / 各180問 / 出題基準2020年版
        </p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '共通TOP20テーマ', value: `${commonThemes.length}種`, sub: '両回でランクイン' },
            { label: '第33回のみ上位', value: `${only33Themes.length}種`, sub: '第34回では後退' },
            { label: '第34回のみ上位', value: `${only34Themes.length}種`, sub: '第34回で新登場' },
            { label: '増加テーマ数', value: `${increased.length}種`, sub: '問数が増えたテーマ' },
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

      {/* ── 1. 共通TOP20テーマ ──────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">共通 TOP20 テーマ</h2>
        <p className="text-sm text-gray-500 mb-4">
          第33回・第34回の両方でトップ20にランクインしたテーマ（{commonThemes.length}種）
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {commonThemes.map((t, i) => {
            const bar33 = Math.round((t.count33 / maxCommonCount) * 100)
            const bar34 = Math.round((t.count34 / maxCommonCount) * 100)
            const imp = calcImportanceByCount(Math.max(t.count33, t.count34)) as Importance
            return (
              <div key={t.theme} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    RANK_COLORS[i] ?? 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-gray-800">{label(t.theme)}</span>
                    <ImportanceBadge importance={imp} showLabel={false} />
                  </div>
                  {/* 33回バー */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-400 w-8 flex-shrink-0">33回</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-blue-400" style={{ width: `${bar33}%` }} />
                    </div>
                    <span className="text-xs font-bold text-blue-600 w-8 text-right">{t.count33}問</span>
                  </div>
                  {/* 34回バー */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-8 flex-shrink-0">34回</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: `${bar34}%` }} />
                    </div>
                    <span className="text-xs font-bold text-green-600 w-8 text-right">{t.count34}問</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 2 & 3. 一方のみ上位 ─────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 第33回のみ */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-1">
            第33回のみ上位だったテーマ
          </h2>
          <p className="text-xs text-gray-400 mb-3">第34回では圏外に後退</p>
          <div className="bg-blue-50 rounded-xl border border-blue-100 divide-y divide-blue-100">
            {only33Themes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">なし</p>
            ) : (
              only33Themes.map(t => (
                <div key={t.theme} className="flex items-center justify-between px-4 py-2.5 gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label(t.theme)}</p>
                    <p className="text-xs text-gray-400 font-mono">{t.theme}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-blue-600">{t.count33}問</p>
                    <p className="text-xs text-gray-400">第34回: {t.count34}問</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 第34回のみ */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-1">
            第34回のみ上位だったテーマ
          </h2>
          <p className="text-xs text-gray-400 mb-3">第33回では圏外から浮上</p>
          <div className="bg-green-50 rounded-xl border border-green-100 divide-y divide-green-100">
            {only34Themes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">なし</p>
            ) : (
              only34Themes.map(t => (
                <div key={t.theme} className="flex items-center justify-between px-4 py-2.5 gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label(t.theme)}</p>
                    <p className="text-xs text-gray-400 font-mono">{t.theme}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-600">{t.count34}問</p>
                    <p className="text-xs text-gray-400">第33回: {t.count33}問</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── 4. テーマ増減ランキング ─────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">テーマ増減ランキング</h2>
        <p className="text-sm text-gray-500 mb-4">
          第34回 − 第33回の問数差。正値は増加、負値は減少。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 増加 */}
          <div>
            <p className="text-sm font-semibold text-green-700 mb-2">増加したテーマ（上位8）</p>
            <div className="space-y-2">
              {increased.map(t => (
                <div
                  key={t.theme}
                  className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{label(t.theme)}</p>
                    <p className="text-xs text-gray-400">
                      {t.count33}問 → {t.count34}問
                    </p>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-base font-black text-green-600">
                    +{t.diff}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 減少 */}
          <div>
            <p className="text-sm font-semibold text-red-600 mb-2">減少したテーマ（上位8）</p>
            <div className="space-y-2">
              {decreased.map(t => (
                <div
                  key={t.theme}
                  className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{label(t.theme)}</p>
                    <p className="text-xs text-gray-400">
                      {t.count33}問 → {t.count34}問
                    </p>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-base font-black text-red-500">
                    {t.diff}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. 科目別比較 ───────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-1">科目別出題割合 比較</h2>
        <p className="text-sm text-gray-500 mb-4">
          各科目の出題数を第33回（青）と第34回（緑）で並べて表示
        </p>

        {/* 凡例 */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-400" />
            第33回
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
            第34回
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          {subjectList.map(({ name, count33, count34, diff }) => {
            const bar33 = Math.round((count33 / maxSubjectCount) * 100)
            const bar34 = Math.round((count34 / maxSubjectCount) * 100)
            const diffLabel =
              diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '±0'
            const diffColor =
              diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'
            return (
              <div key={name} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 leading-snug">{name}</span>
                  <span className={`text-xs font-bold ${diffColor}`}>{diffLabel}</span>
                </div>
                {/* 33回 */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-blue-400"
                      style={{ width: `${bar33}%` }}
                    />
                  </div>
                  <span className="text-xs text-blue-600 font-bold w-10 text-right">
                    {count33}問 <span className="text-gray-300 font-normal">{pct(count33, total33)}%</span>
                  </span>
                </div>
                {/* 34回 */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-green-500"
                      style={{ width: `${bar34}%` }}
                    />
                  </div>
                  <span className="text-xs text-green-600 font-bold w-10 text-right">
                    {count34}問 <span className="text-gray-300 font-normal">{pct(count34, total34)}%</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 6. 考察 ─────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">考察</h2>
        <div className="space-y-4">

          {/* 共通頻出テーマ */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-5">
            <p className="text-sm font-bold text-green-700 mb-2">共通頻出テーマ（連続して重要）</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>刺鍼・灸法・作用機序（acupuncture-technique）</strong>と
              <strong>経絡経穴（meridians-acupoints）</strong>は
              第33・34回とも最上位を占め、鍼灸国家試験の核心テーマとして安定した出題が続いています。
              <strong>弁証論治（tcm-clinical）</strong>・<strong>東洋医学基礎理論（tcm-fundamentals）</strong>も
              両回でS〜A判定を維持しており、東洋医学系の比重の高さは不変です。
              神経疾患・整形外科疾患も両回で上位に位置し、西洋医学臨床の基礎力が問われ続けています。
            </p>
          </div>

          {/* 増加傾向 */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
            <p className="text-sm font-bold text-orange-700 mb-2">増加傾向（第34回で強化）</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>刺鍼・灸法・作用機序</strong>は第34回でさらに問数が増加し、
              内因性オピオイド・CGRP・下行性疼痛抑制系など神経科学的メカニズムへの深い理解が求められるようになっています。
              また<strong>弁証論治</strong>では症例問題の連続出題（Q151〜Q160）が確認されており、
              単純暗記から臨床推論への移行が顕著です。病理学・循環器疾患の問数も増加傾向にあり、
              基礎医学と臨床医学の統合問題が増えています。
            </p>
          </div>

          {/* 減少傾向 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <p className="text-sm font-bold text-blue-700 mb-2">減少傾向（第34回で後退）</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              第33回で目立った<strong>特殊鍼法の詳細手技</strong>（古代九鍼・基本17手技の個別詳細）は
              第34回では大まかな作用機序問題に吸収された形で出題が変化しています。
              あはき法や社会保障関連科目は出題数がやや安定・微減の傾向があり、
              得点源として確実に押さえつつ深追いは不要です。
            </p>
          </div>

          {/* 第35回への示唆 */}
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-sm font-bold text-yellow-400 mb-3">第35回受験者への示唆</p>
            <ul className="space-y-2 text-sm text-gray-200 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">①</span>
                <span>
                  <strong className="text-white">刺鍼・灸法・作用機序は最重点。</strong>
                  2回連続1位であり問数も増加中。神経科学的作用機序（オピオイド・CGRP・下行性抑制系）まで理解を深める。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">②</span>
                <span>
                  <strong className="text-white">経絡経穴は暗記だけでなく応用を。</strong>
                  特定穴・骨度法・経穴部位は毎回多数出題。第35回もこの傾向は継続する可能性が高い。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">③</span>
                <span>
                  <strong className="text-white">弁証論治は症例推論で対策。</strong>
                  単純な証の暗記ではなく、証→治法→取穴の一気通貫の演習が必要。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">④</span>
                <span>
                  <strong className="text-white">神経・整形外科は両回安定の上位。</strong>
                  徒手検査・神経根鑑別・頭痛分類の3点セットは確実に押さえる。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400 flex-shrink-0">⑤</span>
                <span>
                  <strong className="text-white">病理学・循環器は増加トレンドに注目。</strong>
                  第34回で問数が増えた分野は第35回でも継続出題の可能性が高い。
                </span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── ナビゲーション ───────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">各回の詳細分析 / 比較</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/analysis/exam-33"
            className="bg-white border border-blue-100 rounded-xl p-5 text-center hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">第33回 詳細分析</p>
            <p className="text-xs text-gray-400 mt-1">2025年実施 / 前回</p>
            <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              分析を見る →
            </span>
          </Link>
          <Link
            href="/analysis/exam-34"
            className="bg-white border border-green-100 rounded-xl p-5 text-center hover:border-green-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">第34回 詳細分析</p>
            <p className="text-xs text-gray-400 mt-1">2026年実施 / 最新回</p>
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              分析を見る →
            </span>
          </Link>
          <Link
            href="/analysis/compare/recent-3-years"
            className="bg-white border border-purple-100 rounded-xl p-5 text-center hover:border-purple-300 hover:shadow-sm transition-all sm:col-span-2"
          >
            <p className="text-sm font-semibold text-gray-800">直近3年（第32〜34回）比較</p>
            <p className="text-xs text-gray-400 mt-1">3年間の出題傾向トレンド・増減分析</p>
            <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              比較を見る →
            </span>
          </Link>
        </div>
      </section>

      {/* フッターナビ */}
      <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
        <Link href="/" className="text-green-600 hover:underline">
          ← トップに戻る
        </Link>
        <Link href="/themes" className="text-green-600 hover:underline">
          テーマ一覧を見る →
        </Link>
      </div>
    </main>
  )
}
