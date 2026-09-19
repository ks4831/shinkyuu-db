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
  /** この問題が実際に出題された回。テーマ横断演習では round prop と一致しないことがあるため、
   *  年度表示・履歴記録は必ずこちら（設問自身の値）を使う（round prop は使わない）。 */
  examRound: number
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

/**
 * mode省略時（またはmode:'round'）＝従来通りの単一年度演習。round必須。
 * mode:'theme'＝テーマ横断演習（Ver.9.30で基盤のみ追加。公開routeはまだ無い）。
 * theme modeではroundという概念自体が存在しないため、年度sessionへの参照を
 * 型レベルで持てないようにしている（誤ってroundに偽値を渡す設計を防ぐ）。
 */
export type PastExamRunnerProps =
  | { mode?: 'round'; round: number; questions: PastExamQuestionView[] }
  | { mode: 'theme'; themeId: string; themeName: string; questions: PastExamQuestionView[] }

type SessionCheck = {
  /** 進行中（未完走）で、Q1からの連続一致が取れた場合のみ設定 */
  resumable: PastExamSession | null
  /** 完走済みで、現在の設問セットと完全一致する場合のみ設定 */
  completedSession: PastExamSession | null
}

const EMPTY_SESSION_CHECK: SessionCheck = { resumable: null, completedSession: null }

function themeName(themeId?: string): string {
  if (!themeId) return ''
  return themes.find((t) => t.id === themeId)?.name ?? ''
}

/** 問題番号の小さい順に並んだチップ一覧（間違えた問題の一覧表示に共通利用） */
function WrongQuestionChips({ questions }: { questions: PastExamQuestionView[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {questions.map((q) => (
        <span
          key={q.id}
          className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
        >
          問{q.questionNumber}
        </span>
      ))}
    </div>
  )
}

export default function PastExamRunner(props: PastExamRunnerProps) {
  const { questions } = props
  /** null＝theme mode（年度sessionを持たない）。以降 round!==null が「年度session操作を
   *  行ってよいか」の唯一の判定基準になる（isThemeModeという別変数は持たず、round自体で判定する）。 */
  const round = props.mode === 'theme' ? null : props.round
  const roundLabel = round !== null ? `第${round}回` : '過去問'
  const themeInfo = props.mode === 'theme' ? { id: props.themeId, name: props.themeName } : null
  /** 完走後「もう一度解く」等から戻る先。round modeは従来通り過去問一覧、theme modeはテーマ詳細。 */
  const backLink = round !== null
    ? { href: '/past-exams', label: '過去問一覧へ' }
    : { href: `/themes/${themeInfo?.id ?? ''}`, label: 'テーマ詳細へ戻る' }
  const resultBackLabel = round !== null ? `${roundLabel}の結果へ` : 'テーマ別過去問の結果へ'

  const [phase, setPhase] = useState<'start' | 'question' | 'result'>('start')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [sessionCheck, setSessionCheck] = useState<SessionCheck>(EMPTY_SESSION_CHECK)
  /** 苦手復習モード中か。true の間は questions ではなく reviewQuestions を出題する */
  const [isReview, setIsReview] = useState(false)
  const [reviewQuestions, setReviewQuestions] = useState<PastExamQuestionView[]>([])

  const total = questions.length
  const activeQuestions = isReview ? reviewQuestions : questions
  const activeTotal = activeQuestions.length

  /* 保存済みセッションを確認する。SSR/初回描画では常にnullのまま
     （サーバーとクライアントの初回出力を一致させ、hydration mismatchを避ける）。
     マウント後にのみLocalStorageを読み、
     - 完走済み（completed:true）かつ現在の設問セットと全問一致する → completedSession
       （「前回の結果を見る」「間違えた問題を復習」の元データとして使う）
     - 未完走で、保存済みの回答列が現在の設問順の先頭からの連続一致になっている
       → resumable（「続きから解く」）
     のどちらでもない場合は安全に無視し、通常の開始画面を出す。
     setState呼び出しは1箇所（compute()の戻り値をまとめて反映）にとどめ、
     react-hooks/set-state-in-effect の警告を増やさないようにしている。 */
  useEffect(() => {
    function compute(): SessionCheck {
      // theme modeでは年度sessionという概念自体が無いため、読み込みを一切行わない
      if (round === null) return EMPTY_SESSION_CHECK
      const s = getPastExamSession(round)
      if (!s) return EMPTY_SESSION_CHECK
      const sorted = [...s.answers].sort((a, b) => a.questionNumber - b.questionNumber)
      if (s.completed) {
        const validFull = sorted.length === total && sorted.every((a, i) => questions[i]?.id === a.questionId)
        return validFull ? { resumable: null, completedSession: { ...s, answers: sorted } } : EMPTY_SESSION_CHECK
      }
      if (sorted.length === 0 || sorted.length >= total) return EMPTY_SESSION_CHECK
      const isContiguousPrefix = sorted.every((a, i) => questions[i]?.id === a.questionId)
      return isContiguousPrefix ? { resumable: { ...s, answers: sorted }, completedSession: null } : EMPTY_SESSION_CHECK
    }
    setSessionCheck(compute())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  if (total === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-gray-600">
          {round !== null ? `第${round}回の過去問は準備中です。` : 'この演習の過去問は準備中です。'}
        </p>
        <Link
          href={backLink.href}
          className="mt-4 inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          {backLink.label}
        </Link>
      </div>
    )
  }

  function handleStart() {
    if (round !== null) {
      resetPastExamSession(round)
      trackSessionOnceKeyed('pastexam_start', String(round), { exam_round: round, question_count: total })
    }
    setSessionCheck(EMPTY_SESSION_CHECK)
    setIsReview(false)
    setReviewQuestions([])
    setPhase('question')
  }

  /** 「続きから解く」：保存済みの回答済み分をresultsへ復元し、次の未回答問題から再開する */
  function handleResume() {
    const { resumable } = sessionCheck
    if (!resumable) return
    if (round !== null) {
      trackSessionOnceKeyed('pastexam_start', String(round), { exam_round: round, question_count: total })
    }
    setIsReview(false)
    setReviewQuestions([])
    setResults(resumable.answers.map((a) => a.correct))
    setIndex(resumable.answers.length)
    setSelected(null)
    setAnswered(false)
    setPhase('question')
  }

  /** 「最初から解く」：この年度の保存セッションのみ削除しQ1から開始（回答履歴historyは削除しない） */
  function handleRestart() {
    if (round !== null) {
      resetPastExamSession(round)
      trackSessionOnceKeyed('pastexam_start', String(round), { exam_round: round, question_count: total })
    }
    setSessionCheck(EMPTY_SESSION_CHECK)
    setIsReview(false)
    setReviewQuestions([])
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setResults([])
    setPhase('question')
  }

  /** 「前回の結果を見る」：保存済みの完走セッションをそのまま結果画面に表示する */
  function handleViewLastResult() {
    if (!sessionCheck.completedSession) return
    setIsReview(false)
    setPhase('result')
  }

  /** 「間違えた○問を復習」：渡された問題だけを元の問題番号順に出題するモードへ入る */
  function handleStartReview(wrongQuestions: PastExamQuestionView[]) {
    if (wrongQuestions.length === 0) return
    setReviewQuestions(wrongQuestions)
    setIsReview(true)
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setResults([])
    setPhase('question')
  }

  /** 復習結果画面から「第○回の結果へ」：完走セッションの結果画面に戻る（復習結果はどこにも保存しない） */
  function handleBackToResult() {
    setIsReview(false)
    setPhase('result')
  }

  function handleAnswer() {
    const q = activeQuestions[index]
    if (selected === null || answered) return
    const isCorrect = isPastExamAnswerCorrect(q, selected)
    setAnswered(true)
    setResults((r) => [...r, isCorrect])
    // 実際に回答した事実は、通常演習・苦手復習・テーマ演習のいずれでも履歴に残す。
    // examRoundは必ず設問自身の値を使う（round propではない。テーマ横断演習では
    // round propが存在しない／一致しないことがあるため）。
    recordPastExamAttempt({ questionId: q.id, examRound: q.examRound, correct: isCorrect })
    // 年度sessionへの保存は「通常演習（苦手復習でない）かつ round mode」の時のみ。
    // theme modeではround自体が存在しないため、年度sessionには一切触れない。
    if (!isReview && round !== null) {
      savePastExamProgress(round, { questionId: q.id, questionNumber: q.questionNumber, correct: isCorrect })
    }
  }

  function handleNext() {
    if (index + 1 >= activeTotal) {
      if (isReview) {
        // 苦手復習の完走はセッションに保存しない（元の完走結果とは独立）
        setPhase('result')
        return
      }
      // 年度session・analyticsの完走記録は round mode のみ。theme modeでは
      // 第31〜34回のどのsessionもcompletedにしてはいけないため、ここには触れない。
      if (round !== null) {
        trackSessionOnceKeyed('pastexam_complete', String(round), {
          exam_round: round,
          correct: results.filter(Boolean).length,
          total: results.length,
        })
        markPastExamSessionCompleted(round)
        setSessionCheck({ resumable: null, completedSession: getPastExamSession(round) })
      }
      setPhase('result')
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setAnswered(false)
  }

  /** 「もう一度{total}問解く」：この年度のセッションを削除し、新しいセッションとしてQ1からやり直す */
  function handleRetry() {
    if (round !== null) resetPastExamSession(round)
    setSessionCheck(EMPTY_SESSION_CHECK)
    setIsReview(false)
    setReviewQuestions([])
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setResults([])
    setPhase('start')
  }

  if (phase === 'start') {
    const { resumable, completedSession } = sessionCheck

    if (resumable) {
      const answeredCount = resumable.answers.length
      return (
        <div className="mx-auto max-w-md px-4 py-10 text-center">
          <h1 className="text-xl font-bold text-gray-900">{roundLabel} 過去問</h1>
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

    if (completedSession) {
      const lastScore = completedSession.answers.filter((a) => a.correct).length
      return (
        <div className="mx-auto max-w-md px-4 py-10 text-center">
          <h1 className="text-xl font-bold text-gray-900">{roundLabel} 過去問</h1>
          <p className="mt-2 text-sm text-gray-500">収録 {total}問</p>
          <p className="mt-3 text-sm font-semibold text-gray-600">
            前回 {lastScore} / {total}問正解
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 text-base font-bold text-white hover:bg-green-700"
          >
            過去問を解く
          </button>
          <button
            type="button"
            onClick={handleViewLastResult}
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-600 hover:border-green-300"
          >
            前回の結果を見る
          </button>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        {themeInfo ? (
          <>
            <p className="text-sm font-semibold text-green-700">{themeInfo.name}</p>
            <h1 className="mt-1 text-xl font-bold text-gray-900">テーマ別過去問</h1>
          </>
        ) : (
          <h1 className="text-xl font-bold text-gray-900">{roundLabel} 過去問</h1>
        )}
        <p className="mt-2 text-sm text-gray-500">{themeInfo ? `全${total}問` : `収録 ${total}問`}</p>
        <button
          type="button"
          onClick={handleStart}
          className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 text-base font-bold text-white hover:bg-green-700"
        >
          {themeInfo ? '演習を始める' : '過去問を解く'}
        </button>
      </div>
    )
  }

  if (phase === 'result') {
    if (isReview) {
      const score = results.filter(Boolean).length
      const reviewTotal = activeTotal
      const pct = reviewTotal ? Math.round((score / reviewTotal) * 100) : 0
      const stillWrong = activeQuestions
        .filter((_, i) => !results[i])
        .sort((a, b) => a.questionNumber - b.questionNumber)
      return (
        <div className="mx-auto max-w-md px-4 py-8">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <h1 className="text-base font-bold text-gray-900">苦手復習 完了</h1>
            <p className="mt-3 text-4xl font-black text-gray-900">
              {score}
              <span className="text-xl text-gray-400"> / {reviewTotal}問 正解</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">正答率 {pct}%</p>

            {stillWrong.length > 0 && (
              <div className="mt-5 text-left">
                <p className="text-sm font-bold text-gray-700">まだ間違えた問題　{stillWrong.length}問</p>
                <WrongQuestionChips questions={stillWrong} />
              </div>
            )}

            <div className="mt-6 space-y-2.5">
              {stillWrong.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleStartReview(stillWrong)}
                  className="block w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-700"
                >
                  間違えた{stillWrong.length}問をもう一度復習
                </button>
              )}
              <button
                type="button"
                onClick={handleBackToResult}
                className="block w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
              >
                {resultBackLabel}
              </button>
              <Link
                href={backLink.href}
                className="block rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
              >
                {backLink.label}
              </Link>
            </div>
          </div>
        </div>
      )
    }

    const { completedSession } = sessionCheck
    const score = completedSession
      ? completedSession.answers.filter((a) => a.correct).length
      : results.filter(Boolean).length
    const pct = Math.round((score / total) * 100)
    const wrongQuestions = completedSession
      ? completedSession.answers
          .filter((a) => !a.correct)
          .map((a) => questions.find((q) => q.id === a.questionId))
          .filter((q): q is PastExamQuestionView => Boolean(q))
          .sort((a, b) => a.questionNumber - b.questionNumber)
      // theme modeなど、completedSession（年度session）を持たない場合はローカルstateから算出する
      : questions.filter((_, i) => !results[i]).sort((a, b) => a.questionNumber - b.questionNumber)

    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          {themeInfo ? (
            <>
              <p className="text-xs font-semibold text-green-700">{themeInfo.name}</p>
              <h1 className="mt-0.5 text-base font-bold text-gray-900">テーマ別過去問</h1>
            </>
          ) : (
            <h1 className="text-base font-bold text-gray-900">{roundLabel} 過去問</h1>
          )}
          <p className="mt-3 text-4xl font-black text-gray-900">
            {score}
            <span className="text-xl text-gray-400"> / {total}問 正解</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">正答率 {pct}%</p>

          {wrongQuestions.length === 0 ? (
            <p className="mt-5 text-sm font-bold text-green-700">全問正解</p>
          ) : (
            <div className="mt-5 text-left">
              <p className="text-sm font-bold text-gray-700">間違えた問題　{wrongQuestions.length}問</p>
              <WrongQuestionChips questions={wrongQuestions} />
            </div>
          )}

          <div className="mt-6 space-y-2.5">
            {wrongQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => handleStartReview(wrongQuestions)}
                className="block w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-700"
              >
                間違えた{wrongQuestions.length}問を復習
              </button>
            )}
            <button
              type="button"
              onClick={handleRetry}
              className="block w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
            >
              もう一度{total}問解く
            </button>
            <Link
              href={backLink.href}
              className="block rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
            >
              {backLink.label}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── 出題画面（1問1画面。通常演習・苦手復習の両方でこのブロックを共用する） ── */
  const q = activeQuestions[index]
  const acceptedIndexes = getAcceptedAnswerIndexes(q)
  const correct = answered && selected !== null && isPastExamAnswerCorrect(q, selected)
  const tName = themeName(q.themeId)

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <div className="mb-4">
        {themeInfo && <p className="mb-1 text-xs font-semibold text-green-700">{themeInfo.name}</p>}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700">
            {isReview ? '苦手復習' : `第${q.examRound}回`}　問{q.questionNumber}
          </span>
          <span>{index + 1} / {activeTotal}問</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-green-500 transition-all"
            style={{ width: `${((index + (answered ? 1 : 0)) / activeTotal) * 100}%` }}
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
            {q.themeId && tName && (
              <Link
                href={`/themes/${q.themeId}`}
                className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs hover:border-green-300"
              >
                <span className="text-gray-500">
                  テーマ　<span className="font-semibold text-gray-700">{tName}</span>
                </span>
                <span className="font-semibold text-green-700">このテーマを詳しく見る →</span>
              </Link>
            )}
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
            {index + 1 >= activeTotal ? '結果を見る' : '次の問題 →'}
          </button>
        </div>
      )}
    </div>
  )
}
