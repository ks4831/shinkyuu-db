'use client'

import { noteArticleHref, noteArticlesForHome } from '@/data/noteArticles'
import { trackNoteLinkClick } from '@/lib/noteLinkTracking'

/* HOME「学習をもっと深める」。メイン3カードとサブ導線の下に、控えめなリンク一覧として置く。
   - 無料記事と有料教材は見出し・ラベル・価格で分けて表示する
   - note は新しいタブで開く（このタブの演習画面・学習記録はそのまま残る）
   - クリックは既存の note_link_click（placement: home）で数える。学習履歴は送らない */
export default function HomeNoteSection() {
  const items = noteArticlesForHome()
  const free = items.filter((x) => x.article.price === 'free')
  const paid = items.filter((x) => x.article.price === 'paid')
  if (items.length === 0) return null

  const groups = [
    { key: 'free', heading: '無料で読む', list: free },
    { key: 'paid', heading: '有料教材（note で購入）', list: paid },
  ].filter((g) => g.list.length > 0)

  return (
    <section id="home-note" className="scroll-mt-20 px-4 pt-8" aria-labelledby="home-note-heading">
      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <h2 id="home-note-heading" className="text-sm font-bold text-gray-700">
          学習をもっと深める
          <span className="ml-2 text-[11px] font-semibold text-gray-400">note・鍼灸国試ラボ</span>
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.key}>
              <h3 className="text-xs font-bold text-gray-500">{g.heading}</h3>
              <ul className="mt-1.5 space-y-1.5">
                {g.list.map(({ article, label }) => {
                  const href = noteArticleHref(article, 'home')
                  const isPaid = article.price === 'paid'
                  return (
                    <li key={article.id}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackNoteLinkClick(article, 'home', href)}
                        className="flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 hover:border-gray-300"
                      >
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            isPaid ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {isPaid ? `有料 ${article.priceYen?.toLocaleString()}円` : '無料'}
                        </span>
                        <span className="min-w-0 flex-1 text-sm leading-snug text-gray-800">{label}</span>
                        <span className="flex-shrink-0 text-gray-300" aria-hidden="true">↗</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          外部サイト（note）が新しいタブで開きます。有料教材はオリジナル問題の教材で、このサイトの過去問演習は引き続き無料で使えます。
        </p>
      </div>
    </section>
  )
}
