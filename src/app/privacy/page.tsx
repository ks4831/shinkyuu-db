import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description:
    '鍼灸国試 クイズ＆分析のプライバシーポリシー。アクセス解析（Google Analytics）の利用、送信される情報の概要、利用目的、Cookieの取り扱いについて説明します。',
}

const LINKS: [string, string][] = [
  ['Google プライバシーポリシー', 'https://policies.google.com/privacy?hl=ja'],
  [
    'Google のサービスを使用するサイトやアプリから収集した情報の Google による使用',
    'https://policies.google.com/technologies/partner-sites?hl=ja',
  ],
  ['Google アナリティクス オプトアウト アドオン', 'https://tools.google.com/dlpage/gaoptout?hl=ja'],
]

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <span className="text-gray-700">プライバシーポリシー</span>
      </nav>

      <section>
        <p className="text-xs text-gray-500 font-semibold tracking-wide mb-2">プライバシーポリシー</p>
        <h1 className="text-2xl font-bold text-gray-900">プライバシーポリシー</h1>
      </section>

      <section className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <p className="font-semibold text-green-800 mb-1">このページについて</p>
          <p className="text-green-700">
            当サイト「鍼灸国試 クイズ＆分析」（以下「当サイト」）における、
            アクセス解析ツールの利用と、そこで扱われる情報の取り扱いについて説明します。
            当サイトは個人運営の非公式サイトです。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">1. アクセス解析ツールの利用</h2>
          <p>
            当サイトは、利用状況を把握するために Google LLC が提供する
            アクセス解析ツール「Google Analytics（GA4）」を利用しています。
            Google Analytics は、当サイトへのアクセスを計測するために Cookie などの技術を使用し、
            収集した情報を Google LLC（米国）へ送信します。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">2. 送信される情報の概要</h2>
          <p>Google Analytics によって送信される情報には、主に次のようなものが含まれます。</p>
          <ul className="mt-2 space-y-1.5 list-disc list-inside">
            <li>閲覧したページの URL・ページタイトル、参照元（どのサイト・SNS から来たか）</li>
            <li>訪問日時、サイト内での大まかな行動（クイズの開始・完了などの操作イベント）</li>
            <li>利用したデバイス・OS・ブラウザの種類、画面サイズ、言語設定</li>
            <li>IP アドレスから推定される、おおよその地域（国・都道府県程度）</li>
          </ul>
          <p className="mt-2">
            クイズの操作イベントとあわせて送信されるのは、正誤の数・連続学習日数といった
            集計用の数値のみです。解答内容そのものや、氏名・住所・メールアドレス・電話番号などは含まれません。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">3. 利用目的</h2>
          <p>収集した情報は、次の目的で利用します。</p>
          <ul className="mt-2 space-y-1.5 list-disc list-inside">
            <li>アクセス数・利用状況の把握</li>
            <li>どの流入元（検索・SNS など）から利用されているかの分析</li>
            <li>コンテンツや使い勝手の改善</li>
          </ul>
          <p className="mt-2">広告配信のための利用や、第三者への提供・販売は行いません。</p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">4. 個人を特定する情報について</h2>
          <p>
            当サイトは、氏名・住所・メールアドレスなど、個人を直接特定できる情報を
            Google Analytics に送信しません。また、当サイトには会員登録・ログイン機能はありません。
            Google Analytics が付与する識別子は無作為の値であり、それ単体で特定の個人を識別するものではありません。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">5. 外部送信について</h2>
          <p>
            上記のとおり、当サイトの閲覧時には、アクセス情報の一部が Cookie 等を通じて
            Google LLC に送信されます。送信先・送信される情報の概要・利用目的は本ページに記載のとおりです。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">6. Cookie の無効化・オプトアウト</h2>
          <p>
            ブラウザの設定で Cookie を無効にすると、Google Analytics による計測を拒否できます
            （一部サイトの表示に影響する場合があります）。
            また、Google が提供する「Google アナリティクス オプトアウト アドオン」を利用すると、
            Google Analytics へのデータ送信を無効にできます。リンクは本ページ末尾に記載しています。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">7. 端末内に保存される学習データ</h2>
          <p>
            クイズの解答履歴・苦手リスト・連続学習日数などの学習記録は、
            お使いのブラウザ内（LocalStorage）にのみ保存されます。
            これらの学習データがサーバーや第三者に送信されることはありません。
            ブラウザのデータを消去すると、学習記録も削除されます。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">8. Google の関連ポリシー</h2>
          <p>Google による情報の取り扱いについては、以下をご確認ください。</p>
          <ul className="mt-2 space-y-1.5">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">9. 本ポリシーの変更</h2>
          <p>
            本ポリシーの内容は、必要に応じて予告なく変更する場合があります。
            変更後の内容は本ページに掲載した時点で有効となります。
          </p>
        </div>

        <p className="text-xs text-gray-400">最終更新: 2026年9月</p>

      </section>

      <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
        <Link href="/" className="text-green-600 hover:underline">← トップに戻る</Link>
        <Link href="/disclaimer" className="text-green-600 hover:underline">免責事項 →</Link>
        <Link href="/about" className="text-green-600 hover:underline">About →</Link>
      </div>
    </main>
  )
}
