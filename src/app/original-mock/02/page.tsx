import type { Metadata } from 'next'
import mock02 from '@/data/originalMocks/original-mock-02.json'
import OriginalMockRunner from '@/components/originalMock/OriginalMockRunner'
import type { OriginalMockData } from '@/lib/originalMock'

export const metadata: Metadata = { title: 'オリジナル模擬試験②' }

export default function OriginalMock02Page() {
  return <OriginalMockRunner data={mock02 as OriginalMockData} />
}
