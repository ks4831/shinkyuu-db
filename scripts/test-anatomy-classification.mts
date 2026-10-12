#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   解剖学のテーマ分類の回帰テスト（Phase A10.1・案A）
   `npm run test:classification`
   - 34-015・34-021（脊髄神経）、32-022（腕神経叢）、31-023（眼球）を
     an-shinkei（神経系の解剖）に分類したこと
   - 34-022（副交感神経節）は no-shinkei（脳神経）のまま（案Aの対象外）
   - 解剖学54問のテーマ別件数・年度別件数が期待値どおりであること
   - 公式の問題文・選択肢・正答・出典は分類修正で変わっていないこと（演習データと結合して確認）
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
process.chdir(ROOT)
const { loadAllExamQuestions } = await import('../src/lib/examQuestions')
const { loadPastExamQuestions } = await import('../src/lib/pastExams')

let n = 0
function test(name: string, fn: () => void) {
  fn()
  n++
  console.log(`  ✓ ${name}`)
}

const all = loadAllExamQuestions()
const byId = new Map(all.map((q) => [q.id, q]))
const anatomy = all.filter((q) => q.subject === 'anatomy')

test('1. 案Aの4問は神経系の解剖（an-shinkei）', () => {
  for (const id of ['34-015', '34-021', '32-022', '31-023']) {
    assert.equal(byId.get(id)?.themeId, 'an-shinkei', id)
    assert.equal(byId.get(id)?.subject, 'anatomy', id)
  }
})

test('2. 34-022（副交感神経節）は脳神経（no-shinkei）のまま', () => {
  assert.equal(byId.get('34-022')?.themeId, 'no-shinkei')
})

test('3. 解剖学は54問・各回9問（問15〜23）', () => {
  assert.equal(all.length, 1080)
  assert.equal(anatomy.length, 54)
  for (const r of [29, 30, 31, 32, 33, 34]) {
    const qs = anatomy.filter((q) => q.examRound === r)
    assert.equal(qs.length, 9, `第${r}回`)
    assert.deepEqual(qs.map((q) => q.questionNumber).sort((a, b) => a - b), [15, 16, 17, 18, 19, 20, 21, 22, 23])
  }
})

test('4. 解剖学のテーマ別件数（1問1テーマ、合計54）', () => {
  const count: Record<string, number> = {}
  for (const q of anatomy) count[q.themeId ?? ''] = (count[q.themeId ?? ''] ?? 0) + 1
  assert.deepEqual(count, {
    'an-undoki': 13,
    'an-naizo': 11,
    'an-shinkei': 11,
    'an-junkanki': 7,
    'an-soshiki': 4,
    'no-shinkei': 3,
    'kin-kishi-teishi': 2,
    'an-naibunpi': 2,
    'kansetsu-kozo': 1,
  })
})

test('5. 演習データ（問題文・選択肢・正答）は案Aの4問でも結合でき、テーマだけが新しい', () => {
  const play = new Map([31, 32, 34].flatMap((r) => loadPastExamQuestions(r)).map((q) => [q.id, q]))
  for (const id of ['34-015', '34-021', '32-022', '31-023']) {
    const q = play.get(id)
    assert.ok(q, id)
    assert.ok(q.questionText.length > 0 && q.choices.length >= 4, id)
    assert.equal(q.themeId, 'an-shinkei', id)
  }
})

console.log(`\n${n} tests passed`)
