import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { parseThemesCSV, calcImportance } from '@/lib/csvParser'
import { subjects } from '@/lib/data'
import ImportanceBadge from '@/components/ImportanceBadge'

export const metadata: Metadata = {
  title: 'データ入力ガイド（管理用）',
  robots: 'noindex,nofollow',
}

const FIELDS = [
  { name: 'id', type: 'string', required: true, example: 'gen-ketsu', desc: '半角英数字とハイフン。テーマの一意識別子。変更不可。' },
  { name: 'name', type: 'string', required: true, example: '原穴', desc: 'テーマの正式名称（日本語）' },
  { name: 'subject', type: 'string', required: true, example: 'meridians-acupoints', desc: '科目ID。後述の科目ID一覧を参照。' },
  { name: 'examRounds', type: 'string', required: true, example: '29|30|31|32|33|34', desc: '出題された回を | で区切り。第29〜34回が対象（180問時代）。' },
  { name: 'officialLarge', type: 'string', required: false, example: '経穴', desc: '2020年版出題基準の大項目。公式PDFから転記。' },
  { name: 'officialMedium', type: 'string', required: false, example: '特定穴', desc: '出題基準の中項目。' },
  { name: 'officialSmall', type: 'string', required: false, example: '原穴', desc: '出題基準の小項目。' },
  { name: 'normalizedTheme', type: 'string', required: false, example: '特定穴', desc: '正規化テーマ名。近接概念をまとめる際に使用。' },
  { name: 'aliases', type: 'string', required: false, example: '十二原穴', desc: '別名・通称を | で区切り。検索に利用。' },
  { name: 'relatedThemes', type: 'string', required: false, example: 'geki-ketsu|bo-ketsu', desc: '関連テーマのIDを | で区切り。テーマ詳細ページでリンク表示される。' },
  { name: 'studyPoint', type: 'string', required: true, example: '各経脈の原穴12穴を完全暗記。…', desc: '学習ポイント。問題文・正解は含めない。自作の解説文。' },
  { name: 'blueprintVersion', type: "'2020'|'2026'", required: true, example: '2020', desc: '出題基準バージョン。第29〜34回は2020。第35回以降は2026。' },
  { name: 'questionCountMode', type: "'180'|'160'", required: true, example: '180', desc: '問題数体制。第29〜34回は180。第25〜28回は160。' },
  { name: 'sourceReliability', type: 'string', required: true, example: 'indexed_official', desc: '財団公式アーカイブ掲載=indexed_official / 直URL=direct_official / 正答表のみ=official_answer_only / 第三者=third_party_reference' },
  { name: 'sourceUrl', type: 'string', required: false, example: 'https://ahaki.or.jp/exam/archives/', desc: '元ソースのURL。公式PDF等のリンク。' },
]

const AUTO_CALC = [
  { name: 'importance', rule: '6回→S / 5回→A / 3〜4回→B / 1〜2回→C（examRoundsの件数から自動計算）' },
  { name: 'count', rule: 'examRoundsの要素数' },
  { name: 'latestRound', rule: 'examRoundsの最大値' },
  { name: 'examYears', rule: 'examRoundsの各値に1992を加算（第29回=2021年）' },
]

export default function ImportGuidePage() {
  // CSV を読み込んで検証
  const csvPath = path.join(process.cwd(), 'src', 'data', 'themes.csv')
  let parsedThemes: ReturnType<typeof parseThemesCSV> = []
  let csvError = ''
  let csvRaw = ''

  try {
    csvRaw = fs.readFileSync(csvPath, 'utf-8')
    parsedThemes = parseThemesCSV(csvRaw)
  } catch (e) {
    csvError = String(e)
  }

  const warnings: string[] = []
  for (const t of parsedThemes) {
    if (!t.id) warnings.push(`id が空の行があります`)
    if (!t.name) warnings.push(`name が空: ${t.id}`)
    if (!t.subject) warnings.push(`subject が空: ${t.id}`)
    if (t.examRounds.length === 0) warnings.push(`examRounds が空: ${t.id}`)
    if (!t.studyPoint) warnings.push(`studyPoint が空: ${t.id}`)
    const validSubjects = subjects.map(s => s.id)
    if (!validSubjects.includes(t.subject)) {
      warnings.push(`不明な subject "${t.subject}": ${t.id}`)
    }
  }

  const importanceDist = { S: 0, A: 0, B: 0, C: 0 }
  for (const t of parsedThemes) {
    importanceDist[t.importance]++
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <div>
        <Link href="/" className="text-sm text-gray-400 hover:text-green-600">← トップに戻る</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">データ入力ガイド</h1>
        <p className="text-sm text-gray-500 mt-1">
          このページは内部管理用です。CSVファイルの編集ルールとパース状況を確認できます。
        </p>
      </div>

      {/* Parse status */}
      <section className="rounded-2xl border p-5 space-y-3 bg-white">
        <h2 className="font-bold text-gray-800 text-lg">📊 CSV 読み込み状況</h2>
        <p className="text-sm text-gray-600">ファイル: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">src/data/themes.csv</code></p>

        {csvError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
            ❌ エラー: {csvError}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-3 rounded-xl">
            ✅ 正常に読み込みました — {parsedThemes.length}件のテーマ
          </div>
        )}

        {warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-xl space-y-1">
            <p className="font-semibold">⚠️ バリデーション警告 ({warnings.length}件)</p>
            {warnings.map((w, i) => <p key={i}>• {w}</p>)}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mt-2">
          {Object.entries(importanceDist).map(([imp, cnt]) => (
            <div key={imp} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-400">重要度{imp}</p>
              <p className="text-2xl font-bold text-gray-700">{cnt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="rounded-2xl border p-5 bg-white space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">🔄 データ更新ワークフロー</h2>
        <ol className="space-y-3 text-sm text-gray-700">
          {[
            ['src/data/themes.csv を編集', 'Excel・Google Sheets・VSCode等でCSVを編集。各列の入力ルールは下記参照。問題文・選択肢は絶対に入れない。'],
            ['/admin/import-guide を確認', 'このページを再ビルドしてCSVのパース状況・警告を確認。バリデーション警告がゼロになるまで修正する。'],
            ['parseThemesCSV() を呼び出す', 'src/lib/data.ts を更新するか、ページ内で直接parseThemesCSV()を使ってビルド時に読み込む方式を採用できる。'],
            ['npm run build でビルド確認', '型エラーがなくビルドが通ることを確認。静的ページとして生成される。'],
          ].map(([title, desc], i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <div>
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="text-gray-500 mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Auto-calculated fields */}
      <section className="rounded-2xl border p-5 bg-white space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">⚙️ 自動計算フィールド（CSVに書かない）</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium w-32">フィールド名</th>
                <th className="py-2 font-medium">計算ルール</th>
              </tr>
            </thead>
            <tbody>
              {AUTO_CALC.map(f => (
                <tr key={f.name} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-mono text-xs text-green-700">{f.name}</td>
                  <td className="py-2 text-gray-600">{f.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
          <p>重要度の自動計算例（直近6回=第29〜34回の場合）</p>
          <div className="flex gap-3 mt-1 flex-wrap">
            {([6,5,4,3,2,1] as number[]).map(n => (
              <span key={n} className="inline-flex items-center gap-1">
                {n}回出題→
                <ImportanceBadge importance={calcImportance(n)} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Field reference */}
      <section className="rounded-2xl border p-5 bg-white space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">📋 CSVフィールド一覧</h2>
        <p className="text-xs text-gray-400">区切り文字: カンマ(,) / 複数値フィールド内の区切り: パイプ(|)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="py-2 pr-3 font-medium">フィールド名</th>
                <th className="py-2 pr-3 font-medium">型</th>
                <th className="py-2 pr-3 font-medium">必須</th>
                <th className="py-2 pr-3 font-medium">例</th>
                <th className="py-2 font-medium">説明</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map(f => (
                <tr key={f.name} className="border-b border-gray-50 align-top">
                  <td className="py-2 pr-3 font-mono text-green-700 whitespace-nowrap">{f.name}</td>
                  <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">{f.type}</td>
                  <td className="py-2 pr-3">{f.required ? <span className="text-red-600 font-semibold">必須</span> : <span className="text-gray-300">任意</span>}</td>
                  <td className="py-2 pr-3 text-gray-600 max-w-[120px] truncate">{f.example}</td>
                  <td className="py-2 text-gray-500 leading-relaxed">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subject ID reference */}
      <section className="rounded-2xl border p-5 bg-white space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">📚 科目ID一覧</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subjects.map(s => (
            <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
              <code className="text-xs text-green-700 font-mono flex-shrink-0">{s.id}</code>
              <span className="text-sm text-gray-700">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Input rules */}
      <section className="rounded-2xl border border-red-100 p-5 bg-red-50 space-y-3">
        <h2 className="font-bold text-red-800 text-lg">⚠️ データ入力の禁止事項</h2>
        <ul className="text-sm text-red-700 space-y-2">
          {[
            '問題文・選択肢・正解番号は絶対に入力しない（著作権リスク）',
            '問題番号（例: 第34回 問78）をstudyPointに含めない',
            '正答を示唆するような文章を書かない',
            '第三者ミラーサイトのデータをsourceUrl に指定する場合はsourceReliability を third_party_reference にする',
            'id は一度設定したら変更しない（関連テーマのリンクが壊れる）',
          ].map((rule, i) => (
            <li key={i} className="flex gap-2">
              <span className="flex-shrink-0">❌</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CSV preview (first 5 lines) */}
      <section className="rounded-2xl border p-5 bg-white space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">👁 CSVプレビュー（先頭5件）</h2>
        {parsedThemes.slice(0, 5).map(t => (
          <div key={t.id} className="bg-gray-50 rounded-xl p-4 text-xs space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-green-700 font-mono">{t.id}</code>
              <span className="font-semibold text-gray-800">{t.name}</span>
              <ImportanceBadge importance={t.importance} />
              <span className="text-gray-400">{subjects.find(s => s.id === t.subject)?.shortName}</span>
            </div>
            <p className="text-gray-500">出題: {t.examRounds.map(r => `第${r}回`).join('・')} （{t.count}回）</p>
            <p className="text-gray-500 truncate">{t.officialLarge} › {t.officialMedium} › {t.officialSmall}</p>
            <p className="text-gray-600 line-clamp-2">{t.studyPoint}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
