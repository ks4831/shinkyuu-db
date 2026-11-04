'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLeaveGuard } from '@/lib/leaveGuard'
import { PAST_EXAM_CHOICE_LABELS } from '@/lib/choiceLabels'
import {
  clearOriginalMockProgress,
  getLegacyOriginalMockResults,
  getOriginalMockProgress,
  getOriginalMockResult,
  getOriginalMockReview,
  getOriginalMockSubjectResult,
  isOriginalMockCorrect,
  questionsBySubject,
  questionsFingerprint,
  saveOriginalMockProgress,
  saveOriginalMockResult,
  saveOriginalMockReview,
  saveOriginalMockSubjectResult,
  scoreBySubject,
  type OriginalMockAnswer,
  type OriginalMockData,
  type OriginalMockQuestion,
  type OriginalMockResult,
  type OriginalMockSelections,
  type OriginalMockSubjectResult,
} from '@/lib/originalMock'
import {
  answeredCount,
  canGoNext,
  canGoPrev,
  confirmAnswer,
  createMockSession,
  goNext,
  goPrev,
  goTo,
  hasProgress,
  isLocked,
  selectChoice,
  shownChoice,
  startEditing,
  unansweredIndexes,
  type MockSession,
} from '@/lib/mockSession'

const CIRCLED = PAST_EXAM_CHOICE_LABELS

type Screen = 'start' | 'subjects' | 'question' | 'result'
type ReviewFilter = 'wrong' | 'all'

/**
 * 1問1画面で解き、最後に科目別の得点・全問の正答と解説を見せる。
 * 全問に挑戦するほか、1科目だけを選んで解ける（科目別の結果は全問の成績と別のキーに保存する）。
 * 解答の途中は全問・科目ごとに別々の枠へ自動保存し、再読み込み後に続きから再開できる（まちがえた問題の解き直しは保存しない）。
 * 結果画面からは、まちがえた問題の確認と、元の問題の画面（見直し：回答は変更できない）へ移動できる。
 * 前後の移動・回答の保持と変更・未回答の確認は mockSession（総合模擬試験①と共通）に任せる。
 */
export default function OriginalMockRunner({ data, updateNote }: { data: OriginalMockData; updateNote?: string }) {
  const [screen, setScreen] = useState<Screen>('start')
  const [active, setActive] = useState<OriginalMockQuestion[]>(data.questions)
  /** true＝間違えた問題だけの再挑戦（結果は保存しない） */
  const [isRetryWrong, setIsRetryWrong] = useState(false)
  const [session, setSession] = useState<MockSession>(() => createMockSession(data.questions.map((q) => q.id)))
  /** 採点したときの回答（結果画面用。未回答の問題は含まない） */
  const [answers, setAnswers] = useState<OriginalMockAnswer[]>([])
  /** 未回答を残して採点しようとしたときの確認表示 */
  const [confirmUnanswered, setConfirmUnanswered] = useState(false)
  const [lastResult, setLastResult] = useState<OriginalMockResult | null>(null)
  /** 問題数を増やす前の版（旧保存キー）の結果。新しい版から順。読むだけで、上書きしない */
  const [legacyResults, setLegacyResults] = useState<OriginalMockResult[]>([])
  /** true＝採点後に結果画面から問題の画面を見ている（回答の変更・採点はできない） */
  const [reviewing, setReviewing] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('wrong')
  /** 問題の画面から結果画面へ戻ったときに開いて表示する問題 */
  const [focusId, setFocusId] = useState<string | null>(null)
  /** true＝保存済みの結果を開いたが、選んだ選択肢の記録が無い（見直し機能より前の結果） */
  const [noSelectionRecord, setNoSelectionRecord] = useState(false)
  /** 解いている科目（null＝全問）。まちがえた問題の解き直しでも、その科目のまま */
  const [subject, setSubject] = useState<string | null>(null)
  /** 保存済みの途中経過（全問）・科目ごとの途中経過と直近の結果 */
  const [fullProgress, setFullProgress] = useState<MockSession | null>(null)
  const [subjectProgress, setSubjectProgress] = useState<Record<string, MockSession>>({})
  const [subjectResults, setSubjectResults] = useState<Record<string, OriginalMockSubjectResult>>({})
  /** true＝途中経過をこの端末に保存できなかった（離れる前の確認を出す） */
  const [saveFailed, setSaveFailed] = useState(false)
  const index = session.index
  const subjects = useMemo(() => questionsBySubject(data.questions), [data.questions])
  const subjectQuestions = subjects.find((s) => s.subject === subject)?.questions ?? null

  /** 画面に表示する問題番号：科目別は科目内の番号（解き直しでも同じ）、全問は元の番号 */
  function numberOf(q: OriginalMockQuestion): number {
    return subjectQuestions ? subjectQuestions.indexOf(q) + 1 : q.questionNumber
  }

  useEffect(() => {
    setLastResult(getOriginalMockResult(data.mockId))
    setLegacyResults(getLegacyOriginalMockResults(data.mockId))
    setFullProgress(getOriginalMockProgress(data.mockId, null, data.questions))
    const progress: Record<string, MockSession> = {}
    const results: Record<string, OriginalMockSubjectResult> = {}
    for (const s of subjects) {
      const p = getOriginalMockProgress(data.mockId, s.subject, s.questions)
      if (p) progress[s.subject] = p
      const r = getOriginalMockSubjectResult(data.mockId, s.subject, s.questions)
      if (r) results[s.subject] = r
    }
    setSubjectProgress(progress)
    setSubjectResults(results)
    // 開始画面・科目選択に戻るたびに読み直す
  }, [data.mockId, data.questions, subjects, screen])

  /** 回答を選ぶたびに途中経過を保存する。開いただけのセッションでは保存せず、以前の途中データを残す */
  useEffect(() => {
    if (screen !== 'question' || reviewing || isRetryWrong || !hasProgress(session)) return
    setSaveFailed(!saveOriginalMockProgress(data.mockId, subject, active, session))
  }, [session, screen, reviewing, isRetryWrong, subject, active, data.mockId])

  useEffect(() => {
    const card = screen === 'result' && focusId ? document.getElementById(`review-${focusId}`) : null
    if (card) card.scrollIntoView({ block: 'start' })
    else window.scrollTo({ top: 0 })
    // focusId は戻るときに screen と同時に変わるので、依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, index])

  useLeaveGuard(screen === 'question' && !reviewing && (isRetryWrong || saveFailed) && (index > 0 || answeredCount(session) > 0) ? '解答の途中です。このページを離れると、途中の解答は保存されません。' : null)

  function start(questions: OriginalMockQuestion[], retryWrong: boolean, nextSubject: string | null = null, saved?: MockSession) {
    setActive(questions)
    setIsRetryWrong(retryWrong)
    setSubject(nextSubject)
    setSaveFailed(false)
    setSession(saved ?? createMockSession(questions.map((q) => q.id)))
    setAnswers([])
    setConfirmUnanswered(false)
    setReviewing(false)
    setReviewFilter('wrong')
    setFocusId(null)
    setNoSelectionRecord(false)
    setScreen('question')
  }

  /** 保存済みの直近の結果を結果画面で開く。成績は読むだけで、保存し直さない */
  function openSavedResult(saved: OriginalMockResult, questions: OriginalMockQuestion[], selections: OriginalMockSelections | null, savedSubject: string | null) {
    const wrongIds = new Set(saved.wrongIds)
    const restored = questions.flatMap((q): OriginalMockAnswer[] => {
      if (!wrongIds.has(q.id)) return [{ questionId: q.id, selected: q.answerIndex, correct: true }]
      const selected = selections?.[q.id]
      return selected === undefined ? [] : [{ questionId: q.id, selected, correct: false }]
    })
    const byId = new Map(restored.map((a) => [a.questionId, a.selected]))
    setActive(questions)
    setIsRetryWrong(false)
    setSubject(savedSubject)
    setSession({ ...createMockSession(questions.map((q) => q.id)), answers: questions.map((q) => byId.get(q.id) ?? null) })
    setAnswers(restored)
    setReviewing(false)
    setReviewFilter('wrong')
    setFocusId(null)
    setNoSelectionRecord(selections === null)
    setScreen('result')
  }

  /** 結果画面から元の問題の画面へ */
  function openQuestion(i: number) {
    setSession(goTo(session, i))
    setReviewing(true)
    setScreen('question')
  }

  /** 問題の画面から結果画面へ。見ていた問題の解説を開いた位置に戻す */
  function backToResult() {
    const q = active[index]
    if (answers.some((a) => a.questionId === q.id && a.correct)) setReviewFilter('all')
    setFocusId(q.id)
    setReviewing(false)
    setScreen('result')
  }

  function move(next: MockSession) {
    setConfirmUnanswered(false)
    setSession(next)
  }

  /** 採点：各問の最新の確定回答を使う。未回答は不正解として数え、解き直しの対象に含める */
  function finish() {
    const final: OriginalMockAnswer[] = active.flatMap((q, i) => {
      const a = session.answers[i]
      return a === null ? [] : [{ questionId: q.id, selected: a, correct: isOriginalMockCorrect(q, a) }]
    })
    setAnswers(final)
    if (!isRetryWrong) {
      const correctIds = new Set(final.filter((a) => a.correct).map((a) => a.questionId))
      const result: OriginalMockResult = {
        mockId: data.mockId,
        correct: correctIds.size,
        total: active.length,
        wrongIds: active.filter((q) => !correctIds.has(q.id)).map((q) => q.id),
        completedAt: Date.now(),
      }
      const selected: OriginalMockSelections = Object.fromEntries(final.filter((a) => !a.correct).map((a) => [a.questionId, a.selected]))
      if (subject === null) {
        saveOriginalMockResult(result)
        saveOriginalMockReview(data.mockId, result.completedAt, selected)
        setLastResult(result)
      } else {
        saveOriginalMockSubjectResult({ ...result, subject, fingerprint: questionsFingerprint(active), selected })
      }
      clearOriginalMockProgress(data.mockId, subject)
    }
    setConfirmUnanswered(false)
    setScreen('result')
  }

  function handleFinish() {
    if (unansweredIndexes(session).length > 0) {
      setConfirmUnanswered(true)
      return
    }
    finish()
  }

  const subjectCounts = scoreBySubject(data.questions, []).map((r) => `${r.subject}${r.total}問`).join('・')

  /* ── 開始画面 ── */
  if (screen === 'start') {
    const total = data.questions.length
    const lastWrong = lastResult ? data.questions.filter((q) => lastResult.wrongIds.includes(q.id)) : []
    /** 旧版の結果の再挑戦は、新しい結果がまだ無いときだけ、いちばん新しい旧版について出す（その版の問題だけが選ばれる） */
    const legacyResult = legacyResults[0] ?? null
    const legacyWrong = legacyResult && !lastResult ? data.questions.filter((q) => legacyResult.wrongIds.includes(q.id)) : []
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
        {updateNote && (
          <p className="mt-3 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs leading-relaxed text-teal-800">{updateNote}</p>
        )}
        {lastResult && (
          <p className="mt-3 text-sm text-gray-700">
            前回の結果{lastResult.total !== total && `（${lastResult.total}問版）`}：<span className="font-bold">{lastResult.correct} / {lastResult.total}問</span>
          </p>
        )}
        {legacyResults.map((r) => (
          <p key={r.total} className="mt-2 text-xs leading-relaxed text-gray-500">
            {r.total}問版の結果（問題を追加する前）：<span className="font-bold text-gray-700">{r.correct} / {r.total}問</span>
          </p>
        ))}
        <p className="mt-3 text-xs leading-relaxed text-gray-500">解答途中の内容は、この端末・ブラウザに自動保存されます。別の端末への引き継ぎはできません。再読み込みしても、続きから再開できます。</p>
        <h2 className="mt-6 text-base font-black text-gray-900">① 全{total}問に挑戦</h2>
        {fullProgress && (
          <button
            type="button"
            onClick={() => start(data.questions, false, null, fullProgress)}
            className="mt-3 w-full rounded-xl bg-teal-600 px-5 py-4 text-base font-bold text-white transition-colors hover:bg-teal-700"
          >
            続きから解く（回答済み {answeredCount(fullProgress)} / {total}問）
          </button>
        )}
        <button
          type="button"
          onClick={() => start(data.questions, false)}
          className={fullProgress ? 'mt-3 w-full rounded-xl border border-teal-200 px-5 py-3.5 text-sm font-bold text-teal-700 hover:bg-teal-50' : 'mt-3 w-full rounded-xl bg-teal-600 px-5 py-4 text-base font-bold text-white transition-colors hover:bg-teal-700'}
        >
          {fullProgress ? 'はじめから解く' : lastResult ? 'もう一度、全問を解く' : '解き始める'}
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
        {legacyWrong.length > 0 && (
          <button
            type="button"
            onClick={() => start(legacyWrong, true)}
            className="mt-3 w-full rounded-xl border border-teal-200 px-5 py-3.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
          >
            {legacyResult!.total}問版でまちがえた{legacyWrong.length}問だけ解く
          </button>
        )}
        {lastResult && lastResult.total === total && (
          <button
            type="button"
            onClick={() => openSavedResult(lastResult, data.questions, getOriginalMockReview(data.mockId, lastResult.completedAt), null)}
            className="mt-3 w-full rounded-xl border border-gray-300 px-5 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            前回の結果と解説を見る
          </button>
        )}
        <h2 className="mt-8 text-base font-black text-gray-900">② 科目別に挑戦</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">
          {subjects.length}科目から1科目を選び、その科目の問題だけを解きます。
          {Object.keys(subjectProgress).length > 0 && `途中の科目が${Object.keys(subjectProgress).length}つあります。`}
        </p>
        <button
          type="button"
          onClick={() => setScreen('subjects')}
          className="mt-3 w-full rounded-xl bg-gray-900 px-5 py-4 text-base font-bold text-white hover:bg-gray-800"
        >
          科目を選ぶ
        </button>
      </div>
    )
  }

  /* ── 科目選択画面 ── */
  if (screen === 'subjects') {
    return (
      <div className="mx-auto max-w-md px-4 pb-28 pt-6">
        <p className="text-xs font-semibold text-teal-700">{data.title}</p>
        <h1 className="mt-1 text-2xl font-black text-gray-900">科目を選ぶ</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">科目別の結果は、全{data.questions.length}問の成績とは別に保存します。</p>
        <ul className="mt-4 space-y-3">
          {subjects.map(({ subject: name, questions }) => {
            const progress = subjectProgress[name]
            const result = subjectResults[name]
            return (
              <li key={name} aria-label={name} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-base font-bold text-gray-900">{name}</h2>
                  <span className="flex-shrink-0 text-sm font-semibold text-gray-600">{questions.length}問</span>
                </div>
                {result && (
                  <p className="mt-1 text-xs text-gray-600">
                    前回：<span className="font-bold">{result.correct} / {result.total}問（{Math.round((result.correct / result.total) * 100)}%）</span>
                  </p>
                )}
                {progress && (
                  <button
                    type="button"
                    onClick={() => start(questions, false, name, progress)}
                    className="mt-3 min-h-11 w-full rounded-xl bg-teal-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-teal-700"
                  >
                    続きから解く（回答済み {answeredCount(progress)} / {questions.length}問）
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => start(questions, false, name)}
                  className={`mt-3 min-h-11 w-full rounded-xl px-3 py-2.5 text-sm font-bold ${progress ? 'border border-teal-200 text-teal-700 hover:bg-teal-50' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                >
                  {progress ? 'はじめから解く' : 'この科目を解く'}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={() => openSavedResult(result, questions, result.selected, name)}
                    className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    前回の結果と解説を見る
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={() => setScreen('start')}
          className="mt-5 min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          開始画面に戻る
        </button>
      </div>
    )
  }

  /* ── 結果画面 ── */
  if (screen === 'result') {
    const correctCount = answers.filter((a) => a.correct).length
    const wrong = active.filter((q) => !answers.find((a) => a.questionId === q.id && a.correct))
    const unansweredCount = noSelectionRecord ? 0 : active.length - answers.length
    const rows = scoreBySubject(active, answers)
    const filter: ReviewFilter = wrong.length > 0 ? reviewFilter : 'all'
    const listed = filter === 'wrong' ? wrong : active
    const noAnswerLabel = noSelectionRecord ? '回答の記録なし' : '未回答'
    return (
      <div className="mx-auto max-w-md px-4 pb-28 pt-6">
        <p className="text-xs font-semibold text-teal-700">{data.title}{subject && `・${subject}`}{isRetryWrong && '（まちがえた問題）'}</p>
        <h1 className="mt-1 text-2xl font-black text-gray-900">結果</h1>
        <p className="mt-3 text-4xl font-black text-teal-700">
          {correctCount}<span className="text-lg text-gray-500"> / {active.length}問</span>
        </p>
        {subject ? (
          <p className="mt-1 text-sm font-bold text-gray-700">正答率 {Math.round((correctCount / active.length) * 100)}%</p>
        ) : (
          <>
            <h2 className="mt-4 text-sm font-bold text-gray-700">科目別の結果</h2>
            <table className="mt-1 w-full text-sm">
              <tbody>
                {rows.map((r) => (
                  <tr key={r.subject} className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">{r.subject}</td>
                    <td className="py-2 text-right font-bold text-gray-900">{r.correct} / {r.total}</td>
                    <td className="w-14 py-2 text-right text-gray-600">{Math.round((r.correct / r.total) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {wrong.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => {
                setReviewFilter('wrong')
                document.getElementById('review-list')?.scrollIntoView({ block: 'start' })
              }}
              className="mt-5 w-full rounded-xl bg-teal-600 px-5 py-4 text-base font-bold text-white hover:bg-teal-700"
            >
              {unansweredCount > 0 ? 'まちがえた・未回答の' : 'まちがえた'}{wrong.length}問の解説を見る
            </button>
            <button
              type="button"
              onClick={() => start(wrong, true, subject)}
              className="mt-3 w-full rounded-xl border border-teal-200 px-5 py-3.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
            >
              {unansweredCount > 0 ? 'まちがえた・未回答の' : 'まちがえた'}{wrong.length}問を解き直す
            </button>
          </>
        )}
        {subject && subjectQuestions ? (
          <button
            type="button"
            onClick={() => start(subjectQuestions, false, subject)}
            className="mt-3 w-full rounded-xl border border-teal-200 px-5 py-3.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
          >
            {subject}に再挑戦する
          </button>
        ) : (
          <button
            type="button"
            onClick={() => start(data.questions, false)}
            className="mt-3 w-full rounded-xl border border-teal-200 px-5 py-3.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
          >
            全{data.questions.length}問をもう一度解く
          </button>
        )}
        <button
          type="button"
          onClick={() => setScreen('subjects')}
          className="mt-3 w-full rounded-xl border border-gray-300 px-5 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          {subject ? '科目選択に戻る' : '科目を選んで解く'}
        </button>

        <h2 id="review-list" className="mt-8 scroll-mt-20 text-base font-black text-gray-900">正答と解説</h2>
        {wrong.length > 0 && (
          <div role="tablist" aria-label="表示する問題" className="mt-3 grid grid-cols-2 gap-2">
            {([['wrong', `まちがえた問題（${wrong.length}）`], ['all', `全問（${active.length}）`]] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                onClick={() => setReviewFilter(value)}
                className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-bold ${filter === value ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-2">
          {listed.map((q) => {
            const a = answers.find((x) => x.questionId === q.id)
            return (
              <details key={q.id} id={`review-${q.id}`} open={focusId === q.id} className="scroll-mt-20 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <summary className="flex cursor-pointer items-center gap-2 text-sm">
                  <span className={`font-black ${a?.correct ? 'text-green-700' : 'text-red-600'}`}>{a ? (a.correct ? '○' : '×') : '−'}</span>
                  <span className="font-semibold text-gray-800">第{numberOf(q)}問</span>
                  {subject && <span className="flex-shrink-0 text-xs text-gray-500">元の第{q.questionNumber}問</span>}
                  <span className="truncate text-xs text-gray-500">{a ? q.field : `${noAnswerLabel}・${q.field}`}</span>
                </summary>
                <ReviewQuestion q={q} selected={a?.selected ?? null} noAnswerLabel={noAnswerLabel} />
                <QuestionExplanation q={q} selected={a?.selected ?? null} />
                <button
                  type="button"
                  onClick={() => openQuestion(active.indexOf(q))}
                  className="mt-3 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  第{numberOf(q)}問へ戻る
                </button>
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
  const locked = reviewing || isLocked(session, index)
  const selected = reviewing ? session.answers[index] : shownChoice(session, index)
  const editing = session.editing[index]
  const correct = locked && selected !== null && isOriginalMockCorrect(q, selected)
  const unanswered = unansweredIndexes(session)
  const isLast = !canGoNext(session)
  const previous = session.answers[index]
  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700">
            {reviewing ? '見直し　' : isRetryWrong && '解き直し　'}第{numberOf(q)}問{subject && (reviewing || isRetryWrong) && `（元の第${q.questionNumber}問）`}
          </span>
          <span>
            {index + 1} / {active.length}問（回答済み {answeredCount(session)}）
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full bg-teal-500 transition-all" style={{ width: `${(answeredCount(session) / active.length) * 100}%` }} />
        </div>
      </div>

      <span className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{q.subject}</span>
      <h2 className="mt-3 whitespace-pre-line text-lg font-bold leading-relaxed text-gray-900">{q.questionText}</h2>

      <div className="mt-4 space-y-2.5">
        {q.choices.map((choice, i) => {
          const isSel = selected === i
          const isAns = i === q.answerIndex
          let cls = 'w-full text-left rounded-xl border-2 px-4 py-3.5 text-[15px] leading-relaxed transition-colors flex gap-3 items-start '
          if (!locked) {
            cls += isSel ? 'border-teal-500 bg-teal-50 text-gray-900' : 'border-gray-200 bg-white text-gray-800 hover:border-teal-300'
          } else if (isAns) {
            cls += 'border-green-500 bg-green-50 text-gray-900'
          } else if (isSel) {
            cls += 'border-red-400 bg-red-50 text-gray-900'
          } else {
            cls += 'border-gray-200 bg-white text-gray-400'
          }
          return (
            <button key={i} type="button" disabled={locked} aria-pressed={isSel} onClick={() => setSession(selectChoice(session, i))} className={cls}>
              <span className="mt-0.5 flex-shrink-0 font-bold" aria-hidden="true">{CIRCLED[i]}</span>
              <span>{choice}</span>
            </button>
          )
        })}
      </div>

      {!locked && (
        <>
          {editing && previous !== null && (
            <p className="mt-3 text-xs text-gray-500">
              回答を変更中です。確定するまでは、前の回答（{CIRCLED[previous]}）が採点に使われます。
            </p>
          )}
          <button
            type="button"
            onClick={() => setSession(confirmAnswer(session))}
            disabled={selected === null}
            className="mt-5 w-full rounded-xl bg-teal-600 px-5 py-4 text-base font-bold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400"
          >
            {editing ? 'この回答に変更する' : '回答する'}
          </button>
        </>
      )}

      {locked && (
        <div className="mt-5">
          <div className={`rounded-2xl border p-4 ${correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`text-lg font-black ${correct ? 'text-green-700' : 'text-red-600'}`}>{selected === null ? (noSelectionRecord ? '回答の記録なし' : '未回答') : correct ? '正解' : '不正解'}</p>
            <QuestionExplanation q={q} selected={selected} />
          </div>
          {reviewing ? (
            <button type="button" onClick={backToResult} className="mt-3 w-full rounded-xl bg-teal-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-teal-700">
              結果に戻る
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSession(startEditing(session))}
              className="mt-3 w-full rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              回答を変更する
            </button>
          )}
        </div>
      )}

      {/* ── 前後の移動（回答していなくても移動できる。採点は最後の問題から） ── */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => move(goPrev(session))}
          disabled={!canGoPrev(session)}
          className="min-h-12 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:border-gray-100 disabled:text-gray-300"
        >
          ← 前の問題へ
        </button>
        {reviewing ? (
          <button
            type="button"
            onClick={() => move(goNext(session))}
            disabled={isLast}
            className="min-h-12 rounded-xl bg-gray-900 px-3 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300"
          >
            次の問題へ →
          </button>
        ) : isLast ? (
          <button type="button" onClick={handleFinish} className="min-h-12 rounded-xl bg-gray-900 px-3 py-3 text-sm font-bold text-white hover:bg-gray-800">
            採点する
          </button>
        ) : (
          <button
            type="button"
            onClick={() => move(goNext(session))}
            className={`min-h-12 rounded-xl px-3 py-3 text-sm font-bold ${locked ? 'bg-gray-900 text-white hover:bg-gray-800' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {locked ? '次の問題へ →' : 'あとで解く →'}
          </button>
        )}
      </div>

      {confirmUnanswered && (
        <div role="alertdialog" aria-labelledby="unanswered-title" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p id="unanswered-title" className="text-sm font-bold text-amber-900">
            未回答の問題が{unanswered.length}問あります（第{unanswered.slice(0, 8).map((i) => numberOf(active[i])).join('・')}問{unanswered.length > 8 ? 'など' : ''}）。
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">このまま採点すると、未回答の問題は不正解として数えます。</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => move(goTo(session, unanswered[0]))}
              className="min-h-11 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100"
            >
              未回答の問題へ
            </button>
            <button type="button" onClick={finish} className="min-h-11 rounded-xl bg-amber-600 px-3 py-2 text-sm font-bold text-white hover:bg-amber-700">
              このまま採点する
            </button>
          </div>
        </div>
      )}

      {subject && !reviewing && !isRetryWrong && (
        <div className="mt-6 text-center">
          <button type="button" onClick={() => setScreen('subjects')} className="min-h-11 px-3 text-sm font-semibold text-gray-600 underline">
            科目選択に戻る
          </button>
          <p className="text-xs text-gray-500">{saveFailed ? 'この端末に保存できないため、戻ると途中の回答は消えます。' : '途中の回答は自動で保存されます。'}</p>
        </div>
      )}
    </div>
  )
}

/** 結果画面の見直し：問題文・選択肢・自分の回答と正答の位置 */
function ReviewQuestion({ q, selected, noAnswerLabel }: { q: OriginalMockQuestion; selected: number | null; noAnswerLabel: string }) {
  return (
    <div className="mt-3 text-sm leading-relaxed text-gray-800">
      <p className="whitespace-pre-line font-bold">{q.questionText}</p>
      <ul className="mt-2 space-y-1.5">
        {q.choices.map((choice, i) => {
          const isAns = i === q.answerIndex
          const isSel = i === selected
          const box = isAns ? 'border-green-500 bg-green-50' : isSel ? 'border-red-400 bg-red-50' : 'border-gray-200'
          return (
            <li key={i} className={`flex gap-2 rounded-lg border px-2.5 py-2 ${box}`}>
              <span className="flex-shrink-0 font-bold" aria-hidden="true">{CIRCLED[i]}</span>
              <span className="min-w-0">
                {choice}
                {isSel && <span className={`ml-1 whitespace-nowrap text-xs font-bold ${isAns ? 'text-green-700' : 'text-red-600'}`}>（あなたの回答）</span>}
                {isAns && <span className="ml-1 whitespace-nowrap text-xs font-bold text-green-700">（正答）</span>}
              </span>
            </li>
          )
        })}
      </ul>
      {selected === null && <p className="mt-2 text-xs font-bold text-red-600">あなたの回答：{noAnswerLabel}</p>}
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
