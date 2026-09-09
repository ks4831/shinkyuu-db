'use client'

/* ──────────────────────────────────────────────────────────────
   GA4 イベント送信の薄いラッパー（学習ロジックとは完全に独立）

   - NEXT_PUBLIC_GA_ID 未設定 / 本番以外 では常に no-op。
     → ID が無くてもサイトは壊れず、開発環境ではイベントを送らない。
   - window.gtag 未ロード時も黙ってスキップする。
   - 個人を直接特定する情報は送信しない（呼び出し側の責務でもある）。
   - 重複発火防止：
       ・同一ロード内は in-memory Set で二重送信を防ぐ
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

/** GA4 にイベントを1件送る。重複防止は呼び出し側 or trackXxxOnce で担保する。 */
export function track(event: string, params?: Params) {
  if (!ENABLED || typeof window === 'undefined') return
  const w = window as unknown as { gtag?: (...args: unknown[]) => void }
  if (typeof w.gtag !== 'function') return
  try {
    w.gtag('event', event, params ?? {})
  } catch {
    /* 計測の失敗はサイト動作に影響させない */
  }
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
  markFired(key)
  track(event, params)
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
  sessionMarkFired(key)
  track(event, params)
}
