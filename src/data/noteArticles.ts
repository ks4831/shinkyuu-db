/* ──────────────────────────────────────────────────────────────
   note「治療家の道｜かず」で公開済みの記事（DB → note の導線）
   - 公開済みの記事だけを載せる（下書き・未公開の記事は載せない）
   - 記事の正本は note。タイトルは公開ページの表記（2026-10-11 に RSS、
     2026-10-12 に追加分を公開ページで確認）
   - 掲載先は学習を妨げない位置に1か所1ブロックまで。同じ記事を1画面に2回出さない
   - 科目ページ・テーマページへの掲載は、記事の内容と直接関係するページだけ
     （subjectId / themeIds）。テーマは記事の本文で取り上げたものに限る
   - id は note の記事キーで、重複登録しない（npm run test:export で検査）
   ────────────────────────────────────────────────────────────── */

export type NotePlacement = 'past-exams' | 'acupoints' | 'exam-35'

/** リンクを置いた場所。UTM の utm_content と GA4 の placement に使う */
export type NoteLinkPlacement = NotePlacement | 'subject-page' | 'theme-page'

export type NoteArticle = {
  /** note の記事キー（URL の /n/ 以下）。安定ID として使う */
  id: string
  title: string
  url: string
  /** 内容の分類（共有データ link-map.json でも使う） */
  topics: string[]
  /** 一覧ページ（/past-exams・/acupoints・/exam-35）への掲載 */
  placements: NotePlacement[]
  /** 無料記事か有料記事か。DB から案内するのは今のところ無料記事だけ */
  price: 'free' | 'paid'
  /** note の公開日（JST） */
  publishedAt?: string
  /** 科目ページ /subjects/[subjectId] に案内を出す科目 */
  subjectId?: string
  /** テーマページ /themes/[themeId] に案内を出すテーマ（記事の本文で取り上げたもの） */
  themeIds?: string[]
  /** 科目ページ・テーマページの案内文 */
  ctaLabel?: string
  /** 案内の補足（1文） */
  summary?: string
  /** UTM の utm_campaign。未設定なら note_<id> */
  utmCampaign?: string
}

export const NOTE_ACCOUNT_URL = 'https://note.com/fine_hornet161'

export const NOTE_ARTICLES: NoteArticle[] = [
  {
    id: 'nb284e53363b1',
    title: '鍼灸国試の過去問は何年分やればいい？1,080問を実際に分析してみた',
    url: 'https://note.com/fine_hornet161/n/nb284e53363b1',
    topics: ['past-exams', 'study-plan'],
    placements: ['past-exams'],
    price: 'free',
  },
  {
    id: 'nd65e3564a30e',
    title: '鍼灸国試、何から勉強すればいい？ まず「全部やらなきゃ」をやめてみる',
    url: 'https://note.com/fine_hornet161/n/nd65e3564a30e',
    topics: ['study-plan'],
    placements: ['past-exams'],
    price: 'free',
  },
  {
    id: 'n1f60a0e5a4ec',
    title: '経穴が覚えられない鍼灸学生へ。まず「バラバラに覚える」のをやめてみる',
    url: 'https://note.com/fine_hornet161/n/n1f60a0e5a4ec',
    topics: ['acupoints', 'memorization'],
    placements: ['acupoints'],
    price: 'free',
  },
  {
    id: 'nbdd12746a84d',
    title: '鍼灸国試、経穴はどこまで覚える？2026年版出題基準から整理してみた',
    url: 'https://note.com/fine_hornet161/n/nbdd12746a84d',
    topics: ['acupoints', 'standard-2026'],
    placements: ['acupoints', 'exam-35'],
    price: 'free',
  },
  {
    id: 'nbad325d6a396',
    title: '第35回鍼灸国試、何が変わる？2026年版出題基準を調べてみた',
    url: 'https://note.com/fine_hornet161/n/nbad325d6a396',
    topics: ['standard-2026'],
    placements: ['exam-35'],
    price: 'free',
  },
  {
    id: 'nbb0e2d581329',
    title: '鍼灸国試の関係法規、過去6年の24問を全部分類してみた｜あはき法で繰り返し問われている5つのこと',
    url: 'https://note.com/fine_hornet161/n/nbb0e2d581329',
    topics: ['regulations', 'past-exams'],
    placements: [],
    price: 'free',
    publishedAt: '2026-10-11',
    subjectId: 'regulations',
    // 本文で取り上げた：免許・施術所（届出と構造設備）・罰則・広告
    themeIds: ['rg-menkyo', 'rg-seijutsujo', 'rg-bassoku', 'rg-kokoku'],
    ctaLabel: '関係法規の過去6年24問の分類と、繰り返し問われている5つのことを無料で読む',
    summary: '第29〜34回の関係法規24問を、DBのデータで分類した記事です。',
    utmCampaign: 'regulations_2026',
  },
  {
    id: 'nd244c9e50879',
    title: '第35回鍼灸国試｜解剖学はどこから勉強する？過去6年の出題傾向から考える復習の優先順位',
    url: 'https://note.com/fine_hornet161/n/nd244c9e50879',
    topics: ['anatomy', 'past-exams', 'study-plan'],
    placements: [],
    price: 'free',
    publishedAt: '2026-10-12',
    subjectId: 'anatomy',
    // 本文で節を立てて取り上げた上位5テーマ
    themeIds: ['an-undoki', 'an-naizo', 'an-junkanki', 'an-shinkei', 'no-shinkei'],
    ctaLabel: '解剖学の過去6年の出題傾向と復習の優先順位を無料で読む',
    summary: '第29〜34回の解剖学54問を、DBのテーマ別に集計した記事です。',
    utmCampaign: 'anatomy_2026',
  },
]

export function noteArticlesFor(placement: NotePlacement): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.placements.includes(placement))
}

/** 科目ページに案内する記事 */
export function noteArticlesForSubject(subjectId: string): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.subjectId === subjectId)
}

/** テーマページに案内する記事 */
export function noteArticlesForTheme(themeId: string): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.themeIds?.includes(themeId))
}

/** DB → note のリンク先（UTM 付き）。utm_content は置いた場所 */
export function noteArticleHref(article: NoteArticle, placement: NoteLinkPlacement): string {
  const params = new URLSearchParams({
    utm_source: 'shinkyuu-db',
    utm_medium: 'referral',
    utm_campaign: article.utmCampaign ?? `note_${article.id}`,
    utm_content: placement.replace(/-/g, '_'),
  })
  return `${article.url}?${params.toString()}`
}
