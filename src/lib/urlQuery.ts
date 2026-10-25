'use client'

import { useEffect, useRef } from 'react'

/* ─────────────────────────────────────────────
   検索条件をURLのクエリ（?q= など）に残す

   検索結果から詳細ページへ進み、「← 戻る」やブラウザの戻るで検索ページに戻ったときに、
   同じ検索結果を表示するため。URLの書き換えは replaceState（履歴は増やさない）。
   静的出力のため、初期表示は空で描画し、マウント後にURLから復元する。
   ───────────────────────────────────────────── */

export function readQuery(): URLSearchParams {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
}

/** 指定したキーだけを書き換える（空文字・既定値は削除）。他のクエリ（UTMなど）は残す */
export function writeQuery(values: Record<string, string>, defaults: Record<string, string> = {}): void {
  const params = readQuery()
  for (const [k, v] of Object.entries(values)) {
    if (!v || v === defaults[k]) params.delete(k)
    else params.set(k, v)
  }
  const qs = params.toString()
  const next = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
  if (next !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, '', next)
  }
}

/**
 * マウント時に1度だけURLから復元し、その後は値が変わるたびにURLへ書く。
 * restore：URLの値を各 state に入れる関数。マウント直後（復元前の初期値）の書き込みはしない。
 */
export function useQuerySync(restore: (params: URLSearchParams) => void, values: Record<string, string>, defaults: Record<string, string> = {}): void {
  useEffect(() => {
    restore(readQuery())
    // 復元はマウント時の1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const mounted = useRef(false)
  const key = JSON.stringify(values)
  useEffect(() => {
    // 初回は復元前の初期値なので書かない（URLの検索条件を消さないため）
    if (!mounted.current) {
      mounted.current = true
      return
    }
    writeQuery(values, defaults)
    // values は key で比較する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
