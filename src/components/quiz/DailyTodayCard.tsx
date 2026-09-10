'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { peekDailyState, displayStreak, DAILY_COUNT, type DailyState } from '@/lib/dailyQuiz'

type View = {
  answered: number
  correct: number
  completed: boolean
  wrong: number
  streak: number
  longest: number
}

function derive(): View {
  const s: DailyState | null = peekDailyState()
  const ds = displayStreak()
  if (!s) return { answered: 0, correct: 0, completed: false, wrong: 0, streak: ds.current, longest: ds.longest }
  const answered = s.answers.filter((a) => a === true || a === false).length
  const correct = s.answers.filter((a) => a === true).length
  return {
    answered,
    correct,
    completed: s.completed,
    wrong: s.answers.filter((a) => a === false).length,
    streak: ds.current,
    longest: ds.longest,
  }
}

export default function DailyTodayCard({ compact = false }: { compact?: boolean }) {
  const [v, setV] = useState<View | null>(null)

  useEffect(() => {
    const sync = () => setV(derive())
    sync()
    window.addEventListener('shinkyuu-quiz-change', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('shinkyuu-quiz-change', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  // ハイドレーション不一致回避：クライアントで確定するまで既定表示
  const view: View = v ?? { answered: 0, correct: 0, completed: false, wrong: 0, streak: 0, longest: 0 }
  const cells = Array.from({ length: DAILY_COUNT }, (_, i) => i < view.answered)

  return (
    <div className={`rounded-2xl border-2 border-green-500 bg-gradient-to-b from-green-50 to-white ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-orange-700">🔥 連続学習 {view.streak}日</span>
        {view.longest > 0 && <span className="text-xs text-gray-400">最長 {view.longest}日</span>}
      </div>

      {view.completed ? (
        <>
          <p className={`mt-2 font-black text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>🎉 今日の10問 完了！</p>
          <p className="mt-1 text-sm text-gray-600">
            正解 <strong className="text-green-700">{view.correct} / {DAILY_COUNT}</strong>
            <span className="ml-1 text-gray-400">（正答率 {Math.round((view.correct / DAILY_COUNT) * 100)}%）</span>
          </p>
          <div className="mt-3 flex gap-2">
            {view.wrong > 0 ? (
              <Link href="/quiz/weak" className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-700">
                間違えた{view.wrong}問を復習
              </Link>
            ) : (
              <Link href="/quiz/daily" className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-700">
                今日の結果を見る
              </Link>
            )}
            <Link href="/dashboard" className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-700 hover:border-green-300">
              学習記録
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className={`mt-2 font-black text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>今日の10問</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {cells.map((done, i) => (
                <span key={i} className={`h-2.5 flex-1 rounded-full ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
              ))}
            </div>
            <span className="flex-shrink-0 text-xs font-bold text-gray-600">{view.answered} / {DAILY_COUNT}問</span>
          </div>
          <Link
            href="/quiz/daily"
            className="mt-3 block rounded-xl bg-green-600 px-5 py-3.5 text-center text-base font-bold text-white transition-colors hover:bg-green-700"
          >
            {view.answered > 0 ? '続きを解く' : '今日の10問を始める'}
          </Link>
          {view.answered === 0 && (
            <p className="mt-2 text-center text-[11px] text-gray-400">頻出・苦手・第35回新基準から毎日10問（学習用オリジナル問題）</p>
          )}
        </>
      )}
    </div>
  )
}
