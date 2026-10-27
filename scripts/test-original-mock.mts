/**
 * オリジナル模擬試験②のデータと採点の検査。
 * - 取り込んだデータが作業フォルダの成果物（out/questions-40.json）と一字一句同じか
 * - 40問・科目別の問題数・4択・正答1つ・解説の正誤表示と正答の一致
 * - 問題IDが重複せず、過去問・予想問題のIDとも重ならないか
 * - 採点（科目別の集計）
 * 実行：npm run test:original-mock
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { isOriginalMockCorrect, scoreBySubject, type OriginalMockData } from '../src/lib/originalMock'

const ROOT = join(import.meta.dirname, '..')
const SRC = 'C:/Users/serap/shinkyuu-db-audit/2026-10-original-mock-02/out/questions-40.json'
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/originalMocks/original-mock-02.json'), 'utf8')) as OriginalMockData & { sourceSha256: string }

let fail = 0
function check(label: string, cond: boolean, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  (' + detail + ')' : ''}`)
  if (!cond) fail++
}

const qs = data.questions
check('40問', qs.length === 40, String(qs.length))
const counts = Object.fromEntries(scoreBySubject(qs, []).map((r) => [r.subject, r.total]))
check('科目別：経絡経穴概論20・はり理論10・きゅう理論10', counts['経絡経穴概論'] === 20 && counts['はり理論'] === 10 && counts['きゅう理論'] === 10, JSON.stringify(counts))
check('問題番号が1〜40の連番', qs.every((q, i) => q.questionNumber === i + 1))
check('全問4択・選択肢の重複なし', qs.every((q) => q.choices.length === 4 && new Set(q.choices).size === 4))
check('正答が0〜3の1つ', qs.every((q) => Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex <= 3))
const noteBad = qs.filter((q) => q.choiceNotes.length !== 4 || q.choiceNotes.some((n, i) => (i === q.answerIndex ? !n.startsWith('正しい') : !n.startsWith('誤り'))))
check('選択肢の解説の「正しい／誤り」が正答と一致（160選択肢）', noteBad.length === 0, noteBad.map((q) => q.id).join(','))
check('全問に学習のポイントと根拠資料がある', qs.every((q) => q.point.length > 0 && q.sources.length > 0))

// 作業フォルダの最新版との一致
if (existsSync(SRC)) {
  const raw = readFileSync(SRC, 'utf8')
  check('取り込み元のファイルが取り込み時から変わっていない（SHA-256）', createHash('sha256').update(raw).digest('hex') === data.sourceSha256)
  const src = JSON.parse(raw).questions as { no: number; stem: string; choices: string[]; answer: number; choice_notes: string[]; point: string }[]
  const diff = src.filter((s, i) => {
    const q = qs[i]
    return !q || q.questionNumber !== s.no || q.questionText !== s.stem || JSON.stringify(q.choices) !== JSON.stringify(s.choices) || q.answerIndex !== s.answer - 1 || JSON.stringify(q.choiceNotes) !== JSON.stringify(s.choice_notes) || q.point !== s.point
  })
  check('問題文・選択肢・正答・解説が作業フォルダの最新版と同じ', diff.length === 0, diff.map((s) => s.no).join(','))
} else {
  console.log('SKIP  作業フォルダの成果物が見つからないため、最新版との照合を省略')
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
check('全問正解なら科目別も満点', s.every((r) => r.correct === r.total) && s.reduce((a, r) => a + r.correct, 0) === 40)
const half = qs.map((q, i) => ({ questionId: q.id, selected: 0, correct: i % 2 === 0 }))
check('一部正解の集計', scoreBySubject(qs, half).reduce((a, r) => a + r.correct, 0) === 20)
check('未回答は不正解として数える', scoreBySubject(qs, []).every((r) => r.correct === 0))

console.log(fail ? `\n${fail} 件失敗` : '\nすべて成功')
process.exit(fail ? 1 : 0)
