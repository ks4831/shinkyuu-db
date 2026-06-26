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
  title: '第34回 出題分析',
  description:
    '第34回鍼灸国家試験（2026年）の出題傾向を頻出テーマ・科目・重要度で分析。来年受験者の学習優先順位ガイド付き。',
}

// normalizedTheme → 日本語ラベル
const THEME_LABELS: Record<string, string> = {
  'acupuncture-technique':    '刺鍼・灸法・作用機序',
  'meridians-acupoints':      '経絡経穴',
  'neurology':                '神経疾患',
  'orthopedics':              '整形外科疾患',
  'rehabilitation':           'リハビリテーション',
  'tcm-clinical':             '弁証論治',
  'tcm-fundamentals':         '東洋医学基礎理論',
  'general-pathology':        '病理学総論',
  'cardiology':               '循環器疾患',
  'nervous-system':           '神経系解剖',
  'oncology':                 '腫瘍・悪性疾患',
  'pulmonology':              '呼吸器疾患',
  'gastroenterology':         '消化器疾患',
  'hari-kyu-law':             'あはき法',
  'endocrinology':            '内分泌疾患',
  'health-policy':            '健康政策',
  'neurophysiology':          '神経生理学',
  'nephrology':               '腎疾患',
  'hematology':               '血液疾患',
  'dermatology':              '皮膚疾患',
  'infectious-disease':       '感染症',
  'tcm-diagnosis':            '四診法',
  'musculoskeletal-system':   '筋骨格系解剖',
  'circulatory-system':       '循環系解剖',
  'reproductive-system':      '生殖系解剖',
  'endocrine-system':         '内分泌系解剖',
  'histology':                '組織学',
  'visceral-anatomy':         '内臓解剖',
  'cardiovascular-physiology':'循環生理',
  'respiratory-physiology':   '呼吸生理',
  'metabolic-physiology':     '代謝生理',
  'renal-physiology':         '腎生理',
  'endocrine-physiology':     '内分泌生理',
  'reproductive-physiology':  '生殖生理',
  'gynecology':               '婦人科疾患',
  'clinical-general':         '臨床医学総論',
  'urology':                  '泌尿器疾患',
  'welfare-law':              '福祉法規',
  'social-security':          '社会保障制度',
  'maternal-child-health':    '母子保健',
  'infectious-disease-control':'感染症対策',
  'school-health':            '学校保健',
  'epidemiology':             '疫学',
  'medical-ethics':           '医の倫理',
  'medical-personnel-law':    '医療職の法規',
  'health-insurance-law':     '医療保険法規',
  'mental-health-law':        '精神保健法規',
}

const IMP_STYLE: Record<
  Importance,
  { bg: string; border: string; text: string; bar: string; label: string }
> = {
  S: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    bar: 'bg-red-500',
    label: '最重要（8問以上）',
  },
  A: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    bar: 'bg-orange-500',
    label: '重要（5〜7問）',
  },
  B: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    bar: 'bg-blue-500',
    label: '標準（3〜4問）',
  },
  C: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-500',
    bar: 'bg-gray-400',
    label: '参考（1〜2問）',
  },
}

function pct(count: number, total: number): string {
  return (count / total * 100).toFixed(1)
}

export default function Exam34AnalysisPage() {
  const allQuestions = loadAllExamQuestions()
  const exam34 = allQuestions.filter(q => q.examRound === 34)
  const total = exam34.length // 180

  // ── テーマ集計 ──────────────────────────────────
  const themeAggs = aggregateByTheme(exam34).map(t => ({
    ...t,
    importance: calcImportanceByCount(t.count) as Importance,
    label: THEME_LABELS[t.normalizedTheme] ?? t.normalizedTheme,
  }))
  const maxThemeCount = themeAggs[0]?.count ?? 1
  const uniqueThemeCount = themeAggs.length

  // ── 重要度グループ ────────────────────────────────
  const byImp: Record<Importance, typeof themeAggs> = { S: [], A: [], B: [], C: [] }
  for (const t of themeAggs) byImp[t.importance].push(t)

  // ── 科目別集計（officialMedium） ───────────────────
  const subjectMap = new Map<string, number>()
  for (const q of exam34) {
    const key = q.officialMedium ?? q.subject
    subjectMap.set(key, (subjectMap.get(key) ?? 0) + 1)
  }
  const subjectList = [...subjectMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
  const maxSubjectCount = subjectList[0]?.count ?? 1

  // ── 特徴指標 ─────────────────────────────────────
  const hariCount = exam34.filter(q => q.officialMedium === 'はり理論').length
  const kyuCount  = exam34.filter(q => q.officialMedium === 'きゅう理論').length
  const hariKyuCount = hariCount + kyuCount
  const meridianCount = exam34.filter(q => q.officialMedium === '経絡経穴概論').length
  const specialtyCount = hariKyuCount + meridianCount

  const neurologyCount   = themeAggs.find(t => t.normalizedTheme === 'neurology')?.count ?? 0
  const orthopedicsCount = themeAggs.find(t => t.normalizedTheme === 'orthopedics')?.count ?? 0
  const neuroOrthoCount  = neurologyCount + orthopedicsCount

  // ── 学習優先順位データ ────────────────────────────
  const studyPriorities = [
    {
      rank: 1,
      theme: 'acupuncture-technique',
      badge: 'S' as Importance,
      strategy:
        'はり・きゅうの作用機序を体系化。内因性オピオイド（βエンドルフィン・エンケファリン）、軸索反射、下行性疼痛抑制系、施灸の局所反応（CGRP・フレア現象）は必須。毫鍼の構造・手技・消毒・刺激量も毎回出題される。',
    },
    {
      rank: 2,
      theme: 'meridians-acupoints',
      badge: 'S' as Importance,
      strategy:
        '特定穴16種（原穴・郄穴・絡穴・八会穴・五兪穴・八脈交会穴・募穴・兪穴等）と経脈循行は暗記で確実に点が取れる。部位問題は解剖学的位置の精度が勝負。',
    },
    {
      rank: 3,
      theme: 'neurology+orthopedics',
      label: '神経疾患・整形外科',
      badge: 'S' as Importance,
      count: neuroOrthoCount,
      strategy:
        '頭痛の分類（緊張型・片頭痛・群発頭痛・薬物乱用頭痛）、神経根症状（L4/L5/S1）、徒手検査（ラセーグ・グラスピング等）、脊椎症の鑑別（脊髄症 vs 神経根症）を重点学習。',
    },
    {
      rank: 4,
      theme: 'tcm-clinical+tcm-fundamentals',
      label: '弁証論治・東洋医学基礎理論',
      badge: 'S' as Importance,
      count:
        (themeAggs.find(t => t.normalizedTheme === 'tcm-clinical')?.count ?? 0) +
        (themeAggs.find(t => t.normalizedTheme === 'tcm-fundamentals')?.count ?? 0),
      strategy:
        '弁証論治は症例問題で毎回4〜6問出題。舌診・脈診・証の確定（肝鬱化火・痰湿証・腎陽虚等）と治療穴選択を一気通貫で整理。気血津液・六淫・蔵象の基礎も並行して押さえる。',
    },
    {
      rank: 5,
      theme: 'general-pathology+cardiology',
      label: '病理学総論・循環器疾患',
      badge: 'A' as Importance,
      count:
        (themeAggs.find(t => t.normalizedTheme === 'general-pathology')?.count ?? 0) +
        (themeAggs.find(t => t.normalizedTheme === 'cardiology')?.count ?? 0),
      strategy:
        '病理学は壊死の種類（凝固・融解・乾酪）、浮腫の機序、TNM分類が頻出。循環器はフォンテイン分類、閉塞性動脈硬化症、心房細動の鑑別を絞って整理する。',
    },
  ].map(p => ({
    ...p,
    label: p.label ?? `${THEME_LABELS[p.theme] ?? p.theme}`,
    count:
      p.count ??
      (themeAggs.find(t => t.normalizedTheme === p.theme)?.count ?? 0),
  }))

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-green-600 transition-colors">
          トップ
        </Link>
        <span>›</span>
        <span className="text-gray-700">第34回 出題分析</span>
      </nav>

      {/* ── 1. 概要 ─────────────────────────────── */}
      <section>
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-2">
          EXAM ANALYSIS
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          第34回 鍼灸国家試験
          <span className="text-green-600"> 出題分析</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          2026年実施 / 出題基準2020年版 / 180問体制
        </p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '総問題数',     value: `${total}問`,              sub: 'AM 90問 + PM 90問' },
            { label: '出題テーマ数', value: `${uniqueThemeCount}種`,   sub: '集計キー別' },
            { label: '科目数',       value: `${subjectList.length}科目`, sub: '全科目出題あり' },
            { label: 'S判定テーマ',  value: `${byImp.S.length}種`,     sub: '8問以上' },
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

      {/* ── 2. 頻出テーマ TOP20 ─────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          頻出テーマ ランキング
          <span className="text-xs text-gray-400 font-normal ml-2">全{themeAggs.length}テーマ / 第34回</span>
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {themeAggs.slice(0, 10).map((theme, i) => {
            const style = IMP_STYLE[theme.importance]
            const barW = Math.round((theme.count / maxThemeCount) * 100)
            return (
              <div
                key={theme.normalizedTheme}
                className="flex items-center gap-3 px-4 py-3"
              >
                {/* 順位 */}
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : i === 1
                      ? 'bg-gray-300 text-gray-700'
                      : i === 2
                      ? 'bg-orange-300 text-orange-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {i + 1}
                </span>

                {/* テーマ名 + バー */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-gray-800 truncate">
                      {theme.label}
                    </span>
                    <ImportanceBadge importance={theme.importance} showLabel={false} />
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${style.bar}`}
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                </div>

                {/* 件数 */}
                <div className="text-right flex-shrink-0 w-14">
                  <p className="text-base font-bold text-green-700">{theme.count}問</p>
                  <p className="text-xs text-gray-400">{pct(theme.count, total)}%</p>
                </div>
              </div>
            )
          })}
        </div>

        {themeAggs.length > 10 && (
          <details className="mt-2">
            <summary className="cursor-pointer select-none text-sm text-green-600 hover:text-green-800 font-semibold px-1 py-2 list-none flex items-center gap-1.5">
              ▶ 11〜20位を見る
              <span className="text-gray-400 font-normal">（{Math.min(10, themeAggs.length - 10)}テーマ）</span>
            </summary>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mt-1">
              {themeAggs.slice(10, 20).map((theme, i) => {
                const style = IMP_STYLE[theme.importance]
                const barW = Math.round((theme.count / maxThemeCount) * 100)
                return (
                  <div key={theme.normalizedTheme} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500">{i + 11}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm text-gray-800 truncate">{theme.label}</span>
                        <ImportanceBadge importance={theme.importance} showLabel={false} />
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${barW}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 w-14">
                      <p className="text-base font-bold text-green-700">{theme.count}問</p>
                      <p className="text-xs text-gray-400">{pct(theme.count, total)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        )}

        {themeAggs.length > 20 && (
          <details className="mt-2">
            <summary className="cursor-pointer select-none text-sm text-green-600 hover:text-green-800 font-semibold px-1 py-2 list-none flex items-center gap-1.5">
              ▶ 21〜40位を見る
              <span className="text-gray-400 font-normal">（{Math.min(20, themeAggs.length - 20)}テーマ）</span>
            </summary>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mt-1">
              {themeAggs.slice(20, 40).map((theme, i) => {
                const style = IMP_STYLE[theme.importance]
                const barW = Math.round((theme.count / maxThemeCount) * 100)
                return (
                  <div key={theme.normalizedTheme} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500">{i + 21}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm text-gray-800 truncate">{theme.label}</span>
                        <ImportanceBadge importance={theme.importance} showLabel={false} />
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${barW}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 w-14">
                      <p className="text-base font-bold text-green-700">{theme.count}問</p>
                      <p className="text-xs text-gray-400">{pct(theme.count, total)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        )}

        {themeAggs.length > 40 && (
          <details className="mt-2">
            <summary className="cursor-pointer select-none text-sm text-green-600 hover:text-green-800 font-semibold px-1 py-2 list-none flex items-center gap-1.5">
              ▶ 41位以降を見る
              <span className="text-gray-400 font-normal">（{themeAggs.length - 40}テーマ）</span>
            </summary>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mt-1">
              {themeAggs.slice(40).map((theme, i) => {
                const style = IMP_STYLE[theme.importance]
                const barW = Math.round((theme.count / maxThemeCount) * 100)
                return (
                  <div key={theme.normalizedTheme} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500">{i + 41}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm text-gray-800 truncate">{theme.label}</span>
                        <ImportanceBadge importance={theme.importance} showLabel={false} />
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${barW}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 w-14">
                      <p className="text-base font-bold text-green-700">{theme.count}問</p>
                      <p className="text-xs text-gray-400">{pct(theme.count, total)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        )}
      </section>

      {/* ── 3. 重要度別分類 ─────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">重要度別分類</h2>
        <div className="space-y-4">
          {(['S', 'A', 'B', 'C'] as Importance[]).map(imp => {
            const themes = byImp[imp]
            if (themes.length === 0) return null
            const style = IMP_STYLE[imp]
            const totalCount = themes.reduce((s, t) => s + t.count, 0)
            return (
              <div
                key={imp}
                className={`rounded-xl border ${style.border} ${style.bg} p-4`}
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-xl font-black ${style.text}`}>{imp}</span>
                  <span className="text-sm text-gray-600">{style.label}</span>
                  <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">
                    {themes.length}テーマ / {totalCount}問
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {themes.map(t => (
                    <span
                      key={t.normalizedTheme}
                      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-white border ${style.border} ${style.text}`}
                    >
                      {t.label}
                      <span className="font-bold text-xs">{t.count}問</span>
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 4. 科目別出題割合 ───────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">科目別出題割合</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          {subjectList.map(({ name, count }) => {
            const barW = Math.round((count / maxSubjectCount) * 100)
            const p    = pct(count, total)
            return (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-32 flex-shrink-0 text-right leading-snug">
                  {name}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-green-500"
                    style={{ width: `${barW}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 w-8 text-right flex-shrink-0">
                  {count}
                </span>
                <span className="text-xs text-gray-400 w-10 flex-shrink-0">
                  {p}%
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 5. 第34回の特徴 ─────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">第34回の特徴</h2>

        {/* 比率カード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            {
              label: '鍼灸理論の比率',
              value: `${pct(hariKyuCount, total)}%`,
              sub:   `はり${hariCount}問 + きゅう${kyuCount}問`,
              color: 'text-green-700',
            },
            {
              label: '経絡経穴の比率',
              value: `${pct(meridianCount, total)}%`,
              sub:   `${meridianCount}問 / ${total}問`,
              color: 'text-blue-700',
            },
            {
              label: '神経・整形外科の比率',
              value: `${pct(neuroOrthoCount, total)}%`,
              sub:   `神経${neurologyCount}問 + 整形${orthopedicsCount}問`,
              color: 'text-orange-700',
            },
          ].map(item => (
            <div
              key={item.label}
              className="bg-white rounded-xl border border-gray-100 p-4 text-center"
            >
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* 総括コメント */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            <strong className="text-green-700">
              鍼灸専門科目（はり・きゅう理論 + 経絡経穴概論）の合計
            </strong>
            は{specialtyCount}問（{pct(specialtyCount, total)}%）と全体の約4割。
            第34回は専門理論の比重が高く、特に作用機序の問題が量・質ともに増加しました。
          </p>
          <p>
            <strong className="text-green-700">刺鍼・灸法・作用機序</strong>
            が37問でダントツ1位。
            内因性オピオイド・下行性疼痛抑制系・施灸の局所反応（CGRP・フレア現象）など
            神経科学的メカニズムの問題が充実しています。
          </p>
          <p>
            <strong className="text-green-700">神経疾患 + 整形外科</strong>
            で{neuroOrthoCount}問（{pct(neuroOrthoCount, total)}%）。
            徒手検査・神経根鑑別・頭痛分類の出題が安定して多く、
            西洋医学的臨床知識との統合が求められます。
          </p>
          <p>
            <strong className="text-green-700">東洋医学臨床論</strong>では
            弁証論治の症例統合問題（診断→治療方針→取穴）が連続10問出題（Q151〜160）。
            単純暗記ではなく臨床推論力が問われる傾向が明確です。
          </p>
        </div>
      </section>

      {/* ── 6. 学習優先順位 ─────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          来年受験者への学習優先順位
        </h2>
        <div className="space-y-3">
          {studyPriorities.map(item => (
            <div
              key={item.rank}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                  {item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-gray-800">
                      {item.label}
                    </span>
                    <ImportanceBadge importance={item.badge} showLabel={false} />
                    <span className="text-xs font-bold text-green-600">
                      {item.count}問
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.strategy}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. 比較リンク（準備中） ──────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">他の回と比較する</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/analysis/compare/33-vs-34"
            className="bg-white border border-green-100 rounded-xl p-5 text-center hover:border-green-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">第33回と比較する</p>
            <p className="text-xs text-gray-400 mt-1">第33回 vs 第34回 比較分析</p>
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              比較を見る →
            </span>
          </Link>
          <Link
            href="/analysis/compare/recent-3-years"
            className="bg-white border border-purple-100 rounded-xl p-5 text-center hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">直近3年（第32〜34回）比較</p>
            <p className="text-xs text-gray-400 mt-1">3年間の出題傾向トレンド・増減分析</p>
            <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              比較を見る →
            </span>
          </Link>
          <Link
            href="/analysis/compare/recent-4-years"
            className="bg-white border border-orange-100 rounded-xl p-5 text-center hover:border-orange-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">直近4年（第31〜34回）比較</p>
            <p className="text-xs text-gray-400 mt-1">4年間の出題傾向トレンド・増減分析</p>
            <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              比較を見る →
            </span>
          </Link>
          <Link
            href="/analysis/compare/recent-5-years"
            className="bg-white border border-teal-100 rounded-xl p-5 text-center hover:border-teal-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">直近5年（第30〜34回）比較</p>
            <p className="text-xs text-gray-400 mt-1">5年間の出題傾向トレンド・増減分析</p>
            <span className="inline-block mt-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              比較を見る →
            </span>
          </Link>
          <Link
            href="/analysis/compare/recent-6-years"
            className="bg-white border border-green-100 rounded-xl p-5 text-center hover:border-green-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">直近6年（第29〜34回）比較</p>
            <p className="text-xs text-gray-400 mt-1">6年間の出題傾向トレンド・増減分析</p>
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
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
