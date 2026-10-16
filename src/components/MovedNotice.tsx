'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* サイト移転のお知らせ（旧URLだけで表示する）。
   NEXT_PUBLIC_MOVED_TO に新しいURLを設定したビルドでだけ表示し、
   新しいサイト（未設定）では何も表示しない。
   学習記録は URL ごとに分かれるため、保存・読み込みのページへ案内する。 */
const MOVED_TO = (process.env.NEXT_PUBLIC_MOVED_TO ?? '').replace(/\/+$/, '')

export default function MovedNotice() {
  const pathname = usePathname() ?? '/'
  if (!MOVED_TO) return null
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="mx-auto max-w-5xl space-y-1">
        <p className="font-bold">鍼灸国試DBは新しいURLに移りました。</p>
        <p>
          <a href={`${MOVED_TO}${pathname}`} className="font-semibold underline">
            {MOVED_TO.replace(/^https?:\/\//, '')}
          </a>{' '}
          で、同じ問題・解説・出題分析を使えます。ブックマークの登録し直しをお願いします。
        </p>
        <p>
          学習記録はURLごとに分かれるため、新しいURLには自動では引き継がれません。
          <Link href="/dashboard/transfer" className="underline">
            このサイトで記録をファイルに保存
          </Link>
          し、新しいURLの同じページで読み込んでください。
        </p>
      </div>
    </div>
  )
}
