import { ACUPOINTS, MERIDIANS, type Acupoint, type MeridianId } from '@/data/acupoints'
import { loadAllExamQuestions } from './examQuestions'
import { EXAM_ROUNDS } from './examQuestions'

export type AcupointStat = Acupoint & {
  /** 名称が本文に登場した回（第29〜34回） */
  examRounds: number[]
  /** 登場した設問の延べ数 */
  mentions: number
}

/**
 * 過去問CSVの本文（studyPoint / subTheme / officialSmall）を走査し、
 * 各経穴の名称が「どの回で」「何問ぶん」言及されたかを集計する。
 * ※ 公式の設問文ではなく、当サイトが独自に付した学習ポイント欄の文字列を対象とする。
 */
function buildAppearanceMap(): Map<string, { rounds: Set<number>; mentions: number }> {
  const map = new Map<string, { rounds: Set<number>; mentions: number }>()
  for (const a of ACUPOINTS) {
    map.set(a.name, { rounds: new Set(), mentions: 0 })
  }

  // 経穴ごとに「本文で探す語」（正式名称＋別名・異体字）を用意
  const needles = ACUPOINTS.map((a) => ({
    name: a.name,
    terms: [a.name, ...(a.aliases ?? [])],
  }))

  const questions = loadAllExamQuestions()
  for (const q of questions) {
    const haystack = [q.studyPoint, q.subTheme, q.officialSmall, q.normalizedTheme]
      .filter(Boolean)
      .join(' ')
    if (!haystack) continue
    for (const n of needles) {
      if (n.terms.some((t) => haystack.includes(t))) {
        const entry = map.get(n.name)!
        entry.rounds.add(q.examRound)
        entry.mentions += 1
      }
    }
  }
  return map
}

let cache: AcupointStat[] | null = null

export function getAcupointStats(): AcupointStat[] {
  if (cache) return cache
  const map = buildAppearanceMap()
  cache = ACUPOINTS.map((a) => {
    const entry = map.get(a.name)!
    return {
      ...a,
      examRounds: [...entry.rounds].sort((x, y) => x - y),
      mentions: entry.mentions,
    }
  })
  return cache
}

export function getAcupointStat(slug: string): AcupointStat | undefined {
  return getAcupointStats().find((a) => a.slug === slug)
}

/** 言及数の多い順（人気経穴ランキング） */
export function getPopularAcupoints(limit = 10): AcupointStat[] {
  return [...getAcupointStats()]
    .filter((a) => a.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions || b.examRounds.length - a.examRounds.length)
    .slice(0, limit)
}

/** 過去6年で一度も本文に登場しなかった経穴 */
export function getUnaskedAcupoints(): AcupointStat[] {
  return getAcupointStats()
    .filter((a) => a.examRounds.length === 0)
    .sort((a, b) => a.meridian.localeCompare(b.meridian) || a.code.localeCompare(b.code))
}

/** 特定穴カテゴリごとのランキング */
export type SpecialPointGroup = {
  key: string
  label: string
  points: AcupointStat[]
}

const SPECIAL_ORDER = [
  '原穴',
  '絡穴',
  '郄穴',
  '募穴',
  '背部兪穴',
  '下合穴',
  '八会穴',
  '八脈交会穴',
  '四総穴',
  '五兪穴',
]

export function getSpecialPointGroups(): SpecialPointGroup[] {
  const stats = getAcupointStats()
  return SPECIAL_ORDER.map((label) => ({
    key: label,
    label,
    points: stats
      .filter((a) => a.specialPoints.some((sp) => sp.includes(label)))
      .sort((a, b) => b.mentions - a.mentions || a.code.localeCompare(b.code)),
  })).filter((g) => g.points.length > 0)
}

/** 経脈別グルーピング */
export function getAcupointsByMeridian(): { id: MeridianId; name: string; points: AcupointStat[] }[] {
  const stats = getAcupointStats()
  return MERIDIANS.map((m) => ({
    id: m.id,
    name: m.name,
    points: stats
      .filter((a) => a.meridian === m.id)
      .sort((a, b) => parseInt(a.code.replace(/\D/g, '')) - parseInt(b.code.replace(/\D/g, ''))),
  })).filter((g) => g.points.length > 0)
}

export const TOTAL_EXAM_ROUNDS = EXAM_ROUNDS.length
