import type { Theme, Importance } from './types'

export function roundToYear(round: number): number {
  // 第29回=2021年, 第30回=2022年, ... (round + 1992)
  return round + 1992
}

export function getDailyThemes(themes: Theme[], count = 10): Theme[] {
  const today = new Date()
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate()
  return [...themes]
    .map((t, i) => ({ t, r: Math.abs(Math.sin(seed * 31 + i * 17)) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, count)
    .map(({ t }) => t)
}

export function getRankingThemes(themes: Theme[], count = 10): Theme[] {
  return [...themes]
    .sort(
      (a, b) =>
        b.count - a.count ||
        importanceOrder(a.importance) - importanceOrder(b.importance)
    )
    .slice(0, count)
}

function importanceOrder(imp: Importance): number {
  return { S: 0, A: 1, B: 2, C: 3 }[imp]
}

export function importanceLabel(imp: Importance): string {
  return { S: '最重要', A: '重要', B: '標準', C: '参考' }[imp]
}

export const importanceColors: Record<Importance, string> = {
  S: 'bg-red-50 text-red-700 border-red-200',
  A: 'bg-orange-50 text-orange-700 border-orange-200',
  B: 'bg-blue-50 text-blue-700 border-blue-200',
  C: 'bg-gray-50 text-gray-600 border-gray-200',
}

export const importanceBg: Record<Importance, string> = {
  S: 'bg-red-600',
  A: 'bg-orange-500',
  B: 'bg-blue-500',
  C: 'bg-gray-400',
}

export function subjectName(subjects: { id: string; name: string }[], id: string): string {
  return subjects.find(s => s.id === id)?.name ?? id
}
