import type { Metadata } from 'next'
import Weakness from './Weakness'

export const metadata: Metadata = {
  title: '苦手テーマ',
  description: '苦手に登録した鍼灸国家試験テーマを重点的に復習。間違えやすいポイントと暗記のコツを確認。',
}

export default function Page() {
  return <Weakness />
}
