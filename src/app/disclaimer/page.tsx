import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '免責事項',
  description:
    '鍼灸国家試験 頻出分析データベースの免責事項。当サイトは非公式サイトであり、分析データの正確性を保証しません。',
}

export default function DisclaimerPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <span className="text-gray-700">免責事項</span>
      </nav>

      <section>
        <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-2">DISCLAIMER</p>
        <h1 className="text-2xl font-bold text-gray-900">免責事項</h1>
      </section>

      <section className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="font-bold text-amber-800 mb-1">当サイトは非公式サイトです</p>
          <p className="text-amber-700">
            本サイトは、公益財団法人東洋療法研修試験財団とは一切関係のない個人運営の非公式サイトです。
            試験に関する公式情報は必ず東洋療法研修試験財団の公式サイトをご確認ください。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">1. データの性質について</h2>
          <p>
            当サイトに掲載されている出題テーマの分類・重要度判定・傾向分析はすべて運営者による
            <strong>独自の分析・解釈</strong>です。公式の見解・公式の難易度評価・試験委員会の意図を
            反映するものではありません。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">2. 正確性の保証について</h2>
          <p>
            当サイトは出題傾向の分析データの正確性・完全性・最新性を保証しません。
            分類の誤り・集計ミス・表示の不具合が含まれる可能性があります。
            掲載内容に基づいた学習・判断・行動によって生じたいかなる損害についても、
            当サイト運営者は責任を負いません。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">3. 学習・受験への利用について</h2>
          <p>
            当サイトは学習の参考情報として提供するものです。
            受験対策・学習計画の最終的な判断は、
            <strong>公益財団法人東洋療法研修試験財団が公表する公式資料・正式な教材・専門家のアドバイス</strong>
            に基づいて行ってください。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">4. 問題文・選択肢について</h2>
          <p>
            当サイトは問題文・選択肢・正解番号・解説を掲載していません。
            掲載しているのは出題テーマ・科目・分類データのみです。
            試験の正解確認・解説閲覧は東洋療法研修試験財団の公式資料をご利用ください。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">5. 著作権について</h2>
          <p>
            鍼灸国家試験の問題の著作権は公益財団法人東洋療法研修試験財団に帰属します。
            当サイトは問題文・選択肢を転載しておらず、出題テーマの分類・集計データのみを掲載しています。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">6. サービスの変更・停止について</h2>
          <p>
            当サイトは予告なくコンテンツの変更・追加・削除・サービスの一時停止・終了を行う場合があります。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">7. リンクについて</h2>
          <p>
            当サイトからリンクしている外部サイトのコンテンツ・運営方針については、
            当サイト運営者は関知・保証しません。
          </p>
        </div>

        <p className="text-xs text-gray-400">最終更新: 2026年6月</p>

      </section>

      <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
        <Link href="/" className="text-green-600 hover:underline">← トップに戻る</Link>
        <Link href="/about" className="text-green-600 hover:underline">About →</Link>
        <Link href="/sources" className="text-green-600 hover:underline">データソース →</Link>
      </div>
    </main>
  )
}
