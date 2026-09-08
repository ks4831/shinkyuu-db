export type Importance = 'S' | 'A' | 'B' | 'C'
export type BlueprintVersion = '2020' | '2026'
export type QuestionCountMode = '180' | '160'
export type SourceReliability =
  | 'indexed_official'       // 財団公式アーカイブ一覧掲載
  | 'direct_official'        // 財団直URL（非一覧）
  | 'official_answer_only'   // 厚労省正答表のみ公式
  | 'third_party_reference'  // 第三者ミラー参照

/** 2026年版（令和8年版）出題基準による変更区分。第35回〜適用。
 *  ─ 既存 importance（第29〜34回の実績に基づく学習優先度）とは完全に別軸。
 *  ─ 公式資料で直接確認できる事実（evidence: A/B）のみを対象とし、
 *    「第35回で出る」等の予測表示には使わない。 */
export type Standard2026Status = 'new' | 'expanded' | 'reorganized' | 'unchanged'

export type Standard2026 = {
  /** new=大項目新設 / expanded=既存項目の明確な増補 / reorganized=構造再編 / unchanged */
  status: Standard2026Status
  /** 当サイトの学習優先度（1=高〜3=低）。任意・ANALYSIS。公式の重点指定ではない */
  priority?: 1 | 2 | 3
  /** 根拠の信頼度。A=2026年版公式PDF本文で直接確認 / B=公式PDF＋当DBの照合による解釈 */
  evidence: 'A' | 'B'
  /** 変更内容の要約（1〜2文・FACTのみ） */
  note: string
}

export type Theme = {
  /** 永続キー（themeId）。URL slug も兼ねる（/themes/[id]） */
  id: string
  name: string
  /** subjects[].id */
  subject: string
  examYears: number[]
  examRounds: number[]
  count: number
  latestRound: number
  importance: Importance
  officialLarge?: string
  officialMedium?: string
  officialSmall?: string
  normalizedTheme?: string
  aliases?: string[]
  relatedThemes: string[]
  studyPoint: string
  blueprintVersion: BlueprintVersion
  questionCountMode: QuestionCountMode
  sourceReliability: SourceReliability
  sourceUrl?: string
  /** 上位テーマの id（任意・最小限の階層化に使用） */
  parentThemeId?: string
  /** 2026年版出題基準による変更区分（第35回〜）。任意。importance は上書きしない */
  standard2026?: Standard2026
}

/** URL slug は id と同一。将来 slug を分離する場合の互換ヘルパ用に別名を持つ */
export type ThemeId = string

export type Subject = {
  id: string
  name: string
  shortName: string
  description: string
}

// 設問単位の生データ（src/data/raw/exam-XX.csv から読み込む）
export type ExamQuestion = {
  id: string
  examRound: number
  year: number
  questionNumber: number
  session: string         // '共通' | 'はり師' | 'きゅう師'
  subject: string
  officialLarge?: string
  officialMedium?: string
  officialSmall?: string
  normalizedTheme?: string  // 旧テーマ集計キー（英語スラッグ・/analysis で使用）
  /** 統一テーマ Master（themes[].id）への参照。Ver.7.2.2 で全設問へ付与 */
  themeId?: string
  subTheme?: string
  importance?: Importance   // 任意（集計時に自動上書き）
  studyPoint?: string
  sourceUrl?: string
  sourceReliability: SourceReliability
  blueprintVersion: BlueprintVersion
  questionCountMode: QuestionCountMode
  memo?: string
}
