import type { Metadata } from 'next'
import Favorites from './Favorites'

export const metadata: Metadata = {
  title: '復習リスト',
  description: '「あとで復習」に登録した鍼灸国家試験テーマの一覧。いつでも確認・削除が可能。',
}

export default function Page() {
  return <Favorites />
}
