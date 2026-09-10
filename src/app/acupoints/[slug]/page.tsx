import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ACUPOINTS } from '@/data/acupoints'
import { getAcupointStat, TOTAL_EXAM_ROUNDS } from '@/lib/acupoints'
import { questionsForAcupoint } from '@/lib/quiz'
import { roundToYear } from '@/lib/utils'

export function generateStaticParams() {
  return ACUPOINTS.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const a = getAcupointStat(slug)
  if (!a) return { title: '経穴が見つかりません' }
  return {
    title: `${a.name}（${a.code}）｜${a.meridianName}の経穴｜国家試験対策`,
    description: `${a.name}は${a.meridianName}の経穴。${a.specialPoints.join('・') || '要穴'}。位置：${a.location}。過去6年の出題状況・覚え方・関連クイズ。`,
  }
}

const IMP_LABEL: Record<string, string> = { S: '最重要', A: '重要', B: '標準', C: '参考' }
const IMP_COLOR: Record<string, string> = {
  S: 'bg-red-50 text-red-700 border-red-200',
  A: 'bg-orange-50 text-orange-700 border-orange-200',
  B: 'bg-blue-50 text-blue-700 border-blue-200',
  C: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default async function AcupointDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const a = getAcupointStat(slug)
  if (!a) notFound()

  const related = questionsForAcupoint(slug)
  const askedRounds = new Set(a.examRounds)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: `${a.name}（${a.code}）`,
    description: `${a.meridianName}の経穴。${a.specialPoints.join('・')}。位置：${a.location}`,
    inDefinedTermSet: '経絡経穴概論',
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/" className="hover:text-green-600">ホーム</Link>
        <span className="mx-1">/</span>
        <Link href="/acupoints" className="hover:text-green-600">経穴</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">{a.name}</span>
      </nav>

      {/* 見出し */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{a.name}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{a.reading}・{a.code}</p>
        </div>
        <span className={`mt-1 rounded-full border px-2.5 py-1 text-xs font-bold ${IMP_COLOR[a.importance]}`}>
          {IMP_LABEL[a.importance]}（{a.importance}）
        </span>
      </div>

      {/* 基本情報 */}
      <dl className="mt-4 space-y-2.5 rounded-2xl border border-gray-100 bg-white p-4 text-sm">
        <div className="flex gap-3">
          <dt className="w-20 flex-shrink-0 font-bold text-gray-500">所属経脈</dt>
          <dd className="text-gray-900">{a.meridianName}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 flex-shrink-0 font-bold text-gray-500">部位</dt>
          <dd className="text-gray-900">{a.region}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 flex-shrink-0 font-bold text-gray-500">特定穴</dt>
          <dd className="text-gray-900">
            {a.specialPoints.length ? (
              <span className="flex flex-wrap gap-1.5">
                {a.specialPoints.map((sp) => (
                  <span key={sp} className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-700">{sp}</span>
                ))}
              </span>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 flex-shrink-0 font-bold text-gray-500">位置</dt>
          <dd className="leading-relaxed text-gray-900">{a.location}</dd>
        </div>
      </dl>
      <p className="mt-1.5 text-xs text-gray-400">※ 位置は要点のみ。正確な取穴は教科書『経絡経穴概論』で確認してください。</p>

      {/* 過去6年の出題状況 */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold text-gray-700">過去6年の出題状況</h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex gap-1.5">
            {[29, 30, 31, 32, 33, 34].map((r) => {
              const hit = askedRounds.has(r)
              return (
                <div key={r} className="flex-1 text-center">
                  <div
                    className={`mx-auto flex h-9 w-full items-center justify-center rounded-lg text-xs font-bold ${
                      hit ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {hit ? '○' : '—'}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">第{r}回</p>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            出題分析での言及：<strong className="text-gray-800">{a.examRounds.length} / {TOTAL_EXAM_ROUNDS}回</strong>
            {a.mentions > 0 && `（延べ${a.mentions}問）`}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            当サイトが独自に付した学習ポイント欄の記述を対象とした集計です（設問文の掲載はありません）。
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            第29〜34回＝{roundToYear(29)}〜{roundToYear(34)}年実施
          </p>
        </div>
      </section>

      {/* 何を問われやすいか */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold text-gray-700">何を問われやすいか</h2>
        <p className="rounded-2xl border border-gray-100 bg-white p-4 text-sm leading-relaxed text-gray-700">
          {a.examPoint}
        </p>
      </section>

      {/* 覚え方 */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold text-gray-700">覚え方</h2>
        <p className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-gray-800">
          {a.memoryTip}
        </p>
      </section>

      {/* この経穴のクイズを解く */}
      <Link
        href="/quiz/acupoints"
        className="mt-6 block rounded-xl bg-green-600 px-5 py-4 text-center text-base font-bold text-white hover:bg-green-700"
      >
        経穴クイズを解く（10問）
      </Link>

      {related.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-gray-700">この経穴に関連する問題</h2>
          <ul className="space-y-2">
            {related.map((q) => (
              <li key={q.id} className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700">
                {q.question}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-400">これらは学習用オリジナル問題です。「経穴クイズ」からランダムに出ます。</p>
        </section>
      )}

      <div className="mt-8 flex gap-3 text-sm">
        <Link href="/acupoints" className="text-green-600 hover:underline">← 経穴一覧へ</Link>
        <Link href="/acupoints/unasked" className="text-green-600 hover:underline">未出題の経穴</Link>
      </div>
    </main>
  )
}
