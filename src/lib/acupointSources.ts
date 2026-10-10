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
  /** 資料に書かれている表記（原文のまま）。省略時は claim と同じ表記。名称の CONFLICT では必須 */
  sourceText?: string
  /** マスターの値を変えたため総合判定から外したレコード（履歴として残す）。変えた日付 */
  supersededAt?: string
  /** 外した理由と後継レコード（台帳の ID など） */
  supersededBy?: string
}

export type AcupointSourceData = {
  schemaVersion: number
  definition: string
  generatedAt: string
  sources: SourceDoc[]
  records: AcupointSourceRecord[]
}

export const ACUPOINT_SOURCE_DATA = data as AcupointSourceData

const sourceTypeById: ReadonlyMap<string, SourceType> = new Map(ACUPOINT_SOURCE_DATA.sources.map((s) => [s.id, s.sourceType]))

/** 項目の現在値（specialPoints は分類ごと）。値がなければ undefined */
function currentValues(a: Acupoint, field: SourceField): string[] | undefined {
  if (field === 'specialPoints') return a.specialPoints?.length ? a.specialPoints : undefined
  const v = a[field]
  return v === undefined ? undefined : [v]
}

/**
 * 1つの記述の総合判定。優先順：
 * 日本の資料の CONFLICT → 日本の資料の JAPAN_VERIFIED（full）→ WHO の CONFLICT → WHO_VERIFIED（full）→ HISTORICAL_ONLY → SOURCE_NEEDED
 * 確認時点から値が変わったレコード・履歴として外したレコード（supersededAt）は使わない。
 */
export function summarizeClaim(acupointId: string, field: SourceField, value: string): SummaryStatus {
  const rs = ACUPOINT_SOURCE_DATA.records.filter(
    (r) => r.acupointId === acupointId && r.fieldName === field && r.claim === value && r.currentValue === value && !r.supersededAt,
  )
  return summarizeRecords(rs, sourceTypeById)
}

/** 同じ記述についてのレコード群を総合判定にまとめる（監査・テストからも使う） */
export function summarizeRecords(rs: AcupointSourceRecord[], typeOf: ReadonlyMap<string, SourceType>): SummaryStatus {
  const isJp = (r: AcupointSourceRecord) => JAPANESE_SOURCE_TYPES.includes(typeOf.get(r.sourceId) as SourceType)
  const isIntl = (r: AcupointSourceRecord) => typeOf.get(r.sourceId) === 'international'
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

/* ──────────────────────────────────────────────────────────────
   経穴詳細ページの「情報の根拠」表示
   - 日本の資料による直接確認だけを「確認」と書く。WHO は WHO と明記し、推論は確認に数えない
   - 教科書のレコードがない項目は「教科書では未照合」と書く（教科書を閲覧していないため）
   ────────────────────────────────────────────────────────────── */

/** 表示用の資料名（短い名前） */
export const SOURCE_SHORT_NAMES: Record<string, string> = {
  'OFFICIAL-29-34': '公式過去問（第29〜34回）',
  'KIJUN-2026': '国家試験出題基準2026',
  'WHO-2008': 'WHO標準経穴部位（2008）',
}
const shortName = (id: string) => SOURCE_SHORT_NAMES[id] ?? ACUPOINT_SOURCE_DATA.sources.find((s) => s.id === id)?.title ?? id

/** 色分けの種類：jp＝日本の資料で確認／intl＝WHOで確認（日本は未確認）／conflict＝資料と表現が違う／pending＝確認待ち */
export type SourceTone = 'jp' | 'intl' | 'conflict' | 'pending'

export type SourceDisplayLine = {
  field: SourceField
  label: string
  /** 一行の判定（例：「国家試験出題基準2026で確認」） */
  verdict: string
  tone: SourceTone
  /** 補足（教科書の照合状況など） */
  note?: string
}

export type SourceDisplayRecord = {
  field: SourceField
  fieldLabel: string
  claim: string
  source: string
  /** 日本の公的機関の資料だけリンクする（URL がない資料・第三者の転載はリンクしない） */
  url?: string
  page: string
  status: string
  /** 資料の表記がサイトの表記と違うときの原文 */
  sourceText?: string
}

const FIELD_LABELS: Record<SourceField, string> = { name: '名称', reading: '読み', location: '位置', specialPoints: '要穴' }
const RECORD_LABELS: Record<RecordStatus, string> = {
  JAPAN_VERIFIED: '直接確認',
  JAPAN_INFERRED: '推論（直接の記載なし）',
  WHO_VERIFIED: 'WHO主位置と一致',
  HISTORICAL_ONLY: '古典の記載のみ',
  CONFLICT: '表現・表記が異なる',
}
const COVERAGE_LABELS: Record<Coverage, string> = { full: '', partial: '・一部', related: '・関連情報' }
const LINKABLE = new Set(['OFFICIAL-29-34', 'KIJUN-2026'])

function activeRecords(a: Acupoint, field: SourceField, value: string) {
  return ACUPOINT_SOURCE_DATA.records.filter(
    (r) => r.acupointId === a.slug && r.fieldName === field && r.claim === value && r.currentValue === value && !r.supersededAt,
  )
}
/** 日本の資料で記述全体を直接確認した資料名 */
function jpVerifiedSources(rs: AcupointSourceRecord[]) {
  const ids = rs.filter((r) => r.verificationStatus === 'JAPAN_VERIFIED' && r.coverage === 'full' && JAPANESE_SOURCE_TYPES.includes(sourceTypeById.get(r.sourceId) as SourceType)).map((r) => r.sourceId)
  return [...new Set(ids)].map(shortName)
}
function textbookChecked(rs: AcupointSourceRecord[]) {
  return rs.some((r) => sourceTypeById.get(r.sourceId) === 'textbook' && r.verificationStatus === 'JAPAN_VERIFIED')
}

function lineFor(a: Acupoint, field: SourceField, value: string, status: SummaryStatus): Omit<SourceDisplayLine, 'field' | 'label'> {
  const rs = activeRecords(a, field, value)
  const textbook = textbookChecked(rs) ? undefined : '日本の標準教科書では未照合'
  switch (status) {
    case 'JAPAN_VERIFIED':
      return { verdict: `${jpVerifiedSources(rs).join('・')}で確認`, tone: 'jp', note: field === 'name' ? undefined : textbook }
    case 'WHO_VERIFIED':
      return { verdict: 'WHO標準経穴部位（2008）の主位置と一致', tone: 'intl', note: '日本の資料（教科書・公式問題）では未確認' }
    case 'CONFLICT': {
      const c = rs.find((r) => r.verificationStatus === 'CONFLICT')
      const src = c ? shortName(c.sourceId) : '資料'
      return { verdict: `${src}と表現が異なる`, tone: 'conflict', note: c?.sourceText ? `資料の表記：${c.sourceText}` : '日本の教科書で確認するまで記述を変えていません' }
    }
    case 'HISTORICAL_ONLY':
      return { verdict: '古典の記載のみ', tone: 'pending', note: textbook }
    default:
      return {
        verdict: '日本の資料での確認待ち',
        tone: 'pending',
        note: rs.some((r) => r.verificationStatus === 'JAPAN_INFERRED') ? '公式問題から推論できるが、直接の記載はない' : undefined,
      }
  }
}

/** 経穴1穴の「情報の根拠」：項目ごとの判定と、出典レコードの一覧 */
export function describeAcupointSources(a: Acupoint): { lines: SourceDisplayLine[]; records: SourceDisplayRecord[] } {
  const statuses = getAcupointSourceStatus(a)
  const lines: SourceDisplayLine[] = []
  for (const field of SOURCE_FIELDS) {
    const fs = statuses.filter((s) => s.field === field && s.status !== 'NOT_APPLICABLE' && s.value !== undefined)
    if (!fs.length) continue
    if (field !== 'specialPoints') {
      lines.push({ field, label: FIELD_LABELS[field], ...lineFor(a, field, fs[0].value!, fs[0].status) })
      continue
    }
    // 要穴は分類ごとに判定が違うので、確認できた分類だけ名前を挙げる
    const ok = fs.filter((s) => s.status === 'JAPAN_VERIFIED')
    const bad = fs.filter((s) => s.status === 'CONFLICT')
    const rest = fs.length - ok.length - bad.length
    const parts = [
      ...ok.map((s) => `${s.value}：${jpVerifiedSources(activeRecords(a, field, s.value!)).join('・')}で確認`),
      ...bad.map((s) => `${s.value}：資料と表現が異なる`),
    ]
    if (rest) parts.push(ok.length || bad.length ? `ほか${rest}分類は日本の資料での確認待ち` : '日本の資料での確認待ち')
    lines.push({
      field,
      label: FIELD_LABELS[field],
      verdict: parts.join('／'),
      tone: bad.length ? 'conflict' : rest ? 'pending' : 'jp',
      note: fs.some((s) => activeRecords(a, field, s.value!).some((r) => r.verificationStatus === 'JAPAN_INFERRED')) ? '公式問題から推論できるものは、確認済みに数えていない' : undefined,
    })
  }
  const records = ACUPOINT_SOURCE_DATA.records
    .filter((r) => r.acupointId === a.slug && !r.supersededAt && r.currentValue === (r.fieldName === 'specialPoints' ? ((a.specialPoints ?? []).includes(r.claim) ? r.claim : undefined) : a[r.fieldName]))
    .map((r): SourceDisplayRecord => {
      const doc = ACUPOINT_SOURCE_DATA.sources.find((s) => s.id === r.sourceId)
      return {
        field: r.fieldName,
        fieldLabel: FIELD_LABELS[r.fieldName],
        claim: r.claim,
        source: shortName(r.sourceId),
        url: LINKABLE.has(r.sourceId) && doc?.url ? doc.url : undefined,
        page: r.sourcePage,
        status: RECORD_LABELS[r.verificationStatus] + COVERAGE_LABELS[r.coverage],
        sourceText: r.sourceText && r.sourceText !== r.claim ? r.sourceText : undefined,
      }
    })
  return { lines, records }
}
