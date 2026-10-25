'use client'

import { useEffect } from 'react'

/* ─────────────────────────────────────────────
   演習中のページから離れる前の確認（「← 戻る」ボタン用）

   演習画面が「保存されない途中経過がある」間だけメッセージを登録する。
   「← 戻る」ボタンは、登録があれば確認を出してから移動する。
   途中経過を端末に保存して再開できる演習（年度別・科目別の過去問、今日の10問）は登録しない。
   ───────────────────────────────────────────── */

let currentMessage: string | null = null

export function getLeaveGuardMessage(): string | null {
  return currentMessage
}

/** message が文字列の間だけ、離脱前の確認を有効にする */
export function useLeaveGuard(message: string | null): void {
  useEffect(() => {
    if (!message) return
    currentMessage = message
    return () => {
      if (currentMessage === message) currentMessage = null
    }
  }, [message])
}
