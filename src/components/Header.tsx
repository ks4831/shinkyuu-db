import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-green-600 text-xl">🩺</span>
          <span className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">
            鍼灸国家試験 頻出分析DB
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/subjects"
            className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors"
          >
            科目一覧
          </Link>
          <Link
            href="/themes"
            className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors"
          >
            テーマ検索
          </Link>
          <Link
            href="/analysis/exam-34"
            className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors hidden sm:block"
          >
            第34回分析
          </Link>
        </nav>
      </div>
    </header>
  )
}
