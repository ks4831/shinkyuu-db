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
  title: '第29回 出題分析',
  description:
    '第29回鍼灸国家試験（2021年）の出題傾向を頻出テーマ・科目・重要度で分析。180問全問の分類データ。',
}

const THEME_LABELS: Record<string, string> = {
  'acupuncture-technique':     '刺鍼・灸法・作用機序',
  'meridians-acupoints':       '経絡経穴',
  'neurology':                 '神経疾患',
  'orthopedics':               '整形外科疾患',
  'rehabilitation':            'リハビリテーション',
  'tcm-clinical':              '弁証論治',
  'tcm-fundamentals':          '東洋医学基礎理論',
  'tcm-diagnosis':             '四診法',
  'general-pathology':         '病理学総論',
  'pathology':                 '病理学',
  'cardiology':                '循環器疾患',
  'nervous-system':            '神経系解剖',
  'oncology':                  '腫瘍・悪性疾患',
  'pulmonology':               '呼吸器疾患',
  'respiratory':               '呼吸器疾患',
  'gastroenterology':          '消化器疾患',
  'hari-kyu-law':              'あはき法',
  'endocrinology':             '内分泌疾患',
  'endocrine-disease':         '内分泌疾患',
  'health-policy':             '健康政策',
  'neurophysiology':           '神経生理学',
  'nephrology':                '腎疾患',
  'renal-urological':          '腎・泌尿器疾患',
  'hematology':                '血液疾患',
  'dermatology':               '皮膚疾患',
  'psychiatry':                '精神疾患',
  'infectious-disease':        '感染症',
  'immunology':                '免疫学',
  'musculoskeletal-system':    '筋骨格系解剖',
  'musculoskeletal-disease':   '運動器疾患',
  'circulatory-system':        '循環系解剖',
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
  'histology':                 '組織学',
}

const IMP_STYLE: Record<
  Importance,
  { bg: string; border: string; text: string; bar: string; label: string }
> = {
  S: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    bar: 'bg-red-500',    label: '最重要（8問以上）' },
  A: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500', label: '重要（5〜7問）' },
  B: { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   bar: 'bg-blue-500',   label: '標準（3〜4問）' },
  C: { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-500',   bar: 'bg-gray-400',   label: '参考（1〜2問）' },
}

function pct(n: number, total: number): string {
  if (total === 0) return '0.0'
  return (n / total * 100).toFixed(1)
}

export default function Exam29AnalysisPage() {
  const allQuestions = loadAllExamQuestions()
  const exam29 = allQuestions.filter(q => q.examRound === 29)
  const total = exam29.length

  const themeAggs = aggregateByTheme(exam29).map(t => ({
    ...t,
    importance: calcImportanceByCount(t.count) as Importance,
    label: THEME_LABELS[t.normalizedTheme] ?? t.normalizedTheme,
  }))
  const maxThemeCount = themeAggs[0]?.count ?? 1
  const uniqueThemeCount = themeAggs.length

  const byImp: Record<Importance, typeof themeAggs> = { S: [], A: [], B: [], C: [] }
  for (const t of themeAggs) byImp[t.importance].push(t)

  const subjectMap = new Map<string, number>()
  for (const q of exam29) {
    const key = q.officialMedium ?? q.subject
    subjectMap.set(key, (subjectMap.get(key) ?? 0) + 1)
  }
  const subjectList = [...subjectMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
  const maxSubjectCount = subjectList[0]?.count ?? 1

  const acuCount     = themeAggs.find(t => t.normalizedTheme === 'acupuncture-technique')?.count ?? 0
  const merCount     = themeAggs.find(t => t.normalizedTheme === 'meridians-acupoints')?.count ?? 0
  const tcmClinCount = themeAggs.find(t => t.normalizedTheme === 'tcm-clinical')?.count ?? 0
  const tcmCount     = (themeAggs.find(t => t.normalizedTheme === 'tcm-fundamentals')?.count ?? 0) + tcmClinCount
  const rehabCount   = themeAggs.find(t => t.normalizedTheme === 'rehabilitation')?.count ?? 0
  const neuroCount   = themeAggs.find(t => t.normalizedTheme === 'neurology')?.count ?? 0
  const pmSpecCount  = acuCount + merCount + tcmCount

  const studyPriorities = [
    {
      rank: 1,
      theme: 'tcm-clinical',
      badge: 'S' as Importance,
      strategy:
        '第29回でも弁証論治を中心とした東洋医学臨床論がPM専門科目の最多テーマ。Q101〜Q106の基礎概念問題、Q129〜Q160の症例型弁証問題（腰痛・頭痛・不眠・高血圧・膝痛・月経痛・冷え症など）と幅広い。「四診→弁証→取穴・治法」の思考過程を実践的に演習することが最優先。',
    },
    {
      rank: 2,
      theme: 'meridians-acupoints',
      badge: 'S' as Importance,
      strategy:
        '経絡経穴概論は20問以上出題。五兪穴（井・滎・兪・経・合の五行配当）・奇経八脈（八脈交会穴と対応奇経）・骨度法・特定穴（募穴・背兪穴・絡穴・郄穴・八会穴）・各経の経穴部位（12正経全経穴）を整理。部位は解剖学的ランドマークと組み合わせて記憶する。',
    },
    {
      rank: 3,
      theme: 'acupuncture-technique',
      badge: 'S' as Importance,
      strategy:
        'はり・きゅう理論は合計20問出題。はり理論では刺鍼角度・補法・瀉法（捻転・呼吸・迎随・開闔補瀉）・得気の概念・管鍼法・皮内鍼・低周波鍼通電（周波数別オピオイド）・感染管理・刺鍼禁忌を整理。きゅう理論では透熱灸・知熱灸・間接灸の種類・壮数・禁灸部位を習得する。',
    },
    {
      rank: 4,
      theme: 'rehabilitation',
      badge: 'A' as Importance,
      strategy:
        'リハビリテーション医学は10問以上出題。在宅リハ（訪問リハ・通所リハ）・廃用症候群とサルコペニアの鑑別・失語症の分類（ブローカ・ウェルニッケ）・脊髄損傷レベルと機能予後・脳性麻痺の分類（痙直型・アテトーゼ型）・パーキンソン病リハが頻出。ICFモデルとの連動も整理する。',
    },
    {
      rank: 5,
      theme: 'tcm-fundamentals',
      badge: 'A' as Importance,
      strategy:
        '東洋医学概論（Q91〜Q100）は10問固定出題。陰陽の属性・五行の相生相克・気血津液の種類と機能・五臓六腑の生理・六経弁証・六淫の特性・病因の分類（内因・外因・不内外因）を体系的に押さえる。八綱弁証・脈診（脈象と病証対応）も含めて基礎固めが重要。',
    },
  ].map(p => ({
    ...p,
    label: THEME_LABELS[p.theme] ?? p.theme,
    count: themeAggs.find(t => t.normalizedTheme === p.theme)?.count ?? 0,
  }))

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-green-600 transition-colors">
          トップ
        </Link>
        <span>›</span>
        <span className="text-gray-700">第29回 出題分析</span>
      </nav>

      {/* ── 1. 概要 */}
      <section>
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-2">
          EXAM ANALYSIS
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          第29回 鍼灸国家試験
          <span className="text-green-600"> 出題分析</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          2021年実施（令和3年）/ 出題基準2020年版 / 180問体制
        </p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '総問題数',     value: `${total}問`,               sub: 'AM 90問 + PM 90問' },
            { label: '出題テーマ数', value: `${uniqueThemeCount}種`,    sub: '集計キー別' },
            { label: '科目数',       value: `${subjectList.length}科目`, sub: '全科目出題あり' },
            { label: 'S判定テーマ',  value: `${byImp.S.length}種`,      sub: '8問以上' },
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

      {/* ── 2. 頻出テーマ ランキング */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          頻出テーマ ランキング
          <span className="text-xs text-gray-400 font-normal ml-2">全{themeAggs.length}テーマ / 第29回</span>
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {themeAggs.slice(0, 10).map((theme, i) => {
            const style = IMP_STYLE[theme.importance]
            const barW = Math.round((theme.count / maxThemeCount) * 100)
            return (
              <div key={theme.normalizedTheme} className="flex items-center gap-3 px-4 py-3">
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

      {/* ── 3. 重要度別分類 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">重要度別分類</h2>
        <div className="space-y-4">
          {(['S', 'A', 'B', 'C'] as Importance[]).map(imp => {
            const themes = byImp[imp]
            if (themes.length === 0) return null
            const style = IMP_STYLE[imp]
            const totalCount = themes.reduce((s, t) => s + t.count, 0)
            return (
              <div key={imp} className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
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

      {/* ── 4. 科目別出題割合 */}
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
                  <div className="h-3 rounded-full bg-green-500" style={{ width: `${barW}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-8 text-right flex-shrink-0">{count}</span>
                <span className="text-xs text-gray-400 w-10 flex-shrink-0">{p}%</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 5. 第29回の特徴 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">第29回の特徴</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            {
              label: 'PM専門科目の比率',
              value: `${pct(pmSpecCount, total)}%`,
              sub:   `鍼灸${acuCount}問 + 経穴${merCount}問 + 東洋医学${tcmCount}問`,
              color: 'text-orange-700',
            },
            {
              label: '弁証論治の比率',
              value: `${pct(tcmClinCount, total)}%`,
              sub:   `${tcmClinCount}問 / ${total}問（最多テーマ）`,
              color: 'text-blue-700',
            },
            {
              label: 'リハビリの比率',
              value: `${pct(rehabCount, total)}%`,
              sub:   `${rehabCount}問 / 神経疾患${neuroCount}問`,
              color: 'text-green-700',
            },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-5 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            <strong className="text-green-700">
              東洋医学臨床論（弁証論治）
            </strong>
            が第29回でも最大テーマ。Q101〜Q106の基礎的な弁証・脉診・配穴法問題に続き、Q129〜Q160の約32問が症例型弁証論治問題として出題。腰痛・頭痛・不眠・高血圧・月経痛・冷え症・膝痛・肩凝り・便秘・アレルギー性鼻炎など多彩な疾患への弁証適用が問われた。
          </p>
          <p>
            <strong className="text-green-700">経絡経穴概論</strong>
            は20問以上出題。五兪穴・奇経八脈（八脈交会穴）・特定穴（募穴・背兪穴・絡穴・郄穴・八会穴）・骨度法・12正経の経穴部位を網羅的に問う出題が続いている。
          </p>
          <p>
            <strong className="text-green-700">AM後半（Q71〜Q90）</strong>
            はリハビリテーション医学と臨床医学各論が混在。在宅リハ・廃用症候群・言語障害・歩行分析・嚥下障害・脊髄損傷・脳性麻痺・呼吸リハ・パーキンソン病リハ・関節リウマチなど幅広い疾患がリハビリ視点で問われた。
          </p>
          <p>
            <strong className="text-green-700">はり・きゅう理論</strong>
            はQ117・Q127〜Q128（はり理論）とQ161〜Q180（はり・きゅう理論各10問）で合計20問。刺鍼リスク管理・感染予防・低周波鍼通電・補瀉法・得気・灸の種類・壮数・禁忌が問われた。
          </p>
        </div>
      </section>

      {/* ── 6. 学習優先順位 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          受験者への学習優先順位
        </h2>
        <div className="space-y-3">
          {studyPriorities.map(item => (
            <div key={item.rank} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                  {item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-gray-800">{item.label}</span>
                    <ImportanceBadge importance={item.badge} showLabel={false} />
                    {item.count > 0 && (
                      <span className="text-xs font-bold text-green-600">{item.count}問</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.strategy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. 他の回を見る */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">他の回を見る / 比較する</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/analysis/exam-30"
            className="bg-white border border-green-100 rounded-xl p-5 text-center hover:border-green-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">第30回 出題分析</p>
            <p className="text-xs text-gray-400 mt-1">2022年実施 / 180問分析</p>
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              分析を見る →
            </span>
          </Link>
          <Link
            href="/analysis/exam-31"
            className="bg-white border border-green-100 rounded-xl p-5 text-center hover:border-green-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">第31回 出題分析</p>
            <p className="text-xs text-gray-400 mt-1">2023年実施 / 180問分析</p>
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              分析を見る →
            </span>
          </Link>
          <Link
            href="/analysis/exam-32"
            className="bg-white border border-green-100 rounded-xl p-5 text-center hover:border-green-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">第32回 出題分析</p>
            <p className="text-xs text-gray-400 mt-1">2024年実施 / 180問分析</p>
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              分析を見る →
            </span>
          </Link>
          <Link
            href="/analysis/exam-33"
            className="bg-white border border-green-100 rounded-xl p-5 text-center hover:border-green-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">第33回 出題分析</p>
            <p className="text-xs text-gray-400 mt-1">2025年実施 / 180問分析</p>
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              分析を見る →
            </span>
          </Link>
          <Link
            href="/analysis/exam-34"
            className="bg-white border border-green-100 rounded-xl p-5 text-center hover:border-green-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">第34回 出題分析</p>
            <p className="text-xs text-gray-400 mt-1">2026年実施 / 180問分析</p>
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              分析を見る →
            </span>
          </Link>
          <Link
            href="/analysis/compare/recent-6-years"
            className="bg-white border border-teal-100 rounded-xl p-5 text-center hover:border-teal-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">直近6年（第29〜34回）比較</p>
            <p className="text-xs text-gray-400 mt-1">6年間の出題傾向トレンド・増減分析</p>
            <span className="inline-block mt-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
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
