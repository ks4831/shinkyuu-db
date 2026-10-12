'use client'

import type { NoteArticle, NoteLinkPlacement } from '@/data/noteArticles'
import { track } from '@/lib/analytics'

/* DB → note のリンクのクリック計測（GA4 の既存イベント note_link_click）。
   - 送るのは記事・置き場所・リンク先だけ。学習履歴や個人を特定する情報は送らない
   - 1回のクリックで1回だけ送る（リンクごとに onClick を1つだけ付ける）
   - GA4 が無効な環境では track() が何もしない */
export function trackNoteLinkClick(article: NoteArticle, placement: NoteLinkPlacement, href: string) {
  track('note_link_click', {
    note_id: article.id,
    placement,
    subject: article.subjectId ?? 'none',
    price_type: article.price,
    link_url: href,
  })
}
