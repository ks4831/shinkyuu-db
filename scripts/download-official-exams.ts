#!/usr/bin/env npx tsx
/**
 * 公益財団法人東洋療法研修試験財団 公式アーカイブから
 * はり師きゅう師国家試験PDFをダウンロードするスクリプト
 *
 * 使用方法:
 *   npx tsx scripts/download-official-exams.ts          # 全回 (29〜34)
 *   npx tsx scripts/download-official-exams.ts 34       # 第34回のみ
 *   npx tsx scripts/download-official-exams.ts 33 34    # 複数回指定
 *   npx tsx scripts/download-official-exams.ts --dry-run
 *
 * 出力先: docs/exams/{round}/
 */

import { mkdir, writeFile, access, stat } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import { EXAM_SOURCES, getLocalPaths } from '../src/data/examSources'

const PROJECT_ROOT = path.resolve(__dirname, '..')

type DownloadResult = {
  status: 'downloaded' | 'skipped' | 'error'
  bytes?: number
  error?: string
}

async function fileExists(fp: string): Promise<boolean> {
  try {
    await access(fp, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function getFileSize(fp: string): Promise<number> {
  try {
    const s = await stat(fp)
    return s.size
  } catch {
    return 0
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0B'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function downloadFile(
  url: string,
  destPath: string,
  label: string,
  dryRun: boolean,
): Promise<DownloadResult> {
  if (await fileExists(destPath)) {
    const size = await getFileSize(destPath)
    console.log(`  ⏭  SKIP  ${label} (${formatBytes(size)}, already exists)`)
    return { status: 'skipped', bytes: size }
  }

  if (dryRun) {
    console.log(`  🔍  DRY   ${label}`)
    console.log(`         ${url}`)
    return { status: 'skipped' }
  }

  try {
    console.log(`  ⬇  GET   ${label}`)
    console.log(`         ${url}`)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'shinkyuu-db-research/1.0 (educational, non-commercial)',
        'Accept': '*/*',
      },
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    const buf = Buffer.from(await res.arrayBuffer())
    await mkdir(path.dirname(destPath), { recursive: true })
    await writeFile(destPath, buf)
    console.log(`  ✓  DONE  ${label} (${formatBytes(buf.length)})`)
    return { status: 'downloaded', bytes: buf.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  ✗  FAIL  ${label}: ${msg}`)
    return { status: 'error', error: msg }
  }
}

async function downloadRound(round: number, dryRun: boolean): Promise<void> {
  const source = EXAM_SOURCES.find(s => s.round === round)
  if (!source) {
    console.error(`✗ 第${round}回: ソース定義なし`)
    return
  }

  const paths = getLocalPaths(round)
  console.log(`\n■ 第${round}回 (${source.year}年)`)

  const tasks = [
    {
      url:   source.amPdfUrl,
      dest:  path.join(PROJECT_ROOT, paths.amPdf),
      label: `AM問題PDF   mondai_${round}_harikyu_am.pdf`,
    },
    {
      url:   source.pmPdfUrl,
      dest:  path.join(PROJECT_ROOT, paths.pmPdf),
      label: `PM問題PDF   mondai_${round}_harikyu_pm.pdf`,
    },
    {
      url:   source.answerHtmlUrl,
      dest:  path.join(PROJECT_ROOT, paths.answer),
      label: `正答肢表HTML seito_${round}_hk.html`,
    },
  ]

  let downloadCount = 0
  for (const task of tasks) {
    const result = await downloadFile(task.url, task.dest, task.label, dryRun)
    if (result.status === 'downloaded') {
      downloadCount++
      // 連続リクエスト間に1秒待機
      await sleep(1000)
    }
  }

  const line = tasks.length
  const skipped = tasks.length - downloadCount
  if (!dryRun) {
    console.log(`  → 第${round}回: 新規取得${downloadCount}件 / スキップ${skipped}件`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const roundArgs = args
    .filter(a => !a.startsWith('--'))
    .map(Number)
    .filter(n => !isNaN(n) && n >= 29 && n <= 34)

  const targetRounds = roundArgs.length > 0
    ? roundArgs
    : EXAM_SOURCES.map(s => s.round)

  console.log('='.repeat(62))
  console.log('  はり師きゅう師 国家試験 PDF ダウンローダー')
  console.log('  出典: 公益財団法人東洋療法研修試験財団')
  console.log('  URL : https://ahaki.or.jp/exam/archives/')
  console.log('='.repeat(62))
  console.log(`対象: 第${targetRounds.join('・')}回`)
  console.log(`保存先: docs/exams/{回}/`)
  if (dryRun) console.log('⚠  DRY RUN モード（実際のダウンロードは行いません）')

  for (let i = 0; i < targetRounds.length; i++) {
    await downloadRound(targetRounds[i], dryRun)
    // 回と回の間に2秒待機（最後の回は不要）
    if (i < targetRounds.length - 1) await sleep(2000)
  }

  console.log('\n' + '='.repeat(62))
  console.log('完了。docs/exams/ を確認してください。')
  console.log('='.repeat(62))
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
