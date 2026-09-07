import type { Metadata } from 'next'
import Link from 'next/link'

// /admin/* はサイト運営者向けの内部ページ。
// robots.txt で Disallow、sitemap からも除外、サイト内リンクも張らない。
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800">
        管理用ページです（サイト運営者向け・検索エンジン非登録）。
        <Link href="/" className="ml-2 underline hover:text-amber-900">サイトトップへ</Link>
      </div>
      {children}
    </div>
  )
}
