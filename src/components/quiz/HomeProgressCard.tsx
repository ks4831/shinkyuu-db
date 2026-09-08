'use client'

import Link from 'next/link'
import { useLearningStats } from '@/lib/useLearningStats'

export default function HomeProgressCard() {
  const { stats, ready } = useLearningStats()

  const cells = [
    { label: 'のべ解答', value: ready ? `${stats.totalAnswered}問` : '–' },
    { label: '正答率', value: ready && stats.totalAnswered ? `${stats.accuracy}%` : '–' },
    { label: '復習待ち', value: ready ? `${stats.reviewCount + stats.weakCount}問` : '–' },
    { label: '学習日数', value: ready ? `${stats.streakDays}日連続` : '–' },
  ]

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-gray-800">これまでの学習</p>
        <Link href="/dashboard" className="text-xs font-semibold text-green-600 hover:underline">
          記録を見る →
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="text-center">
            <p className="text-[10px] leading-tight text-gray-400">{c.label}</p>
            <p className="mt-0.5 text-sm font-black leading-tight text-green-700">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
