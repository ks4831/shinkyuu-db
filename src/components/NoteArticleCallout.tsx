'use client'

import { noteArticleHref, type NoteArticle } from '@/data/noteArticles'
import { trackNoteLinkClick } from '@/lib/noteLinkTracking'

/* 科目ページ・テーマページの note 記事への案内（ページ末尾に1ブロック）。
   広告に見えないよう、既存の NoteArticleLinks と同じ控えめな体裁にする。
   1つのページで同じ記事は1回だけ表示する（articles は呼び出し側で重複なし）。 */
export default function NoteArticleCallout({
  articles,
  placement,
}: {
  articles: NoteArticle[]
  placement: 'subject-page' | 'theme-page'
}) {
  const unique = articles.filter((a, i) => articles.findIndex((b) => b.id === a.id) === i)
  if (unique.length === 0) return null
  return (
    <section className="mt-8 mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-4" aria-label="関連する note の記事">
      <h2 className="text-xs font-bold text-gray-600">関連する記事（note・治療家の道）</h2>
      <ul className="mt-2 space-y-3">
        {unique.map((a) => {
          const href = noteArticleHref(a, placement)
          return (
            <li key={a.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackNoteLinkClick(a, placement, href)}
                className="group block"
              >
                <span className="mr-2 inline-block rounded-full border border-green-200 bg-white px-2 py-0.5 align-middle text-[11px] font-bold text-green-700">
                  {a.price === 'free' ? '無料記事' : '有料記事'}
                </span>
                <span className="align-middle text-sm leading-snug text-green-700 group-hover:underline">
                  {a.ctaLabel ?? a.title}
                  <span aria-hidden> ↗</span>
                </span>
              </a>
              {a.summary && <p className="mt-1 text-xs leading-relaxed text-gray-500">{a.summary}</p>}
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[11px] text-gray-400">外部サイト（note）が新しいタブで開きます。</p>
    </section>
  )
}
