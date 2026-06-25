import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* 鍼灸アイコン：鍼（細軸）＋お灸（大きめドーム＋熱気3本） */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="28"
            height="28"
            fill="none"
            aria-hidden="true"
          >
            {/* 鍼：ハンドル（小さめ円）＋細いシャフト */}
            <circle cx="8" cy="5" r="1.8" stroke="#15803d" strokeWidth="1.3" />
            <line
              x1="8" y1="6.8" x2="8" y2="26"
              stroke="#15803d" strokeWidth="0.9" strokeLinecap="round"
            />
            {/* お灸：大きめドーム形状 */}
            <path
              d="M12 29 Q12 20 20.5 20 Q29 20 29 29Z"
              stroke="#15803d" strokeWidth="1.5" strokeLinejoin="round"
            />
            {/* お灸：熱気ライン左 */}
            <path
              d="M16 19.5 Q14.5 16 16 12.5"
              stroke="#15803d" strokeWidth="1.2" strokeLinecap="round"
            />
            {/* お灸：熱気ライン中央（最も高く） */}
            <path
              d="M20.5 19.5 Q19 15 20.5 11"
              stroke="#15803d" strokeWidth="1.2" strokeLinecap="round"
            />
            {/* お灸：熱気ライン右 */}
            <path
              d="M25 19.5 Q26.5 16 25 12.5"
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
