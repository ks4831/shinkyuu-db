import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* 鍼灸アイコン：鍼（縦型ハンドル＋シャフト）＋お灸（ドーム＋熱気3本） */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="30"
            height="30"
            fill="none"
            aria-hidden="true"
          >
            {/* 鍼：ハンドル（円環）＋縦シャフト */}
            <circle cx="9" cy="5" r="2.2" stroke="#15803d" strokeWidth="1.7" />
            <line
              x1="9" y1="7.2" x2="9" y2="25"
              stroke="#15803d" strokeWidth="1.6" strokeLinecap="round"
            />
            {/* お灸：ドーム形状 */}
            <path
              d="M13 29 Q13 22 20 22 Q27 22 27 29Z"
              stroke="#15803d" strokeWidth="1.5" strokeLinejoin="round"
            />
            {/* お灸：熱気ライン左 */}
            <path
              d="M16 21.5 Q15 18 16 14.5"
              stroke="#15803d" strokeWidth="1.2" strokeLinecap="round"
            />
            {/* お灸：熱気ライン中央（最も高く） */}
            <path
              d="M20 21.5 Q19 17 20 13"
              stroke="#15803d" strokeWidth="1.2" strokeLinecap="round"
            />
            {/* お灸：熱気ライン右 */}
            <path
              d="M24 21.5 Q25 18 24 14.5"
              stroke="#15803d" strokeWidth="1.2" strokeLinecap="round"
            />
          </svg>
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
