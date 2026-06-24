import type { Metadata } from 'next'
import Link from 'next/link'
import {
  loadAllExamQuestions,
  aggregateBySubject,
  getRoundStatus,
  validateExamRound,
  EXAM_ROUNDS,
  QUESTIONS_PER_ROUND,
} from '@/lib/examQuestions'
import { subjects } from '@/lib/data'

export const metadata: Metadata = {
  title: 'データ入力進捗（管理用）',
  robots: 'noindex,nofollow',
}

// 問題番号リストを「問X〜Y, 問Z」形式の文字列に圧縮
function formatRanges(nums: number[], maxRanges = 4): string {
  if (nums.length === 0) return 'なし'
  const sorted = [...nums].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let end = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]
    } else {
      ranges.push(start === end ? `問${start}` : `問${start}〜${end}`)
      start = sorted[i]
      end = sorted[i]
    }
  }
  ranges.push(start === end ? `問${start}` : `問${start}〜${end}`)
  if (ranges.length > maxRanges) {
    return `${ranges.slice(0, maxRanges).join(', ')} …（計${nums.length}件）`
  }
  return ranges.join(', ')
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const color =
    pct === 0 ? 'bg-gray-200' : pct >= 100 ? 'bg-green-500' : 'bg-yellow-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">{pct}%</span>
    </div>
  )
}

export default function DataStatusPage() {
  const questions = loadAllExamQuestions()
  const roundStatuses = getRoundStatus(questions)
  const subjectAggs = aggregateBySubject(questions)

  const totalInput = questions.length
  const totalExpected = EXAM_ROUNDS.length * QUESTIONS_PER_ROUND
  const totalProgress = Math.min(100, Math.round((totalInput / totalExpected) * 100))

  const warnings: string[] = []
  for (const rs of roundStatuses) {
    if (rs.inputCount === 0) {
      warnings.push(`第${rs.round}回（${rs.year}年）: データ未入力`)
    } else if (rs.inputCount < rs.expected) {
      const missing = rs.expected - rs.inputCount
      warnings.push(`第${rs.round}回: ${missing}問不足（${rs.inputCount} / ${rs.expected}）`)
    }
  }

  const completedRounds = roundStatuses.filter(r => r.inputCount >= r.expected).length
  const v34 = validateExamRound(questions, 34)

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link href="/" className="text-sm text-gray-400 hover:text-green-600">
          ← トップに戻る
        </Link>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">データ入力進捗</h1>
          <Link
            href="/admin/import-guide"
            className="text-xs text-green-600 border border-green-200 px-3 py-1 rounded-full hover:bg-green-50 transition-colors"
          >
            テーマ入力ガイド
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          src/data/raw/ の設問CSV入力状況 — 第29〜34回 各{QUESTIONS_PER_ROUND}問 合計{totalExpected}問
        </p>
      </div>

      {/* 全体進捗 */}
      <section className="bg-white rounded-2xl border p-5 space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">全体進捗</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalProgress === 0 ? 'bg-gray-200' : totalProgress >= 100 ? 'bg-green-500' : 'bg-yellow-400'
              }`}
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <span className="text-lg font-bold text-gray-700 w-14 text-right flex-shrink-0">
            {totalProgress}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-400">入力済</p>
            <p className="text-2xl font-bold text-green-700">{totalInput.toLocaleString()}</p>
            <p className="text-xs text-gray-400">問</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-400">目標</p>
            <p className="text-2xl font-bold text-gray-500">{totalExpected.toLocaleString()}</p>
            <p className="text-xs text-gray-400">問</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-400">完了回数</p>
            <p className="text-2xl font-bold text-gray-700">{completedRounds}</p>
            <p className="text-xs text-gray-400">/ {EXAM_ROUNDS.length}回</p>
          </div>
        </div>
      </section>

      {/* 回別進捗 */}
      <section className="bg-white rounded-2xl border p-5 space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">回別入力進捗</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">回</th>
                <th className="py-2 pr-4 font-medium">年度</th>
                <th className="py-2 pr-4 font-medium text-right">入力済</th>
                <th className="py-2 pr-4 font-medium text-right">想定</th>
                <th className="py-2 pr-6 font-medium">進捗</th>
                <th className="py-2 pr-4 font-medium">状況</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {roundStatuses.map(rs => (
                <tr key={rs.round} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-gray-800">第{rs.round}回</td>
                  <td className="py-3 pr-4 text-gray-400">{rs.year}年</td>
                  <td className="py-3 pr-4 font-mono text-right text-gray-700">{rs.inputCount}</td>
                  <td className="py-3 pr-4 text-right text-gray-300">{rs.expected}</td>
                  <td className="py-3 pr-6">
                    <ProgressBar value={rs.inputCount} max={rs.expected} />
                  </td>
                  <td className="py-3 pr-4">
                    {rs.inputCount === 0 ? (
                      <span className="text-xs text-gray-300">未開始</span>
                    ) : rs.inputCount >= rs.expected ? (
                      <span className="text-xs text-green-600 font-semibold">✓ 完了</span>
                    ) : (
                      <span className="text-xs text-yellow-600">入力中</span>
                    )}
                  </td>
                  <td className="py-3">
                    {rs.round === 34 && (
                      <Link
                        href="/admin/data-entry-guide/exam-34"
                        className="text-xs text-green-600 border border-green-200 px-2.5 py-1 rounded-full hover:bg-green-50 transition-colors whitespace-nowrap"
                      >
                        入力ガイドを見る →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400">
          ※ 各回{QUESTIONS_PER_ROUND}問（2020年版出題基準 180問体制）
        </p>
      </section>

      {/* 第34回 詳細チェック */}
      <section className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-bold text-gray-800 text-lg">第34回 入力チェック</h2>
            {v34.isComplete ? (
              <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
                ✓ すべて OK
              </span>
            ) : v34.total === 0 ? (
              <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full">
                未入力
              </span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-3 py-1 rounded-full">
                ⚠️ 要確認
              </span>
            )}
          </div>
          <Link
            href="/admin/data-entry-guide/exam-34"
            className="text-xs text-green-600 border border-green-200 px-3 py-1 rounded-full hover:bg-green-50 transition-colors"
          >
            入力ガイドを見る →
          </Link>
        </div>

        <div className="divide-y divide-gray-50">
          {[
            {
              label: '入力数',
              detail: `${v34.total} / ${QUESTIONS_PER_ROUND}`,
              ok: v34.total === QUESTIONS_PER_ROUND,
              sub: v34.total < QUESTIONS_PER_ROUND
                ? `残り${QUESTIONS_PER_ROUND - v34.total}問`
                : null,
            },
            {
              label: '欠番',
              detail: v34.missingNumbers.length > 0
                ? `${v34.missingNumbers.length}件`
                : 'なし',
              ok: v34.missingNumbers.length === 0,
              sub: v34.missingNumbers.length > 0
                ? formatRanges(v34.missingNumbers)
                : null,
            },
            {
              label: '問題番号の重複',
              detail: v34.duplicateNumbers.length > 0
                ? `${v34.duplicateNumbers.length}件`
                : 'なし',
              ok: v34.duplicateNumbers.length === 0,
              sub: v34.duplicateNumbers.length > 0
                ? formatRanges(v34.duplicateNumbers)
                : null,
            },
            {
              label: '科目エラー',
              detail: v34.invalidSubjects.length > 0
                ? `${v34.invalidSubjects.length}件`
                : 'なし',
              ok: v34.invalidSubjects.length === 0,
              sub: v34.invalidSubjects.length > 0
                ? v34.invalidSubjects.slice(0, 3)
                    .map(e => `問${e.questionNumber}: "${e.subject}"`)
                    .join(', ')
                  + (v34.invalidSubjects.length > 3 ? ` …他${v34.invalidSubjects.length - 3}件` : '')
                : null,
            },
            {
              label: 'テーマ未入力（normalizedTheme）',
              detail: v34.emptyThemes.length > 0
                ? `${v34.emptyThemes.length}件`
                : 'なし',
              ok: v34.emptyThemes.length === 0,
              sub: v34.emptyThemes.length > 0
                ? formatRanges(v34.emptyThemes)
                : null,
            },
            {
              label: '学習ポイント未入力（studyPoint）',
              detail: v34.emptyStudyPoints.length > 0
                ? `${v34.emptyStudyPoints.length}件`
                : 'なし',
              ok: v34.emptyStudyPoints.length === 0,
              sub: v34.emptyStudyPoints.length > 0
                ? formatRanges(v34.emptyStudyPoints)
                : null,
            },
            {
              label: '出題基準バージョン（≠ 2020）',
              detail: v34.invalidBlueprintVersion.length > 0
                ? `${v34.invalidBlueprintVersion.length}件`
                : 'なし',
              ok: v34.invalidBlueprintVersion.length === 0,
              sub: v34.invalidBlueprintVersion.length > 0
                ? formatRanges(v34.invalidBlueprintVersion)
                : null,
            },
            {
              label: '問題数体制（≠ 180）',
              detail: v34.invalidQuestionCountMode.length > 0
                ? `${v34.invalidQuestionCountMode.length}件`
                : 'なし',
              ok: v34.invalidQuestionCountMode.length === 0,
              sub: v34.invalidQuestionCountMode.length > 0
                ? formatRanges(v34.invalidQuestionCountMode)
                : null,
            },
            {
              label: 'ソース信頼度（不正値）',
              detail: v34.invalidSourceReliability.length > 0
                ? `${v34.invalidSourceReliability.length}件`
                : 'なし',
              ok: v34.invalidSourceReliability.length === 0,
              sub: v34.invalidSourceReliability.length > 0
                ? formatRanges(v34.invalidSourceReliability)
                : null,
            },
          ].map(({ label, detail, ok, sub }) => (
            <div key={label} className="flex items-start justify-between py-2.5 gap-4">
              <span className="text-sm text-gray-600 flex-1">{label}</span>
              <div className="text-right flex-shrink-0">
                {ok ? (
                  <span className="text-xs text-green-600 font-medium">✓ {detail}</span>
                ) : (
                  <span className="text-xs text-red-500 font-medium">⚠️ {detail}</span>
                )}
                {sub && (
                  <p className="text-xs text-gray-400 mt-0.5 max-w-[220px] text-right leading-relaxed">
                    {sub}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {v34.total === 0 && (
          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
            exam-34.csv にデータを入力すると、ここにチェック結果が表示されます。
          </p>
        )}
      </section>

      {/* 科目別 */}
      {subjectAggs.length > 0 ? (
        <section className="bg-white rounded-2xl border p-5 space-y-3">
          <h2 className="font-bold text-gray-800 text-lg">科目別入力件数</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="py-2 pr-4 text-left font-medium">科目</th>
                  <th className="py-2 pr-3 text-right font-medium">合計</th>
                  {EXAM_ROUNDS.map(r => (
                    <th key={r} className="py-2 px-2 text-right font-medium">
                      第{r}回
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjectAggs.map(sa => {
                  const sub = subjects.find(s => s.id === sa.subject)
                  return (
                    <tr key={sa.subject} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-4 text-gray-700">
                        {sub?.shortName ?? sa.subject}
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold text-green-700">
                        {sa.count}
                      </td>
                      {EXAM_ROUNDS.map(r => (
                        <td key={r} className="py-2 px-2 text-right text-gray-400">
                          {sa.byRound[r] ?? 0}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6 text-center">
          <p className="text-gray-400 text-sm">科目別データなし（設問CSVを入力後に表示されます）</p>
        </section>
      )}

      {/* 警告 */}
      {warnings.length > 0 && (
        <section className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 space-y-2">
          <h2 className="font-bold text-yellow-800 text-lg">
            ⚠️ 警告（{warnings.length}件）
          </h2>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-yellow-700">
                • {w}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 入力方法ガイド */}
      <section className="bg-white rounded-2xl border p-5 space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">📁 CSV入力ファイルの場所</h2>
        <div className="space-y-2">
          {EXAM_ROUNDS.map(r => {
            const rs = roundStatuses.find(s => s.round === r)!
            return (
              <div
                key={r}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5"
              >
                <code className="text-xs text-green-700 font-mono">
                  src/data/raw/exam-{r}.csv
                </code>
                <span className="text-xs text-gray-400">
                  {rs.inputCount}/{rs.expected}問
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          各ファイルをVSCode / Excel / Google Sheetsで編集してください。
          <br />
          編集後は <code className="bg-gray-100 px-1 rounded">npm run build</code> を実行してページに反映されます。
        </p>
      </section>

      {/* データ切り替えガイド */}
      <section className="bg-gray-50 rounded-2xl border p-5 space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">🔄 テーマ・科目ページへの切り替え方法</h2>
        <p className="text-sm text-gray-500">
          入力完了後、raw設問CSVを使ったデータに切り替えるには以下の手順で行います。
        </p>
        <ol className="space-y-3 text-sm">
          {[
            {
              title: 'サーバーコンポーネントを更新',
              code: "import { loadAllExamQuestions, aggregateToThemes } from '@/lib/examQuestions'\nconst themes = aggregateToThemes(loadAllExamQuestions())",
              desc: '/subjects/[subjectId] や /themes/[themeId] のページで importを切り替える',
            },
            {
              title: '/themes/page.tsx をリファクタリング',
              code: null,
              desc: "現在クライアントコンポーネントのため、サーバー側でデータ取得 → クライアント側でフィルタリングUIに分離する必要あり",
            },
            {
              title: 'ビルド確認',
              code: 'npm run build',
              desc: '全ページが正常に生成されることを確認',
            },
          ].map(({ title, code, desc }, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-800">{title}</p>
                {code && (
                  <pre className="bg-white border border-gray-100 rounded-lg p-2.5 text-xs text-gray-600 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                    {code}
                  </pre>
                )}
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
