import type { Metadata } from 'next'
import Link from 'next/link'
import QuizSession from '@/components/quiz/QuizSession'
import { standard2026QuizCount } from '@/lib/quiz'

export const metadata: Metadata = {
  title: '第35回 新基準問題｜2026年版出題基準 対応クイズ',
  description:
    '第35回から適用される2026年版出題基準で新設・拡充された領域（EBM・研究倫理／日本伝統医学／緩和ケア／災害医療／内部障害リハ／女性疾患／高齢者に多い疾患／TRPチャネル）のオリジナル問題を10問ずつ。',
}

export default function Standard2026QuizPage() {
  const total = standard2026QuizCount()
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/" className="hover:text-green-600">ホーム</Link>
        <span className="mx-1">/</span>
        <Link href="/exam-35" className="hover:text-green-600">第35回対策</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">新基準問題</span>
      </nav>

      <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
        <h1 className="text-lg font-bold text-violet-900">第35回 新基準問題</h1>
        <p className="mt-1 text-xs leading-relaxed text-violet-800">
          2026年版出題基準で新設・拡充された領域だけを集めたオリジナル問題（全{total}問）から10問。
          過去6年（第29〜34回）の出題実績とは別枠の学習です。
        </p>
      </div>

      <QuizSession mode="standard2026" title="第35回 新基準問題" retryHref="/quiz/standard-2026" />
    </main>
  )
}
