import fs from 'fs'
import path from 'path'
import type { PastExamContent } from './types'
import { loadAllExamQuestions } from './examQuestions'

/* ──────────────────────────────────────────────────────────────
   過去問（実際の国家試験問題）の読み込み・既存分析データとの結合
   - src/data/pastExams/exam-XX.json … 問題文・選択肢・正答・解説・出典（公式一次資料）
   - src/data/raw/exam-XX.csv        … 既存の科目・テーマ等（analysis と共通のマスタ）
   両者を id（例: '34-001'）で結合する。第34回10問のパイロットのみ収録。
   ────────────────────────────────────────────────────────────── */

/** 過去問演習として収録済みの回。パイロットは第34回のみ */
export const PAST_EXAM_AVAILABLE_ROUNDS = [34] as const

/** TOP/past-exams 一覧に表示する全回（新しい順）。収録が無い回は「準備中」扱い */
export const PAST_EXAM_ALL_ROUNDS = [34, 33, 32, 31, 30, 29] as const

export type PastExamRoundInfo = {
  round: number
  year: number
  available: boolean
  questionCount: number
}

/** 過去問（結合後）。UI表示に必要な最小限のメタのみ付与する */
export type PastExamQuestion = PastExamContent & {
  subject?: string
  themeId?: string
  subTheme?: string
}

function loadPastExamContent(round: number): PastExamContent[] {
  const filePath = path.join(process.cwd(), 'src', 'data', 'pastExams', `exam-${round}.json`)
  try {
    const text = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? (parsed as PastExamContent[]) : []
  } catch {
    return []
  }
}

/** 第XX回の過去問収録数（未収録なら0） */
export function pastExamCount(round: number): number {
  return loadPastExamContent(round).length
}

/** /past-exams 一覧表示用。収録がある回のみ questionCount > 0 */
export function pastExamRoundInfoList(): PastExamRoundInfo[] {
  return PAST_EXAM_ALL_ROUNDS.map((round) => {
    const available = (PAST_EXAM_AVAILABLE_ROUNDS as readonly number[]).includes(round)
    return {
      round,
      year: round + 1992,
      available,
      questionCount: available ? pastExamCount(round) : 0,
    }
  })
}

/** 第XX回の過去問を、既存分析データ（CSV）の subject/themeId/subTheme と結合して返す。問題番号順 */
export function loadPastExamQuestions(round: number): PastExamQuestion[] {
  const content = loadPastExamContent(round)
  if (content.length === 0) return []
  const meta = new Map(
    loadAllExamQuestions()
      .filter((q) => q.examRound === round)
      .map((q) => [q.id, q]),
  )
  return content
    .map((c) => {
      const m = meta.get(c.id)
      return {
        ...c,
        subject: m?.subject,
        themeId: m?.themeId,
        subTheme: m?.subTheme,
      }
    })
    .sort((a, b) => a.questionNumber - b.questionNumber)
}
