'use client'

import { useEffect, useRef, useState } from 'react'
import { LEGACY_HOSTS, legacyExportBookmarklet } from '@/lib/legacyExport'

/* 旧サイト（shinkyuu-db.vercel.app）の学習記録を持ち出す手順。
   旧サイトには保存ページがないため、旧サイトを開いた状態で実行するブックマークを案内する。
   React は javascript: の href を描画しないので、マウント後に属性で設定する。 */

const OLD = `https://${LEGACY_HOSTS[0]}`

export default function LegacyExportGuide() {
  const link = useRef<HTMLAnchorElement>(null)
  const code = legacyExportBookmarklet()
  const [copied, setCopied] = useState<string | null>(null)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    link.current?.setAttribute('href', code)
  }, [code])

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied('コピーしました。')
    } catch {
      setCopied('コピーできませんでした。下の枠の文字をすべて選んでコピーしてください。')
    }
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-gray-700">
      <h2 className="font-bold text-gray-900">旧サイト（{LEGACY_HOSTS[0]}）の記録を移すには</h2>
      <p className="mt-2">
        鍼灸国試DBは、このURLに移りました。旧サイトの学習記録は自動では引き継がれません。旧サイトを開いた状態で、下の「保存用ブックマーク」を使うと、記録をファイルに保存できます。保存したファイルを、このページの「2. ファイルから読み込む」で読み込んでください。
      </p>
      <p className="mt-2 text-xs text-gray-500">
        保存用ブックマークは、旧サイトの学習記録（解答の正誤・日付・問題番号など）を読み取って、この端末にファイルとして保存するだけです。記録を変えたり消したりせず、どこにも送信しません。旧サイト以外のページでは何もしません。
      </p>

      <h3 className="mt-4 font-bold text-gray-900">パソコン（Chrome・Edge など）</h3>
      <ol className="mt-1 list-decimal space-y-1 pl-5">
        <li>
          ブックマークバーを表示します（Chrome は Ctrl＋Shift＋B、Mac は ⌘＋Shift＋B）。
        </li>
        <li>
          下の緑のボタンを、ブックマークバーまでドラッグします。
          <div className="mt-2">
            <a
              ref={link}
              onClick={(e) => {
                e.preventDefault()
                setHint(true)
              }}
              className="inline-block cursor-grab rounded-lg bg-green-600 px-4 py-2 font-bold text-white"
            >
              鍼灸DB 記録を保存
            </a>
          </div>
          {hint && (
            <p className="mt-1 text-xs text-amber-800">
              このページでは押さずに、ブックマークバーへドラッグしてください。
            </p>
          )}
        </li>
        <li>
          <a href={`${OLD}/dashboard`} target="_blank" rel="noopener" className="font-semibold text-green-700 underline">
            旧サイト
          </a>
          を開き、ブックマークバーの「鍼灸DB 記録を保存」を押します。
        </li>
        <li>ファイルが保存されたら、このページに戻って読み込みます。</li>
      </ol>

      <h3 className="mt-4 font-bold text-gray-900">スマートフォン</h3>
      <ol className="mt-1 list-decimal space-y-1 pl-5">
        <li>
          <button type="button" onClick={onCopy} className="rounded-lg bg-green-600 px-3 py-1.5 font-bold text-white">
            保存用のコードをコピー
          </button>
          {copied && <span className="ml-2 text-xs text-green-700">{copied}</span>}
        </li>
        <li>今開いているこのページをブックマークに追加します。</li>
        <li>
          追加したブックマークを編集し、名前を「鍼灸DB保存」に、URL（アドレス）をコピーしたコードに置き換えて保存します。
        </li>
        <li>
          旧サイトを開き、Android の Chrome はアドレスバーに「鍼灸DB保存」と入力して出てくるブックマークを、iPhone の Safari はブックマーク一覧の「鍼灸DB保存」をタップします。
        </li>
        <li>保存されたファイルを、このページの「2. ファイルから読み込む」で選びます。</li>
      </ol>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-gray-500">保存用のコードを表示する</summary>
        <textarea
          readOnly
          value={code}
          rows={4}
          className="mt-2 w-full break-all rounded border border-gray-200 bg-white p-2 font-mono text-[11px] text-gray-600"
          onFocus={(e) => e.currentTarget.select()}
        />
      </details>
      <p className="mt-3 text-xs text-gray-500">
        スマートフォンは機種やブラウザによって、ブックマークからの実行やファイルの保存ができないことがあります。その場合は、同じ端末で新しいサイトを使い始めるか、パソコンで旧サイトを使っていた場合はパソコンで移してください。
      </p>
    </section>
  )
}
