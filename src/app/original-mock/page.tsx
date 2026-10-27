import type { Metadata } from 'next'
import Link from 'next/link'
import mock02 from '@/data/originalMocks/original-mock-02.json'
import { scoreBySubject, type OriginalMockData } from '@/lib/originalMock'

export const metadata: Metadata = { title: 'オリジナル模擬試験' }

const MOCKS: { href: string; data: OriginalMockData }[] = [{ href: '/original-mock/02', data: mock02 as OriginalMockData }]

export default function OriginalMockListPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-28 pt-6">
      <h1 className="text-2xl font-black text-gray-900">オリジナル模擬試験</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        サイト独自に作った問題です。国家試験の過去問・予想問題とは別に記録します。
      </p>
      <div className="mt-5 space-y-3">
        {MOCKS.map(({ href, data }) => (
          <Link
            key={href}
            href={href}
            className="group relative block overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 pt-5 shadow-sm hover:border-teal-300"
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-teal-500" aria-hidden="true" />
            <span className="text-lg font-black text-gray-900">{data.title}</span>
            <span className="mt-1 block text-[26px] font-black leading-none text-teal-700">{data.questions.length}問</span>
            <span className="mt-2 block text-sm text-gray-700">
              {scoreBySubject(data.questions, []).map((r) => `${r.subject}${r.total}`).join('・')}
            </span>
            <span className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-teal-200 text-sm font-bold text-teal-700 group-hover:bg-teal-50">
              解く <span className="ml-1" aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400">オリジナル模擬試験①は、このアプリには収録していません。</p>
    </main>
  )
}
