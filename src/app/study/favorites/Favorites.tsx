'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getTheme } from '@/lib/data'
import ImportanceBadge from '@/components/ImportanceBadge'
import { importanceLabel } from '@/lib/utils'

const FAVORITES_KEY = 'shinkyuu_favorites'

function getSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]))
}

export default function Favorites() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds([...getSet(FAVORITES_KEY)])
  }, [])

  const remove = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.filter(x => x !== id)
      saveSet(FAVORITES_KEY, new Set(next))
      return next
    })
  }, [])

  const themes = ids.map(id => getTheme(id)).filter(Boolean)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <Link href="/study/dashboard" className="hover:text-green-600 transition-colors">ダッシュボード</Link>
        <span>›</span>
        <span className="text-gray-700">復習リスト</span>
      </nav>

      <div className="mb-6">
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-1">REVIEW LIST</p>
        <h1 className="text-2xl font-bold text-gray-900">復習リスト</h1>
        <p className="text-sm text-gray-500 mt-1">「あとで復習」したテーマをまとめて確認できます</p>
      </div>

      {themes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">☆</p>
          <p className="font-semibold text-gray-500 mb-2">復習リストは空です</p>
          <p className="text-sm">テーマ詳細ページで「あとで復習」ボタンを押すと追加されます</p>
          <Link
            href="/themes"
            className="mt-4 inline-block bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            テーマ一覧を見る
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{themes.length} テーマ登録中</p>
          <div className="space-y-3">
            {themes.map(t => t && (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link
                      href={`/themes/${t.id}`}
                      className="font-bold text-gray-900 hover:text-green-600 transition-colors"
                    >
                      {t.name}
                    </Link>
                    <ImportanceBadge importance={t.importance} showLabel={false} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {importanceLabel(t.importance)} / 出題{t.count}回 / 直近第{t.latestRound}回
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/themes/${t.id}`}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors font-semibold"
                  >
                    詳細
                  </Link>
                  <button
                    onClick={() => remove(t.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors border border-gray-100 hover:border-red-200 px-3 py-1.5 rounded-full"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex gap-4 flex-wrap">
        <Link href="/study/dashboard" className="text-sm text-green-600 hover:underline">← ダッシュボードへ</Link>
        <Link href="/themes" className="text-sm text-gray-400 hover:text-green-600 transition-colors">テーマ一覧</Link>
      </div>
    </main>
  )
}
