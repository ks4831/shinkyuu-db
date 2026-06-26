import type { Metadata } from 'next'
import Link from 'next/link'
import { subjects } from '@/lib/data'
import {
  loadAllExamQuestions,
  aggregateByTheme,
  calcImportanceByCount,
  aggregateToThemes,
} from '@/lib/examQuestions'
import ImportanceBadge from '@/components/ImportanceBadge'
import DailyThemes from '@/components/DailyThemes'
import type { Importance } from '@/lib/types'

export const metadata: Metadata = {
  title: '鍼灸国家試験 頻出分析DB | 第29〜34回1,080問分析',
  description:
    '第29〜34回1,080問を分析した鍼灸国家試験の出題傾向分析データベース。頻出テーマランキング・年度比較・科目別分析で効率よく学習できます。',
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

const RANK_BADGE = [
  'bg-yellow-400 text-yellow-900',
  'bg-gray-300 text-gray-700',
  'bg-orange-300 text-orange-800',
]

const POPULAR_THEMES = [
  { label: '原穴',         href: '/themes/gen-ketsu' },
  { label: '五兪穴',       href: '/themes/go-yu-ketsu' },
  { label: '十二経脈',     href: '/themes/juni-kei-myaku' },
  { label: '五行論',       href: '/themes/go-gyo-ron' },
  { label: '弁証論治',     href: '/themes/ben-sho-ron-chi' },
  { label: '経穴主治',     href: '/themes/kei-ketsu-shuchi' },
  { label: '自律神経',     href: '/themes/jiritsu-shinkei' },
  { label: '関係法規',     href: '/themes/kanke-hokki' },
]

export default function HomePage() {
  const allQ = loadAllExamQuestions()

  const recent6Y = allQ.filter(
    q => q.examRound === 29 || q.examRound === 30 || q.examRound === 31 || q.examRound === 32 || q.examRound === 33 || q.examRound === 34
  )
  const recentAgg = aggregateByTheme(recent6Y)
    .slice(0, 10)
    .map(t => ({
      theme: t.normalizedTheme,
      label: THEME_LABELS[t.normalizedTheme] ?? t.normalizedTheme,
      count: t.count,
      importance: calcImportanceByCount(t.count) as Importance,
    }))
  const recentMax = recentAgg[0]?.count ?? 1

  const allThemes = aggregateToThemes(allQ)
  const themeCount = allThemes.length

  return (
    <main>

      {/* ── Hero ────────────────────────────────── */}
      <section className="bg-gradient-to-b from-green-50 to-white px-4 pt-12 pb-10 text-center">
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-3">
          出題傾向分析データベース
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          鍼灸国家試験
          <span className="text-green-600"> 頻出分析DB</span>
        </h1>
        <p className="mt-3 text-base sm:text-lg text-gray-700 font-medium leading-snug">
          第29〜34回・
          <strong className="text-green-600 font-black">1,080問</strong>
          を分析した鍼灸国家試験データベース
        </p>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          過去問サイトではありません。どのテーマが何問出たか、増えているテーマはどれか、
          科目ごとの割合はどう変わったかを可視化する
          <strong className="text-gray-700">出題傾向の分析</strong>サイトです。
        </p>

        {/* ── CTAボタン：PC 3列×3段、スマホ 1列 */}
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-xl mx-auto">
          <Link
            href="/analysis/exam-34"
            className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            第34回 分析
          </Link>
          <Link
            href="/analysis/exam-33"
            className="bg-white text-green-700 border border-green-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors"
          >
            第33回 分析
          </Link>
          <Link
            href="/analysis/exam-32"
            className="bg-white text-green-700 border border-green-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors"
          >
            第32回 分析
          </Link>
          <Link
            href="/analysis/exam-31"
            className="bg-white text-green-700 border border-green-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors"
          >
            第31回 分析
          </Link>
          <Link
            href="/analysis/exam-30"
            className="bg-white text-green-700 border border-green-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors"
          >
            第30回 分析
          </Link>
          <Link
            href="/analysis/exam-29"
            className="bg-white text-green-700 border border-green-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors"
          >
            第29回 分析
          </Link>
          <Link
            href="/analysis/compare/recent-6-years"
            className="bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors sm:col-span-3"
          >
            直近6年比較（第29〜34回）
          </Link>
        </div>

        {/* ── テーマから探す */}
        <div className="mt-8 max-w-lg mx-auto text-left">
          <p className="text-sm font-semibold text-gray-700 text-center">テーマから探す</p>
          <p className="text-xs text-gray-500 mt-1 mb-3 text-center">
            気になるテーマ名から出題回数・重要度・年度推移を確認できます。
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_THEMES.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="px-3 py-1.5 text-sm bg-white border border-green-200 text-green-700 rounded-full hover:bg-green-50 hover:border-green-400 transition-colors shadow-sm"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/themes/library"
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-sm font-semibold"
            >
              テーマ辞典 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 実績セクション（Hero直下） ──────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: '分析年度',   value: '第29〜34回', sub: '6回分' },
              { label: '分析問題数', value: '1,080問',     sub: '各回180問×6回' },
              { label: '収録テーマ', value: `${themeCount}テーマ`, sub: '自動集計' },
              { label: '収録科目',   value: '14科目',      sub: '全科目網羅' },
              { label: '比較分析',   value: '6年対応',     sub: '年度別推移あり' },
            ].map(s => (
              <div
                key={s.label}
                className="bg-green-50 rounded-xl border border-green-100 px-3 py-3 text-center"
              >
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg sm:text-xl font-black text-green-700 mt-0.5 leading-tight">
                  {s.value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">

        {/* ── こんな人におすすめ ────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">こんな人におすすめ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: '🎓',
                title: '国家試験受験生',
                desc: '第31〜34回の頻出テーマをランキング順に確認して、出題確率の高い領域から効率よく学習できます。',
              },
              {
                icon: '📚',
                title: '学校の定期試験対策',
                desc: '科目別・テーマ別の出題回数を確認して、授業内容と国試の出題傾向を照らし合わせられます。',
              },
              {
                icon: '🔍',
                title: '苦手テーマ分析',
                desc: 'S〜Cの重要度別分類で自分の弱点テーマが試験に出やすいかどうかを素早く確認できます。',
              },
              {
                icon: '🎯',
                title: '頻出テーマだけ学びたい人',
                desc: '4年連続出題テーマ・増加傾向テーマを絞り込み、短期間で最大効果の学習計画を立てられます。',
              },
            ].map(item => (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── このサイトで分かること ───────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">このサイトで分かること</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: '📊',
                title: 'どのテーマが何問出たか',
                desc: '各テーマの出題数を科目・重要度別に一覧表示。S〜C の重要度判定付き。',
              },
              {
                icon: '📈',
                title: '直近で増えているテーマ',
                desc: '4年間の増減トレンドで、勢いのあるテーマ・減少傾向テーマを可視化。',
              },
              {
                icon: '🗂️',
                title: '科目ごとの出題割合',
                desc: '14科目それぞれが全体の何%を占めるか、4年間の変化とともに確認できる。',
              },
              {
                icon: '🎯',
                title: '来年受験者が優先すべき領域',
                desc: '4年連続出題・問数増加テーマから、学習優先順位を具体的に提示。',
              },
            ].map(item => (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 現在の分析状況 ───────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">現在の分析状況</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {[
              { round: '第34回', year: '2026年実施', status: '180問 分析済み', href: '/analysis/exam-34' },
              { round: '第33回', year: '2025年実施', status: '180問 分析済み', href: '/analysis/exam-33' },
              { round: '第32回', year: '2024年実施', status: '180問 分析済み', href: '/analysis/exam-32' },
              { round: '第31回', year: '2023年実施', status: '180問 分析済み', href: '/analysis/exam-31' },
              { round: '第30回', year: '2022年実施', status: '180問 分析済み', href: '/analysis/exam-30' },
              { round: '第29回', year: '2021年実施', status: '180問 分析済み', href: '/analysis/exam-29' },
              { round: '比較分析', year: '直近6年（第29〜34回）', status: '対応済み', href: '/analysis/compare/recent-6-years' },
              { round: '合計', year: '直近6年分', status: '1,080問 分析済み', href: null },
            ].map(item => (
              <div key={item.round} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <span className="font-semibold text-sm text-gray-800">{item.round}</span>
                  <span className="text-xs text-gray-400 ml-2">{item.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                    <span>✓</span> {item.status}
                  </span>
                  {item.href && (
                    <Link href={item.href} className="text-xs text-green-600 hover:underline whitespace-nowrap">
                      詳細 →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 直近4年の頻出テーマ TOP10 ──────────── */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                直近6年（第29〜34回）頻出テーマ TOP10
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                第29回〜第34回の合算問数によるランキング
              </p>
            </div>
            <Link href="/analysis/compare/recent-6-years" className="text-sm text-green-600 hover:underline whitespace-nowrap">
              6年比較分析を見る →
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {recentAgg.map((t, i) => {
              const barW = Math.round((t.count / recentMax) * 100)
              return (
                <div key={t.theme} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      RANK_BADGE[i] ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm text-gray-800">{t.label}</span>
                      <ImportanceBadge importance={t.importance} showLabel={false} />
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-green-500"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 w-14">
                    <p className="text-base font-bold text-green-700">{t.count}問</p>
                    <p className="text-xs text-gray-400">6年合算</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex gap-3 justify-end flex-wrap">
            <Link href="/analysis/exam-34" className="text-sm text-green-600 hover:underline">第34回の分析 →</Link>
            <Link href="/analysis/exam-33" className="text-sm text-green-600 hover:underline">第33回の分析 →</Link>
            <Link href="/analysis/exam-32" className="text-sm text-green-600 hover:underline">第32回の分析 →</Link>
            <Link href="/analysis/exam-31" className="text-sm text-green-600 hover:underline">第31回の分析 →</Link>
            <Link href="/analysis/exam-30" className="text-sm text-green-600 hover:underline">第30回の分析 →</Link>
            <Link href="/analysis/exam-29" className="text-sm text-green-600 hover:underline">第29回の分析 →</Link>
          </div>
        </section>

        {/* ── 今日の10テーマ ───────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">今日の10テーマ</h2>
            <p className="text-sm text-gray-500 mt-1">
              毎日変わるランダム10テーマ。すき間時間の確認に。
            </p>
          </div>
          <DailyThemes themes={allThemes} />
        </section>

        {/* ── 科目から探す ─────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">科目から探す</h2>
            <Link href="/subjects" className="text-sm text-green-600 hover:underline">
              全科目を見る →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {subjects.map(subject => {
              const count = allThemes.filter(t => t.subject === subject.id).length
              return (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.id}`}
                  className="bg-white rounded-xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-sm transition-all text-center"
                >
                  <p className="font-semibold text-gray-800 text-sm leading-snug">
                    {subject.shortName}
                  </p>
                  {count > 0 ? (
                    <p className="text-xs text-green-600 mt-1">{count}テーマ収録</p>
                  ) : (
                    <p className="text-xs text-gray-300 mt-1">準備中</p>
                  )}
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────── */}
        <section className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            まずは頻出ランキングから始めましょう
          </h2>
          <p className="text-sm text-green-100 mb-6 leading-relaxed">
            第29〜34回の1,080問から導き出した頻出テーマ。<br className="hidden sm:inline" />
            効率よく国家試験対策を進めましょう。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/analysis/exam-34"
              className="bg-white text-green-700 font-bold px-6 py-2.5 rounded-full text-sm hover:bg-green-50 transition-colors shadow-sm"
            >
              第34回分析を見る
            </Link>
            <Link
              href="/analysis/compare/recent-6-years"
              className="bg-green-500 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-green-400 transition-colors border border-green-400"
            >
              直近6年比較を見る
            </Link>
            <Link
              href="/themes"
              className="bg-transparent text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-green-500 transition-colors border border-green-400"
            >
              テーマ検索
            </Link>
          </div>
        </section>

        {/* ── 注意書き ─────────────────────────────── */}
        <section className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-2 text-xs text-gray-500 leading-relaxed">
          <p className="font-semibold text-gray-600">本データベースについて</p>
          <p>
            このサイトは<strong className="text-gray-700">問題文・選択肢を掲載しておらず</strong>、
            公益財団法人東洋療法研修試験財団が公表した公式問題をもとに
            出題テーマを独自に分類した<strong className="text-gray-700">分析データベース</strong>です（第29〜34回1,080問収録）。
            正解番号・解説・得点計算機能はありません。
          </p>
          <p>
            出題数・重要度の判定はすべて独自基準によるものです。
            試験の合否・難易度に関する公式見解ではありません。
          </p>
        </section>

      </div>
    </main>
  )
}
