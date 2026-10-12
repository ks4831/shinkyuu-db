'use client'

import { noteArticleHref, type NoteArticle } from '@/data/noteArticles'
import { trackNoteLinkClick } from '@/lib/noteLinkTracking'

/* 科目ページ・テーマページの note 記事への案内（ページ末尾に1ブロック）。
   - 無料記事と有料教材をカードで並べる（スマホは縦並び、sm 以上は横並び）
   - 無料は「無料記事」、有料は「有料教材・価格」と明記し、購入を急かす表現は使わない
   - 1つのカードにリンクは1つ（ボタンだけ）。同じ記事は1ページに1回だけ表示する
   - 過去問の演習画面には置かない（呼び出し側：/subjects/[subjectId]・/themes/[themeId] の末尾のみ） */
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
      <h2 className="text-xs font-bold text-gray-600">関連する記事・教材（note・治療家の道）</h2>
      <ul className={`mt-3 grid gap-3 ${unique.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {unique.map((a) => {
          const href = noteArticleHref(a, placement)
          const paid = a.price === 'paid'
          return (
            <li key={a.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4">
              <span
                className={`self-start rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                  paid ? 'border-gray-300 text-gray-600' : 'border-green-200 text-green-700'
                }`}
              >
                {paid ? `有料教材・${(a.priceYen ?? 0).toLocaleString('ja-JP')}円` : '無料記事'}
              </span>
              <p className="mt-2 text-sm font-bold leading-snug text-gray-800">{a.cardHeading ?? a.ctaLabel ?? a.title}</p>
              {a.summary && <p className="mt-1 text-xs leading-relaxed text-gray-500">{a.summary}</p>}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackNoteLinkClick(a, placement, href)}
                className={`mt-3 inline-flex items-center justify-center self-start rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  paid
                    ? 'border border-gray-400 text-gray-700 hover:bg-gray-100'
                    : 'border border-green-600 text-green-700 hover:bg-green-50'
                }`}
              >
                {a.buttonLabel ?? '記事を読む'}
                <span aria-hidden className="ml-1">↗</span>
              </a>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[11px] text-gray-400">外部サイト（note）が新しいタブで開きます。有料教材は note で内容を確認してから購入できます。</p>
    </section>
  )
}
