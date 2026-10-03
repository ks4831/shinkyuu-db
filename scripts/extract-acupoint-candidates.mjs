#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   経穴出題データのレビュー候補抽出   `npm run extract:acupoints -- [--round 35] [--all] [--out file]`
   - 過去問JSON（src/data/pastExams/exam-*.json）から、経穴の知識を問う可能性がある設問を抽出する
   - 出力は「候補」だけ。role（direct / required / distractor / ambiguous）は自動決定しない
     → 人がレビューして src/data/acupointOccurrences.json に追記する
   - 既定では acupointOccurrences.json に未登録の候補だけを出す（--all で登録済みも出す）
   - 定義・手順: docs/acupoint-occurrence-definition.md
   ────────────────────────────────────────────────────────────── */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { isCandidate, namedMasterSlugs, normalizeText, officialText } from './lib/acupoint-text.mjs'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const argValue = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const onlyRound = argValue('--round') ? Number(argValue('--round')) : undefined
const includeRegistered = args.includes('--all')
const outFile = argValue('--out')

const { ACUPOINTS } = await import(pathToFileURL(path.join(ROOT, 'src/data/acupoints.ts')).href)
const occData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/acupointOccurrences.json'), 'utf-8'))
const registered = new Set(occData.occurrences.map((o) => o.questionId))
const outsideNames = occData.outsideMaster.map((o) => o.name)

// 分析CSVの subject（科目）を questionId で引く
function loadSubjects() {
  const map = new Map()
  const rawDir = path.join(ROOT, 'src/data/raw')
  for (const f of fs.readdirSync(rawDir).filter((f) => /^exam-\d+\.csv$/.test(f))) {
    const lines = fs.readFileSync(path.join(rawDir, f), 'utf-8').replace(/\r/g, '').trim().split('\n')
    const header = lines[0].split(',')
    const idIdx = header.indexOf('id')
    const subjIdx = header.indexOf('subject')
    for (const line of lines.slice(1)) {
      const cols = line.split(',') // id・subject は先頭側の引用符なし列
      map.set(cols[idIdx], cols[subjIdx])
    }
  }
  return map
}
const subjects = loadSubjects()

const peDir = path.join(ROOT, 'src/data/pastExams')
const files = fs.readdirSync(peDir).filter((f) => /^exam-\d+\.json$/.test(f)).sort()
const results = []
for (const f of files) {
  const round = Number(f.match(/\d+/)[0])
  if (onlyRound && round !== onlyRound) continue
  for (const q of JSON.parse(fs.readFileSync(path.join(peDir, f), 'utf-8'))) {
    if (!isCandidate(q, subjects.get(q.id), ACUPOINTS)) continue
    if (!includeRegistered && registered.has(q.id)) continue
    const answers = q.answerIndexes ?? [q.answerIndex]
    const text = normalizeText(officialText(q))
    results.push({
      questionId: q.id,
      examRound: q.examRound,
      questionNumber: q.questionNumber,
      registered: registered.has(q.id),
      namedMaster: namedMasterSlugs(q, ACUPOINTS),
      // 既登録のマスタ外名称の文字一致（参考。新しいマスタ外経穴は人が追加する）
      namedOutsideMaster: outsideNames.filter((n) => text.includes(n)),
      questionText: q.questionText,
      choices: q.choices.map((c, i) => `${answers.includes(i) ? '*' : ' '}${i + 1}. ${c}`),
    })
  }
}

const out = JSON.stringify(results, null, 2)
if (outFile) {
  fs.writeFileSync(outFile, out + '\n')
  console.log(`候補 ${results.length} 問を ${outFile} に出力しました`)
} else {
  console.log(out)
  console.error(`候補 ${results.length} 問${includeRegistered ? '' : '（未登録のみ）'}`)
}
