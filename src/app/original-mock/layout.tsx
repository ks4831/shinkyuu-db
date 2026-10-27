import type { Metadata } from 'next'

// オリジナル模擬試験：公式問題ではなく、AIで作成・検証した教材であることを全ページの上部に明記する。
// 有資格者の最終確認が済むまでは、検索エンジンには登録させない。
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function OriginalMockLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
        サイト独自に作ったオリジナル問題で、国家試験の公式問題ではありません。AIを使って作成・検証した教材で、はり師・きゅう師などの有資格者による最終確認はまだ済んでいません。
      </div>
      {children}
    </div>
  )
}
