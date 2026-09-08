import { QUIZ_QUESTIONS } from '@/data/quizQuestions'
import { subjects } from './data'

export type QuizDifficulty = 'easy' | 'normal' | 'hard'

export type QuizQuestion = {
  id: string
  question: string
  choices: string[]
  /** 正解の選択肢インデックス（0-3） */
  correctAnswer: number
  explanation: string
  memoryPoint: string
  commonMistake: string
  /** subjects の id */
  subject: string
  /** テーマの短い日本語ラベル（表示用サブラベル） */
  theme: string
  /** 統一テーマ Master（themes[].id）への参照。Ver.7.2.2 で全問に付与 */
  themeId?: string
  difficulty: QuizDifficulty
  importance: 'S' | 'A' | 'B' | 'C'
  /** 関連経穴の slug（src/data/acupoints.ts） */
  relatedAcupoints: string[]
  /** learningDiagrams の id（任意） */
  imageId?: string
  tags: string[]
}

export const ALL_QUESTIONS: QuizQuestion[] = QUIZ_QUESTIONS

export function subjectLabel(subjectId: string): string {
  return subjects.find((s) => s.id === subjectId)?.shortName ?? subjectId
}

export function subjectFullName(subjectId: string): string {
  return subjects.find((s) => s.id === subjectId)?.name ?? subjectId
}

/* ── 出題モード ─────────────────────────────────────────── */

function shuffle<T>(arr: T[], seed?: number): T[] {
  const a = [...arr]
  let s = seed ?? Math.floor(Math.random() * 1e9)
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickRandom(count = 10, seed?: number): QuizQuestion[] {
  return shuffle(ALL_QUESTIONS, seed).slice(0, count)
}

/** 頻出：重要度 S / A を優先 */
export function pickFrequent(count = 10, seed?: number): QuizQuestion[] {
  const weight = (q: QuizQuestion) => ({ S: 0, A: 1, B: 2, C: 3 }[q.importance])
  return shuffle(ALL_QUESTIONS, seed)
    .sort((a, b) => weight(a) - weight(b))
    .slice(0, count)
}

/** 経穴：経絡経穴概論、または acupoint タグを持つ問題 */
export function pickAcupoints(count = 10, seed?: number): QuizQuestion[] {
  return shuffle(
    ALL_QUESTIONS.filter(
      (q) => q.subject === 'meridians-acupoints' || q.tags.includes('経穴'),
    ),
    seed,
  ).slice(0, count)
}

export function pickBySubject(subjectId: string, count = 10, seed?: number): QuizQuestion[] {
  return shuffle(
    ALL_QUESTIONS.filter((q) => q.subject === subjectId),
    seed,
  ).slice(0, count)
}

/** 統一テーマ（themeId）に紐づくクイズ */
export function pickByTheme(themeId: string, count?: number, seed?: number): QuizQuestion[] {
  const list = shuffle(ALL_QUESTIONS.filter((q) => q.themeId === themeId), seed)
  return count ? list.slice(0, count) : list
}

/** themeId ごとのクイズ収録数 */
export function quizCountByTheme(themeId: string): number {
  return ALL_QUESTIONS.filter((q) => q.themeId === themeId).length
}

/** クイズが1問以上ある themeId の一覧 */
export function themeIdsWithQuiz(): string[] {
  return [...new Set(ALL_QUESTIONS.map((q) => q.themeId).filter((v): v is string => Boolean(v)))]
}

export function pickByIds(ids: string[], count?: number): QuizQuestion[] {
  const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]))
  const list = ids.map((id) => byId.get(id)).filter((q): q is QuizQuestion => Boolean(q))
  return count ? list.slice(0, count) : list
}

export function questionById(id: string): QuizQuestion | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id)
}

/** 経穴 slug に紐づく関連問題 */
export function questionsForAcupoint(slug: string): QuizQuestion[] {
  return ALL_QUESTIONS.filter((q) => q.relatedAcupoints.includes(slug))
}

/** 科目ごとの収録数 */
export function subjectQuestionCounts(): { id: string; name: string; short: string; count: number }[] {
  return subjects
    .map((s) => ({
      id: s.id,
      name: s.name,
      short: s.shortName,
      count: ALL_QUESTIONS.filter((q) => q.subject === s.id).length,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
}

export const DIFFICULTY_LABEL: Record<QuizDifficulty, string> = {
  easy: 'やさしい',
  normal: 'ふつう',
  hard: 'むずかしい',
}
