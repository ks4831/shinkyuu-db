import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'メニュー｜鍼灸国家試験 学習・分析',
  description: '出題分析・テーマ辞典・科目攻略・学習ツールなど、すべての機能への入り口。',
}

const groups = [
  {
    title: '学習',
    links: [
      { href: '/quiz', label: 'クイズ（10問ずつ）' },
      { href: '/quiz/weak', label: '苦手復習' },
      { href: '/acupoints', label: '経穴から学ぶ' },
      { href: '/dashboard', label: '学習の記録' },
      { href: '/subjects', label: '科目から探す' },
    ],
  },
  {
    title: '出題分析（6年 1,080問）',
    links: [
      { href: '/analysis/exam-34', label: '第34回 分析' },
      { href: '/analysis/exam-33', label: '第33回 分析' },
      { href: '/analysis/compare/recent-6-years', label: '直近6年比較' },
      { href: '/analysis/compare/recent-3-years', label: '直近3年比較' },
      { href: '/themes/library', label: 'テーマ辞典' },
      { href: '/themes', label: 'テーマ検索' },
    ],
  },
  {
    title: 'テーマ別の学習管理',
    links: [
      { href: '/study', label: '今日の10テーマ' },
      { href: '/study/checklist', label: 'チェックリスト' },
      { href: '/study/favorites', label: '復習リスト（テーマ）' },
      { href: '/study/weakness', label: '苦手テーマ' },
      { href: '/study/dashboard', label: 'テーマ学習ダッシュボード' },
    ],
  },
  {
    title: 'このサイトについて',
    links: [
      { href: '/about', label: 'About' },
      { href: '/sources', label: 'データソース' },
      { href: '/disclaimer', label: '免責事項' },
    ],
  },
]

export default function MenuPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold text-gray-900">メニュー</h1>
      <p className="mt-1 text-sm text-gray-500">分析・辞典・学習ツールはこちらから。</p>

      <div className="mt-5 space-y-5">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{g.title}</h2>
            <ul className="divide-y divide-gray-50 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-gray-800">
                    {l.label}
                    <span className="text-gray-300">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
