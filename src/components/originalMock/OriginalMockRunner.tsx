'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLeaveGuard } from '@/lib/leaveGuard'
import { PAST_EXAM_CHOICE_LABELS } from '@/lib/choiceLabels'
import {
  getOriginalMockResult,
  isOriginalMockCorrect,
  saveOriginalMockResult,
  scoreBySubject,
  type OriginalMockAnswer,
  type OriginalMockData,
  type OriginalMockQuestion,
  type OriginalMockResult,
} from '@/lib/originalMock'

const CIRCLED = PAST_EXAM_CHOICE_LABELS

type Screen = 'start' | 'question' | 'result'

/** 1問1画面で解き、最後に科目別の得点・全問の正答と解説を見せる。途中経過は保存しない */
export default function OriginalMockRunner({ data }: { data: OriginalMockData }) {
  const [screen, setScreen] = useState<Screen>('start')
  const [active, setActive] = useState<OriginalMockQuestion[]>(data.questions)
  /** true＝間違えた問題だけの再挑戦（結果は保存しない） */
  const [isRetryWrong, setIsRetryWrong] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [answers, setAnswers] = useState<OriginalMockAnswer[]>([])
  const [lastResult, setLastResult] = useState<OriginalMockResult | null>(null)

  useEffect(() => {
    setLastResult(getOriginalMockResult(data.mockId))
  }, [data.mockId])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [screen, index])

  useLeaveGuard(screen === 'question' && (index > 0 || answered) ? '解答の途中です。このページを離れると、途中の解答は保存されません。' : null)

  function start(questions: OriginalMockQuestion[], retryWrong: boolean) {
    setActive(questions)
    setIsRetryWrong(retryWrong)
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setAnswers([])
    setScreen('question')
  }

  function handleAnswer() {
    if (selected === null) return
    const q = active[index]
    setAnswers((prev) => [...prev, { questionId: q.id, selected, correct: isOriginalMockCorrect(q, selected) }])
    setAnswered(true)
  }

  function handleNext() {
    if (index + 1 < active.length) {
      setIndex(index + 1)
      setSelected(null)
      setAnswered(false)
      return
    }
    if (!isRetryWrong) {
      const result: OriginalMockResult = {
        mockId: data.mockId,
        correct: answers.filter((a) => a.correct).length,
        total: active.length,
        wrongIds: answers.filter((a) => !a.correct).map((a) => a.questionId),
        completedAt: Date.now(),
      }
      saveOriginalMockResult(result)
      setLastResult(result)
    }
    setScreen('result')
  }

  const subjectCounts = scoreBySubject(data.questions, []).map((r) => `${r.subject}${r.total}問`).join('・')

  /* ── 開始画面 ── */
  if (screen === 'start') {
    const lastWrong = lastResult ? data.questions.filter((q) => lastResult.wrongIds.includes(q.id)) : []
    return (
      <div className="mx-auto max-w-md px-4 pb-28 pt-6">
        <p className="text-xs font-semibold text-teal-700">オリジナル模擬試験</p>
        <h1 className="mt-1 text-2xl font-black text-gray-900">{data.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          全{data.questions.length}問（{subjectCounts}）・四肢択一
        </p>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          オリジナル問題です（国家試験の公式問題・過去問ではありません）。AIを使って作成・検証しており、有資格者による最終確認は未実施です。根拠資料は各問の解説に示しています。
        </p>
        {lastResult && (
          <p className="mt-3 text-sm text-gray-700">
            前回の結果：<span className="font-bold">{lastResult.correct} / {lastResult.total}問</span>
          </p>
        )}
        <button
          type="button"
          onClick={() => start(data.questions, false)}
          className="mt-5 w-full rounded-xl bg-teal-600 px-5 py-4 text-base font-bold text-white transition-colors hover:bg-teal-700"
        >
          {lastResult ? 'もう一度、全問を解く' : '解き始める'}
        </button>
        {lastWrong.length > 0 && (
          <button
            type="button"
            onClick={() => start(lastWrong, true)}
            className="mt-3 w-full rounded-xl border border-teal-200 px-5 py-3.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
          >
            前回まちがえた{lastWrong.length}問だけ解く
          </button>
        )}
      </div>
    )
  }

  /* ── 結果画面 ── */
  if (screen === 'result') {
    const correctCount = answers.filter((a) => a.correct).length
    const wrong = active.filter((q) => answers.find((a) => a.questionId === q.id && !a.correct))
    const rows = scoreBySubject(active, answers)
    return (
      <div className="mx-auto max-w-md px-4 pb-28 pt-6">
        <p className="text-xs font-semibold text-teal-700">{data.title}{isRetryWrong && '（まちがえた問題）'}</p>
        <h1 className="mt-1 text-2xl font-black text-gray-900">結果</h1>
        <p className="mt-3 text-4xl font-black text-teal-700">
          {correctCount}<span className="text-lg text-gray-500"> / {active.length}問</span>
        </p>
        <table className="mt-4 w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.subject} className="border-b border-gray-100">
                <td className="py-2 text-gray-700">{r.subject}</td>
                <td className="py-2 text-right font-bold text-gray-900">{r.correct} / {r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {wrong.length > 0 && (
          <button
            type="button"
            onClick={() => start(wrong, true)}
            className="mt-5 w-full rounded-xl bg-teal-600 px-5 py-4 text-base font-bold text-white hover:bg-teal-700"
          >
            まちがえた{wrong.length}問を解き直す
          </button>
        )}
        <button
          type="button"
          onClick={() => start(data.questions, false)}
          className="mt-3 w-full rounded-xl border border-teal-200 px-5 py-3.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
        >
          全{data.questions.length}問をもう一度解く
        </button>

        <h2 className="mt-8 text-base font-black text-gray-900">正答と解説</h2>
        <div className="mt-3 space-y-2">
          {active.map((q) => {
            const a = answers.find((x) => x.questionId === q.id)
            return (
              <details key={q.id} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <summary className="flex cursor-pointer items-center gap-2 text-sm">
                  <span className={`font-black ${a?.correct ? 'text-green-700' : 'text-red-600'}`}>{a?.correct ? '○' : '×'}</span>
                  <span className="font-semibold text-gray-800">第{q.questionNumber}問</span>
                  <span className="truncate text-xs text-gray-500">{q.field}</span>
                </summary>
                <QuestionExplanation q={q} selected={a?.selected ?? null} />
              </details>
            )
          })}
        </div>
        <Link href="/original-mock" className="mt-6 block text-center text-sm font-semibold text-gray-600 underline">
          オリジナル模擬試験の一覧へ
        </Link>
      </div>
    )
  }

  /* ── 出題画面 ── */
  const q = active[index]
  const correct = answered && selected !== null && isOriginalMockCorrect(q, selected)
  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700">
            {isRetryWrong && '解き直し　'}第{q.questionNumber}問
          </span>
          <span>{index + 1} / {active.length}問</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-teal-500 transition-all"
            style={{ width: `${((index + (answered ? 1 : 0)) / active.length) * 100}%` }}
          />
        </div>
      </div>

      <span className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{q.subject}</span>
      <h2 className="mt-3 whitespace-pre-line text-lg font-bold leading-relaxed text-gray-900">{q.questionText}</h2>

      <div className="mt-4 space-y-2.5">
        {q.choices.map((choice, i) => {
          const isSel = selected === i
          const isAns = i === q.answerIndex
          let cls = 'w-full text-left rounded-xl border-2 px-4 py-3.5 text-[15px] leading-relaxed transition-colors flex gap-3 items-start '
          if (!answered) {
            cls += isSel ? 'border-teal-500 bg-teal-50 text-gray-900' : 'border-gray-200 bg-white text-gray-800 hover:border-teal-300'
          } else if (isAns) {
            cls += 'border-green-500 bg-green-50 text-gray-900'
          } else if (isSel) {
            cls += 'border-red-400 bg-red-50 text-gray-900'
          } else {
            cls += 'border-gray-200 bg-white text-gray-400'
          }
          return (
            <button key={i} type="button" disabled={answered} aria-pressed={isSel} onClick={() => setSelected(i)} className={cls}>
              <span className="mt-0.5 flex-shrink-0 font-bold" aria-hidden="true">{CIRCLED[i]}</span>
              <span>{choice}</span>
            </button>
          )
        })}
      </div>

      {!answered && (
        <button
          type="button"
          onClick={handleAnswer}
          disabled={selected === null}
          className="mt-5 w-full rounded-xl bg-teal-600 px-5 py-4 text-base font-bold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400"
        >
          回答する
        </button>
      )}

      {answered && (
        <div className="mt-5">
          <div className={`rounded-2xl border p-4 ${correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`text-lg font-black ${correct ? 'text-green-700' : 'text-red-600'}`}>{correct ? '正解' : '不正解'}</p>
            <QuestionExplanation q={q} selected={selected} />
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="mt-4 w-full rounded-xl bg-gray-900 px-5 py-4 text-base font-bold text-white hover:bg-gray-800"
          >
            {index + 1 >= active.length ? '結果を見る' : '次の問題 →'}
          </button>
        </div>
      )}
    </div>
  )
}

/** 正答・選択肢ごとの解説・学習のポイント・根拠資料（出題画面と結果画面で共用） */
function QuestionExplanation({ q, selected }: { q: OriginalMockQuestion; selected: number | null }) {
  return (
    <div className="mt-2 text-sm leading-relaxed text-gray-700">
      <p className="font-bold">正答：{CIRCLED[q.answerIndex]}</p>
      {selected !== null && selected !== q.answerIndex && <p className="mt-0.5 text-xs text-gray-500">あなたの解答：{CIRCLED[selected]}</p>}
      <ul className="mt-2 space-y-1.5">
        {q.choiceNotes.map((n, i) => (
          <li key={i} className="flex gap-2">
            <span className={`flex-shrink-0 font-bold ${i === q.answerIndex ? 'text-green-700' : 'text-gray-500'}`}>{CIRCLED[i]}</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-[13px]">
        <span className="font-bold">学習のポイント：</span>
        {q.point}
      </p>
      <div className="mt-3 border-t border-gray-200 pt-3 text-[11px] leading-relaxed text-gray-400">
        根拠資料：
        <br />
        {q.sources.join('／')}
      </div>
    </div>
  )
}
