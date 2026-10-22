'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listPastExamSessionSummaries, type PastExamSessionSummary } from '@/lib/pastExamSession'

/** HOMEに並べる途中の回の上限。これを超えた分は過去問一覧（年度別）で確認する */
const MAX_ROUNDS = 3

function formatDate(ms: number): string {
  const d = new Date(ms)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/* HOMEの「続きから解く」。年度別過去問で途中の回があるときだけ表示する。
   - SSR・初回描画では何も出さず、マウント後にこの端末の保存内容だけを読む（書き込みはしない）
   - 途中の回が複数あれば、最近解いた順に回ごとの進捗を並べる（回どうしの記録は混ざらない）
   - 「続きから解く」は開始画面を挟まず次の未回答問題へ（?resume=1）。
     「最初から」は各回の開始画面へ移動し、そこで選び直す（HOMEからは記録を消さない） */
export default function HomeResumeCard({ totals }: { totals: Record<number, number> }) {
  const [items, setItems] = useState<PastExamSessionSummary[]>([])

  useEffect(() => {
    const sync = () => setItems(listPastExamSessionSummaries(totals).filter((s) => s.status === 'in-progress'))
    sync()
    // 別タブで解き進めた場合や、戻る操作でこの画面に戻った場合も最新の進捗にする
    window.addEventListener('storage', sync)
    window.addEventListener('pageshow', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('pageshow', sync)
    }
  }, [totals])

  if (items.length === 0) return null
  const shown = items.slice(0, MAX_ROUNDS)
  const hidden = items.length - shown.length

  return (
    <section className="px-4 pt-5 sm:pt-8" aria-labelledby="home-resume-heading">
      <div className="mx-auto max-w-5xl rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
        <h2 id="home-resume-heading" className="text-sm font-black text-gray-900">
          続きから解く
          <span className="ml-2 text-[11px] font-semibold text-gray-400">年度別過去問・途中{items.length}回</span>
        </h2>
        <ul className="mt-3 space-y-3">
          {shown.map((s) => (
            <li key={s.examRound} className="rounded-xl bg-gray-50 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-gray-900">第{s.examRound}回 過去問</span>
                <span className="text-[11px] text-gray-400">{formatDate(s.updatedAt)} に学習</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">
                {s.answered} / {s.total}問 回答済み・次は<span className="font-bold text-gray-900">問{s.nextQuestionNumber}</span>から
              </p>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200" aria-hidden="true">
                <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(s.answered / s.total) * 100}%` }} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Link
                  href={`/past-exams/${s.examRound}?resume=1`}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
                >
                  問{s.nextQuestionNumber}から再開 <span className="ml-1" aria-hidden="true">→</span>
                </Link>
                <Link
                  href={`/past-exams/${s.examRound}`}
                  className="flex min-h-11 items-center px-1 text-xs font-semibold text-gray-500 underline hover:text-gray-700"
                >
                  最初から解き直す
                </Link>
              </div>
            </li>
          ))}
        </ul>
        {hidden > 0 && (
          <Link href="/past-exams" className="mt-3 inline-block text-xs font-semibold text-blue-700 underline">
            ほか{hidden}回の途中の演習を過去問一覧で見る
          </Link>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          進み具合はこの端末のこのブラウザにだけ保存されます。別の端末・別のブラウザ・シークレットモードでは表示されません。
        </p>
      </div>
    </section>
  )
}
