import type { Metadata } from 'next'
import Link from 'next/link'
import { EXAM_ROUNDS, QUESTIONS_PER_ROUND } from '@/lib/examQuestions'
import { pastExamCoverage } from '@/lib/pastExams'
import { ALL_QUESTIONS } from '@/lib/quiz'

const pastExamAvailable = pastExamCoverage().filter((c) => c.available)
const PAST_EXAM_TOTAL = pastExamAvailable.reduce((sum, c) => sum + c.collected, 0).toLocaleString()
const PAST_EXAM_ROUND_RANGE = pastExamAvailable.length
  ? `第${Math.min(...pastExamAvailable.map((c) => c.round))}〜${Math.max(...pastExamAvailable.map((c) => c.round))}回`
  : ''
const QUIZ_TOTAL = ALL_QUESTIONS.length.toLocaleString()
const ANALYSIS_ROUND_RANGE = `第${EXAM_ROUNDS[0]}〜${EXAM_ROUNDS[EXAM_ROUNDS.length - 1]}回`
const ANALYSIS_TOTAL = (EXAM_ROUNDS.length * QUESTIONS_PER_ROUND).toLocaleString()

export const metadata: Metadata = {
  title: '鍼灸国家試験対策｜過去問・予想問題・出題分析',
  description: `鍼灸国家試験の過去問（${PAST_EXAM_ROUND_RANGE}・${PAST_EXAM_TOTAL}問）、頻出テーマから作成した予想問題${QUIZ_TOTAL}問、出題分析をひとつのサイトで。年度別・科目別・テーマ別にスマホで解けます。`,
}

/**
 * メイン3本柱。並び順＝視覚的優先順位（過去問 > 予想問題 > 出題分析）。
 * カテゴリ色はアクセント（上辺・アイコン・強調数値・CTA）だけに使う。
 */
const MAIN_CARDS = [
  {
    href: '/past-exams',
    title: '過去問',
    stat: `${PAST_EXAM_TOTAL}問`,
    desc: `${PAST_EXAM_ROUND_RANGE}の国家試験を収録`,
    note: '年度別・科目別・テーマ別',
    cta: '過去問を解く',
    primary: true,
    tone: {
      bar: 'bg-blue-600',
      icon: 'bg-blue-50 text-blue-700',
      stat: 'text-blue-700',
      cta: 'bg-blue-600 text-white group-hover:bg-blue-700',
      ring: 'hover:border-blue-300',
    },
    icon: (
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z" />
    ),
  },
  {
    href: '/quiz',
    title: '予想問題',
    stat: `${QUIZ_TOTAL}問`,
    desc: '頻出テーマから本番対策',
    note: null,
    cta: '予想問題を解く',
    primary: false,
    tone: {
      bar: 'bg-violet-500',
      icon: 'bg-violet-50 text-violet-700',
      stat: 'text-violet-700',
      cta: 'border border-violet-200 text-violet-700 group-hover:bg-violet-50',
      ring: 'hover:border-violet-300',
    },
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.8" fill="currentColor" />
      </>
    ),
  },
  {
    href: '/analysis/compare/recent-6-years',
    title: '出題分析',
    stat: `${EXAM_ROUNDS.length}年分を分析`,
    desc: `${ANALYSIS_ROUND_RANGE}・${ANALYSIS_TOTAL}問から\nよく出るテーマを確認`,
    note: null,
    cta: '出題分析を見る',
    primary: false,
    tone: {
      bar: 'bg-orange-400',
      icon: 'bg-orange-50 text-orange-700',
      stat: 'text-orange-700',
      cta: 'border border-orange-200 text-orange-700 group-hover:bg-orange-50',
      ring: 'hover:border-orange-300',
    },
    icon: <path d="M5 20V11M10 20V5M15 20v-7M20 20V9" />,
  },
]

const SUB_LINKS = [
  { href: '/acupoints', label: '経穴' },
  { href: '/subjects', label: '科目' },
  { href: '/dashboard', label: '学習記録' },
]

export default function HomePage() {
  return (
    <main className="pb-24">
      {/* ── Hero ─────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50/70 px-4 pt-8 pb-7 sm:pt-12 sm:pb-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold tracking-wide text-gray-500 sm:text-sm">鍼灸国家試験対策</p>
          <h1 className="mt-2 text-[24px] font-black leading-snug text-gray-900 sm:text-[34px]">
            過去問・予想問題・出題分析を
            <br />
            ひとつのサイトで。
          </h1>
          <p className="mt-3 text-sm font-semibold text-gray-600 sm:text-base">
            {PAST_EXAM_ROUND_RANGE} 過去問<span className="font-black text-blue-700">{PAST_EXAM_TOTAL}問</span>を収録
          </p>
        </div>
      </section>

      {/* ── メイン3カード（スマホ縦1列 / PC 3カラム） ── */}
      <section className="px-4 pt-5 sm:pt-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {MAIN_CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-4 pt-5 shadow-sm transition-colors md:p-5 md:pt-6 ${
                c.primary ? 'border-blue-200 shadow-md' : 'border-gray-200'
              } ${c.tone.ring}`}
            >
              <span className={`absolute inset-x-0 top-0 h-1 ${c.tone.bar}`} aria-hidden="true" />
              <span className="flex items-center gap-2.5">
                <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${c.tone.icon}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {c.icon}
                  </svg>
                </span>
                <span className="text-lg font-black text-gray-900">{c.title}</span>
              </span>

              <span className={`mt-3 block font-black leading-none ${c.tone.stat} ${c.primary ? 'text-[30px]' : 'text-[26px]'}`}>
                {c.stat}
              </span>
              <span className="mt-2 block whitespace-pre-line text-sm leading-relaxed text-gray-700">{c.desc}</span>
              {c.note && <span className="mt-1 block text-xs text-gray-500">{c.note}</span>}

              <span className="min-h-4 flex-1" aria-hidden="true" />
              <span
                className={`flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors ${c.tone.cta}`}
              >
                {c.cta} <span className="ml-1" aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── サブ導線（小さく） ─────────────────── */}
      <section className="px-4 pt-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-gray-400">ほかの機能</span>
          {SUB_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-9 items-center rounded-full border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            >
              {l.label} <span className="ml-1 text-gray-300" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ひとこと（1行） ────────────────────── */}
      <section className="px-4 pt-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] leading-relaxed text-gray-400">
            予想問題は、過去問の頻出傾向などをもとにしたオリジナル問題です。学習記録は端末内にのみ保存されます。
            <Link href="/about" className="ml-1 text-gray-500 underline hover:text-gray-700">くわしく</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
