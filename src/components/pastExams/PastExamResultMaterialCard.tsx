'use client'

import { noteArticleHref, noteMaterialForPastExamResult } from '@/data/noteArticles'
import { trackNoteLinkClick } from '@/lib/noteLinkTracking'

/* 科目別過去問の結果画面に出す、関連教材（note の有料教材）の案内。
   - 結果カード（得点・間違えた問題・復習ボタン）の下に1枚だけ。出題中・正誤表示・苦手復習の結果には出さない
   - resultCard を持つ教材がある科目だけ（現在は解剖学・関係法規）。ない科目では何も表示しない
   - 購入しなくても無料の学習は続けられることを明記し、購入を急がせる表現は使わない
   - クリックは note_link_click（placement: pastexam-result）で、科目ページ等のカードと区別する */
export default function PastExamResultMaterialCard({ subjectId }: { subjectId: string }) {
  const article = noteMaterialForPastExamResult(subjectId)
  if (!article || !article.resultCard) return null
  const href = noteArticleHref(article, 'pastexam-result')
  return (
    <section className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4" aria-label="関連する復習教材（note）">
      <p className="text-xs leading-relaxed text-gray-600">
        この科目をもう少し復習したい方へ。オリジナル問題をまとめた復習教材も用意しています。
      </p>
      <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
        <span className="rounded-full border border-gray-300 px-2 py-0.5 text-[11px] font-bold text-gray-600">
          有料教材・{(article.priceYen ?? 0).toLocaleString('ja-JP')}円（note）
        </span>
        <p className="mt-2 text-sm font-bold leading-snug text-gray-800">{article.resultCard.heading}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{article.resultCard.summary}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackNoteLinkClick(article, 'pastexam-result', href)}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-gray-400 px-5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100"
        >
          {article.buttonLabel ?? '教材の内容を見る'}
          <span aria-hidden className="ml-1">↗</span>
        </a>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        外部サイト（note）が新しいタブで開きます。購入しなくても、このサイトの過去問と解説はこれまでどおり無料で使えます。
      </p>
    </section>
  )
}
