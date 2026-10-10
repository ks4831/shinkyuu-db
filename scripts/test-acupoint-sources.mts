#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   経穴の名称・検索・出典管理のテスト
   `npm run test:sources`
   - 列欠／列缺のどちらでも同じ経穴（lu7）に着くこと、slug・URL が変わらないこと
   - 表記を変えた予想問題（ma-004・ma-006・oc-014）の正答判定がシャッフル後も保たれること
   - 出典管理の検査（scripts/lib/acupoint-source-check.mjs）が、わざと壊したデータを検出すること
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const { ACUPOINTS } = await import('../src/data/acupoints')
const { searchAcupoints } = await import('../src/lib/acupointSearch')
const { ALL_QUESTIONS } = await import('../src/lib/quiz')
import type { AcupointSourceData, AcupointSourceRecord } from '../src/lib/acupointSources'
const lib = await import('../src/lib/acupointSources')
const { checkAcupointSources, buildExamIndexes } = await import('./lib/acupoint-source-check.mjs')

let n = 0
function test(name: string, fn: () => void) {
  fn()
  n++
  console.log(`  ✓ ${name}`)
}

const rows = ACUPOINTS.map((a) => ({ slug: a.slug, code: a.code, name: a.name, reading: a.reading, meridianName: a.meridianName, aliases: a.aliases ?? [] }))
const lu7 = ACUPOINTS.find((a) => a.slug === 'lu7')!

console.log('経穴の名称・検索')
test('1. 「列欠」で検索すると lu7 が1件だけ出る', () => {
  const r = searchAcupoints(rows, '列欠')
  assert.deepEqual(r.map((p) => p.slug), ['lu7'])
})
test('2. 「列缺」（旧表記）で検索しても同じ lu7 に着く', () => {
  const r = searchAcupoints(rows, '列缺')
  assert.deepEqual(r.map((p) => p.slug), ['lu7'])
})
test('3. 1文字「列」でも lu7 は重複しない', () => {
  const r = searchAcupoints(rows, '列')
  assert.equal(r.filter((p) => p.slug === 'lu7').length, 1)
})
test('4. 読み・コードでも lu7 に着く', () => {
  assert.ok(searchAcupoints(rows, 'れっけつ').some((p) => p.slug === 'lu7'))
  assert.ok(searchAcupoints(rows, 'lu7').some((p) => p.slug === 'lu7'))
})
test('5. 正規名は列欠、旧表記は別名、slug・code・URL は不変', () => {
  assert.equal(lu7.name, '列欠')
  assert.deepEqual(lu7.aliases, ['列缺'])
  assert.equal(lu7.code, 'LU7')
  assert.equal(`/acupoints/${lu7.slug}`, '/acupoints/lu7')
})
test('6. 経穴は361穴のまま（別名を足しても増えない）・slug 重複なし・詳細146穴', () => {
  assert.equal(ACUPOINTS.length, 361)
  assert.equal(new Set(ACUPOINTS.map((a) => a.slug)).size, 361)
  assert.ok(ACUPOINTS.every((a) => a.slug === a.code.toLowerCase()))
  assert.equal(ACUPOINTS.filter((a) => a.location).length, 146)
})
test('7. 別名が他の穴の正規名・別名と衝突しない', () => {
  const owner = new Map<string, string>()
  for (const a of ACUPOINTS) {
    for (const t of [a.name, ...(a.aliases ?? [])].filter(Boolean) as string[]) {
      assert.ok(!owner.has(t) || owner.get(t) === a.slug, `「${t}」が ${owner.get(t)} と ${a.slug} の両方にある`)
      owner.set(t, a.slug)
    }
  }
})

console.log('予想問題（表記変更した3問）')
const EXPECT: Record<string, { correctAnswer: number; text: string; choices: string[] }> = {
  'ma-004': { correctAnswer: 1, text: '任脈', choices: ['督脈', '任脈', '衝脈', '帯脈'] },
  'ma-006': { correctAnswer: 3, text: '合谷', choices: ['足三里', '委中', '列欠', '合谷'] },
}
// QuizRunner.buildSet と同じ手順（選択肢の添字を Fisher–Yates で並べ替え、shownCorrect = idx.indexOf(correctAnswer)）
const shuffle = <T,>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
for (const id of ['ma-004', 'ma-006', 'oc-014']) {
  test(`8. ${id}：本文に「列缺」がなく、正答がシャッフル後も同じ選択肢`, () => {
    const q = ALL_QUESTIONS.find((x) => x.id === id)!
    assert.ok(q, id)
    assert.ok(!JSON.stringify(q).includes('列缺'))
    assert.ok(JSON.stringify(q).includes('列欠'))
    const e = EXPECT[id]
    if (e) {
      assert.equal(q.correctAnswer, e.correctAnswer)
      assert.deepEqual(q.choices, e.choices)
    }
    const answerText = q.choices[q.correctAnswer]
    for (let t = 0; t < 5000; t++) {
      const idx = shuffle(q.choices.map((_, i) => i))
      const shown = idx.map((i) => q.choices[i])
      const shownCorrect = idx.indexOf(q.correctAnswer)
      assert.equal(shown[shownCorrect], answerText)
      // 正答肢を選んだときだけ正解
      assert.ok(shown.every((c, i) => (i === shownCorrect) === (c === answerText)))
    }
  })
}
test('9. oc-014 の正答は「足三里 ─ 腹部」の肢（添字0）のまま', () => {
  const q = ALL_QUESTIONS.find((x) => x.id === 'oc-014')!
  assert.equal(q.correctAnswer, 0)
  assert.ok(q.choices[0].startsWith('足三里'))
  assert.ok(q.choices.includes('列欠 ─ 腰背（腰・背部の病）'))
})
test('10. 予想問題は205問', () => assert.equal(ALL_QUESTIONS.length, 205))

console.log('出典管理')
const D = lib.ACUPOINT_SOURCE_DATA
const typeOf = new Map(D.sources.map((s) => [s.id, s.sourceType]))
test('11. lu7 の名称は日本の資料で確認済み（公式・出題基準の2件）、旧表記のレコードは履歴として残る', () => {
  const st = lib.getAcupointSourceStatus(lu7).find((s) => s.field === 'name')!
  assert.equal(st.status, 'JAPAN_VERIFIED')
  const recs = D.records.filter((r) => r.acupointId === 'lu7' && r.fieldName === 'name')
  assert.deepEqual(recs.filter((r) => !r.supersededAt).map((r) => r.sourceId).sort(), ['KIJUN-2026', 'OFFICIAL-29-34'])
  const old = recs.filter((r) => r.supersededAt)
  assert.equal(old.length, 2)
  assert.ok(old.every((r) => r.claim === '列缺' && r.verificationStatus === 'CONFLICT' && r.sourceText === '列欠'))
})
test('12. 未確認は確認済みにならない（攢竹は CONFLICT、水溝の位置は WHO_VERIFIED、足三里の位置は SOURCE_NEEDED）', () => {
  const get = (slug: string, field: string) => lib.getAcupointSourceStatus(ACUPOINTS.find((a) => a.slug === slug)!).find((s) => s.field === field)!.status
  assert.equal(get('bl2', 'name'), 'CONFLICT')
  assert.equal(get('gv26', 'location'), 'WHO_VERIFIED')
  assert.equal(get('st36', 'location'), 'SOURCE_NEEDED')
  assert.equal(get('li11', 'location'), 'CONFLICT')
})
const base = (over: Partial<AcupointSourceRecord>): AcupointSourceRecord => ({
  acupointId: 'lu7', fieldName: 'name', claim: '列欠', currentValue: '列欠', sourceId: 'OFFICIAL-29-34', sourcePage: '30-106',
  verifiedAt: '2026-10-10', verificationStatus: 'JAPAN_VERIFIED', coverage: 'full', notes: 'test', ...over,
})
test('13. 推論（JAPAN_INFERRED）・WHO・部分確認だけでは JAPAN_VERIFIED に数えない', () => {
  assert.equal(lib.summarizeRecords([base({ verificationStatus: 'JAPAN_INFERRED' })], typeOf), 'SOURCE_NEEDED')
  assert.equal(lib.summarizeRecords([base({ coverage: 'partial' })], typeOf), 'SOURCE_NEEDED')
  assert.equal(lib.summarizeRecords([base({ sourceId: 'WHO-2008', verificationStatus: 'WHO_VERIFIED' })], typeOf), 'WHO_VERIFIED')
  assert.equal(lib.summarizeRecords([base({}), base({ verificationStatus: 'CONFLICT', sourceId: 'KIJUN-2026' })], typeOf), 'CONFLICT')
})

// 検査ロジックに、わざと壊したデータを渡す
const exams = fs.readdirSync(path.join(ROOT, 'src/data/pastExams')).filter((f) => /^exam-\d+\.json$/.test(f))
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/pastExams', f), 'utf8')))
const occ = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/acupointOccurrences.json'), 'utf8'))
const idx = buildExamIndexes(exams, occ)
const run = (data = D, master = ACUPOINTS) => checkAcupointSources({ data, lib, master, ...idx, today: '2026-10-10' })
const clone = () => structuredClone(D) as AcupointSourceData
test('14. 実データは ERROR 0・WARN 0', () => {
  const r = run()
  assert.deepEqual(r.errors, [])
  assert.deepEqual(r.warns, [])
  assert.equal(r.stats.records, 652)
  assert.equal(r.stats.active, 650)
})
const BROKEN: [string, (d: AcupointSourceData) => void, RegExp][] = [
  ['存在しない経穴ID', (d) => d.records.push(base({ acupointId: 'lu99' })), /経穴マスターにない slug/],
  ['未登録の資料', (d) => d.records.push(base({ sourceId: 'TEXTBOOK-X' })), /未登録の資料/],
  ['WHO を JAPAN_VERIFIED', (d) => d.records.push(base({ sourceId: 'WHO-2008', sourcePage: 'PDF p.38（LU7）' })), /日本の資料にだけ使える/],
  ['公式を WHO_VERIFIED', (d) => d.records.push(base({ verificationStatus: 'WHO_VERIFIED' })), /国際資料にだけ使える/],
  ['同じレコードの重複', (d) => d.records.push({ ...d.records.find((r) => r.acupointId === 'lu1' && r.fieldName === 'location')! }), /重複/],
  ['存在しない問題ID', (d) => d.records.push(base({ acupointId: 'lu1', claim: '中府', currentValue: '中府', sourcePage: '35-001' })), /過去問データにない/],
  ['名称が書かれていない問題', (d) => d.records.find((r) => r.acupointId === 'lu7' && r.fieldName === 'name' && r.sourceId === 'OFFICIAL-29-34' && !r.supersededAt)!.sourcePage = '29-001', /問題文・選択肢に「列欠」がない/],
  ['設問が経穴に対応しない直接確認', (d) => d.records.push(base({ fieldName: 'location', claim: lu7.location!, currentValue: lu7.location!, sourcePage: '29-001' })), /この経穴に対応していない/],
  ['名称の CONFLICT に原文表記がない', (d) => { delete d.records.find((r) => r.acupointId === 'bl2' && r.fieldName === 'name')!.sourceText }, /資料の表記（sourceText）/],
  ['異体字を確認済みにした', (d) => { d.records.find((r) => r.acupointId === 'bl2' && r.fieldName === 'name')!.verificationStatus = 'JAPAN_VERIFIED' }, /表記「攅竹」と名称「攢竹」が違う/],
  ['履歴の理由がない', (d) => { delete d.records.find((r) => r.supersededAt)!.supersededBy }, /supersededBy/],
  ['現在値のレコードを履歴にした', (d) => { const r = d.records.find((x) => x.acupointId === 'lu1' && x.fieldName === 'name')!; r.supersededAt = '2026-10-10'; r.supersededBy = 'x' }, /superseded になっている/],
  ['未来の確認日', (d) => { d.records[0].verifiedAt = '2027-01-01' }, /未来の日付/],
  ['WHO のページが別の穴', (d) => { d.records.find((r) => r.sourceId === 'WHO-2008')!.sourcePage = 'PDF p.38（LU8）' }, /指していない/],
  ['不正な判定値', (d) => { (d.records[0] as { verificationStatus: string }).verificationStatus = 'VERIFIED' }, /verificationStatus が不正/],
  ['sourcePage が空', (d) => { d.records[0].sourcePage = '' }, /sourcePage が空/],
]
for (const [name, breakIt, re] of BROKEN) {
  test(`15. 検出：${name}`, () => {
    const d = clone()
    breakIt(d)
    const r = run(d)
    assert.ok(r.errors.some((m: string) => re.test(m)), `検出されない: ${r.errors.join(' / ') || '（ERROR なし）'}`)
  })
}
test('16. 検出：名称を変えたのにレコードを更新しない → WARN（総合判定から外れる）', () => {
  const master = ACUPOINTS.map((a) => (a.slug === 'lu1' ? { ...a, name: '中府X' } : a))
  const r = run(D, master)
  assert.ok(r.warns.some((m: string) => /確認後にマスターの値が変わった/.test(m)))
})
test('17. 検出：資料の表記が別名にない → WARN（その表記で検索できない）', () => {
  const master = ACUPOINTS.map((a) => (a.slug === 'bl2' ? { ...a, aliases: [] } : a))
  const r = run(D, master)
  assert.ok(r.warns.some((m: string) => /検索できない/.test(m)))
})

console.log(`\n${n} 件成功`)
