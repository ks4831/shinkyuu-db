import type { Metadata } from 'next'
import Link from 'next/link'
import WeakQuizClient from '@/components/quiz/WeakQuizClient'

export const metadata: Metadata = {
  title: '苦手復習クイズ｜間違えた問題だけ解き直す',
  description: '間違えた問題や復習登録した問題だけを出題。連続で正解すると苦手リストから自動で外れます。',
}

export default function WeakQuizPage() {
  return (
    <main className="pt-4">
      <nav className="mx-auto mb-2 max-w-md px-4 text-xs text-gray-400">
        <Link href="/quiz" className="hover:text-green-600">クイズ</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">苦手復習</span>
      </nav>
      <WeakQuizClient />
    </main>
  )
}
