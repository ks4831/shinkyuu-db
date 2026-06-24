import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About',
  description:
    '鍼灸国家試験 頻出分析データベースについて。このサイトは問題文を掲載するサイトではなく、出題テーマを独自分類した分析データベースです。',
}

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">

      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <span className="text-gray-700">About</span>
      </nav>

      <section>
        <p className="text-xs text-green-600 font-semibold tracking-widest uppercase mb-2">ABOUT</p>
        <h1 className="text-2xl font-bold text-gray-900">このサイトについて</h1>
      </section>

      <section className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <p className="font-semibold text-green-800 mb-2">このサイトは何ですか？</p>
          <p>
            鍼灸国家試験の<strong>出題傾向を分析するためのデータベース</strong>です。
            問題文や選択肢を掲載するサイトではありません。
          </p>
          <p className="mt-2">
            過去の国家試験をテーマ単位で分類し、頻出テーマ・年度比較・出題傾向を可視化することで、
            受験者が「何を優先して学ぶべきか」を効率的に判断できることを目的としています。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">このサイトで分かること</h2>
          <ul className="space-y-2">
            {[
              ['頻出テーマ', '各テーマの出題数をS〜Cの重要度付きでランキング表示'],
              ['年度比較', '第32回・第33回・第34回の3年間の出題変化を可視化'],
              ['増減傾向', '直近で問数が増えているテーマ・減っているテーマを特定'],
              ['科目別割合', '14科目それぞれが全体の何%を占めるかを確認'],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3">
                <span className="text-green-600 font-semibold flex-shrink-0">✓</span>
                <span><strong>{title}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">このサイトに含まれないもの</h2>
          <ul className="space-y-2">
            {[
              '問題文・選択肢の全文',
              '正解番号・解説',
              '採点・自己採点機能',
              '試験の合否判定',
            ].map(item => (
              <li key={item} className="flex gap-3 text-gray-500">
                <span className="text-gray-300">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">分析対象</h2>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {[
              ['対象試験', '鍼灸国家試験（はり師・きゅう師）'],
              ['対象回', '第32回（2024年）・第33回（2025年）・第34回（2026年）'],
              ['分析問題数', '540問（各回180問 × 3回）'],
              ['出題基準', '2020年版'],
              ['分類方法', 'normalizedThemeキーによるテーマ分類（独自基準）'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">データソース</h2>
          <p>
            公益財団法人東洋療法研修試験財団が公表している「はり師きゅう師国家試験問題及び正答肢表」をもとに、
            出題テーマを独自分類・集計しています。詳細は
            <Link href="/sources" className="text-green-600 hover:underline mx-1">データソースページ</Link>
            をご覧ください。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">免責事項</h2>
          <p>
            当サイトは非公式サイトです。分析内容の正確性を保証するものではありません。
            詳細は
            <Link href="/disclaimer" className="text-green-600 hover:underline mx-1">免責事項ページ</Link>
            をご確認ください。
          </p>
        </div>

      </section>

      <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
        <Link href="/" className="text-green-600 hover:underline">← トップに戻る</Link>
        <Link href="/sources" className="text-green-600 hover:underline">データソース →</Link>
        <Link href="/disclaimer" className="text-green-600 hover:underline">免責事項 →</Link>
      </div>
    </main>
  )
}
