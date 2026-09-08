'use client'

import QuizRunner from './QuizRunner'
import {
  ALL_QUESTIONS,
  type QuizQuestion,
} from '@/lib/quiz'

type Mode = 'random' | 'frequent' | 'acupoints' | 'subject' | 'theme' | 'standard2026'

/** モードごとに「出題プール」を決める（ランダム性はここに入れない） */
function poolFor(mode: Mode, subjectId?: string, themeId?: string): QuizQuestion[] {
  switch (mode) {
    case 'theme':
      return ALL_QUESTIONS.filter((q) => q.themeId === themeId)
    case 'standard2026':
      return ALL_QUESTIONS.filter((q) => q.standard2026)
    case 'frequent': {
      const w = (q: QuizQuestion) => ({ S: 0, A: 1, B: 2, C: 3 }[q.importance])
      return [...ALL_QUESTIONS].sort((a, b) => w(a) - w(b))
    }
    case 'acupoints':
      return ALL_QUESTIONS.filter(
        (q) => q.subject === 'meridians-acupoints' || q.tags.includes('経穴'),
      )
    case 'subject':
      return ALL_QUESTIONS.filter((q) => q.subject === subjectId)
    case 'random':
    default:
      return ALL_QUESTIONS
  }
}

export default function QuizSession({
  mode,
  subjectId,
  themeId,
  title,
  count = 10,
  retryHref,
  reviewHref,
}: {
  mode: Mode
  subjectId?: string
  themeId?: string
  title: string
  count?: number
  retryHref?: string
  reviewHref?: string
}) {
  // プールは決定的。実際の10問抽選と選択肢シャッフルは QuizRunner がマウント後に行う。
  const pool = poolFor(mode, subjectId, themeId)
  const pickFromStart = mode === 'frequent' // 頻出は重要度順の先頭寄りから選ぶ

  return (
    <QuizRunner
      pool={pool}
      count={count}
      biasToStart={pickFromStart}
      title={title}
      retryHref={retryHref}
      reviewHref={reviewHref}
    />
  )
}
