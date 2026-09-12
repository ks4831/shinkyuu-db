import type { Metadata } from 'next'
import Link from 'next/link'
import { EXAM_ROUNDS, QUESTIONS_PER_ROUND } from '@/lib/examQuestions'
import HomeProgressCard from '@/components/quiz/HomeProgressCard'
import DailyTodayCard from '@/components/quiz/DailyTodayCard'
import Exam35Line from '@/components/Exam35Line'

export const metadata: Metadata = {
  title: '鍼灸国試対策を、今日も10問｜スマホで解く国家試験クイズ',
  description:
    '過去6年・1,080問の出題分析にもとづくオリジナル問題を、1日10問スマホで。1問1画面・解説と図解つき、苦手は自動で復習リストへ。経穴学習にも対応。',
}

const OTHER_MODES = [
  { href: '/quiz/frequent', label: '頻出から解く' },
  { href: '/quiz/weak', label: '苦手を復習' },
  { href: '/quiz/subjects', label: '科目から選ぶ' },
  { href: '/quiz/standard-2026', label: '第35回 新基準' },
]

const PAST_QUESTIONS = (EXAM_ROUNDS.length * QUESTIONS_PER_ROUND).toLocaleString()

export default function HomePage() {
  return (
    <main className="pb-24">
      {/* ── Hero：主役は「今日の10問」 ───────────── */}
      <section className="bg-gradient-to-b from-green-50 to-white px-4 pt-9 pb-7">
        <div className="mx-auto max-w-md">
          <h1 className="text-[28px] font-black leading-tight text-gray-900">
            鍼灸国試、<br />今日も<span className="text-green-600">10問</span>。
          </h1>
          <Exam35Line className="mt-3" />

          <div className="mt-6">
            <DailyTodayCard />
          </div>
          <div className="mt-3">
            <HomeProgressCard />
          </div>
        </div>
      </section>

      {/* ── 過去問 ─────────────────────────────── */}
      <section className="px-4 pt-8">
        <div className="mx-auto max-w-md">
          <h2 className="mb-2.5 text-sm font-bold text-gray-700">過去問</h2>
          <Link
            href="/past-exams"
            className="flex items-center justify-between gap-3 rounded-2xl border border-green-300 bg-white p-4 hover:bg-green-50"
          >
            <span>
              <span className="block text-sm font-bold text-gray-900">実際の過去問を解く</span>
              <span className="mt-0.5 block text-xs text-gray-500">第34回・10問収録</span>
            </span>
            <span className="flex-shrink-0 text-gray-300" aria-hidden="true">›</span>
          </Link>
        </div>
      </section>

      {/* ── 予想問題 ───────────────────────────── */}
      <section className="px-4 pt-8">
        <div className="mx-auto max-w-md">
          <h2 className="mb-2.5 text-sm font-bold text-gray-700">予想問題</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {OTHER_MODES.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-xl border border-green-300 bg-white px-3 py-3.5 text-center text-sm font-bold text-green-700 hover:bg-green-50"
              >
                {m.label}
              </Link>
            ))}
          </div>
          <Link
            href="/quiz"
            className="mt-2.5 block rounded-xl bg-gray-50 px-3 py-2.5 text-center text-xs font-semibold text-gray-500 hover:bg-gray-100"
          >
            すべての予想問題 ›
          </Link>
        </div>
      </section>

      {/* ── 出題分析 ───────────────────────────── */}
      <section className="px-4 pt-8">
        <div className="mx-auto max-w-md">
          <h2 className="mb-2.5 text-sm font-bold text-gray-700">出題分析</h2>
          <Link
            href="/analysis/compare/recent-6-years"
            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 hover:border-green-300"
          >
            <span>
              <span className="block text-sm font-bold text-gray-900">出題傾向を見る</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                第{EXAM_ROUNDS[0]}〜{EXAM_ROUNDS[EXAM_ROUNDS.length - 1]}回・{PAST_QUESTIONS}問を分析
              </span>
            </span>
            <span className="flex-shrink-0 text-gray-300" aria-hidden="true">›</span>
          </Link>
        </div>
      </section>

      {/* ── ひとこと（1行） ────────────────────── */}
      <section className="px-4 pt-8">
        <div className="mx-auto max-w-md">
          <p className="text-[11px] leading-relaxed text-gray-400">
            予想問題は、過去問の頻出傾向などをもとにしたオリジナル問題です。学習記録は端末内にのみ保存されます。
            <Link href="/about" className="ml-1 text-green-600 hover:underline">くわしく</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
