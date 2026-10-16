import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardClient from '@/components/quiz/DashboardClient'
import DailyDashboardCard from '@/components/quiz/DailyDashboardCard'

export const metadata: Metadata = {
  // 端末内の学習記録だけを表示するページなので検索結果には出さない
  robots: { index: false, follow: true },
  title: '学習の記録｜鍼灸国家試験クイズ',
  description: '解いた問題数・正答率・連続学習日数・科目別の正答率を確認できます。データは端末内にのみ保存されます。',
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold text-gray-900">学習の記録</h1>
      <p className="mt-1 text-sm text-gray-500">クイズの解答履歴から集計しています（端末内保存）。</p>
      <DailyDashboardCard />
      <DashboardClient />
      <p className="mt-8 text-center text-sm">
        <Link href="/dashboard/transfer" className="text-green-700 underline">
          学習記録をファイルに保存・読み込む
        </Link>
      </p>
    </main>
  )
}
