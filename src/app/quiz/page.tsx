import type { Metadata } from 'next'
import Link from 'next/link'
import QuizStartCard from '@/components/quiz/QuizStartCard'
import ProgressStrip from '@/components/quiz/ProgressStrip'
import DailyTodayCard from '@/components/quiz/DailyTodayCard'

export const metadata: Metadata = {
  title: '鍼灸国家試験 学習クイズ｜出題傾向にもとづくオリジナル問題を10問ずつ',
  description:
    '過去問そのものではなく、鍼灸国家試験の出題傾向・重要テーマ・第35回の新出題基準をもとにした学習用オリジナル問題を、1問1画面・10問ずつ。ランダム・頻出・経穴・科目別・苦手復習から選べます。',
}

const modes = [
  {
    href: '/quiz/frequent',
    emoji: '🔥',
    title: '頻出',
    desc: '重要度の高いテーマから10問。',
    accent: 'border-orange-200 hover:border-orange-400',
  },
  {
    href: '/quiz/weak',
    emoji: '🩹',
    title: '苦手復習',
    desc: '間違えた・復習登録した問題だけ。',
    accent: 'border-red-200 hover:border-red-400',
  },
  {
    href: '/quiz/subjects',
    emoji: '📚',
    title: '科目別',
    desc: '14科目から選んで10問。',
    accent: 'border-blue-200 hover:border-blue-400',
  },
  {
    href: '/quiz/standard-2026',
    emoji: '🆕',
    title: '第35回 新基準',
    desc: '2026年版で新設・拡充の領域から10問。',
    accent: 'border-violet-200 hover:border-violet-400',
  },
  {
    href: '/quiz/random',
    emoji: '🎲',
    title: 'ランダム',
    desc: '全範囲からランダムに10問。',
    accent: 'border-green-200 hover:border-green-400',
  },
  {
    href: '/quiz/acupoints',
    emoji: '📍',
    title: '経穴',
    desc: '経絡経穴概論を中心に10問。',
    accent: 'border-emerald-200 hover:border-emerald-400',
  },
]

export default function QuizTopPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/" className="hover:text-green-600">ホーム</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">学習クイズ</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">学習クイズ</h1>

      <div className="mt-4">
        <DailyTodayCard />
      </div>

      <ProgressStrip className="mt-3" />

      <p className="mt-7 mb-2 text-xs font-semibold tracking-wider text-gray-400">ほかの解き方</p>
      <div className="space-y-3">
        {modes.map((m) => (
          <QuizStartCard key={m.href} {...m} />
        ))}
      </div>

      <p className="mt-7 text-[11px] leading-relaxed text-gray-400">
        学習クイズは、過去問の傾向などをもとに作成したオリジナル問題です（過去問そのものではありません）。
        解答の記録はお使いの端末内（LocalStorage）にのみ保存されます。
      </p>
    </main>
  )
}
