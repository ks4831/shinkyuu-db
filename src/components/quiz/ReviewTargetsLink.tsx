'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readReviewTargets, reviewHeading, type ReviewTargets } from '@/lib/reviewTargets'

/**
 * /quiz/weak への導線。押す前に「何が・何問」出題されるかを、端末の保存データから求めて表示する。
 * 対象0問のときは開始ボタンを出さない。
 */
export default function ReviewTargetsLink({
  href = '/quiz/weak',
  compact = false,
}: {
  href?: string
  /** カード内など横幅の狭い場所用（見出しを小さく） */
  compact?: boolean
}) {
  // ハイドレーション不一致を避けるため、保存データはマウント後に読む
  const [t, setT] = useState<ReviewTargets | null>(null)

  useEffect(() => {
    const sync = () => setT(readReviewTargets())
    sync()
    window.addEventListener('shinkyuu-quiz-change', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('shinkyuu-quiz-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (!t) return null

  if (t.kind === 'empty') {
    return <p className={`text-center text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>{reviewHeading('empty')}</p>
  }

  return (
    <div>
      <p className={`mb-1.5 text-center font-semibold text-gray-600 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {reviewHeading(t.kind)}
      </p>
      <Link
        href={href}
        className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-700"
      >
        もう一度解く
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
          対象{t.total}問{t.available > t.total ? `（全${t.available}問中）` : ''}
        </span>
      </Link>
    </div>
  )
}
