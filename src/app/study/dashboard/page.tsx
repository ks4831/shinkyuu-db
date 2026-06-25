import type { Metadata } from 'next'
import Dashboard from './Dashboard'

export const metadata: Metadata = {
  title: '学習ダッシュボード',
  description: '鍼灸国家試験の学習進捗・復習リスト・苦手テーマを一覧管理できる学習ダッシュボード',
}

export default function Page() {
  return <Dashboard />
}
