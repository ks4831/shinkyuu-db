'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Theme } from '@/lib/types'
import { getDailyThemes } from '@/lib/utils'
import ImportanceBadge from './ImportanceBadge'
import { subjects } from '@/lib/data'

export default function DailyThemes({ themes }: { themes: Theme[] }) {
  const [daily, setDaily] = useState<Theme[]>([])

  useEffect(() => {
    setDaily(getDailyThemes(themes))
  }, [themes])

  if (daily.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {daily.map((theme, i) => {
        const subjectLabel = subjects.find(s => s.id === theme.subject)?.shortName ?? ''
        return (
          <Link
            key={theme.id}
            href={`/themes/${theme.id}`}
            className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800 text-sm">{theme.name}</span>
                <ImportanceBadge importance={theme.importance} showLabel={false} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{subjectLabel}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
