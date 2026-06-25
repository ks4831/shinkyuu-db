import type { Metadata } from 'next'
import Link from 'next/link'
import { themes, subjects } from '@/lib/data'
import ImportanceBadge from '@/components/ImportanceBadge'
import { importanceLabel } from '@/lib/utils'
import type { Importance } from '@/lib/types'

export const metadata: Metadata = {
  title: 'テーマ辞典',
  description: '鍼灸国家試験の頻出テーマを重要度S/A/B/C別に完全収録。各テーマの出題回数・最新出題年度・学習ポイントを辞典形式でまとめました。',
}

const IMP_ORDER: Importance[] = ['S', 'A', 'B', 'C']

const IMP_STYLE: Record<Importance, { bg: string; border: string; badge: string; title: string; desc: string }> = {
  S: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-600 text-white', title: '最重要テーマ', desc: '毎年出題。絶対に落とせない核心テーマ。' },
  A: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500 text-white', title: '重要テーマ', desc: '出題頻度が高く、コスパよく得点できるテーマ。' },
  B: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500 text-white', title: '標準テーマ', desc: '余裕があれば優先して押さえたいテーマ。' },
  C: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-400 text-white', title: '参考テーマ', desc: '出題頻度は低め。関連テーマと合わせて学習。' },
}

export default function LibraryPage() {
  const grouped = IMP_ORDER.reduce<Record<Importance, typeof themes[0][]>>(
    (acc, imp) => {
      acc[imp] = themes.filter(t => t.importance === imp)
      return acc
    },
    { S: [], A: [], B: [], C: [] }
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav aria-label="パンくず" className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span aria-hidden>›</span>
        <span className="text-gray-700">テーマ辞典</span>
      </nav>

      {/* ヘッダー */}
      <div className="mb-8">
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-1">THEME DICTIONARY</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">鍼灸国家試験 テーマ辞典</h1>
        <p className="text-sm text-gray-500">
          頻出テーマ{themes.length}件を重要度別に収録。出題回数・最新出題年度・学習ポイントを辞典形式でまとめました。
        </p>
      </div>

      {/* 重要度サマリー */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {IMP_ORDER.map(imp => {
          const style = IMP_STYLE[imp]
          const count = grouped[imp].length
          return (
            <a key={imp} href={`#imp-${imp}`} className={`rounded-xl border p-4 text-center hover:shadow-sm transition-all ${style.bg} ${style.border}`}>
              <span className={`inline-block px-3 py-0.5 rounded-full text-sm font-bold mb-2 ${style.badge}`}>{imp}</span>
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500">{style.title}</p>
            </a>
          )
        })}
      </div>

      {/* 科目フィルターリンク */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-500 mb-2 tracking-wider uppercase">科目から探す</p>
        <div className="flex flex-wrap gap-2">
          {subjects.map(s => (
            <Link
              key={s.id}
              href={`/subjects/${s.id}`}
              className="text-xs px-3 py-1.5 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-600 hover:text-green-700 rounded-full transition-all"
            >
              {s.shortName}
            </Link>
          ))}
        </div>
      </div>

      {/* 重要度別テーマ一覧 */}
      {IMP_ORDER.map(imp => {
        const style = IMP_STYLE[imp]
        const list = grouped[imp]
        if (list.length === 0) return null
        return (
          <section key={imp} id={`imp-${imp}`} className="mb-10">
            <div className={`flex items-center gap-3 rounded-xl border px-5 py-3 mb-4 ${style.bg} ${style.border}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${style.badge}`}>
                {imp}
              </span>
              <div>
                <h2 className="font-bold text-gray-800">{importanceLabel(imp)} テーマ（{style.title}）</h2>
                <p className="text-xs text-gray-500">{style.desc}</p>
              </div>
              <span className="ml-auto text-2xl font-black text-gray-400">{list.length}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {list.map(theme => {
                const subject = subjects.find(s => s.id === theme.subject)
                return (
                  <Link
                    key={theme.id}
                    href={`/themes/${theme.id}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-4 hover:border-green-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                        {theme.name}
                      </h3>
                      <ImportanceBadge importance={theme.importance} showLabel={false} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                      {subject && (
                        <span className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                          {subject.shortName}
                        </span>
                      )}
                      <span>出題{theme.count}回</span>
                      <span>直近第{theme.latestRound}回</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {theme.studyPoint}
                    </p>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {[31, 32, 33, 34].map(r => (
                        <span
                          key={r}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            theme.examRounds.includes(r)
                              ? 'bg-green-100 text-green-700 font-semibold'
                              : 'bg-gray-50 text-gray-300'
                          }`}
                        >
                          第{r}回
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-green-600 font-semibold group-hover:underline">
                      詳細を見る →
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* フッターナビ */}
      <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-4">
        <Link href="/" className="text-sm text-gray-400 hover:text-green-600 transition-colors">← トップ</Link>
        <Link href="/themes" className="text-sm text-green-600 hover:underline">テーマ検索</Link>
        <Link href="/subjects" className="text-sm text-green-600 hover:underline">科目一覧</Link>
        <Link href="/study/dashboard" className="text-sm text-green-600 hover:underline">学習ダッシュボード</Link>
      </div>
    </main>
  )
}
