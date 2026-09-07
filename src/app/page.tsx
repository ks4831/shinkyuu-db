import type { Metadata } from 'next'
import Link from 'next/link'
import {
  loadAllExamQuestions,
  aggregateByTheme,
  calcImportanceByCount,
  EXAM_ROUNDS,
  QUESTIONS_PER_ROUND,
} from '@/lib/examQuestions'
import { ALL_QUESTIONS } from '@/lib/quiz'
import { ACUPOINTS } from '@/data/acupoints'
import ImportanceBadge from '@/components/ImportanceBadge'
import HomeProgressCard from '@/components/quiz/HomeProgressCard'
import type { Importance } from '@/lib/types'

export const metadata: Metadata = {
  title: '鍼灸国試対策を、今日も10問｜スマホで解く国家試験クイズ',
  description:
    '過去6年・1,080問の出題分析にもとづくオリジナル問題を、1日10問スマホで。1問1画面・解説と図解つき、苦手は自動で復習リストへ。経穴学習にも対応。',
}

const THEME_LABELS: Record<string, string> = {
  'meridians-acupoints': '経絡経穴',
  'acupuncture-technique': '刺鍼・灸法',
  'tcm-clinical': '弁証論治',
  'tcm-fundamentals': '東洋医学基礎',
  'neurology': '神経疾患',
  'orthopedics': '整形外科疾患',
  'general-pathology': '病理学総論',
  'nervous-system': '神経系解剖',
  'rehabilitation': 'リハビリ',
  'cardiology': '循環器疾患',
}

export default function HomePage() {
  const allQ = loadAllExamQuestions()
  const recentAgg = aggregateByTheme(allQ)
    .slice(0, 8)
    .map((t) => ({
      theme: t.normalizedTheme,
      label: THEME_LABELS[t.normalizedTheme] ?? t.normalizedTheme,
      count: t.count,
      importance: calcImportanceByCount(t.count) as Importance,
    }))
  const recentMax = recentAgg[0]?.count ?? 1

  return (
    <main className="pb-24">
      {/* ── Hero ─────────────────────────────── */}
      <section className="bg-gradient-to-b from-green-50 to-white px-4 pt-8 pb-6">
        <div className="mx-auto max-w-md">
          <h1 className="text-[26px] font-black leading-snug text-gray-900">
            鍼灸国試対策を、<br />今日も<span className="text-green-600">10問</span>。
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            過去{EXAM_ROUNDS.length}年・<strong className="text-gray-800">{(EXAM_ROUNDS.length * QUESTIONS_PER_ROUND).toLocaleString()}問</strong>の出題分析から、効率よく学習。
            1問1画面・解説と図解つき。
          </p>

          <Link
            href="/quiz/random"
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-green-600 px-5 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-green-700"
          >
            10問クイズを始める
          </Link>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <Link
              href="/quiz/weak"
              className="rounded-xl border border-green-300 bg-white px-3 py-3 text-center text-sm font-bold text-green-700 hover:bg-green-50"
            >
              苦手を復習する
            </Link>
            <Link
              href="/acupoints"
              className="rounded-xl border border-green-300 bg-white px-3 py-3 text-center text-sm font-bold text-green-700 hover:bg-green-50"
            >
              経穴から学ぶ
            </Link>
          </div>
        </div>
      </section>

      {/* ── 学習進捗 ───────────────────────────── */}
      <section className="px-4">
        <div className="mx-auto max-w-md">
          <HomeProgressCard />
        </div>
      </section>

      {/* ── 4つのメニュー ─────────────────────── */}
      <section className="px-4 pt-6">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          {[
            { href: '/quiz', emoji: '📝', title: 'クイズ', sub: `全${ALL_QUESTIONS.length}問・10問ずつ`, cls: 'border-green-200' },
            { href: '/acupoints', emoji: '📍', title: '経穴', sub: `${ACUPOINTS.length}穴・特定穴中心`, cls: 'border-emerald-200' },
            { href: '/subjects', emoji: '📚', title: '科目', sub: '14科目の攻略', cls: 'border-blue-200' },
            { href: '/analysis/compare/recent-6-years', emoji: '📊', title: '分析', sub: '6年 頻出ランキング', cls: 'border-gray-200' },
          ].map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`flex flex-col rounded-2xl border-2 bg-white p-4 transition-colors hover:border-green-400 ${m.cls}`}
            >
              <span className="text-2xl" aria-hidden="true">{m.emoji}</span>
              <span className="mt-2 text-base font-bold text-gray-900">{m.title}</span>
              <span className="mt-0.5 text-xs text-gray-500">{m.sub}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 今日のひとことガイド ─────────────── */}
      <section className="px-4 pt-6">
        <div className="mx-auto max-w-md rounded-2xl bg-green-600 p-5 text-white">
          <p className="text-sm font-bold">3秒で決める、次にやること</p>
          <p className="mt-1 text-xs leading-relaxed text-green-100">
            迷ったら「10問クイズ」。間違えた問題は自動で復習リストに入ります。
            移動中は経穴の暗記、まとまった時間は科目別クイズがおすすめ。
          </p>
        </div>
      </section>

      {/* ── 頻出テーマ（分析ダイジェスト） ───── */}
      <section className="px-4 pt-8">
        <div className="mx-auto max-w-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800">直近6年の頻出テーマ</h2>
            <Link href="/analysis/compare/recent-6-years" className="text-xs text-green-600 hover:underline">
              分析を見る →
            </Link>
          </div>
          <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white">
            {recentAgg.map((t, i) => (
              <div key={t.theme} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm text-gray-800">{t.label}</span>
                    <ImportanceBadge importance={t.importance} showLabel={false} />
                  </div>
                  <div className="mt-1 h-1 w-full rounded-full bg-gray-100">
                    <div className="h-1 rounded-full bg-green-500" style={{ width: `${Math.round((t.count / recentMax) * 100)}%` }} />
                  </div>
                </div>
                <span className="w-12 flex-shrink-0 text-right text-sm font-bold text-green-700">{t.count}問</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── その他の機能 ─────────────────────── */}
      <section className="px-4 pt-8">
        <div className="mx-auto max-w-md">
          <h2 className="mb-3 text-base font-bold text-gray-800">くわしく調べる</h2>
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            {[
              { href: '/themes/library', label: 'テーマ辞典' },
              { href: '/analysis/exam-34', label: '第34回 分析' },
              { href: '/study/dashboard', label: 'テーマ学習管理' },
              { href: '/menu', label: 'すべてのメニュー' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3 font-semibold text-gray-700 hover:border-green-200"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 注意書き ─────────────────────────── */}
      <section className="px-4 pt-8">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
          <p className="font-semibold text-gray-600">このサイトについて</p>
          <p className="mt-1">
            クイズは公式過去問の問題文・選択肢をそのまま掲載していません。出題傾向にもとづく
            オリジナル問題です。出題分析は公益財団法人東洋療法研修試験財団が公表した試験データ
            （第29〜34回1,080問）をもとにした独自分析で、当サイトは非公式です。
            学習の記録はお使いの端末内にのみ保存されます。
          </p>
        </div>
      </section>
    </main>
  )
}
