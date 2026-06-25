'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getTheme } from '@/lib/data'
import { getLearningGuide } from '@/lib/learning'
import ImportanceBadge from '@/components/ImportanceBadge'

const WEAKNESS_KEY = 'shinkyuu_weakness'

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

export default function Weakness() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds([...getSet(WEAKNESS_KEY)])
  }, [])

  const remove = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.filter(x => x !== id)
      saveSet(WEAKNESS_KEY, new Set(next))
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
        <span className="text-gray-700">苦手テーマ</span>
      </nav>

      <div className="mb-6">
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-1">WEAK POINTS</p>
        <h1 className="text-2xl font-bold text-gray-900">苦手テーマ</h1>
        <p className="text-sm text-gray-500 mt-1">重点的に復習が必要なテーマをまとめました</p>
      </div>

      {themes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">📌</p>
          <p className="font-semibold text-gray-500 mb-2">苦手テーマは登録されていません</p>
          <p className="text-sm">テーマ詳細ページで「苦手に追加」ボタンを押すと登録されます</p>
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
          <div className="space-y-4">
            {themes.map(t => {
              if (!t) return null
              const guide = getLearningGuide(t.id)
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-red-100 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          href={`/themes/${t.id}`}
                          className="font-bold text-gray-900 hover:text-green-600 transition-colors"
                        >
                          {t.name}
                        </Link>
                        <ImportanceBadge importance={t.importance} showLabel={false} />
                      </div>
                      <p className="text-xs text-gray-400">出題{t.count}回 / 直近第{t.latestRound}回</p>
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

                  {guide && (
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-700 mb-2">間違えやすいポイント</p>
                      <ul className="space-y-1">
                        {guide.commonMistakes.map((m, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {guide && (
                    <div className="mt-3 bg-green-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-green-700 mb-2">暗記のコツ</p>
                      <ul className="space-y-1">
                        {guide.memoryTips.slice(0, 2).map((tip, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
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
