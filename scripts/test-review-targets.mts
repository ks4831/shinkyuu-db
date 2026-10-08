#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   復習対象（間違えた問題／復習リスト）の分類・重複排除・保存ルールのテスト
   `npm run test:review`
   - localStorage は疑似実装。既存の保存キー・形式（shinkyuu_quiz_*_v1）をそのまま使う。
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'

// quizStorage は window.localStorage を読むため、疑似 window を用意してから読み込む
const store = new Map<string, string>()
;(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  },
  dispatchEvent: () => true,
}

const S = await import('../src/lib/quizStorage')
const T = await import('../src/lib/reviewTargets')
const { ALL_QUESTIONS } = await import('../src/lib/quiz')

const ids = ALL_QUESTIONS.slice(0, 15).map((q) => q.id)
const subj = (id: string) => ALL_QUESTIONS.find((q) => q.id === id)!.subject
const answer = (id: string, correct: boolean) => S.recordAttempt({ qid: id, subject: subj(id), correct })
const reset = () => store.clear()

let n = 0
function test(name: string, fn: () => void) {
  reset()
  fn()
  n++
  console.log(`  ✓ ${name}`)
}

console.log('復習対象のテスト')

test('1. 間違えた問題のみ3問 → wrongOnly', () => {
  ids.slice(0, 3).forEach((id) => answer(id, false))
  const t = T.readReviewTargets()
  assert.equal(t.kind, 'wrongOnly'); assert.equal(t.total, 3)
  assert.equal(T.reviewHeading(t.kind), '間違えた問題をもう一度解く')
})

test('2. 復習リストのみ3問（全問正解済み）→ savedOnly', () => {
  ids.slice(0, 3).forEach((id) => { answer(id, true); S.addReview(id) })
  const t = T.readReviewTargets()
  assert.equal(t.kind, 'savedOnly'); assert.equal(t.total, 3); assert.equal(t.wrongCount, 0)
  assert.equal(T.reviewHeading(t.kind), '復習リストの問題をもう一度解く')
})

test('3. 間違えた2問＋復習リスト2問（重複なし）→ mixed・4問', () => {
  answer(ids[0], false); answer(ids[1], false)
  S.addReview(ids[2]); S.addReview(ids[3])
  const t = T.readReviewTargets()
  assert.equal(t.kind, 'mixed'); assert.equal(t.total, 4); assert.equal(t.bothCount, 0)
  assert.equal(T.reviewHeading(t.kind), '間違えた問題や復習リストの問題をもう一度解く')
})

test('4. 間違えた2問＋復習リスト2問（1問重複）→ mixed・3問（重複は1問）', () => {
  answer(ids[0], false); answer(ids[1], false)
  S.addReview(ids[1]); S.addReview(ids[2])
  const t = T.readReviewTargets()
  assert.equal(t.kind, 'mixed'); assert.equal(t.total, 3); assert.equal(t.bothCount, 1)
  assert.deepEqual(t.ids, [ids[0], ids[1], ids[2]])
  assert.equal(T.reviewBreakdown(t), '間違えた問題 2問・復習リスト 2問・うち両方 1問')
})

test('5. 対象0問 → empty（開始ボタンなし用の文言）', () => {
  const t = T.readReviewTargets()
  assert.equal(t.kind, 'empty'); assert.equal(t.total, 0)
  assert.equal(T.reviewHeading(t.kind), '復習する問題はありません')
})

test('6. 復習リストの問題を（何度）正解しても登録は維持（ケースB）', () => {
  S.addReview(ids[0])
  answer(ids[0], true); answer(ids[0], true); answer(ids[0], true)
  assert.equal(S.isInReview(ids[0]), true)
  assert.equal(T.readReviewTargets().kind, 'savedOnly')
})

test('7. 復習リストを解除しても間違えた問題の記録は残る（ケースD）', () => {
  answer(ids[0], false); S.addReview(ids[0])
  S.removeReview(ids[0])
  assert.equal(S.isInReview(ids[0]), false)
  assert.deepEqual(S.getWeakIds(), [ids[0]])
  assert.equal(T.readReviewTargets().kind, 'wrongOnly')
})

test('ケースA：間違えた問題を2回続けて正解すると既存ルールどおり自動で外れる', () => {
  answer(ids[0], false)
  answer(ids[0], true)
  assert.deepEqual(S.getWeakIds(), [ids[0]])
  answer(ids[0], true)
  assert.deepEqual(S.getWeakIds(), [])
  assert.equal(T.readReviewTargets().kind, 'empty')
})

test('ケースC：両方に入っている問題を正解 → 間違えた側だけ既存ルールで外れ、復習リストは残る', () => {
  answer(ids[0], false); S.addReview(ids[0])
  answer(ids[0], true); answer(ids[0], true)
  assert.deepEqual(S.getWeakIds(), [])
  assert.equal(S.isInReview(ids[0]), true)
  assert.equal(T.readReviewTargets().kind, 'savedOnly')
})

test('復習リストに同じ問題を重複登録しない', () => {
  S.addReview(ids[0]); S.addReview(ids[0])
  assert.deepEqual(S.getReviewIds(), [ids[0]])
})

test('8. 旧データ（既存キー・既存形式）をそのまま読める。存在しない問題は除外', () => {
  store.set(S.QUIZ_WEAK_KEY, JSON.stringify([
    { qid: ids[0], subject: subj(ids[0]), streak: 0, addedAt: 1 },
    { qid: 'deleted-999', subject: 'anatomy', streak: 1, addedAt: 2 },
  ]))
  store.set(S.QUIZ_REVIEW_KEY, JSON.stringify([ids[1], ids[0], 'deleted-998']))
  const before = new Map(store)
  const t = T.readReviewTargets()
  assert.deepEqual(t.ids, [ids[0], ids[1]])
  assert.equal(t.kind, 'mixed'); assert.equal(t.bothCount, 1)
  // 読むだけで保存データを書き換えない
  assert.deepEqual(new Map(store), before)
})

test('8b. 壊れた保存データでも落ちずに empty', () => {
  store.set(S.QUIZ_WEAK_KEY, '{broken')
  store.set(S.QUIZ_REVIEW_KEY, '"not-array"')
  assert.equal(T.readReviewTargets().kind, 'empty')
})

test('出題は最大10問。全体数も返す（対象10問・全12問中）', () => {
  ids.slice(0, 12).forEach((id) => answer(id, false))
  const t = T.readReviewTargets()
  assert.equal(t.total, 10); assert.equal(t.available, 12); assert.equal(t.kind, 'wrongOnly')
})

test('文言は出題する問題だけで決まる（11問目以降の復習リストは数えない）', () => {
  ids.slice(0, 10).forEach((id) => answer(id, false))
  S.addReview(ids[12])
  const t = T.readReviewTargets()
  assert.equal(t.total, 10); assert.equal(t.kind, 'wrongOnly'); assert.equal(t.available, 11)
})

test('学習記録の「復習待ち」は重複を1問として数える', () => {
  answer(ids[0], false); answer(ids[1], false); S.addReview(ids[1]); S.addReview(ids[2])
  const s = S.getStats()
  assert.equal(s.weakCount, 2); assert.equal(s.reviewCount, 2); assert.equal(s.reviewTargetCount, 3)
})

console.log(`OK: ${n} 件`)
