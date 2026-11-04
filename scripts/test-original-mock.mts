/**
 * オリジナル模擬試験②のデータと採点の検査。
 * - 先頭40問・追加18問・追加10問・追加12問・追加20問・公開済み58問・68問・80問が基準値（SHA-256）と一字一句同じか
 * - 取り込んだデータが作業フォルダの5つの成果物（questions-40.json・additions-18/10/12/20.json）と同じか
 * - 100問・科目別（12区分）の問題数・4択・正答1つ・解説の正誤表示と正答の一致
 * - 問題IDが重複せず、過去問・予想問題のIDとも重ならないか
 * - 採点（科目別の集計）
 * 実行：npm run test:original-mock
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { isOriginalMockCorrect, scoreBySubject, type OriginalMockData } from '../src/lib/originalMock'
import { FIRST40_QUESTIONS_SHA256, ADDITIONS18_QUESTIONS_SHA256, ADDITIONS10_QUESTIONS_SHA256, ADDITIONS12_QUESTIONS_SHA256, ADDITIONS20_QUESTIONS_SHA256, FIRST58_QUESTIONS_SHA256, FIRST68_QUESTIONS_SHA256, FIRST80_QUESTIONS_SHA256, ALL100_QUESTIONS_SHA256, QUESTION_KEYS } from './original-mock-02-lock'

const ROOT = join(import.meta.dirname, '..')
const SRC = 'C:/Users/serap/shinkyuu-db-audit/2026-10-original-mock-02/out/questions-40.json'
const ADD_SRC = 'C:/Users/serap/shinkyuu-db-audit/2026-11-original-mock-02-additions/out/additions-18.json'
const ADD2_SRC = 'C:/Users/serap/shinkyuu-db-audit/2026-11-original-mock-02-additions/out/additions-10.json'
const ADD3_SRC = 'C:/Users/serap/shinkyuu-db-audit/2026-11-original-mock-02-additions/out/additions-12.json'
const ADD4_SRC = 'C:/Users/serap/shinkyuu-db-audit/2026-11-original-mock-02-additions/out/additions-20.json'
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/originalMocks/original-mock-02.json'), 'utf8')) as OriginalMockData & { sourceSha256: string; additionsSourceSha256: string; additions2SourceSha256: string; additions3SourceSha256: string; additions4SourceSha256: string }
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

let fail = 0
function check(label: string, cond: boolean, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  (' + detail + ')' : ''}`)
  if (!cond) fail++
}

const qs = data.questions
check('100問', qs.length === 100, String(qs.length))
check('既存40問（第1〜40問）が承認済みの基準値と一字一句同じ（SHA-256）', sha256(JSON.stringify(qs.slice(0, 40))) === FIRST40_QUESTIONS_SHA256)
check('追加18問（第41〜58問）が承認済みの基準値と一字一句同じ（SHA-256）', sha256(JSON.stringify(qs.slice(40, 58))) === ADDITIONS18_QUESTIONS_SHA256)
check('公開済み58問（第1〜58問）が68問化の前と一字一句同じ（SHA-256）', sha256(JSON.stringify(qs.slice(0, 58))) === FIRST58_QUESTIONS_SHA256)
check('追加10問（第59〜68問）が基準値と一字一句同じ（SHA-256）', sha256(JSON.stringify(qs.slice(58, 68))) === ADDITIONS10_QUESTIONS_SHA256)
check('公開済み68問（第1〜68問）が基準値と一字一句同じ（SHA-256。om02-62 の注記追加後）', sha256(JSON.stringify(qs.slice(0, 68))) === FIRST68_QUESTIONS_SHA256)
check('追加12問（第69〜80問）が基準値と一字一句同じ（SHA-256）', sha256(JSON.stringify(qs.slice(68, 80))) === ADDITIONS12_QUESTIONS_SHA256)
check('公開済み80問（第1〜80問）が基準値と一字一句同じ（SHA-256。om02-62 の注記追加後）', sha256(JSON.stringify(qs.slice(0, 80))) === FIRST80_QUESTIONS_SHA256)
check('公開済み100問（第1〜100問）が基準値と一字一句同じ（SHA-256）', sha256(JSON.stringify(qs)) === ALL100_QUESTIONS_SHA256)
check('追加20問（第81〜100問）が基準値と一字一句同じ（SHA-256）', sha256(JSON.stringify(qs.slice(80))) === ADDITIONS20_QUESTIONS_SHA256)
const q62 = qs[61]
check('om02-62 は問題文・正答が変わらず、学習のポイントにAWGS2025の注記と根拠資料がある', q62.answerIndex === 3 && q62.questionText.startsWith('AWGS2019（') && q62.point.includes('AWGS2025') && q62.sources.some((x) => x.includes('日本肥満学会')))
const rows = scoreBySubject(qs, [])
check(
  '科目別12区分：経絡経穴概論20・はり理論10・きゅう理論10・臨床医学各論22・臨床医学総論5・リハビリテーション医学1・医療概論4・衛生学・公衆衛生学5・関係法規4・解剖学7・生理学7・病理学概論5（この順）',
  JSON.stringify(rows.map((r) => [r.subject, r.total])) === JSON.stringify([['経絡経穴概論', 20], ['はり理論', 10], ['きゅう理論', 10], ['臨床医学各論', 22], ['臨床医学総論', 5], ['リハビリテーション医学', 1], ['医療概論', 4], ['衛生学・公衆衛生学', 5], ['関係法規', 4], ['解剖学', 7], ['生理学', 7], ['病理学概論', 5]]),
  JSON.stringify(rows.map((r) => [r.subject, r.total])),
)
check('第69〜80問は基礎6科目を各2問（医療概論→衛生学・公衆衛生学→関係法規→解剖学→生理学→病理学概論の順）', JSON.stringify(qs.slice(68, 80).map((q) => q.subject)) === JSON.stringify(['医療概論', '医療概論', '衛生学・公衆衛生学', '衛生学・公衆衛生学', '関係法規', '関係法規', '解剖学', '解剖学', '生理学', '生理学', '病理学概論', '病理学概論']))
check('第81〜100問は医療概論2→衛生学・公衆衛生学3→関係法規2→解剖学5→生理学5→病理学概論3の順', JSON.stringify(qs.slice(80).map((q) => q.subject)) === JSON.stringify([...Array(2).fill('医療概論'), ...Array(3).fill('衛生学・公衆衛生学'), ...Array(2).fill('関係法規'), ...Array(5).fill('解剖学'), ...Array(5).fill('生理学'), ...Array(3).fill('病理学概論')]))
check('第69〜100問の科目名がサイトの科目定義（src/lib/data.ts）と同じ', qs.slice(68).every((q) => readFileSync(join(ROOT, 'src/lib/data.ts'), 'utf8').includes(`name: '${q.subject}'`)))
check('第81〜100問の正答の位置が1〜4に5問ずつ', JSON.stringify([0, 1, 2, 3].map((i) => qs.slice(80).filter((q) => q.answerIndex === i).length)) === '[5,5,5,5]')
check('全100問の正答の位置が1〜4に25問ずつ', JSON.stringify([0, 1, 2, 3].map((i) => qs.filter((q) => q.answerIndex === i).length)) === '[25,25,25,25]')
check('第69〜80問の正答の位置が1〜4に3問ずつ', JSON.stringify([0, 1, 2, 3].map((i) => qs.slice(68, 80).filter((q) => q.answerIndex === i).length)) === '[3,3,3,3]')
check('第41〜68問は臨床医学・リハビリテーション医学だけ', qs.slice(40, 68).every((q) => ['臨床医学各論', '臨床医学総論', 'リハビリテーション医学'].includes(q.subject)))
check('問題番号が1〜100の連番', qs.every((q, i) => q.questionNumber === i + 1))
check('IDが om02-01〜om02-100 の連番', qs.every((q, i) => q.id === `om02-${String(i + 1).padStart(2, '0')}`))
check('全問のキーが同じ名前・同じ並び', qs.every((q) => JSON.stringify(Object.keys(q)) === JSON.stringify(QUESTION_KEYS)))
check('問題文・作業IDが重複しない', new Set(qs.map((q) => q.questionText)).size === 100 && new Set(qs.map((q) => q.workId)).size === 100)
check('問題文・選択肢・解説・学習のポイント・分野・根拠資料に空欄がない', qs.every((q) => q.questionText && q.field && q.point && q.choices.every(Boolean) && q.choiceNotes.every(Boolean) && q.sources.length > 0 && q.sources.every(Boolean)))
check('根拠資料は資料名だけ（URL・HTML・「同上」を含まない）', qs.every((q) => q.sources.every((x) => !/https?:|<|>|\]\(|同上/.test(x))))
check('全問4択・選択肢の重複なし', qs.every((q) => q.choices.length === 4 && new Set(q.choices).size === 4))
check('正答が0〜3の1つ', qs.every((q) => Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex <= 3))
const noteBad = qs.filter((q) => q.choiceNotes.length !== 4 || q.choiceNotes.some((n, i) => (i === q.answerIndex ? !n.startsWith('正しい') : !n.startsWith('誤り'))))
check('選択肢の解説の「正しい／誤り」が正答と一致（400選択肢）', noteBad.length === 0, noteBad.map((q) => q.id).join(','))
check('全問に学習のポイントと根拠資料がある', qs.every((q) => q.point.length > 0 && q.sources.length > 0))

// 作業フォルダの最新版との一致
if (existsSync(SRC)) {
  const raw = readFileSync(SRC, 'utf8')
  check('取り込み元のファイルが取り込み時から変わっていない（SHA-256）', sha256(raw) === data.sourceSha256)
  const src = JSON.parse(raw).questions as { no: number; stem: string; choices: string[]; answer: number; choice_notes: string[]; point: string }[]
  const diff = src.filter((s, i) => {
    const q = qs[i]
    return !q || q.questionNumber !== s.no || q.questionText !== s.stem || JSON.stringify(q.choices) !== JSON.stringify(s.choices) || q.answerIndex !== s.answer - 1 || JSON.stringify(q.choiceNotes) !== JSON.stringify(s.choice_notes) || q.point !== s.point
  })
  check('問題文・選択肢・正答・解説が作業フォルダの最新版と同じ', diff.length === 0, diff.map((s) => s.no).join(','))
} else {
  console.log('SKIP  作業フォルダの成果物が見つからないため、最新版との照合を省略')
}
if (existsSync(ADD_SRC)) {
  const raw = readFileSync(ADD_SRC, 'utf8')
  check('追加18問の取り込み元が取り込み時から変わっていない（SHA-256）', sha256(raw) === data.additionsSourceSha256)
  check('第41〜58問が取り込み元（additions-18.json）と一字一句同じ', JSON.stringify(JSON.parse(raw).questions) === JSON.stringify(qs.slice(40, 58)))
} else {
  console.log('SKIP  追加18問の取り込み元が見つからないため、照合を省略（基準値の照合は上で実施済み）')
}
if (existsSync(ADD2_SRC)) {
  const raw = readFileSync(ADD2_SRC, 'utf8')
  check('追加10問の取り込み元が取り込み時から変わっていない（SHA-256）', sha256(raw) === data.additions2SourceSha256)
  check('第59〜68問が取り込み元（additions-10.json）と一字一句同じ', JSON.stringify(JSON.parse(raw).questions) === JSON.stringify(qs.slice(58, 68)))
} else {
  console.log('SKIP  追加10問の取り込み元が見つからないため、照合を省略（基準値の照合は上で実施済み）')
}
if (existsSync(ADD3_SRC)) {
  const raw = readFileSync(ADD3_SRC, 'utf8')
  check('追加12問の取り込み元が取り込み時から変わっていない（SHA-256）', sha256(raw) === data.additions3SourceSha256)
  check('第69〜80問が取り込み元（additions-12.json）と一字一句同じ', JSON.stringify(JSON.parse(raw).questions) === JSON.stringify(qs.slice(68, 80)))
} else {
  console.log('SKIP  追加12問の取り込み元が見つからないため、照合を省略（基準値の照合は上で実施済み）')
}
if (existsSync(ADD4_SRC)) {
  const raw = readFileSync(ADD4_SRC, 'utf8')
  check('追加20問の取り込み元が取り込み時から変わっていない（SHA-256）', sha256(raw) === data.additions4SourceSha256)
  check('第81〜100問が取り込み元（additions-20.json）と一字一句同じ', JSON.stringify(JSON.parse(raw).questions) === JSON.stringify(qs.slice(80)))
} else {
  console.log('SKIP  追加20問の取り込み元が見つからないため、照合を省略（基準値の照合は上で実施済み）')
}

// IDの重複
const ids = qs.map((q) => q.id)
check('模擬試験内でIDが重複しない', new Set(ids).size === ids.length)
const existing = new Set<string>()
const peDir = join(ROOT, 'src/data/pastExams')
for (const f of readdirSync(peDir).filter((f) => f.endsWith('.json'))) {
  for (const x of JSON.parse(readFileSync(join(peDir, f), 'utf8')) as { id: string }[]) existing.add(x.id)
}
for (const m of readFileSync(join(ROOT, 'src/data/quizQuestions.ts'), 'utf8').matchAll(/id:\s*'([^']+)'/g)) existing.add(m[1])
const clash = ids.filter((id) => existing.has(id))
check(`過去問・予想問題のID（${existing.size}件）と重ならない`, clash.length === 0, clash.join(','))

// 採点
const q0 = qs[0]
check('正答を選ぶと正解', isOriginalMockCorrect(q0, q0.answerIndex))
check('正答以外は不正解', [0, 1, 2, 3].filter((i) => i !== q0.answerIndex).every((i) => !isOriginalMockCorrect(q0, i)))
const allRight = qs.map((q) => ({ questionId: q.id, selected: q.answerIndex, correct: true }))
const s = scoreBySubject(qs, allRight)
check('全問正解なら科目別12区分も満点（100/100）', s.length === 12 && s.every((r) => r.correct === r.total) && s.reduce((a, r) => a + r.correct, 0) === 100)
const half = qs.map((q, i) => ({ questionId: q.id, selected: 0, correct: i % 2 === 0 }))
check('一部正解の集計（50/100）', scoreBySubject(qs, half).reduce((a, r) => a + r.correct, 0) === 50)
const onlyFirst40 = qs.slice(0, 40).map((q) => ({ questionId: q.id, selected: q.answerIndex, correct: true }))
const s40 = scoreBySubject(qs, onlyFirst40)
check('第1〜40問だけ正解なら 40/100、臨床医学・リハビリテーション医学・基礎6科目の9区分は0点', s40.reduce((a, r) => a + r.correct, 0) === 40 && s40.slice(3).length === 9 && s40.slice(3).every((r) => r.correct === 0))
const only58 = scoreBySubject(qs, qs.slice(0, 58).map((q) => ({ questionId: q.id, selected: q.answerIndex, correct: true })))
check('第1〜58問だけ正解なら 58/100（臨床医学各論 15/22・臨床医学総論 3/5・リハビリテーション医学 0/1・基礎6科目は0点）', only58.reduce((a, r) => a + r.correct, 0) === 58 && JSON.stringify(only58.slice(3).map((r) => [r.correct, r.total])) === '[[15,22],[3,5],[0,1],[0,4],[0,5],[0,4],[0,7],[0,7],[0,5]]')
const only68 = scoreBySubject(qs, qs.slice(0, 68).map((q) => ({ questionId: q.id, selected: q.answerIndex, correct: true })))
check('第1〜68問だけ正解なら 68/100、基礎6科目の6区分は0点', only68.reduce((a, r) => a + r.correct, 0) === 68 && JSON.stringify(only68.slice(6).map((r) => [r.correct, r.total])) === '[[0,4],[0,5],[0,4],[0,7],[0,7],[0,5]]')
const only80 = scoreBySubject(qs, qs.slice(0, 80).map((q) => ({ questionId: q.id, selected: q.answerIndex, correct: true })))
check('第1〜80問だけ正解なら 80/100（基礎6科目は各2点だけ）', only80.reduce((a, r) => a + r.correct, 0) === 80 && JSON.stringify(only80.slice(6).map((r) => [r.correct, r.total])) === '[[2,4],[2,5],[2,4],[2,7],[2,7],[2,5]]')
check('追加60問すべてで、正答は正解・他の3つは不正解', qs.slice(40).every((q) => [0, 1, 2, 3].every((i) => isOriginalMockCorrect(q, i) === (i === q.answerIndex))))
check('未回答は不正解として数える', scoreBySubject(qs, []).every((r) => r.correct === 0))

console.log(fail ? `\n${fail} 件失敗` : '\nすべて成功')
process.exit(fail ? 1 : 0)
