'use client'

import { useEffect, useState } from 'react'
import {
  getPastExamPartSession,
  getPastExamSession,
  summarizePastExamSession,
  type PastExamSessionSummary,
} from '@/lib/pastExamSession'
import { PAST_EXAM_PART_LABEL, type PastExamPart, type PastExamPartRange } from '@/lib/pastExamParts'

type Item = { label: string; summary: PastExamSessionSummary }

/* 過去問一覧（年度別）の各回に出す、この端末での進み具合。
   全問（従来）に加えて、午前・午後だけの演習の進み具合も並べる（Sprint 25。記録は別キー）。
   SSR・初回描画では何も出さず、マウント後に保存内容を読むだけ（書き込みはしない）。 */
export default function PastExamRoundStatus({
  round,
  total,
  parts = null,
}: {
  round: number
  total: number
  /** 午前・午後の範囲（区分が確認できない回は null） */
  parts?: PastExamPartRange[] | null
}) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const sync = () => {
      const list: Item[] = []
      for (const p of parts ?? []) {
        const s = getPastExamPartSession(round, p.part)
        const summary = s ? summarizePastExamSession(s, p.count, p.firstNumber) : null
        if (summary) list.push({ label: PAST_EXAM_PART_LABEL[p.part as PastExamPart], summary })
      }
      const s = getPastExamSession(round)
      const summary = s ? summarizePastExamSession(s, total) : null
      // 午前・午後のある回では、全問の記録だと分かるよう「全問」と付ける（区分のない回は従来どおり）
      if (summary) list.push({ label: parts && parts.length > 0 ? '全問' : '', summary })
      setItems(list)
    }
    sync()
    // 戻る操作（bfcache）でこの一覧に戻った場合や、別タブで解き進めた場合も最新にする
    window.addEventListener('storage', sync)
    window.addEventListener('pageshow', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('pageshow', sync)
    }
  }, [round, total, parts])

  if (items.length === 0) return null
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {items.map(({ label, summary }) => {
        const prefix = label ? `${label}：` : ''
        return summary.status === 'completed' ? (
          <span key={label || 'all'} className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
            {prefix}完了・{summary.correct} / {summary.total}問正解
          </span>
        ) : (
          <span key={label || 'all'} className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            {prefix}途中・{summary.answered} / {summary.total}問（次は問{summary.nextQuestionNumber}）
          </span>
        )
      })}
    </span>
  )
}
