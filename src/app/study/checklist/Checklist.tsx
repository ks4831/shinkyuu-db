'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { themes } from '@/lib/data'
import ImportanceBadge from '@/components/ImportanceBadge'

const CHECKED_KEY = 'shinkyuu_checked'

function getChecked(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(CHECKED_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveChecked(set: Set<string>) {
  localStorage.setItem(CHECKED_KEY, JSON.stringify([...set]))
}

const sThemes = themes.filter(t => t.importance === 'S')
const aThemes = themes.filter(t => t.importance === 'A')
const saThemes = [...sThemes, ...aThemes]

export default function Checklist() {
  const [checked, setChecked] = useState(new Set<string>())

  useEffect(() => {
    setChecked(getChecked())
  }, [])

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveChecked(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    if (!window.confirm('チェックをすべてリセットしますか？')) return
    saveChecked(new Set())
    setChecked(new Set())
  }, [])

  const checkedCount = saThemes.filter(t => checked.has(t.id)).length
  const total = saThemes.length
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <Link href="/study/dashboard" className="hover:text-green-600 transition-colors">ダッシュボード</Link>
        <span>›</span>
        <span className="text-gray-700">チェックリスト</span>
      </nav>

      <div className="mb-6">
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-1">CHECKLIST</p>
        <h1 className="text-2xl font-bold text-gray-900">学習チェックリスト</h1>
        <p className="text-sm text-gray-500 mt-1">覚えたテーマにチェックをつけて進捗を管理しましょう</p>
      </div>

      {/* 進捗 */}
      <div className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-gray-800">学習進捗</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-black text-green-700">{checkedCount} / {total} テーマ</p>
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors border border-gray-200 hover:border-red-200 px-2 py-1 rounded-lg"
            >
              リセット
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-1">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-right text-sm font-bold text-green-700">{pct}%</p>
      </div>

      {/* S テーマ */}
      <section className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-bold text-gray-800">最重要テーマ（S）</h2>
          <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
            {sThemes.filter(t => checked.has(t.id)).length}/{sThemes.length}
          </span>
        </div>
        <div className="space-y-2">
          {sThemes.map(t => (
            <label key={t.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              checked.has(t.id)
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-100 hover:border-green-200'
            }`}>
              <input
                type="checkbox"
                checked={checked.has(t.id)}
                onChange={() => toggle(t.id)}
                className="w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/themes/${t.id}`}
                    onClick={e => e.stopPropagation()}
                    className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
                  >
                    {t.name}
                  </Link>
                  <ImportanceBadge importance={t.importance} showLabel={false} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">出題{t.count}回 / 直近第{t.latestRound}回</p>
              </div>
              {checked.has(t.id) && (
                <span className="text-green-600 font-bold text-sm flex-shrink-0">覚えた！</span>
              )}
            </label>
          ))}
        </div>
      </section>

      {/* A テーマ */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-bold text-gray-800">重要テーマ（A）</h2>
          <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">
            {aThemes.filter(t => checked.has(t.id)).length}/{aThemes.length}
          </span>
        </div>
        <div className="space-y-2">
          {aThemes.map(t => (
            <label key={t.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              checked.has(t.id)
                ? 'bg-orange-50 border-orange-200'
                : 'bg-white border-gray-100 hover:border-orange-200'
            }`}>
              <input
                type="checkbox"
                checked={checked.has(t.id)}
                onChange={() => toggle(t.id)}
                className="w-5 h-5 accent-orange-500 cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/themes/${t.id}`}
                    onClick={e => e.stopPropagation()}
                    className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
                  >
                    {t.name}
                  </Link>
                  <ImportanceBadge importance={t.importance} showLabel={false} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">出題{t.count}回 / 直近第{t.latestRound}回</p>
              </div>
              {checked.has(t.id) && (
                <span className="text-orange-600 font-bold text-sm flex-shrink-0">覚えた！</span>
              )}
            </label>
          ))}
        </div>
      </section>

      <div className="flex gap-4 flex-wrap">
        <Link href="/study/dashboard" className="text-sm text-green-600 hover:underline">← ダッシュボードへ</Link>
        <Link href="/study" className="text-sm text-gray-400 hover:text-green-600 transition-colors">学習モード</Link>
      </div>
    </main>
  )
}
