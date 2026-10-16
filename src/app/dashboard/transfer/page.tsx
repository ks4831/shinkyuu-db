import type { Metadata } from 'next'
import Link from 'next/link'
import LearningDataTransfer from '@/components/quiz/LearningDataTransfer'

export const metadata: Metadata = {
  // 端末内の学習記録を扱うページなので検索結果には出さない
  robots: { index: false, follow: true },
  title: '学習記録の保存と読み込み｜鍼灸国家試験クイズ',
  description: '学習記録をファイルに保存し、別のURLや別のブラウザで読み込めます。データはサーバーに送信されません。',
}

export default function LearningDataTransferPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/dashboard" className="hover:text-green-600 transition-colors">学習の記録</Link>
        <span>›</span>
        <span className="text-gray-700">保存と読み込み</span>
      </nav>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">学習記録の保存と読み込み</h1>
      <p className="mt-1 text-sm text-gray-500">
        学習記録は、この端末のブラウザの中だけに保存しています。サイトのURLやブラウザが変わったときは、ここでファイルに保存して、新しい方で読み込んでください。
      </p>
      <LearningDataTransfer />
    </main>
  )
}
