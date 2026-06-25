'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { themes } from '@/lib/data'

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

const saThemes = themes.filter(t => t.importance === 'S' || t.importance === 'A')

export default function Dashboard() {
  const [checked, setChecked] = useState(new Set<string>())
  const [favorites, setFavorites] = useState(new Set<string>())
  const [weakness, setWeakness] = useState(new Set<string>())

  useEffect(() => {
    setChecked(getSet(CHECKED_KEY))
    setFavorites(getSet(FAVORITES_KEY))
    setWeakness(getSet(WEAKNESS_KEY))
  }, [])

  const checkedCount = saThemes.filter(t => checked.has(t.id)).length
  const total = saThemes.length
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <Link href="/study" className="hover:text-green-600 transition-colors">学習モード</Link>
        <span>›</span>
        <span className="text-gray-700">ダッシュボード</span>
      </nav>

      <div className="mb-8">
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-1">STUDY DASHBOARD</p>
        <h1 className="text-2xl font-bold text-gray-900">学習ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">重要度S・Aテーマの学習進捗を確認できます</p>
      </div>

      {/* 進捗メーター */}
      <div className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100 p-6 mb-6">
        <div className="flex items-end justify-between mb-2">
          <p className="font-bold text-gray-800">S・A テーマ学習進捗</p>
          <p className="text-3xl font-black text-green-700">{pct}%</p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">{checkedCount} / {total} テーマ 習得済み</p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">覚えたテーマ</p>
          <p className="text-3xl font-black text-green-700">{checkedCount}</p>
          <p className="text-xs text-gray-400">/ {total} テーマ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">復習リスト</p>
          <p className="text-3xl font-black text-orange-600">{favorites.size}</p>
          <p className="text-xs text-gray-400">テーマ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">苦手テーマ</p>
          <p className="text-3xl font-black text-red-600">{weakness.size}</p>
          <p className="text-xs text-gray-400">テーマ</p>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Link href="/study" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm p-5 transition-all">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            📚
          </div>
          <div>
            <p className="font-bold text-gray-900">今日の10テーマ</p>
            <p className="text-xs text-gray-500">重要度S優先のランダム学習</p>
          </div>
        </Link>
        <Link href="/study/checklist" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm p-5 transition-all">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            ✅
          </div>
          <div>
            <p className="font-bold text-gray-900">チェックリスト</p>
            <p className="text-xs text-gray-500">S・Aテーマを全部チェック</p>
          </div>
        </Link>
        <Link href="/study/favorites" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm p-5 transition-all">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            ★
          </div>
          <div>
            <p className="font-bold text-gray-900">復習リスト</p>
            <p className="text-xs text-gray-500">あとで復習するテーマ（{favorites.size}件）</p>
          </div>
        </Link>
        <Link href="/study/weakness" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm p-5 transition-all">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            📌
          </div>
          <div>
            <p className="font-bold text-gray-900">苦手テーマ</p>
            <p className="text-xs text-gray-500">重点的に復習（{weakness.size}件）</p>
          </div>
        </Link>
      </div>

      {/* 重要度S テーマリスト */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <h2 className="font-bold text-gray-800 mb-3">最重要テーマ（S）</h2>
        <div className="space-y-2">
          {themes.filter(t => t.importance === 'S').map(t => (
            <div key={t.id} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                checked.has(t.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200'
              }`}>
                {checked.has(t.id) ? '✓' : ''}
              </span>
              <Link href={`/themes/${t.id}`} className="text-sm text-gray-700 hover:text-green-600 transition-colors flex-1">
                {t.name}
              </Link>
              <span className="text-xs text-red-600 font-bold">S</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-4 flex-wrap">
        <Link href="/study" className="text-sm text-green-600 hover:underline">
          ← 学習モードへ
        </Link>
        <Link href="/themes" className="text-sm text-gray-400 hover:text-green-600 transition-colors">
          テーマ一覧
        </Link>
      </div>
    </main>
  )
}
