import type { Metadata } from 'next'
import Link from 'next/link'
import {
  EXAM_ROUNDS,
  QUESTIONS_PER_ROUND,
} from '@/lib/examQuestions'
import { sixYearThemes } from '@/lib/analysisThemes'
import { ALL_QUESTIONS } from '@/lib/quiz'
import { ACUPOINTS } from '@/data/acupoints'
import HomeProgressCard from '@/components/quiz/HomeProgressCard'
import DailyTodayCard from '@/components/quiz/DailyTodayCard'

export const metadata: Metadata = {
  title: '鍼灸国試対策を、今日も10問｜スマホで解く国家試験クイズ',
  description:
    '過去6年・1,080問の出題分析にもとづくオリジナル問題を、1日10問スマホで。1問1画面・解説と図解つき、苦手は自動で復習リストへ。経穴学習にも対応。',
}

export default function HomePage() {
  // 直近6年の頻出テーマ
  const recentAgg = sixYearThemes().slice(0, 5)
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

          <div className="mt-5">
            <DailyTodayCard />
          </div>
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
          <Link
            href="/exam-35"
            className="mt-2.5 flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-bold text-violet-700 hover:bg-violet-100"
          >
            🆕 第35回は2026年版 新出題基準に対応
            <span aria-hidden>›</span>
          </Link>
        </div>
      </section>

      {/* ── 学習進捗 ───────────────────────────── */}
      <section className="px-4 pt-3">
        <div className="mx-auto max-w-md">
          <HomeProgressCard />
        </div>
      </section>

      {/* ── 2つの役割（過去問分析 と 学習クイズ の違い） ─── */}
      <section className="px-4 pt-6">
        <div className="mx-auto max-w-md">
          <h2 className="mb-2 text-sm font-bold text-gray-800">このサイトでできること</h2>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <Link href="/analysis/compare/recent-6-years" className="flex gap-3 p-4 hover:bg-gray-50">
              <span className="text-xl" aria-hidden="true">📊</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900">過去問分析</span>
                  <span className="flex-shrink-0 text-[11px] text-gray-400">第29〜34回</span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                  実際の過去問{(EXAM_ROUNDS.length * QUESTIONS_PER_ROUND).toLocaleString()}問を分析 → 何がよく出るかを見る
                </span>
              </span>
              <span className="self-center text-gray-300" aria-hidden="true">›</span>
            </Link>
            <Link href="/quiz" className="flex gap-3 p-4 hover:bg-gray-50">
              <span className="text-xl" aria-hidden="true">📝</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900">学習クイズ</span>
                  <span className="flex-shrink-0 text-[11px] text-gray-400">オリジナル問題</span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                  学習用オリジナル問題{ALL_QUESTIONS.length}問 → 頻出テーマを問題で勉強する
                </span>
              </span>
              <span className="self-center text-gray-300" aria-hidden="true">›</span>
            </Link>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
            学習クイズは過去問そのものではなく、過去問の頻出傾向や第35回の新出題基準をもとに作成した練習問題です。
          </p>
        </div>
      </section>

      {/* ── ほかのメニュー ─────────────────────── */}
      <section className="px-4 pt-5">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          {[
            { href: '/acupoints', emoji: '📍', title: '経穴', sub: `${ACUPOINTS.length}穴・特定穴中心`, cls: 'border-emerald-200' },
            { href: '/subjects', emoji: '📚', title: '科目', sub: '14科目の攻略', cls: 'border-blue-200' },
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
              <Link key={t.themeId} href={`/themes/${t.themeId}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm text-gray-800">{t.name}</span>
                    <span className="flex-shrink-0 text-[11px] text-gray-400">{t.subjectShort}</span>
                  </div>
                  <div className="mt-1 h-1 w-full rounded-full bg-gray-100">
                    <div className="h-1 rounded-full bg-green-500" style={{ width: `${Math.round((t.count / recentMax) * 100)}%` }} />
                  </div>
                </div>
                <span className="w-16 flex-shrink-0 text-right text-sm font-bold text-green-700">
                  {t.count}問<span className="block text-[10px] font-normal text-gray-400">{t.yearCount}/6年</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 注意書き ─────────────────────────── */}
      <section className="px-4 pt-8">
        <div className="mx-auto max-w-md">
          <Link
            href="/menu"
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 hover:border-green-200"
          >
            テーマ辞典・出題分析・すべてのメニュー
            <span className="text-gray-300" aria-hidden="true">›</span>
          </Link>
          <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
            <p className="font-semibold text-gray-600">このサイトについて</p>
            <p className="mt-1">
              学習クイズは公式過去問の問題文・選択肢をそのまま掲載していません。過去問の出題傾向や
              第35回の新出題基準にもとづく学習用オリジナル問題です。過去問分析は公益財団法人東洋療法
              研修試験財団が公表した試験データ（第29〜34回1,080問）をもとにした独自分析で、当サイトは非公式です。
              学習の記録はお使いの端末内にのみ保存されます。
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
