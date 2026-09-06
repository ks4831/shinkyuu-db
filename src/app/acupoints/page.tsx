import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getPopularAcupoints,
  getSpecialPointGroups,
  getAcupointsByMeridian,
  getAcupointStats,
} from '@/lib/acupoints'
import AcupointSearch from '@/components/acupoints/AcupointSearch'

export const metadata: Metadata = {
  title: '経穴から学ぶ｜人気経穴・特定穴・経脈別ランキング',
  description:
    '過去6年の出題分析に基づく人気経穴ランキング、特定穴（原穴・絡穴・郄穴・募穴・八会穴ほか）の一覧、経脈別の経穴、経穴検索。国家試験の経絡経穴概論対策に。',
}

const IMP_COLOR: Record<string, string> = {
  S: 'bg-red-50 text-red-700 border-red-200',
  A: 'bg-orange-50 text-orange-700 border-orange-200',
  B: 'bg-blue-50 text-blue-700 border-blue-200',
  C: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default function AcupointsPage() {
  const popular = getPopularAcupoints(10)
  const special = getSpecialPointGroups()
  const byMeridian = getAcupointsByMeridian()
  const all = getAcupointStats()

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/" className="hover:text-green-600">ホーム</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">経穴</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">経穴から学ぶ</h1>
      <p className="mt-1 text-sm text-gray-500">
        収録{all.length}穴（特定穴中心）。過去6年の出題分析にもとづく傾向つき。
      </p>

      <Link
        href="/quiz/acupoints"
        className="mt-4 flex items-center justify-between rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-4"
      >
        <span className="font-bold text-emerald-800">経穴クイズを10問解く</span>
        <span className="text-emerald-600">›</span>
      </Link>

      {/* 検索 */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold text-gray-700">経穴を検索</h2>
        <AcupointSearch points={all.map((a) => ({
          slug: a.slug, code: a.code, name: a.name, reading: a.reading, meridianName: a.meridianName,
        }))} />
      </section>

      {/* 人気経穴 */}
      <section className="mt-8">
        <h2 className="mb-1 text-sm font-bold text-gray-700">人気経穴 TOP10</h2>
        <p className="mb-2 text-xs text-gray-400">出題分析での言及の多い順</p>
        <ol className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white">
          {popular.map((a, i) => (
            <li key={a.slug}>
              <Link href={`/acupoints/${a.slug}`} className="flex items-center gap-3 px-3 py-3">
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < 3 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-500'
                }`}>{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-gray-900">
                    {a.name}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">{a.code}</span>
                  </span>
                  <span className="block truncate text-xs text-gray-500">{a.meridianName}</span>
                </span>
                <span className="flex-shrink-0 text-right">
                  <span className="block text-xs font-bold text-green-700">{a.examRounds.length} / 6回</span>
                  <span className={`mt-0.5 inline-block rounded border px-1.5 text-[10px] font-bold ${IMP_COLOR[a.importance]}`}>{a.importance}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* 特定穴ランキング */}
      <section className="mt-8">
        <h2 className="mb-2 text-sm font-bold text-gray-700">特定穴から探す</h2>
        <div className="space-y-4">
          {special.map((g) => (
            <div key={g.key} className="rounded-2xl border border-gray-100 bg-white p-3">
              <p className="mb-2 text-xs font-bold text-green-700">{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.points.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/acupoints/${p.slug}`}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-green-300 hover:bg-green-50"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 未出題経穴への導線 */}
      <Link
        href="/acupoints/unasked"
        className="mt-8 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4"
      >
        <span>
          <span className="block text-sm font-bold text-gray-800">過去6年 未出題の経穴</span>
          <span className="block text-xs text-gray-500">出題分析で一度も登場しなかった経穴</span>
        </span>
        <span className="text-gray-300">›</span>
      </Link>

      {/* 経脈別 */}
      <section className="mt-8">
        <h2 className="mb-2 text-sm font-bold text-gray-700">経脈別に見る</h2>
        <div className="space-y-3">
          {byMeridian.map((m) => (
            <details key={m.id} className="rounded-2xl border border-gray-100 bg-white p-3">
              <summary className="cursor-pointer text-sm font-bold text-gray-800">
                {m.name}
                <span className="ml-1.5 text-xs font-normal text-gray-400">{m.points.length}穴</span>
              </summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.points.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/acupoints/${p.slug}`}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-green-300"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
