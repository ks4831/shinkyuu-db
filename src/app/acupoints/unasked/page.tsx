import type { Metadata } from 'next'
import Link from 'next/link'
import { getUnaskedAcupoints, getAcupointStats } from '@/lib/acupoints'
import { MERIDIANS } from '@/data/acupoints'

export const metadata: Metadata = {
  title: '過去6年 未出題の経穴｜鍼灸国家試験の出題分析',
  description:
    '第29〜34回の出題分析で一度も登場しなかった経穴の一覧。所属経脈・特定穴分類つき。「未出題＝覚えなくてよい」ではない点に注意。',
}

export default function UnaskedAcupointsPage() {
  const unasked = getUnaskedAcupoints()
  const total = getAcupointStats().length

  const byMeridian = MERIDIANS.map((m) => ({
    name: m.name,
    points: unasked.filter((a) => a.meridian === m.id),
  })).filter((g) => g.points.length > 0)

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/" className="hover:text-green-600">ホーム</Link>
        <span className="mx-1">/</span>
        <Link href="/acupoints" className="hover:text-green-600">経穴</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">未出題</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">過去6年 未出題の経穴</h1>
      <p className="mt-1 text-sm text-gray-500">
        収録{total}穴のうち、第29〜34回の出題分析で一度も本文に登場しなかった経穴は
        <strong className="text-gray-800"> {unasked.length}穴</strong>。
      </p>

      {/* 注意書き（必須） */}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-800">「未出題＝覚えなくてよい」ではありません。</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-700">
          過去に出ていなくても今後出題される可能性は十分あります。特定穴・要穴は未出題でも必ず学習してください。
          この一覧は「近年の出題傾向で目立っていない穴」を把握するための参考情報です。
          また、当サイトの分析は独自基準によるもので、公式の見解ではありません。
        </p>
      </div>

      {unasked.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">収録しているすべての経穴が、過去6年の分析に登場しています。</p>
      ) : (
        <div className="mt-6 space-y-4">
          {byMeridian.map((g) => (
            <div key={g.name} className="rounded-2xl border border-gray-100 bg-white p-3">
              <p className="mb-2 text-xs font-bold text-gray-600">{g.name}</p>
              <ul className="divide-y divide-gray-50">
                {g.points.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/acupoints/${a.slug}`} className="flex items-center justify-between py-2.5">
                      <span>
                        <span className="text-sm font-bold text-gray-900">{a.name}</span>
                        <span className="ml-2 text-xs text-gray-400">{a.code}</span>
                      </span>
                      <span className="text-right">
                        <span className="text-xs text-gray-500">
                          {a.specialPoints[0] ?? '—'}
                        </span>
                        <span className="ml-2 text-xs font-bold text-gray-300">出題回数 0</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
