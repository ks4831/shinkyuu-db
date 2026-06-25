'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { themes, subjects } from '@/lib/data'
import ImportanceBadge from '@/components/ImportanceBadge'
import type { Importance } from '@/lib/types'

type StudyTheme = (typeof themes)[0]

const IMP_WEIGHT: Record<Importance, number> = { S: 4, A: 3, B: 2, C: 1 }

const IMP_COLORS: Record<Importance, { bg: string; border: string; num: string }> = {
  S: { bg: 'bg-red-50',    border: 'border-red-200',    num: 'text-red-700' },
  A: { bg: 'bg-orange-50', border: 'border-orange-200', num: 'text-orange-700' },
  B: { bg: 'bg-blue-50',   border: 'border-blue-200',   num: 'text-blue-700' },
  C: { bg: 'bg-gray-50',   border: 'border-gray-200',   num: 'text-gray-500' },
}

const CHECKED_KEY = 'shinkyuu_checked'
const FAVORITES_KEY = 'shinkyuu_favorites'
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

function getWeightedRandom(seed: number): StudyTheme[] {
  const pool: StudyTheme[] = []
  for (const t of themes) {
    const w = IMP_WEIGHT[t.importance]
    for (let i = 0; i < w; i++) pool.push(t)
  }
  const shuffled = [...pool]
  let s = seed >>> 0
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223
    const j = (s >>> 0) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const seen = new Set<string>()
  const result: StudyTheme[] = []
  for (const t of shuffled) {
    if (!seen.has(t.id)) {
      seen.add(t.id)
      result.push(t)
      if (result.length === 10) break
    }
  }
  return result
}

export default function StudyPage() {
  const [seed, setSeed] = useState(() => Date.now())
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [filterImp, setFilterImp] = useState<Importance | ''>('')
  const [checked, setChecked] = useState(new Set<string>())
  const [favorites, setFavorites] = useState(new Set<string>())
  const [weakness, setWeakness] = useState(new Set<string>())

  useEffect(() => {
    setChecked(getSet(CHECKED_KEY))
    setFavorites(getSet(FAVORITES_KEY))
    setWeakness(getSet(WEAKNESS_KEY))
  }, [])

  const daily = useMemo(() => getWeightedRandom(seed), [seed])
  const displayed = filterImp ? daily.filter(t => t.importance === filterImp) : daily

  const shuffle = useCallback(() => {
    setSeed(Date.now())
    setFlipped(new Set())
  }, [])

  const toggleFlip = useCallback((id: string) => {
    setFlipped(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  function toggleAction(key: string, id: string, current: Set<string>, setter: (s: Set<string>) => void) {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    saveSet(key, next)
    setter(next)
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <span className="text-gray-700">学習モード</span>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-1">
            STUDY MODE
          </p>
          <h1 className="text-2xl font-bold text-gray-900">今日の10テーマ</h1>
          <p className="text-sm text-gray-500 mt-1">
            重要度S優先のランダム10テーマ。カードをタップして学習ポイントを確認。
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/study/dashboard"
            className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-full hover:bg-green-50 hover:text-green-700 transition-colors font-semibold"
          >
            ダッシュボード
          </Link>
          <button
            onClick={shuffle}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-green-700 active:scale-95 transition-all shadow-sm"
          >
            <span>🔀</span> シャッフル
          </button>
        </div>
      </div>

      {/* 重要度フィルター */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['', 'S', 'A', 'B', 'C'] as const).map(imp => (
          <button
            key={imp || 'all'}
            onClick={() => setFilterImp(imp as Importance | '')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterImp === imp
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {imp === '' ? 'すべて' : imp === 'S' ? 'S 最重要' : imp === 'A' ? 'A 重要' : imp === 'B' ? 'B 標準' : 'C 参考'}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">📭</p>
          <p>この重要度のテーマが今回の抽選に含まれていません</p>
          <button onClick={shuffle} className="mt-4 text-green-600 text-sm hover:underline">
            シャッフルして再抽選
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((theme, i) => {
            const isFlipped = flipped.has(theme.id)
            const colors = IMP_COLORS[theme.importance]
            const subjectLabel = subjects.find(s => s.id === theme.subject)?.shortName ?? ''
            const isChecked = checked.has(theme.id)
            const isFav = favorites.has(theme.id)
            const isWeak = weakness.has(theme.id)
            return (
              <div
                key={theme.id}
                className={`rounded-2xl border cursor-pointer transition-all select-none ${colors.bg} ${colors.border} ${
                  isFlipped ? 'shadow-md' : 'hover:shadow-sm hover:-translate-y-0.5'
                }`}
                onClick={() => toggleFlip(theme.id)}
              >
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full bg-white border ${colors.border} flex items-center justify-center text-xs font-black ${colors.num} flex-shrink-0`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-gray-900 text-base">{theme.name}</h2>
                        <ImportanceBadge importance={theme.importance} showLabel={false} />
                        {subjectLabel && (
                          <span className="text-xs text-gray-400 bg-white/70 px-2 py-0.5 rounded-full border border-gray-100">
                            {subjectLabel}
                          </span>
                        )}
                        {isChecked && (
                          <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-semibold">覚えた</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>出題{theme.count}回</span>
                        <span>直近第{theme.latestRound}回</span>
                        <span className={`font-semibold ${isFlipped ? colors.num : 'text-gray-400'}`}>
                          {isFlipped ? '▲ 閉じる' : '▼ 学習ポイント'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-xl text-green-700">{theme.count}</p>
                      <p className="text-xs text-gray-400">回出題</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-1 flex-wrap">
                    {[29, 30, 31, 32, 33, 34].map(r => (
                      <span
                        key={r}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          theme.examRounds.includes(r)
                            ? 'bg-green-100 text-green-700 font-semibold'
                            : 'bg-white/70 text-gray-300 border border-gray-100'
                        }`}
                      >
                        第{r}回
                      </span>
                    ))}
                  </div>
                </div>

                {isFlipped && (
                  <div className="px-5 pb-5 pt-0 border-t border-white/50">
                    <p className="text-xs font-semibold text-green-700 mb-2 mt-3">💡 学習ポイント</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{theme.studyPoint}</p>

                    {/* アクションボタン */}
                    <div
                      className="mt-4 flex gap-2 flex-wrap"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleAction(CHECKED_KEY, theme.id, checked, setChecked)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${
                          isChecked
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
                        }`}
                      >
                        {isChecked ? '✓ 覚えた！' : '覚えた'}
                      </button>
                      <button
                        onClick={() => toggleAction(FAVORITES_KEY, theme.id, favorites, setFavorites)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${
                          isFav
                            ? 'bg-orange-100 text-orange-700 border-orange-300'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                        }`}
                      >
                        {isFav ? '★ 復習リスト済' : '☆ あとで復習'}
                      </button>
                      <button
                        onClick={() => toggleAction(WEAKNESS_KEY, theme.id, weakness, setWeakness)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${
                          isWeak
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
                        }`}
                      >
                        {isWeak ? '✗ 苦手登録済' : '苦手に追加'}
                      </button>
                      <Link
                        href={`/themes/${theme.id}`}
                        className="text-xs text-green-600 hover:underline font-semibold px-2 py-1.5"
                      >
                        詳細ページ →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-4 flex-wrap">
        <button
          onClick={shuffle}
          className="bg-green-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-green-700 transition-colors"
        >
          🔀 もう一度シャッフル
        </button>
        <Link href="/study/dashboard" className="text-sm text-green-600 hover:underline font-semibold">
          ダッシュボードへ →
        </Link>
        <Link href="/themes" className="text-sm text-green-600 hover:underline">
          テーマ一覧で全て見る →
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          ← トップに戻る
        </Link>
      </div>
    </main>
  )
}
