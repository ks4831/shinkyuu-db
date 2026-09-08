'use client'

import { useLearningStats } from '@/lib/useLearningStats'

export default function ProgressStrip({ className = '' }: { className?: string }) {
  const { stats, ready } = useLearningStats()

  const items = [
    { label: '今日', value: ready ? `${stats.todayCount} / ${stats.todayGoal}` : '– / 10' },
    { label: 'のべ', value: ready ? `${stats.totalAnswered}問` : '–' },
    { label: '正答率', value: ready && stats.totalAnswered ? `${stats.accuracy}%` : '–' },
    { label: '復習', value: ready ? `${stats.reviewCount + stats.weakCount}問` : '–' },
  ]

  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-gray-100 bg-white px-2 py-2.5 text-center">
          <p className="text-[10px] text-gray-400">{it.label}</p>
          <p className="mt-0.5 text-sm font-bold text-green-700">{it.value}</p>
        </div>
      ))}
    </div>
  )
}
