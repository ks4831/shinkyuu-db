import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import ScrollToTop from '@/components/ScrollToTop'
import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shinkyuu-db.vercel.app'

// GA4 は「本番ビルド」かつ「Measurement ID が設定済み」のときだけ読み込む。
// 未設定でもサイトは通常どおり動作する。開発環境では読み込まない。
const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const GA_ENABLED = process.env.NODE_ENV === 'production' && !!GA_ID

export const metadata: Metadata = {
  title: {
    default: '鍼灸国家試験の学習クイズ｜1日10問スマホで国試対策',
    template: '%s | 鍼灸国試 学習クイズ＆分析',
  },
  description:
    '過去6年・1,080問の過去問分析にもとづく学習用オリジナル問題を、1日10問スマホで。解説・図解・苦手復習つき。経穴学習・出題傾向分析にも対応。',
  keywords: [
    '鍼灸国家試験',
    'はり師国家試験',
    'きゅう師国家試験',
    '国試対策',
    '鍼灸 クイズ',
    '経絡経穴',
    '経穴',
    '東洋医学',
    '鍼灸学生',
  ],
  openGraph: {
    title: '鍼灸国家試験の学習クイズ｜1日10問スマホで国試対策',
    description: '過去6年1,080問の過去問分析にもとづく学習用オリジナル問題を、1問1画面で。解説・図解・苦手復習つき。',
    url: SITE_URL,
    siteName: '鍼灸国試 学習クイズ＆分析',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '鍼灸国家試験の学習クイズ｜1日10問スマホで国試対策',
    description: '過去6年1,080問の過去問分析にもとづく学習用オリジナル問題。1問1画面・解説と図解つき。',
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
        <ScrollToTop />
        <BottomNav />
        <footer className="border-t border-gray-100 bg-gray-50 mt-auto pb-16 sm:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6 text-sm">
              <div>
                <p className="font-semibold text-gray-700 mb-2">学習</p>
                <ul className="space-y-1.5">
                  <li><Link href="/quiz" className="text-gray-500 hover:text-green-600 transition-colors">学習クイズ（10問ずつ）</Link></li>
                  <li><Link href="/quiz/weak" className="text-gray-500 hover:text-green-600 transition-colors">苦手復習</Link></li>
                  <li><Link href="/dashboard" className="text-gray-500 hover:text-green-600 transition-colors">学習記録</Link></li>
                  <li><Link href="/acupoints" className="text-gray-500 hover:text-green-600 transition-colors">経穴から学ぶ</Link></li>
                  <li><Link href="/acupoints/unasked" className="text-gray-500 hover:text-green-600 transition-colors">未出題の経穴</Link></li>
                  <li><Link href="/subjects" className="text-gray-500 hover:text-green-600 transition-colors">科目から探す</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">出題分析</p>
                <ul className="space-y-1.5">
                  <li><Link href="/analysis/exam-34" className="text-gray-500 hover:text-green-600 transition-colors">第34回分析</Link></li>
                  <li><Link href="/analysis/exam-33" className="text-gray-500 hover:text-green-600 transition-colors">第33回分析</Link></li>
                  <li><Link href="/analysis/compare/recent-6-years" className="text-gray-500 hover:text-green-600 transition-colors">直近6年比較</Link></li>
                  <li><Link href="/analysis/compare/recent-3-years" className="text-gray-500 hover:text-green-600 transition-colors">直近3年比較</Link></li>
                  <li><Link href="/themes/library" className="text-gray-500 hover:text-green-600 transition-colors">テーマ辞典</Link></li>
                  <li><Link href="/themes" className="text-gray-500 hover:text-green-600 transition-colors">テーマ検索</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">テーマ学習ツール（補助）</p>
                <ul className="space-y-1.5">
                  <li><Link href="/study" className="text-gray-500 hover:text-green-600 transition-colors">テーマを暗記する</Link></li>
                  <li><Link href="/study/dashboard" className="text-gray-500 hover:text-green-600 transition-colors">テーマ暗記の進捗</Link></li>
                  <li><Link href="/study/checklist" className="text-gray-500 hover:text-green-600 transition-colors">テーマのチェックリスト</Link></li>
                  <li><Link href="/study/favorites" className="text-gray-500 hover:text-green-600 transition-colors">あとで見るテーマ</Link></li>
                  <li><Link href="/study/weakness" className="text-gray-500 hover:text-green-600 transition-colors">苦手に登録したテーマ</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">このサイトについて</p>
                <ul className="space-y-1.5">
                  <li><Link href="/menu" className="text-gray-500 hover:text-green-600 transition-colors">すべてのメニュー</Link></li>
                  <li><Link href="/about" className="text-gray-500 hover:text-green-600 transition-colors">About</Link></li>
                  <li><Link href="/sources" className="text-gray-500 hover:text-green-600 transition-colors">データソース</Link></li>
                  <li><Link href="/disclaimer" className="text-gray-500 hover:text-green-600 transition-colors">免責事項</Link></li>
                  <li><Link href="/privacy" className="text-gray-500 hover:text-green-600 transition-colors">プライバシーポリシー</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 space-y-1">
              <p>鍼灸国試 学習クイズ＆分析 — 学習クイズは公式過去問の問題文・選択肢を掲載していません（過去問の出題傾向・第35回新出題基準にもとづく学習用オリジナル問題）。</p>
              <p>過去問分析は公益財団法人東洋療法研修試験財団が公表した試験データ（第29〜34回1,080問）をもとにした独自分析。当サイトは非公式です。</p>
            </div>
          </div>
        </footer>
      </body>
      {GA_ENABLED ? <GoogleAnalytics gaId={GA_ID!} /> : null}
    </html>
  )
}
