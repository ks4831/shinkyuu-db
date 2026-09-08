'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QuizRunner from './QuizRunner'
import { pickByIds, type QuizQuestion } from '@/lib/quiz'
import { getWeakIds, getReviewIds } from '@/lib/quizStorage'

export default function WeakQuizClient({ count = 10 }: { count?: number }) {
  const [ready, setReady] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  useEffect(() => {
    // 苦手（自動登録）を優先し、足りなければ復習リストで補う
    const weak = getWeakIds()
    const review = getReviewIds().filter((id) => !weak.includes(id))
    const ids = [...weak, ...review]
    setQuestions(pickByIds(ids, count))
    setReady(true)
  }, [count])

  if (!ready) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-gray-400">読み込み中…</div>
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-3xl">🌱</p>
        <p className="mt-3 font-bold text-gray-800">復習が必要な問題はまだありません</p>
        <p className="mt-1 text-sm text-gray-500">
          クイズを解いて間違えると、自動でここに追加されます。<br />
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
    <QuizRunner
      questions={questions}
      title="苦手復習"
      reviewHref="/quiz/weak"
      retryHref="/quiz/weak"
    />
  )
}
