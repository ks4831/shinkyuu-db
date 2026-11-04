/**
 * オリジナル模擬試験②の科目別モードと解答途中の保存の検査。ブラウザの localStorage を模したもので確かめる。
 * - 12科目の問題数・科目内の順序・問題の取りこぼしがないこと・問題データのハッシュ
 * - 科目別の結果は別キーに保存し、全問の成績（v1〜v5）と見直しの記録に触れない
 * - 途中経過は全問・科目ごとに別の枠。壊れたデータ・問題が変わったデータは使わない
 * 実行：npm run test:original-mock-subject
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ORIGINAL_MOCK_LEGACY_RESULT_KEYS,
  ORIGINAL_MOCK_PROGRESS_KEY,
  ORIGINAL_MOCK_RESULT_KEY,
  ORIGINAL_MOCK_REVIEW_KEY,
  ORIGINAL_MOCK_SUBJECT_RESULT_KEY,
  clearOriginalMockProgress,
  getOriginalMockProgress,
  getOriginalMockSubjectResult,
  questionsBySubject,
  questionsFingerprint,
  saveOriginalMockProgress,
  saveOriginalMockSubjectResult,
  type OriginalMockData,
  type OriginalMockSubjectResult,
} from '../src/lib/originalMock'
import { confirmAnswer, createMockSession, goNext, hasProgress, parseMockSession, selectChoice, startEditing } from '../src/lib/mockSession'
import { ALL100_QUESTIONS_SHA256 } from './original-mock-02-lock'

let fail = 0
function check(label: string, cond: boolean, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  (' + detail + ')' : ''}`)
  if (!cond) fail++
}

const store = new Map<string, string>()
let quotaExceeded = false
;(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (quotaExceeded) throw new Error('QuotaExceededError')
      store.set(k, v)
    },
    removeItem: (k: string) => void store.delete(k),
  },
}

const data = JSON.parse(readFileSync(join(process.cwd(), 'src/data/originalMocks/original-mock-02.json'), 'utf8')) as OriginalMockData
const qs = data.questions
const MOCK = data.mockId

// 1. 問題データと科目の分け方
const hash = createHash('sha256').update(JSON.stringify(qs)).digest('hex')
check('問題配列のハッシュがロックと一致する', hash === ALL100_QUESTIONS_SHA256, hash)
const EXPECTED: [string, number][] = [
  ['経絡経穴概論', 20],
  ['はり理論', 10],
  ['きゅう理論', 10],
  ['臨床医学各論', 22],
  ['臨床医学総論', 5],
  ['リハビリテーション医学', 1],
  ['医療概論', 4],
  ['衛生学・公衆衛生学', 5],
  ['関係法規', 4],
  ['解剖学', 7],
  ['生理学', 7],
  ['病理学概論', 5],
]
const groups = questionsBySubject(qs)
check('12科目の名前・順序・問題数が指定どおり', JSON.stringify(groups.map((g) => [g.subject, g.questions.length])) === JSON.stringify(EXPECTED))
check('問題数の合計が100', groups.reduce((n, g) => n + g.questions.length, 0) === 100)
check('各科目にはその科目の問題だけが入る', groups.every((g) => g.questions.every((q) => q.subject === g.subject)))
check('科目内の順序は元データの順序', groups.every((g) => g.questions.every((q, i) => i === 0 || g.questions[i - 1].questionNumber < q.questionNumber)))
check('全100問が1回ずつどれかの科目に入る', new Set(groups.flatMap((g) => g.questions.map((q) => q.id))).size === 100)

// 2. 指紋
const [hari, kyu] = [groups[1], groups[2]]
const fp = questionsFingerprint(hari.questions)
check('指紋は同じ問題で同じ値', fp === questionsFingerprint(structuredClone(hari.questions)))
const mutate = (fn: (q: (typeof qs)[number]) => void) => {
  const c = structuredClone(hari.questions)
  fn(c[3])
  return questionsFingerprint(c)
}
check('正答が変わると指紋が変わる', mutate((q) => (q.answerIndex = (q.answerIndex + 1) % 4)) !== fp)
check('選択肢が変わると指紋が変わる', mutate((q) => (q.choices[0] += 'x')) !== fp)
check('問題文が変わると指紋が変わる', mutate((q) => (q.questionText += 'x')) !== fp)
check('解説だけの修正では指紋は変わらない', mutate((q) => (q.point += 'x')) === fp)

// 3. セッションの復元
const ids = ['a', 'b', 'c']
let s = createMockSession(ids)
check('開いただけのセッションは途中データにしない', !hasProgress(s))
check('選択しただけで途中データになる', hasProgress(selectChoice(s, 1)))
check('あとで解くで進んだだけでも途中データになる', hasProgress(goNext(s)))
s = goNext(confirmAnswer(selectChoice(s, 2)))
s = selectChoice(s, 1)
check('回答・未確定の選択・位置が復元される', JSON.stringify(parseMockSession(JSON.parse(JSON.stringify(s)), ids)) === JSON.stringify(s))
const editing = startEditing(confirmAnswer(s))
check('変更中の状態も復元される', parseMockSession(JSON.parse(JSON.stringify(editing)), ids)?.editing[1] === true)
for (const [label, bad] of [
  ['null', null],
  ['配列', []],
  ['出題順が違う', { ...s, order: ['b', 'a', 'c'] }],
  ['問題数が違う', { ...s, order: ['a', 'b'] }],
  ['位置が範囲外', { ...s, index: 3 }],
  ['位置が負', { ...s, index: -1 }],
  ['位置が小数', { ...s, index: 0.5 }],
  ['回答の長さが違う', { ...s, answers: [1] }],
  ['選択の番号が範囲外', { ...s, answers: [4, null, null] }],
  ['選択が文字列', { ...s, drafts: ['1', null, null] }],
  ['変更中の配列がない', { ...s, editing: undefined }],
  ['未回答なのに変更中', { ...s, editing: [false, false, true] }],
] as const) check(`壊れたセッションは使わない：${label}`, parseMockSession(bad, ids) === null)

// 4. 途中経過の保存：枠が分かれていること
store.clear()
const hariSession = confirmAnswer(selectChoice(createMockSession(hari.questions.map((q) => q.id)), 1))
const kyuSession = confirmAnswer(selectChoice(createMockSession(kyu.questions.map((q) => q.id)), 2))
const fullSession = confirmAnswer(selectChoice(createMockSession(qs.map((q) => q.id)), 3))
check('保存できたら true', saveOriginalMockProgress(MOCK, hari.subject, hari.questions, hariSession))
saveOriginalMockProgress(MOCK, kyu.subject, kyu.questions, kyuSession)
saveOriginalMockProgress(MOCK, null, qs, fullSession)
check('はり理論の途中経過を読める', getOriginalMockProgress(MOCK, hari.subject, hari.questions)?.answers[0] === 1)
check('きゅう理論の途中経過は別', getOriginalMockProgress(MOCK, kyu.subject, kyu.questions)?.answers[0] === 2)
check('全問の途中経過は別', getOriginalMockProgress(MOCK, null, qs)?.answers[0] === 3)
check('別科目の問題では読めない', getOriginalMockProgress(MOCK, hari.subject, kyu.questions) === null)
check('途中データのない科目は null', getOriginalMockProgress(MOCK, groups[0].subject, groups[0].questions) === null)
const changed = structuredClone(hari.questions)
changed[0].answerIndex = (changed[0].answerIndex + 1) % 4
check('問題が変わったら途中データを使わない', getOriginalMockProgress(MOCK, hari.subject, changed) === null)
clearOriginalMockProgress(MOCK, hari.subject)
check('採点した枠だけ消える', getOriginalMockProgress(MOCK, hari.subject, hari.questions) === null && getOriginalMockProgress(MOCK, kyu.subject, kyu.questions) !== null && getOriginalMockProgress(MOCK, null, qs) !== null)
quotaExceeded = true
check('保存できない環境では false で落ちない', saveOriginalMockProgress(MOCK, null, qs, fullSession) === false)
clearOriginalMockProgress(MOCK, null)
quotaExceeded = false
for (const raw of ['{oops', '[1]', 'null', '7', JSON.stringify({ [`${MOCK}/full`]: 'x' }), JSON.stringify({ [`${MOCK}/full`]: { fingerprint: questionsFingerprint(qs), session: { order: [] } } })]) {
  store.set(ORIGINAL_MOCK_PROGRESS_KEY, raw)
  check(`壊れた途中データでも落ちず null：${raw.slice(0, 24)}`, getOriginalMockProgress(MOCK, null, qs) === null)
}
store.set(ORIGINAL_MOCK_PROGRESS_KEY, '{oops')
check('壊れた途中データのキーにも新しく保存できる', saveOriginalMockProgress(MOCK, null, qs, fullSession) && getOriginalMockProgress(MOCK, null, qs) !== null)

// 5. 科目別の結果：全問の成績に触れない
store.clear()
const guarded = [ORIGINAL_MOCK_RESULT_KEY, ...ORIGINAL_MOCK_LEGACY_RESULT_KEYS, ORIGINAL_MOCK_REVIEW_KEY]
guarded.forEach((k, i) => store.set(k, JSON.stringify({ [MOCK]: { marker: i } })))
const before = guarded.map((k) => store.get(k))
const wrongId = hari.questions[2].id
const result: OriginalMockSubjectResult = {
  mockId: MOCK,
  subject: hari.subject,
  fingerprint: questionsFingerprint(hari.questions),
  correct: 9,
  total: 10,
  wrongIds: [wrongId],
  completedAt: 123,
  selected: { [wrongId]: 1 },
}
saveOriginalMockSubjectResult(result)
saveOriginalMockSubjectResult({ ...result, subject: kyu.subject, fingerprint: questionsFingerprint(kyu.questions), wrongIds: [kyu.questions[0].id], selected: {} })
saveOriginalMockProgress(MOCK, null, qs, fullSession)
clearOriginalMockProgress(MOCK, null)
check('全問の成績 v1〜v5・見直しの記録は一字一句そのまま', JSON.stringify(guarded.map((k) => store.get(k))) === JSON.stringify(before))
check('科目の結果を読める', getOriginalMockSubjectResult(MOCK, hari.subject, hari.questions)?.selected[wrongId] === 1)
check('別の科目の結果を上書きしない', getOriginalMockSubjectResult(MOCK, kyu.subject, kyu.questions)?.wrongIds[0] === kyu.questions[0].id)
check('問題が変わったら科目の結果を使わない', getOriginalMockSubjectResult(MOCK, hari.subject, changed) === null)
const badResult = (patch: object) => {
  store.set(ORIGINAL_MOCK_SUBJECT_RESULT_KEY, JSON.stringify({ [MOCK]: { [hari.subject]: { ...result, ...patch } } }))
  return getOriginalMockSubjectResult(MOCK, hari.subject, hari.questions)
}
check('問題数が合わない結果は使わない', badResult({ total: 11 }) === null)
check('正答数と誤答数が合わない結果は使わない', badResult({ correct: 10 }) === null)
check('別の科目の問題IDを含む結果は使わない', badResult({ wrongIds: [kyu.questions[0].id] }) === null)
check('選択の番号が範囲外の結果は使わない', badResult({ selected: { [wrongId]: 4 } }) === null)
check('選択の記録がない結果は使わない', badResult({ selected: undefined }) === null)
for (const raw of ['{oops', '[]', 'null', JSON.stringify({ [MOCK]: 'x' }), JSON.stringify({ [MOCK]: { [hari.subject]: [] } })]) {
  store.set(ORIGINAL_MOCK_SUBJECT_RESULT_KEY, raw)
  check(`壊れた科目の結果でも落ちず null：${raw.slice(0, 24)}`, getOriginalMockSubjectResult(MOCK, hari.subject, hari.questions) === null)
}
store.set(ORIGINAL_MOCK_SUBJECT_RESULT_KEY, JSON.stringify({ [MOCK]: 'x' }))
saveOriginalMockSubjectResult(result)
check('壊れた科目の結果のキーにも新しく保存できる', getOriginalMockSubjectResult(MOCK, hari.subject, hari.questions) !== null)

console.log(fail === 0 ? '\nすべて成功' : `\n${fail}件 失敗`)
process.exit(fail === 0 ? 0 : 1)
