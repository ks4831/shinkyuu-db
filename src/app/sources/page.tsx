import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'データソース',
  description:
    '鍼灸国家試験 頻出分析データベースで使用しているデータのソース情報。公益財団法人東洋療法研修試験財団が公表する公式資料をもとに分析しています。',
}

export default function SourcesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <span className="text-gray-700">データソース</span>
      </nav>

      <section>
        <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-2">DATA SOURCES</p>
        <h1 className="text-2xl font-bold text-gray-900">データソース</h1>
      </section>

      <section className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <div>
          <h2 className="font-bold text-gray-800 mb-4">使用データ</h2>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 bg-green-50 border-b border-green-100">
              <p className="font-semibold text-green-800">
                公益財団法人 東洋療法研修試験財団
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                はり師きゅう師国家試験問題及び正答肢表
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                ['データ種別', '国家試験問題・正答肢（公表資料）'],
                ['対象回', '第32回（2024年）・第33回（2025年）・第34回（2026年）'],
                ['取得方法', '東洋療法研修試験財団が公開するPDFから問題・正答を参照'],
                ['利用許諾', '公表されている公式資料を参照した独自分析・集計'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-5 py-3">
                  <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-4">データの利用方針</h2>
          <div className="space-y-3">
            {[
              {
                title: '問題文は掲載しない',
                desc: '国家試験の問題文・選択肢の全文は当サイトに掲載していません。テーマ分類・出題数・傾向の集計データのみを掲載しています。',
              },
              {
                title: '分析データのみ掲載',
                desc: '各問題を「テーマキー」「subject（科目）」などのメタデータに変換し、統計的な傾向分析に利用しています。',
              },
              {
                title: '正答は集計のみ利用',
                desc: '正答番号は「何問出題されたか」の集計目的のみに使用しています。正解番号・解説の表示機能はありません。',
              },
            ].map(item => (
              <div key={item.title} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">{item.title}</p>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-4">分析データの構造</h2>
          <div className="bg-gray-900 rounded-xl p-5 text-xs font-mono text-gray-300 space-y-1.5 overflow-x-auto">
            <p className="text-gray-500">// 各問題に付与するメタデータ（CSVカラム例）</p>
            <p><span className="text-green-400">examRound</span>     <span className="text-gray-500">// 第XX回</span></p>
            <p><span className="text-green-400">questionNumber</span> <span className="text-gray-500">// 問題番号</span></p>
            <p><span className="text-green-400">session</span>        <span className="text-gray-500">// AM / PM / 共通</span></p>
            <p><span className="text-green-400">subject</span>        <span className="text-gray-500">// 科目ID</span></p>
            <p><span className="text-green-400">themeKey</span>       <span className="text-gray-500">// 独自テーマキー</span></p>
            <p><span className="text-green-400">subTheme</span>       <span className="text-gray-500">// 出題内容の要約</span></p>
            <p><span className="text-green-400">importance</span>     <span className="text-gray-500">// S/A/B/C</span></p>
            <p><span className="text-green-400">memo</span>           <span className="text-gray-500">// はり師専用 / きゅう師専用など</span></p>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-4">外部リンク</h2>
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            <div className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="font-medium text-gray-800">東洋療法研修試験財団 試験情報</p>
                <p className="text-xs text-gray-400 mt-0.5">過去問・正答肢表の公式ページ</p>
              </div>
              <a
                href="https://ahaki.or.jp/exam/archives/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:underline flex-shrink-0 ml-4"
              >
                公式サイト →
              </a>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700">
          <p className="font-semibold mb-1">注意事項</p>
          <p>
            当サイトは東洋療法研修試験財団の公式サイトとは一切関係ありません。
            試験の最新情報・公式解答は必ず東洋療法研修試験財団の公式サイトでご確認ください。
          </p>
        </div>

      </section>

      <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
        <Link href="/" className="text-green-600 hover:underline">← トップに戻る</Link>
        <Link href="/about" className="text-green-600 hover:underline">About →</Link>
        <Link href="/disclaimer" className="text-green-600 hover:underline">免責事項 →</Link>
      </div>
    </main>
  )
}
