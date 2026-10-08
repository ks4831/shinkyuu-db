'use client'

import { useEffect, useRef, useState } from 'react'
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
import { PAST_EXAM_CHOICE_LABELS } from '@/lib/choiceLabels'

const CIRCLED = PAST_EXAM_CHOICE_LABELS

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
 * mode:'theme'＝テーマ横断演習（/past-exams/theme/[themeId]）。
 * mode:'subject'＝科目横断演習（/past-exams/subject/[subjectId]）。
 * theme/subject modeではroundという概念自体が存在しないため、年度sessionへの参照を
 * 型レベルで持てないようにしている（誤ってroundに偽値を渡す設計を防ぐ）。
 */
export type PastExamRunnerProps =
  | { mode?: 'round'; round: number; questions: PastExamQuestionView[] }
  | { mode: 'theme'; themeId: string; themeName: string; questions: PastExamQuestionView[] }
  | { mode: 'subject'; subjectId: string; subjectName: string; questions: PastExamQuestionView[] }

/** 年度横断演習（theme/subject mode）の表示・戻り先情報。round modeではnull */
type CrossInfo = {
  /** 開始・結果画面の見出し上に出す名前（テーマ名／科目名） */
  name: string
  /** 「テーマ別過去問」「科目別過去問」 */
  label: string
  backHref: string
  backLabel: string
}

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

/** 年度横断演習の開始画面に出す出題回の表記。設問自身の examRound から算出する。
 *  連続していれば「第30〜34回」、途中の回が抜けていれば「第30・33・34回」と実在する回だけを示す
 *  （問題の無い回まで含むように見せない）。 */
function crossRangeLabel(questions: PastExamQuestionView[]): string {
  const rounds = [...new Set(questions.map((q) => q.examRound))].sort((a, b) => a - b)
  if (rounds.length === 0) return ''
  const min = rounds[0]
  const max = rounds[rounds.length - 1]
  if (rounds.length === 1) return `第${min}回`
  if (rounds.length >= 3 && max - min + 1 === rounds.length) return `第${min}〜${max}回`
  return `第${rounds.join('・')}回`
}

/** 年度昇順 → 問題番号昇順（単一年度演習では問題番号順と同じ） */
function byRoundThenNumber(a: PastExamQuestionView, b: PastExamQuestionView): number {
  return a.examRound - b.examRound || a.questionNumber - b.questionNumber
}

/** 問題番号の小さい順に並んだチップ一覧（間違えた問題の一覧表示に共通利用）。
 *  年度横断演習（showRound）では「第33回 問12」のように元の年度も表示する。 */
function WrongQuestionChips({ questions, showRound }: { questions: PastExamQuestionView[]; showRound: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {questions.map((q) => (
        <span
          key={q.id}
          className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
        >
          {showRound && `第${q.examRound}回 `}問{q.questionNumber}
        </span>
      ))}
    </div>
  )
}

export default function PastExamRunner(props: PastExamRunnerProps) {
  const { questions } = props
  /** null＝theme/subject mode（年度sessionを持たない）。以降 round!==null が「年度session操作を
   *  行ってよいか」の唯一の判定基準になる（mode別の変数は持たず、round自体で判定する）。 */
  const round = props.mode === 'theme' || props.mode === 'subject' ? null : props.round
  const roundLabel = round !== null ? `第${round}回` : '過去問'
  const crossInfo: CrossInfo | null =
    props.mode === 'theme'
      ? { name: props.themeName, label: 'テーマ別過去問', backHref: `/themes/${props.themeId}`, backLabel: 'テーマ詳細へ戻る' }
      : props.mode === 'subject'
        ? { name: props.subjectName, label: '科目別過去問', backHref: '/past-exams?tab=subject', backLabel: '科目一覧へ戻る' }
        : null
  /** 完走後「もう一度解く」等から戻る先。round modeは従来通り過去問一覧、theme modeはテーマ詳細、subject modeは科目一覧。 */
  const backLink = crossInfo
    ? { href: crossInfo.backHref, label: crossInfo.backLabel }
    : { href: '/past-exams', label: '過去問一覧へ' }
  const resultBackLabel = crossInfo ? `${crossInfo.label}の結果へ` : `${roundLabel}の結果へ`

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

  /* ── 画面切替時のスクロール（全modeで共通） ──
     「次の問題」等のユーザー操作で画面が切り替わった直後だけ、新しい画面の先頭
     （出題画面＝問題番号・進捗の行、結果画面＝結果カード）が見える位置へ移動する。
     index等を監視して無条件にscrollすると、session復元・初回hydration・
     開始画面表示でも動いてしまうため、操作ハンドラ側で requestScroll() を呼んだ時だけ
     フラグを立てる（予想問題のQuizRunnerと同じ方式）。
     テンポ優先で behavior:'auto'（即時）。既に先頭付近が見えている場合
     （開始画面→1問目など）は動かさず、不要なジャンプを避ける。 */
  const screenTopRef = useRef<HTMLDivElement>(null)
  const scrollPending = useRef(false)
  function requestScroll() {
    scrollPending.current = true
  }
  useEffect(() => {
    if (!scrollPending.current) return
    scrollPending.current = false
    const el = screenTopRef.current
    if (!el) return
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    const top = el.getBoundingClientRect().top
    if (top >= margin - 1 && top <= window.innerHeight / 3) return
    el.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [phase, index, isReview, reviewQuestions])

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
    requestScroll()
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
    requestScroll()
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
    requestScroll()
    setPhase('question')
  }

  /** 「前回の結果を見る」：保存済みの完走セッションをそのまま結果画面に表示する */
  function handleViewLastResult() {
    if (!sessionCheck.completedSession) return
    setIsReview(false)
    requestScroll()
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
    requestScroll()
    setPhase('question')
  }

  /** 復習結果画面から「第○回の結果へ」：完走セッションの結果画面に戻る（復習結果はどこにも保存しない） */
  function handleBackToResult() {
    setIsReview(false)
    requestScroll()
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
    // 次の問題・結果画面のどちらへ進む場合も、切替後の画面先頭へ移動する
    requestScroll()
    if (index + 1 >= activeTotal) {
      if (isReview) {
        // 苦手復習の完走はセッションに保存しない（元の完走結果とは独立）
        setPhase('result')
        return
      }
      // 年度session・analyticsの完走記録は round mode のみ。theme/subject modeでは
      // どの回の年度sessionもcompletedにしてはいけないため、ここには触れない。
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
    requestScroll()
    setPhase('start')
  }

  if (phase === 'start') {
    const { resumable, completedSession } = sessionCheck

    if (resumable) {
      const answeredCount = resumable.answers.length
      return (
        <div ref={screenTopRef} className="mx-auto max-w-md scroll-mt-20 px-4 py-10 text-center">
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
        <div ref={screenTopRef} className="mx-auto max-w-md scroll-mt-20 px-4 py-10 text-center">
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
      <div ref={screenTopRef} className="mx-auto max-w-md scroll-mt-20 px-4 py-10 text-center">
        {crossInfo ? (
          <>
            <p className="text-sm font-semibold text-green-700">{crossInfo.name}</p>
            <h1 className="mt-1 text-xl font-bold text-gray-900">{crossInfo.label}</h1>
          </>
        ) : (
          <h1 className="text-xl font-bold text-gray-900">{roundLabel} 過去問</h1>
        )}
        <p className="mt-2 text-sm text-gray-500">
          {crossInfo ? `${crossRangeLabel(questions)}・全${total}問` : `収録 ${total}問`}
        </p>
        <button
          type="button"
          onClick={handleStart}
          className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 text-base font-bold text-white hover:bg-green-700"
        >
          {crossInfo ? '演習を始める' : '過去問を解く'}
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
        .sort(byRoundThenNumber)
      return (
        <div ref={screenTopRef} className="mx-auto max-w-md scroll-mt-20 px-4 py-8">
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
                <WrongQuestionChips questions={stillWrong} showRound={crossInfo !== null} />
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
          .sort(byRoundThenNumber)
      // theme/subject modeなど、completedSession（年度session）を持たない場合はローカルstateから算出する
      : questions.filter((_, i) => !results[i]).sort(byRoundThenNumber)

    return (
      <div ref={screenTopRef} className="mx-auto max-w-md scroll-mt-20 px-4 py-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          {crossInfo ? (
            <>
              <p className="text-xs font-semibold text-green-700">{crossInfo.name}</p>
              <h1 className="mt-0.5 text-base font-bold text-gray-900">{crossInfo.label}</h1>
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
              <WrongQuestionChips questions={wrongQuestions} showRound={crossInfo !== null} />
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
      {/* 画面切替後のスクロール先。sticky Headerに隠れないよう scroll-mt で余白を確保 */}
      <div ref={screenTopRef} className="mb-4 scroll-mt-20">
        {crossInfo && <p className="mb-1 text-xs font-semibold text-green-700">{crossInfo.name}</p>}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700">
            {isReview && '苦手復習　'}第{q.examRound}回　問{q.questionNumber}
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
