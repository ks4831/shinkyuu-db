#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   学習記録の書き出し・読み込み（src/lib/learningDataTransfer.ts）のテスト
   `npm run test:transfer`
   - localStorage は疑似実装。2つの「サイト（オリジン）」を別々のストレージで再現する。
   - テストデータは架空の値。実際の利用者の記録は使わない。
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'

function makeStorage() {
  const m = new Map<string, string>()
  return {
    map: m,
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
  }
}
const oldSite = makeStorage()
const newSite = makeStorage()
let current = oldSite
let events = 0
;(globalThis as unknown as { window: unknown }).window = {
  get localStorage() {
    return current
  },
  dispatchEvent: () => {
    events++
    return true
  },
}

// ログに記録の中身が出ないことを確かめるため、console を記録する
const logged: string[] = []
for (const m of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  console[m] = ((...a: unknown[]) => void logged.push(a.map(String).join(' '))) as typeof console.log
}
const out = (s: string) => process.stdout.write(s + '\n')

const T = await import('../src/lib/learningDataTransfer')
const Q = await import('../src/lib/quizStorage')

const SAMPLE: Record<string, unknown> = {
  shinkyuu_quiz_history_v1: {
    attempts: [
      { qid: 'ma-005', subject: 'acupoint', correct: false, at: 1760000000000 },
      { qid: 'hy-007', subject: 'physiology', correct: true, at: 1760000100000 },
    ],
    studyDays: ['2026-10-16'],
  },
  shinkyuu_quiz_weak_v1: [{ qid: 'ma-005', subject: 'acupoint', streak: 0, addedAt: 1760000000000 }],
  shinkyuu_quiz_review_v1: ['hy-007'],
  shinkyuu_daily_quiz_v1: { date: '2026-10-16', questionIds: ['ma-005', 'hy-007'], answers: [false, null], currentIndex: 1, completed: false },
  shinkyuu_daily_streak_v1: { currentStreak: 3, longestStreak: 5, lastCompletedDate: '2026-10-15' },
  shinkyuu_daily_history_v1: [{ date: '2026-10-15', correct: 7, total: 10, completed: true }],
  shinkyuu_pastexam_history_v1: [{ questionId: '34-001', examRound: 34, correct: true, answeredAt: 1760000200000 }],
  shinkyuu_pastexam_session_v1: { '34': { examRound: 34, answers: [{ questionId: '34-001', questionNumber: 1, correct: true }], completed: false, updatedAt: 1760000200000 } },
  shinkyuu_checked: ['an-undoki'],
  shinkyuu_favorites: ['rg-menkyo'],
  shinkyuu_weakness: ['an-shinkei'],
}
const SECRET_MARK = 'an-shinkei'

function seed(s: ReturnType<typeof makeStorage>, data: Record<string, unknown>) {
  for (const [k, v] of Object.entries(data)) s.setItem(k, JSON.stringify(v))
}
function reset() {
  oldSite.map.clear()
  newSite.map.clear()
  current = oldSite
  events = 0
}
const fileText = (data: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ format: T.TRANSFER_FORMAT, version: 1, exportedAt: '2026-10-16T09:00:00.000Z', data, ...extra })

let n = 0
function test(name: string, fn: () => void) {
  reset()
  fn()
  n++
  out(`  ✓ ${name}`)
}

out('learningDataTransfer.ts')

test('対象キーは学習用の11個。計測用のキーは含めない', () => {
  assert.equal(T.LEARNING_KEYS.length, 11)
  assert.deepEqual(T.LEARNING_KEYS.map((k) => k.key).sort(), Object.keys(SAMPLE).sort())
  oldSite.setItem('shinkyuu_analytics_fired_v1', JSON.stringify(['d:daily_start:2026-10-16']))
  seed(oldSite, SAMPLE)
  assert.ok(!('shinkyuu_analytics_fired_v1' in T.buildExport().data))
})

test('旧サイトで書き出し → 新サイトで読み込み：全項目が同じ値になる', () => {
  seed(oldSite, SAMPLE)
  const text = JSON.stringify(T.buildExport(new Date('2026-10-16T09:00:00Z')))
  current = newSite
  const r = T.parseImport(text)
  assert.ok(r.ok)
  const res = T.applyImport(r.file, 'fill')
  assert.equal(res.written.length, 11)
  for (const k of Object.keys(SAMPLE)) assert.deepEqual(JSON.parse(newSite.getItem(k)!), SAMPLE[k])
  // 既存の読み出し処理がそのまま使える（形式を変えていない）
  assert.equal(Q.getHistory().attempts.length, 2)
  assert.equal(events, 1)
})

test('書き出し：壊れた値・空の値は入れない', () => {
  oldSite.setItem('shinkyuu_quiz_review_v1', '{壊れたJSON')
  oldSite.setItem('shinkyuu_favorites', '[]')
  oldSite.setItem('shinkyuu_checked', JSON.stringify([1, 2])) // 形が違う
  oldSite.setItem('shinkyuu_weakness', JSON.stringify(['an-naizo']))
  assert.deepEqual(Object.keys(T.buildExport().data), ['shinkyuu_weakness'])
})

test('不正なファイルは全体を拒否し、何も書き込まない', () => {
  current = newSite
  const bad = [
    'not json',
    JSON.stringify([1, 2, 3]),
    JSON.stringify({ format: 'other', version: 1, exportedAt: 'x', data: {} }),
    fileText(SAMPLE, { version: 2 }),
    fileText({}),
    fileText({ ...SAMPLE, shinkyuu_analytics_fired_v1: [] }), // 対象外のキー
    fileText({ ...SAMPLE, other_site_key: 'x' }),
    fileText({ shinkyuu_quiz_review_v1: [123] }),
    fileText({ shinkyuu_quiz_history_v1: { attempts: [{ qid: 'a' }], studyDays: [] } }),
    fileText({ shinkyuu_quiz_weak_v1: [{ qid: 'a', subject: 's', streak: 'x', addedAt: 1 }] }),
    fileText({ shinkyuu_pastexam_session_v1: { '33': { examRound: 34, answers: [], completed: false, updatedAt: 1 } } }),
    fileText({ shinkyuu_quiz_review_v1: ['x'.repeat(201)] }),
    fileText({ shinkyuu_quiz_review_v1: Array(20001).fill('a') }),
    fileText({ shinkyuu_daily_streak_v1: { currentStreak: Infinity, longestStreak: 1, lastCompletedDate: '' } }),
    fileText({ shinkyuu_quiz_review_v1: ['a'] }, { exportedAt: 1 }),
  ]
  for (const t of bad) {
    const r = T.parseImport(t)
    assert.equal(r.ok, false, t.slice(0, 80))
  }
  assert.equal(newSite.map.size, 0)
})

test('大きすぎるファイルは拒否する', () => {
  const big = fileText({ shinkyuu_quiz_review_v1: ['a'] }) + ' '.repeat(T.MAX_FILE_BYTES)
  assert.equal(T.parseImport(big).ok, false)
})

test('空の項目だけ読み込む（fill）：この端末の記録は上書きせず、混ぜない', () => {
  current = newSite
  const mine = ['an-junkanki']
  newSite.setItem('shinkyuu_weakness', JSON.stringify(mine))
  const r = T.parseImport(fileText(SAMPLE))
  assert.ok(r.ok)
  const plan = T.planImport(r.file, 'fill')
  assert.equal(plan.find((p) => p.key === 'shinkyuu_weakness')!.write, false)
  const res = T.applyImport(r.file, 'fill')
  assert.equal(res.written.length, 10)
  assert.deepEqual(JSON.parse(newSite.getItem('shinkyuu_weakness')!), mine)
})

test('二度読み込んでも重複しない', () => {
  current = newSite
  const r = T.parseImport(fileText(SAMPLE))
  assert.ok(r.ok)
  T.applyImport(r.file, 'fill')
  const second = T.applyImport(r.file, 'fill')
  assert.equal(second.written.length, 0)
  assert.equal(JSON.parse(newSite.getItem('shinkyuu_quiz_history_v1')!).attempts.length, 2)
  T.applyImport(r.file, 'replace')
  assert.equal(JSON.parse(newSite.getItem('shinkyuu_quiz_history_v1')!).attempts.length, 2)
})

test('置き換える（replace）：ファイルにある項目だけ置き換え、ない項目は残す', () => {
  current = newSite
  newSite.setItem('shinkyuu_weakness', JSON.stringify(['an-junkanki']))
  newSite.setItem('shinkyuu_favorites', JSON.stringify(['keep-me']))
  const r = T.parseImport(fileText({ shinkyuu_weakness: ['an-shinkei'] }))
  assert.ok(r.ok)
  const res = T.applyImport(r.file, 'replace')
  assert.deepEqual(res.written, ['shinkyuu_weakness'])
  assert.deepEqual(JSON.parse(newSite.getItem('shinkyuu_weakness')!), ['an-shinkei'])
  assert.deepEqual(JSON.parse(newSite.getItem('shinkyuu_favorites')!), ['keep-me'])
})

test('保存に失敗した項目は failed として返し、ほかの項目は続ける', () => {
  current = newSite
  const orig = newSite.setItem
  newSite.setItem = (k: string, v: string) => {
    if (k === 'shinkyuu_quiz_history_v1') throw new Error('QuotaExceeded')
    orig(k, v)
  }
  const r = T.parseImport(fileText(SAMPLE))
  assert.ok(r.ok)
  const res = T.applyImport(r.file, 'fill')
  newSite.setItem = orig
  assert.deepEqual(res.failed, ['shinkyuu_quiz_history_v1'])
  assert.equal(res.written.length, 10)
})

test('件数の表示：中身は出さず件数だけ', () => {
  assert.equal(T.countItems('shinkyuu_quiz_history_v1', SAMPLE.shinkyuu_quiz_history_v1), 2)
  assert.equal(T.countItems('shinkyuu_quiz_history_v1', { attempts: [], studyDays: [] }), 0)
  assert.equal(T.countItems('shinkyuu_pastexam_session_v1', SAMPLE.shinkyuu_pastexam_session_v1), 1)
  assert.equal(T.countItems('shinkyuu_daily_streak_v1', SAMPLE.shinkyuu_daily_streak_v1), 1)
})

test('学習記録をログに出さない', () => {
  seed(oldSite, SAMPLE)
  const text = JSON.stringify(T.buildExport())
  current = newSite
  const r = T.parseImport(text)
  assert.ok(r.ok)
  T.applyImport(r.file, 'replace')
  T.parseImport('not json')
  assert.ok(!logged.some((l) => l.includes(SECRET_MARK) || l.includes('ma-005')))
})

test('ファイル名は日付だけ（個人を特定する情報を入れない）', () => {
  assert.equal(T.exportFileName(new Date(2026, 9, 16)), 'shinkyuu-db-learning-20261016.json')
})

// ── 旧サイト用の保存ブックマーク（src/lib/legacyExport.ts） ──
const L = await import('../src/lib/legacyExport')
const vm = await import('node:vm')

/** 旧サイトのページでブックマークを実行したときの動きを再現する */
async function runBookmarklet(host: string, store: ReturnType<typeof makeStorage>) {
  const blobs: Blob[] = []
  const downloads: string[] = []
  const messages: string[] = []
  const calls: string[] = []
  const el = (tag: string) => {
    const o: Record<string, unknown> = {
      tag,
      setAttribute: () => {},
      remove: () => {},
      click() {
        if (tag === 'a') downloads.push(String(o.download))
      },
    }
    return o
  }
  const watched = {
    getItem: (k: string) => (calls.push('get:' + k), store.getItem(k)),
    setItem: () => void calls.push('set'),
    removeItem: () => void calls.push('remove'),
    clear: () => void calls.push('clear'),
  }
  const ctx = {
    location: { hostname: host },
    window: { localStorage: watched },
    document: {
      createElement: el,
      body: {
        appendChild: (o: { tag: string; textContent?: string }) => {
          if (o.tag === 'div') messages.push(String(o.textContent))
        },
      },
    },
    URL: { createObjectURL: (b: Blob) => (blobs.push(b), 'blob:x'), revokeObjectURL: () => {} },
    Blob,
    setTimeout: () => 0,
  }
  // 利用者がブックマークに登録する文字列（javascript:…）を、ブラウザと同じく復号して実行する
  const code = decodeURIComponent(L.legacyExportBookmarklet().slice('javascript:'.length))
  vm.runInNewContext(code, ctx)
  const text = blobs.length ? await blobs[0].text() : null
  return { text, downloads, messages, calls }
}

async function testAsync(name: string, fn: () => Promise<void>) {
  reset()
  await fn()
  n++
  out(`  ✓ ${name}`)
}

await testAsync('旧サイト用ブックマーク：保存したファイルを新サイトでそのまま読み込める', async () => {
  seed(oldSite, SAMPLE)
  oldSite.setItem('shinkyuu_analytics_fired_v1', JSON.stringify({ x: 1 }))
  oldSite.setItem('other_key', 'not-learning-data')
  const before = new Map(oldSite.map)
  const r = await runBookmarklet('shinkyuu-db.vercel.app', oldSite)
  assert.equal(r.downloads.length, 1)
  assert.match(r.downloads[0], /^shinkyuu-db-learning-\d{8}\.json$/)
  assert.ok(r.text)
  const parsed = T.parseImport(r.text!)
  assert.ok(parsed.ok)
  assert.deepEqual(parsed.file.data, SAMPLE)
  // 旧サイトの記録は変わらない（読むだけ）。読むのは対象の11キーだけ
  assert.deepEqual(oldSite.map, before)
  assert.ok(!r.calls.some((c) => c === 'set' || c === 'remove' || c === 'clear'))
  assert.deepEqual(r.calls.map((c) => c.slice(4)).sort(), T.LEARNING_KEYS.map((k) => k.key).sort())
  // 新サイトで読み込むと、元の値と一致する
  current = newSite
  T.applyImport(parsed.file, 'fill')
  for (const [k, v] of Object.entries(SAMPLE)) assert.deepEqual(JSON.parse(newSite.getItem(k)!), v)
})

await testAsync('旧サイト用ブックマーク：旧サイト以外では何も読まず、保存しない', async () => {
  seed(oldSite, SAMPLE)
  const r = await runBookmarklet('example.com', oldSite)
  assert.equal(r.downloads.length, 0)
  assert.equal(r.calls.length, 0)
  assert.match(r.messages[0], /旧サイト/)
})

await testAsync('旧サイト用ブックマーク：記録がなければ保存しない・壊れた値は飛ばす', async () => {
  oldSite.setItem('shinkyuu_quiz_review_v1', '[]')
  oldSite.setItem('shinkyuu_checked', '{broken')
  const r = await runBookmarklet('shinkyuu-db.vercel.app', oldSite)
  assert.equal(r.downloads.length, 0)
  assert.match(r.messages[0], /見つかりませんでした/)
})

test('旧サイト用ブックマーク：通信・書き込みの処理を含まない', () => {
  const src = L.legacyExportSource()
  for (const bad of ['fetch', 'XMLHttpRequest', 'sendBeacon', 'Image', 'WebSocket', 'setItem', 'removeItem', 'clear(', 'eval', 'import(', '<script', 'cookie']) {
    assert.ok(!src.includes(bad), bad)
  }
  assert.ok(L.legacyExportBookmarklet().startsWith('javascript:'))
})

out(`\n${n} tests passed`)
