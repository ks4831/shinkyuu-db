#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   過去問演習の「前の問題」（src/lib/practiceNav.ts）のテスト
   `npm run test:practice-nav`
   - 回答済みの範囲内でだけ前後に移動でき、未回答の問題を飛ばして先へ進めない
   - 戻っても回答・正誤が残り、回答の変更はできない
   - 途中再開：前回までの正誤と（保存されていれば）選択肢を復元し、次の未回答から始める
   - 年度別・科目別の保存データに selectedIndex を足しても、旧データ（無し）と一緒に読める
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'

const store = new Map<string, string>()
const localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
}
;(globalThis as unknown as { window: unknown }).window = { localStorage }

const N = await import('../src/lib/practiceNav')
const S = await import('../src/lib/pastExamSession')
const SS = await import('../src/lib/pastExamSubjectSession')

let n = 0
function test(name: string, fn: () => void) {
  store.clear()
  fn()
  n++
  console.log(`PASS  ${name}`)
}

const answer = (s: ReturnType<typeof N.createPracticeNav>, choice: number, correct: boolean) =>
  N.recordAnswer(N.selectDraft(s, choice), correct)

test('1. 最初の問題では前へ戻れない', () => {
  const s = N.createPracticeNav(3)
  assert.equal(N.canGoPrev(s), false)
  assert.equal(N.goPrev(s), s)
})

test('2. 未回答の問題では次へ進めない（飛ばせない）', () => {
  let s = N.createPracticeNav(3)
  assert.equal(N.canGoNext(s), false)
  assert.equal(N.goNext(s), s)
  s = N.selectDraft(s, 1)
  assert.equal(N.canGoNext(s), false, '選んだだけ（未回答）では進めない')
  assert.equal(N.goTo(s, 2), s, '先の問題へ直接も行けない')
})

test('3. 回答→次へ→前へで、回答と正誤が残る', () => {
  let s = answer(N.createPracticeNav(3), 2, false)
  s = N.goNext(s)
  assert.equal(s.index, 1)
  s = N.goPrev(s)
  assert.equal(s.index, 0)
  assert.equal(N.shownChoice(s, 0), 2)
  assert.equal(s.results[0], false)
  assert.equal(N.isAnswered(s, 0), true)
})

test('4. 回答済みの問題は回答を変更できない', () => {
  let s = answer(N.createPracticeNav(3), 2, false)
  assert.equal(N.selectDraft(s, 0), s)
  assert.equal(N.recordAnswer(s, true), s)
  s = N.goNext(s)
  s = N.goPrev(s)
  assert.equal(N.selectDraft(s, 0), s)
})

test('5. 前へ戻ったあと、回答済みの範囲内で次へ進め、最初の未回答で止まる', () => {
  let s = N.createPracticeNav(4)
  s = N.goNext(answer(s, 0, true))
  s = N.goNext(answer(s, 1, false))
  assert.equal(s.index, 2)
  s = N.goPrev(N.goPrev(s))
  assert.equal(s.index, 0)
  s = N.goNext(s)
  assert.equal(s.index, 1)
  s = N.goNext(s)
  assert.equal(s.index, 2, '最初の未回答の問題までは進める')
  assert.equal(N.goNext(s), s, 'そこから先へは飛ばせない')
})

test('6. 戻っても、未回答の問題の回答前の選択は残る', () => {
  let s = N.goNext(answer(N.createPracticeNav(3), 0, true))
  s = N.selectDraft(s, 3)
  s = N.goNext(N.goPrev(s))
  assert.equal(N.shownChoice(s, 1), 3)
  assert.equal(N.isAnswered(s, 1), false)
})

test('7. 最後の問題に回答すると結果へ進める。最後の問題からも前へ戻れる', () => {
  let s = N.createPracticeNav(2)
  s = N.goNext(answer(s, 0, true))
  assert.equal(N.canFinish(s), false)
  s = answer(s, 1, false)
  assert.equal(N.canFinish(s), true)
  assert.equal(N.canGoNext(s), false)
  assert.equal(N.canGoPrev(s), true)
  s = N.goPrev(s)
  assert.equal(s.index, 0)
  assert.equal(N.canFinish(s), false, '途中の問題では「結果を見る」にならない')
  assert.deepEqual(N.answeredResults(s), [true, false])
})

test('8. 採点に使う正誤は出題順で、前後に移動しても変わらない', () => {
  let s = N.createPracticeNav(3)
  s = N.goNext(answer(s, 0, true))
  s = N.goNext(answer(s, 0, false))
  s = answer(s, 0, true)
  const before = N.answeredResults(s)
  s = N.goNext(N.goPrev(N.goPrev(s)))
  assert.deepEqual(N.answeredResults(s), before)
  assert.deepEqual(before, [true, false, true])
  assert.equal(N.answeredCount(s), 3)
})

test('9. 途中再開：前回までの正誤と選択肢を復元し、次の未回答の問題から始める', () => {
  let s = N.createPracticeNav(5, [true, false], [1, null])
  assert.equal(s.index, 2)
  assert.equal(N.answeredCount(s), 2)
  s = N.goPrev(s)
  assert.equal(N.shownChoice(s, 1), null, '選択肢の記録がない旧データ')
  assert.equal(s.results[1], false)
  s = N.goPrev(s)
  assert.equal(N.shownChoice(s, 0), 1)
  assert.equal(N.goTo(s, 3), s, '再開後も未回答の先へは飛ばせない')
})

test('10. 全問回答済みの再開データでは最後の問題から始まる', () => {
  const s = N.createPracticeNav(2, [true, true])
  assert.equal(s.index, 1)
  assert.equal(N.canFinish(s), true)
})

test('11. 0問・範囲外の移動でも壊れない', () => {
  const z = N.createPracticeNav(0)
  assert.equal(N.canGoPrev(z), false)
  assert.equal(N.canFinish(z), false)
  const s = N.createPracticeNav(2)
  assert.equal(N.goTo(s, -1), s)
  assert.equal(N.goTo(s, 9), s)
})

test('12. 年度別：selectedIndex 付きで保存・読み戻せ、旧データ（無し）と混在しても有効', () => {
  store.set(
    S.PAST_EXAM_SESSION_KEY,
    JSON.stringify({ '34': { examRound: 34, answers: [{ questionId: '34-001', questionNumber: 1, correct: true }], completed: false, updatedAt: 1 } }),
  )
  S.savePastExamProgress(34, { questionId: '34-002', questionNumber: 2, correct: false, selectedIndex: 3 })
  const got = S.getPastExamSession(34)
  assert.ok(got)
  assert.equal(got.answers.length, 2)
  assert.equal(got.answers[0].selectedIndex, undefined)
  assert.equal(got.answers[1].selectedIndex, 3)
})

test('13. 科目別：selectedIndex 付きで保存でき、並べ直し後も残る', () => {
  const order = ['a', 'b', 'c']
  SS.savePastExamSubjectProgress('anatomy', order, { questionId: 'a', correct: true, selectedIndex: 0 })
  SS.savePastExamSubjectProgress('anatomy', order, { questionId: 'b', correct: false })
  const s = SS.getPastExamSubjectSession('anatomy')
  assert.ok(s)
  const r = SS.resolveSubjectSession(s, order)
  assert.ok(r)
  assert.equal(r.status, 'in-progress')
  assert.equal(r.answers[0].selectedIndex, 0)
  assert.equal(r.answers[1].selectedIndex, undefined)
})

console.log(`\n${n} tests passed`)
