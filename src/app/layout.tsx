import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shinkyuu-db.vercel.app'

export const metadata: Metadata = {
  title: {
    default: '鍼灸国家試験 頻出分析データベース｜過去問から出題傾向を分析',
    template: '%s | 鍼灸頻出DB',
  },
  description:
    '第32回〜第34回の鍼灸国家試験540問を分析。頻出テーマランキング、出題傾向、年度比較から効率的な学習を支援します。',
  keywords: [
    '鍼灸国家試験',
    'はり師国家試験',
    'きゅう師国家試験',
    '国試対策',
    '頻出問題',
    '経絡経穴',
    '東洋医学',
    '鍼灸学生',
  ],
  openGraph: {
    title: '鍼灸国家試験 頻出分析データベース',
    description: '第32回〜第34回の540問を分析。頻出テーマランキング・年度比較・科目別割合を可視化。',
    url: SITE_URL,
    siteName: '鍼灸頻出DB',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '鍼灸国家試験 頻出分析データベース',
    description: '第32回〜第34回の540問を分析。頻出テーマランキング・年度比較を可視化。',
  },
  metadataBase: new URL(SITE_URL),
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } }
    : {}),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-white">
        <Header />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-100 bg-gray-50 mt-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6 text-sm">
              <div>
                <p className="font-semibold text-gray-700 mb-2">分析ページ</p>
                <ul className="space-y-1.5">
                  <li><Link href="/analysis/exam-34" className="text-gray-500 hover:text-green-600 transition-colors">第34回分析</Link></li>
                  <li><Link href="/analysis/exam-33" className="text-gray-500 hover:text-green-600 transition-colors">第33回分析</Link></li>
                  <li><Link href="/analysis/exam-32" className="text-gray-500 hover:text-green-600 transition-colors">第32回分析</Link></li>
                  <li><Link href="/analysis/compare/recent-3-years" className="text-gray-500 hover:text-green-600 transition-colors">直近3年比較</Link></li>
                  <li><Link href="/analysis/compare/33-vs-34" className="text-gray-500 hover:text-green-600 transition-colors">33回 vs 34回</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">データ検索</p>
                <ul className="space-y-1.5">
                  <li><Link href="/subjects" className="text-gray-500 hover:text-green-600 transition-colors">科目一覧</Link></li>
                  <li><Link href="/themes" className="text-gray-500 hover:text-green-600 transition-colors">テーマ検索</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">このサイトについて</p>
                <ul className="space-y-1.5">
                  <li><Link href="/about" className="text-gray-500 hover:text-green-600 transition-colors">About</Link></li>
                  <li><Link href="/sources" className="text-gray-500 hover:text-green-600 transition-colors">データソース</Link></li>
                  <li><Link href="/disclaimer" className="text-gray-500 hover:text-green-600 transition-colors">免責事項</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">鍼灸頻出DB</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  第32〜34回の鍼灸国家試験540問を独自分析した非公式データベースです。
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 space-y-1">
              <p>鍼灸国家試験 頻出分析データベース — 問題文・選択肢は掲載していません。</p>
              <p>公益財団法人東洋療法研修試験財団が公表した試験データをもとに独自分析。当サイトは非公式です。</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
