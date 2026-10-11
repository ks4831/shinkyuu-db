/* ──────────────────────────────────────────────────────────────
   note「治療家の道｜かず」で公開済みの学習方法の記事（DB → note の導線）
   - 公開済みの記事だけを載せる（下書き・未公開の記事は載せない）
   - 記事の正本は note。タイトルは公開時点のもの（2026-10-11 に RSS で確認）
   - 掲載先（placements）は学習を妨げない位置に1か所1ブロックまで
   ────────────────────────────────────────────────────────────── */

export type NotePlacement = 'past-exams' | 'acupoints' | 'exam-35'

export type NoteArticle = {
  /** note の記事キー（URL の /n/ 以下）。安定ID として使う */
  id: string
  title: string
  url: string
  /** 内容の分類（共有データ link-map.json でも使う） */
  topics: string[]
  placements: NotePlacement[]
}

export const NOTE_ACCOUNT_URL = 'https://note.com/fine_hornet161'

export const NOTE_ARTICLES: NoteArticle[] = [
  {
    id: 'nb284e53363b1',
    title: '鍼灸国試の過去問は何年分やればいい？1,080問を実際に分析してみた',
    url: 'https://note.com/fine_hornet161/n/nb284e53363b1',
    topics: ['past-exams', 'study-plan'],
    placements: ['past-exams'],
  },
  {
    id: 'nd65e3564a30e',
    title: '鍼灸国試、何から勉強すればいい？ まず「全部やらなきゃ」をやめてみる',
    url: 'https://note.com/fine_hornet161/n/nd65e3564a30e',
    topics: ['study-plan'],
    placements: ['past-exams'],
  },
  {
    id: 'n1f60a0e5a4ec',
    title: '経穴が覚えられない鍼灸学生へ。まず「バラバラに覚える」のをやめてみる',
    url: 'https://note.com/fine_hornet161/n/n1f60a0e5a4ec',
    topics: ['acupoints', 'memorization'],
    placements: ['acupoints'],
  },
  {
    id: 'nbdd12746a84d',
    title: '鍼灸国試、経穴はどこまで覚える？2026年版出題基準から整理してみた',
    url: 'https://note.com/fine_hornet161/n/nbdd12746a84d',
    topics: ['acupoints', 'standard-2026'],
    placements: ['acupoints', 'exam-35'],
  },
  {
    id: 'nbad325d6a396',
    title: '第35回鍼灸国試、何が変わる？2026年版出題基準を調べてみた',
    url: 'https://note.com/fine_hornet161/n/nbad325d6a396',
    topics: ['standard-2026'],
    placements: ['exam-35'],
  },
]

export function noteArticlesFor(placement: NotePlacement): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.placements.includes(placement))
}
