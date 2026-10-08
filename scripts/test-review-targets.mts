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

/* ── 過去問との関係・今日の10問・苦手復習・途中再開 ── */
const P = await import('../src/lib/pastExamStorage')
const PS = await import('../src/lib/pastExamSession')
const D = await import('../src/lib/dailyQuiz')

test('過去問とIDが衝突しても別の問題として扱う（保存キーが別・予想問題にない id は出題しない）', () => {
  // 過去問の解答は別キーに保存され、予想問題の復習対象に影響しない
  P.recordPastExamAttempt({ questionId: '30-057', examRound: 30, correct: false })
  P.recordPastExamAttempt({ questionId: ids[0], examRound: 30, correct: false }) // 仮に予想問題と同じ id でも
  assert.equal(T.readReviewTargets().kind, 'empty')
  // 予想問題の解答は過去問の履歴に入らない
  answer(ids[1], false)
  assert.equal(P.getPastExamHistory().length, 2)
  // 過去問の id が予想問題の保存データに紛れ込んでも出題しない
  S.addReview('30-057')
  const t = T.readReviewTargets()
  assert.deepEqual(t.ids, [ids[1]]); assert.equal(t.kind, 'wrongOnly')
})

test('復習の操作は過去問の途中再開データを変えない', () => {
  const raw = JSON.stringify({ 30: { mode: 'round', index: 5 } })
  store.set(PS.PAST_EXAM_SESSION_KEY, raw)
  answer(ids[0], false); S.addReview(ids[1]); S.removeReview(ids[1]); T.readReviewTargets()
  assert.equal(store.get(PS.PAST_EXAM_SESSION_KEY), raw)
})

test('今日の10問：途中再開しても回答は保持され、終了後の復習対象は不正解と手動登録から決まる', () => {
  const st = D.getOrCreateDailyState()
  const qs = D.resolveDailyQuestions(st)
  assert.equal(qs.length, D.DAILY_COUNT)
  // 前半5問：1問目だけ不正解
  qs.slice(0, 5).forEach((q, i) => { answer(q.id, i !== 0); D.recordDailyAnswer(i, i !== 0) })
  // 途中再開（保存データから読み直す）
  const resumed = D.getOrCreateDailyState()
  assert.equal(resumed.currentIndex, 5)
  assert.deepEqual(resumed.questionIds, st.questionIds)
  // 後半5問：全問正解し、うち1問を手動登録
  qs.slice(5).forEach((q, j) => { answer(q.id, true); D.recordDailyAnswer(5 + j, true) })
  S.addReview(qs[7].id)
  const fin = D.finalizeDailyIfComplete()
  assert.equal(fin.completed, true)
  const t = T.readReviewTargets()
  assert.equal(t.kind, 'mixed'); assert.equal(t.total, 2); assert.deepEqual(t.ids, [qs[0].id, qs[7].id])
  // 復習対象を読んでも今日の10問の状態は変わらない
  const before = store.get(D.DAILY_STATE_KEY)
  T.readReviewTargets()
  assert.equal(store.get(D.DAILY_STATE_KEY), before)
})

test('苦手復習：開始時の対象はセッション中に固定され、終了後は既存ルールで更新される', () => {
  answer(ids[0], false); answer(ids[1], false); S.addReview(ids[2])
  const atStart = T.readReviewTargets()
  assert.equal(atStart.kind, 'mixed'); assert.equal(atStart.total, 3)
  // セッション中に全問正解（間違えた問題は1回目の正解ではまだ外れない）
  atStart.ids.forEach((id) => answer(id, true))
  assert.deepEqual(atStart.ids, [ids[0], ids[1], ids[2]])
  const mid = T.readReviewTargets()
  assert.equal(mid.total, 3)
  // もう一度全問正解 → 間違えた問題は外れ、手動登録だけ残る
  mid.ids.forEach((id) => answer(id, true))
  const after = T.readReviewTargets()
  assert.equal(after.kind, 'savedOnly'); assert.deepEqual(after.ids, [ids[2]])
})

/* 今日の10問を実際に記録して、終了後の復習対象を確かめる（A〜E） */
function playDaily(wrongAt: number[], saveAt: number[]) {
  const qs = D.resolveDailyQuestions(D.getOrCreateDailyState())
  qs.forEach((q, i) => {
    answer(q.id, !wrongAt.includes(i))
    D.recordDailyAnswer(i, !wrongAt.includes(i))
    if (saveAt.includes(i)) S.addReview(q.id)
  })
  assert.equal(D.finalizeDailyIfComplete().completed, true)
  return qs.map((q) => q.id)
}
for (const [name, wrongAt, saveAt, kind, total] of [
  ['今日の10問A：全問正解・復習リスト0問 → empty', [], [], 'empty', 0],
  ['今日の10問B：全問正解・手動1問 → savedOnly 1問（間違えた問題と表示しない）', [], [3], 'savedOnly', 1],
  ['今日の10問C：不正解2問のみ → wrongOnly 2問', [0, 5], [], 'wrongOnly', 2],
  ['今日の10問D：不正解1問＋手動1問（別問題）→ mixed 2問', [0], [4], 'mixed', 2],
  ['今日の10問E：不正解2問＋手動2問（1問重複）→ mixed 3問', [0, 2], [2, 6], 'mixed', 3],
] as const) {
  test(name, () => {
    const qids = playDaily([...wrongAt], [...saveAt])
    const t = T.readReviewTargets()
    assert.equal(t.kind, kind); assert.equal(t.total, total)
    const expected = [...new Set([...wrongAt.map((i) => qids[i]), ...saveAt.map((i) => qids[i])])]
    assert.deepEqual([...t.ids].sort(), expected.sort())
  })
}

console.log(`OK: ${n} 件`)
