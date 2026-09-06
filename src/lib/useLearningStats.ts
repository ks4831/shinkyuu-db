'use client'

import { useEffect, useState } from 'react'
import { getStats, type LearningStats } from './quizStorage'

const ZERO: LearningStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  accuracy: 0,
  todayCount: 0,
  todayGoal: 10,
  streakDays: 0,
  reviewCount: 0,
  weakCount: 0,
  bySubject: [],
}

/**
 * LocalStorage の学習統計を購読するフック。
 * SSR とハイドレーション不一致を避けるため、初期値は常に ZERO。
 */
export function useLearningStats(): { stats: LearningStats; ready: boolean } {
  const [stats, setStats] = useState<LearningStats>(ZERO)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => setStats(getStats())
    sync()
    setReady(true)
    window.addEventListener('shinkyuu-quiz-change', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('shinkyuu-quiz-change', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  return { stats, ready }
}
