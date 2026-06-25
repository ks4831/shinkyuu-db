'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { themes, subjects } from '@/lib/data'
import ImportanceBadge from '@/components/ImportanceBadge'
import { kanaIncludes, expandSearchQuery } from '@/lib/kana'
import type { Importance } from '@/lib/types'

const importanceOrder: Record<Importance, number> = { S: 0, A: 1, B: 2, C: 3 }
const allRounds = [29, 30, 31, 32, 33, 34]

function themeMatches(t: (typeof themes)[0], q: string): boolean {
  if (!q) return true
  const expanded = expandSearchQuery(q)
  return expanded.some(term =>
    kanaIncludes(t.name, term) ||
    kanaIncludes(t.studyPoint, term) ||
    (t.aliases ?? []).some(a => kanaIncludes(a, term)) ||
    kanaIncludes(t.officialLarge ?? '', term) ||
    kanaIncludes(t.officialMedium ?? '', term)
  )
}

export default function ThemesPage() {
  const [inputValue, setInputValue] = useState('')
  const [query, setQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedImportance, setSelectedImportance] = useState<Importance | ''>('')
  const [sortBy, setSortBy] = useState<'count' | 'importance' | 'round'>('count')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const suggestions = useMemo(() => {
    const v = inputValue.trim()
    if (!v) return []
    return themes
      .filter(t => themeMatches(t, v))
      .slice(0, 8)
      .map(t => t.name)
  }, [inputValue])

  const filtered = useMemo(() => {
    return themes
      .filter(t => {
        if (selectedSubject && t.subject !== selectedSubject) return false
        if (selectedImportance && t.importance !== selectedImportance) return false
        return themeMatches(t, query)
      })
      .sort((a, b) => {
        if (sortBy === 'count') return b.count - a.count || importanceOrder[a.importance] - importanceOrder[b.importance]
        if (sortBy === 'importance') return importanceOrder[a.importance] - importanceOrder[b.importance] || b.count - a.count
        return b.latestRound - a.latestRound || b.count - a.count
      })
  }, [query, selectedSubject, selectedImportance, sortBy])

  const commitSearch = useCallback((val: string) => {
    setQuery(val)
    setInputValue(val)
    setShowSuggestions(false)
    setHighlightIdx(-1)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') commitSearch(inputValue)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIdx >= 0 && suggestions[highlightIdx]) {
        commitSearch(suggestions[highlightIdx])
      } else {
        commitSearch(inputValue)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightIdx(-1)
    }
  }, [showSuggestions, suggestions, highlightIdx, inputValue, commitSearch])

  useEffect(() => {
    const el = listRef.current?.children[highlightIdx] as HTMLLIElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlightIdx])

  const handleReset = useCallback(() => {
    setQuery('')
    setInputValue('')
    setSelectedSubject('')
    setSelectedImportance('')
    setShowSuggestions(false)
    setHighlightIdx(-1)
  }, [])

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          ← トップに戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">テーマ検索</h1>
        <p className="text-sm text-gray-500 mt-1">
          キーワード・科目・重要度で絞り込みできます。全{themes.length}件収録。
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 space-y-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value)
              setShowSuggestions(true)
              setHighlightIdx(-1)
            }}
            onFocus={() => { if (inputValue.trim()) setShowSuggestions(true) }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="テーマ名・キーワードで検索（げんけつ・原穴・経絡…）"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleReset}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="検索をクリア"
            >
              ×
            </button>
          )}
          <button
            type="button"
            onClick={() => commitSearch(inputValue)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800"
            aria-label="検索"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <ul
              ref={listRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden max-h-56 overflow-y-auto"
            >
              {suggestions.map((name, i) => (
                <li key={name}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      i === highlightIdx ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onMouseDown={() => commitSearch(name)}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

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
            <button onClick={handleReset} className="text-xs text-red-500 hover:underline">
              絞り込みをリセット
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>該当するテーマが見つかりませんでした</p>
          <p className="text-sm mt-1">ひらがな・カタカナでも検索できます</p>
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
