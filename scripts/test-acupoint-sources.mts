#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   経穴の名称・検索・出典管理のテスト
   `npm run test:sources`
   - 列欠／列缺・攅竹／攢竹・懸鍾／懸鐘・解渓／解谿・欠盆／缺盆のどちらでも同じ経穴に着くこと、slug・URL が変わらないこと
   - 表記を変えた予想問題（ma-004・ma-006・oc-014・oc-007・oc-011・at-008）の正答判定がシャッフル後も保たれること
   - 出題基準2026 で補った名称（JAPAN-SOURCE 07）に出典があること
   - 経穴ページの「情報の根拠」が、WHO・推論を日本の資料での確認と書かないこと
   - 34-123 の解説の「飛陽」を正規名「飛揚」に直したこと（JAPAN-SOURCE 08。公式の問題文・選択肢・正答は不変）
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
for (const [name, old, slug] of [['攅竹', '攢竹', 'bl2'], ['懸鍾', '懸鐘', 'gb39'], ['解渓', '解谿', 'st41'], ['欠盆', '缺盆', 'st12']]) {
  test(`5b. 「${name}」「${old}」のどちらでも ${slug} が1件だけ出る（正規名は ${name}）`, () => {
    assert.deepEqual(searchAcupoints(rows, name).map((p) => p.slug), [slug])
    assert.deepEqual(searchAcupoints(rows, old).map((p) => p.slug), [slug])
    const a = ACUPOINTS.find((x) => x.slug === slug)!
    assert.equal(a.name, name)
    assert.ok(a.aliases?.includes(old))
  })
}
test('7. 別名が他の穴の正規名・別名と衝突しない', () => {
  const owner = new Map<string, string>()
  for (const a of ACUPOINTS) {
    for (const t of [a.name, ...(a.aliases ?? [])].filter(Boolean) as string[]) {
      assert.ok(!owner.has(t) || owner.get(t) === a.slug, `「${t}」が ${owner.get(t)} と ${a.slug} の両方にある`)
      owner.set(t, a.slug)
    }
  }
})

console.log('予想問題（表記変更した6問）')
const EXPECT: Record<string, { correctAnswer: number; text: string; choices: string[] }> = {
  'ma-004': { correctAnswer: 1, text: '任脈', choices: ['督脈', '任脈', '衝脈', '帯脈'] },
  'ma-006': { correctAnswer: 3, text: '合谷', choices: ['足三里', '委中', '列欠', '合谷'] },
  'oc-007': { correctAnswer: 0, text: '風池・天柱・肩井・合谷', choices: ['風池・天柱・肩井・合谷', '関元・気海・三陰交', '中脘・足三里・内関', '睛明・攅竹・太陽'] },
  'oc-011': { correctAnswer: 0, text: '天枢・大腸兪・上巨虚・支溝', choices: ['天枢・大腸兪・上巨虚・支溝', '中府・雲門・膻中', '睛明・攅竹・魚腰', '肩井・天宗・臂臑'] },
  'at-008': { correctAnswer: 0, text: '胸背部の肋間を深く刺入する部位', choices: ['胸背部の肋間を深く刺入する部位', '前腕伸側', '下腿外側', '手背'] },
}
// 表記を変えた問題ごとの［旧表記, 新表記］
const NOTATION: Record<string, [string, string]> = {
  'ma-004': ['列缺', '列欠'], 'ma-006': ['列缺', '列欠'], 'oc-014': ['列缺', '列欠'],
  'oc-007': ['攢竹', '攅竹'], 'oc-011': ['攢竹', '攅竹'], 'at-008': ['缺盆', '欠盆'],
}
// QuizRunner.buildSet と同じ手順（選択肢の添字を Fisher–Yates で並べ替え、shownCorrect = idx.indexOf(correctAnswer)）
const shuffle = <T,>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
for (const [id, [oldText, newText]] of Object.entries(NOTATION)) {
  test(`8. ${id}：本文に「${oldText}」がなく「${newText}」があり、正答がシャッフル後も同じ選択肢`, () => {
    const q = ALL_QUESTIONS.find((x) => x.id === id)!
    assert.ok(q, id)
    assert.ok(!JSON.stringify(q).includes(oldText))
    assert.ok(JSON.stringify(q).includes(newText))
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
test('12. 未確認は確認済みにならない（水溝の名称は SOURCE_NEEDED、水溝の位置は WHO_VERIFIED、足三里の位置は SOURCE_NEEDED）', () => {
  const get = (slug: string, field: string) => lib.getAcupointSourceStatus(ACUPOINTS.find((a) => a.slug === slug)!).find((s) => s.field === field)!.status
  assert.equal(get('bl2', 'name'), 'JAPAN_VERIFIED')
  assert.equal(get('gv26', 'name'), 'SOURCE_NEEDED')
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
  assert.equal(r.stats.records, 669)
  assert.equal(r.stats.active, 666)
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
  const d = clone()
  d.records.push(base({ acupointId: 'st12', claim: '欠盆', currentValue: '欠盆', sourceId: 'KIJUN-2026', sourcePage: 'p.63', verificationStatus: 'CONFLICT', sourceText: '缺盆' }))
  const master = ACUPOINTS.map((a) => (a.slug === 'st12' ? { ...a, aliases: [] } : a))
  const r = run(d, master)
  assert.ok(r.warns.some((m: string) => /検索できない/.test(m)))
})

console.log('名称補完（JAPAN-SOURCE 07）')
const COMPLETED: Record<string, string> = {
  gv23: '上星', st1: '承泣', st18: '乳根', st19: '不容', st27: '大巨', st30: '気衝', sp14: '腹結', ht1: '極泉',
  si15: '肩中兪', bl14: '厥陰兪', bl27: '小腸兪', bl32: '次髎', bl37: '殷門', pc1: '天池', te15: '天髎', gb1: '瞳子髎',
}
test('18. 補った16穴は名称だけ（読み・位置・要穴は入れない）、出題基準2026 の直接確認レコードがある', () => {
  for (const [slug, name] of Object.entries(COMPLETED)) {
    const a = ACUPOINTS.find((x) => x.slug === slug)!
    assert.equal(a.name, name, slug)
    assert.equal(a.reading, undefined, slug)
    assert.equal(a.location, undefined, slug)
    assert.equal(a.specialPoints, undefined, slug)
    assert.equal(lib.getAcupointSourceStatus(a).find((s) => s.field === 'name')!.status, 'JAPAN_VERIFIED', slug)
    assert.ok(D.records.some((r) => r.acupointId === slug && r.sourceId === 'KIJUN-2026' && r.sourceText === name && r.verificationStatus === 'JAPAN_VERIFIED'), slug)
  }
})
test('19. 名称は289穴・未設定72穴（重複なし）。睛明（bl1）は出題基準の表記「晴明」と違うため未設定のまま', () => {
  assert.equal(ACUPOINTS.filter((a) => a.name).length, 289)
  assert.equal(ACUPOINTS.filter((a) => !a.name).length, 72)
  assert.equal(new Set(ACUPOINTS.filter((a) => a.name).map((a) => a.name)).size, 289)
  assert.equal(ACUPOINTS.find((a) => a.slug === 'bl1')!.name, undefined)
})

console.log('経穴ページの「情報の根拠」')
test('20. 全361穴：WHO・推論・確認待ちを日本の資料での確認と表示しない', () => {
  for (const a of ACUPOINTS) {
    const { lines, records } = lib.describeAcupointSources(a)
    const st = lib.getAcupointSourceStatus(a)
    for (const l of lines) {
      const fs = st.filter((s) => s.field === l.field && s.status !== 'NOT_APPLICABLE')
      if (l.tone === 'jp') assert.ok(fs.every((s) => s.status === 'JAPAN_VERIFIED'), `${a.slug} ${l.field}`)
      if (fs.some((s) => s.status === 'WHO_VERIFIED')) {
        assert.equal(l.tone, 'intl', `${a.slug} ${l.field}`)
        assert.ok(l.verdict.includes('WHO'), `${a.slug} ${l.field}`)
        assert.ok(l.note?.includes('日本の資料（教科書・公式問題）では未確認'), `${a.slug} ${l.field}`)
      }
      if (l.tone !== 'jp') assert.ok(!/(過去問|出題基準\d*)で確認/.test(l.verdict) || l.field === 'specialPoints', `${a.slug} ${l.field}`)
      // 位置を日本の資料で確認済みと出すときは、教科書が未照合であることを必ず添える（教科書のレコードはまだない）
      if (l.field === 'location' && l.tone === 'jp') assert.ok(l.note?.includes('教科書では未照合'), a.slug)
    }
    // リンクは日本の公的機関の資料だけ（WHO は第三者の転載なのでリンクしない）
    for (const r of records) {
      assert.ok(!r.url || r.url.startsWith('https://ahaki.or.jp/'), `${a.slug} ${r.url}`)
      if (r.source.startsWith('WHO')) assert.equal(r.url, undefined)
    }
  }
})
test('21. 具体例：列欠・攅竹・水溝・曲池・陰谷・睛明の表示', () => {
  const lines = (slug: string) => lib.describeAcupointSources(ACUPOINTS.find((a) => a.slug === slug)!).lines
  const line = (slug: string, f: string) => lines(slug).find((l) => l.field === f)!
  assert.equal(line('lu7', 'name').verdict, '公式過去問（第29〜34回）・国家試験出題基準2026で確認')
  assert.equal(line('bl2', 'name').verdict, '国家試験出題基準2026で確認')
  assert.equal(line('gv26', 'name').tone, 'pending')
  assert.equal(line('gv26', 'location').tone, 'intl')
  assert.equal(line('li11', 'location').tone, 'conflict')
  assert.equal(line('ki10', 'location').tone, 'jp')
  assert.ok(lib.describeAcupointSources(ACUPOINTS.find((a) => a.slug === 'lu7')!).records.every((r) => !r.claim.includes('列缺')))
  assert.equal(lines('bl1').length, 0)
})

console.log('飛揚／飛陽（JAPAN-SOURCE 08）')
test('22. 「飛揚」「飛陽」のどちらでも bl58 が1件だけ出る（正規名は飛揚、飛陽は別名）', () => {
  assert.deepEqual(searchAcupoints(rows, '飛揚').map((p) => p.slug), ['bl58'])
  assert.deepEqual(searchAcupoints(rows, '飛陽').map((p) => p.slug), ['bl58'])
  const a = ACUPOINTS.find((x) => x.slug === 'bl58')!
  assert.equal(a.name, '飛揚')
  assert.ok(a.aliases?.includes('飛陽'))
})
test('23. 34-123：解説は「飛揚」、公式の問題文・選択肢・正答は不変。過去問の解説に「飛陽」は残っていない', () => {
  const q = exams.flat().find((x: { id: string }) => x.id === '34-123')
  assert.equal(q.questionText, '絡穴の部位はどれか。')
  assert.deepEqual(q.choices, [
    '下腿外側、腓骨の前方、外果尖の上方4寸',
    '下腿前面、犢鼻と解渓を結ぶ線上、犢鼻の下方8寸',
    '下腿内側、脛骨内縁の後際、陰陵泉の下方3寸',
    '下腿後外側、腓腹筋外側頭下縁とアキレス腱の間、崑崙の上方7寸',
  ])
  assert.equal(q.answerIndex, 3)
  assert.ok(q.explanation.startsWith('飛揚は足の太陽膀胱経の絡穴'))
  assert.ok(exams.flat().every((x: { explanation: string }) => !x.explanation.includes('飛陽')))
})

console.log(`\n${n} 件成功`)
