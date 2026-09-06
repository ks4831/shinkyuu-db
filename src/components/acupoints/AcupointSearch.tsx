'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type Row = {
  slug: string
  code: string
  name: string
  reading: string
  meridianName: string
}

export default function AcupointSearch({ points }: { points: Row[] }) {
  const [q, setQ] = useState('')
  const query = q.trim()

  const results = useMemo(() => {
    if (!query) return []
    return points
      .filter(
        (p) =>
          p.name.includes(query) ||
          p.reading.includes(query) ||
          p.code.toLowerCase().includes(query.toLowerCase()) ||
          p.meridianName.includes(query),
      )
      .slice(0, 20)
  }, [query, points])

  return (
    <div>
      <input
        type="search"
        inputMode="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="経穴名・よみ・記号（例：足三里 / ごうこく / ST36）"
        aria-label="経穴を検索"
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-[15px] outline-none focus:border-green-400"
      />
      {query && (
        <ul className="mt-2 divide-y divide-gray-50 overflow-hidden rounded-xl border border-gray-100 bg-white">
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-400">該当する経穴が見つかりませんでした</li>
          )}
          {results.map((p) => (
            <li key={p.slug}>
              <Link href={`/acupoints/${p.slug}`} className="flex items-center justify-between px-4 py-3">
                <span>
                  <span className="text-sm font-bold text-gray-900">{p.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{p.reading}・{p.code}</span>
                </span>
                <span className="text-xs text-gray-400">{p.meridianName}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
