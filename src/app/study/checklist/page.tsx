import type { Metadata } from 'next'
import Checklist from './Checklist'

export const metadata: Metadata = {
  title: '学習チェックリスト',
  description: '鍼灸国家試験の重要度S・Aテーマをチェックリストで管理。覚えたテーマにチェックをつけて進捗を確認。',
}

export default function Page() {
  return <Checklist />
}
