/* ──────────────────────────────────────────────────────────────
   「今日の10問」の出題選定（純粋関数・LocalStorage に触れない）
   - 同じ seed（日付）＋同じ入力なら必ず同じ結果（決定的）
   - 配分の目安: 新基準10%(1問) / 苦手30% / 頻出40% / 最近解いていない20%
   - 制約: 1テーマ最大2問 / 最低5科目 / 重複なし / ちょうど10問
   - 「新基準」枠は 2026年版出題基準（第35回〜）の新設・拡充領域から 1 問だけ。
     Daily 全体を新基準問題で埋めない（既存の頻出/苦手/未回答のバランスは維持）。
   client と audit の両方から import する
   ────────────────────────────────────────────────────────────── */
import type { QuizQuestion } from './quiz'

export const DAILY_COUNT = 10
const MAX_PER_THEME = 2
const MIN_SUBJECTS = 5

/** 文字列 → 32bit 符号なし整数ハッシュ */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32：軽量な決定的 PRNG */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type DailySelectInput = {
  /** 出題候補（通常 ALL_QUESTIONS） */
  all: QuizQuestion[]
  /** themeId → 過去6年の国家試験出題数 */
  themeExamCount: Record<string, number>
  /** 日付シード（Asia/Tokyo の YYYY-MM-DD） */
  seed: string
  /** 苦手・復習登録された問題 id（30%枠） */
  weakIds?: string[]
  /** 直近に解答した問題 id（新しい順・20%枠の除外に使用） */
  recentQids?: string[]
}

/** 今日の10問の id を決定的に選ぶ */
export function selectDailyQuestionIds(input: DailySelectInput): string[] {
  const { all, themeExamCount, seed } = input
  const weakIds = new Set(input.weakIds ?? [])
  const recentSet = new Set((input.recentQids ?? []).slice(0, 25))
  const rnd = mulberry32(hashSeed(seed))

  const picked: QuizQuestion[] = []
  const themeCount: Record<string, number> = {}
  const pickedIds = new Set<string>()

  const canAdd = (q: QuizQuestion) => {
    if (pickedIds.has(q.id)) return false
    const t = q.themeId ?? `__${q.subject}`
    return (themeCount[t] ?? 0) < MAX_PER_THEME
  }
  const add = (q: QuizQuestion) => {
    picked.push(q)
    pickedIds.add(q.id)
    const t = q.themeId ?? `__${q.subject}`
    themeCount[t] = (themeCount[t] ?? 0) + 1
  }
  const take = (pool: QuizQuestion[], n: number) => {
    for (const q of pool) {
      if (picked.length >= DAILY_COUNT) break
      if (n <= 0) break
      if (canAdd(q)) { add(q); n-- }
    }
  }

  // 1) 苦手・復習（30% ≒ 3問）
  const weakPool = shuffled(all.filter((q) => weakIds.has(q.id)), rnd)
  take(weakPool, 3)

  // 1.5) 第35回 新基準（10% ≒ 1問）：2026年版で新設・拡充された領域から 1 問だけ
  const standardPool = shuffled(all.filter((q) => q.standard2026), rnd)
  take(standardPool, 1)

  // 2) 頻出（40% ≒ 4問）：themeExamCount 降順の上位から
  const freqPool = shuffled(
    [...all].sort((a, b) => (themeExamCount[b.themeId ?? ''] ?? 0) - (themeExamCount[a.themeId ?? ''] ?? 0)).slice(0, 50),
    rnd,
  )
  take(freqPool, 4)

  // 3) 最近解いていない（20% ≒ 2問）
  const notRecentPool = shuffled(all.filter((q) => !recentSet.has(q.id)), rnd)
  take(notRecentPool, 2)

  // 4) 残りをランダムで埋める（科目の多様性を優先）
  const rest = shuffled(all, rnd)
  const seenSubjects = new Set(picked.map((q) => q.subject))
  // まず未出の科目から
  take(rest.filter((q) => !seenSubjects.has(q.subject)), DAILY_COUNT)
  // それでも足りなければ何でも
  take(rest, DAILY_COUNT)

  // 5) 科目多様性の補正：5科目未満なら、重複科目の1問を未出科目に差し替え
  let guard = 0
  while (new Set(picked.map((q) => q.subject)).size < MIN_SUBJECTS && guard++ < 20) {
    const subjCounts: Record<string, number> = {}
    for (const q of picked) subjCounts[q.subject] = (subjCounts[q.subject] ?? 0) + 1
    const overSubject = Object.entries(subjCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const usedSubjects = new Set(picked.map((q) => q.subject))
    const swapIn = shuffled(all, rnd).find(
      (q) => !usedSubjects.has(q.subject) && !pickedIds.has(q.id) && (themeCount[q.themeId ?? `__${q.subject}`] ?? 0) < MAX_PER_THEME,
    )
    const swapOutIdx = picked.findIndex((q) => q.subject === overSubject)
    if (!swapIn || swapOutIdx < 0) break
    const removed = picked.splice(swapOutIdx, 1)[0]
    pickedIds.delete(removed.id)
    const rt = removed.themeId ?? `__${removed.subject}`
    themeCount[rt]--
    add(swapIn)
  }

  // 6) 最終並びを決定的にシャッフル（科目が固まらないように）
  const final = shuffled(picked.slice(0, DAILY_COUNT), rnd).map((q) => q.id)
  // 念のため：不足時は byId 順で補完（通常は起きない）
  if (final.length < DAILY_COUNT) {
    for (const q of shuffled(all, rnd)) {
      if (final.length >= DAILY_COUNT) break
      if (!final.includes(q.id)) final.push(q.id)
    }
  }
  return final.slice(0, DAILY_COUNT)
}

/** themeExamCount を themes 出題実績 Map から作るヘルパ（サーバー側で使用） */
export function buildThemeExamCount(entries: Iterable<{ themeId: string; count: number }>): Record<string, number> {
  const m: Record<string, number> = {}
  for (const e of entries) m[e.themeId] = e.count
  return m
}
