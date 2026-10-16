'use client'

import { useEffect, useState } from 'react'
import {
  applyImport,
  buildExport,
  exportFileName,
  hasAnyLearningData,
  LEARNING_KEYS,
  countItems,
  MAX_FILE_BYTES,
  parseImport,
  planImport,
  type ImportMode,
  type TransferFile,
} from '@/lib/learningDataTransfer'

/* 学習記録の書き出し・読み込み画面。
   ファイルの保存と読み込みはブラウザの中だけで行い、サーバーには送らない。 */

function download(now = new Date()) {
  const file = buildExport(now)
  const blob = new Blob([JSON.stringify(file)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFileName(now)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return Object.keys(file.data).length
}

export default function LearningDataTransfer() {
  const [hasData, setHasData] = useState(false)
  const [summary, setSummary] = useState<{ label: string; count: number }[]>([])
  const [exported, setExported] = useState<string | null>(null)
  const [file, setFile] = useState<TransferFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<ImportMode>('fill')
  const [done, setDone] = useState<string | null>(null)

  function refresh() {
    setHasData(hasAnyLearningData())
    const data = buildExport().data
    setSummary(
      LEARNING_KEYS.filter(({ key }) => key in data).map(({ key, label }) => ({
        label,
        count: countItems(key, data[key]),
      })),
    )
  }

  useEffect(() => {
    refresh()
  }, [])

  function onExport() {
    const n = download()
    setExported(n > 0 ? `${n}項目をファイルに保存しました。` : '保存できる学習記録がありませんでした。')
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(null)
    setError(null)
    setDone(null)
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_FILE_BYTES) {
      setError('ファイルが大きすぎます（4MBまで）。')
      return
    }
    const r = parseImport(await f.text())
    if (r.ok) setFile(r.file)
    else setError(r.error)
  }

  function onImport() {
    if (!file) return
    if (mode === 'replace') {
      // 置き換える前に、今の記録を必ずファイルに保存しておく
      download()
    }
    const { written, failed } = applyImport(file, mode)
    setFile(null)
    refresh()
    setDone(
      failed.length > 0
        ? `${written.length}項目を読み込みました。${failed.length}項目は保存できませんでした（ブラウザの保存容量や設定を確認してください）。`
        : written.length > 0
          ? `${written.length}項目を読み込みました。`
          : '読み込む項目はありませんでした（この端末にすでに記録がある項目は、上書きしていません）。',
    )
  }

  const plan = file ? planImport(file, mode) : []
  const willWrite = plan.filter((r) => r.write).length

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-bold text-gray-900">1. この端末の記録をファイルに保存</h2>
        {summary.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {summary.map((s) => (
              <li key={s.label}>
                {s.label}：{s.count}件
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">この端末には、まだ学習記録がありません。</p>
        )}
        <button
          type="button"
          onClick={onExport}
          disabled={!hasData}
          className="mt-3 w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white disabled:bg-gray-300"
        >
          ファイルに保存する
        </button>
        {exported && <p className="mt-2 text-sm text-green-700">{exported}</p>}
        <p className="mt-2 text-xs text-gray-500">
          保存されるのは解答の正誤・日付・問題番号などで、名前やメールアドレスは含まれません。ファイルはこの端末に保存され、どこにも送信されません。
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-bold text-gray-900">2. ファイルから読み込む</h2>
        <input
          type="file"
          accept="application/json,.json"
          onChange={onPick}
          className="mt-3 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {file && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-gray-600">
              {new Date(file.exportedAt).toLocaleString('ja-JP')} に保存したファイルです。
            </p>
            <fieldset className="space-y-2 text-sm">
              <label className="flex items-start gap-2">
                <input type="radio" name="mode" checked={mode === 'fill'} onChange={() => setMode('fill')} className="mt-1" />
                <span>
                  <span className="font-semibold">空の項目だけ読み込む（おすすめ）</span>
                  <br />
                  <span className="text-gray-500">この端末にすでにある記録は変えません。</span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} className="mt-1" />
                <span>
                  <span className="font-semibold">ファイルの内容で置き換える</span>
                  <br />
                  <span className="text-gray-500">ファイルにある項目は、この端末の記録を消して置き換えます。置き換える前に、今の記録を自動でファイルに保存します。</span>
                </span>
              </label>
            </fieldset>
            <ul className="space-y-1 text-sm">
              {plan.map((r) => (
                <li key={r.key} className={r.write ? 'text-gray-800' : 'text-gray-400'}>
                  {r.write ? '読み込む' : 'そのまま'}：{r.label}（ファイル {r.incoming}件／この端末 {r.current}件）
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onImport}
              disabled={willWrite === 0}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white disabled:bg-gray-300"
            >
              {willWrite > 0 ? `${willWrite}項目を読み込む` : '読み込む項目はありません'}
            </button>
          </div>
        )}
        {done && <p className="mt-2 text-sm text-green-700">{done}</p>}
      </section>
    </div>
  )
}
