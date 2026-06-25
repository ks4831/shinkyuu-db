'use client'

import { useEffect, useState, useCallback } from 'react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={handleClick}
      aria-label="ページ上部へ戻る"
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center text-lg font-bold"
    >
      ↑
    </button>
  )
}
