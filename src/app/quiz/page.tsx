import type { Metadata } from 'next'
import Link from 'next/link'
import { ALL_QUESTIONS } from '@/lib/quiz'
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
    href: '/quiz/weak',
    emoji: '🩹',
    title: '苦手を復習',
    desc: '間違えた問題・復習登録した問題だけ。',
    accent: 'border-red-200 hover:border-red-400',
  },
  {
    href: '/quiz/subjects',
    emoji: '📚',
    title: '科目別',
    desc: '14科目から選んで、その科目だけ10問。',
    accent: 'border-blue-200 hover:border-blue-400',
  },
  {
    href: '/quiz/frequent',
    emoji: '🔥',
    title: '頻出問題',
    desc: '重要度S・Aの問題を優先して10問。',
    accent: 'border-orange-200 hover:border-orange-400',
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
    desc: '経絡経穴概論を中心に、経穴の問題だけ10問。',
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

      <h1 className="text-2xl font-bold text-gray-900">学習クイズ｜今日は何をやる？</h1>
      <p className="mt-1 text-sm text-gray-500">
        学習用オリジナル問題 全{ALL_QUESTIONS.length}問。1回10問・1問1画面。
      </p>

      <div className="mt-4">
        <DailyTodayCard />
      </div>

      <ProgressStrip className="mt-4" />

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs leading-relaxed text-gray-600">
        <p className="font-bold text-gray-700">このクイズについて</p>
        <p className="mt-1">
          過去問そのものではなく、過去問の頻出傾向や重要テーマ、第35回の新出題基準をもとに作成した学習用オリジナル問題です。
        </p>
      </div>

      <p className="mt-6 mb-2 text-xs font-semibold tracking-wider text-gray-400">ほかの解き方</p>
      <div className="space-y-3">
        {modes.map((m) => (
          <QuizStartCard key={m.href} {...m} />
        ))}
      </div>

      <p className="mt-6 rounded-xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
        公式過去問の問題文・選択肢はそのまま掲載していません。教科書レベルの一般的事実をもとに独自作成した学習用問題です。
        解答の記録はお使いの端末内（LocalStorage）にのみ保存されます。
      </p>
    </main>
  )
}
