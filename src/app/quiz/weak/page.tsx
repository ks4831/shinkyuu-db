import type { Metadata } from 'next'
import Link from 'next/link'
import WeakQuizClient from '@/components/quiz/WeakQuizClient'

export const metadata: Metadata = {
  title: '苦手復習クイズ｜間違えた問題や復習リストの問題を解き直す',
  description: '間違えた問題や復習リストに追加した問題を出題。間違えた問題は2回続けて正解すると自動で外れます。復習リストの問題は自分で解除するまで残ります。',
}

export default function WeakQuizPage() {
  return (
    <main className="pt-4">
      <nav className="mx-auto mb-2 max-w-md px-4 text-xs text-gray-400">
        <Link href="/quiz" className="hover:text-green-600">予想問題</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">苦手復習</span>
      </nav>
      <WeakQuizClient />
    </main>
  )
}
