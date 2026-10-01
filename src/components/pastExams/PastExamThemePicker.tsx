'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { kanaIncludes, expandSearchQuery } from '@/lib/kana'

/** テーマ別タブ用の軽量テーマ情報（問題本文は含めない）。count は実過去問データからの集計値 */
export type PastExamThemeItem = {
  id: string
  name: string
  subjectId: string
  /** 検索用の別名・出題基準上の分類名 */
  keywords: string[]
  count: number
}

export type PastExamThemeGroup = {
  subjectId: string
  subjectName: string
  subjectShortName: string
  themes: PastExamThemeItem[]
}

function matches(t: PastExamThemeItem, terms: string[]): boolean {
  return terms.some((term) => kanaIncludes(t.name, term) || t.keywords.some((k) => kanaIncludes(k, term)))
}

function ThemeRow({ theme, subjectShortName }: { theme: PastExamThemeItem; subjectShortName?: string }) {
  const label = (
    <span className="min-w-0">
      <span className={`block text-sm font-bold ${theme.count > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
        {theme.name}
      </span>
      {subjectShortName && <span className="mt-0.5 block text-[11px] text-gray-400">{subjectShortName}</span>}
    </span>
  )
  if (theme.count === 0) {
    // 演習できる過去問が無いテーマは「解ける」ように見せない（リンク・CTAなし）
    return (
      <li className="flex items-center justify-between gap-3 px-4 py-3">
        {label}
        <span className="flex-shrink-0 text-[11px] text-gray-400">収録問題なし</span>
      </li>
    )
  }
  return (
    <li>
      <Link
        href={`/past-exams/theme/${theme.id}`}
        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-green-50"
      >
        {label}
        <span className="flex flex-shrink-0 items-center gap-2 text-xs text-gray-500">
          過去問 {theme.count}問
          <span className="text-gray-300" aria-hidden="true">›</span>
        </span>
      </Link>
    </li>
  )
}

/**
 * /past-exams「テーマ別」タブ：テーマ検索 ＋ 科目ごとの折りたたみ一覧。
 * 142テーマを1列に並べず、未検索時は科目単位（<details>）にまとめる。
 * 検索ロジックは /themes と同じ kana ヘルパー（ひらがな・カタカナ・読み対応）を使う。
 */
export default function PastExamThemePicker({ groups }: { groups: PastExamThemeGroup[] }) {
  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  const results = useMemo(() => {
    if (!trimmed) return null
    const terms = expandSearchQuery(trimmed)
    return groups.flatMap((g) =>
      g.themes.filter((t) => matches(t, terms)).map((t) => ({ theme: t, subjectShortName: g.subjectShortName })),
    )
  }, [groups, trimmed])

  return (
    <div>
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="テーマを検索（原穴・自律神経…）"
          aria-label="テーマを検索"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-base focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-300 sm:text-sm"
        />
      </div>

      {results ? (
        results.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-400">該当するテーマが見つかりませんでした</p>
        ) : (
          <>
            <p className="mt-3 text-xs text-gray-500">{results.length}件</p>
            <ul className="mt-1.5 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {results.map(({ theme, subjectShortName }) => (
                <ThemeRow key={theme.id} theme={theme} subjectShortName={subjectShortName} />
              ))}
            </ul>
          </>
        )
      ) : (
        <div className="mt-3 space-y-2">
          {groups.map((g) => {
            const playable = g.themes.filter((t) => t.count > 0).length
            return (
              <details key={g.subjectId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {/* 開閉マーカー（＋/−）は globals.css の details > summary::after を使う */}
                <summary className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                  <span className="text-sm font-bold text-gray-900">{g.subjectName}</span>
                  <span className="ml-auto flex-shrink-0 text-xs text-gray-500">{playable}テーマ</span>
                </summary>
                <ul className="divide-y divide-gray-100 border-t border-gray-100">
                  {g.themes.map((t) => (
                    <ThemeRow key={t.id} theme={t} />
                  ))}
                </ul>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
