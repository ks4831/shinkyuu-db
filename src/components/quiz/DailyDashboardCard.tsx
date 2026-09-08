'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { displayStreak, recentDays, peekDailyState, DAILY_COUNT } from '@/lib/dailyQuiz'

const WD = ['日', '月', '火', '水', '木', '金', '土']

type V = {
  current: number
  longest: number
  completedToday: boolean
  todayAnswered: number
  days: { date: string; completed: boolean; answered: boolean }[]
}

export default function DailyDashboardCard() {
  const [v, setV] = useState<V | null>(null)

  useEffect(() => {
    const sync = () => {
      const ds = displayStreak()
      const peek = peekDailyState()
      setV({
        current: ds.current,
        longest: ds.longest,
        completedToday: ds.completedToday,
        todayAnswered: peek ? peek.answers.filter((a) => a === true || a === false).length : 0,
        days: recentDays(7),
      })
    }
    sync()
    window.addEventListener('shinkyuu-quiz-change', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('shinkyuu-quiz-change', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  if (!v) return null

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold text-gray-700">今日の10問</h2>
      <div className="rounded-2xl border border-green-100 bg-white p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-400">今日</p>
            <p className="mt-0.5 text-xl font-black text-green-700">
              {v.completedToday ? DAILY_COUNT : v.todayAnswered} <span className="text-sm text-gray-400">/ {DAILY_COUNT}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">🔥 連続</p>
            <p className="mt-0.5 text-xl font-black text-orange-600">{v.current}日</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">🏆 最長</p>
            <p className="mt-0.5 text-xl font-black text-gray-700">{v.longest}日</p>
          </div>
        </div>

        {/* 直近7日 */}
        <div className="mt-4 flex justify-between">
          {v.days.map((d) => {
            const wd = WD[new Date(`${d.date}T12:00:00+09:00`).getDay()]
            return (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{wd}</span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                    d.completed
                      ? 'bg-orange-100 text-orange-600'
                      : d.answered
                        ? 'bg-green-50 text-green-500'
                        : 'bg-gray-50 text-gray-300'
                  }`}
                >
                  {d.completed ? '🔥' : d.answered ? '・' : '○'}
                </span>
              </div>
            )
          })}
        </div>

        {!v.completedToday && (
          <Link
            href="/quiz/daily"
            className="mt-4 block rounded-xl bg-green-600 px-5 py-3 text-center text-sm font-bold text-white hover:bg-green-700"
          >
            {v.todayAnswered > 0 ? '今日の10問の続きを解く' : '今日の10問を始める'}
          </Link>
        )}
      </div>
    </section>
  )
}
