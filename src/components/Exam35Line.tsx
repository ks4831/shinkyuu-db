'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { daysUntilExam35 } from '@/lib/exam35'

/**
 * 「第35回まで あと N日」の1行リンク。
 * ビルド時固定を避けるためマウント後に日数を確定する。
 * 確定前・試験日経過後は控えめな固定文言にフォールバック。
 */
export default function Exam35Line({ className = '' }: { className?: string }) {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    setDays(daysUntilExam35())
  }, [])

  return (
    <Link
      href="/exam-35"
      className={`inline-flex items-center gap-1.5 text-sm font-bold text-violet-700 hover:text-violet-800 ${className}`}
    >
      {days != null ? (
        <>第35回まで あと{days}日</>
      ) : (
        <>第35回 新出題基準に対応</>
      )}
      <span aria-hidden>›</span>
    </Link>
  )
}
