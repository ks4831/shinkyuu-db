import data from '@/data/acupointOccurrences.json'

/* ──────────────────────────────────────────────────────────────
   経穴出題データ（設問単位のレビュー済み判定）
   - 定義: docs/acupoint-occurrence-definition.md
   - 公式過去問JSON（src/data/pastExams/exam-*.json）とは別管理
   - 経穴統計の正本。CSV の studyPoint や themeId からは推定しない
   ────────────────────────────────────────────────────────────── */

export const ACUPOINT_ROLES = ['direct', 'required', 'distractor', 'ambiguous'] as const
export type AcupointRole = (typeof ACUPOINT_ROLES)[number]

export const ACUPOINT_EVIDENCES = ['named', 'implicit'] as const
export type AcupointEvidence = (typeof ACUPOINT_EVIDENCES)[number]

/** 出題統計に数える role（distractor・ambiguous は数えない） */
export const COUNTED_ROLES: readonly AcupointRole[] = ['direct', 'required']

type RefBase = { role: AcupointRole; evidence: AcupointEvidence }
/** 経穴マスタ（src/data/acupoints.ts）収録穴は slug で参照 */
export type MasterAcupointRef = RefBase & { slug: string }
/** マスタ外の経穴・奇穴は公式表記の名称で参照（outsideMaster に登録必須） */
export type OutsideAcupointRef = RefBase & { name: string }
export type AcupointRef = MasterAcupointRef | OutsideAcupointRef

export type AcupointOccurrence = {
  /** 過去問ID（例: 34-121） */
  questionId: string
  examRound: number
  questionNumber: number
  acupoints: AcupointRef[]
  /** 経穴名と同じ文字列だが経穴として扱わない語（例: 衝脈の別称「血海」） */
  ignoredMentions?: { name: string; reason: string }[]
  note?: string
}

export type AcupointOccurrenceData = {
  schemaVersion: number
  definition: string
  examRounds: number[]
  reviewedAt: string
  outsideMaster: { name: string }[]
  occurrences: AcupointOccurrence[]
}

export const ACUPOINT_OCCURRENCE_DATA = data as AcupointOccurrenceData

export function isMasterRef(ref: AcupointRef): ref is MasterAcupointRef {
  return 'slug' in ref
}

export function isCountedRole(role: AcupointRole): boolean {
  return COUNTED_ROLES.includes(role)
}
