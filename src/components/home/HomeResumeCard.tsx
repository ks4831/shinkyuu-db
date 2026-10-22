'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { listPastExamSessionSummaries, type PastExamSessionSummary } from '@/lib/pastExamSession'
import { listSubjectSessionSummaries, type PastExamSubjectSessionSummary } from '@/lib/pastExamSubjectSession'

/** HOMEに並べる途中の回・科目の上限（それぞれ）。これを超えた分は過去問一覧で確認する */
const MAX_ITEMS = 3

function formatDate(ms: number): string {
  const d = new Date(ms)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

type Props = {
  /** 回ごとの演習可能数 */
  totals: Record<number, number>
  /** 科目ごとの過去問数 */
  subjectTotals: Record<string, number>
  /** 科目名 */
  subjectNames: Record<string, string>
}

/** 1件分の表示。年度別・科目別で共通 */
function ResumeItem({
  title,
  updatedAt,
  answered,
  total,
  next,
  resumeHref,
  restartHref,
  resumeLabel,
}: {
  title: string
  updatedAt: number
  answered: number
  total: number
  next: ReactNode
  resumeHref: string
  restartHref: string
  resumeLabel: string
}) {
  return (
    <li className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-gray-900">{title}</span>
        <span className="flex-shrink-0 text-[11px] text-gray-400">{formatDate(updatedAt)} に学習</span>
      </div>
      <p className="mt-1 text-xs text-gray-600">
        {answered} / {total}問 回答済み・{next}
      </p>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200" aria-hidden="true">
        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(answered / total) * 100}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Link
          href={resumeHref}
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
        >
          {resumeLabel} <span className="ml-1" aria-hidden="true">→</span>
        </Link>
        <Link
          href={restartHref}
          className="flex min-h-11 items-center px-1 text-xs font-semibold text-gray-500 underline hover:text-gray-700"
        >
          最初から解き直す
        </Link>
      </div>
    </li>
  )
}

/* HOMEの「続きから解く」。年度別・科目別の過去問で途中のものがあるときだけ表示する。
   - SSR・初回描画では何も出さず、マウント後にこの端末の保存内容だけを読む（書き込みはしない）
   - 年度別と科目別は見出しを分けて並べる（記録も別キーで、混ざらない）。それぞれ最近解いた順に最大3件
   - 「続きから」は開始画面を挟まず次の未回答問題へ（?resume=1）。
     「最初から」は開始画面へ移動し、そこで選び直す（HOMEからは記録を消さない） */
export default function HomeResumeCard({ totals, subjectTotals, subjectNames }: Props) {
  const [rounds, setRounds] = useState<PastExamSessionSummary[]>([])
  const [subjects, setSubjects] = useState<PastExamSubjectSessionSummary[]>([])

  useEffect(() => {
    const sync = () => {
      setRounds(listPastExamSessionSummaries(totals).filter((s) => s.status === 'in-progress'))
      setSubjects(listSubjectSessionSummaries(subjectTotals).filter((s) => s.status === 'in-progress'))
    }
    sync()
    // 別タブで解き進めた場合や、戻る操作でこの画面に戻った場合も最新の進捗にする
    window.addEventListener('storage', sync)
    window.addEventListener('pageshow', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('pageshow', sync)
    }
  }, [totals, subjectTotals])

  if (rounds.length === 0 && subjects.length === 0) return null
  const groups = [
    { key: 'round', label: '年度別過去問', count: rounds.length, unit: '回' },
    { key: 'subject', label: '科目別過去問', count: subjects.length, unit: '科目' },
  ].filter((g) => g.count > 0)

  return (
    <section className="px-4 pt-5 sm:pt-8" aria-labelledby="home-resume-heading">
      <div className="mx-auto max-w-5xl rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
        <h2 id="home-resume-heading" className="text-sm font-black text-gray-900">
          続きから解く
        </h2>
        {groups.map((g) => (
          <div key={g.key} className="mt-3">
            <h3 className="text-[11px] font-bold text-gray-500">
              {g.label}・途中{g.count}
              {g.unit}
            </h3>
            <ul className="mt-1.5 space-y-3">
              {g.key === 'round'
                ? rounds.slice(0, MAX_ITEMS).map((s) => (
                    <ResumeItem
                      key={s.examRound}
                      title={`第${s.examRound}回 過去問`}
                      updatedAt={s.updatedAt}
                      answered={s.answered}
                      total={s.total}
                      next={
                        <>
                          次は<span className="font-bold text-gray-900">問{s.nextQuestionNumber}</span>から
                        </>
                      }
                      resumeHref={`/past-exams/${s.examRound}?resume=1`}
                      restartHref={`/past-exams/${s.examRound}`}
                      resumeLabel={`問${s.nextQuestionNumber}から再開`}
                    />
                  ))
                : subjects.slice(0, MAX_ITEMS).map((s) => (
                    <ResumeItem
                      key={s.subjectId}
                      title={`${subjectNames[s.subjectId] ?? s.subjectId}（科目別）`}
                      updatedAt={s.updatedAt}
                      answered={s.answered}
                      total={s.total}
                      next={
                        <>
                          次は<span className="font-bold text-gray-900">{s.answered + 1}問目</span>から
                        </>
                      }
                      resumeHref={`/past-exams/subject/${s.subjectId}?resume=1`}
                      restartHref={`/past-exams/subject/${s.subjectId}`}
                      resumeLabel={`${s.answered + 1}問目から再開`}
                    />
                  ))}
            </ul>
            {g.count > MAX_ITEMS && (
              <Link
                href={g.key === 'round' ? '/past-exams' : '/past-exams?tab=subject'}
                className="mt-2 inline-block text-xs font-semibold text-blue-700 underline"
              >
                ほか{g.count - MAX_ITEMS}
                {g.unit}の途中の演習を過去問一覧で見る
              </Link>
            )}
          </div>
        ))}
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          進み具合はこの端末のこのブラウザにだけ保存されます。別の端末・別のブラウザ・シークレットモードでは表示されません。
        </p>
      </div>
    </section>
  )
}
