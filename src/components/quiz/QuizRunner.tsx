'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { QuizQuestion } from '@/lib/quiz'
import { subjectLabel } from '@/lib/quiz'
import { recordAttempt, toggleReview, isInReview } from '@/lib/quizStorage'
import DiagramView from './DiagramView'

type PreparedQuestion = QuizQuestion & {
  shownChoices: string[]
  shownCorrect: number
}

function shuffleInPlace<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildSet(
  pool: QuizQuestion[],
  count: number,
  biasToStart: boolean,
): PreparedQuestion[] {
  let chosen: QuizQuestion[]
  if (pool.length <= count) {
    chosen = shuffleInPlace([...pool])
  } else if (biasToStart) {
    // 重要度順に並んだプールの上位 count*2 からランダムに count 問
    chosen = shuffleInPlace(pool.slice(0, Math.min(pool.length, count * 2))).slice(0, count)
  } else {
    chosen = shuffleInPlace([...pool]).slice(0, count)
  }
  return chosen.map((q) => {
    const idx = shuffleInPlace(q.choices.map((_, i) => i))
    return {
      ...q,
      shownChoices: idx.map((i) => q.choices[i]),
      shownCorrect: idx.indexOf(q.correctAnswer),
    }
  })
}

const LETTERS = ['A', 'B', 'C', 'D', 'E']

export default function QuizRunner({
  questions,
  pool,
  count = 10,
  biasToStart = false,
  title,
  reviewHref = '/quiz/weak',
  retryHref,
}: {
  /** 固定の出題リスト（苦手復習など） */
  questions?: QuizQuestion[]
  /** 出題プール（マウント後に count 問を抽選） */
  pool?: QuizQuestion[]
  count?: number
  biasToStart?: boolean
  title: string
  reviewHref?: string
  retryHref?: string
}) {
  // すべての抽選・シャッフルはマウント後（クライアント）で行い、SSR不一致を避ける
  const [prepared, setPrepared] = useState<PreparedQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [inReview, setInReview] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const src = questions ?? pool ?? []
    setPrepared(buildSet(src, questions ? src.length : count, biasToStart))
    // questions/pool は親でメモ化されない場合があるため中身の id で依存を張る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(questions ?? pool ?? []).map((q) => q.id).join(','), count, biasToStart])

  if (prepared === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-gray-400">
        出題を準備中…
      </div>
    )
  }

  const total = prepared.length

  if (total === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-gray-600">出題できる問題がありませんでした。</p>
        <Link href="/quiz" className="mt-4 inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white">
          クイズトップへ
        </Link>
      </div>
    )
  }

  const q = prepared[index]
  const correct = answered && selected === q.shownCorrect

  function handleAnswer() {
    if (selected === null || answered) return
    const isCorrect = selected === q.shownCorrect
    setAnswered(true)
    setInReview(isInReview(q.id))
    setResults((r) => [...r, isCorrect])
    recordAttempt({ qid: q.id, subject: q.subject, correct: isCorrect })
  }

  function handleNext() {
    if (index + 1 >= total) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setAnswered(false)
    setInReview(false)
  }

  function handleReviewToggle() {
    setInReview(toggleReview(q.id))
  }

  /* ── 終了画面 ─────────────────────────────── */
  if (finished) {
    const score = results.filter(Boolean).length
    const pct = Math.round((score / total) * 100)
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-green-600">おつかれさまでした</p>
          <p className="mt-2 text-4xl font-black text-gray-900">
            {score}<span className="text-xl text-gray-400"> / {total}問</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">正答率 {pct}%</p>

          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {results.map((r, i) => (
              <span
                key={i}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  r ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {r ? '○' : '×'}
              </span>
            ))}
          </div>

          <div className="mt-6 space-y-2.5">
            <Link
              href={reviewHref}
              className="block rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-700"
            >
              間違えた問題を復習する
            </Link>
            {retryHref && (
              <Link
                href={retryHref}
                className="block rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
              >
                もう10問解く
              </Link>
            )}
            <Link
              href="/dashboard"
              className="block rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:border-green-300"
            >
              学習の記録を見る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── 出題画面（1問1画面） ──────────────────── */
  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      {/* 進捗 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{title}</span>
          <span>第 {index + 1} / {total} 問</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-green-500 transition-all"
            style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* カテゴリ */}
      <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        {subjectLabel(q.subject)}・{q.theme}
      </span>

      {/* 問題文 */}
      <h1 className="mt-3 text-lg font-bold leading-relaxed text-gray-900">{q.question}</h1>

      {/* 選択肢 */}
      <div className="mt-4 space-y-2.5">
        {q.shownChoices.map((choice, i) => {
          const isSel = selected === i
          const isAns = q.shownCorrect === i
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
              <span
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  answered && isAns
                    ? 'bg-green-600 text-white'
                    : answered && isSel
                      ? 'bg-red-500 text-white'
                      : isSel
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                }`}
              >
                {LETTERS[i]}
              </span>
              <span>{choice}</span>
            </button>
          )
        })}
      </div>

      {/* 回答ボタン */}
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

      {/* 回答後：その場で結果表示（ページ遷移なし） */}
      {answered && (
        <div className="mt-5">
          <div
            className={`rounded-2xl border p-4 ${
              correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <p className={`text-lg font-black ${correct ? 'text-green-700' : 'text-red-600'}`}>
              {correct ? '正解！' : '惜しい！'}
            </p>

            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-bold text-gray-700">正解</dt>
                <dd className="mt-0.5 text-gray-800">
                  {LETTERS[q.shownCorrect]}．{q.shownChoices[q.shownCorrect]}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-gray-700">解説</dt>
                <dd className="mt-0.5 leading-relaxed text-gray-700">{q.explanation}</dd>
              </div>
              <div className="rounded-lg bg-white/70 p-3">
                <dt className="font-bold text-green-700">覚えるポイント</dt>
                <dd className="mt-0.5 leading-relaxed text-gray-700">{q.memoryPoint}</dd>
              </div>
              <div className="rounded-lg bg-white/70 p-3">
                <dt className="font-bold text-amber-700">間違えやすいポイント</dt>
                <dd className="mt-0.5 leading-relaxed text-gray-700">{q.commonMistake}</dd>
              </div>
            </dl>

            {q.imageId && <DiagramView imageId={q.imageId} />}

            {q.relatedAcupoints.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {q.relatedAcupoints.map((slug) => (
                  <Link
                    key={slug}
                    href={`/acupoints/${slug}`}
                    className="rounded-full border border-green-200 bg-white px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-50"
                  >
                    経穴：{slug.toUpperCase()} →
                  </Link>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleReviewToggle}
              className={`mt-4 w-full rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                inReview
                  ? 'border-orange-300 bg-orange-100 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
              }`}
            >
              {inReview ? '★ 復習リストに追加済み' : '☆ 復習に追加'}
            </button>
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
