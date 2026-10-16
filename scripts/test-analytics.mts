#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   GA4 イベント送信（src/lib/analytics.ts）のテスト
   `npm run test:analytics`
   - 本物の GA4 には送らない。gtag はテスト内の記録用の関数、ID はテスト用（G-TEST00000）。
   - タイマー・localStorage・sessionStorage は疑似実装。
   - ページの読み込み直しは、モジュールを読み込み直して再現する（ストレージは残る）。
   ────────────────────────────────────────────────────────────── */
import assert from 'node:assert/strict'

process.env.NEXT_PUBLIC_GA_ID = 'G-TEST00000'
;(process.env as Record<string, string>).NODE_ENV = 'production'

/* ── 疑似タイマー ── */
let now = 0
let timers: { at: number; fn: () => void; id: number }[] = []
let nextId = 1
;(globalThis as unknown as { setTimeout: unknown }).setTimeout = (fn: () => void, ms: number) => {
  const id = nextId++
  timers.push({ at: now + ms, fn, id })
  return id
}
function advance(ms: number) {
  const end = now + ms
  for (;;) {
    timers.sort((a, b) => a.at - b.at)
    const t = timers[0]
    if (!t || t.at > end) break
    timers.shift()
    now = t.at
    t.fn()
  }
  now = end
}

/* ── 疑似ストレージと window ── */
function makeStorage() {
  const m = new Map<string, string>()
  return {
    map: m,
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
  }
}
const local = makeStorage()
const session = makeStorage()
type Call = unknown[]
const win: { localStorage: unknown; sessionStorage: unknown; gtag?: (...a: unknown[]) => void } = {
  localStorage: local,
  sessionStorage: session,
}
;(globalThis as unknown as { window: unknown }).window = win

let calls: Call[] = []
/** GA の初期化スクリプトが実行された状態にする */
function initGtag() {
  win.gtag = (...args: unknown[]) => void calls.push(args)
}
const events = () => calls.filter((c) => c[0] === 'event').map((c) => c[1])

let loadNo = 0
/** ページの読み込み（モジュールの状態は初期化、ストレージは維持） */
async function load() {
  delete win.gtag
  timers = []
  return import(`../src/lib/analytics.ts?load=${++loadNo}`) as Promise<typeof import('../src/lib/analytics')>
}
/** 新しいタブ（sessionStorage も空。localStorage は端末なので残す） */
function newTab() {
  session.map.clear()
}
function resetAll() {
  local.map.clear()
  session.map.clear()
  calls = []
  now = 0
}

let n = 0
async function test(name: string, fn: () => Promise<void> | void) {
  resetAll()
  await fn()
  n++
  console.log(`  ✓ ${name}`)
}

console.log('analytics.ts')

await test('直接URLアクセス：初期化前の開始イベントは捨てず、初期化後に1回だけ送る', async () => {
  const A = await load()
  A.trackSessionOnceKeyed('quiz_start', 'random:all', { mode: 'random', target: 'all' })
  A.trackSessionOnce('standard2026_quiz_start')
  A.trackSessionOnce('review_start', { queued: 5 })
  A.trackDailyOnce('daily_start', { resumed: false })
  assert.deepEqual(events(), [])
  // 送れていないので「送信済み」の印はまだ付けない
  assert.equal(session.map.size, 0)
  assert.equal(local.map.size, 0)
  advance(600)
  initGtag()
  advance(200)
  assert.deepEqual(events(), ['quiz_start', 'standard2026_quiz_start', 'review_start', 'daily_start'])
  assert.equal(session.map.get('s:quiz_start:random:all'), '1')
  assert.equal(session.map.get('s:standard2026_quiz_start'), '1')
  assert.equal(session.map.get('s:review_start'), '1')
  assert.ok(String(local.map.get('shinkyuu_analytics_fired_v1')).includes('d:daily_start:'))
  advance(20000)
  assert.equal(events().length, 4)
})

await test('初期化済み（ページ内リンクからの遷移）：その場で送る', async () => {
  const A = await load()
  initGtag()
  A.trackSessionOnceKeyed('quiz_start', 'subject:anatomy', { mode: 'subject', target: 'anatomy' })
  assert.deepEqual(events(), ['quiz_start'])
  assert.equal(session.map.get('s:quiz_start:subject:anatomy'), '1')
  assert.equal(timers.length, 0)
})

await test('GA4の初期化が遅い（5秒）：待ってから1回だけ送る', async () => {
  const A = await load()
  A.trackSessionOnce('review_start', { queued: 3 })
  advance(5000)
  assert.deepEqual(events(), [])
  initGtag()
  advance(200)
  assert.deepEqual(events(), ['review_start'])
  advance(30000)
  assert.deepEqual(events(), ['review_start'])
})

await test('Reactの再描画・StrictModeの二重実行：待ち中に何度呼んでも1回', async () => {
  const A = await load()
  for (let i = 0; i < 3; i++) A.trackSessionOnce('standard2026_quiz_start')
  for (let i = 0; i < 3; i++) A.trackDailyOnce('daily_start', { resumed: false })
  initGtag()
  advance(200)
  for (let i = 0; i < 3; i++) A.trackSessionOnce('standard2026_quiz_start')
  assert.deepEqual(events(), ['standard2026_quiz_start', 'daily_start'])
})

await test('連続クリック：初期化済みでも1回', async () => {
  const A = await load()
  initGtag()
  for (let i = 0; i < 10; i++) A.trackSessionOnceKeyed('pastexam_start', '34', { exam_round: 34, question_count: 180 })
  assert.deepEqual(events(), ['pastexam_start'])
})

await test('戻る操作：同じページロード内の再マウントでも、読み込み直しでも再送しない', async () => {
  let A = await load()
  initGtag()
  A.trackSessionOnce('review_start', { queued: 2 })
  A.trackSessionOnce('review_start', { queued: 2 }) // 戻って再マウント（SPA内）
  A = await load() // 戻る＋再読み込み
  initGtag()
  A.trackSessionOnce('review_start', { queued: 2 })
  advance(1000)
  assert.deepEqual(events(), ['review_start'])
})

await test('GA4が読み込めない：送らず、送信済みの印も付けない。読み込めるようになれば送れる', async () => {
  let A = await load()
  A.trackSessionOnce('standard2026_quiz_start')
  A.trackDailyOnce('daily_start', { resumed: false })
  advance(15000)
  assert.deepEqual(events(), [])
  assert.equal(timers.length, 0) // 待ち続けない
  assert.equal(session.map.size, 0)
  assert.equal(local.map.size, 0)
  // 同じページロード内で、後から初期化された場合は次の呼び出しで送れる
  initGtag()
  A.trackSessionOnce('standard2026_quiz_start')
  assert.deepEqual(events(), ['standard2026_quiz_start'])
  // 次の読み込みでは daily_start も送れる
  A = await load()
  initGtag()
  A.trackDailyOnce('daily_start', { resumed: false })
  assert.deepEqual(events(), ['standard2026_quiz_start', 'daily_start'])
})

await test('今日の10問：送れた日は再訪しても送らない（端末×日付で1回）', async () => {
  let A = await load()
  initGtag()
  A.trackDailyOnce('daily_start', { resumed: false })
  newTab()
  A = await load()
  initGtag()
  A.trackDailyOnce('daily_start', { resumed: true })
  assert.deepEqual(events(), ['daily_start'])
})

await test('送る内容：呼び出し側の値だけ（解答内容や個人情報を足さない）', async () => {
  const A = await load()
  A.trackSessionOnceKeyed('quiz_start', 'theme:an-undoki', { mode: 'theme', target: 'an-undoki' })
  initGtag()
  advance(200)
  assert.deepEqual(calls, [['event', 'quiz_start', { mode: 'theme', target: 'an-undoki' }]])
})

await test('送る順番：待ち行列があれば、初期化後の呼び出しも後ろに並ぶ', async () => {
  const A = await load()
  A.track('note_link_click', { article_id: 'a' })
  initGtag()
  A.track('pastexam_complete', { exam_round: 34 })
  advance(200)
  assert.deepEqual(events(), ['note_link_click', 'pastexam_complete'])
})

await test('gtag が例外を投げても：サイトを止めず、送信済みにしない', async () => {
  const A = await load()
  win.gtag = () => {
    throw new Error('blocked')
  }
  assert.doesNotThrow(() => A.trackSessionOnce('review_start', { queued: 1 }))
  assert.equal(session.map.size, 0)
  initGtag()
  A.trackSessionOnce('review_start', { queued: 1 })
  assert.deepEqual(events(), ['review_start'])
})

await test('GA無効（IDなし・本番以外）：何も送らず、何も保存しない', async () => {
  const savedId = process.env.NEXT_PUBLIC_GA_ID
  process.env.NEXT_PUBLIC_GA_ID = ''
  const A = await load()
  initGtag()
  A.track('note_link_click', { article_id: 'a' })
  A.trackSessionOnce('review_start')
  A.trackDailyOnce('daily_start')
  process.env.NEXT_PUBLIC_GA_ID = savedId
  ;(process.env as Record<string, string>).NODE_ENV = 'development'
  const B = await load()
  initGtag()
  B.trackSessionOnce('review_start')
  ;(process.env as Record<string, string>).NODE_ENV = 'production'
  assert.deepEqual(calls, [])
  assert.equal(session.map.size + local.map.size, 0)
  assert.equal(timers.length, 0)
})

console.log(`\n${n} tests passed`)
