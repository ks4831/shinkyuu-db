export type Importance = 'S' | 'A' | 'B' | 'C'
export type BlueprintVersion = '2020' | '2026'
export type QuestionCountMode = '180' | '160'
export type SourceReliability =
  | 'indexed_official'       // 財団公式アーカイブ一覧掲載
  | 'direct_official'        // 財団直URL（非一覧）
  | 'official_answer_only'   // 厚労省正答表のみ公式
  | 'third_party_reference'  // 第三者ミラー参照

export type Theme = {
  id: string
  name: string
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
}

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
  normalizedTheme?: string  // テーマ集計キー（テーマID推奨）
  subTheme?: string
  importance?: Importance   // 任意（集計時に自動上書き）
  studyPoint?: string
  sourceUrl?: string
  sourceReliability: SourceReliability
  blueprintVersion: BlueprintVersion
  questionCountMode: QuestionCountMode
  memo?: string
}
