/**
 * オリジナル模擬試験②の問題データを、作業フォルダの3つの成果物から取り込む。
 *   1. 既存40問：2026-10-original-mock-02/out/questions-40.json（第1〜40問。変換の仕方は40問のときから変えていない）
 *   2. 追加18問：2026-11-original-mock-02-additions/out/additions-18.json（第41〜58問。アプリと同じ形のまま写す）
 *   3. 追加10問：2026-11-original-mock-02-additions/out/additions-10.json（第59〜68問。アプリと同じ形のまま写す）
 * 問題文・選択肢・正答・解説は書き換えない（そのまま写す）。根拠資料は資料名だけを持つ。
 * 先頭40問・追加18問・追加10問・公開済み58問の SHA-256（JSON.stringify）が基準値と違うときは、ファイルを書かずに止める。
 * 実行：npx tsx scripts/import-original-mock.mts [questions-40.json] [additions-18.json] [additions-10.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import {
  FIRST40_QUESTIONS_SHA256,
  ADDITIONS18_QUESTIONS_SHA256,
  ADDITIONS10_QUESTIONS_SHA256,
  FIRST58_QUESTIONS_SHA256,
  QUESTION_KEYS,
} from './original-mock-02-lock'

const SRC =
  process.argv[2] ??
  'C:/Users/serap/shinkyuu-db-audit/2026-10-original-mock-02/out/questions-40.json'
const ADD_SRC =
  process.argv[3] ??
  'C:/Users/serap/shinkyuu-db-audit/2026-11-original-mock-02-additions/out/additions-18.json'
const ADD2_SRC =
  process.argv[4] ??
  'C:/Users/serap/shinkyuu-db-audit/2026-11-original-mock-02-additions/out/additions-10.json'
const OUT = join(import.meta.dirname, '..', 'src', 'data', 'originalMocks', 'original-mock-02.json')

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
function stop(msg: string): never {
  console.error(`STOP ${msg}（ファイルは書いていない）`)
  process.exit(1)
}

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

/* ── 1. 既存40問（変換は40問のときと同じ） ── */
const raw = readFileSync(SRC, 'utf8')
const src = JSON.parse(raw) as { sources: Record<string, { title: string }>; questions: SrcQuestion[] }

const first40 = src.questions.map((q) => {
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
if (first40.length !== 40) stop(`既存の問題数が40ではない: ${first40.length}`)
const h40 = sha256(JSON.stringify(first40))
if (h40 !== FIRST40_QUESTIONS_SHA256) stop(`既存40問の SHA-256 が違う: ${h40}`)

/* ── 2. 追加18問（additions-18.json の questions をそのまま写す） ── */
const addRaw = readFileSync(ADD_SRC, 'utf8')
const add = JSON.parse(addRaw) as { questions: Record<string, unknown>[] }
const additions = add.questions
if (additions.length !== 18) stop(`追加の問題数が18ではない: ${additions.length}`)
const h18 = sha256(JSON.stringify(additions))
if (h18 !== ADDITIONS18_QUESTIONS_SHA256) stop(`追加18問の SHA-256 が違う: ${h18}`)

/* ── 3. 追加10問（additions-10.json の questions をそのまま写す） ── */
const add2Raw = readFileSync(ADD2_SRC, 'utf8')
const additions2 = (JSON.parse(add2Raw) as { questions: Record<string, unknown>[] }).questions
if (additions2.length !== 10) stop(`追加の問題数が10ではない: ${additions2.length}`)
const h10 = sha256(JSON.stringify(additions2))
if (h10 !== ADDITIONS10_QUESTIONS_SHA256) stop(`追加10問の SHA-256 が違う: ${h10}`)

/* ── 4. 68問の形の検査（公開済み58問が変わらないことも確かめる） ── */
const questions = [...first40, ...additions, ...additions2] as (typeof first40)[number][]
const h58 = sha256(JSON.stringify(questions.slice(0, 58)))
if (h58 !== FIRST58_QUESTIONS_SHA256) stop(`公開済み58問の SHA-256 が違う: ${h58}`)
questions.forEach((q, i) => {
  const n = i + 1
  if (JSON.stringify(Object.keys(q)) !== JSON.stringify(QUESTION_KEYS)) stop(`第${n}問のキーが違う`)
  if (q.id !== `om02-${String(n).padStart(2, '0')}` || q.questionNumber !== n) stop(`第${n}問の id・問題番号が違う: ${q.id} ${q.questionNumber}`)
  if (q.choices.length !== 4 || q.choiceNotes.length !== 4) stop(`${q.id}: 選択肢・解説が4つではない`)
  if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) stop(`${q.id}: 正答が0〜3ではない`)
  if (!q.point || q.sources.length === 0 || q.sources.some((s) => !s)) stop(`${q.id}: 学習のポイント・根拠資料が欠けている`)
})
for (const key of ['id', 'workId', 'questionText'] as const) {
  const vals = questions.map((q) => q[key])
  if (new Set(vals).size !== vals.length) stop(`${key} が重複している`)
}

const data = {
  mockId: 'original-mock-02',
  title: 'オリジナル模擬試験②',
  status: 'AI作成・AI監査のみ。有資格者の最終確認は未実施。公式問題ではないことを明記して公開。2026-11 臨床医学18問（第41〜58問）、臨床医学・リハビリテーション医学10問（第59〜68問）を追加',
  sourceFile: SRC.replace(/^.*shinkyuu-db-audit[\/]/, 'shinkyuu-db-audit/'),
  sourceSha256: sha256(raw),
  additionsSourceFile: ADD_SRC.replace(/^.*shinkyuu-db-audit[\/]/, 'shinkyuu-db-audit/'),
  additionsSourceSha256: sha256(addRaw),
  additions2SourceFile: ADD2_SRC.replace(/^.*shinkyuu-db-audit[\/]/, 'shinkyuu-db-audit/'),
  additions2SourceSha256: sha256(add2Raw),
  questions,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(data, null, 1) + '\n')
console.log(`ok ${questions.length}問 → ${OUT}`)
console.log(`既存40問 ${h40}`)
console.log(`追加18問 ${h18}`)
console.log(`追加10問 ${h10}`)
console.log(`公開済み58問 ${h58}`)
