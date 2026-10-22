#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   過去問演習の「途中から再開」（BUSINESS-35）のテスト
   `npm run test:resume`
   - 各回の収録データが問1から連番（HOME の再開位置の算出が Runner の判定と一致する前提）
   - 保存済みセッションの要約：途中／全問回答済み／壊れたデータ／回どうしの分離
   - 要約・一覧は読み取りのみで、localStorage に書き込まない
   - 回答履歴（shinkyuu_pastexam_history_v1）・他の学習記録に触れない
   - 過去問データ（正答を含む）が HEAD から変わっていない
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
process.chdir(ROOT)

/* localStorage の代わり。書き込み回数を数える */
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

const { pastExamCoverage, loadPastExamQuestions } = await import('../src/lib/pastExams')
const S = await import('../src/lib/pastExamSession')
const { PAST_EXAM_HISTORY_KEY, recordPastExamAttempt, getPastExamHistory } = await import('../src/lib/pastExamStorage')

let n = 0
function test(name: string, fn: () => void) {
  store.clear()
  writes = 0
  fn()
  n++
  console.log(`  ✓ ${name}`)
}

const coverage = pastExamCoverage().filter((c) => c.available)
const totals: Record<number, number> = Object.fromEntries(coverage.map((c) => [c.round, c.playable]))
const pad = (r: number, q: number) => `${r}-${String(q).padStart(3, '0')}`
function answerUpTo(round: number, count: number, correctEvery = 2) {
  for (let q = 1; q <= count; q++) {
    S.savePastExamProgress(round, { questionId: pad(round, q), questionNumber: q, correct: q % correctEvery === 0 })
  }
}

console.log('収録データの前提')
test('1. 各回の演習問題は問1から連番で、questionId は「回-3桁番号」', () => {
  assert.ok(coverage.length >= 6)
  for (const c of coverage) {
    const qs = loadPastExamQuestions(c.round)
    assert.equal(qs.length, c.playable)
    qs.forEach((q, i) => {
      assert.equal(q.questionNumber, i + 1, `第${c.round}回 ${q.id}`)
      assert.equal(q.id, pad(c.round, i + 1))
    })
  }
})

console.log('途中から再開')
test('2. 途中の回は in-progress で、次は「回答済み数 + 1」問目', () => {
  answerUpTo(34, 12)
  const [s] = S.listPastExamSessionSummaries(totals)
  assert.equal(s.examRound, 34)
  assert.equal(s.status, 'in-progress')
  assert.equal(s.answered, 12)
  assert.equal(s.correct, 6)
  assert.equal(s.total, 180)
  assert.equal(s.nextQuestionNumber, 13)
})
test('3. 同じ問題に答え直しても二重に数えない', () => {
  answerUpTo(34, 5)
  S.savePastExamProgress(34, { questionId: '34-005', questionNumber: 5, correct: true })
  const [s] = S.listPastExamSessionSummaries(totals)
  assert.equal(s.answered, 5)
  assert.equal(s.nextQuestionNumber, 6)
})
test('4. 複数の回が途中でも記録は混ざらず、最近解いた順に並ぶ', () => {
  answerUpTo(34, 10)
  const t = Date.now
  Date.now = () => t() + 60_000
  answerUpTo(31, 3)
  Date.now = t
  const list = S.listPastExamSessionSummaries(totals)
  assert.deepEqual(list.map((s) => [s.examRound, s.answered, s.nextQuestionNumber]), [[31, 3, 4], [34, 10, 11]])
})
test('5. 最初からやり直すと、その回のセッションだけが消える（他の回・回答履歴は残る）', () => {
  answerUpTo(34, 10)
  answerUpTo(33, 4)
  recordPastExamAttempt({ questionId: '34-001', examRound: 34, correct: true })
  S.resetPastExamSession(34)
  assert.equal(S.getPastExamSession(34), null)
  assert.equal(S.getPastExamSession(33)?.answers.length, 4)
  assert.equal(getPastExamHistory().length, 1)
})

console.log('完了の扱い')
test('6. 結果画面まで進んだ回は completed（HOME の「続きから」には出ない）', () => {
  answerUpTo(32, 180)
  S.markPastExamSessionCompleted(32)
  const [s] = S.listPastExamSessionSummaries(totals)
  assert.equal(s.status, 'completed')
  assert.equal(s.correct, 90)
})
test('7. 最終問に答えて「結果を見る」を押さずに閉じても completed として扱う', () => {
  answerUpTo(30, 180)
  const [s] = S.listPastExamSessionSummaries(totals)
  assert.equal(s.status, 'completed')
  assert.equal(s.nextQuestionNumber, 181)
})

console.log('壊れた・合わないデータ')
test('8. 壊れた JSON・形の違うデータ・連番でない回答は再開対象にしない（例外も出さない）', () => {
  store.set(S.PAST_EXAM_SESSION_KEY, '{broken')
  assert.deepEqual(S.listPastExamSessionSummaries(totals), [])
  store.set(S.PAST_EXAM_SESSION_KEY, JSON.stringify({ 34: { examRound: 33, answers: [], completed: false, updatedAt: 1 } }))
  assert.deepEqual(S.listPastExamSessionSummaries(totals), [])
  store.set(
    S.PAST_EXAM_SESSION_KEY,
    JSON.stringify({ 34: { examRound: 34, answers: [{ questionId: '34-002', questionNumber: 2, correct: true }], completed: false, updatedAt: 1 } }),
  )
  assert.deepEqual(S.listPastExamSessionSummaries(totals), [])
  store.set(S.PAST_EXAM_SESSION_KEY, JSON.stringify({ 34: { examRound: 34, answers: [], completed: false, updatedAt: 1 } }))
  assert.deepEqual(S.listPastExamSessionSummaries(totals), [])
})
test('9. completed なのに全問そろっていないデータは再開対象にも完了にもしない', () => {
  answerUpTo(29, 3)
  S.markPastExamSessionCompleted(29)
  assert.deepEqual(S.listPastExamSessionSummaries(totals), [])
})

console.log('既存の記録への影響')
test('10. 要約・一覧は読み取りだけで、localStorage に書き込まない', () => {
  answerUpTo(34, 7)
  store.set(PAST_EXAM_HISTORY_KEY, '[]')
  store.set('shinkyuu_quiz_history_v1', '{"x":1}')
  const snapshot = new Map(store)
  writes = 0
  S.listPastExamSessionSummaries(totals)
  S.summarizePastExamSession(S.getPastExamSession(34)!, 180)
  assert.equal(writes, 0)
  assert.deepEqual(store, snapshot)
})
test('11. 過去問データ（問題・選択肢・正答）と学習記録の保存処理が HEAD から変わっていない', () => {
  const changed = execSync(
    'git diff --name-only HEAD -- src/data/pastExams src/lib/pastExamStorage.ts src/lib/pastExamAnswers.ts src/lib/quizStorage.ts src/lib/dailyQuiz.ts src/lib/learningDataTransfer.ts',
    { encoding: 'utf8' },
  ).trim()
  assert.equal(changed, '', `変更あり: ${changed}`)
})

console.log(`\n${n} tests passed`)
