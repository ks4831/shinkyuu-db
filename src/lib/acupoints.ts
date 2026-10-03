import { ACUPOINTS, MERIDIANS, type Acupoint, type MeridianId } from '@/data/acupoints'
import { EXAM_ROUNDS } from './examQuestions'
import {
  ACUPOINT_OCCURRENCE_DATA,
  isCountedRole,
  isMasterRef,
  type AcupointEvidence,
  type AcupointRole,
} from './acupointOccurrences'

/** 経穴が登場した過去問1問 */
export type AcupointQuestionRef = {
  questionId: string
  examRound: number
  questionNumber: number
  role: AcupointRole
  evidence: AcupointEvidence
}

export type AcupointStat = Acupoint & {
  /** 出題年度（第29〜34回のうち、この経穴の知識を問う設問があった回。同一回に複数問でも1回） */
  examRounds: number[]
  /** 出題問題数（role が direct / required の設問数。1問1カウント） */
  questionCount: number
  /** 出題扱いの設問（direct / required） */
  questions: AcupointQuestionRef[]
  /** 誤答選択肢としてのみ登場した設問（統計には含めない） */
  distractorQuestions: AcupointQuestionRef[]
}

/**
 * src/data/acupointOccurrences.json（設問単位のレビュー済み判定）から集計する。
 * 定義: docs/acupoint-occurrence-definition.md
 */
function buildStats(): AcupointStat[] {
  const bySlug = new Map<string, { questions: AcupointQuestionRef[]; distractors: AcupointQuestionRef[] }>()
  for (const a of ACUPOINTS) bySlug.set(a.slug, { questions: [], distractors: [] })

  for (const occ of ACUPOINT_OCCURRENCE_DATA.occurrences) {
    for (const ref of occ.acupoints) {
      if (!isMasterRef(ref)) continue
      const entry = bySlug.get(ref.slug)
      if (!entry) continue
      const q: AcupointQuestionRef = {
        questionId: occ.questionId,
        examRound: occ.examRound,
        questionNumber: occ.questionNumber,
        role: ref.role,
        evidence: ref.evidence,
      }
      if (isCountedRole(ref.role)) entry.questions.push(q)
      else if (ref.role === 'distractor') entry.distractors.push(q)
    }
  }

  const byQuestion = (x: AcupointQuestionRef, y: AcupointQuestionRef) =>
    x.examRound - y.examRound || x.questionNumber - y.questionNumber

  return ACUPOINTS.map((a) => {
    const entry = bySlug.get(a.slug)!
    const questions = [...entry.questions].sort(byQuestion)
    return {
      ...a,
      examRounds: [...new Set(questions.map((q) => q.examRound))].sort((x, y) => x - y),
      questionCount: questions.length,
      questions,
      distractorQuestions: [...entry.distractors].sort(byQuestion),
    }
  })
}

let cache: AcupointStat[] | null = null

export function getAcupointStats(): AcupointStat[] {
  if (cache) return cache
  cache = buildStats()
  return cache
}

export function getAcupointStat(slug: string): AcupointStat | undefined {
  return getAcupointStats().find((a) => a.slug === slug)
}

/** 出題年度数 → 出題問題数 → マスタ収録順 */
function byFrequency(a: AcupointStat, b: AcupointStat): number {
  return b.examRounds.length - a.examRounds.length || b.questionCount - a.questionCount
}

/** 頻出経穴ランキング（収録146穴が対象） */
export function getPopularAcupoints(limit = 10): AcupointStat[] {
  return getAcupointStats()
    .filter((a) => a.questionCount > 0)
    .sort(byFrequency)
    .slice(0, limit)
}

/** 第29〜34回で、その経穴の知識を問う設問（direct / required）が0問の経穴 */
export function getUnaskedAcupoints(): AcupointStat[] {
  return getAcupointStats()
    .filter((a) => a.questionCount === 0)
    .sort((a, b) => a.meridian.localeCompare(b.meridian) || a.code.localeCompare(b.code, undefined, { numeric: true }))
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
      .filter((a) => (a.specialPoints ?? []).some((sp) => sp.includes(label)))
      .sort((a, b) => byFrequency(a, b) || a.code.localeCompare(b.code)),
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
