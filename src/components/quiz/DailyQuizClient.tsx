'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import QuizRunner from './QuizRunner'
import {
  getOrCreateDailyState,
  resolveDailyQuestions,
  recordDailyAnswer,
  finalizeDailyIfComplete,
  displayStreak,
  setThemeExamCount,
  type DailyState,
} from '@/lib/dailyQuiz'
import { subjectLabel, type QuizQuestion } from '@/lib/quiz'
import { trackDailyOnce } from '@/lib/analytics'

export default function DailyQuizClient({ themeExamCount }: { themeExamCount: Record<string, number> }) {
  const [state, setState] = useState<DailyState | null>(null)
  const [phase, setPhase] = useState<'loading' | 'running' | 'done'>('loading')

  useEffect(() => {
    setThemeExamCount(themeExamCount)
    const s = getOrCreateDailyState()
    setState(s)
    setPhase(s.completed ? 'done' : 'running')
    // 未完了の「今日の10問」を開いた＝開始。端末×日付で1回だけ計上する。
    if (!s.completed) {
      trackDailyOnce('daily_start', { resumed: s.currentIndex > 0 })
    }
  }, [themeExamCount])

  const questions = useMemo<QuizQuestion[]>(
    () => (state ? resolveDailyQuestions(state) : []),
    [state],
  )

  if (phase === 'loading' || !state) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-gray-400">今日の10問を準備中…</div>
  }

  if (phase === 'done') {
    return <DailyResult state={state} questions={questions} />
  }

  const priorResults = state.answers.slice(0, state.currentIndex).map((a) => a === true)

  return (
    <QuizRunner
      questions={questions}
      preserveOrder
      initialIndex={state.currentIndex}
      initialResults={priorResults}
      title="今日の10問"
      reviewHref="/quiz/weak"
      onAnswered={(_qid, correct, index) => {
        recordDailyAnswer(index, correct)
      }}
      onFinished={() => {
        const finalized = finalizeDailyIfComplete()
        setState(finalized)
        setPhase('done')
        // 10問すべて回答して完了した瞬間。端末×日付で1回だけ計上する。
        if (finalized.completed) {
          const correct = finalized.answers.filter((a) => a === true).length
          trackDailyOnce('daily_complete', {
            correct,
            total: finalized.answers.length,
            streak: displayStreak().current,
          })
        }
      }}
      finishSlot={() => null}
    />
  )
}

function DailyResult({ state, questions }: { state: DailyState; questions: QuizQuestion[] }) {
  const [open, setOpen] = useState(false)
  const streak = typeof window !== 'undefined' ? displayStreak() : { current: 0, longest: 0, completedToday: false }
  const correct = state.answers.filter((a) => a === true).length
  const total = state.answers.length || 10
  const pct = Math.round((correct / total) * 100)
  const wrongIdx = state.answers.map((a, i) => (a === false ? i : -1)).filter((i) => i >= 0)

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-6">
      <div className="rounded-2xl border border-green-100 bg-white p-6 text-center shadow-sm">
        <p className="text-2xl">🎉</p>
        <p className="mt-1 text-lg font-bold text-green-700">今日の学習 完了！</p>

        <p className="mt-4 text-4xl font-black text-gray-900">
          {correct}<span className="text-xl text-gray-400"> / {total}問</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">正答率 {pct}%</p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-700">
            🔥 連続学習 {streak.current}日
          </span>
          <span className="rounded-full bg-gray-50 px-3 py-1.5 text-sm font-bold text-gray-600">
            🏆 最長 {streak.longest}日
          </span>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-1.5">
          {state.answers.map((a, i) => (
            <span
              key={i}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                a === true ? 'bg-green-100 text-green-700' : a === false ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {a === true ? '○' : a === false ? '×' : '–'}
            </span>
          ))}
        </div>

        <div className="mt-6 space-y-2.5">
          {wrongIdx.length > 0 && (
            <Link href="/quiz/weak" className="block rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-700">
              間違えた{wrongIdx.length}問を復習する
            </Link>
          )}
          <Link href="/dashboard" className="block rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300">
            学習の記録を見る
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 hover:border-green-300"
          >
            {open ? '今日の結果を閉じる' : '今日の結果を確認する'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-2">
          {questions.map((q, i) => {
            const a = state.answers[i]
            return (
              <div key={q.id} className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      a === true ? 'bg-green-100 text-green-700' : a === false ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {a === true ? '○' : a === false ? '×' : '–'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400">{subjectLabel(q.subject)}・{q.theme}</p>
                    <p className="text-sm text-gray-800">{q.question}</p>
                    {a === false && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        正解：{q.choices[q.correctAnswer]}｜{q.memoryPoint}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">明日また新しい10問が出題されます。</p>
    </div>
  )
}
