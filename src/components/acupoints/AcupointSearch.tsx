'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { searchAcupoints, type AcupointSearchRow } from '@/lib/acupointSearch'

export default function AcupointSearch({ points }: { points: AcupointSearchRow[] }) {
  const [q, setQ] = useState('')
  const query = q.trim()

  const results = useMemo(() => searchAcupoints(points, query), [query, points])

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
                  <span className="text-sm font-bold text-gray-900">{p.name ?? p.code}</span>
                  {p.name && <span className="ml-2 text-xs text-gray-400">{p.reading ? `${p.reading}・${p.code}` : p.code}</span>}
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
