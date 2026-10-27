/**
 * オリジナル模擬試験の問題データを、作業フォルダの成果物（out/questions-40.json）から取り込む。
 * 問題文・選択肢・正答・解説は書き換えない（そのまま写す）。根拠資料は資料名だけを持つ。
 * 実行：npx tsx scripts/import-original-mock.mts [questions-40.json のパス]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'

const SRC =
  process.argv[2] ??
  'C:/Users/serap/shinkyuu-db-audit/2026-10-original-mock-02/out/questions-40.json'
const OUT = join(import.meta.dirname, '..', 'src', 'data', 'originalMocks', 'original-mock-02.json')

type SrcQuestion = {
  work_id: string
  no: number
  subject: string
  field: string
  stem: string
  choices: string[]
  answer: number
  choice_notes: string[]
  point: string
  evidence: { source: string; locator: string; quote: string }[]
}

const raw = readFileSync(SRC, 'utf8')
const src = JSON.parse(raw) as { sources: Record<string, { title: string }>; questions: SrcQuestion[] }

const questions = src.questions.map((q) => {
  if (q.choices.length !== 4 || q.choice_notes.length !== 4 || q.answer < 1 || q.answer > 4) {
    throw new Error(`${q.work_id}: 選択肢・解説・正答の形が不正`)
  }
  const sources = [...new Set(q.evidence.map((e) => (e.source === 'EXAM' ? `あはき国家試験 第${e.locator.slice(0, 2)}回 問${Number(e.locator.slice(3))}` : src.sources[e.source]?.title ?? e.source)))]
  return {
    id: `om02-${String(q.no).padStart(2, '0')}`,
    workId: q.work_id,
    questionNumber: q.no,
    subject: q.subject,
    field: q.field,
    questionText: q.stem,
    choices: q.choices,
    answerIndex: q.answer - 1,
    choiceNotes: q.choice_notes,
    point: q.point,
    sources,
  }
})

const data = {
  mockId: 'original-mock-02',
  title: 'オリジナル模擬試験②',
  status: 'AI作成・AI監査のみ。有資格者の最終確認は未実施。公式問題ではないことを明記して公開',
  sourceFile: SRC.replace(/^.*shinkyuu-db-audit[\\/]/, 'shinkyuu-db-audit/'),
  sourceSha256: createHash('sha256').update(raw).digest('hex'),
  questions,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(data, null, 1) + '\n')
console.log(`ok ${questions.length}問 → ${OUT}`)
console.log(`sha256 ${data.sourceSha256}`)
