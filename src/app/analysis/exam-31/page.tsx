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
  title: '第31回 出題分析',
  description:
    '第31回鍼灸国家試験（2023年）の出題傾向を頻出テーマ・科目・重要度で分析。180問全問の分類データ。',
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
  'endocrine-physiology':      '内分泌生理',
  'clinical-general':          '臨床医学総論',
  'social-security':           '社会保障制度',
  'epidemiology':              '疫学',
  'medical-ethics':            '医の倫理',
  'infectious-disease-control':'感染症対策',
  'moxibustion':               '灸法・作用機序',
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

export default function Exam31AnalysisPage() {
  const allQuestions = loadAllExamQuestions()
  const exam31 = allQuestions.filter(q => q.examRound === 31)
  const total = exam31.length

  const themeAggs = aggregateByTheme(exam31).map(t => ({
    ...t,
    importance: calcImportanceByCount(t.count) as Importance,
    label: THEME_LABELS[t.normalizedTheme] ?? t.normalizedTheme,
  }))
  const maxThemeCount = themeAggs[0]?.count ?? 1
  const uniqueThemeCount = themeAggs.length

  const byImp: Record<Importance, typeof themeAggs> = { S: [], A: [], B: [], C: [] }
  for (const t of themeAggs) byImp[t.importance].push(t)

  const subjectMap = new Map<string, number>()
  for (const q of exam31) {
    const key = q.officialMedium ?? q.subject
    subjectMap.set(key, (subjectMap.get(key) ?? 0) + 1)
  }
  const subjectList = [...subjectMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
  const maxSubjectCount = subjectList[0]?.count ?? 1

  const acuCount    = themeAggs.find(t => t.normalizedTheme === 'acupuncture-technique')?.count ?? 0
  const merCount    = themeAggs.find(t => t.normalizedTheme === 'meridians-acupoints')?.count ?? 0
  const tcmCount    = (themeAggs.find(t => t.normalizedTheme === 'tcm-fundamentals')?.count ?? 0)
                    + (themeAggs.find(t => t.normalizedTheme === 'tcm-clinical')?.count ?? 0)
                    + (themeAggs.find(t => t.normalizedTheme === 'tcm-diagnosis')?.count ?? 0)
  const pmSpecCount = acuCount + merCount + tcmCount

  const studyPriorities = [
    {
      rank: 1,
      theme: 'acupuncture-technique',
      badge: 'S' as Importance,
      strategy:
        '刺鍼・灸法は第31回でも最多出題。はり理論（Q161〜170）・きゅう理論（Q171〜180）の各10問に加え、PM臨床問題でも経穴選択・補瀉手技・鍼の生理作用（軸索反射・DNIC・TRPV1受容体）が出題。灸頭鍼・CNT・鍼尖形状も対策必須。',
    },
    {
      rank: 2,
      theme: 'meridians-acupoints',
      badge: 'S' as Importance,
      strategy:
        '経絡経穴は20問出題。十二経筋・奇経八脈の概要、骨度、交会穴（大椎）、兪府・消濼・後頸三角（扶突）など部位問題が中心。五要穴（原穴・絡穴・募穴）と脚気八処・中風七穴などの組合せ穴も頻出。',
    },
    {
      rank: 3,
      theme: 'rehabilitation',
      badge: 'A' as Importance,
      strategy:
        'リハビリはFIM（セルフケア＝整容）・ブルンストロームステージⅡ（共同運動出現＋痙縮開始）・C5残存頸髄損傷（肩外転可能）・ウィリアムス体操（腰椎前弯改善）・ロコモ度テストが出題。各職種の役割区分（OT＝利き手交換訓練・ST＝嚥下訓練）も確実に。',
    },
    {
      rank: 4,
      theme: 'tcm-fundamentals',
      badge: 'A' as Importance,
      strategy:
        '東洋医学基礎理論は五行色体（五臓五労）・気の種類（原気・宗気・衛気・営気）・六淫（生風は火邪）・七情（喜で気緩み食欲不振）・経脈病証（手の少陽三焦経）など概念の正確な記憶が問われる。湯液療法（鉱物使用・証を立てる）も出題。',
    },
    {
      rank: 5,
      theme: 'musculoskeletal-disease',
      badge: 'A' as Importance,
      strategy:
        '運動器疾患はL4神経根障害（膝伸展困難）・S1神経根障害（アキレス腱反射減弱・長母趾屈筋脱力）・ボンネットテスト（梨状筋症候群）・ウィリアムス体操・前十字靭帯（ラックマンテスト）・変形性膝関節症（内側痛・ロッキングなし）が出題パターン。',
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
        <span className="text-gray-700">第31回 出題分析</span>
      </nav>

      {/* ── 1. 概要 */}
      <section>
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-2">
          EXAM ANALYSIS
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          第31回 鍼灸国家試験
          <span className="text-green-600"> 出題分析</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          2023年実施（令和5年）/ 出題基準2020年版 / 180問体制
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

      {/* ── 2. 頻出テーマ TOP20 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          頻出テーマ ランキング
          <span className="text-xs text-gray-400 font-normal ml-2">全{themeAggs.length}テーマ / 第31回</span>
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

      {/* ── 5. 第31回の特徴 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">第31回の特徴</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            {
              label: 'PM専門科目の比率',
              value: `${pct(pmSpecCount, total)}%`,
              sub:   `鍼灸${acuCount}問 + 経穴${merCount}問 + 東洋医学${tcmCount}問`,
              color: 'text-orange-700',
            },
            {
              label: '刺鍼・灸法の比率',
              value: `${pct(acuCount, total)}%`,
              sub:   `${acuCount}問 / ${total}問`,
              color: 'text-blue-700',
            },
            {
              label: '経絡経穴の比率',
              value: `${pct(merCount, total)}%`,
              sub:   `${merCount}問 / ${total}問`,
              color: 'text-green-700',
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

        <div className="bg-green-50 border border-green-100 rounded-xl p-5 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            <strong className="text-green-700">刺鍼・灸法・作用機序</strong>
            がPM科目の主体となります。はり師専用問題（Q161〜170）では鍼の深度計算・鍼尖形状・クリーン・ニードル・テクニック・DNIC・軸索反射が出題。きゅう師専用（Q171〜180）では艾の製造・知熱灸・TRPV1受容体・ヒスタミン・ノルアドレナリンが問われました。
          </p>
          <p>
            <strong className="text-green-700">東洋医学概論</strong>
            は精の生理作用・三焦と原気・六淫（火邪の生風）・七情（喜による気緩み）・湯液療法（鉱物使用）・心腎不交・足の厥陰経病証など、基礎概念の正確な理解を問う問題が多数出題されました。
          </p>
          <p>
            <strong className="text-green-700">経絡経穴概論</strong>
            は20問出題。十二経筋（四肢末端から始まる）・任脈（子宮起始）・大椎（手三陽・足三陽の交会穴）・骨度・兪府（鎖骨下縁）・消濼（肘頭上方5寸）・扶突（後頸三角）が具体的な取穴部位として出題。
          </p>
          <p>
            <strong className="text-green-700">AM後半（Q71〜90）のリハビリ・臨床</strong>
            は FIM・ブルンストロームステージ・頸髄損傷・脳梗塞のADL訓練（利き手交換）・白血病の診断・過活動膀胱など幅広い臨床知識が必要な構成でした。
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
                    {item.count > 0 && (
                      <span className="text-xs font-bold text-green-600">
                        {item.count}問
                      </span>
                    )}
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

      {/* ── 7. 他の回と比較 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">他の回を見る / 比較する</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            href="/analysis/compare/recent-4-years"
            className="bg-white border border-purple-100 rounded-xl p-5 text-center hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-800">直近4年（第31〜34回）比較</p>
            <p className="text-xs text-gray-400 mt-1">4年間の出題傾向トレンド・増減分析</p>
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
