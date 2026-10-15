/* ──────────────────────────────────────────────────────────────
   note「治療家の道｜かず」で公開済みの記事（DB → note の導線）
   - 公開済みの記事だけを載せる（下書き・未公開の記事は載せない）
   - 無料記事（price: 'free'）と有料教材（price: 'paid'・priceYen）を区別する。有料教材は科目・テーマページのカードだけに出し、
     一覧ページ（placements）や過去問の演習画面には出さない
   - 記事の正本は note。タイトルは公開ページの表記（2026-10-11 に RSS、
     2026-10-12 に追加分を公開ページで確認）
   - 掲載先は学習を妨げない位置に1か所1ブロックまで。同じ記事を1画面に2回出さない
   - 科目ページ・テーマページへの掲載は、記事の内容と直接関係するページだけ
     （subjectId / themeIds）。テーマは記事の本文で取り上げたものに限る
   - id は note の記事キーで、重複登録しない（npm run test:export で検査）
   ────────────────────────────────────────────────────────────── */

export type NotePlacement = 'past-exams' | 'acupoints' | 'exam-35'

/** リンクを置いた場所。UTM の utm_content と GA4 の placement に使う */
export type NoteLinkPlacement = NotePlacement | 'subject-page' | 'theme-page' | 'exam-analysis'

export type NoteArticle = {
  /** note の記事キー（URL の /n/ 以下）。安定ID として使う */
  id: string
  title: string
  url: string
  /** 内容の分類（共有データ link-map.json でも使う） */
  topics: string[]
  /** 一覧ページ（/past-exams・/acupoints・/exam-35）への掲載 */
  placements: NotePlacement[]
  /** 無料記事か有料記事（教材）か */
  price: 'free' | 'paid'
  /** 有料記事の価格（円）。無料記事は省略 */
  priceYen?: number
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
  /** 科目ページ・テーマページのカードの見出し（未設定なら ctaLabel → title） */
  cardHeading?: string
  /** カードのボタン文言（未設定なら「記事を読む」） */
  buttonLabel?: string
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
    cardHeading: '無料で出題傾向を確認',
    buttonLabel: '無料記事を読む',
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
    // 本文で節を立てて取り上げた上位5テーマ（2026-10-12 の分類見直し後）と、神経系の節で触れた脳神経
    themeIds: ['an-undoki', 'an-naizo', 'an-shinkei', 'an-junkanki', 'an-soshiki', 'no-shinkei'],
    ctaLabel: '解剖学の過去6年の出題傾向と復習の優先順位を無料で読む',
    summary: '過去6年54問の分析と、復習の優先順位を紹介しています。',
    cardHeading: '無料で出題傾向を確認',
    buttonLabel: '無料記事を読む',
    utmCampaign: 'anatomy_2026',
  },
  {
    id: 'n71e70e443d05',
    title: '第35回鍼灸国試｜生理学はどこから勉強する？過去6年の出題傾向と復習の優先順位',
    url: 'https://note.com/fine_hornet161/n/n71e70e443d05',
    topics: ['physiology', 'past-exams', 'study-plan'],
    placements: [],
    price: 'free',
    publishedAt: '2026-10-13',
    subjectId: 'physiology',
    // 本文で節を立てて取り上げたテーマ（神経・内分泌・循環・筋・呼吸）
    themeIds: ['ph-shinkei-seiri', 'ph-naibunpi-seiri', 'ph-junkan-seiri', 'ph-kinshukushuku', 'ph-kokyu-seiri'],
    ctaLabel: '生理学の過去6年の出題傾向と復習の優先順位を無料で読む',
    summary: '過去6年54問の分析と、頻出テーマで押さえたい仕組みを紹介しています。',
    cardHeading: '無料で出題傾向を確認',
    buttonLabel: '無料記事を読む',
    utmCampaign: 'physiology_2026',
  },
  {
    // 有料教材（980円）。内容はオリジナル問題で、DB の過去問データは使っていない
    id: 'n042d1f1052e6',
    title: '第35回鍼灸国試｜解剖学 頻出テーマ攻略ノート',
    url: 'https://note.com/fine_hornet161/n/n042d1f1052e6',
    topics: ['anatomy', 'original-questions', 'study-plan'],
    placements: [],
    price: 'paid',
    priceYen: 980,
    publishedAt: '2026-10-12',
    subjectId: 'anatomy',
    // 教材の60問が扱う主なテーマ（問題数の多い順に上位5）
    themeIds: ['an-undoki', 'an-naizo', 'an-shinkei', 'an-junkanki', 'an-soshiki'],
    cardHeading: '問題演習で理解を確認',
    summary: 'オリジナル四択60問と全問解説（PDF 41ページ）、解答記録用のExcel 6シート。サンプル2問は販売ページで無料で読めます。ファイルはパソコンでZIPを解凍して使います。',
    buttonLabel: '教材の内容を見る',
    utmCampaign: 'anatomy_paid_2026',
  },
]

export function noteArticlesFor(placement: NotePlacement): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.placements.includes(placement))
}

/** 回別の出題分析ページ（/analysis/exam-*）に案内する記事。
    出題傾向の分析と学習の優先順位を扱う無料記事だけ（有料教材は載せない）。
    placements には入れない（placements は一覧ページのURLとして共有データに書き出すため） */
const EXAM_ANALYSIS_ARTICLE_IDS = ['nb284e53363b1', 'nd65e3564a30e']

export function noteArticlesForExamAnalysis(): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.price === 'free' && EXAM_ANALYSIS_ARTICLE_IDS.includes(a.id))
}

/** 科目ページに案内する記事 */
export function noteArticlesForSubject(subjectId: string): NoteArticle[] {
  return sortFreeFirst(NOTE_ARTICLES.filter((a) => a.subjectId === subjectId))
}

/** 無料記事を先、有料教材を後に並べる（同じ区分の中は台帳の順） */
function sortFreeFirst(list: NoteArticle[]): NoteArticle[] {
  return [...list.filter((a) => a.price === 'free'), ...list.filter((a) => a.price === 'paid')]
}

/** テーマページに案内する記事 */
export function noteArticlesForTheme(themeId: string): NoteArticle[] {
  return sortFreeFirst(NOTE_ARTICLES.filter((a) => a.themeIds?.includes(themeId)))
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
