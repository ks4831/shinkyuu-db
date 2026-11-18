#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   年度別過去問の午前・午後区分と成績・保存（Sprint 25）のテスト
   `npm run test:parts`
   - 区分は公式PDF（sourceUrl の _am.pdf／_pm.pdf）から決まり、第29〜34回すべてで
     午前＝問1〜90（90問）、午後＝問91〜180（90問）。問題番号・ID・解答の数も確認
   - 区分が確認できないデータでは区分を使わない（null）
   - 成績の集計：正答率の分母＝出題数、未回答は得点なし
   - 午前・午後の途中経過は全問の記録（shinkyuu_pastexam_session_v1）と別キーで、互いに触れない
   - 学習記録の書き出し・読み込みで新しいキーを扱える／壊れた形は拒否する
   - 過去問データ（問題文・正答・解説・科目分類）が HEAD から変わっていない
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
process.chdir(ROOT)

const store = new Map<string, string>()
const localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
}
;(globalThis as unknown as { window: unknown }).window = { localStorage }

const { pastExamCoverage, loadPastExamQuestions } = await import('../src/lib/pastExams')
const P = await import('../src/lib/pastExamParts')
const S = await import('../src/lib/pastExamSession')
const T = await import('../src/lib/learningDataTransfer')
const { getAcceptedAnswerIndexes } = await import('../src/lib/pastExamAnswers')

let n = 0
function test(name: string, fn: () => void) {
  store.clear()
  fn()
  n++
  console.log(`  ✓ ${name}`)
}

const ROUNDS = [29, 30, 31, 32, 33, 34]

console.log('午前・午後の区分（公式PDFの出典から）')
for (const round of ROUNDS) {
  test(`第${round}回：午前 問1〜90／午後 問91〜180、各90問・解答あり`, () => {
    const qs = loadPastExamQuestions(round)
    assert.equal(qs.length, 180)
    const split = P.splitPastExamParts(qs)
    assert.ok(split, '区分が確認できること')
    assert.deepEqual(split!.am.map((q) => q.questionNumber), Array.from({ length: 90 }, (_, i) => i + 1))
    assert.deepEqual(split!.pm.map((q) => q.questionNumber), Array.from({ length: 90 }, (_, i) => i + 91))
    for (const q of split!.am) assert.match(q.sourceUrl, new RegExp(`mondai_${round}_harikyu_am\\.pdf$`))
    for (const q of split!.pm) assert.match(q.sourceUrl, new RegExp(`mondai_${round}_harikyu_pm\\.pdf$`))
    for (const q of qs) {
      assert.equal(q.id, `${round}-${String(q.questionNumber).padStart(3, '0')}`)
      assert.ok(getAcceptedAnswerIndexes(q).length >= 1, `${q.id} に正答がある`)
      assert.equal(q.choices.length, 4)
    }
    const cov = pastExamCoverage().find((c) => c.round === round)!
    assert.deepEqual(cov.parts, [
      { part: 'am', count: 90, firstNumber: 1, lastNumber: 90 },
      { part: 'pm', count: 90, firstNumber: 91, lastNumber: 180 },
    ])
  })
}

test('区分が読めない問題が1問でもあれば区分を使わない', () => {
  const qs = loadPastExamQuestions(34)
  assert.equal(P.splitPastExamParts(qs.map((q, i) => (i === 5 ? { ...q, part: undefined } : q))), null)
  assert.equal(P.splitPastExamParts(qs.filter((q) => q.part === 'am')), null, '午後が0問')
  assert.equal(P.splitPastExamParts([{ questionNumber: 1, part: 'pm' as const }, { questionNumber: 2, part: 'am' as const }]), null, '午前・午後が逆順')
  assert.equal(P.pastExamPartFromSourceUrl('https://example.com/x.pdf'), undefined)
  assert.equal(P.pastExamPartFromSourceUrl(undefined), undefined)
})

console.log('成績の集計')
test('正答率＝正解数 ÷ 出題数（未回答は得点なし）', () => {
  const s = P.scorePastExam([true, false, null, true, undefined])
  assert.deepEqual(s, { total: 5, answered: 3, correct: 2, wrong: 1, unanswered: 2, pct: 40, answeredPct: 67 })
  const full = P.scorePastExam([true, true, false])
  assert.equal(full.pct, 67)
  assert.equal(full.unanswered, 0)
  const none = P.scorePastExam([null, null])
  assert.equal(none.pct, 0)
  assert.equal(none.answeredPct, null)
  assert.equal(P.scorePastExam([]).pct, 0)
})
test('全問回答時の正答率は従来の Math.round(正解/問題数) と同じ', () => {
  for (let c = 0; c <= 180; c += 7) {
    const r = Array.from({ length: 180 }, (_, i) => i < c)
    assert.equal(P.scorePastExam(r).pct, Math.round((c / 180) * 100))
  }
})

console.log('午前・午後の途中経過（別キー）')
const ans = (round: number, num: number, correct: boolean, selectedIndex = 0) => ({
  questionId: `${round}-${String(num).padStart(3, '0')}`,
  questionNumber: num,
  correct,
  selectedIndex,
})
for (const round of ROUNDS) {
  test(`第${round}回：午前・午後・全問の保存が混ざらず、再開位置が正しい`, () => {
    for (let q = 1; q <= 12; q++) S.savePastExamProgress(round, ans(round, q, q % 2 === 0))
    for (let q = 1; q <= 30; q++) S.savePastExamPartProgress(round, 'am', ans(round, q, q % 3 === 0))
    for (let q = 91; q <= 95; q++) S.savePastExamPartProgress(round, 'pm', ans(round, q, true, 2))
    assert.equal(S.getPastExamSession(round)!.answers.length, 12)
    assert.equal(S.getPastExamPartSession(round, 'am')!.answers.length, 30)
    assert.equal(S.getPastExamPartSession(round, 'pm')!.answers.length, 5)
    const am = S.summarizePastExamSession(S.getPastExamPartSession(round, 'am')!, 90, 1)!
    assert.equal(am.nextQuestionNumber, 31)
    assert.equal(am.correct, 10)
    const pm = S.summarizePastExamSession(S.getPastExamPartSession(round, 'pm')!, 90, 91)!
    assert.equal(pm.nextQuestionNumber, 96)
    assert.equal(pm.status, 'in-progress')
    // 午後の記録を問1始まりとして読むと連番にならず、再開対象にしない
    assert.equal(S.summarizePastExamSession(S.getPastExamPartSession(round, 'pm')!, 90, 1), null)
    // 片方だけ消しても他は残る
    const fullRaw = store.get(S.PAST_EXAM_SESSION_KEY)
    S.resetPastExamPartSession(round, 'am')
    assert.equal(S.getPastExamPartSession(round, 'am'), null)
    assert.equal(S.getPastExamPartSession(round, 'pm')!.answers.length, 5)
    assert.equal(store.get(S.PAST_EXAM_SESSION_KEY), fullRaw, '全問の記録は1文字も変わらない')
  })
}
test('完了の記録・同じ問題の二重保存なし・全問回答で completed', () => {
  for (let q = 91; q <= 180; q++) S.savePastExamPartProgress(34, 'pm', ans(34, q, q <= 150))
  S.savePastExamPartProgress(34, 'pm', ans(34, 180, false))
  const s = S.getPastExamPartSession(34, 'pm')!
  assert.equal(s.answers.length, 90)
  assert.equal(s.completed, false)
  S.markPastExamPartSessionCompleted(34, 'pm')
  const done = S.summarizePastExamSession(S.getPastExamPartSession(34, 'pm')!, 90, 91)!
  assert.equal(done.status, 'completed')
  assert.equal(done.correct, 60)
  assert.equal(store.has(S.PAST_EXAM_SESSION_KEY), false, '全問のキーには書き込まない')
})
test('壊れた・形の違う記録は無いものとして扱う', () => {
  store.set(S.PAST_EXAM_PART_SESSION_KEY, '{broken')
  assert.equal(S.getPastExamPartSession(34, 'am'), null)
  store.set(S.PAST_EXAM_PART_SESSION_KEY, JSON.stringify({ '34-am': { examRound: 34, part: 'pm', answers: [], completed: false, updatedAt: 1 } }))
  assert.equal(S.getPastExamPartSession(34, 'am'), null, '区分が違う')
  store.set(S.PAST_EXAM_PART_SESSION_KEY, JSON.stringify({ '34-am': { examRound: 33, part: 'am', answers: [], completed: false, updatedAt: 1 } }))
  assert.equal(S.getPastExamPartSession(34, 'am'), null, '回が違う')
  // 壊れていても保存し直せる
  S.savePastExamPartProgress(34, 'am', ans(34, 1, true))
  assert.equal(S.getPastExamPartSession(34, 'am')!.answers.length, 1)
})
test('HOME向けの一覧：午前・午後の途中を新しい順に返す（書き込みなし）', () => {
  S.savePastExamPartProgress(33, 'am', ans(33, 1, true))
  S.savePastExamPartProgress(34, 'pm', ans(34, 91, true))
  const ranges = Object.fromEntries(pastExamCoverage().filter((c) => c.available).map((c) => [c.round, c.parts]))
  const before = store.get(S.PAST_EXAM_PART_SESSION_KEY)
  const list = S.listPastExamPartSessionSummaries(ranges)
  assert.equal(store.get(S.PAST_EXAM_PART_SESSION_KEY), before)
  assert.equal(list.length, 2)
  assert.deepEqual(
    list.map((s) => [s.examRound, s.part, s.nextQuestionNumber]).sort(),
    [[33, 'am', 2], [34, 'pm', 92]],
  )
})

console.log('学習記録の書き出し・読み込み')
test('新しいキーは書き出しに含まれ、読み込みで検査される', () => {
  S.savePastExamPartProgress(34, 'am', ans(34, 1, true))
  S.savePastExamProgress(34, ans(34, 1, false))
  const file = T.buildExport(new Date('2026-11-18T00:00:00Z'))
  assert.ok(S.PAST_EXAM_PART_SESSION_KEY in file.data)
  assert.ok(S.PAST_EXAM_SESSION_KEY in file.data)
  const ok = T.parseImport(JSON.stringify(file))
  assert.equal(ok.ok, true)
  const bad = structuredClone(file) as typeof file
  ;(bad.data[S.PAST_EXAM_PART_SESSION_KEY] as Record<string, unknown>)['34-pm'] = (bad.data[S.PAST_EXAM_PART_SESSION_KEY] as Record<string, unknown>)['34-am']
  assert.equal(T.parseImport(JSON.stringify(bad)).ok, false, 'キーと中身の区分が一致しない')
  assert.equal(T.countItems(S.PAST_EXAM_PART_SESSION_KEY, file.data[S.PAST_EXAM_PART_SESSION_KEY]), 1)
})
test('このキーを含まない以前のファイルもそのまま読める', () => {
  const old = { format: T.TRANSFER_FORMAT, version: T.TRANSFER_VERSION, exportedAt: 'x', data: { shinkyuu_pastexam_session_v1: { '34': { examRound: 34, answers: [], completed: false, updatedAt: 1 } } } }
  assert.equal(T.parseImport(JSON.stringify(old)).ok, true)
})

console.log('データの保護')
test('過去問データ（問題文・正答・解説・出典）と分析CSV（科目分類）が HEAD から変わっていない', () => {
  const diff = execSync('git status --porcelain -- src/data/pastExams src/data/raw', { encoding: 'utf8' })
  assert.equal(diff.trim(), '')
})

console.log(`\n${n} tests passed`)
