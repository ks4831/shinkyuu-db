import fs from 'fs'
import path from 'path'
import type {
  ExamQuestion,
  Theme,
  Importance,
  BlueprintVersion,
  QuestionCountMode,
  SourceReliability,
} from './types'
import { parseCSVLine } from './csvParser'
import { roundToYear } from './utils'

export const EXAM_ROUNDS = [29, 30, 31, 32, 33, 34] as const
export const QUESTIONS_PER_ROUND = 180

const VALID_SUBJECT_IDS = new Set([
  'medical-overview', 'hygiene', 'regulations', 'anatomy', 'physiology',
  'pathology', 'clinical-general', 'clinical-specific', 'rehabilitation',
  'oriental-overview', 'meridians-acupoints', 'acupuncture-theory',
  'moxibustion-theory', 'oriental-clinical',
])

const VALID_SOURCE_RELIABILITY_VALUES = new Set([
  'indexed_official', 'direct_official', 'official_answer_only', 'third_party_reference',
])

// 設問単位の出題回数から重要度を判定（テーマCSVの calcImportance とは別基準）
// 6回×180問=1080問体制での閾値
export function calcImportanceByCount(count: number): Importance {
  if (count >= 8) return 'S'
  if (count >= 5) return 'A'
  if (count >= 3) return 'B'
  return 'C'
}

export function parseExamCSV(csvText: string): ExamQuestion[] {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []

  const header = parseCSVLine(lines[0]).map(h => h.trim())
  const questions: ExamQuestion[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    header.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim()
    })

    const examRound = parseInt(row['examRound'], 10)
    const year = parseInt(row['year'], 10) || roundToYear(examRound)

    questions.push({
      id: row['id'],
      examRound,
      year,
      questionNumber: parseInt(row['questionNumber'], 10) || 0,
      session: row['session'] || '共通',
      subject: row['subject'] || '',
      officialLarge: row['officialLarge'] || undefined,
      officialMedium: row['officialMedium'] || undefined,
      officialSmall: row['officialSmall'] || undefined,
      normalizedTheme: row['normalizedTheme'] || undefined,
      subTheme: row['subTheme'] || undefined,
      importance: (row['importance'] as Importance) || undefined,
      studyPoint: row['studyPoint'] || undefined,
      sourceUrl: row['sourceUrl'] || undefined,
      sourceReliability: (row['sourceReliability'] as SourceReliability) || 'indexed_official',
      blueprintVersion: (row['blueprintVersion'] as BlueprintVersion) || '2020',
      questionCountMode: (row['questionCountMode'] as QuestionCountMode) || '180',
      memo: row['memo'] || undefined,
    })
  }

  return questions
}

export function loadAllExamQuestions(): ExamQuestion[] {
  const questions: ExamQuestion[] = []
  for (const round of EXAM_ROUNDS) {
    const filePath = path.join(process.cwd(), 'src', 'data', 'raw', `exam-${round}.csv`)
    try {
      const text = fs.readFileSync(filePath, 'utf-8')
      questions.push(...parseExamCSV(text))
    } catch {
      // ファイルが未作成または空の場合はスキップ
    }
  }
  return questions
}

// --- 集計型 ---

export type ThemeAggregate = {
  normalizedTheme: string
  subject: string
  examRounds: number[]
  examYears: number[]
  count: number           // 設問数合計（回ではなく問数）
  appearedRounds: number  // 出題された回数（≠count）
  latestRound: number
  importance: Importance
  officialLarge?: string
  officialMedium?: string
  officialSmall?: string
  studyPoint?: string
  questions: ExamQuestion[]
}

export type SubjectAggregate = {
  subject: string
  count: number
  byRound: Record<number, number>
}

export type RoundStatus = {
  round: number
  year: number
  inputCount: number
  expected: number
  progress: number  // 0-100
}

// --- 集計関数 ---

export function aggregateByTheme(questions: ExamQuestion[]): ThemeAggregate[] {
  const map = new Map<string, ThemeAggregate>()

  for (const q of questions) {
    const key =
      q.normalizedTheme ||
      q.officialSmall ||
      q.officialMedium ||
      `${q.subject}:Q${q.questionNumber}`

    if (!map.has(key)) {
      map.set(key, {
        normalizedTheme: key,
        subject: q.subject,
        examRounds: [],
        examYears: [],
        count: 0,
        appearedRounds: 0,
        latestRound: 0,
        importance: 'C',
        officialLarge: q.officialLarge,
        officialMedium: q.officialMedium,
        officialSmall: q.officialSmall,
        studyPoint: q.studyPoint,
        questions: [],
      })
    }

    const agg = map.get(key)!
    agg.count++
    agg.questions.push(q)

    if (!agg.examRounds.includes(q.examRound)) {
      agg.examRounds.push(q.examRound)
      agg.examYears.push(q.year)
      agg.appearedRounds++
    }
    if (q.examRound > agg.latestRound) {
      agg.latestRound = q.examRound
    }
  }

  for (const agg of map.values()) {
    agg.importance = calcImportanceByCount(agg.count)
    agg.examRounds.sort((a, b) => a - b)
    agg.examYears.sort((a, b) => a - b)
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export function aggregateBySubject(questions: ExamQuestion[]): SubjectAggregate[] {
  const map = new Map<string, SubjectAggregate>()

  for (const q of questions) {
    if (!q.subject) continue
    if (!map.has(q.subject)) {
      map.set(q.subject, { subject: q.subject, count: 0, byRound: {} })
    }
    const agg = map.get(q.subject)!
    agg.count++
    agg.byRound[q.examRound] = (agg.byRound[q.examRound] ?? 0) + 1
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export function getRoundStatus(questions: ExamQuestion[]): RoundStatus[] {
  return EXAM_ROUNDS.map(round => {
    const inputCount = questions.filter(q => q.examRound === round).length
    return {
      round,
      year: roundToYear(round),
      inputCount,
      expected: QUESTIONS_PER_ROUND,
      progress: Math.min(100, Math.round((inputCount / QUESTIONS_PER_ROUND) * 100)),
    }
  })
}

// --- バリデーション ---

export type ExamRoundValidation = {
  round: number
  total: number
  missingNumbers: number[]
  duplicateNumbers: number[]
  invalidSubjects: Array<{ questionNumber: number; subject: string }>
  emptyThemes: number[]
  emptyStudyPoints: number[]
  invalidBlueprintVersion: number[]
  invalidQuestionCountMode: number[]
  invalidSourceReliability: number[]
  isComplete: boolean
}

export function validateExamRound(
  allQuestions: ExamQuestion[],
  round: number
): ExamRoundValidation {
  const qs = allQuestions.filter(q => q.examRound === round)
  const total = qs.length

  // 問題番号の重複・欠番
  const numCount = new Map<number, number>()
  for (const q of qs) {
    const n = q.questionNumber
    numCount.set(n, (numCount.get(n) ?? 0) + 1)
  }

  const duplicateNumbers = [...numCount.entries()]
    .filter(([, c]) => c > 1)
    .map(([n]) => n)
    .sort((a, b) => a - b)

  const presentNums = new Set(numCount.keys())
  const missingNumbers: number[] = []
  for (let i = 1; i <= QUESTIONS_PER_ROUND; i++) {
    if (!presentNums.has(i)) missingNumbers.push(i)
  }

  // 科目ID検証
  const invalidSubjects = qs
    .filter(q => !VALID_SUBJECT_IDS.has(q.subject))
    .map(q => ({ questionNumber: q.questionNumber, subject: q.subject }))
    .sort((a, b) => a.questionNumber - b.questionNumber)

  // 空欄チェック
  const emptyThemes = qs
    .filter(q => !q.normalizedTheme?.trim())
    .map(q => q.questionNumber)
    .sort((a, b) => a - b)

  const emptyStudyPoints = qs
    .filter(q => !q.studyPoint?.trim())
    .map(q => q.questionNumber)
    .sort((a, b) => a - b)

  // 出題基準バージョン（第29〜34回は2020、第35回以降は2026）
  const expectedBlueprint: string = round >= 35 ? '2026' : '2020'
  const invalidBlueprintVersion = qs
    .filter(q => q.blueprintVersion !== expectedBlueprint)
    .map(q => q.questionNumber)
    .sort((a, b) => a - b)

  // 問題数体制（第29回以降は180、第25〜28回は160）
  const expectedQCMode: string = round >= 29 ? '180' : '160'
  const invalidQuestionCountMode = qs
    .filter(q => q.questionCountMode !== expectedQCMode)
    .map(q => q.questionNumber)
    .sort((a, b) => a - b)

  // ソース信頼度
  const invalidSourceReliability = qs
    .filter(q => !VALID_SOURCE_RELIABILITY_VALUES.has(q.sourceReliability))
    .map(q => q.questionNumber)
    .sort((a, b) => a - b)

  const isComplete =
    total === QUESTIONS_PER_ROUND &&
    missingNumbers.length === 0 &&
    duplicateNumbers.length === 0 &&
    invalidSubjects.length === 0 &&
    emptyThemes.length === 0 &&
    emptyStudyPoints.length === 0 &&
    invalidBlueprintVersion.length === 0 &&
    invalidQuestionCountMode.length === 0 &&
    invalidSourceReliability.length === 0

  return {
    round,
    total,
    missingNumbers,
    duplicateNumbers,
    invalidSubjects,
    emptyThemes,
    emptyStudyPoints,
    invalidBlueprintVersion,
    invalidQuestionCountMode,
    invalidSourceReliability,
    isComplete,
  }
}

// raw設問CSVから Theme[] 互換データを生成（pages切り替え時に利用）
// 利用方法:
//   import { loadAllExamQuestions, aggregateToThemes } from '@/lib/examQuestions'
//   const themes = aggregateToThemes(loadAllExamQuestions())
export function aggregateToThemes(questions: ExamQuestion[]): Theme[] {
  const aggregates = aggregateByTheme(questions)

  return aggregates.map((agg, i) => {
    const rawId = agg.normalizedTheme
    const id = /^[a-z0-9-]+$/.test(rawId)
      ? rawId
      : `theme-${String(i + 1).padStart(3, '0')}`

    return {
      id,
      name: agg.officialSmall ?? agg.normalizedTheme,
      subject: agg.subject,
      examRounds: agg.examRounds,
      examYears: agg.examYears,
      count: agg.count,
      latestRound: agg.latestRound,
      importance: agg.importance,
      officialLarge: agg.officialLarge,
      officialMedium: agg.officialMedium,
      officialSmall: agg.officialSmall,
      normalizedTheme: agg.normalizedTheme,
      aliases: [],
      relatedThemes: [],
      studyPoint: agg.studyPoint ?? '',
      blueprintVersion: '2020' as BlueprintVersion,
      questionCountMode: '180' as QuestionCountMode,
      sourceReliability: 'indexed_official' as SourceReliability,
    }
  })
}
