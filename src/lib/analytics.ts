'use client'

/* ──────────────────────────────────────────────────────────────
   GA4 イベント送信の薄いラッパー（学習ロジックとは完全に独立）

   - NEXT_PUBLIC_GA_ID 未設定 / 本番以外 では常に no-op。
     → ID が無くてもサイトは壊れず、開発環境ではイベントを送らない。
   - window.gtag 未定義（GA の初期化スクリプトが未実行）のときは、
     このページ内の待ち行列に入れて、定義されたら送る（最大 RETRY_LIMIT_MS）。
     初期化スクリプトは next/script の afterInteractive で、ハイドレーション後に実行される。
     ページを直接開くと、子コンポーネントの useEffect のほうが先に走るため、
     待たずに送ると開始イベントが落ちる（BUSINESS-07 で発見）。
   - 個人を直接特定する情報は送信しない（呼び出し側の責務でもある）。
   - 重複発火防止：
       ・同一ロード内は in-memory Set で二重送信を防ぐ（待ち行列に入れた時点で登録）
       ・「送信済み」の印（localStorage / sessionStorage）は、gtag('event', …) を
         実際に呼べたときだけ付ける。待ちきれなかったときは印を付けず、
         同一ロード内の登録も外して、次の機会に送れるようにする。
         ※ gtag の呼び出し＝送信処理の実行。GA4 サーバーでの受信までは保証しない。
       ・trackDailyOnce … 端末×日付で1回だけ（localStorage）
       ・trackSessionOnce … タブのセッション中に1回だけ（sessionStorage）
     いずれも analytics 専用の新規キーのみを追加し、
     学習用の LocalStorage キー（quiz history / weak / review / daily 等）には触れない。
   ────────────────────────────────────────────────────────────── */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

/** 実際に送信するか。ID が G- で始まり、かつ本番ビルドのときだけ true */
const ENABLED = GA_ID.startsWith('G-') && process.env.NODE_ENV === 'production'

type ParamValue = string | number | boolean
type Params = Record<string, ParamValue>

const FIRED_KEY = 'shinkyuu_analytics_fired_v1'
const MAX_FIRED = 60

/** このページロード内で既に送ったキー */
const firedThisLoad = new Set<string>()

/* ── Asia/Tokyo の日付（daily 用。dailyQuiz.ts とは独立して持つ） ── */
const TOKYO_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function tokyoDate(): string {
  try {
    return TOKYO_FMT.format(new Date())
  } catch {
    return 'na'
  }
}

/* ── localStorage 上の「送信済みキー」台帳（daily 用） ───────── */
function readFired(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(FIRED_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function markFired(key: string) {
  if (typeof window === 'undefined') return
  try {
    const list = readFired().filter((k) => k !== key)
    list.push(key)
    window.localStorage.setItem(FIRED_KEY, JSON.stringify(list.slice(-MAX_FIRED)))
  } catch {
    /* private mode 等では無視 */
  }
}

function hasFired(key: string): boolean {
  return readFired().includes(key)
}

/* ── sessionStorage 上の「送信済み」判定（session 用） ────────── */
function sessionHasFired(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function sessionMarkFired(key: string) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {
    /* 無視 */
  }
}

/* ── 送信 ───────────────────────────────────────────────────── */

type Gtag = (...args: unknown[]) => void

/** gtag が定義されるのを待つ間隔と上限 */
const RETRY_INTERVAL_MS = 200
const RETRY_LIMIT_MS = 15000

type PendingEvent = {
  event: string
  params?: Params
  onSent?: () => void
  onGiveUp?: () => void
}

/** gtag の定義待ちのイベント（このページロード内だけ。保存はしない） */
const pending: PendingEvent[] = []
let retryTimer: ReturnType<typeof setTimeout> | null = null
let waitedMs = 0

function getGtag(): Gtag | null {
  const w = window as unknown as { gtag?: Gtag }
  return typeof w.gtag === 'function' ? w.gtag : null
}

/** gtag を呼ぶ。呼べたら true（計測の失敗はサイト動作に影響させない） */
function callGtag(gtag: Gtag, item: PendingEvent): boolean {
  try {
    gtag('event', item.event, item.params ?? {})
  } catch {
    item.onGiveUp?.()
    return false
  }
  item.onSent?.()
  return true
}

function flushPending() {
  retryTimer = null
  const gtag = getGtag()
  if (gtag) {
    waitedMs = 0
    for (const item of pending.splice(0)) callGtag(gtag, item)
    return
  }
  waitedMs += RETRY_INTERVAL_MS
  if (waitedMs >= RETRY_LIMIT_MS) {
    // GA の初期化スクリプトが読み込めない（ブロック等）。送らず、送信済みの印も付けない
    waitedMs = 0
    for (const item of pending.splice(0)) item.onGiveUp?.()
    return
  }
  retryTimer = setTimeout(flushPending, RETRY_INTERVAL_MS)
}

function dispatch(item: PendingEvent) {
  if (!ENABLED || typeof window === 'undefined') return
  const gtag = getGtag()
  // 先に待っているイベントがあれば、順番を守るため後ろに並べる
  if (gtag && pending.length === 0) {
    callGtag(gtag, item)
    return
  }
  pending.push(item)
  if (retryTimer === null) retryTimer = setTimeout(flushPending, RETRY_INTERVAL_MS)
}

/** GA4 にイベントを1件送る（gtag が未定義なら定義を待つ）。重複防止は呼び出し側 or trackXxxOnce で担保する。 */
export function track(event: string, params?: Params) {
  dispatch({ event, params })
}

/**
 * 端末 × 日付（Asia/Tokyo）で1回だけ送る。
 * 「今日の10問」のように 1日1回が意味を持つイベント用。
 * → Daily完走率の分母・分子が、再読み込みや再訪で二重に膨らまない。
 */
export function trackDailyOnce(event: string, params?: Params) {
  if (!ENABLED) return
  const key = `d:${event}:${tokyoDate()}`
  if (firedThisLoad.has(key)) return
  if (hasFired(key)) {
    firedThisLoad.add(key)
    return
  }
  firedThisLoad.add(key)
  dispatch({
    event,
    params,
    onSent: () => markFired(key),
    onGiveUp: () => firedThisLoad.delete(key),
  })
}

/**
 * タブのセッション中に1回だけ送る（再読み込み・再訪・再レンダリングで再送しない）。
 * 新基準クイズ・苦手復習の開始/完走のように、
 * 「1回の来訪で1カウント」が自然なイベント用。
 */
export function trackSessionOnce(event: string, params?: Params) {
  if (!ENABLED) return
  const key = `s:${event}`
  if (firedThisLoad.has(key)) return
  if (sessionHasFired(key)) {
    firedThisLoad.add(key)
    return
  }
  firedThisLoad.add(key)
  dispatch({
    event,
    params,
    onSent: () => sessionMarkFired(key),
    onGiveUp: () => firedThisLoad.delete(key),
  })
}

/**
 * タブのセッション中、(event, dedupKey) の組み合わせごとに1回だけ送る。
 * 過去問演習（第34回→第33回…）のように、同じイベント名でも対象（回など）が
 * 異なれば別カウントにしたい場合に使う。送信される GA4 イベント名は event のみ
 * （dedupKey は params に含めない限り GA4 側には現れない）。
 * 同じ (event, dedupKey) を同タブで再度行った場合は、trackSessionOnce 同様に送らない。
 */
export function trackSessionOnceKeyed(event: string, dedupKey: string, params?: Params) {
  if (!ENABLED) return
  const key = `s:${event}:${dedupKey}`
  if (firedThisLoad.has(key)) return
  if (sessionHasFired(key)) {
    firedThisLoad.add(key)
    return
  }
  firedThisLoad.add(key)
  dispatch({
    event,
    params,
    onSent: () => sessionMarkFired(key),
    onGiveUp: () => firedThisLoad.delete(key),
  })
}
