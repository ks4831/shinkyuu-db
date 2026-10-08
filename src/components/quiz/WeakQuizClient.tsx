'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QuizRunner from './QuizRunner'
import { pickByIds, type QuizQuestion } from '@/lib/quiz'
import { readReviewTargets, reviewBreakdown, reviewHeading, type ReviewTargets } from '@/lib/reviewTargets'
import { trackSessionOnce } from '@/lib/analytics'

export default function WeakQuizClient({ count = 10 }: { count?: number }) {
  const [ready, setReady] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  // 出題開始時点の対象（回答で保存データが変わっても、このセッションの説明は固定）
  const [targets, setTargets] = useState<ReviewTargets | null>(null)

  useEffect(() => {
    // 間違えた問題（自動登録）を優先し、足りなければ復習リストで補う（重複は1問）
    const t = readReviewTargets(count)
    const picked = pickByIds(t.ids)
    setTargets(t)
    setQuestions(picked)
    setReady(true)
    // 復習を開始した（出題対象あり）。タブのセッション中に1回だけ計上する。
    if (picked.length > 0) {
      trackSessionOnce('review_start', { queued: t.available })
    }
  }, [count])

  if (!ready) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-gray-400">読み込み中…</div>
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-3xl">🌱</p>
        <p className="mt-3 font-bold text-gray-800">{reviewHeading('empty')}</p>
        <p className="mt-1 text-sm text-gray-500">
          予想問題を解いて間違えると、自動でここに追加されます。<br />
          解説の「☆ 復習に追加」でも登録できます。
        </p>
        <Link
          href="/quiz/daily"
          className="mt-6 inline-block rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700"
        >
          今日の10問を始める
        </Link>
      </div>
    )
  }

  return (
    <>
      {targets && (
        <p className="mx-auto max-w-md px-4 text-xs leading-relaxed text-gray-600">
          <span className="font-bold text-gray-800">{reviewHeading(targets.kind)}</span>
          <span className="ml-1">対象{targets.total}問（{reviewBreakdown(targets)}）</span>
        </p>
      )}
      <QuizRunner
        questions={questions}
        title="苦手復習"
        reviewHref="/quiz/weak"
        onFinished={(results) =>
          trackSessionOnce('review_complete', {
            score: results.filter(Boolean).length,
            total: results.length,
          })
        }
      />
    </>
  )
}
