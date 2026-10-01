'use client'

import { useState, useSyncExternalStore, type ReactNode } from 'react'

export type PastExamsTabKey = 'round' | 'subject' | 'theme'

const TABS: { key: PastExamsTabKey; label: string }[] = [
  { key: 'round', label: '年度別' },
  { key: 'subject', label: '科目別' },
  { key: 'theme', label: 'テーマ別' },
]

function isTabKey(v: string | null): v is PastExamsTabKey {
  return v === 'round' || v === 'subject' || v === 'theme'
}

function readTabFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('tab')
}

function subscribePopState(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}

/**
 * /past-exams の「年度別・科目別・テーマ別」切替。
 * 3つのパネルはすべてサーバー側で描画済みのものを受け取り、hidden で出し分けるだけ
 * （各パネルの内容はHTMLに含まれるのでSEO上も欠落しない）。
 * 選択中のタブは ?tab=subject 等で URL に保持する（replaceState なので履歴は増えない）。
 * これにより、科目別・テーマ別の演習ページからブラウザの「戻る」で戻った時も、
 * 直前に選んでいたタブが復元される。
 */
export default function PastExamsTabs({ panels }: { panels: Record<PastExamsTabKey, ReactNode> }) {
  // URLの ?tab= を読む。SSR/hydration時は getServerSnapshot（null＝年度別）を使い、
  // hydration後にクライアントの値へ切り替わる（hydration mismatchを起こさない）
  const urlTab = useSyncExternalStore(subscribePopState, readTabFromUrl, () => null)
  /** ユーザーがタップで選んだタブ（URLより優先） */
  const [picked, setPicked] = useState<PastExamsTabKey | null>(null)
  const tab: PastExamsTabKey = picked ?? (isTabKey(urlTab) ? urlTab : 'round')

  function select(next: PastExamsTabKey) {
    setPicked(next)
    const url = new URL(window.location.href)
    if (next === 'round') url.searchParams.delete('tab')
    else url.searchParams.set('tab', next)
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }

  return (
    <>
      <div role="tablist" aria-label="過去問の解き方" className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => {
          const active = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`past-exams-tab-${t.key}`}
              aria-selected={active}
              aria-controls={`past-exams-panel-${t.key}`}
              onClick={() => select(t.key)}
              className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                active ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {TABS.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`past-exams-panel-${t.key}`}
          aria-labelledby={`past-exams-tab-${t.key}`}
          hidden={t.key !== tab}
          className="mt-4"
        >
          {panels[t.key]}
        </div>
      ))}
    </>
  )
}
