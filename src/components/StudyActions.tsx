'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Props = {
  themeId: string
}

export const CHECKED_KEY = 'shinkyuu_checked'
export const FAVORITES_KEY = 'shinkyuu_favorites'
export const WEAKNESS_KEY = 'shinkyuu_weakness'

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

export default function StudyActions({ themeId }: Props) {
  const [isFav, setIsFav] = useState(false)
  const [isWeak, setIsWeak] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    setIsFav(getSet(FAVORITES_KEY).has(themeId))
    setIsWeak(getSet(WEAKNESS_KEY).has(themeId))
    setIsChecked(getSet(CHECKED_KEY).has(themeId))
  }, [themeId])

  function toggle(key: string, current: boolean, setter: (v: boolean) => void) {
    const s = getSet(key)
    if (current) s.delete(themeId)
    else s.add(themeId)
    saveSet(key, s)
    setter(!current)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
      <h2 className="font-bold text-gray-800 mb-3">学習管理</h2>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => toggle(CHECKED_KEY, isChecked, setIsChecked)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border ${
            isChecked
              ? 'bg-green-600 text-white border-green-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
          }`}
        >
          {isChecked ? '✓ 覚えた！' : '覚えた'}
        </button>
        <button
          onClick={() => toggle(FAVORITES_KEY, isFav, setIsFav)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border ${
            isFav
              ? 'bg-orange-100 text-orange-700 border-orange-300'
              : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
          }`}
        >
          {isFav ? '★ 復習リスト済' : '☆ あとで復習'}
        </button>
        <button
          onClick={() => toggle(WEAKNESS_KEY, isWeak, setIsWeak)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border ${
            isWeak
              ? 'bg-red-100 text-red-700 border-red-300'
              : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
          }`}
        >
          {isWeak ? '✗ 苦手登録済' : '苦手に追加'}
        </button>
      </div>
      <div className="mt-3 flex gap-3 text-xs text-gray-400">
        <Link href="/study/checklist" className="hover:text-green-600 transition-colors">チェックリスト</Link>
        <Link href="/study/favorites" className="hover:text-green-600 transition-colors">復習リスト</Link>
        <Link href="/study/weakness" className="hover:text-green-600 transition-colors">苦手テーマ</Link>
        <Link href="/study/dashboard" className="hover:text-green-600 transition-colors">ダッシュボード</Link>
      </div>
    </div>
  )
}
