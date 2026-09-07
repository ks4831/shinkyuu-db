'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  {
    href: '/',
    label: 'ホーム',
    match: (p: string) => p === '/',
    icon: (
      <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
    ),
  },
  {
    href: '/quiz',
    label: 'クイズ',
    match: (p: string) => p.startsWith('/quiz'),
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8v.5" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </>
    ),
  },
  {
    href: '/acupoints',
    label: '経穴',
    match: (p: string) => p.startsWith('/acupoints'),
    icon: (
      <>
        <path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  {
    href: '/dashboard',
    label: '学習記録',
    match: (p: string) => p.startsWith('/dashboard') || p.startsWith('/quiz/weak') || p.startsWith('/study'),
    icon: (
      <>
        <path d="M4 19V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
        <path d="M8 15v-3M12 15V9M16 15v-5" />
      </>
    ),
  },
  {
    href: '/menu',
    label: 'その他',
    match: (p: string) => ['/menu', '/analysis', '/themes', '/subjects', '/about'].some((x) => p.startsWith(x)),
    icon: (
      <>
        <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname() || '/'

  return (
    <nav
      aria-label="下部ナビゲーション"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {items.map((it) => {
          const active = it.match(pathname)
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                  active ? 'text-green-700' : 'text-gray-400'
                }`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {it.icon}
                </svg>
                {it.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
