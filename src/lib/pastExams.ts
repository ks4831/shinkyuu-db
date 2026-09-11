import fs from 'fs'
import path from 'path'
import type { PastExamContent } from './types'
import { loadAllExamQuestions, EXAM_ROUNDS, QUESTIONS_PER_ROUND } from './examQuestions'

/* ──────────────────────────────────────────────────────────────
   過去問（実際の国家試験問題）の読み込み・既存分析データとの結合
   - src/data/pastExams/exam-XX.json … 問題文・選択肢・正答・解説・出典（公式一次資料）
   - src/data/raw/exam-XX.csv        … 既存の科目・テーマ等（analysis と共通のマスタ）
   両者を id（例: '34-001'）で結合する。

   複数回への横展開を前提にした構造：
   - 「round を渡せばその回のデータを読む」関数のみを提供する。回ごとのページ分岐は持たない。
   - 収録数・演習可能数は JSON の実データから動的に算出する（ハードコードしない）。
   - 該当回の exam-XX.json が無ければ空配列を返すだけで、ERROR にはしない
     （audit:data 側の方針も同じ。src/data/pastExams/exam-33.json 等を追加するだけで
     ページ・ローダーとも変更不要になる）。
   ────────────────────────────────────────────────────────────── */

/** 過去問演習の対象になりうる回（新しい順）。実際にJSONがあるかどうかは pastExamCoverage() で判定する */
export const PAST_EXAM_ALL_ROUNDS: number[] = [...EXAM_ROUNDS].reverse()

export type PastExamQuestion = PastExamContent & {
  subject?: string
  themeId?: string
  subTheme?: string
}

export type PastExamCoverage = {
  round: number
  year: number
  /** JSONに収録されている問題数（図表問題を含む・監査上の総数） */
  collected: number
  /** 実際に演習できる問題数（hasFigure:true かつ figureImage 未設定の問題を除く） */
  playable: number
  /** その回の全問題数（180） */
  totalPerRound: number
  /** playable > 0 のとき true。/past-exams 一覧のリンク可否に使う */
  available: boolean
}

function pastExamFilePath(round: number): string {
  return path.join(process.cwd(), 'src', 'data', 'pastExams', `exam-${round}.json`)
}

/**
 * JSONの内容をそのまま返す（図表問題も含む）。
 * UI表示には使わず、監査（audit:data）や pastExamCoverage() の集計元として使う。
 */
export function loadPastExamContentRaw(round: number): PastExamContent[] {
  try {
    const text = fs.readFileSync(pastExamFilePath(round), 'utf-8')
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? (parsed as PastExamContent[]) : []
  } catch {
    return []
  }
}

/**
 * 演習可能かどうか。hasFigure:true の問題は、対応する画像（figureImage）が
 * 用意されるまで出題対象から自動的に除外する（今回は画像機能自体を作らない）。
 */
function isPlayable(q: PastExamContent): boolean {
  return !q.hasFigure || Boolean(q.figureImage)
}

/** /past-exams 一覧表示用。回ごとの収録数・演習可能数をJSONの実データから算出する */
export function pastExamCoverage(): PastExamCoverage[] {
  return PAST_EXAM_ALL_ROUNDS.map((round) => {
    const content = loadPastExamContentRaw(round)
    const playable = content.filter(isPlayable).length
    return {
      round,
      year: round + 1992,
      collected: content.length,
      playable,
      totalPerRound: QUESTIONS_PER_ROUND,
      available: playable > 0,
    }
  })
}

/**
 * 第XX回の過去問（演習可能なもののみ）を、既存分析データ（CSV）の
 * subject/themeId/subTheme と結合して返す。問題番号順。
 * ページ側はこの関数だけを呼べばよく、回ごとに実装を分岐させない。
 */
export function loadPastExamQuestions(round: number): PastExamQuestion[] {
  const content = loadPastExamContentRaw(round).filter(isPlayable)
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
