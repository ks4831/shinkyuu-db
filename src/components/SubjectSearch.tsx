'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ImportanceBadge from '@/components/ImportanceBadge'
import type { Theme } from '@/lib/types'
import type { Importance } from '@/lib/types'

const allRounds = [29, 30, 31, 32, 33, 34]

const IMP_FILTER_LABELS: { value: Importance | ''; label: string }[] = [
  { value: '', label: 'すべて' },
  { value: 'S', label: 'S 最重要' },
  { value: 'A', label: 'A 重要' },
  { value: 'B', label: 'B 標準' },
  { value: 'C', label: 'C 参考' },
]

type Props = {
  themes: Theme[]
  subjectName: string
}

export default function SubjectSearch({ themes, subjectName }: Props) {
  const [query, setQuery] = useState('')
  const [filterImp, setFilterImp] = useState<Importance | ''>('')

  const filtered = useMemo(() => {
    return themes.filter(t => {
      const matchImp = filterImp === '' || t.importance === filterImp
      const matchQuery =
        query === '' ||
        t.name.includes(query) ||
        (t.aliases ?? []).some(a => a.includes(query)) ||
        t.studyPoint.includes(query)
      return matchImp && matchQuery
    })
  }, [themes, query, filterImp])

  return (
    <section id="all-themes">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-bold text-gray-800">
          テーマ一覧（全{themes.length}件）
        </h2>
        {filtered.length !== themes.length && (
          <span className="text-xs text-green-600 font-semibold">
            {filtered.length}件表示中
          </span>
        )}
      </div>

      {/* 科目内検索 */}
      <div className="mb-3">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`${subjectName}内を検索…`}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
        />
      </div>

      {/* 重要度フィルター */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {IMP_FILTER_LABELS.map(({ value, label }) => (
          <button
            key={value || 'all'}
            onClick={() => setFilterImp(value as Importance | '')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterImp === value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm">「{query}」に一致するテーマが見つかりません</p>
          <button onClick={() => { setQuery(''); setFilterImp('') }} className="mt-3 text-green-600 text-sm hover:underline">
            絞り込みをリセット
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(theme => (
            <Link
              key={theme.id}
              href={`/themes/${theme.id}`}
              className="block bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-800">{theme.name}</h3>
                    <ImportanceBadge importance={theme.importance} />
                  </div>
                  {theme.officialLarge && (
                    <p className="text-xs text-gray-400 mt-1">
                      {theme.officialLarge}
                      {theme.officialMedium && ` › ${theme.officialMedium}`}
                      {theme.officialSmall && ` › ${theme.officialSmall}`}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">
                    {theme.studyPoint}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-green-700">{theme.count}回</p>
                  <p className="text-xs text-gray-400">出題</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {allRounds.map(round => {
                  const hit = theme.examRounds.includes(round)
                  return (
                    <span
                      key={round}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        hit ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      第{round}回
                    </span>
                  )
                })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
