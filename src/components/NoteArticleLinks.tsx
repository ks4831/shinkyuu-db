'use client'

import { noteArticleHref, noteArticlesFor, type NotePlacement } from '@/data/noteArticles'
import { trackNoteLinkClick } from '@/lib/noteLinkTracking'

/* note の学習方法の記事への控えめな導線（ページ末尾に1ブロック）。
   クリックは GA4 の note_link_click で数える。学習履歴などの個人データは送らない。 */
export default function NoteArticleLinks({ placement }: { placement: NotePlacement }) {
  const articles = noteArticlesFor(placement)
  if (articles.length === 0) return null
  return (
    <section className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <h2 className="text-xs font-bold text-gray-600">学習の進め方を読む（note・治療家の道）</h2>
      <ul className="mt-2 space-y-2">
        {articles.map((a) => {
          const href = noteArticleHref(a, placement)
          return (
            <li key={a.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackNoteLinkClick(a, placement, href)}
                className="text-sm leading-snug text-green-700 hover:underline"
              >
                {a.title}
              </a>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[11px] text-gray-400">外部サイト（note）が開きます。</p>
    </section>
  )
}
