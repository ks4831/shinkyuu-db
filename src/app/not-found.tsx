import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — ページが見つかりません',
}

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-4 py-24 text-center">
      {/* 鍼灸アイコン */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width="80"
        height="80"
        fill="none"
        className="mx-auto mb-6 opacity-60"
        aria-hidden="true"
      >
        {/* 鍼 */}
        <circle cx="16" cy="10" r="3.5" stroke="#15803d" strokeWidth="2.5" />
        <line x1="16" y1="13.5" x2="16" y2="50" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />
        {/* お灸ドーム */}
        <path d="M24 58 Q24 43 40 43 Q56 43 56 58Z" stroke="#15803d" strokeWidth="2.5" strokeLinejoin="round" />
        {/* 熱気 */}
        <path d="M31 42 Q29 35 31 28" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 42 Q38 33 40 25" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        <path d="M49 42 Q51 35 49 28" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        {/* × マーク */}
        <line x1="44" y1="6" x2="56" y2="18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="56" y1="6" x2="44" y2="18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-2">
        404 NOT FOUND
      </p>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        ページが見つかりません
      </h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        お探しのページは移動または削除された可能性があります。<br />
        URLをご確認いただくか、下のリンクからお探しください。
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="bg-green-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-green-700 transition-colors"
        >
          トップに戻る
        </Link>
        <Link
          href="/themes"
          className="bg-white text-green-700 border border-green-300 px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-green-50 transition-colors"
        >
          テーマ検索
        </Link>
        <Link
          href="/analysis/exam-34"
          className="bg-white text-gray-700 border border-gray-200 px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          第34回分析
        </Link>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        <Link href="/subjects" className="hover:text-green-600 transition-colors">科目一覧</Link>
        <span className="mx-2">·</span>
        <Link href="/analysis/compare/recent-4-years" className="hover:text-green-600 transition-colors">4年比較分析</Link>
        <span className="mx-2">·</span>
        <Link href="/about" className="hover:text-green-600 transition-colors">About</Link>
      </p>
    </main>
  )
}
