import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="group flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" fill="none" aria-hidden="true">
            <circle cx="8" cy="5" r="1.8" stroke="#15803d" strokeWidth="1.3" />
            <line x1="8" y1="6.8" x2="8" y2="26" stroke="#15803d" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M12 29 Q12 20 20.5 20 Q29 20 29 29Z" stroke="#15803d" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M16 19.5 Q14.5 16 16 12.5" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M20.5 19.5 Q19 15 20.5 11" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M25 19.5 Q26.5 16 25 12.5" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-bold text-gray-800 group-hover:text-green-700 sm:text-base">
            鍼灸国試 <span className="hidden sm:inline">クイズ＆分析</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <Link href="/quiz" className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-green-50 hover:text-green-700">クイズ</Link>
          <Link href="/acupoints" className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-green-50 hover:text-green-700">経穴</Link>
          <Link href="/subjects" className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-green-50 hover:text-green-700">科目</Link>
          <Link href="/analysis/compare/recent-6-years" className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-green-50 hover:text-green-700">分析</Link>
          <Link href="/dashboard" className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-green-50 hover:text-green-700">学習記録</Link>
          <Link href="/menu" className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-green-50 hover:text-green-700">メニュー</Link>
        </nav>

        {/* Mobile: single CTA */}
        <Link
          href="/quiz/random"
          className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-700 sm:hidden"
        >
          10問
        </Link>
      </div>
    </header>
  )
}
