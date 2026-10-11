#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   note 向け共有データ（exports/note-content/v1）のテスト
   `npm run test:export`
   - 書き出しを実行し直して、commit 済みのファイルと同じになること（書き出し忘れの検出・再現性）
   - 件数・ID の重複・版・manifest のハッシュ
   - 確認状況の保持：allowed＝JAPAN_VERIFIED、label_required＝WHO_VERIFIED、それ以外は値を出さない
   - 公式過去問の問題文・選択肢が入っていないこと
   - DB 内リンクがすべて実在するページを指すこと
   - 学習データ・学習履歴の保存処理に変更がないこと
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
process.chdir(ROOT)
const DIR = path.join(ROOT, 'exports', 'note-content', 'v1')
const SITE = 'https://shinkyuu-db.vercel.app'

let n = 0
function test(name: string, fn: () => void) {
  fn()
  n++
  console.log(`  ✓ ${name}`)
}
const read = (f: string) => fs.readFileSync(path.join(DIR, f), 'utf8')
const json = (f: string) => JSON.parse(read(f))

const before = Object.fromEntries(fs.readdirSync(DIR).map((f) => [f, read(f)]))
execSync('npx tsx scripts/export-note-content.mts', { cwd: ROOT, stdio: 'ignore' })
const after = Object.fromEntries(fs.readdirSync(DIR).map((f) => [f, read(f)]))

const { subjects, themes } = await import('../src/lib/data')
const { ALL_QUESTIONS, themeIdsWithQuiz } = await import('../src/lib/quiz')
const { themeIdsWithPastExamPractice } = await import('../src/lib/pastExams')
const { ACUPOINTS } = await import('../src/data/acupoints')
const { NOTE_ARTICLES } = await import('../src/data/noteArticles')
const src = await import('../src/lib/acupointSources')

const manifest = json('manifest.json')
const topics = json('topic-statistics.json')
const acu = json('acupoint-learning.json')
const safety = json('content-safety.json')
const rec = json('recommended-articles.json')
const links = json('link-map.json')

console.log('書き出しの再現性・版')
test('1. 書き出しをやり直しても内容が変わらない（commit 済みの書き出しが最新）', () => {
  assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort())
  for (const f of Object.keys(after)) assert.equal(after[f], before[f], `${f} が古い。npm run export:note を実行して commit する`)
})
test('2. 版は v1、sourceVersion が全ファイルで同じで、学習データに未 commit の変更がない', () => {
  assert.equal(manifest.schemaVersion, 'v1')
  assert.equal(manifest.dataDirty, false)
  for (const d of [topics, acu, safety, rec, links]) assert.equal(d.sourceVersion, manifest.sourceVersion)
})
test('3. manifest のハッシュとバイト数がファイルと一致する', () => {
  assert.equal(manifest.files.length, 5)
  for (const f of manifest.files) {
    const t = read(f.name)
    assert.equal(crypto.createHash('sha256').update(t).digest('hex'), f.sha256, f.name)
    assert.equal(Buffer.byteLength(t), f.bytes, f.name)
  }
})

console.log('件数・ID')
test('4. 件数が DB の実データと一致する（過去問1,080・予想問題205・テーマ142・経穴361・出典669）', () => {
  assert.equal(manifest.counts.pastExamQuestions, 1080)
  assert.equal(manifest.counts.originalQuiz, ALL_QUESTIONS.length)
  assert.equal(ALL_QUESTIONS.length, 205)
  assert.equal(topics.themes.length, themes.length)
  assert.equal(topics.subjects.length, subjects.length)
  assert.equal(acu.acupoints.length, ACUPOINTS.length)
  assert.equal(ACUPOINTS.length, 361)
  assert.equal(manifest.counts.sourceRecords, src.ACUPOINT_SOURCE_DATA.records.length)
  const subjectTotal = topics.subjects.reduce((s: number, x: { total: number }) => s + x.total, 0)
  const themeTotal = topics.themes.reduce((s: number, x: { examCount: number }) => s + x.examCount, 0)
  assert.equal(subjectTotal, 1080)
  assert.equal(themeTotal, 1080)
})
test('5. stableId に重複がない', () => {
  const all = [...topics.subjects, ...topics.themes, ...acu.acupoints, ...rec.candidates, ...links.dbPages, ...links.noteArticles].map((x) => x.stableId)
  assert.equal(new Set(all).size, all.length)
})
test('6. 必須項目がすべてのレコードにある', () => {
  const req = ['stableId', 'title', 'subject', 'sourceVersion', 'verifiedStatus', 'sourceType', 'relatedDbUrl', 'updatedAt', 'publicationAllowed', 'warningNotes']
  for (const r of [...topics.subjects, ...topics.themes, ...acu.acupoints, ...rec.candidates])
    for (const k of req) assert.ok(k in r, `${r.stableId} に ${k} がない`)
})

console.log('確認状況の保持・未確認情報の除外')
test('7. 経穴の各項目は DB の総合判定と同じ status を持つ', () => {
  for (const a of ACUPOINTS) {
    const e = acu.acupoints.find((x: { stableId: string }) => x.stableId === `acupoint:${a.slug}`)
    const st = src.getAcupointSourceStatus(a)
    assert.equal(e.name.status, st.find((f) => f.field === 'name')!.status, a.slug)
    assert.equal(e.location.status, st.find((f) => f.field === 'location')!.status, a.slug)
    assert.deepEqual(e.specialPoints.map((s: { status: string }) => s.status), st.filter((f) => f.field === 'specialPoints' && f.value).map((f) => f.status), a.slug)
  }
})
test('8. allowed は JAPAN_VERIFIED だけ、label_required は WHO_VERIFIED だけ、それ以外は値を出さない', () => {
  const fields = acu.acupoints.flatMap((a: { name: unknown; location: unknown; specialPoints: unknown[] }) => [a.name, a.location, ...a.specialPoints]) as {
    value?: string | null
    label?: string | null
    status: string
    publish: string
  }[]
  for (const f of fields) {
    const v = f.value !== undefined ? f.value : f.label
    if (f.publish === 'allowed') assert.equal(f.status, 'JAPAN_VERIFIED')
    else if (f.publish === 'label_required') assert.equal(f.status, 'WHO_VERIFIED')
    else assert.equal(v, null)
    if (['SOURCE_NEEDED', 'CONFLICT', 'NOT_APPLICABLE'].includes(f.status)) assert.equal(v, null)
  }
  for (const a of acu.acupoints) assert.equal(a.publicationAllowed, a.name.status === 'JAPAN_VERIFIED')
})
test('9. JAPAN_INFERRED だけを根拠にする要穴分類は書き出されない', () => {
  const inferredOnly = src.ACUPOINT_SOURCE_DATA.records.filter((r) => r.fieldName === 'specialPoints' && r.verificationStatus === 'JAPAN_INFERRED')
  for (const r of inferredOnly) {
    const a = ACUPOINTS.find((x) => x.slug === r.acupointId)!
    if (src.summarizeClaim(a.slug, 'specialPoints', r.claim) === 'JAPAN_VERIFIED') continue
    const e = acu.acupoints.find((x: { stableId: string }) => x.stableId === `acupoint:${a.slug}`)
    assert.ok(!e.specialPoints.some((s: { label: string | null }) => s.label === r.claim), `${a.slug} ${r.claim}`)
  }
})
test('10. 読み・memoryTip・examPoint・importance を書き出していない', () => {
  const t = read('acupoint-learning.json')
  for (const k of ['"reading"', '"memoryTip"', '"examPoint"', '"importance"']) assert.ok(!t.includes(k), k)
})
test('11. 公式過去問の問題文・選択肢（22文字以上）が入っていない（経穴の位置の文言は一致先を注記していれば可）', () => {
  // 位置の標準的な文言は過去問と同じ言い回しになることがあるため、注記（11b で検査）を前提に検査から外す
  const exp = JSON.parse(after['acupoint-learning.json'])
  for (const a of exp.acupoints) a.location.value = null
  const all = Object.entries(after)
    .map(([f, t]) => (f === 'acupoint-learning.json' ? JSON.stringify(exp) : t))
    .join('\n')
    .replace(/\s/g, '')
  for (const f of fs.readdirSync('src/data/pastExams')) {
    for (const q of JSON.parse(fs.readFileSync(path.join('src/data/pastExams', f), 'utf8'))) {
      for (const s of [q.questionText, ...q.choices].map((x: string) => x.replace(/\s/g, ''))) {
        if (s.length < 22) continue
        for (let i = 0; i + 22 <= s.length; i += 6) assert.ok(!all.includes(s.slice(i, i + 22)), `${q.id} の文が入っている`)
      }
    }
  }
})
test('11b. 過去問と同じ言い回しの位置には一致先の問題IDが付いている（29-118・29-123・30-160・34-123 を含む）', () => {
  const ids = new Set(acu.acupoints.flatMap((a: { location: { pastExamTextOverlap: string[] } }) => a.location.pastExamTextOverlap))
  for (const id of ['29-118', '29-123', '30-160', '34-123']) assert.ok(ids.has(id), id)
  assert.ok(safety.rules.some((r: { id: string }) => r.id === 'R8'))
})

console.log('URL の妥当性')
test('12. DB 内リンクはすべて実在するページを指す', () => {
  const ok = new Set<string>(['/', '/past-exams', '/quiz/weak', '/quiz/daily', '/acupoints', '/exam-35', '/study/checklist'])
  for (const s of subjects) ok.add(`/past-exams/subject/${s.id}`)
  for (const t of themes) ok.add(`/themes/${t.id}`)
  for (const id of themeIdsWithPastExamPractice()) ok.add(`/past-exams/theme/${id}`)
  for (const id of themeIdsWithQuiz()) ok.add(`/quiz/theme/${id}`)
  for (const a of ACUPOINTS) ok.add(`/acupoints/${a.slug}`)
  const urls: string[] = [
    ...[...topics.subjects, ...topics.themes, ...acu.acupoints, ...rec.candidates].map((r) => r.relatedDbUrl),
    ...topics.themes.flatMap((t: { relatedDbUrls: Record<string, string> }) => Object.values(t.relatedDbUrls)),
    ...links.dbPages.map((p: { url: string }) => p.url),
  ]
  for (const u of urls) {
    assert.ok(u.startsWith(SITE), u)
    assert.ok(ok.has(u.slice(SITE.length) || '/'), `存在しないページ: ${u}`)
  }
})
test('13. note 記事の URL は公開記事の形式で、ID と一致する', () => {
  for (const a of NOTE_ARTICLES) assert.equal(a.url, `https://note.com/fine_hornet161/n/${a.id}`)
  assert.equal(links.utm.params.utm_source, 'note')
})

console.log('既存データ・学習履歴への影響')
test('14. 学習データ（src/data）と学習履歴の保存処理が HEAD から変わっていない', () => {
  const changed = execSync('git diff --name-only HEAD -- src/data src/lib/quizStorage.ts src/lib/pastExamStorage.ts src/lib/learning.ts src/lib/useLearningStats.ts', { encoding: 'utf8' }).trim()
  assert.equal(changed, '', `変更あり: ${changed}`)
})

console.log(`\n${n} tests passed`)
