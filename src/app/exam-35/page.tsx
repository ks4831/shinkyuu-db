import type { Metadata } from 'next'
import Link from 'next/link'
import { themes, getSubject } from '@/lib/data'
import { getThemeExamStats } from '@/lib/themeStats'
import { sixYearThemes } from '@/lib/analysisThemes'
import { standard2026QuizCount } from '@/lib/quiz'
import Standard2026Badge from '@/components/Standard2026Badge'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shinkyuu-db.vercel.app'

export const metadata: Metadata = {
  title: '第35回 はり師・きゅう師国家試験対策｜2026年版 新出題基準',
  description:
    '過去6年（第29〜34回）1,080問の出題分析と、第35回から適用される2026年版出題基準をもとに、新設・拡充テーマと学習ポイントを整理。過去頻出と新基準を分けて確認できます。',
  openGraph: {
    title: '第35回 はり師・きゅう師国家試験対策｜2026年版 新出題基準',
    description:
      '過去6年1,080問の出題分析と2026年版出題基準の二軸で、第35回の学習優先度を整理。',
    url: `${SITE_URL}/exam-35`,
    type: 'article',
  },
}

const OFFICIAL_PDF = 'https://ahaki.or.jp/wordpress/wp-content/uploads/2026_shikenkijyun.pdf'
const OFFICIAL_GUIDE = 'https://ahaki.or.jp/exam/guide/'

type Row = {
  id: string
  name: string
  subjectShort: string
  note: string
  priority: number
  pastCount: number
}

function rowsFor(...statuses: Array<'new' | 'expanded' | 'reorganized'>): Row[] {
  const set = new Set<string>(statuses)
  return themes
    .filter((t) => t.standard2026 != null && set.has(t.standard2026.status))
    .map((t) => ({
      id: t.id,
      name: t.name,
      subjectShort: getSubject(t.subject)?.shortName ?? t.subject,
      note: t.standard2026!.note,
      priority: t.standard2026!.priority ?? 3,
      pastCount: getThemeExamStats(t.id).count,
    }))
    .sort((a, b) => a.priority - b.priority || b.pastCount - a.pastCount)
}

function ThemeCard({ row, tone }: { row: Row; tone: 'new' | 'expanded' }) {
  return (
    <Link
      href={`/themes/${row.id}`}
      className={`block rounded-2xl border p-4 transition-colors ${
        tone === 'new'
          ? 'border-violet-200 bg-violet-50/60 hover:border-violet-400'
          : 'border-sky-200 bg-sky-50/60 hover:border-sky-400'
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-gray-900">{row.name}</span>
        <span className="text-[11px] text-gray-400">{row.subjectShort}</span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{row.note}</p>
      <p className="mt-2 text-[11px] text-gray-400">過去6年（第29〜34回）：{row.pastCount}問</p>
    </Link>
  )
}

export default function Exam35Page() {
  const newRows = rowsFor('new')
  const expandedRows = rowsFor('expanded', 'reorganized')
  const pastTop = sixYearThemes().slice(0, 10)
  const pastMax = pastTop[0]?.count ?? 1
  const s26Quiz = standard2026QuizCount()

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/" className="hover:text-green-600">ホーム</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">第35回対策</span>
      </nav>

      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-b from-green-50 to-white p-5">
        <p className="text-xs font-bold tracking-wide text-green-700">
          はり師・きゅう師国家試験
        </p>
        <h1 className="mt-1 text-2xl font-black leading-snug text-gray-900">
          第35回対策は、<br />
          <span className="text-green-600">2026年版 新出題基準</span>に対応。
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          第35回（2027年2月）から <strong className="text-gray-800">2026年版（令和8年版）出題基準</strong> が適用されます。
          このページでは
        </p>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          <li>① 第29〜34回・<strong>1,080問</strong>の出題分析（過去に何が出たか）</li>
          <li>② 2026年版で<strong>新設・拡充</strong>されたテーマ（新基準で何が重要か）</li>
        </ul>
        <p className="mt-2 text-sm text-gray-600">の<strong className="text-gray-800">二軸</strong>で学習を整理します。</p>
      </section>

      {/* なぜ二軸なのか */}
      <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="font-bold text-gray-800">第35回から出題基準が変わります</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          出題基準の改訂は2020年版以来。試験科目（14科目）や3層構造は変わりませんが、
          東洋医学臨床論が「症候中心」に再構成され、<strong className="text-gray-800">EBM・研究倫理、緩和ケア、災害医療、
          日本伝統医学、内部障害のリハビリテーション、女性疾患、高齢者に多い疾患</strong> などの項目が新設・拡充されました。
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          そのため「過去によく出たテーマ」だけでなく、
          <strong className="text-gray-800">新基準で追加・拡充されたテーマ</strong> も確認しておくことが重要です。
        </p>
      </section>

      {/* 新設テーマ */}
      <section className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-800">2026年版で新設</h2>
          <Standard2026Badge status="new" />
        </div>
        <p className="mb-3 text-xs text-gray-500">
          公式の出題基準で新たに大項目として加わった領域です（当サイトの予測ではありません）。
        </p>
        <div className="space-y-2.5">
          {newRows.map((row) => (
            <ThemeCard key={row.id} row={row} tone="new" />
          ))}
        </div>
      </section>

      {/* 拡充・再編テーマ */}
      <section className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-800">2026年版で拡充・再編</h2>
          <Standard2026Badge status="expanded" />
        </div>
        <p className="mb-3 text-xs text-gray-500">
          既存のテーマに、公式基準で内容が明確に追加・整理された領域です。
        </p>
        <div className="space-y-2.5">
          {expandedRows.map((row) => (
            <ThemeCard key={row.id} row={row} tone="expanded" />
          ))}
        </div>
      </section>

      {/* 新基準クイズ CTA */}
      <section className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 p-5 text-white">
        <p className="text-sm font-bold">第35回 新基準問題</p>
        <p className="mt-1 text-xs text-violet-100">
          2026年版で新設・拡充された領域だけを集めたオリジナル問題 {s26Quiz}問。1問1画面・解説つき。
        </p>
        <Link
          href="/quiz/standard-2026"
          className="mt-3 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-50"
        >
          新基準問題を解く →
        </Link>
      </section>

      {/* 過去頻出 TOP（別枠・視覚的に分離） */}
      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">過去6年の頻出テーマ TOP10</h2>
          <Link href="/analysis/compare/recent-6-years" className="text-xs text-green-600 hover:underline">
            分析を見る →
          </Link>
        </div>
        <p className="mb-3 text-xs text-gray-500">
          第29〜34回・1,080問を統一テーマで集計した実績です（上の「新基準」とは別の指標）。
        </p>
        <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white">
          {pastTop.map((t, i) => (
            <Link
              key={t.themeId}
              href={`/themes/${t.themeId}`}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm text-gray-800">{t.name}</span>
                  <span className="flex-shrink-0 text-[11px] text-gray-400">{t.subjectShort}</span>
                </div>
                <div className="mt-1 h-1 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1 rounded-full bg-green-500"
                    style={{ width: `${Math.round((t.count / pastMax) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="w-16 flex-shrink-0 text-right text-sm font-bold text-green-700">
                {t.count}問
                <span className="block text-[10px] font-normal text-gray-400">{t.yearCount}/6年</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 最終 CTA */}
      <section className="mt-8 space-y-2.5">
        <Link
          href="/quiz/daily"
          className="block rounded-2xl bg-green-600 px-5 py-4 text-center text-sm font-bold text-white hover:bg-green-700"
        >
          今日の10問を始める
        </Link>
        <Link
          href="/quiz/standard-2026"
          className="block rounded-2xl border border-violet-300 bg-white px-5 py-4 text-center text-sm font-bold text-violet-700 hover:bg-violet-50"
        >
          第35回 新基準問題を解く
        </Link>
      </section>

      {/* 出典 */}
      <section className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
        <p className="font-semibold text-gray-600">出典</p>
        <p className="mt-1">
          公益財団法人東洋療法研修試験財団「2026年版 あん摩マッサージ指圧師、はり師及びきゅう師
          国家試験出題基準」に基づく独自整理です。当サイトは非公式です。
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <a href={OFFICIAL_PDF} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
            2026年版出題基準（PDF）
          </a>
          <a href={OFFICIAL_GUIDE} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
            出題基準 案内ページ
          </a>
        </p>
        <p className="mt-2">
          「新設」「拡充」は公式基準の変更にもとづく事実です。各テーマの学習優先度（S/A/B/C）は
          第29〜34回の出題実績にもとづく当サイトの分析であり、第35回の出題を保証するものではありません。
        </p>
      </section>
    </main>
  )
}
