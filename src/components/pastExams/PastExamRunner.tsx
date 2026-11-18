'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLeaveGuard } from '@/lib/leaveGuard'
import Link from 'next/link'
import PastExamResultMaterialCard from '@/components/pastExams/PastExamResultMaterialCard'
import { themes } from '@/lib/data'
import { subjectLabel } from '@/lib/quiz'
import { recordPastExamAttempt } from '@/lib/pastExamStorage'
import {
  getPastExamSession,
  savePastExamProgress,
  markPastExamSessionCompleted,
  resetPastExamSession,
  getPastExamPartSession,
  savePastExamPartProgress,
  markPastExamPartSessionCompleted,
  resetPastExamPartSession,
  type PastExamSession,
  type PastExamSessionAnswer,
} from '@/lib/pastExamSession'
import {
  PAST_EXAM_PART_LABEL,
  PAST_EXAM_PARTS,
  isPastExamPart,
  scorePastExam,
  splitPastExamParts,
  type PastExamPart,
  type PastExamScope,
  type PastExamScore,
} from '@/lib/pastExamParts'
import {
  getPastExamSubjectSession,
  savePastExamSubjectProgress,
  markPastExamSubjectSessionCompleted,
  resetPastExamSubjectSession,
  resolveSubjectSession,
} from '@/lib/pastExamSubjectSession'
import { trackSessionOnceKeyed } from '@/lib/analytics'
import { getAcceptedAnswerIndexes, isPastExamAnswerCorrect, formatAcceptedAnswers } from '@/lib/pastExamAnswers'
import { PAST_EXAM_CHOICE_LABELS } from '@/lib/choiceLabels'
import {
  answeredCount,
  answeredResults,
  canFinish,
  canGoNext,
  canGoPrev,
  createPracticeNav,
  firstUnanswered,
  goNext,
  goPrev,
  goTo,
  isAnswered,
  recordAnswer,
  selectDraft,
  shownChoice,
  type PracticeNav,
} from '@/lib/practiceNav'

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
  /** 午前・午後の区分（年度別演習だけで使う。src/lib/pastExamParts.ts） */
  part?: PastExamPart
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

/** 年度別・科目別のセッションに共通する部分（回答済み設問と正誤。出題順に並べたもの） */
type SessionView = {
  /** selectedIndex は選んだ選択肢（これより前の保存データには無い） */
  answers: { questionId: string; correct: boolean; selectedIndex?: number }[]
  /** 科目別だけ：再開に使う出題順（questionId）。年度別は問題番号順のため持たない */
  order?: string[]
}

type SessionCheck = {
  /** 進行中（未完走）で、先頭からの連続一致が取れた場合のみ設定 */
  resumable: SessionView | null
  /** 完走済みで、現在の設問セットと完全一致する場合のみ設定 */
  completedSession: SessionView | null
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

/* ── 年度別演習の範囲（午前・午後・全問）ごとの途中経過の保存先 ──
   全問＝従来の shinkyuu_pastexam_session_v1、午前・午後＝shinkyuu_pastexam_part_session_v1（別キー）。
   Runner からはどちらも同じ形で扱う。 */
type ScopeStore = {
  get: () => PastExamSession | null
  save: (a: PastExamSessionAnswer) => void
  mark: () => void
  reset: () => void
}

function scopeStore(round: number, scope: PastExamScope): ScopeStore {
  if (scope === 'all') {
    return {
      get: () => getPastExamSession(round),
      save: (a) => savePastExamProgress(round, a),
      mark: () => markPastExamSessionCompleted(round),
      reset: () => resetPastExamSession(round),
    }
  }
  return {
    get: () => getPastExamPartSession(round, scope),
    save: (a) => savePastExamPartProgress(round, scope, a),
    mark: () => markPastExamPartSessionCompleted(round, scope),
    reset: () => resetPastExamPartSession(round, scope),
  }
}

/** 選んでいる範囲を URL（?part=）に反映する。履歴は増やさない（「← 戻る」の動きを変えない） */
function replaceUrlPart(sc: PastExamScope | null) {
  const params = new URLSearchParams(window.location.search)
  if (sc) params.set('part', sc)
  else params.delete('part')
  const qs = params.toString()
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
}

/** 計測の重複防止キー。全問は従来どおり回の番号だけ（既存の計測と同じ） */
function scopeAnalyticsKey(round: number, scope: PastExamScope): string {
  return scope === 'all' ? String(round) : `${round}-${scope}`
}

/** 年度別の保存済みセッションが、いまの設問（問題番号順）に対して使えるかを判定する（従来の判定と同じ規則） */
function checkRoundSession(s: PastExamSession | null, qs: PastExamQuestionView[]): SessionCheck {
  if (!s) return EMPTY_SESSION_CHECK
  const total = qs.length
  const sorted = [...s.answers].sort((a, b) => a.questionNumber - b.questionNumber)
  if (s.completed) {
    const validFull = sorted.length === total && sorted.every((a, i) => qs[i]?.id === a.questionId)
    return validFull ? { resumable: null, completedSession: { ...s, answers: sorted } } : EMPTY_SESSION_CHECK
  }
  if (sorted.length === 0 || sorted.length > total) return EMPTY_SESSION_CHECK
  const isContiguousPrefix = sorted.every((a, i) => qs[i]?.id === a.questionId)
  if (!isContiguousPrefix) return EMPTY_SESSION_CHECK
  // 最終問に回答したあと「結果を見る」を押さずに閉じた場合は、全問回答済みとして完了扱いにする
  // （ここでは保存し直さない。復元経路からは書き込まない方針を維持する）
  if (sorted.length === total) return { resumable: null, completedSession: { ...s, answers: sorted } }
  return { resumable: { ...s, answers: sorted }, completedSession: null }
}

/** 範囲選択画面に出す、範囲ごとの進み具合 */
type ScopeStatus =
  | { state: 'none' }
  | { state: 'in-progress'; answered: number; nextNumber: number }
  | { state: 'completed'; score: PastExamScore; answers: SessionView['answers'] }

function scopeStatusOf(check: SessionCheck, qs: PastExamQuestionView[]): ScopeStatus {
  if (check.completedSession) {
    const byId = new Map(check.completedSession.answers.map((a) => [a.questionId, a.correct]))
    return { state: 'completed', score: scorePastExam(qs.map((q) => byId.get(q.id))), answers: check.completedSession.answers }
  }
  if (check.resumable) {
    const n = check.resumable.answers.length
    return { state: 'in-progress', answered: n, nextNumber: qs[n]?.questionNumber ?? 0 }
  }
  return { state: 'none' }
}

function scopeRangeLabel(qs: PastExamQuestionView[]): string {
  if (qs.length === 0) return ''
  return `問${qs[0].questionNumber}〜${qs[qs.length - 1].questionNumber}`
}

/** 正解・不正解・未回答の数と、正答率の分母の説明 */
function ScoreCounts({ score }: { score: PastExamScore }) {
  const cell = 'rounded-xl bg-gray-50 px-2 py-2.5'
  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center" data-testid="score-counts">
        <div className={cell}>
          <p className="text-[11px] font-semibold text-gray-500">正解</p>
          <p className="mt-0.5 text-lg font-black text-green-700">{score.correct}<span className="text-xs font-bold">問</span></p>
        </div>
        <div className={cell}>
          <p className="text-[11px] font-semibold text-gray-500">不正解</p>
          <p className="mt-0.5 text-lg font-black text-red-600">{score.wrong}<span className="text-xs font-bold">問</span></p>
        </div>
        <div className={cell}>
          <p className="text-[11px] font-semibold text-gray-500">未回答</p>
          <p className="mt-0.5 text-lg font-black text-gray-700">{score.unanswered}<span className="text-xs font-bold">問</span></p>
        </div>
      </div>
      <p className="mt-2 text-left text-[11px] leading-relaxed text-gray-500">
        正答率＝正解数 ÷ 出題数（{score.total}問）。未回答は得点なしとして数えます。
        {score.unanswered > 0 && score.answeredPct !== null && `（回答した${score.answered}問の中での正答率は${score.answeredPct}%）`}
      </p>
    </>
  )
}

type BreakdownRow = { label: string; score: PastExamScore | null; note?: string; emphasis?: boolean }

/** 午前・午後別と全体の成績表 */
function ScoreBreakdown({ rows }: { rows: BreakdownRow[] }) {
  return (
    <div className="mt-5 text-left">
      <p className="text-sm font-bold text-gray-700">午前・午後別の成績</p>
      <table className="mt-2 w-full table-fixed border-collapse text-xs" data-testid="score-breakdown">
        <thead>
          <tr className="border-b border-gray-200 text-[11px] text-gray-500">
            <th className="w-[30%] py-1.5 text-left font-semibold">区分</th>
            <th className="py-1.5 text-right font-semibold">正解</th>
            <th className="py-1.5 text-right font-semibold">不正解</th>
            <th className="py-1.5 text-right font-semibold">未回答</th>
            <th className="py-1.5 text-right font-semibold">正答率</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className={`border-b border-gray-100 ${r.emphasis ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
              <th scope="row" className="py-2 text-left font-semibold">{r.label}</th>
              {r.score ? (
                <>
                  <td className="py-2 text-right">{r.score.correct}</td>
                  <td className="py-2 text-right">{r.score.wrong}</td>
                  <td className="py-2 text-right">{r.score.unanswered}</td>
                  <td className="py-2 text-right">{r.score.pct}%</td>
                </>
              ) : (
                <td colSpan={4} className="py-2 text-right text-[11px] text-gray-400">{r.note}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type AnswerEntry = { q: PastExamQuestionView; selected: number | null; correct: boolean }

/** 間違えた問題（復習結果では出題した全問）の一覧。問題文・自分の回答・正答・既存の解説をそのまま出す */
function AnswerList({
  entries,
  showRound,
  showVerdict,
  noRecordLabel,
}: {
  entries: AnswerEntry[]
  showRound: boolean
  showVerdict: boolean
  noRecordLabel: string
}) {
  return (
    <ol className="mt-3 space-y-3" data-testid="answer-list">
      {entries.map(({ q, selected, correct }) => {
        const accepted = getAcceptedAnswerIndexes(q)
        return (
          <li key={q.id} className="rounded-2xl border border-gray-200 bg-white p-4 text-left" data-qid={q.id}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-gray-900">
                {showRound && `第${q.examRound}回 `}問{q.questionNumber}
              </span>
              {q.subject && (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 font-semibold text-green-700">{subjectLabel(q.subject)}</span>
              )}
              {showVerdict && (
                <span className={`font-bold ${correct ? 'text-green-700' : 'text-red-600'}`}>{correct ? '正解' : '不正解'}</span>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm font-bold leading-relaxed text-gray-900">{q.questionText}</p>
            <ul className="mt-2 space-y-1 text-sm leading-relaxed">
              {q.choices.map((c, i) => {
                const isAns = accepted.includes(i)
                const isSel = selected === i
                return (
                  <li
                    key={i}
                    className={`flex gap-2 rounded-lg px-2 py-1 ${isAns ? 'bg-green-50 text-gray-900' : isSel ? 'bg-red-50 text-gray-900' : 'text-gray-500'}`}
                  >
                    <span className="flex-shrink-0 font-bold">{CIRCLED[i]}</span>
                    <span>
                      {c}
                      {isAns && <span className="ml-1 whitespace-nowrap text-xs font-bold text-green-700">（正答）</span>}
                      {isSel && <span className={`ml-1 whitespace-nowrap text-xs font-bold ${isAns ? 'text-green-700' : 'text-red-600'}`}>（あなたの回答）</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
              <dt className="font-bold text-gray-500">あなたの回答</dt>
              <dd className={selected === null ? 'text-gray-500' : correct ? 'font-bold text-green-700' : 'font-bold text-red-600'}>
                {selected === null ? noRecordLabel : CIRCLED[selected]}
              </dd>
              <dt className="font-bold text-gray-500">正答</dt>
              <dd className="font-bold text-green-700">{formatAcceptedAnswers(q)}</dd>
            </dl>
            <p className="mt-2 text-xs leading-relaxed text-gray-700">
              <span className="font-bold text-gray-500">解説　</span>
              {q.explanation}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

export default function PastExamRunner(props: PastExamRunnerProps) {
  /** null＝theme/subject mode（年度sessionを持たない）。以降 round!==null が「年度session操作を
   *  行ってよいか」の唯一の判定基準になる（mode別の変数は持たず、round自体で判定する）。 */
  const round = props.mode === 'theme' || props.mode === 'subject' ? null : props.round
  /** 科目別演習のときだけ設定。科目別セッション（年度別とは別キー）の読み書きはこれが null でないときに限る */
  const subjectId = props.mode === 'subject' ? props.subjectId : null
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
  /** 出題中の位置・選択・回答・正誤（「前の問題」で戻っても残す。src/lib/practiceNav.ts） */
  const [nav, setNav] = useState<PracticeNav>(() => createPracticeNav(0))
  const [sessionCheck, setSessionCheck] = useState<SessionCheck>(EMPTY_SESSION_CHECK)
  /** 苦手復習モード中か。true の間は questions ではなく reviewQuestions を出題する */
  const [isReview, setIsReview] = useState(false)
  const [reviewQuestions, setReviewQuestions] = useState<PastExamQuestionView[]>([])
  /** 科目別の再開時だけ使う出題順（保存時の順）。null のときは props の順（年度→問題番号） */
  const [resumeOrder, setResumeOrder] = useState<string[] | null>(null)
  /** 科目別の「最初から解く」の確認表示 */
  const [confirmRestart, setConfirmRestart] = useState(false)

  /** 年度別だけ：午前・午後の区分（公式PDFから決めたもの）。確認できない回は null で、従来どおり全問だけ */
  const split = useMemo(() => (round !== null ? splitPastExamParts(props.questions) : null), [round, props.questions])
  /** 年度別の演習範囲。null＝範囲の選択画面（区分のある年度別だけ）。年度横断・区分のない回は常に 'all' */
  const [scope, setScope] = useState<PastExamScope | null>(() => (split ? null : 'all'))
  /** 範囲の選択画面に出す、範囲ごとの進み具合（マウント後に端末の保存内容から読む） */
  const [scopeStatus, setScopeStatus] = useState<Partial<Record<PastExamScope, ScopeStatus>>>({})
  /** true＝最後まで解かずに「ここまでで採点する」で出した結果（途中経過は消さず、続きから解ける） */
  const [interim, setInterim] = useState(false)
  /** 苦手復習に入る前の本体の演習の状態（復習から結果へ戻ったときに元へ戻す。復習で上書きしない） */
  const [mainNav, setMainNav] = useState<PracticeNav | null>(null)

  function questionsFor(sc: PastExamScope | null): PastExamQuestionView[] {
    return sc && sc !== 'all' && split ? split[sc] : props.questions
  }
  const baseQuestions = questionsFor(scope)
  const questions = useMemo(() => {
    if (!resumeOrder) return baseQuestions
    const byId = new Map(baseQuestions.map((q) => [q.id, q]))
    const ordered = resumeOrder.map((id) => byId.get(id)).filter((q): q is PastExamQuestionView => Boolean(q))
    return ordered.length === baseQuestions.length ? ordered : baseQuestions
  }, [baseQuestions, resumeOrder])
  /** 年度別の保存先（範囲選択前は null） */
  const store = round !== null && scope !== null ? scopeStore(round, scope) : null
  const scopeLabel = scope === 'am' || scope === 'pm' ? PAST_EXAM_PART_LABEL[scope] : ''
  const titleLabel = scopeLabel ? `${roundLabel} ${scopeLabel}` : roundLabel
  const total = questions.length
  const activeQuestions = isReview ? reviewQuestions : questions
  const activeTotal = activeQuestions.length
  const index = nav.index
  /** 今の問題に回答済みか（前の問題へ戻ったときも true） */
  const answered = isAnswered(nav, index)
  /** 今の問題で表示する選択（回答済みは回答した選択肢。再開分で記録がなければ null） */
  const selected = shownChoice(nav, index)
  /** 回答済みの正誤（出題順・先頭から連続） */
  const results = answeredResults(nav)

  // 「← 戻る」で離れる前の確認。年度別・科目別の通常演習は途中経過を端末に保存して再開できるので確認しない。
  // テーマ別演習と苦手復習は途中経過を保存しないため、回答を始めていれば確認する（1問ごとの正誤は履歴に保存済み）。
  const unsavedMode = isReview || (round === null && subjectId === null)
  const remainingHere = activeTotal - results.length
  useLeaveGuard(
    unsavedMode && phase === 'question' && (results.length > 0 || selected !== null) && remainingHere > 0
      ? `回答済みの問題の正誤は学習記録に保存されています。ただし、この${isReview ? '復習' : '演習'}の続き（あと${remainingHere}問）からは再開できません。`
      : null,
  )

  /* ── 画面切替時のスクロール（全modeで共通） ──
     「次の問題」等のユーザー操作で画面が切り替わった直後だけ、新しい画面の先頭
     （出題画面＝問題番号・進捗の行、結果画面＝結果カード）が見える位置へ移動する。
     index等を監視して無条件にscrollすると、session復元・初回hydration・
     開始画面表示でも動いてしまうため、操作ハンドラ側で requestScroll() を呼んだ時だけ
     フラグを立てる（予想問題のQuizRunnerと同じ方式）。
     テンポ優先で behavior:'auto'（即時）。移動先はページの上端にする。演習の先頭に
     合わせると、その上にある「← 戻る」（layoutのBackButton。追従しない）が
     sticky Headerの裏に隠れて押せなくなるため。間にあるのはパンくずだけなので、
     上端でも出題画面の先頭は見える。 */
  const screenTopRef = useRef<HTMLDivElement>(null)
  const scrollPending = useRef(false)

  /* ── 選択肢を選んだあと、「回答する」を見える位置へ（Sprint 26） ──
     スマホでは画面下に固定の下部メニュー（BottomNav・高さ約58px＋セーフエリア）がある。
     選択肢4つがちょうど画面に収まる長さの問題では、「回答する」が下部メニューの裏に来て、
     選択肢を押しても回答ボタンが見えなかった。選んだ直後に、ボタンの下端が下部メニューの上に
     出るところまでだけ動かす（scroll-margin-bottom＝下部メニューの高さ分。PCは少しの余白だけ）。
     すでに見えていれば動かさない（block:'nearest'）。 */
  const answerBtnRef = useRef<HTMLButtonElement>(null)
  const revealAnswerPending = useRef(false)
  useEffect(() => {
    if (!revealAnswerPending.current) return
    revealAnswerPending.current = false
    answerBtnRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }, [nav])
  function requestScroll() {
    scrollPending.current = true
  }
  useEffect(() => {
    if (!scrollPending.current) return
    scrollPending.current = false
    if (!screenTopRef.current) return
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'auto' })
  }, [phase, index, isReview, reviewQuestions])

  /** 保存済みの回答済み分をresultsへ復元し、次の未回答問題から再開する（「続きから解く」とHOMEからの直接再開で共用） */
  function resumeFrom(resumable: SessionView, sc: PastExamScope | null = scope) {
    const count = questionsFor(sc).length
    if (round !== null && sc !== null) {
      trackSessionOnceKeyed('pastexam_start', scopeAnalyticsKey(round, sc), { exam_round: round, question_count: count })
    }
    setIsReview(false)
    setReviewQuestions([])
    setInterim(false)
    setMainNav(null)
    setResumeOrder(resumable.order ?? null)
    // 回答済み分は正誤と（保存されていれば）選んだ選択肢を復元し、「前の問題」で戻ったときに表示する
    setNav(
      createPracticeNav(
        count,
        resumable.answers.map((a) => a.correct),
        resumable.answers.map((a) => (typeof a.selectedIndex === 'number' ? a.selectedIndex : null)),
      ),
    )
    requestScroll()
    setPhase('question')
  }

  /** 指定した範囲の保存済みセッションを判定する（範囲選択前・テーマ別は何もない） */
  function computeCheck(sc: PastExamScope | null): SessionCheck {
    if (subjectId !== null) {
      // 科目別：保存時の出題順を、いまの問題データに合わせて並べ直してから判定する
      const s = getPastExamSubjectSession(subjectId)
      const resolved = s ? resolveSubjectSession(s, props.questions.map((q) => q.id)) : null
      if (!resolved) return EMPTY_SESSION_CHECK
      const view = { answers: resolved.answers, order: resolved.order }
      return resolved.status === 'completed' ? { resumable: null, completedSession: view } : { resumable: view, completedSession: null }
    }
    // theme modeでは年度sessionという概念自体が無いため、読み込みを一切行わない
    if (round === null || sc === null) return EMPTY_SESSION_CHECK
    return checkRoundSession(scopeStore(round, sc).get(), questionsFor(sc))
  }

  /** 範囲選択画面の進み具合（午前・午後・全問） */
  function readScopeStatus(): Partial<Record<PastExamScope, ScopeStatus>> {
    if (round === null || !split) return {}
    const out: Partial<Record<PastExamScope, ScopeStatus>> = {}
    for (const sc of [...PAST_EXAM_PARTS, 'all'] as PastExamScope[]) {
      out[sc] = scopeStatusOf(computeCheck(sc), questionsFor(sc))
    }
    return out
  }

  /* 保存済みセッションを確認する。SSR/初回描画では常にnullのまま
     （サーバーとクライアントの初回出力を一致させ、hydration mismatchを避ける）。
     マウント後にのみLocalStorageを読み、
     - 完走済み（completed:true）かつ現在の設問セットと全問一致する → completedSession
       （「前回の結果を見る」「間違えた問題を復習」の元データとして使う）
     - 未完走で、保存済みの回答列が現在の設問順の先頭からの連続一致になっている
       → resumable（「続きから解く」）
     のどちらでもない場合は安全に無視し、通常の開始画面を出す。
     午前・午後のある年度別は、まず範囲の選択画面を出す（?part=am|pm なら、その範囲の開始画面へ）。 */
  useEffect(() => {
    // HOMEの「続きから解く」（?resume=1）から来た場合は、開始画面を挟まず次の未回答問題から始める。
    // 再開できるセッションが無ければ通常の開始画面を出す。URLからは取り除き、共有・ブックマークに残さない
    // ?part=am|pm|all（選んでいる範囲）は再読み込みで同じ範囲に戻れるよう残す。?resume=1 は取り除く
    const params = new URLSearchParams(window.location.search)
    const wantResume = params.has('resume')
    const partParam = params.get('part')
    if (wantResume) {
      params.delete('resume')
      const qs = params.toString()
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
    }
    let initialScope = scope
    if (round !== null && split) {
      // ?part=am|pm|all はその範囲の開始画面。?resume=1 だけ（従来のHOMEのリンク）は全問の続き
      if (isPastExamPart(partParam) || partParam === 'all') initialScope = partParam
      else if (wantResume) initialScope = 'all'
      if (initialScope !== scope) setScope(initialScope)
      if (initialScope !== null && partParam !== initialScope) replaceUrlPart(initialScope)
      if (initialScope === null) setScopeStatus(readScopeStatus())
    }
    const check = computeCheck(initialScope)
    if (wantResume && check.resumable) {
      resumeFrom(check.resumable, initialScope)
      return
    }
    setSessionCheck(check)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, subjectId])

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
    if (round !== null && scope !== null && store) {
      store.reset()
      trackSessionOnceKeyed('pastexam_start', scopeAnalyticsKey(round, scope), { exam_round: round, question_count: total })
    }
    if (subjectId !== null) resetPastExamSubjectSession(subjectId)
    setResumeOrder(null)
    setNav(createPracticeNav(total))
    setSessionCheck(EMPTY_SESSION_CHECK)
    setIsReview(false)
    setReviewQuestions([])
    setInterim(false)
    setMainNav(null)
    requestScroll()
    setPhase('question')
  }

  /** 範囲の選択画面で「午前の問題を解く」等を選んだとき：その範囲の開始画面へ（記録は消さない） */
  function handleChooseScope(sc: PastExamScope) {
    replaceUrlPart(sc)
    setScope(sc)
    setSessionCheck(computeCheck(sc))
    setResumeOrder(null)
    setConfirmRestart(false)
    setIsReview(false)
    setReviewQuestions([])
    setInterim(false)
    setMainNav(null)
    requestScroll()
    setPhase('start')
  }

  /** 範囲の選択画面へ戻る（途中経過は保存済みなので消えない） */
  function handleBackToScopes() {
    replaceUrlPart(null)
    setScope(null)
    setScopeStatus(readScopeStatus())
    setSessionCheck(EMPTY_SESSION_CHECK)
    setIsReview(false)
    setReviewQuestions([])
    setInterim(false)
    setMainNav(null)
    requestScroll()
    setPhase('start')
  }

  /** 「続きから解く」 */
  function handleResume() {
    if (sessionCheck.resumable) resumeFrom(sessionCheck.resumable)
  }

  /** 「最初から解く」：この年度（科目別ではこの科目）の保存セッションのみ削除し1問目から開始（回答履歴historyは削除しない） */
  function handleRestart() {
    if (round !== null && scope !== null && store) {
      store.reset()
      trackSessionOnceKeyed('pastexam_start', scopeAnalyticsKey(round, scope), { exam_round: round, question_count: total })
    }
    if (subjectId !== null) resetPastExamSubjectSession(subjectId)
    setResumeOrder(null)
    setConfirmRestart(false)
    setSessionCheck(EMPTY_SESSION_CHECK)
    setIsReview(false)
    setReviewQuestions([])
    setInterim(false)
    setMainNav(null)
    setNav(createPracticeNav(total))
    requestScroll()
    setPhase('question')
  }

  /** 「前回の結果を見る」：保存済みの完走セッションをそのまま結果画面に表示する */
  function handleViewLastResult() {
    if (!sessionCheck.completedSession) return
    setIsReview(false)
    setInterim(false)
    requestScroll()
    setPhase('result')
  }

  /** 「間違えた○問を復習」：渡された問題だけを元の問題番号順に出題するモードへ入る */
  function handleStartReview(wrongQuestions: PastExamQuestionView[]) {
    if (wrongQuestions.length === 0) return
    // 本体の演習の状態を取っておく（復習の回答で上書きしない。復習中の「もう一度復習」では取り直さない）
    if (!isReview) setMainNav(nav)
    setReviewQuestions(wrongQuestions)
    setIsReview(true)
    setNav(createPracticeNav(wrongQuestions.length))
    requestScroll()
    setPhase('question')
  }

  /** 復習結果画面から「第○回の結果へ」：完走セッションの結果画面に戻る（復習結果はどこにも保存しない） */
  function handleBackToResult() {
    setIsReview(false)
    if (mainNav) setNav(mainNav)
    requestScroll()
    setPhase('result')
  }

  function handleAnswer() {
    const q = activeQuestions[index]
    if (selected === null || answered) return
    const isCorrect = isPastExamAnswerCorrect(q, selected)
    setNav(recordAnswer(nav, isCorrect))
    // 実際に回答した事実は、通常演習・苦手復習・テーマ演習のいずれでも履歴に残す。
    // examRoundは必ず設問自身の値を使う（round propではない。テーマ横断演習では
    // round propが存在しない／一致しないことがあるため）。
    recordPastExamAttempt({ questionId: q.id, examRound: q.examRound, correct: isCorrect })
    // 年度sessionへの保存は「通常演習（苦手復習でない）かつ round mode」の時のみ。
    // theme modeではround自体が存在しないため、年度sessionには一切触れない。
    if (!isReview && store) {
      store.save({
        questionId: q.id,
        questionNumber: q.questionNumber,
        correct: isCorrect,
        selectedIndex: selected,
      })
    }
    // 科目別は科目ごとの別キーに保存する（年度別のセッションには触れない）
    if (!isReview && subjectId !== null) {
      savePastExamSubjectProgress(subjectId, questions.map((x) => x.id), {
        questionId: q.id,
        correct: isCorrect,
        selectedIndex: selected,
      })
    }
  }

  /** 「← 前の問題」：回答済みの問題を、回答・正誤・解説ごと表示し直す（回答の変更はできない） */
  function handlePrev() {
    if (!canGoPrev(nav)) return
    requestScroll()
    setNav(goPrev(nav))
  }

  function handleNext() {
    // 未回答の問題を飛ばして先へは進めない（回答済みの範囲内でだけ移動できる）
    if (!canGoNext(nav) && !canFinish(nav)) return
    // 次の問題・結果画面のどちらへ進む場合も、切替後の画面先頭へ移動する
    requestScroll()
    if (canFinish(nav)) {
      if (isReview) {
        // 苦手復習の完走はセッションに保存しない（元の完走結果とは独立）
        setPhase('result')
        return
      }
      // 年度session・analyticsの完走記録は round mode のみ。theme/subject modeでは
      // どの回の年度sessionもcompletedにしてはいけないため、ここには触れない。
      if (round !== null && scope !== null && store) {
        trackSessionOnceKeyed('pastexam_complete', scopeAnalyticsKey(round, scope), {
          exam_round: round,
          correct: results.filter(Boolean).length,
          total: results.length,
        })
        store.mark()
        setSessionCheck({ resumable: null, completedSession: store.get() })
      }
      setInterim(false)
      if (subjectId !== null) markPastExamSubjectSessionCompleted(subjectId)
      setPhase('result')
      return
    }
    setNav(goNext(nav))
  }

  /** 「ここまでで採点する」（年度別だけ）：最後まで解かずに、回答済みの分と未回答の数で結果を出す。
   *  途中経過はそのまま残すので、結果画面の「続きから解く」や、あとで開いたときに続きから再開できる */
  function handleInterimFinish() {
    if (isReview || !store || answeredCount(nav) === 0) return
    setInterim(true)
    requestScroll()
    setPhase('result')
  }

  /** 途中採点の結果から、次の未回答の問題へ戻る */
  function handleContinueFromInterim() {
    setInterim(false)
    setNav(goTo(nav, Math.min(firstUnanswered(nav), total - 1)))
    requestScroll()
    setPhase('question')
  }

  /** 「もう一度{total}問解く」：この範囲のセッションを削除し、新しいセッションとして最初の問題からやり直す */
  function handleRetry() {
    if (store) store.reset()
    if (subjectId !== null) resetPastExamSubjectSession(subjectId)
    setResumeOrder(null)
    setSessionCheck(EMPTY_SESSION_CHECK)
    setIsReview(false)
    setReviewQuestions([])
    setInterim(false)
    setMainNav(null)
    setNav(createPracticeNav(total))
    requestScroll()
    setPhase('start')
  }

  if (phase === 'start' && round !== null && split && scope === null) {
    /* ── 範囲の選択画面（午前・午後・全問）。年度別で区分が確認できた回だけ ── */
    const options: { sc: PastExamScope; label: string; sub: string }[] = [
      ...PAST_EXAM_PARTS.map((p) => ({
        sc: p as PastExamScope,
        label: `${PAST_EXAM_PART_LABEL[p]}の問題を解く`,
        sub: `${scopeRangeLabel(split[p])}・${split[p].length}問`,
      })),
      { sc: 'all', label: `全${props.questions.length}問を解く`, sub: `${scopeRangeLabel(props.questions)}・午前と午後を通して` },
    ]
    const am = scopeStatus.am
    const pm = scopeStatus.pm
    const both =
      am?.state === 'completed' && pm?.state === 'completed'
        ? scorePastExam([
            ...split.am.map((q) => am.answers.find((a) => a.questionId === q.id)?.correct),
            ...split.pm.map((q) => pm.answers.find((a) => a.questionId === q.id)?.correct),
          ])
        : null
    return (
      <div ref={screenTopRef} className="mx-auto max-w-md px-4 py-10 text-center">
        <h1 className="text-xl font-bold text-gray-900">{roundLabel} 過去問</h1>
        <p className="mt-2 text-sm text-gray-500">収録 {props.questions.length}問（午前 {split.am.length}問・午後 {split.pm.length}問）</p>
        <p className="mx-auto mt-4 max-w-xs text-left text-xs leading-relaxed text-gray-600">
          本番と同じく午前・午後に分けて解けます。1問ずつ正解と解説を確認でき、途中でやめても続きから再開できます（午前・午後・全問の進み具合は別々に、この端末に保存）。
        </p>
        <div className="mt-6 space-y-2.5">
          {options.map((o, i) => {
            const st = scopeStatus[o.sc]
            return (
              <button
                key={o.sc}
                type="button"
                onClick={() => handleChooseScope(o.sc)}
                className={`block w-full rounded-xl px-5 py-3.5 text-left ${
                  i < 2
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'border border-gray-200 bg-white text-gray-800 hover:border-green-300'
                }`}
              >
                <span className="block text-base font-bold">{o.label}</span>
                <span className={`mt-0.5 block text-xs ${i < 2 ? 'text-green-50' : 'text-gray-500'}`}>
                  {o.sub}
                  {st?.state === 'in-progress' && `｜途中・${st.answered}問回答済み（次は問${st.nextNumber}）`}
                  {st?.state === 'completed' && `｜完了・${st.score.correct} / ${st.score.total}問正解（${st.score.pct}%）`}
                </span>
              </button>
            )
          })}
        </div>
        {both && (
          <p className="mt-4 rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700" data-testid="both-parts-score">
            午前＋午後の合計　{both.correct} / {both.total}問正解（正答率 {both.pct}%）
          </p>
        )}
      </div>
    )
  }

  if (phase === 'start') {
    const { resumable, completedSession } = sessionCheck
    // 開始画面の見出し。科目別・テーマ別は「科目別過去問」などの区分と名前、年度別は「第○回 過去問」（午前・午後は「第○回 午前 過去問」）
    const startHeading = crossInfo ? (
      <>
        <p className="text-sm font-semibold text-green-700">{crossInfo.label}</p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">{crossInfo.name}の過去問</h1>
      </>
    ) : (
      <>
        {split && (
          <button
            type="button"
            onClick={handleBackToScopes}
            className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-green-700 hover:underline"
          >
            ← 午前・午後の選択へ
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">{titleLabel} 過去問</h1>
      </>
    )
    const startSubtitle = crossInfo
      ? `${crossRangeLabel(questions)}・全${total}問`
      : scopeLabel
        ? `${scopeRangeLabel(questions)}・${total}問`
        : `収録 ${total}問`

    if (resumable) {
      const answeredCount = resumable.answers.length
      return (
        <div ref={screenTopRef} className="mx-auto max-w-md px-4 py-10 text-center">
          {startHeading}
          <p className="mt-2 text-sm text-gray-500">{startSubtitle}</p>
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
          {/* 科目別は問題数が多く途中記録を失う影響が大きいため、消す前に確認する（年度別は従来どおり） */}
          {subjectId !== null && confirmRestart ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left" role="alert">
              <p className="text-sm font-bold text-gray-900">{crossInfo?.name}の途中の記録（{answeredCount}問）を消して、1問目から解きますか？</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                消えるのはこの科目の「続きから」の記録だけです。学習記録（解答履歴）や、ほかの科目・年度別の途中の記録は残ります。
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRestart(false)}
                  className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-600"
                >
                  やめる
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="min-h-11 flex-1 rounded-xl bg-gray-900 px-3 text-sm font-bold text-white"
                >
                  消して最初から
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={subjectId !== null ? () => setConfirmRestart(true) : handleRestart}
              className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-600 hover:border-green-300"
            >
              最初から解く
            </button>
          )}
        </div>
      )
    }

    if (completedSession) {
      const lastScore = completedSession.answers.filter((a) => a.correct).length
      return (
        <div ref={screenTopRef} className="mx-auto max-w-md px-4 py-10 text-center">
          {startHeading}
          <p className="mt-2 text-sm text-gray-500">{startSubtitle}</p>
          <p className="mt-3 text-sm font-semibold text-gray-600">
            前回 {lastScore} / {total}問正解
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 text-base font-bold text-white hover:bg-green-700"
          >
            {subjectId !== null ? 'もう一度1問目から解く' : '過去問を解く'}
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
      <div ref={screenTopRef} className="mx-auto max-w-md px-4 py-10 text-center">
        {startHeading}
        <p className="mt-2 text-sm text-gray-500">{startSubtitle}</p>
        {/* 初回の開始画面だけに出す。問題数の多さで身構えないよう、進め方を短く伝える */}
        <p className="mx-auto mt-4 max-w-xs text-left text-xs leading-relaxed text-gray-600">
          1問ずつ解いて、そのつど正解と解説を確認できます。
          {(round !== null || subjectId !== null) && '途中でやめても、次に開いたときに続きから再開できます（この端末に保存）。'}
        </p>
        <button
          type="button"
          onClick={handleStart}
          className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 text-base font-bold text-white hover:bg-green-700"
        >
          {/* 記録がない回はQ1から始まることを、ボタン名で伝える */}
          {crossInfo ? '演習を始める' : `問${questions[0].questionNumber}から解く`}
        </button>
      </div>
    )
  }

  if (phase === 'result') {
    /** 一覧を開くボタン（<details> を使い、状態を持たない） */
    const listSummaryCls =
      'flex min-h-11 cursor-pointer list-none items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:border-green-300 [&::-webkit-details-marker]:hidden'

    if (isReview) {
      const reviewScore = scorePastExam(activeQuestions.map((_, i) => results[i]))
      const score = reviewScore.correct
      const reviewTotal = activeTotal
      const pct = reviewScore.pct
      const stillWrong = activeQuestions
        .filter((_, i) => !results[i])
        .sort(byRoundThenNumber)
      // 復習で選んだ回答と正誤（この画面だけの表示。どこにも保存しない＝元の結果は上書きしない）
      const reviewEntries: AnswerEntry[] = activeQuestions.map((q, i) => ({
        q,
        selected: nav.choices[i] ?? null,
        correct: results[i] === true,
      }))
      return (
        <div ref={screenTopRef} className="mx-auto max-w-md px-4 py-8">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <h1 className="text-base font-bold text-gray-900">苦手復習 完了</h1>
            <p className="mt-3 text-4xl font-black text-gray-900">
              {score}
              <span className="text-xl text-gray-400"> / {reviewTotal}問 正解</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">正答率 {pct}%</p>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
              復習の結果はこの画面だけの表示です。{crossInfo ? '' : `${titleLabel}の`}元の結果は変わりません。
            </p>

            {stillWrong.length > 0 && (
              <div className="mt-5 text-left">
                <p className="text-sm font-bold text-gray-700">まだ間違えた問題　{stillWrong.length}問</p>
                <WrongQuestionChips questions={stillWrong} showRound={crossInfo !== null} />
              </div>
            )}

            <details className="mt-5 text-left">
              <summary className={listSummaryCls}>復習した{reviewTotal}問の回答と解説を見る</summary>
              <AnswerList entries={reviewEntries} showRound={crossInfo !== null} showVerdict noRecordLabel="記録なし" />
            </details>

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
                {crossInfo ? resultBackLabel : `${titleLabel}の結果へ`}
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
    /* 結果の元データ：完走して保存済みの結果（前回の結果を含む）があればそれ、
       途中採点・年度横断演習では画面上の回答（nav）。questionId ごとの正誤と選んだ選択肢 */
    type Answered = { correct: boolean; selectedIndex: number | null }
    const answerMap = new Map<string, Answered>()
    if (!interim && completedSession) {
      for (const a of completedSession.answers) {
        answerMap.set(a.questionId, { correct: a.correct, selectedIndex: typeof a.selectedIndex === 'number' ? a.selectedIndex : null })
      }
    } else {
      questions.forEach((q, i) => {
        const r = nav.results[i]
        if (r === true || r === false) answerMap.set(q.id, { correct: r, selectedIndex: nav.choices[i] ?? null })
      })
    }
    const scoreOf = (qs: PastExamQuestionView[]) => scorePastExam(qs.map((q) => answerMap.get(q.id)?.correct))
    const overall = scoreOf(questions)
    const score = overall.correct
    const pct = overall.pct
    const wrongQuestions = questions.filter((q) => answerMap.get(q.id)?.correct === false).sort(byRoundThenNumber)
    const wrongEntries: AnswerEntry[] = wrongQuestions.map((q) => ({
      q,
      selected: answerMap.get(q.id)?.selectedIndex ?? null,
      correct: false,
    }))

    /* 午前・午後別の成績（区分のある年度別だけ） */
    let breakdown: BreakdownRow[] | null = null
    if (round !== null && split && scope !== null) {
      if (scope === 'all') {
        breakdown = [
          { label: '午前', score: scoreOf(split.am) },
          { label: '午後', score: scoreOf(split.pm) },
          { label: '全体', score: overall, emphasis: true },
        ]
      } else {
        // もう一方の区分は、保存済みの結果（全問回答済みのもの）があれば並べ、両方そろえば合計も出す
        const other: PastExamPart = scope === 'am' ? 'pm' : 'am'
        const otherCheck = computeCheck(other)
        const otherAnswers = otherCheck.completedSession?.answers ?? null
        const otherCorrect = (q: PastExamQuestionView) => otherAnswers?.find((a) => a.questionId === q.id)?.correct
        const otherScore = otherAnswers ? scorePastExam(split[other].map(otherCorrect)) : null
        const otherNote = otherCheck.resumable
          ? `途中（${otherCheck.resumable.answers.length} / ${split[other].length}問）`
          : 'まだ解いていません'
        const rowOf = (p: PastExamPart): BreakdownRow =>
          p === scope
            ? { label: PAST_EXAM_PART_LABEL[p], score: overall }
            : { label: PAST_EXAM_PART_LABEL[p], score: otherScore, note: otherNote }
        const combined =
          otherScore && overall.unanswered === 0
            ? scorePastExam(
                PAST_EXAM_PARTS.flatMap((p) =>
                  p === scope ? split[p].map((q) => answerMap.get(q.id)?.correct) : split[p].map(otherCorrect),
                ),
              )
            : null
        breakdown = [
          rowOf('am'),
          rowOf('pm'),
          { label: '全体', score: combined, note: '午前・午後とも全問解くと表示', emphasis: true },
        ]
      }
    }

    const nextNumber = interim ? questions[Math.min(firstUnanswered(nav), total - 1)]?.questionNumber : null

    return (
      <div ref={screenTopRef} className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          {crossInfo ? (
            <>
              <p className="text-xs font-semibold text-green-700">{crossInfo.name}</p>
              <h1 className="mt-0.5 text-base font-bold text-gray-900">{crossInfo.label}</h1>
            </>
          ) : (
            <h1 className="text-base font-bold text-gray-900">{titleLabel} 過去問</h1>
          )}
          {interim && (
            <p className="mt-1 text-xs font-bold text-amber-700">途中までの採点（{overall.answered} / {total}問 回答）</p>
          )}
          <p className="mt-3 text-4xl font-black text-gray-900">
            {score}
            <span className="text-xl text-gray-400"> / {total}問 正解</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">正答率 {pct}%</p>
          {round !== null && <ScoreCounts score={overall} />}
          {breakdown && <ScoreBreakdown rows={breakdown} />}

          {wrongQuestions.length === 0 ? (
            overall.unanswered === 0 ? (
              <p className="mt-5 text-sm font-bold text-green-700">全問正解</p>
            ) : (
              <p className="mt-5 text-sm font-bold text-gray-600">ここまでの回答に間違いはありません</p>
            )
          ) : (
            <div className="mt-5 text-left">
              <p className="text-sm font-bold text-gray-700">間違えた問題　{wrongQuestions.length}問</p>
              <WrongQuestionChips questions={wrongQuestions} showRound={crossInfo !== null} />
              <details className="mt-3">
                <summary className={listSummaryCls}>間違えた{wrongQuestions.length}問の問題と解説を見る</summary>
                <AnswerList
                  entries={wrongEntries}
                  showRound={crossInfo !== null}
                  showVerdict={false}
                  noRecordLabel="記録なし（選んだ選択肢を保存する前の回答）"
                />
              </details>
            </div>
          )}

          <div className="mt-6 space-y-2.5">
            {interim && nextNumber && (
              <button
                type="button"
                onClick={handleContinueFromInterim}
                className="block w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-700"
              >
                続きから解く（問{nextNumber}）
              </button>
            )}
            {wrongQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => handleStartReview(wrongQuestions)}
                className={`block w-full rounded-xl px-5 py-3.5 text-sm font-bold ${
                  interim
                    ? 'border border-gray-200 bg-white text-gray-700 hover:border-green-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                間違えた{wrongQuestions.length}問を復習
              </button>
            )}
            {!interim && (
              <button
                type="button"
                onClick={handleRetry}
                className="block w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
              >
                もう一度{total}問解く
              </button>
            )}
            {split && round !== null && (
              <button
                type="button"
                onClick={handleBackToScopes}
                className="block w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
              >
                午前・午後の選択へ
              </button>
            )}
            <Link
              href={backLink.href}
              className="block rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
            >
              {backLink.label}
            </Link>
          </div>
        </div>
        {/* 関連教材の案内は、科目別演習の結果カードの下だけ（出題中・苦手復習の結果には出さない） */}
        {props.mode === 'subject' && <PastExamResultMaterialCard subjectId={props.subjectId} />}
      </div>
    )
  }

  /* ── 出題画面（1問1画面。通常演習・苦手復習の両方でこのブロックを共用する） ── */
  const q = activeQuestions[index]
  const acceptedIndexes = getAcceptedAnswerIndexes(q)
  // 正誤は回答時に記録した値を使う（再開分で選んだ選択肢の記録がない問題も正しく出せる）
  const correct = answered && nav.results[index] === true
  /** 途中再開した回答済みの問題で、選んだ選択肢が保存されていない（この機能より前の保存データ） */
  const choiceUnknown = answered && selected === null
  const tName = themeName(q.themeId)

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      {/* 画面切替後のスクロールの対象（移動先はページ上端） */}
      <div ref={screenTopRef} className="mb-4">
        {crossInfo && <p className="mb-1 text-xs font-semibold text-green-700">{crossInfo.name}</p>}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700">
            {isReview && '苦手復習　'}{scopeLabel && `${scopeLabel}　`}第{q.examRound}回　問{q.questionNumber}
          </span>
          <span>{index + 1} / {activeTotal}問</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-green-500 transition-all"
            style={{ width: `${(answeredCount(nav) / activeTotal) * 100}%` }}
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
              onClick={() => {
                revealAnswerPending.current = true
                setNav(selectDraft(nav, i))
              }}
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
          ref={answerBtnRef}
          type="button"
          onClick={handleAnswer}
          disabled={selected === null}
          className="mt-5 w-full scroll-mb-[calc(env(safe-area-inset-bottom)+4.5rem)] sm:scroll-mb-4 rounded-xl bg-green-600 px-5 py-4 text-base font-bold text-white transition-colors hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400"
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
            {choiceUnknown && (
              <p className="mt-1 text-xs text-gray-500">前回の回答です。選んだ選択肢はこの端末に記録されていません。</p>
            )}
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
        </div>
      )}

      {/* ── 前後の移動（回答済みの範囲内だけ。未回答の問題を飛ばして先へは進めない） ── */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canGoPrev(nav)}
          className="min-h-12 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:border-gray-100 disabled:text-gray-300"
        >
          ← 前の問題
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!answered}
          className="min-h-12 rounded-xl bg-gray-900 px-3 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300"
        >
          {index + 1 >= activeTotal ? '結果を見る' : '次の問題 →'}
        </button>
      </div>
      {!answered && <p className="mt-2 text-center text-xs text-gray-400">回答すると次の問題へ進めます</p>}
      {/* 年度別だけ：最後まで解かずに採点する（未回答は得点なし。途中経過は消えず、続きから解ける） */}
      {!isReview && store && answeredCount(nav) > 0 && answeredCount(nav) < activeTotal && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleInterimFinish}
            className="min-h-11 rounded-xl px-4 text-sm font-semibold text-gray-500 underline hover:text-gray-700"
          >
            ここまでで採点する（未回答{activeTotal - answeredCount(nav)}問）
          </button>
        </div>
      )}
    </div>
  )
}
