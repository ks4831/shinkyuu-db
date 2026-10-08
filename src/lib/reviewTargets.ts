/* ──────────────────────────────────────────────────────────────
   予想問題の「復習（/quiz/weak）」の出題対象と、その説明文言。
   復習対象は保存先が別の2種類（どちらも既存キー・形式のまま読むだけ）：
   - 間違えた問題：shinkyuu_quiz_weak_v1（不正解で自動登録、2回連続正解で自動解除）
   - 復習リスト　：shinkyuu_quiz_review_v1（「☆ 復習に追加」で手動登録、手動解除のみ）
   文言は「実際に今回出題する問題」の登録理由で決める（同じ問題は1問として数える）。
   ────────────────────────────────────────────────────────────── */

import { pickByIds } from './quiz'
import { getReviewIds, getWeakIds } from './quizStorage'

/** 1回の復習で出題する最大数（/quiz/weak の既定） */
export const REVIEW_SESSION_SIZE = 10

export type ReviewKind = 'wrongOnly' | 'savedOnly' | 'mixed' | 'empty'

export type ReviewTargets = {
  kind: ReviewKind
  /** 今回出題する問題 id（重複なし・出題順） */
  ids: string[]
  /** 出題する問題数 */
  total: number
  /** うち「間違えた問題」に該当する数（復習リストと重複していても数える） */
  wrongCount: number
  /** うち「復習リスト」に該当する数 */
  savedCount: number
  /** 両方に該当する数 */
  bothCount: number
  /** 出題候補の総数（REVIEW_SESSION_SIZE で切る前・重複なし） */
  available: number
}

/**
 * 出題順を決める：間違えた問題を先に、復習リストで補う（重複は除く）。
 * isValid は存在しない問題 id（削除・改番）を除くための判定。
 */
export function buildReviewTargets(
  wrongIds: readonly string[],
  savedIds: readonly string[],
  size: number = REVIEW_SESSION_SIZE,
  isValid: (id: string) => boolean = () => true,
): ReviewTargets {
  const wrong = new Set(wrongIds)
  const saved = new Set(savedIds)
  const ordered: string[] = []
  const seen = new Set<string>()
  for (const id of [...wrongIds, ...savedIds]) {
    if (seen.has(id) || !isValid(id)) continue
    seen.add(id)
    ordered.push(id)
  }
  const ids = ordered.slice(0, size)
  const wrongCount = ids.filter((id) => wrong.has(id)).length
  const savedCount = ids.filter((id) => saved.has(id)).length
  const bothCount = ids.filter((id) => wrong.has(id) && saved.has(id)).length
  const kind: ReviewKind =
    ids.length === 0 ? 'empty' : wrongCount > 0 && savedCount > 0 ? 'mixed' : wrongCount > 0 ? 'wrongOnly' : 'savedOnly'
  return { kind, ids, total: ids.length, wrongCount, savedCount, bothCount, available: ordered.length }
}

/** 復習対象の説明（ボタンの上などに出す見出し） */
export function reviewHeading(kind: ReviewKind): string {
  switch (kind) {
    case 'wrongOnly':
      return '間違えた問題をもう一度解く'
    case 'savedOnly':
      return '復習リストの問題をもう一度解く'
    case 'mixed':
      return '間違えた問題や復習リストの問題をもう一度解く'
    case 'empty':
      return '復習する問題はありません'
  }
}

/** 内訳（例：「間違えた問題 3問・復習リスト 2問」。両方に該当する問題はそれぞれに数える） */
export function reviewBreakdown(t: ReviewTargets): string {
  const parts: string[] = []
  if (t.wrongCount > 0) parts.push(`間違えた問題 ${t.wrongCount}問`)
  if (t.savedCount > 0) parts.push(`復習リスト ${t.savedCount}問`)
  if (t.bothCount > 0) parts.push(`うち両方 ${t.bothCount}問`)
  return parts.join('・')
}

/** 端末の保存データから、/quiz/weak が次に出題する内容を求める（クライアント専用） */
export function readReviewTargets(size: number = REVIEW_SESSION_SIZE): ReviewTargets {
  const valid = new Set(pickByIds([...getWeakIds(), ...getReviewIds()]).map((q) => q.id))
  return buildReviewTargets(getWeakIds(), getReviewIds(), size, (id) => valid.has(id))
}
