import data from '@/data/acupointSources.json'
import type { Acupoint } from '@/data/acupoints'

/* ──────────────────────────────────────────────────────────────
   経穴の出典管理（項目ごとの根拠と確認状況）
   - 定義: docs/acupoint-source-schema.md
   - 経穴マスター（src/data/acupoints.ts）とは別ファイルで管理し、マスターの型・画面表示は変えない
   - 日本の資料による確認（JAPAN_VERIFIED）と、WHO による確認（WHO_VERIFIED）は別のもの
   ────────────────────────────────────────────────────────────── */

export const SOURCE_TYPES = [
  'official_exam', // 日本の公式過去問・正答表
  'exam_standard', // 日本の国家試験出題基準
  'textbook', // 日本の標準教科書
  'jp_public', // 日本の公的機関・専門職団体・学術資料
  'international', // WHO などの国際資料
  'cn_standard', // 中国の国家標準・教科書
  'classic', // 古典
] as const
export type SourceType = (typeof SOURCE_TYPES)[number]
export const JAPANESE_SOURCE_TYPES: readonly SourceType[] = ['official_exam', 'exam_standard', 'textbook', 'jp_public']

/** 項目ごとの総合判定 */
export const SUMMARY_STATUSES = [
  'JAPAN_VERIFIED', // 日本の資料が、現在の記述全体を直接裏づける
  'WHO_VERIFIED', // WHO の主位置で記述全体を確認できる（日本の資料では未確認）
  'HISTORICAL_ONLY', // 古典・歴史資料にしか根拠がない
  'SOURCE_NEEDED', // 根拠が足りない（一部だけ確認・推論だけ、を含む）
  'CONFLICT', // 資料と現在の記述が食い違う
  'NOT_APPLICABLE', // 項目に値がない（未設定）
] as const
export type SummaryStatus = (typeof SUMMARY_STATUSES)[number]

/** 出典レコード1件の判定。JAPAN_INFERRED は公式問題からの推論で、JAPAN_VERIFIED には数えない */
export const RECORD_STATUSES = ['JAPAN_VERIFIED', 'JAPAN_INFERRED', 'WHO_VERIFIED', 'HISTORICAL_ONLY', 'CONFLICT'] as const
export type RecordStatus = (typeof RECORD_STATUSES)[number]

/** full＝現在の記述全体／partial＝一部／related＝現在の記述にない情報（裏づけには数えない） */
export const COVERAGES = ['full', 'partial', 'related'] as const
export type Coverage = (typeof COVERAGES)[number]

export const SOURCE_FIELDS = ['name', 'reading', 'location', 'specialPoints'] as const
export type SourceField = (typeof SOURCE_FIELDS)[number]

export type SourceDoc = {
  id: string
  title: string
  sourceType: SourceType
  organization: string
  url: string
  edition: string
  note: string
}

export type AcupointSourceRecord = {
  /** 経穴マスターの slug */
  acupointId: string
  fieldName: SourceField
  /** 確認した記述。specialPoints は分類1つ（ラベルと完全一致） */
  claim: string
  /** 確認した時点の値。マスターの値が変わったらこのレコードは使わない（再確認が必要） */
  currentValue: string
  sourceId: string
  /** 問題ID・ページ番号など（推測で書かない） */
  sourcePage: string
  verifiedAt: string
  verificationStatus: RecordStatus
  coverage: Coverage
  notes: string
}

export type AcupointSourceData = {
  schemaVersion: number
  definition: string
  generatedAt: string
  sources: SourceDoc[]
  records: AcupointSourceRecord[]
}

export const ACUPOINT_SOURCE_DATA = data as AcupointSourceData

const sourceTypeById = new Map(ACUPOINT_SOURCE_DATA.sources.map((s) => [s.id, s.sourceType]))

/** 項目の現在値（specialPoints は分類ごと）。値がなければ undefined */
function currentValues(a: Acupoint, field: SourceField): string[] | undefined {
  if (field === 'specialPoints') return a.specialPoints?.length ? a.specialPoints : undefined
  const v = a[field]
  return v === undefined ? undefined : [v]
}

/**
 * 1つの記述の総合判定。優先順：
 * 日本の資料の CONFLICT → 日本の資料の JAPAN_VERIFIED（full）→ WHO の CONFLICT → WHO_VERIFIED（full）→ HISTORICAL_ONLY → SOURCE_NEEDED
 * 確認時点から値が変わったレコードは使わない。
 */
export function summarizeClaim(acupointId: string, field: SourceField, value: string): SummaryStatus {
  const rs = ACUPOINT_SOURCE_DATA.records.filter(
    (r) => r.acupointId === acupointId && r.fieldName === field && r.claim === value && r.currentValue === value,
  )
  const isJp = (r: AcupointSourceRecord) => JAPANESE_SOURCE_TYPES.includes(sourceTypeById.get(r.sourceId) as SourceType)
  const isIntl = (r: AcupointSourceRecord) => sourceTypeById.get(r.sourceId) === 'international'
  const jp = rs.filter(isJp)
  if (jp.some((r) => r.verificationStatus === 'CONFLICT')) return 'CONFLICT'
  if (jp.some((r) => r.verificationStatus === 'JAPAN_VERIFIED' && r.coverage === 'full')) return 'JAPAN_VERIFIED'
  const intl = rs.filter(isIntl)
  if (intl.some((r) => r.verificationStatus === 'CONFLICT')) return 'CONFLICT'
  if (intl.some((r) => r.verificationStatus === 'WHO_VERIFIED' && r.coverage === 'full')) return 'WHO_VERIFIED'
  if (rs.some((r) => r.verificationStatus === 'HISTORICAL_ONLY')) return 'HISTORICAL_ONLY'
  return 'SOURCE_NEEDED'
}

/** 経穴1穴の項目別判定（specialPoints は分類ごと） */
export type FieldSourceStatus = { field: SourceField; value?: string; status: SummaryStatus }

export function getAcupointSourceStatus(a: Acupoint): FieldSourceStatus[] {
  return SOURCE_FIELDS.flatMap((field): FieldSourceStatus[] => {
    const vals = currentValues(a, field)
    if (!vals) return [{ field, status: 'NOT_APPLICABLE' }]
    return vals.map((value) => ({ field, value, status: summarizeClaim(a.slug, field, value) }))
  })
}
