'use client'

import Link from 'next/link'
import { useLearningStats } from '@/lib/useLearningStats'

export default function HomeProgressCard() {
  const { stats, ready } = useLearningStats()

  // まだ1問も解いていない人にはカードを出さない（TOPを軽くする）
  if (ready && stats.totalAnswered === 0) return null

  const cells = [
    { label: '今週', value: ready ? `${stats.weekCount}問` : '–' },
    { label: 'のべ', value: ready ? `${stats.totalAnswered}問` : '–' },
    { label: '正答率', value: ready && stats.totalAnswered ? `${stats.accuracy}%` : '–' },
  ]

  return (
    <Link
      href="/dashboard"
      className="flex items-center justify-between rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-sm hover:border-green-300"
    >
      <div className="flex gap-5">
        {cells.map((c) => (
          <div key={c.label}>
            <p className="text-[10px] leading-tight text-gray-400">{c.label}</p>
            <p className="mt-0.5 text-sm font-black leading-tight text-green-700">{c.value}</p>
          </div>
        ))}
      </div>
      <span className="text-xs font-semibold text-green-600">記録 ›</span>
    </Link>
  )
}
