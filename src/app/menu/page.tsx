import type { Metadata } from 'next'
import Link from 'next/link'
import { pastExamCoverage } from '@/lib/pastExams'

export const metadata: Metadata = {
  title: 'メニュー｜鍼灸国家試験 過去問・予想問題・分析',
  description: '出題分析・テーマ辞典・科目攻略・学習ツールなど、すべての機能への入り口。',
}

const EXAM_34_COLLECTED = pastExamCoverage().find((c) => c.round === 34)?.collected ?? 0

const groups = [
  {
    title: '過去問',
    links: [
      { href: '/past-exams', label: '実際の過去問を解く', note: `第34回・${EXAM_34_COLLECTED}問収録` },
    ],
  },
  {
    title: '予想問題',
    links: [
      { href: '/quiz', label: '予想問題（10問ずつ）', note: '過去問の頻出傾向・第35回新基準をもとにしたオリジナル問題' },
      { href: '/quiz/weak', label: '苦手復習' },
      { href: '/acupoints', label: '経穴から学ぶ' },
      { href: '/subjects', label: '科目から探す' },
    ],
  },
  {
    title: '学習の記録',
    links: [
      { href: '/dashboard', label: '学習記録（メイン）', note: '解いた問題数・正答率・連続学習日数・苦手' },
    ],
  },
  {
    title: '第35回対策（2026年版 新出題基準）',
    links: [
      { href: '/exam-35', label: '第35回 新出題基準まとめ', note: '新設・拡充テーマと過去頻出の二軸で整理' },
      { href: '/quiz/standard-2026', label: '第35回 新基準問題を解く' },
    ],
  },
  {
    title: '出題分析（6年 1,080問）',
    links: [
      { href: '/analysis/exam-34', label: '第34回 分析' },
      { href: '/analysis/exam-33', label: '第33回 分析' },
      { href: '/analysis/compare/recent-6-years', label: '直近6年比較' },
      { href: '/analysis/compare/recent-3-years', label: '直近3年比較' },
      { href: '/themes/library', label: 'テーマ辞典' },
      { href: '/themes', label: 'テーマ検索' },
    ],
  },
  {
    title: 'テーマ学習ツール（補助）',
    links: [
      { href: '/study', label: 'テーマを暗記する（今日の10テーマ）' },
      { href: '/study/checklist', label: 'テーマのチェックリスト' },
      { href: '/study/favorites', label: 'あとで見るテーマ' },
      { href: '/study/weakness', label: '苦手に登録したテーマ' },
      { href: '/study/dashboard', label: 'テーマ暗記の進捗' },
    ],
  },
  {
    title: 'このサイトについて',
    links: [
      { href: '/about', label: 'About' },
      { href: '/sources', label: 'データソース' },
      { href: '/disclaimer', label: '免責事項' },
    ],
  },
]

export default function MenuPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold text-gray-900">メニュー</h1>
      <p className="mt-1 text-sm text-gray-500">分析・辞典・学習ツールはこちらから。</p>

      <div className="mt-5 space-y-5">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{g.title}</h2>
            <ul className="divide-y divide-gray-50 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-gray-800">
                    <span>
                      {l.label}
                      {'note' in l && l.note && (
                        <span className="mt-0.5 block text-xs font-normal text-gray-400">{l.note}</span>
                      )}
                    </span>
                    <span className="text-gray-300">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
