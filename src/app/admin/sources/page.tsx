import type { Metadata } from 'next'
import Link from 'next/link'
import { existsSync, statSync } from 'fs'
import path from 'path'
import { EXAM_SOURCES, getLocalPaths } from '@/data/examSources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '公式ソース管理 | 管理',
  robots: 'noindex,nofollow',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

type FileStatus = { exists: false } | { exists: true; size: number; sizeLabel: string }

function getFileStatus(relativePath: string): FileStatus {
  const abs = path.join(process.cwd(), relativePath)
  if (!existsSync(abs)) return { exists: false }
  const size = statSync(abs).size
  return { exists: true, size, sizeLabel: formatBytes(size) }
}

export default function AdminSourcesPage() {
  const sources = EXAM_SOURCES.map(source => {
    const p = getLocalPaths(source.round)
    return {
      ...source,
      files: [
        { label: 'AM問題PDF',    path: p.amPdf,  url: source.amPdfUrl,      status: getFileStatus(p.amPdf) },
        { label: 'PM問題PDF',    path: p.pmPdf,  url: source.pmPdfUrl,      status: getFileStatus(p.pmPdf) },
        { label: '正答肢表HTML', path: p.answer, url: source.answerHtmlUrl, status: getFileStatus(p.answer) },
      ],
    }
  })

  const totalFiles  = sources.length * 3
  const existFiles  = sources.reduce((n, s) => n + s.files.filter(f => f.status.exists).length, 0)
  const allComplete = existFiles === totalFiles

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-green-600">トップ</Link>
        <span>›</span>
        <span className="text-gray-600">公式ソース管理</span>
      </div>

      {/* heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">公式ソース管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          公益財団法人東洋療法研修試験財団 公式アーカイブのダウンロード状況
        </p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-xs text-gray-500">取得済み</p>
          <p className="text-2xl font-black text-green-700">{existFiles}</p>
          <p className="text-xs text-gray-400">/ {totalFiles}ファイル</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">対象回数</p>
          <p className="text-2xl font-black text-gray-700">{sources.length}</p>
          <p className="text-xs text-gray-400">第29〜34回</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">ステータス</p>
          <p className={`text-sm font-black mt-2 ${allComplete ? 'text-green-600' : 'text-yellow-600'}`}>
            {allComplete ? '✓ 取得完了' : `${totalFiles - existFiles}件不足`}
          </p>
        </div>
      </div>

      {/* download command */}
      <div className="bg-gray-900 rounded-xl p-5 space-y-3">
        <p className="text-xs text-gray-400 font-semibold">ダウンロードコマンド</p>
        {[
          { label: '全回取得',        cmd: 'npx tsx scripts/download-official-exams.ts' },
          { label: '第34回のみ',      cmd: 'npx tsx scripts/download-official-exams.ts 34' },
          { label: '複数回指定',      cmd: 'npx tsx scripts/download-official-exams.ts 33 34' },
          { label: 'ドライラン確認',  cmd: 'npx tsx scripts/download-official-exams.ts --dry-run' },
        ].map(({ label, cmd }) => (
          <div key={cmd} className="flex items-start gap-3">
            <span className="text-xs text-gray-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
            <code className="text-xs text-green-400 font-mono leading-relaxed">{cmd}</code>
          </div>
        ))}
      </div>

      {/* per-round status */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">回別ファイル状況</h2>

        {sources.map(source => {
          const allOk = source.files.every(f => f.status.exists)
          const count = source.files.filter(f => f.status.exists).length

          return (
            <div key={source.round} className="bg-white rounded-xl border border-gray-100 overflow-hidden">

              {/* round header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div>
                  <span className="font-bold text-gray-800">第{source.round}回</span>
                  <span className="text-sm text-gray-400 ml-2">{source.year}年</span>
                </div>
                {allOk ? (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                    ✓ 取得完了
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-100 px-2.5 py-0.5 rounded-full">
                    {count} / 3 取得済み
                  </span>
                )}
              </div>

              {/* file rows */}
              <div className="divide-y divide-gray-50">
                {source.files.map(file => (
                  <div key={file.label} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex-shrink-0 w-2 h-2 rounded-full ${file.status.exists ? 'bg-green-400' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700">{file.label}</p>
                        <code className="text-xs text-gray-400 font-mono block truncate">{file.path}</code>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {file.status.exists ? (
                        <span className="text-xs text-green-600 font-semibold">
                          ✓ {file.status.sizeLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">未取得</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* archive source */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  出典:{' '}
                  <a
                    href={source.archivePageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    {source.archivePageUrl}
                  </a>
                </p>
              </div>
            </div>
          )
        })}
      </section>

      {/* notice */}
      <section className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1 leading-relaxed">
        <p className="font-semibold mb-2">注意事項</p>
        <p>• PDF・HTML は解析用途のみ使用し、本サイトには問題文・選択肢を一切掲載しません</p>
        <p>• 取得先: 公益財団法人東洋療法研修試験財団 公式アーカイブ（indexed_official）</p>
        <p>• docs/exams/ ディレクトリは .gitignore に含め、リポジトリにコミットしません</p>
        <p>• サーバー負荷軽減のため、リクエスト間に1〜2秒の待機を設けています</p>
      </section>

      {/* admin nav */}
      <nav className="text-sm text-gray-400 flex gap-4">
        <Link href="/admin/data-status" className="hover:text-green-600">データ状況</Link>
        <Link href="/admin/data-entry-guide" className="hover:text-green-600">データ入力ガイド</Link>
        <Link href="/admin/import-guide" className="hover:text-green-600">インポートガイド</Link>
      </nav>
    </main>
  )
}
