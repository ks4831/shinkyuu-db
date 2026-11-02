import type { Metadata } from 'next'
import mock02 from '@/data/originalMocks/original-mock-02.json'
import OriginalMockRunner from '@/components/originalMock/OriginalMockRunner'
import type { OriginalMockData } from '@/lib/originalMock'

export const metadata: Metadata = { title: 'オリジナル模擬試験②' }

export default function OriginalMock02Page() {
  return (
    <OriginalMockRunner
      data={mock02 as OriginalMockData}
      updateNote="2026年11月、臨床医学18問（第41〜58問：臨床医学各論15問・臨床医学総論3問）を追加し、全58問になりました。追加前の40問で解いた結果は「40問版」として残しています。"
    />
  )
}
