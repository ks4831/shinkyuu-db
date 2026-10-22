#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   科目別過去問の「途中から再開」（BUSINESS-36）のテスト
   `npm run test:subject-resume`
   - 科目別の出題順は固定（年度→問題番号）で、毎回同じ
   - 回答ごとの保存・再開位置・正誤の維持・科目どうしの分離
   - 「最初から」はその科目のセッションだけを消し、回答履歴・年度別セッション・他科目は残す
   - 全問回答で完了扱い
   - 問題データが増減しても、途中の記録を壊さずに再開できる
   - 要約・一覧は読み取りのみ
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
process.chdir(ROOT)

const store = new Map<string, string>()
let writes = 0
const localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => {
    writes++
    store.set(k, String(v))
  },
  removeItem: (k: string) => {
    writes++
    store.delete(k)
  },
}
;(globalThis as unknown as { window: unknown }).window = { localStorage }

const { loadPastExamQuestionsBySubject, pastExamCountsBySubject } = await import('../src/lib/pastExams')
const T = await import('../src/lib/pastExamSubjectSession')
const R = await import('../src/lib/pastExamSession')
const { PAST_EXAM_HISTORY_KEY, recordPastExamAttempt, getPastExamHistory } = await import('../src/lib/pastExamStorage')

let n = 0
function test(name: string, fn: () => void) {
  store.clear()
  writes = 0
  fn()
  n++
  console.log(`  ✓ ${name}`)
}

const anatomy = loadPastExamQuestionsBySubject('anatomy').map((q) => q.id)
const physiology = loadPastExamQuestionsBySubject('physiology').map((q) => q.id)
const counts = pastExamCountsBySubject()

/** 実際の操作と同じ順で、先頭から count 問に回答する（回答履歴にも記録する） */
function answer(subjectId: string, ids: string[], count: number, from = 0) {
  for (let i = from; i < from + count; i++) {
    const correct = i % 2 === 0
    recordPastExamAttempt({ questionId: ids[i], examRound: Number(ids[i].slice(0, 2)), correct })
    T.savePastExamSubjectProgress(subjectId, ids, { questionId: ids[i], correct })
  }
}

console.log('出題順')
test('1. 科目別の出題順は固定（同じ呼び出しで同じ順）で、科目の問題数と一致する', () => {
  assert.ok(anatomy.length > 3 && physiology.length > 3)
  assert.deepEqual(loadPastExamQuestionsBySubject('anatomy').map((q) => q.id), anatomy)
  assert.equal(counts.anatomy, anatomy.length)
  assert.equal(counts.physiology, physiology.length)
})

console.log('途中から再開')
test('2. 3問回答 → 4問目から再開できる。正誤も保存どおり', () => {
  answer('anatomy', anatomy, 3)
  const s = T.getPastExamSubjectSession('anatomy')!
  const r = T.resolveSubjectSession(s, anatomy)!
  assert.equal(r.status, 'in-progress')
  assert.equal(r.answers.length, 3)
  assert.deepEqual(r.answers.map((a) => a.questionId), anatomy.slice(0, 3))
  assert.deepEqual(r.answers.map((a) => a.correct), [true, false, true])
  assert.equal(r.order[r.answers.length], anatomy[3])
  const sum = T.summarizeSubjectSession(s, anatomy.length)!
  assert.equal(sum.answered, 3)
  assert.equal(sum.status, 'in-progress')
})
test('3. 保存内容は localStorage に残り、読み直しても同じ（リロード相当）', () => {
  answer('anatomy', anatomy, 3)
  const raw = store.get(T.PAST_EXAM_SUBJECT_SESSION_KEY)!
  const again = JSON.parse(raw).anatomy
  assert.equal(again.answers.length, 3)
  assert.deepEqual(T.getPastExamSubjectSession('anatomy'), again)
})
test('4. 同じ問題に答え直しても二重に数えない', () => {
  answer('anatomy', anatomy, 3)
  T.savePastExamSubjectProgress('anatomy', anatomy, { questionId: anatomy[2], correct: false })
  assert.equal(T.getPastExamSubjectSession('anatomy')!.answers.length, 3)
})
test('5. 解剖学と生理学を並行しても記録は混ざらない。HOME 用の一覧は最近解いた順', () => {
  answer('anatomy', anatomy, 3)
  answer('physiology', physiology, 5)
  const a = T.resolveSubjectSession(T.getPastExamSubjectSession('anatomy')!, anatomy)!
  const p = T.resolveSubjectSession(T.getPastExamSubjectSession('physiology')!, physiology)!
  assert.equal(a.answers.length, 3)
  assert.equal(p.answers.length, 5)
  assert.ok(a.answers.every((x) => anatomy.includes(x.questionId)))
  assert.ok(p.answers.every((x) => physiology.includes(x.questionId)))
  const list = T.listSubjectSessionSummaries(counts)
  assert.deepEqual(list.map((x) => x.subjectId).sort(), ['anatomy', 'physiology'])
  assert.ok(list[0].updatedAt >= list[1].updatedAt)
})
test('6. 年度別のセッションと別キーで、互いに影響しない', () => {
  R.savePastExamProgress(34, { questionId: '34-001', questionNumber: 1, correct: true })
  answer('anatomy', anatomy, 2)
  assert.notEqual(T.PAST_EXAM_SUBJECT_SESSION_KEY, R.PAST_EXAM_SESSION_KEY)
  assert.equal(R.getPastExamSession(34)!.answers.length, 1)
  T.resetPastExamSubjectSession('anatomy')
  assert.equal(R.getPastExamSession(34)!.answers.length, 1)
})

console.log('最初から・完了')
test('7. 最初からやり直すと、その科目のセッションだけが消える（回答履歴・他科目・年度別は残る）', () => {
  R.savePastExamProgress(34, { questionId: '34-001', questionNumber: 1, correct: true })
  answer('anatomy', anatomy, 3)
  answer('physiology', physiology, 2)
  const historyBefore = store.get(PAST_EXAM_HISTORY_KEY)
  T.resetPastExamSubjectSession('anatomy')
  assert.equal(T.getPastExamSubjectSession('anatomy'), null)
  assert.equal(T.getPastExamSubjectSession('physiology')!.answers.length, 2)
  assert.equal(R.getPastExamSession(34)!.answers.length, 1)
  assert.equal(store.get(PAST_EXAM_HISTORY_KEY), historyBefore)
  assert.equal(getPastExamHistory().length, 5)
})
test('8. 全問に回答すると completed（「結果を見る」を押さずに閉じた場合も）', () => {
  answer('physiology', physiology, physiology.length)
  const s = T.getPastExamSubjectSession('physiology')!
  assert.equal(T.resolveSubjectSession(s, physiology)!.status, 'completed')
  assert.equal(T.summarizeSubjectSession(s, physiology.length)!.status, 'completed')
  T.markPastExamSubjectSessionCompleted('physiology')
  assert.equal(T.getPastExamSubjectSession('physiology')!.completed, true)
  assert.equal(T.listSubjectSessionSummaries(counts).filter((x) => x.status === 'in-progress').length, 0)
})

console.log('問題データの更新・壊れたデータ')
test('9. 問題が削除・追加されても、保存時の順を基準に先頭から続けられる（記録は消さない）', () => {
  answer('anatomy', anatomy, 4)
  const saved = store.get(T.PAST_EXAM_SUBJECT_SESSION_KEY)
  // 2問目（回答済み）と10問目（未回答）が科目から外れ、新しい問題が先頭側に1問入った場合
  const updated = ['99-001', ...anatomy.filter((_, i) => i !== 1 && i !== 9)]
  const r = T.resolveSubjectSession(T.getPastExamSubjectSession('anatomy')!, updated)!
  assert.equal(r.status, 'in-progress')
  assert.deepEqual(r.answers.map((a) => a.questionId), [anatomy[0], anatomy[2], anatomy[3]])
  assert.equal(r.order.length, updated.length)
  assert.equal(r.order[r.order.length - 1], '99-001')
  assert.deepEqual(new Set(r.order), new Set(updated))
  assert.equal(store.get(T.PAST_EXAM_SUBJECT_SESSION_KEY), saved)
})
test('10. 壊れた JSON・形の違うデータ・先頭から連続しない回答は再開対象にしない（消さない・例外なし）', () => {
  store.set(T.PAST_EXAM_SUBJECT_SESSION_KEY, '{broken')
  assert.equal(T.getPastExamSubjectSession('anatomy'), null)
  store.set(T.PAST_EXAM_SUBJECT_SESSION_KEY, JSON.stringify({ anatomy: { subjectId: 'anatomy', answers: [] } }))
  assert.equal(T.getPastExamSubjectSession('anatomy'), null)
  const gap = { subjectId: 'anatomy', order: anatomy, answers: [{ questionId: anatomy[0], correct: true }, { questionId: anatomy[5], correct: true }], completed: false, updatedAt: 1 }
  store.set(T.PAST_EXAM_SUBJECT_SESSION_KEY, JSON.stringify({ anatomy: gap }))
  assert.equal(T.resolveSubjectSession(T.getPastExamSubjectSession('anatomy')!, anatomy), null)
  assert.ok(store.get(T.PAST_EXAM_SUBJECT_SESSION_KEY)!.includes(anatomy[5]))
})
test('11. 要約・一覧・並べ直しは読み取りだけで、localStorage に書き込まない', () => {
  answer('anatomy', anatomy, 3)
  const before = writes
  T.listSubjectSessionSummaries(counts)
  T.resolveSubjectSession(T.getPastExamSubjectSession('anatomy')!, anatomy)
  T.summarizeSubjectSession(T.getPastExamSubjectSession('anatomy')!, anatomy.length)
  assert.equal(writes, before)
})

console.log(`\n${n} tests passed`)
