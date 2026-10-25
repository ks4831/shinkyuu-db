'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  applyVisit,
  backTarget,
  getPendingBack,
  loadHistory,
  saveHistory,
  setPendingBack,
  updateTopScroll,
} from '@/lib/navHistory'
import { getLeaveGuardMessage } from '@/lib/leaveGuard'

/** 今のURL（パス＋クエリ）。末尾の / は付けない（トップを除く） */
function currentUrl(): string {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path + window.location.search
}

/* ── 閲覧履歴の記録（全ページ・トップを含む） ── */
/** 直近のブラウザの戻る・進む（popstate）の時刻。この直後に表示されたページは「戻る・進む」として記録する */
let lastPopStateAt = 0
const POPSTATE_WINDOW_MS = 1000
/** 「← 戻る」の移動先で戻すスクロール位置（移動中のスクロールで履歴の値が変わる前に控えておく） */
let pendingScrollY = 0

function NavTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useEffect(() => {
    const onPop = () => {
      lastPopStateAt = Date.now()
    }
    window.addEventListener('popstate', onPop, { capture: true })
    return () => window.removeEventListener('popstate', onPop, { capture: true })
  }, [])

  useEffect(() => {
    let timer = 0
    // 画面の更新が popstate より先に終わる場合があるため、記録は次のタスクに回す
    // （その時点では popstate が必ず発生済みなので、戻る・進むを取りこぼさない）
    const record = window.setTimeout(() => {
      const url = currentUrl()
      const pending = getPendingBack()
      const viaPopState = Date.now() - lastPopStateAt < POPSTATE_WINDOW_MS
      lastPopStateAt = 0
      const next = applyVisit(loadHistory(), url, { pendingBack: pending, viaPopState })
      saveHistory(next)
      if (pending !== url) return
      // 「← 戻る」で来たときは、前に見ていた位置までスクロールを戻す
      setPendingBack(null)
      const y = pendingScrollY
      let tries = 0
      const restore = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        if (max >= y || tries >= 20) {
          window.scrollTo(0, Math.min(y, Math.max(0, max)))
          return
        }
        tries++
        timer = window.setTimeout(restore, 50)
      }
      restore()
    }, 0)
    return () => {
      window.clearTimeout(record)
      window.clearTimeout(timer)
    }
  }, [pathname, search])

  // 今のページのスクロール位置を履歴に残す（戻ったときに元の位置へ）
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        saveHistory(updateTopScroll(loadHistory(), currentUrl(), window.scrollY))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return null
}

/* ── 「← 戻る」ボタン（トップ以外の全ページの上部） ── */
export default function BackButton() {
  const pathname = usePathname()
  const router = useRouter()
  // 確認は出したページでだけ表示する（ページが変わったら出さない）
  const [confirm, setConfirm] = useState<{ message: string; path: string } | null>(null)
  const confirmMessage = confirm && confirm.path === pathname ? confirm.message : null
  const setConfirmMessage = (message: string | null) => setConfirm(message ? { message, path: pathname } : null)
  const stayRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (confirmMessage) stayRef.current?.focus()
  }, [confirmMessage])

  function go() {
    setConfirmMessage(null)
    const t = backTarget(loadHistory())
    saveHistory(t.next)
    pendingScrollY = t.scrollY
    setPendingBack(t.fallback ? null : t.url)
    router.push(t.url, { scroll: t.fallback })
  }

  function handleClick() {
    const message = getLeaveGuardMessage()
    if (message) setConfirmMessage(message)
    else go()
  }

  const isTop = pathname === '/'

  return (
    <>
      <Suspense fallback={null}>
        <NavTracker />
      </Suspense>
      {!isTop && (
        <div className="mx-auto w-full max-w-5xl px-4 pt-2">
          <button
            type="button"
            onClick={handleClick}
            className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-gray-600 hover:bg-green-50 hover:text-green-700"
          >
            <span aria-hidden="true">←</span> 戻る
          </button>
        </div>
      )}
      {confirmMessage && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => setConfirmMessage(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-confirm-title"
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setConfirmMessage(null)
            }}
          >
            <p id="leave-confirm-title" className="font-bold text-gray-900">演習の途中です</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{confirmMessage}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                ref={stayRef}
                type="button"
                onClick={() => setConfirmMessage(null)}
                className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 sm:flex-1"
              >
                演習を続ける
              </button>
              <button
                type="button"
                onClick={go}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-green-300 sm:flex-1"
              >
                前のページへ戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
