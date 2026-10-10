import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ACUPOINTS, acupointLabel } from '@/data/acupoints'
import { getAcupointStat, TOTAL_EXAM_ROUNDS } from '@/lib/acupoints'
import { describeAcupointSources, type SourceTone } from '@/lib/acupointSources'
import { questionsForAcupoint } from '@/lib/quiz'
import { roundToYear } from '@/lib/utils'

export function generateStaticParams() {
  return ACUPOINTS.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const a = getAcupointStat(slug)
  if (!a) return { title: '経穴が見つかりません' }
  return {
    title: a.name ? `${a.name}（${a.code}）｜${a.meridianName}の経穴｜国家試験対策` : `${a.code}｜${a.meridianName}の経穴｜国家試験対策`,
    description: [
      a.name ? `${a.name}（${a.code}）は${a.meridianName}の経穴。` : `${a.code}は${a.meridianName}の経穴（WHO標準経穴）。`,
      a.specialPoints?.length ? `${a.specialPoints.join('・')}。` : '',
      a.location ? `位置：${a.location}。` : '',
      '第29〜34回の国家試験での出題状況。',
    ].join(''),
  }
}

/** 根拠の種類。色だけに頼らず、文字でも区別する */
const TONE: Record<SourceTone, { label: string; cls: string }> = {
  jp: { label: '日本の資料', cls: 'bg-green-50 text-green-700' },
  intl: { label: 'WHO', cls: 'bg-blue-50 text-blue-700' },
  conflict: { label: '要確認', cls: 'bg-amber-50 text-amber-700' },
  pending: { label: '未確認', cls: 'bg-gray-100 text-gray-500' },
}

const IMP_LABEL: Record<string, string> = { S: '最重要', A: '重要', B: '標準', C: '参考' }
const IMP_COLOR: Record<string, string> = {
  S: 'bg-red-50 text-red-700 border-red-200',
  A: 'bg-orange-50 text-orange-700 border-orange-200',
  B: 'bg-blue-50 text-blue-700 border-blue-200',
  C: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default async function AcupointDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const a = getAcupointStat(slug)
  if (!a) notFound()

  const related = questionsForAcupoint(slug)
  const sources = describeAcupointSources(a)
  const askedRounds = new Set(a.examRounds)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: a.name ? `${a.name}（${a.code}）` : a.code,
    description: [
      `${a.meridianName}の経穴。`,
      a.specialPoints?.length ? `${a.specialPoints.join('・')}。` : '',
      a.location ? `位置：${a.location}` : '',
    ].join(''),
    inDefinedTermSet: '経絡経穴概論',
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/" className="hover:text-green-600">ホーム</Link>
        <span className="mx-1">/</span>
        <Link href="/acupoints" className="hover:text-green-600">経穴</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">{acupointLabel(a)}</span>
      </nav>

      {/* 見出し */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{acupointLabel(a)}</h1>
          {a.name && (
            <p className="mt-0.5 text-sm text-gray-500">{a.reading ? `${a.reading}・${a.code}` : a.code}</p>
          )}
        </div>
        {a.importance && (
          <span className={`mt-1 rounded-full border px-2.5 py-1 text-xs font-bold ${IMP_COLOR[a.importance]}`}>
            {IMP_LABEL[a.importance]}（{a.importance}）
          </span>
        )}
      </div>

      {/* 基本情報 */}
      <dl className="mt-4 space-y-2.5 rounded-2xl border border-gray-100 bg-white p-4 text-sm">
        <div className="flex gap-3">
          <dt className="w-20 flex-shrink-0 font-bold text-gray-500">所属経脈</dt>
          <dd className="text-gray-900">{a.meridianName}</dd>
        </div>
        {a.region && (
          <div className="flex gap-3">
            <dt className="w-20 flex-shrink-0 font-bold text-gray-500">部位</dt>
            <dd className="text-gray-900">{a.region}</dd>
          </div>
        )}
        {a.specialPoints && (
        <div className="flex gap-3">
          <dt className="w-20 flex-shrink-0 font-bold text-gray-500">特定穴</dt>
          <dd className="text-gray-900">
            {a.specialPoints.length ? (
              <span className="flex flex-wrap gap-1.5">
                {a.specialPoints.map((sp) => (
                  <span key={sp} className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-700">{sp}</span>
                ))}
              </span>
            ) : (
              '—'
            )}
          </dd>
        </div>
        )}
        {a.location && (
          <div className="flex gap-3">
            <dt className="w-20 flex-shrink-0 font-bold text-gray-500">位置</dt>
            <dd className="leading-relaxed text-gray-900">{a.location}</dd>
          </div>
        )}
      </dl>
      {a.location ? (
        <p className="mt-1.5 text-xs text-gray-400">※ 位置は要点のみ。正確な取穴は教科書『経絡経穴概論』で確認してください。</p>
      ) : (
        <p className="mt-1.5 text-xs text-gray-400">※ {a.name ? '位置' : '日本語名・位置'}などの詳細情報は準備中です。</p>
      )}

      {/* 情報の根拠（項目ごとに分ける。WHO と日本の資料を混同しない） */}
      {sources.lines.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-gray-700">情報の根拠</h2>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm">
            <dl className="space-y-2.5">
              {sources.lines.map((l) => (
                <div key={l.field} className="flex gap-3">
                  <dt className="w-10 flex-shrink-0 font-bold text-gray-500">{l.label}</dt>
                  <dd className="min-w-0">
                    <span className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-bold ${TONE[l.tone].cls}`}>{TONE[l.tone].label}</span>
                    <span className="text-gray-800">{l.verdict}</span>
                    {l.note && <p className="mt-0.5 text-xs text-gray-500">{l.note}</p>}
                  </dd>
                </div>
              ))}
            </dl>
            {sources.records.length > 0 && (
              <details className="mt-3 border-t border-gray-100 pt-3">
                <summary className="cursor-pointer text-xs font-bold text-green-700">出典の詳細（{sources.records.length}件）</summary>
                <ul className="mt-2 space-y-2">
                  {sources.records.map((r, i) => (
                    <li key={i} className="break-words text-xs leading-relaxed text-gray-600">
                      <span className="font-bold text-gray-700">{r.fieldLabel}</span>
                      <span className="mx-1 text-gray-300">|</span>
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">{r.source}</a>
                      ) : (
                        r.source
                      )}
                      <span className="ml-1 text-gray-400">{r.page}</span>
                      <span className="ml-1">— {r.status}</span>
                      {r.sourceText && <span className="ml-1 text-gray-500">（資料の表記：{r.sourceText}）</span>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            「日本の資料」は公式過去問・国家試験出題基準で直接確かめたものです。WHO の位置と一致していても、日本の教科書で照合するまでは日本基準で確認済みとは扱っていません。
          </p>
        </section>
      )}

      {/* 過去6年の出題状況 */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold text-gray-700">過去6年の出題状況</h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex gap-1.5">
            {[29, 30, 31, 32, 33, 34].map((r) => {
              const hit = askedRounds.has(r)
              return (
                <div key={r} className="flex-1 text-center">
                  <div
                    className={`mx-auto flex h-9 w-full items-center justify-center rounded-lg text-xs font-bold ${
                      hit ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {hit ? '○' : '—'}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">第{r}回</p>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            出題：<strong className="text-gray-800">{a.examRounds.length}年度（{TOTAL_EXAM_ROUNDS}回中）・{a.questionCount}問</strong>
          </p>
          {a.questions.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {a.questions.map((q) => (
                <li key={q.questionId}>
                  <Link
                    href={`/past-exams/${q.examRound}`}
                    className="inline-block rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:border-green-400"
                  >
                    第{q.examRound}回 問{q.questionNumber}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {a.distractorQuestions.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              選択肢として登場（誤答肢のみ）：{a.distractorQuestions.length}問
              <span className="ml-1 text-gray-400">
                {a.distractorQuestions.map((q) => `第${q.examRound}回 問${q.questionNumber}`).join('・')}
              </span>
            </p>
          )}
          <p className="mt-2 text-[11px] text-gray-400">
            公式の過去問（問題文・選択肢・正答）をもとに、この経穴の知識が正答に必要な設問を1問ずつ判定して集計しています。名前が書かれていなくても部位や要穴分類から特定が必要な設問を含み、誤答の選択肢として登場しただけの設問は含みません。
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            第29〜34回＝{roundToYear(29)}〜{roundToYear(34)}年実施
          </p>
        </div>
      </section>

      {/* 何を問われやすいか */}
      {a.examPoint && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-gray-700">何を問われやすいか</h2>
          <p className="rounded-2xl border border-gray-100 bg-white p-4 text-sm leading-relaxed text-gray-700">
            {a.examPoint}
          </p>
        </section>
      )}

      {/* 覚え方 */}
      {a.memoryTip && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-gray-700">覚え方</h2>
          <p className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-relaxed text-gray-800">
            {a.memoryTip}
          </p>
        </section>
      )}

      {/* この経穴のクイズを解く */}
      <Link
        href="/quiz/acupoints"
        className="mt-6 block rounded-xl bg-green-600 px-5 py-4 text-center text-base font-bold text-white hover:bg-green-700"
      >
        経穴クイズを解く（10問）
      </Link>

      {related.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-gray-700">この経穴に関連する問題</h2>
          <ul className="space-y-2">
            {related.map((q) => (
              <li key={q.id} className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700">
                {q.question}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-400">これらは学習用オリジナル問題です。「経穴クイズ」からランダムに出ます。</p>
        </section>
      )}

      <div className="mt-8 flex gap-3 text-sm">
        <Link href="/acupoints" className="text-green-600 hover:underline">← 経穴一覧へ</Link>
        <Link href="/acupoints/unasked" className="text-green-600 hover:underline">未出題の経穴</Link>
      </div>
    </main>
  )
}
