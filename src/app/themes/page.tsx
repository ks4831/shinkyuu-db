'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { themes, subjects } from '@/lib/data'
import ImportanceBadge from '@/components/ImportanceBadge'
import type { Importance } from '@/lib/types'

const importanceOrder: Record<Importance, number> = { S: 0, A: 1, B: 2, C: 3 }
const allRounds = [29, 30, 31, 32, 33, 34]

export default function ThemesPage() {
  const [query, setQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedImportance, setSelectedImportance] = useState<Importance | ''>('')
  const [sortBy, setSortBy] = useState<'count' | 'importance' | 'round'>('count')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return themes
      .filter(t => {
        if (selectedSubject && t.subject !== selectedSubject) return false
        if (selectedImportance && t.importance !== selectedImportance) return false
        if (q) {
          return (
            t.name.toLowerCase().includes(q) ||
            t.studyPoint.toLowerCase().includes(q) ||
            (t.aliases ?? []).some(a => a.toLowerCase().includes(q)) ||
            (t.officialLarge ?? '').includes(q) ||
            (t.officialMedium ?? '').includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'count') return b.count - a.count || importanceOrder[a.importance] - importanceOrder[b.importance]
        if (sortBy === 'importance') return importanceOrder[a.importance] - importanceOrder[b.importance] || b.count - a.count
        return b.latestRound - a.latestRound || b.count - a.count
      })
  }, [query, selectedSubject, selectedImportance, sortBy])

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          ← トップに戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">テーマ検索</h1>
        <p className="text-sm text-gray-500 mt-1">
          キーワード・科目・重要度で絞り込みできます。全{themes.length}件収録。
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 space-y-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="テーマ名・キーワードで検索（例：原穴、健康日本、気血…）"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
        />
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <option value="">全科目</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={selectedImportance}
            onChange={e => setSelectedImportance(e.target.value as Importance | '')}
            className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <option value="">全重要度</option>
            <option value="S">S — 最重要</option>
            <option value="A">A — 重要</option>
            <option value="B">B — 標準</option>
            <option value="C">C — 参考</option>
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <option value="count">出題回数順</option>
            <option value="importance">重要度順</option>
            <option value="round">直近出題順</option>
          </select>
        </div>
        {(query || selectedSubject || selectedImportance) && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{filtered.length}件ヒット</span>
            <button
              onClick={() => { setQuery(''); setSelectedSubject(''); setSelectedImportance('') }}
              className="text-xs text-red-500 hover:underline"
            >
              絞り込みをリセット
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>該当するテーマが見つかりませんでした</p>
          <p className="text-sm mt-1">別のキーワードや条件で検索してみてください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(theme => {
            const subjectLabel = subjects.find(s => s.id === theme.subject)?.shortName ?? ''
            return (
              <Link
                key={theme.id}
                href={`/themes/${theme.id}`}
                className="block bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-gray-800">{theme.name}</h2>
                      <ImportanceBadge importance={theme.importance} />
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        {subjectLabel}
                      </span>
                    </div>
                    {theme.officialLarge && (
                      <p className="text-xs text-gray-400 mt-1">
                        {theme.officialLarge}
                        {theme.officialMedium && ` › ${theme.officialMedium}`}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                      {theme.studyPoint}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-green-700">{theme.count}回</p>
                    <p className="text-xs text-gray-400">第{theme.latestRound}回</p>
                  </div>
                </div>

                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {allRounds.map(round => {
                    const hit = theme.examRounds.includes(round)
                    return (
                      <span
                        key={round}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          hit
                            ? 'bg-green-100 text-green-700 font-semibold'
                            : 'bg-gray-50 text-gray-300'
                        }`}
                      >
                        第{round}回
                      </span>
                    )
                  })}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
