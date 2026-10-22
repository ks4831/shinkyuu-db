'use client'

import { useEffect, useState } from 'react'
import { getPastExamSession, summarizePastExamSession, type PastExamSessionSummary } from '@/lib/pastExamSession'

/* 過去問一覧（年度別）の各回に出す、この端末での進み具合。
   SSR・初回描画では何も出さず、マウント後に保存内容を読むだけ（書き込みはしない）。 */
export default function PastExamRoundStatus({ round, total }: { round: number; total: number }) {
  const [summary, setSummary] = useState<PastExamSessionSummary | null>(null)

  useEffect(() => {
    const sync = () => {
      const s = getPastExamSession(round)
      setSummary(s ? summarizePastExamSession(s, total) : null)
    }
    sync()
    // 戻る操作（bfcache）でこの一覧に戻った場合や、別タブで解き進めた場合も最新にする
    window.addEventListener('storage', sync)
    window.addEventListener('pageshow', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('pageshow', sync)
    }
  }, [round, total])

  if (!summary) return null
  if (summary.status === 'completed') {
    return (
      <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
        完了・{summary.correct} / {summary.total}問正解
      </span>
    )
  }
  return (
    <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
      途中・{summary.answered} / {summary.total}問（次は問{summary.nextQuestionNumber}）
    </span>
  )
}
