'use client'

import Link from 'next/link'
import { useLearningStats } from '@/lib/useLearningStats'
import { subjectLabel } from '@/lib/quiz'

export default function DashboardClient() {
  const { stats, ready } = useLearningStats()

  if (!ready) {
    return <p className="mt-8 text-center text-sm text-gray-400">読み込み中…</p>
  }

  if (stats.totalAnswered === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 text-center">
        <p className="text-3xl">📘</p>
        <p className="mt-3 font-bold text-gray-800">まだ記録がありません</p>
        <p className="mt-1 text-sm text-gray-500">クイズを解くと、ここに学習の記録が貯まっていきます。</p>
        <Link
          href="/quiz/daily"
          className="mt-5 inline-block rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700"
        >
          今日の10問をはじめる
        </Link>
      </div>
    )
  }

  const cards = [
    { label: 'のべ解答', value: `${stats.totalAnswered}問` },
    { label: '累計正答率', value: stats.totalAnswered ? `${stats.accuracy}%` : '–' },
    { label: '復習待ち', value: `${stats.reviewCount + stats.weakCount}問` },
    { label: '学習日数', value: `${stats.streakDays}日連続` },
  ]

  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className="mt-1 text-2xl font-black text-green-700">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 text-sm">
        <p className="text-gray-500">
          累計 <strong className="text-gray-800">{stats.totalAnswered}問</strong> 解答／正解{' '}
          <strong className="text-gray-800">{stats.totalCorrect}問</strong>
        </p>
      </div>

      {stats.bySubject.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-gray-700">科目別の正答率</h2>
          <ul className="space-y-2">
            {stats.bySubject.map((s) => (
              <li key={s.subject} className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-800">{subjectLabel(s.subject)}</span>
                  <span className="text-xs text-gray-500">{s.correct}/{s.answered}問・{s.accuracy}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-1.5 rounded-full ${s.accuracy >= 70 ? 'bg-green-500' : s.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${s.accuracy}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 space-y-2.5">
        <Link href="/quiz/weak" className="block rounded-xl bg-green-600 px-5 py-3.5 text-center text-sm font-bold text-white hover:bg-green-700">
          苦手を復習する（{stats.reviewCount + stats.weakCount}問）
        </Link>
        <Link href="/quiz/daily" className="block rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-center text-sm font-bold text-gray-700 hover:border-green-300">
          今日の10問を解く
        </Link>
      </div>
    </div>
  )
}
