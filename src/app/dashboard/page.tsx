import type { Metadata } from 'next'
import DashboardClient from '@/components/quiz/DashboardClient'

export const metadata: Metadata = {
  title: '学習の記録｜鍼灸国家試験クイズ',
  description: '解いた問題数・正答率・連続学習日数・科目別の正答率を確認できます。データは端末内にのみ保存されます。',
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold text-gray-900">学習の記録</h1>
      <p className="mt-1 text-sm text-gray-500">クイズの解答履歴から集計しています（端末内保存）。</p>
      <DashboardClient />
    </main>
  )
}
