'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { themes } from '@/lib/data'
import { subjectLabel } from '@/lib/quiz'
import { recordPastExamAttempt } from '@/lib/pastExamStorage'
import {
  getPastExamSession,
  savePastExamProgress,
  markPastExamSessionCompleted,
  resetPastExamSession,
  type PastExamSession,
} from '@/lib/pastExamSession'
import { trackSessionOnceKeyed } from '@/lib/analytics'
import { getAcceptedAnswerIndexes, isPastExamAnswerCorrect, formatAcceptedAnswers } from '@/lib/pastExamAnswers'

const CIRCLED = ['①', '②', '③', '④']

export type PastExamQuestionView = {
  id: string
  questionNumber: number
  questionText: string
  choices: string[]
  /** 通常はこちらのみ。両方の意味は src/lib/pastExamAnswers.ts 参照 */
  answerIndex?: number
  answerIndexes?: number[]
  explanation: string
  subject?: string
  themeId?: string
  source: string
  sourceOrg: string
}

function themeName(themeId?: string): string {
  if (!themeId) return ''
  return themes.find((t) => t.id === themeId)?.name ?? ''
}

export default function PastExamRunner({
  round,
  questions,
}: {
  round: number
  questions: PastExamQuestionView[]
}) {
  const [phase, setPhase] = useState<'start' | 'question' | 'result'>('start')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [resumable, setResumable] = useState<PastExamSession | null>(null)

  const total = questions.length

  /* 続きから再開できるセッションがあるか確認する。SSR/初回描画では常にnullのまま
     （サーバーとクライアントの初回出力を一致させ、hydration mismatchを避ける）。
     マウント後にのみLocalStorageを読み、保存済みの回答列が現在の設問順の
     先頭からの連続一致（Q1,Q2,…の途中）になっている場合だけ再開対象とする。
     ズレていたり壊れていたりする場合は安全に無視し、通常の開始画面を出す。 */
  useEffect(() => {
    const s = getPastExamSession(round)
    if (!s || s.completed || s.answers.length === 0 || s.answers.length >= total) return
    const sorted = [...s.answers].sort((a, b) => a.questionNumber - b.questionNumber)
    const isContiguousPrefix = sorted.every((a, i) => questions[i]?.id === a.questionId)
    if (isContiguousPrefix) setResumable({ ...s, answers: sorted })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  if (total === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-gray-600">第{round}回の過去問は準備中です。</p>
        <Link
          href="/past-exams"
          className="mt-4 inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          過去問一覧へ
        </Link>
      </div>
    )
  }

  function handleStart() {
    trackSessionOnceKeyed('pastexam_start', String(round), { exam_round: round, question_count: total })
    setPhase('question')
  }

  /** 「続きから解く」：保存済みの回答済み分をresultsへ復元し、次の未回答問題から再開する */
  function handleResume() {
    if (!resumable) return
    trackSessionOnceKeyed('pastexam_start', String(round), { exam_round: round, question_count: total })
    setResults(resumable.answers.map((a) => a.correct))
    setIndex(resumable.answers.length)
    setSelected(null)
    setAnswered(false)
    setPhase('question')
  }

  /** 「最初から解く」：この年度の保存セッションのみ削除しQ1から開始（回答履歴historyは削除しない） */
  function handleRestart() {
    resetPastExamSession(round)
    setResumable(null)
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setResults([])
    trackSessionOnceKeyed('pastexam_start', String(round), { exam_round: round, question_count: total })
    setPhase('question')
  }

  function handleAnswer() {
    const q = questions[index]
    if (selected === null || answered) return
    const isCorrect = isPastExamAnswerCorrect(q, selected)
    setAnswered(true)
    setResults((r) => [...r, isCorrect])
    recordPastExamAttempt({ questionId: q.id, examRound: round, correct: isCorrect })
    savePastExamProgress(round, { questionId: q.id, questionNumber: q.questionNumber, correct: isCorrect })
  }

  function handleNext() {
    if (index + 1 >= total) {
      trackSessionOnceKeyed('pastexam_complete', String(round), {
        exam_round: round,
        correct: results.filter(Boolean).length,
        total: results.length,
      })
      markPastExamSessionCompleted(round)
      setPhase('result')
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setAnswered(false)
  }

  function handleRetry() {
    resetPastExamSession(round)
    setResumable(null)
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setResults([])
    setPhase('start')
  }

  if (phase === 'start') {
    if (resumable) {
      const answeredCount = resumable.answers.length
      return (
        <div className="mx-auto max-w-md px-4 py-10 text-center">
          <h1 className="text-xl font-bold text-gray-900">第{round}回 過去問</h1>
          <p className="mt-2 text-sm text-gray-500">収録 {total}問</p>
          <p className="mt-3 text-sm font-semibold text-green-700">
            {answeredCount}問回答済み・残り{total - answeredCount}問
          </p>
          <button
            type="button"
            onClick={handleResume}
            className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 text-base font-bold text-white hover:bg-green-700"
          >
            続きから解く
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-600 hover:border-green-300"
          >
            最初から解く
          </button>
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <h1 className="text-xl font-bold text-gray-900">第{round}回 過去問</h1>
        <p className="mt-2 text-sm text-gray-500">収録 {total}問</p>
        <button
          type="button"
          onClick={handleStart}
          className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 text-base font-bold text-white hover:bg-green-700"
        >
          過去問を解く
        </button>
      </div>
    )
  }

  if (phase === 'result') {
    const score = results.filter(Boolean).length
    const pct = Math.round((score / total) * 100)
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <h1 className="text-base font-bold text-gray-900">第{round}回 過去問</h1>
          <p className="mt-3 text-4xl font-black text-gray-900">
            {score}
            <span className="text-xl text-gray-400"> / {total}問 正解</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">正答率 {pct}%</p>
          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={handleRetry}
              className="block w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-700"
            >
              もう一度解く
            </button>
            <Link
              href="/past-exams"
              className="block rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
            >
              過去問一覧へ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── 出題画面（1問1画面） ──────────────────── */
  const q = questions[index]
  const acceptedIndexes = getAcceptedAnswerIndexes(q)
  const correct = answered && selected !== null && isPastExamAnswerCorrect(q, selected)
  const tName = themeName(q.themeId)

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700">第{round}回　問{q.questionNumber}</span>
          <span>{index + 1} / {total}問</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-green-500 transition-all"
            style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      {q.subject && (
        <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          {subjectLabel(q.subject)}
        </span>
      )}

      <h2 className="mt-3 whitespace-pre-line text-lg font-bold leading-relaxed text-gray-900">{q.questionText}</h2>

      <div className="mt-4 space-y-2.5">
        {q.choices.map((choice, i) => {
          const isSel = selected === i
          const isAns = acceptedIndexes.includes(i)
          let cls =
            'w-full text-left rounded-xl border-2 px-4 py-3.5 text-[15px] leading-relaxed transition-colors flex gap-3 items-start '
          if (!answered) {
            cls += isSel
              ? 'border-green-500 bg-green-50 text-gray-900'
              : 'border-gray-200 bg-white text-gray-800 hover:border-green-300'
          } else if (isAns) {
            cls += 'border-green-500 bg-green-50 text-gray-900'
          } else if (isSel) {
            cls += 'border-red-400 bg-red-50 text-gray-900'
          } else {
            cls += 'border-gray-200 bg-white text-gray-400'
          }
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              aria-pressed={isSel}
              onClick={() => setSelected(i)}
              className={cls}
            >
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
          className="mt-5 w-full rounded-xl bg-green-600 px-5 py-4 text-base font-bold text-white transition-colors hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400"
        >
          回答する
        </button>
      )}

      {answered && (
        <div className="mt-5">
          <div
            className={`rounded-2xl border p-4 ${correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
          >
            <p className={`text-lg font-black ${correct ? 'text-green-700' : 'text-red-600'}`}>
              {correct ? '正解' : '不正解'}
            </p>
            <p className="mt-2 text-sm font-bold text-gray-700">正答：{formatAcceptedAnswers(q)}</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{q.explanation}</p>
            {tName && <p className="mt-3 text-xs font-semibold text-gray-500">{tName}</p>}
            <div className="mt-3 border-t border-gray-200 pt-3 text-[11px] leading-relaxed text-gray-400">
              出典：<br />
              {q.source}<br />
              {q.sourceOrg}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="mt-4 w-full rounded-xl bg-gray-900 px-5 py-4 text-base font-bold text-white hover:bg-gray-800"
          >
            {index + 1 >= total ? '結果を見る' : '次の問題 →'}
          </button>
        </div>
      )}
    </div>
  )
}
